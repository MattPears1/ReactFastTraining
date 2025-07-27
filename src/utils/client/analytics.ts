import React from 'react';
import { performanceMonitor } from './performance';

interface AnalyticsEvent {
  category: string;
  action: string;
  label?: string;
  value?: number;
  metadata?: Record<string, any>;
}

interface UserBehavior {
  pageViews: number;
  sessionDuration: number;
  interactions: number;
  errors: number;
  performance: {
    loadTime: number;
    renderTime: number;
    apiResponseTime: number;
  };
}

export class Analytics {
  private events: AnalyticsEvent[] = [];
  private sessionStart: number = Date.now();
  private userBehavior: UserBehavior = {
    pageViews: 0,
    sessionDuration: 0,
    interactions: 0,
    errors: 0,
    performance: {
      loadTime: 0,
      renderTime: 0,
      apiResponseTime: 0,
    },
  };

  track(event: AnalyticsEvent): void {
    // Add timestamp and session info
    const enrichedEvent = {
      ...event,
      timestamp: Date.now(),
      sessionId: this.getSessionId(),
      userId: this.getUserId(),
    };

    this.events.push(enrichedEvent);
    this.userBehavior.interactions++;

    // Send to analytics service in batches
    this.scheduleBatchSend();
  }

  trackPageView(page: string, metadata?: Record<string, any>): void {
    this.userBehavior.pageViews++;
    this.track({
      category: 'Navigation',
      action: 'Page View',
      label: page,
      metadata,
    });
  }

  trackError(error: Error, context?: Record<string, any>): void {
    this.userBehavior.errors++;
    this.track({
      category: 'Error',
      action: error.name,
      label: error.message,
      metadata: {
        stack: error.stack,
        ...context,
      },
    });
  }

  trackPerformance(metric: string, value: number): void {
    this.track({
      category: 'Performance',
      action: metric,
      value,
    });

    // Update performance metrics
    if (metric === 'page-load') {
      this.userBehavior.performance.loadTime = value;
    } else if (metric === 'render-time') {
      this.userBehavior.performance.renderTime = value;
    } else if (metric === 'api-response') {
      this.userBehavior.performance.apiResponseTime = value;
    }
  }

  trackUserAction(
    action: string,
    target: string,
    value?: number,
    metadata?: Record<string, any>
  ): void {
    this.track({
      category: 'User Action',
      action,
      label: target,
      value,
      metadata,
    });
  }

  getUserBehaviorSummary(): UserBehavior {
    return {
      ...this.userBehavior,
      sessionDuration: Date.now() - this.sessionStart,
    };
  }

  private getSessionId(): string {
    let sessionId = sessionStorage.getItem('analytics-session-id');
    if (!sessionId) {
      sessionId = Math.random().toString(36).substr(2, 9);
      sessionStorage.setItem('analytics-session-id', sessionId);
    }
    return sessionId;
  }

  private getUserId(): string | null {
    return localStorage.getItem('analytics-user-id');
  }

  private scheduleBatchSend(): void {
    if (this.sendTimer) return;

    this.sendTimer = setTimeout(() => {
      this.sendBatch();
      this.sendTimer = null;
    }, 5000); // Send every 5 seconds
  }

  private sendTimer: NodeJS.Timeout | null = null;

  private async sendBatch(): Promise<void> {
    if (this.events.length === 0) return;

    const batch = [...this.events];
    this.events = [];

    try {
      // In production, send to analytics endpoint
      console.log('Analytics batch:', batch);
      
      // Store failed batches for retry
      const failedBatches = JSON.parse(
        localStorage.getItem('analytics-failed-batches') || '[]'
      );
      
      // Try to send failed batches
      if (failedBatches.length > 0) {
        // Attempt to send failed batches
        localStorage.setItem('analytics-failed-batches', '[]');
      }
    } catch (error) {
      // Store failed batch for later retry
      const failedBatches = JSON.parse(
        localStorage.getItem('analytics-failed-batches') || '[]'
      );
      failedBatches.push(batch);
      localStorage.setItem(
        'analytics-failed-batches',
        JSON.stringify(failedBatches.slice(-10)) // Keep last 10 batches
      );
    }
  }
}

