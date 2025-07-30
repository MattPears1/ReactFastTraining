import * as Sentry from '@sentry/node';
import { EventEmitter } from 'events';
import { performance } from 'perf_hooks';
import fs from 'fs/promises';
import path from 'path';

interface MetricData {
  name: string;
  value: number;
  unit: string;
  tags?: Record<string, string>;
  timestamp: Date;
}

interface HealthCheck {
  name: string;
  status: 'healthy' | 'unhealthy' | 'degraded';
  message?: string;
  lastCheck: Date;
  metadata?: Record<string, any>;
}

export class MonitoringService extends EventEmitter {
  private metrics: Map<string, MetricData[]> = new Map();
  private healthChecks: Map<string, HealthCheck> = new Map();
  private performanceMarks: Map<string, number> = new Map();
  private logFilePath: string;

  constructor() {
    super();
    this.logFilePath = path.join(process.cwd(), 'logs', 'monitoring.log');
    this.initializeLogDirectory();
  }

  private async initializeLogDirectory() {
    const logDir = path.dirname(this.logFilePath);
    try {
      await fs.mkdir(logDir, { recursive: true });
    } catch (error) {
      console.error('Failed to create log directory:', error);
    }
  }

  // Performance Monitoring
  startTimer(label: string): void {
    this.performanceMarks.set(label, performance.now());
  }

  endTimer(label: string, metadata?: Record<string, any>): number | null {
    const startTime = this.performanceMarks.get(label);
    if (!startTime) {
      console.warn(`No start time found for label: ${label}`);
      return null;
    }

    const duration = performance.now() - startTime;
    this.performanceMarks.delete(label);

    this.recordMetric('performance.duration', duration, 'ms', {
      operation: label,
      ...metadata,
    });

    // Log slow operations to Sentry
    if (duration > 1000) {
      Sentry.captureMessage(`Slow operation: ${label} took ${duration}ms`, 'warning');
    }

    return duration;
  }

  // Metrics Recording
  recordMetric(name: string, value: number, unit: string = 'count', tags?: Record<string, string>): void {
    const metric: MetricData = {
      name,
      value,
      unit,
      tags,
      timestamp: new Date(),
    };

    if (!this.metrics.has(name)) {
      this.metrics.set(name, []);
    }

    const metricArray = this.metrics.get(name)!;
    metricArray.push(metric);

    // Keep only last 1000 metrics per name
    if (metricArray.length > 1000) {
      metricArray.shift();
    }

    this.emit('metric', metric);
  }

  // Health Checks
  registerHealthCheck(name: string, checkFn: () => Promise<HealthCheck>): void {
    const runCheck = async () => {
      try {
        const result = await checkFn();
        this.healthChecks.set(name, {
          ...result,
          lastCheck: new Date(),
        });
      } catch (error) {
        this.healthChecks.set(name, {
          name,
          status: 'unhealthy',
          message: error instanceof Error ? error.message : 'Unknown error',
          lastCheck: new Date(),
        });
      }
    };

    // Run immediately and then every 30 seconds
    runCheck();
    setInterval(runCheck, 30000);
  }

  getHealthStatus(): { status: string; checks: HealthCheck[] } {
    const checks = Array.from(this.healthChecks.values());
    const hasUnhealthy = checks.some(check => check.status === 'unhealthy');
    const hasDegraded = checks.some(check => check.status === 'degraded');

    let status = 'healthy';
    if (hasUnhealthy) {
      status = 'unhealthy';
    } else if (hasDegraded) {
      status = 'degraded';
    }

    return { status, checks };
  }

  // Error Tracking
  trackError(error: Error, context?: Record<string, any>): void {
    const errorData = {
      message: error.message,
      stack: error.stack,
      context,
      timestamp: new Date(),
    };

    this.emit('error', errorData);
    this.logToFile('ERROR', errorData);

    // Send to Sentry
    Sentry.captureException(error, {
      contexts: {
        monitoring: context,
      },
    });
  }

  // API Monitoring
  trackApiCall(endpoint: string, method: string, statusCode: number, duration: number): void {
    this.recordMetric('api.requests', 1, 'count', {
      endpoint,
      method,
      status: statusCode.toString(),
    });

    this.recordMetric('api.duration', duration, 'ms', {
      endpoint,
      method,
    });

    if (statusCode >= 400) {
      this.recordMetric('api.errors', 1, 'count', {
        endpoint,
        method,
        status: statusCode.toString(),
      });
    }
  }

  // Database Monitoring
  trackDatabaseQuery(operation: string, table: string, duration: number, success: boolean): void {
    this.recordMetric('db.queries', 1, 'count', {
      operation,
      table,
      success: success.toString(),
    });

    this.recordMetric('db.duration', duration, 'ms', {
      operation,
      table,
    });

    if (!success) {
      this.recordMetric('db.errors', 1, 'count', {
        operation,
        table,
      });
    }
  }

