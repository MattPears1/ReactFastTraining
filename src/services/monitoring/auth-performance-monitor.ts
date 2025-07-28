import { LogLevel } from "@sentry/types";

/**
 * Authentication Performance Monitor
 * Tracks auth-related metrics and performance indicators
 */
export class AuthPerformanceMonitor {
  private static instance: AuthPerformanceMonitor;
  private metrics: Map<string, PerformanceMetric> = new Map();
  private thresholds: Map<string, number> = new Map([
    ["auth:login", 2000], // 2s max for login
    ["auth:signup", 3000], // 3s max for signup
    ["auth:token-refresh", 500], // 500ms max for token refresh
    ["auth:logout", 1000], // 1s max for logout
  ]);

  private constructor() {
    this.setupPerformanceObserver();
    this.setupMetricsReporting();
  }

  static getInstance(): AuthPerformanceMonitor {
    if (!AuthPerformanceMonitor.instance) {
      AuthPerformanceMonitor.instance = new AuthPerformanceMonitor();
    }
    return AuthPerformanceMonitor.instance;
  }

  /**
   * Start tracking a performance metric
   */
  startMetric(name: string, metadata?: Record<string, any>): void {
    const metric: PerformanceMetric = {
      name,
      startTime: performance.now(),
      metadata,
      marks: new Map(),
    };

    this.metrics.set(name, metric);
    performance.mark(`${name}-start`);
  }

  /**
   * Add a mark within a metric
   */
  markMetric(name: string, markName: string): void {
    const metric = this.metrics.get(name);
    if (!metric) return;

    const markTime = performance.now();
    metric.marks.set(markName, markTime - metric.startTime);
    performance.mark(`${name}-${markName}`);
  }

  /**
   * End tracking a performance metric
   */
  endMetric(name: string, success: boolean = true): PerformanceResult | null {
    const metric = this.metrics.get(name);
    if (!metric) return null;

    const endTime = performance.now();
    const duration = endTime - metric.startTime;

    performance.mark(`${name}-end`);
    performance.measure(name, `${name}-start`, `${name}-end`);

    const result: PerformanceResult = {
      name: metric.name,
      duration,
      success,
      marks: Object.fromEntries(metric.marks),
      metadata: metric.metadata,
      timestamp: new Date(),
      threshold: this.thresholds.get(name),
      exceedsThreshold:
        this.thresholds.has(name) && duration > this.thresholds.get(name)!,
    };

    // Log slow operations
    if (result.exceedsThreshold) {
      this.logSlowOperation(result);
    }

    // Report to analytics
    this.reportMetric(result);

    // Cleanup
    this.metrics.delete(name);

    return result;
  }

