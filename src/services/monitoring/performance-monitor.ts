import { logger } from './logger';
import { analytics } from './analytics';

interface PerformanceMetric {
  name: string;
  value: number;
  unit: string;
  timestamp: string;
  metadata?: Record<string, any>;
}

interface VitalThresholds {
  FCP: { good: number; needsImprovement: number };
  LCP: { good: number; needsImprovement: number };
  FID: { good: number; needsImprovement: number };
  CLS: { good: number; needsImprovement: number };
  TTFB: { good: number; needsImprovement: number };
  INP: { good: number; needsImprovement: number };
}

class PerformanceMonitor {
  private metrics: PerformanceMetric[] = [];
  private observers: Map<string, PerformanceObserver> = new Map();
  private navigationStart: number = 0;
  private resourceTimingBuffer: PerformanceResourceTiming[] = [];
  
  private readonly vitalThresholds: VitalThresholds = {
    FCP: { good: 1800, needsImprovement: 3000 },
    LCP: { good: 2500, needsImprovement: 4000 },
    FID: { good: 100, needsImprovement: 300 },
    CLS: { good: 0.1, needsImprovement: 0.25 },
    TTFB: { good: 800, needsImprovement: 1800 },
    INP: { good: 200, needsImprovement: 500 },
  };

  constructor() {
    if (typeof window !== 'undefined' && 'performance' in window) {
      this.initialize();
    }
  }

  private initialize() {
    this.navigationStart = performance.timing.navigationStart;
    this.observeWebVitals();
    this.observeResources();
    this.observeLongTasks();
    this.observeLayoutShifts();
    this.setupNavigationTiming();
    this.setupMemoryMonitoring();
  }

  // Observe Core Web Vitals
  private observeWebVitals() {
    // First Contentful Paint (FCP)
    this.createObserver('paint', (entries) => {
      entries.forEach(entry => {
        if (entry.name === 'first-contentful-paint') {
          this.recordMetric('FCP', entry.startTime, 'ms', {
            rating: this.getRating('FCP', entry.startTime),
          });
        }
      });
    });

    // Largest Contentful Paint (LCP)
    this.createObserver('largest-contentful-paint', (entries) => {
      const lastEntry = entries[entries.length - 1];
      this.recordMetric('LCP', lastEntry.startTime, 'ms', {
        element: (lastEntry as any).element?.tagName,
        size: lastEntry.size,
        rating: this.getRating('LCP', lastEntry.startTime),
      });
    });

    // First Input Delay (FID)
    this.createObserver('first-input', (entries) => {
      entries.forEach(entry => {
        const fid = entry.processingStart - entry.startTime;
        this.recordMetric('FID', fid, 'ms', {
          eventType: entry.name,
          rating: this.getRating('FID', fid),
        });
      });
    });

    // Cumulative Layout Shift (CLS)
    let clsValue = 0;
    let clsEntries: PerformanceEntry[] = [];
    
    this.createObserver('layout-shift', (entries) => {
      entries.forEach(entry => {
        if (!(entry as any).hadRecentInput) {
          clsValue += (entry as any).value;
          clsEntries.push(entry);
        }
      });
      
      this.recordMetric('CLS', clsValue, 'score', {
        shifts: clsEntries.length,
        rating: this.getRating('CLS', clsValue),
      });
    });

    // Interaction to Next Paint (INP)
    let inpValue = 0;
    this.createObserver('event', (entries) => {
      entries.forEach(entry => {
        if (entry.duration > inpValue) {
          inpValue = entry.duration;
          this.recordMetric('INP', inpValue, 'ms', {
            eventType: entry.name,
            rating: this.getRating('INP', inpValue),
          });
        }
      });
    });
  }

  // Observe resource loading
  private observeResources() {
    this.createObserver('resource', (entries) => {
      entries.forEach(entry => {
        const resourceEntry = entry as PerformanceResourceTiming;
        this.resourceTimingBuffer.push(resourceEntry);

        // Track slow resources
        if (resourceEntry.duration > 1000) {
          this.recordMetric('slow-resource', resourceEntry.duration, 'ms', {
            name: resourceEntry.name,
            type: resourceEntry.initiatorType,
            size: resourceEntry.transferSize,
          });
        }
      });

      // Analyze resource metrics
      this.analyzeResourceMetrics();
    });
  }