  // Memory Monitoring
  trackMemoryUsage(): void {
    const usage = process.memoryUsage();
    
    this.recordMetric('memory.heap_used', usage.heapUsed, 'bytes');
    this.recordMetric('memory.heap_total', usage.heapTotal, 'bytes');
    this.recordMetric('memory.rss', usage.rss, 'bytes');
    this.recordMetric('memory.external', usage.external, 'bytes');
  }

  // CPU Monitoring
  trackCpuUsage(): void {
    const usage = process.cpuUsage();
    
    this.recordMetric('cpu.user', usage.user, 'microseconds');
    this.recordMetric('cpu.system', usage.system, 'microseconds');
  }

  // Custom Events
  trackEvent(eventName: string, properties?: Record<string, any>): void {
    const event = {
      name: eventName,
      properties,
      timestamp: new Date(),
    };

    this.emit('event', event);
    this.logToFile('EVENT', event);

    // Send to Sentry as breadcrumb
    Sentry.addBreadcrumb({
      category: 'custom',
      message: eventName,
      data: properties,
      level: 'info',
    });
  }

  // Logging
  private async logToFile(level: string, data: any): Promise<void> {
    const logEntry = {
      level,
      timestamp: new Date().toISOString(),
      data,
    };

    try {
      await fs.appendFile(
        this.logFilePath,
        JSON.stringify(logEntry) + '\n',
        'utf8'
      );
    } catch (error) {
      console.error('Failed to write to log file:', error);
    }
  }

  // Metrics Aggregation
  getMetricsSummary(metricName: string, since?: Date): {
    count: number;
    min: number;
    max: number;
    avg: number;
    p50: number;
    p95: number;
    p99: number;
  } | null {
    const metrics = this.metrics.get(metricName);
    if (!metrics || metrics.length === 0) {
      return null;
    }

    let relevantMetrics = metrics;
    if (since) {
      relevantMetrics = metrics.filter(m => m.timestamp >= since);
    }

    if (relevantMetrics.length === 0) {
      return null;
    }

    const values = relevantMetrics.map(m => m.value).sort((a, b) => a - b);
    const count = values.length;
    const sum = values.reduce((a, b) => a + b, 0);

    return {
      count,
      min: values[0],
      max: values[count - 1],
      avg: sum / count,
      p50: values[Math.floor(count * 0.5)],
      p95: values[Math.floor(count * 0.95)],
      p99: values[Math.floor(count * 0.99)],
    };
  }

  // Dashboard Data
  getDashboardData(): {
    health: ReturnType<typeof this.getHealthStatus>;
    metrics: Record<string, any>;
    recentErrors: number;
    apiStats: any;
  } {
    const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);

    return {
      health: this.getHealthStatus(),
      metrics: {
        api: {
          requests: this.getMetricsSummary('api.requests', fiveMinutesAgo),
          duration: this.getMetricsSummary('api.duration', fiveMinutesAgo),
          errors: this.getMetricsSummary('api.errors', fiveMinutesAgo),
        },
        database: {
          queries: this.getMetricsSummary('db.queries', fiveMinutesAgo),
          duration: this.getMetricsSummary('db.duration', fiveMinutesAgo),
          errors: this.getMetricsSummary('db.errors', fiveMinutesAgo),
        },
        memory: {
          heapUsed: this.getMetricsSummary('memory.heap_used', fiveMinutesAgo),
          rss: this.getMetricsSummary('memory.rss', fiveMinutesAgo),
        },
      },
      recentErrors: this.getMetricsSummary('api.errors', fiveMinutesAgo)?.count || 0,
      apiStats: this.getApiStats(fiveMinutesAgo),
    };
  }

  private getApiStats(since: Date): Record<string, any> {
    const apiMetrics = this.metrics.get('api.requests') || [];
    const relevantMetrics = apiMetrics.filter(m => m.timestamp >= since);

    const stats: Record<string, any> = {};
    
    relevantMetrics.forEach(metric => {
      const endpoint = metric.tags?.endpoint || 'unknown';
      if (!stats[endpoint]) {
        stats[endpoint] = {
          count: 0,
          errors: 0,
          avgDuration: 0,
        };
      }
      
      stats[endpoint].count++;
      if (metric.tags?.status && parseInt(metric.tags.status) >= 400) {
        stats[endpoint].errors++;
      }
    });

    return stats;
  }

  // Cleanup old metrics
  cleanup(): void {
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
    
    this.metrics.forEach((metricArray, name) => {
      const filtered = metricArray.filter(m => m.timestamp > oneHourAgo);
      if (filtered.length !== metricArray.length) {
        this.metrics.set(name, filtered);
      }
    });
  }
}

// Singleton instance
export const monitoring = new MonitoringService();

// Start periodic tasks
setInterval(() => {
  monitoring.trackMemoryUsage();
  monitoring.trackCpuUsage();
}, 60000); // Every minute

setInterval(() => {
  monitoring.cleanup();
}, 3600000); // Every hour