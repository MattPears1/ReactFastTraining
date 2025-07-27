/**
 * Performance monitoring service for authentication operations
 * Tracks metrics, identifies bottlenecks, and provides insights
 */
class PerformanceMonitor {
  private static instance: PerformanceMonitor;
  private metrics: Map<string, number[]> = new Map();
  private readonly MAX_SAMPLES = 100;
  private readonly REPORTING_INTERVAL = 60000; // 1 minute
  private reportingTimer: NodeJS.Timeout | null = null;

  private constructor() {
    this.startReporting();
    this.setupWebVitals();
  }

  static getInstance(): PerformanceMonitor {
    if (!PerformanceMonitor.instance) {
      PerformanceMonitor.instance = new PerformanceMonitor();
    }
    return PerformanceMonitor.instance;
  }

  /**
   * Track a performance metric
   */
  track(operation: string, duration: number): void {
    if (!this.metrics.has(operation)) {
      this.metrics.set(operation, []);
    }

    const samples = this.metrics.get(operation)!;
    samples.push(duration);

    // Keep only recent samples
    if (samples.length > this.MAX_SAMPLES) {
      samples.shift();
    }

    // Log slow operations
    if (duration > this.getSlowThreshold(operation)) {
      console.warn(`Slow ${operation}: ${duration}ms`);
      this.reportSlowOperation(operation, duration);
    }
  }

  /**
   * Start a performance measurement
   */
  startMeasure(operation: string): () => void {
    const startTime = performance.now();
    
    return () => {
      const duration = performance.now() - startTime;
      this.track(operation, duration);
    };
  }

  /**
   * Measure an async operation
   */
  async measureAsync<T>(
    operation: string,
    fn: () => Promise<T>
  ): Promise<T> {
    const startTime = performance.now();
    
    try {
      const result = await fn();
      const duration = performance.now() - startTime;
      this.track(operation, duration);
      return result;
    } catch (error) {
      const duration = performance.now() - startTime;
      this.track(`${operation}:error`, duration);
      throw error;
    }
  }

  /**
   * Get statistics for an operation
   */
  getStats(operation: string): {
    count: number;
    mean: number;
    median: number;
    p95: number;
    p99: number;
    min: number;
    max: number;
  } | null {
    const samples = this.metrics.get(operation);
    if (!samples || samples.length === 0) return null;

    const sorted = [...samples].sort((a, b) => a - b);
    const count = sorted.length;
    const sum = sorted.reduce((a, b) => a + b, 0);

    return {
      count,
      mean: sum / count,
      median: sorted[Math.floor(count / 2)],
      p95: sorted[Math.floor(count * 0.95)],
      p99: sorted[Math.floor(count * 0.99)],
      min: sorted[0],
      max: sorted[count - 1],
    };
  }

  /**
   * Get all metrics summary
   */
  getAllStats(): Record<string, ReturnType<typeof this.getStats>> {
    const stats: Record<string, ReturnType<typeof this.getStats>> = {};
    
    for (const [operation] of this.metrics) {
      stats[operation] = this.getStats(operation);
    }
    
    return stats;
  }

  /**
   * Define slow operation thresholds
   */
  private getSlowThreshold(operation: string): number {
    const thresholds: Record<string, number> = {
      'auth:login': 2000,
      'auth:signup': 3000,
      'auth:token-refresh': 500,
      'auth:session-check': 100,
      'auth:logout': 1000,
      'api:request': 2000,
    };

    return thresholds[operation] || 1000;
  }

  /**
   * Report slow operation
   */
  private reportSlowOperation(operation: string, duration: number): void {
    // Report to analytics
    if (typeof window !== 'undefined' && (window as any).gtag) {
      (window as any).gtag('event', 'slow_operation', {
        event_category: 'Performance',
        event_label: operation,
        value: Math.round(duration),
      });
    }

    // Report to error tracking
    if (typeof window !== 'undefined' && (window as any).Sentry) {
      (window as any).Sentry.captureMessage(`Slow operation: ${operation}`, {
        level: 'warning',
        extra: {
          operation,
          duration,
          threshold: this.getSlowThreshold(operation),
        },
      });
    }
  }

  /**
   * Setup Web Vitals monitoring
   */
  private setupWebVitals(): void {
    if (typeof window === 'undefined') return;

    // Track Largest Contentful Paint (LCP)
    new PerformanceObserver((list) => {
      for (const entry of list.getEntries()) {
        if (entry.entryType === 'largest-contentful-paint') {
          this.track('web-vitals:lcp', entry.startTime);
        }
      }
    }).observe({ entryTypes: ['largest-contentful-paint'] });

    // Track First Input Delay (FID)
    new PerformanceObserver((list) => {
      for (const entry of list.getEntries()) {
        if (entry.entryType === 'first-input') {
          const fid = entry.processingStart - entry.startTime;
          this.track('web-vitals:fid', fid);
        }
      }
    }).observe({ entryTypes: ['first-input'] });

    // Track Cumulative Layout Shift (CLS)
    let clsValue = 0;
    new PerformanceObserver((list) => {
      for (const entry of list.getEntries()) {
        if (!entry.hadRecentInput) {
          clsValue += (entry as any).value;
          this.track('web-vitals:cls', clsValue * 1000); // Convert to ms scale
        }
      }
    }).observe({ entryTypes: ['layout-shift'] });
  }

  /**
   * Start periodic reporting
   */
  private startReporting(): void {
    this.reportingTimer = setInterval(() => {
      const stats = this.getAllStats();
      
      // Report to console in development
      if (process.env.NODE_ENV === 'development') {
        console.table(stats);
      }

      // Report aggregated metrics
      this.reportAggregatedMetrics(stats);
    }, this.REPORTING_INTERVAL);
  }

  /**
   * Report aggregated metrics
   */
  private reportAggregatedMetrics(
    stats: Record<string, ReturnType<typeof this.getStats>>
  ): void {
    const authStats = stats['auth:login'];
    if (!authStats) return;

    // Report to analytics
    if (typeof window !== 'undefined' && (window as any).gtag) {
      (window as any).gtag('event', 'performance_metrics', {
        event_category: 'Performance',
        event_label: 'auth_login_p95',
        value: Math.round(authStats.p95),
      });
    }
  }

  /**
   * Clear all metrics
   */
  clear(): void {
    this.metrics.clear();
  }

  /**
   * Stop monitoring
   */
  destroy(): void {
    if (this.reportingTimer) {
      clearInterval(this.reportingTimer);
    }
    this.clear();
  }
}

export const performanceMonitor = PerformanceMonitor.getInstance();

// Decorator for measuring method performance
export function measurePerformance(operationName?: string) {
  return function (
    target: any,
    propertyKey: string,
    descriptor: PropertyDescriptor
  ) {
    const originalMethod = descriptor.value;
    const operation = operationName || `${target.constructor.name}.${propertyKey}`;

    descriptor.value = async function (...args: any[]) {
      return performanceMonitor.measureAsync(operation, () =>
        originalMethod.apply(this, args)
      );
    };

    return descriptor;
  };
}

// React hook for measuring component operations
export function usePerformance(componentName: string) {
  const measure = (operation: string) => {
    return performanceMonitor.startMeasure(`${componentName}:${operation}`);
  };

  const measureAsync = async <T>(
    operation: string,
    fn: () => Promise<T>
  ): Promise<T> => {
    return performanceMonitor.measureAsync(
      `${componentName}:${operation}`,
      fn
    );
  };

  return { measure, measureAsync };
}