  // Observe long tasks
  private observeLongTasks() {
    if (!('PerformanceObserver' in window)) return;

    try {
      this.createObserver('longtask', (entries) => {
        entries.forEach(entry => {
          this.recordMetric('long-task', entry.duration, 'ms', {
            startTime: entry.startTime,
            attribution: (entry as any).attribution,
          });

          // Log warning for very long tasks
          if (entry.duration > 100) {
            logger.warn('Long task detected', {
              duration: entry.duration,
              startTime: entry.startTime,
            });
          }
        });
      });
    } catch (e) {
      // Long task observer might not be supported
    }
  }

  // Observe layout shifts
  private observeLayoutShifts() {
    this.createObserver('layout-shift', (entries) => {
      entries.forEach(entry => {
        const shift = entry as any;
        if (shift.hadRecentInput) return;

        if (shift.value > 0.05) {
          logger.warn('Large layout shift detected', {
            value: shift.value,
            sources: shift.sources?.map((s: any) => ({
              node: s.node?.tagName,
              previousRect: s.previousRect,
              currentRect: s.currentRect,
            })),
          });
        }
      });
    });
  }

  // Setup navigation timing
  private setupNavigationTiming() {
    if ('navigation' in performance && performance.navigation.type === 2) {
      return; // Skip for back/forward navigation
    }

    window.addEventListener('load', () => {
      setTimeout(() => {
        const timing = performance.timing;
        const navigation = performance.navigation;

        // Time to First Byte (TTFB)
        const ttfb = timing.responseStart - timing.navigationStart;
        this.recordMetric('TTFB', ttfb, 'ms', {
          rating: this.getRating('TTFB', ttfb),
        });

        // Other navigation metrics
        this.recordMetric('dns-lookup', timing.domainLookupEnd - timing.domainLookupStart, 'ms');
        this.recordMetric('tcp-connect', timing.connectEnd - timing.connectStart, 'ms');
        this.recordMetric('request-time', timing.responseStart - timing.requestStart, 'ms');
        this.recordMetric('response-time', timing.responseEnd - timing.responseStart, 'ms');
        this.recordMetric('dom-processing', timing.domComplete - timing.domLoading, 'ms');
        this.recordMetric('dom-content-loaded', timing.domContentLoadedEventEnd - timing.navigationStart, 'ms');
        this.recordMetric('load-complete', timing.loadEventEnd - timing.navigationStart, 'ms');

        // Navigation type
        const navType = ['navigate', 'reload', 'back_forward', 'prerender'][navigation.type] || 'unknown';
        analytics.track('navigation_timing', {
          navigationType: navType,
          redirectCount: navigation.redirectCount,
        });
      }, 0);
    });
  }

  // Setup memory monitoring
  private setupMemoryMonitoring() {
    if (!('memory' in performance)) return;

    setInterval(() => {
      const memory = (performance as any).memory;
      const usedMemoryMB = memory.usedJSHeapSize / 1048576;
      const totalMemoryMB = memory.totalJSHeapSize / 1048576;
      const limitMemoryMB = memory.jsHeapSizeLimit / 1048576;

      this.recordMetric('memory-used', usedMemoryMB, 'MB', {
        percentage: (usedMemoryMB / limitMemoryMB) * 100,
      });

      // Warn on high memory usage
      if (usedMemoryMB / limitMemoryMB > 0.9) {
        logger.warn('High memory usage detected', {
          used: usedMemoryMB,
          limit: limitMemoryMB,
          percentage: (usedMemoryMB / limitMemoryMB) * 100,
        });
      }

      // Check for memory leaks
      this.checkMemoryLeaks(usedMemoryMB);
    }, 30000); // Check every 30 seconds
  }

