// Web Vitals monitoring and performance utilities

export interface PerformanceMetrics {
  FCP?: number // First Contentful Paint
  LCP?: number // Largest Contentful Paint
  FID?: number // First Input Delay
  CLS?: number // Cumulative Layout Shift
  TTFB?: number // Time to First Byte
  TTI?: number // Time to Interactive
}

class PerformanceMonitor {
  private metrics: PerformanceMetrics = {}
  private observers: Map<string, PerformanceObserver> = new Map()

  constructor() {
    if (typeof window !== 'undefined' && 'PerformanceObserver' in window) {
      this.initializeObservers()
    }
  }

  private initializeObservers() {
    // First Contentful Paint
    this.observePaintTiming()
    
    // Largest Contentful Paint
    this.observeLCP()
    
    // First Input Delay
    this.observeFID()
    
    // Cumulative Layout Shift
    this.observeCLS()
    
    // Time to First Byte
    this.observeTTFB()
  }

  private observePaintTiming() {
    try {
      const observer = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          if (entry.name === 'first-contentful-paint') {
            this.metrics.FCP = Math.round(entry.startTime)
            this.logMetric('FCP', this.metrics.FCP)
          }
        }
      })
      observer.observe({ entryTypes: ['paint'] })
      this.observers.set('paint', observer)
    } catch (e) {
      console.error('Failed to observe paint timing:', e)
    }
  }

  private observeLCP() {
    try {
      const observer = new PerformanceObserver((list) => {
        const entries = list.getEntries()
        const lastEntry = entries[entries.length - 1]
        this.metrics.LCP = Math.round(lastEntry.startTime)
        this.logMetric('LCP', this.metrics.LCP)
      })
      observer.observe({ entryTypes: ['largest-contentful-paint'] })
      this.observers.set('lcp', observer)
    } catch (e) {
      console.error('Failed to observe LCP:', e)
    }
  }

  private observeFID() {
    try {
      const observer = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          const fidEntry = entry as any
          if (fidEntry.processingStart) {
            this.metrics.FID = Math.round(fidEntry.processingStart - fidEntry.startTime)
            this.logMetric('FID', this.metrics.FID)
          }
        }
      })
      observer.observe({ entryTypes: ['first-input'] })
      this.observers.set('fid', observer)
    } catch (e) {
      console.error('Failed to observe FID:', e)
    }
  }

  private observeCLS() {
    let clsValue = 0
    let clsEntries: PerformanceEntry[] = []

    const sessionValue = 0
    const sessionEntries: PerformanceEntry[] = []

    try {
      const observer = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          const layoutShift = entry as any
          if (!layoutShift.hadRecentInput) {
            const firstSessionEntry = sessionEntries[0]
            const lastSessionEntry = sessionEntries[sessionEntries.length - 1]

            if (sessionValue &&
                layoutShift.startTime - lastSessionEntry.startTime < 1000 &&
                layoutShift.startTime - firstSessionEntry.startTime < 5000) {
              clsValue += layoutShift.value
              sessionEntries.push(entry)
            } else {
              clsValue = layoutShift.value
              clsEntries = [entry]
            }
          }
        }
        
        this.metrics.CLS = Math.round(clsValue * 1000) / 1000
        this.logMetric('CLS', this.metrics.CLS)
      })
      observer.observe({ entryTypes: ['layout-shift'] })
      this.observers.set('cls', observer)
    } catch (e) {
      console.error('Failed to observe CLS:', e)
    }
  }

  private observeTTFB() {
    try {
      const observer = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          if (entry.entryType === 'navigation') {
            const navEntry = entry as PerformanceNavigationTiming
            this.metrics.TTFB = Math.round(navEntry.responseStart - navEntry.fetchStart)
            this.logMetric('TTFB', this.metrics.TTFB)
          }
        }
      })
      observer.observe({ entryTypes: ['navigation'] })
      this.observers.set('navigation', observer)
    } catch (e) {
      console.error('Failed to observe TTFB:', e)
    }
  }

  private logMetric(name: string, value: number) {
    // Log to console in development
    if (process.env.NODE_ENV === 'development') {
      console.log(`[Performance] ${name}: ${value}ms`)
    }

    // Send to analytics if available
    if (typeof window !== 'undefined' && (window as any).gtag) {
      (window as any).gtag('event', 'web_vitals', {
        event_category: 'Performance',
        event_label: name,
        value: Math.round(value),
        non_interaction: true,
      })
    }
  }

  public getMetrics(): PerformanceMetrics {
    return { ...this.metrics }
  }

  public destroy() {
    this.observers.forEach(observer => observer.disconnect())
    this.observers.clear()
  }
}

// Singleton instance
let performanceMonitor: PerformanceMonitor | null = null

export function initPerformanceMonitoring() {
  if (!performanceMonitor && typeof window !== 'undefined') {
    performanceMonitor = new PerformanceMonitor()
  }
  return performanceMonitor
}

export function getPerformanceMetrics(): PerformanceMetrics {
  return performanceMonitor?.getMetrics() || {}
}

// Utility to measure component render time
export function measureComponentPerformance(componentName: string) {
  const startMark = `${componentName}-start`
  const endMark = `${componentName}-end`
  const measureName = `${componentName}-render`

  return {
    start: () => performance.mark(startMark),
    end: () => {
      performance.mark(endMark)
      performance.measure(measureName, startMark, endMark)
      
      const measure = performance.getEntriesByName(measureName)[0]
      if (measure && process.env.NODE_ENV === 'development') {
        console.log(`[Performance] ${componentName} rendered in ${measure.duration.toFixed(2)}ms`)
      }
      
      // Clean up
      performance.clearMarks(startMark)
      performance.clearMarks(endMark)
      performance.clearMeasures(measureName)
      
      return measure?.duration
    }
  }
}

// Resource timing helper
export function getResourceTimings() {
  const resources = performance.getEntriesByType('resource')
  
  return resources.map(resource => {
    const timing = resource as PerformanceResourceTiming
    return {
      name: timing.name,
      duration: timing.duration,
      size: timing.transferSize,
      type: timing.initiatorType,
      cached: timing.transferSize === 0 && timing.duration > 0,
    }
  })
}

// Bundle size tracking
export function trackBundleSize() {
  if (typeof window === 'undefined') return

  window.addEventListener('load', () => {
    const resources = getResourceTimings()
    const jsResources = resources.filter(r => r.name.endsWith('.js'))
    const cssResources = resources.filter(r => r.name.endsWith('.css'))
    
    const totalJsSize = jsResources.reduce((sum, r) => sum + (r.size || 0), 0)
    const totalCssSize = cssResources.reduce((sum, r) => sum + (r.size || 0), 0)
    
    if (process.env.NODE_ENV === 'development') {
      console.log('[Performance] Bundle sizes:')
      console.log(`  JS: ${(totalJsSize / 1024).toFixed(2)}KB`)
      console.log(`  CSS: ${(totalCssSize / 1024).toFixed(2)}KB`)
      console.log(`  Total: ${((totalJsSize + totalCssSize) / 1024).toFixed(2)}KB`)
    }
  })
}