  /**
   * Set up PerformanceObserver for Web Vitals
   */
  private setupPerformanceObserver(): void {
    if ("PerformanceObserver" in window) {
      // Observe navigation timing
      const navigationObserver = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          if (entry.entryType === "navigation") {
            this.reportNavigationTiming(entry as PerformanceNavigationTiming);
          }
        }
      });

      navigationObserver.observe({ entryTypes: ["navigation"] });

      // Observe resource timing for API calls
      const resourceObserver = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          if (entry.name.includes("/api/auth/")) {
            this.reportResourceTiming(entry as PerformanceResourceTiming);
          }
        }
      });

      resourceObserver.observe({ entryTypes: ["resource"] });

      // Observe layout shifts
      const layoutShiftObserver = new PerformanceObserver((list) => {
        let clsScore = 0;
        for (const entry of list.getEntries()) {
          if (!(entry as any).hadRecentInput) {
            clsScore += (entry as any).value;
          }
        }

        if (clsScore > 0.1) {
          this.reportLayoutShift(clsScore);
        }
      });

      layoutShiftObserver.observe({ entryTypes: ["layout-shift"] });
    }
  }

  /**
   * Set up periodic metrics reporting
   */
  private setupMetricsReporting(): void {
    // Report metrics every 30 seconds
    setInterval(() => {
      this.reportAggregatedMetrics();
    }, 30000);

    // Report on page unload
    window.addEventListener("beforeunload", () => {
      this.reportAggregatedMetrics();
    });
  }

  /**
   * Log slow operations
   */
  private logSlowOperation(result: PerformanceResult): void {
    console.warn(`Slow operation detected: ${result.name}`, {
      duration: `${result.duration.toFixed(2)}ms`,
      threshold: `${result.threshold}ms`,
      marks: result.marks,
      metadata: result.metadata,
    });

    // Send to error tracking
    if (window.Sentry) {
      window.Sentry.captureMessage(`Slow auth operation: ${result.name}`, {
        level: "warning" as LogLevel,
        extra: {
          duration: result.duration,
          threshold: result.threshold,
          marks: result.marks,
          metadata: result.metadata,
        },
      });
    }
  }

  /**
   * Report individual metric
   */
  private reportMetric(result: PerformanceResult): void {
    // Send to analytics
    if (window.gtag) {
      window.gtag("event", "timing_complete", {
        name: result.name,
        value: Math.round(result.duration),
        event_category: "Auth Performance",
        event_label: result.success ? "success" : "failure",
      });
    }

    // Store for aggregation
    const stored = this.getStoredMetrics();
    stored.push(result);

    // Keep only last 100 metrics
    if (stored.length > 100) {
      stored.splice(0, stored.length - 100);
    }

    localStorage.setItem("auth_performance_metrics", JSON.stringify(stored));
  }

  /**
   * Report navigation timing
   */
  private reportNavigationTiming(entry: PerformanceNavigationTiming): void {
    const metrics = {
      dns: entry.domainLookupEnd - entry.domainLookupStart,
      tcp: entry.connectEnd - entry.connectStart,
      ttfb: entry.responseStart - entry.requestStart,
      download: entry.responseEnd - entry.responseStart,
      domInteractive: entry.domInteractive - entry.fetchStart,
      domComplete: entry.domComplete - entry.fetchStart,
      loadComplete: entry.loadEventEnd - entry.fetchStart,
    };

    // Report to analytics
    Object.entries(metrics).forEach(([key, value]) => {
      if (window.gtag) {
        window.gtag("event", "timing_complete", {
          name: `page_${key}`,
          value: Math.round(value),
          event_category: "Page Performance",
        });
      }
    });
  }

  /**
   * Report resource timing for auth API calls
   */
  private reportResourceTiming(entry: PerformanceResourceTiming): void {
    const duration = entry.responseEnd - entry.startTime;
    const path = new URL(entry.name).pathname;

    if (window.gtag) {
      window.gtag("event", "timing_complete", {
        name: `api_${path}`,
        value: Math.round(duration),
        event_category: "API Performance",
      });
    }
  }

  /**
   * Report layout shift issues
   */
  private reportLayoutShift(score: number): void {
    console.warn("Layout shift detected during auth flow:", score);

    if (window.Sentry) {
      window.Sentry.captureMessage("High CLS during auth flow", {
        level: "warning" as LogLevel,
        extra: { cls_score: score },
      });
    }
  }

  /**
   * Report aggregated metrics
   */
  private reportAggregatedMetrics(): void {
    const metrics = this.getStoredMetrics();
    if (metrics.length === 0) return;

    // Calculate aggregates
    const aggregates = this.calculateAggregates(metrics);

    // Report to analytics
    Object.entries(aggregates).forEach(([operation, stats]) => {
      if (window.gtag) {
        window.gtag("event", "performance_summary", {
          event_category: "Auth Performance",
          operation,
          avg_duration: Math.round(stats.avg),
          p95_duration: Math.round(stats.p95),
          success_rate: stats.successRate,
          sample_size: stats.count,
        });
      }
    });

    // Clear stored metrics after reporting
    localStorage.removeItem("auth_performance_metrics");
  }

  /**
   * Get stored metrics from localStorage
   */
  private getStoredMetrics(): PerformanceResult[] {
    try {
      const stored = localStorage.getItem("auth_performance_metrics");
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  }

  /**
   * Calculate aggregate statistics
   */
  private calculateAggregates(
    metrics: PerformanceResult[],
  ): Record<string, AggregateStats> {
    const grouped = new Map<string, PerformanceResult[]>();

    // Group by operation name
    metrics.forEach((metric) => {
      const group = grouped.get(metric.name) || [];
      group.push(metric);
      grouped.set(metric.name, group);
    });

    const aggregates: Record<string, AggregateStats> = {};

    // Calculate stats for each group
    grouped.forEach((group, name) => {
      const durations = group.map((m) => m.duration).sort((a, b) => a - b);
      const successCount = group.filter((m) => m.success).length;

      aggregates[name] = {
        count: group.length,
        avg: durations.reduce((a, b) => a + b, 0) / durations.length,
        min: durations[0],
        max: durations[durations.length - 1],
        p50: this.percentile(durations, 0.5),
        p95: this.percentile(durations, 0.95),
        p99: this.percentile(durations, 0.99),
        successRate: (successCount / group.length) * 100,
      };
    });

    return aggregates;
  }

  /**
   * Calculate percentile
   */
  private percentile(sorted: number[], p: number): number {
    const index = Math.ceil(sorted.length * p) - 1;
    return sorted[Math.max(0, index)];
  }

  /**
   * Get current performance summary
   */
  getPerformanceSummary(): PerformanceSummary {
    const metrics = this.getStoredMetrics();
    const aggregates = this.calculateAggregates(metrics);

    return {
      timestamp: new Date(),
      totalOperations: metrics.length,
      operationStats: aggregates,
      slowOperations: metrics.filter((m) => m.exceedsThreshold),
      failedOperations: metrics.filter((m) => !m.success),
    };
  }
}

// Type definitions
interface PerformanceMetric {
  name: string;
  startTime: number;
  metadata?: Record<string, any>;
  marks: Map<string, number>;
}

interface PerformanceResult {
  name: string;
  duration: number;
  success: boolean;
  marks: Record<string, number>;
  metadata?: Record<string, any>;
  timestamp: Date;
  threshold?: number;
  exceedsThreshold?: boolean;
}

interface AggregateStats {
  count: number;
  avg: number;
  min: number;
  max: number;
  p50: number;
  p95: number;
  p99: number;
  successRate: number;
}

interface PerformanceSummary {
  timestamp: Date;
  totalOperations: number;
  operationStats: Record<string, AggregateStats>;
  slowOperations: PerformanceResult[];
  failedOperations: PerformanceResult[];
}

// Extend window for external services
declare global {
  interface Window {
    Sentry?: any;
    gtag?: (...args: any[]) => void;
  }
}

// Export singleton instance
export const authPerformanceMonitor = AuthPerformanceMonitor.getInstance();