  // Check for memory leaks
  private memoryHistory: number[] = [];
  private checkMemoryLeaks(currentMemory: number) {
    this.memoryHistory.push(currentMemory);
    
    if (this.memoryHistory.length > 10) {
      this.memoryHistory.shift();
      
      // Check if memory is consistently increasing
      const isIncreasing = this.memoryHistory.every((mem, i) => 
        i === 0 || mem >= this.memoryHistory[i - 1]
      );
      
      if (isIncreasing) {
        const increase = this.memoryHistory[9] - this.memoryHistory[0];
        if (increase > 50) { // 50MB increase
          logger.error('Potential memory leak detected', {
            initialMemory: this.memoryHistory[0],
            currentMemory: this.memoryHistory[9],
            increase,
          });
        }
      }
    }
  }

  // Analyze resource metrics
  private analyzeResourceMetrics() {
    const resources = this.resourceTimingBuffer;
    if (resources.length === 0) return;

    // Group by type
    const byType = resources.reduce((acc, resource) => {
      const type = resource.initiatorType || 'other';
      if (!acc[type]) {
        acc[type] = { count: 0, totalSize: 0, totalDuration: 0 };
      }
      acc[type].count++;
      acc[type].totalSize += resource.transferSize || 0;
      acc[type].totalDuration += resource.duration;
      return acc;
    }, {} as Record<string, { count: number; totalSize: number; totalDuration: number }>);

    // Record aggregated metrics
    Object.entries(byType).forEach(([type, stats]) => {
      this.recordMetric(`resources-${type}`, stats.count, 'count', {
        totalSize: stats.totalSize,
        avgDuration: stats.totalDuration / stats.count,
      });
    });

    // Clear buffer to prevent memory issues
    this.resourceTimingBuffer = [];
  }

  // Create performance observer
  private createObserver(
    type: string,
    callback: (entries: PerformanceEntryList) => void
  ) {
    if (!('PerformanceObserver' in window)) return;

    try {
      const observer = new PerformanceObserver((list) => {
        callback(list.getEntries());
      });
      
      observer.observe({ entryTypes: [type] });
      this.observers.set(type, observer);
    } catch (e) {
      // Observer type might not be supported
      logger.debug(`Performance observer for ${type} not supported`);
    }
  }

  // Record metric
  private recordMetric(
    name: string,
    value: number,
    unit: string,
    metadata?: Record<string, any>
  ) {
    const metric: PerformanceMetric = {
      name,
      value,
      unit,
      timestamp: new Date().toISOString(),
      metadata,
    };

    this.metrics.push(metric);
    
    // Log to analytics
    analytics.timing('performance', name, Math.round(value), unit);
    
    // Log performance metrics
    logger.performance(name, value, metadata);
  }

  // Get rating for web vital
  private getRating(
    vital: keyof VitalThresholds,
    value: number
  ): 'good' | 'needs-improvement' | 'poor' {
    const thresholds = this.vitalThresholds[vital];
    
    if (value <= thresholds.good) return 'good';
    if (value <= thresholds.needsImprovement) return 'needs-improvement';
    return 'poor';
  }

  // Public API
  getMetrics(): PerformanceMetric[] {
    return [...this.metrics];
  }

  getWebVitals() {
    const vitals = ['FCP', 'LCP', 'FID', 'CLS', 'TTFB', 'INP'];
    return this.metrics
      .filter(m => vitals.includes(m.name))
      .reduce((acc, metric) => {
        acc[metric.name] = {
          value: metric.value,
          rating: metric.metadata?.rating || 'unknown',
        };
        return acc;
      }, {} as Record<string, { value: number; rating: string }>);
  }

  markStart(name: string) {
    performance.mark(`${name}-start`);
  }

  markEnd(name: string) {
    const startMark = `${name}-start`;
    const endMark = `${name}-end`;
    
    performance.mark(endMark);
    performance.measure(name, startMark, endMark);
    
    const measure = performance.getEntriesByName(name, 'measure')[0];
    if (measure) {
      this.recordMetric(name, measure.duration, 'ms');
    }
    
    // Cleanup
    performance.clearMarks(startMark);
    performance.clearMarks(endMark);
    performance.clearMeasures(name);
  }

  // Cleanup
  destroy() {
    this.observers.forEach(observer => observer.disconnect());
    this.observers.clear();
  }
}

// Export singleton instance
export const performanceMonitor = new PerformanceMonitor();

// Export types
export type { PerformanceMetric, VitalThresholds };