export const analytics = new Analytics();

// React hooks for analytics
export const usePageTracking = () => {
  React.useEffect(() => {
    const path = window.location.pathname;
    analytics.trackPageView(path, {
      referrer: document.referrer,
      screenSize: `${window.innerWidth}x${window.innerHeight}`,
      userAgent: navigator.userAgent,
    });

    // Track performance metrics
    if ('performance' in window) {
      const perfData = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
      if (perfData) {
        analytics.trackPerformance('page-load', perfData.loadEventEnd - perfData.fetchStart);
        analytics.trackPerformance('dom-ready', perfData.domContentLoadedEventEnd - perfData.fetchStart);
      }
    }
  }, []);
};

export const useErrorTracking = () => {
  React.useEffect(() => {
    const handleError = (event: ErrorEvent) => {
      analytics.trackError(new Error(event.message), {
        filename: event.filename,
        lineno: event.lineno,
        colno: event.colno,
      });
    };

    const handleRejection = (event: PromiseRejectionEvent) => {
      analytics.trackError(new Error(event.reason), {
        type: 'unhandled-promise-rejection',
      });
    };

    window.addEventListener('error', handleError);
    window.addEventListener('unhandledrejection', handleRejection);

    return () => {
      window.removeEventListener('error', handleError);
      window.removeEventListener('unhandledrejection', handleRejection);
    };
  }, []);
};

export const useClickTracking = (category: string = 'UI') => {
  const trackClick = React.useCallback((action: string, label?: string, value?: number) => {
    analytics.track({
      category,
      action: `Click: ${action}`,
      label,
      value,
    });
  }, [category]);

  return trackClick;
};

// Monitoring utilities
export class Monitor {
  private metrics = new Map<string, number[]>();
  private alerts = new Map<string, { threshold: number; callback: (value: number) => void }>();

  record(metric: string, value: number): void {
    if (!this.metrics.has(metric)) {
      this.metrics.set(metric, []);
    }

    const values = this.metrics.get(metric)!;
    values.push(value);

    // Keep last 100 values
    if (values.length > 100) {
      values.shift();
    }

    // Check alerts
    const alert = this.alerts.get(metric);
    if (alert && value > alert.threshold) {
      alert.callback(value);
    }
  }

  setAlert(metric: string, threshold: number, callback: (value: number) => void): void {
    this.alerts.set(metric, { threshold, callback });
  }

  getStats(metric: string): {
    avg: number;
    min: number;
    max: number;
    count: number;
    p95: number;
  } | null {
    const values = this.metrics.get(metric);
    if (!values || values.length === 0) return null;

    const sorted = [...values].sort((a, b) => a - b);
    const sum = values.reduce((a, b) => a + b, 0);
    const p95Index = Math.floor(values.length * 0.95);

    return {
      avg: sum / values.length,
      min: sorted[0],
      max: sorted[sorted.length - 1],
      count: values.length,
      p95: sorted[p95Index],
    };
  }

  getAllMetrics(): Record<string, ReturnType<typeof this.getStats>> {
    const result: Record<string, ReturnType<typeof this.getStats>> = {};
    
    for (const [metric] of this.metrics) {
      result[metric] = this.getStats(metric);
    }
    
    return result;
  }
}

export const monitor = new Monitor();

// Set up common alerts
monitor.setAlert('api-response-time', 3000, (value) => {
  console.warn(`Slow API response: ${value}ms`);
});

monitor.setAlert('memory-usage', 100 * 1024 * 1024, (value) => {
  console.warn(`High memory usage: ${(value / 1024 / 1024).toFixed(2)}MB`);
});

// Memory monitoring
if ('performance' in window && 'memory' in performance) {
  setInterval(() => {
    const memory = (performance as any).memory;
    monitor.record('memory-usage', memory.usedJSHeapSize);
  }, 10000);
}