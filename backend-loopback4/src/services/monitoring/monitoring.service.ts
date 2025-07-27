import {injectable, inject} from '@loopback/core';
import {ErrorDetails, ErrorSeverity, errorHandler} from './error-handler.service';
import {performance} from 'perf_hooks';

export interface MetricData {
  name: string;
  value: number;
  unit: string;
  tags?: Record<string, string>;
  timestamp?: Date;
}

export interface TraceSpan {
  id: string;
  name: string;
  startTime: number;
  endTime?: number;
  duration?: number;
  tags?: Record<string, any>;
  status?: 'ok' | 'error';
  error?: any;
  parentId?: string;
  children?: TraceSpan[];
}

export interface HealthCheckResult {
  service: string;
  status: 'healthy' | 'degraded' | 'unhealthy';
  message?: string;
  details?: Record<string, any>;
  lastCheck: Date;
}

export interface MonitoringAlert {
  id: string;
  type: string;
  severity: 'info' | 'warning' | 'error' | 'critical';
  message: string;
  details?: Record<string, any>;
  timestamp: Date;
  resolved?: boolean;
  resolvedAt?: Date;
}

@injectable()
export class MonitoringService {
  private metrics: Map<string, MetricData[]> = new Map();
  private traces: Map<string, TraceSpan> = new Map();
  private healthChecks: Map<string, HealthCheckResult> = new Map();
  private alerts: MonitoringAlert[] = [];
  private performanceObserver?: PerformanceObserver;

  constructor(
    @inject('monitoring.config', {optional: true})
    private config?: {
      enableTracing?: boolean;
      enableMetrics?: boolean;
      enableAlerts?: boolean;
      metricsRetentionMinutes?: number;
      alertRetentionCount?: number;
    }
  ) {
    this.setupErrorMonitoring();
    this.setupPerformanceMonitoring();
  }

  private setupErrorMonitoring(): void {
    errorHandler.onError((error: ErrorDetails) => {
      // Record error metric
      this.recordMetric({
        name: 'application.errors',
        value: 1,
        unit: 'count',
        tags: {
          category: error.category,
          severity: error.severity,
        },
      });

      // Create alert for critical errors
      if (error.severity === ErrorSeverity.CRITICAL) {
        this.createAlert({
          type: 'critical_error',
          severity: 'critical',
          message: error.message,
          details: {
            errorId: error.id,
            category: error.category,
            context: error.context,
          },
        });
      }
    });
  }

  private setupPerformanceMonitoring(): void {
    if (!this.config?.enableMetrics) return;

    this.performanceObserver = new PerformanceObserver((list) => {
      for (const entry of list.getEntries()) {
        if (entry.entryType === 'measure') {
          this.recordMetric({
            name: `performance.${entry.name}`,
            value: entry.duration,
            unit: 'ms',
          });
        }
      }
    });

    this.performanceObserver.observe({ entryTypes: ['measure'] });
  }

  // Metrics
  recordMetric(metric: MetricData): void {
    if (!this.config?.enableMetrics) return;

    const timestamp = metric.timestamp || new Date();
    const metricWithTimestamp = { ...metric, timestamp };

    if (!this.metrics.has(metric.name)) {
      this.metrics.set(metric.name, []);
    }

    const metricList = this.metrics.get(metric.name)!;
    metricList.push(metricWithTimestamp);

    // Clean up old metrics
    this.cleanupOldMetrics(metric.name);
  }

  private cleanupOldMetrics(metricName: string): void {
    const retentionMinutes = this.config?.metricsRetentionMinutes || 60;
    const cutoffTime = new Date(Date.now() - retentionMinutes * 60 * 1000);

    const metrics = this.metrics.get(metricName);
    if (metrics) {
      const filtered = metrics.filter(m => m.timestamp! > cutoffTime);
      this.metrics.set(metricName, filtered);
    }
  }

  getMetrics(name?: string, tags?: Record<string, string>): MetricData[] {
    if (!name) {
      // Return all metrics
      const allMetrics: MetricData[] = [];
      this.metrics.forEach(metricList => {
        allMetrics.push(...metricList);
      });
      return allMetrics;
    }

    const metrics = this.metrics.get(name) || [];
    
    if (!tags) {
      return metrics;
    }

    // Filter by tags
    return metrics.filter(metric => {
      if (!metric.tags) return false;
      return Object.entries(tags).every(([key, value]) => metric.tags![key] === value);
    });
  }

  aggregateMetrics(
    name: string,
    aggregation: 'sum' | 'avg' | 'min' | 'max' | 'count',
    timeWindowMinutes: number = 5
  ): number {
    const cutoffTime = new Date(Date.now() - timeWindowMinutes * 60 * 1000);
    const metrics = this.getMetrics(name).filter(m => m.timestamp! > cutoffTime);

    if (metrics.length === 0) return 0;

    switch (aggregation) {
      case 'sum':
        return metrics.reduce((sum, m) => sum + m.value, 0);
      case 'avg':
        return metrics.reduce((sum, m) => sum + m.value, 0) / metrics.length;
      case 'min':
        return Math.min(...metrics.map(m => m.value));
      case 'max':
        return Math.max(...metrics.map(m => m.value));
      case 'count':
        return metrics.length;
    }
  }

  // Tracing
  startTrace(name: string, parentId?: string): TraceSpan {
    if (!this.config?.enableTracing) {
      return { id: 'noop', name, startTime: 0 };
    }

    const span: TraceSpan = {
      id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      name,
      startTime: performance.now(),
      parentId,
      tags: {},
      children: [],
    };

    this.traces.set(span.id, span);

    if (parentId) {
      const parent = this.traces.get(parentId);
      if (parent) {
        parent.children = parent.children || [];
        parent.children.push(span);
      }
    }

    return span;
  }

  endTrace(spanId: string, status: 'ok' | 'error' = 'ok', error?: any): void {
    if (!this.config?.enableTracing) return;

    const span = this.traces.get(spanId);
    if (!span) return;

    span.endTime = performance.now();
    span.duration = span.endTime - span.startTime;
    span.status = status;
    span.error = error;

    // Record trace metric
    this.recordMetric({
      name: `trace.${span.name}`,
      value: span.duration,
      unit: 'ms',
      tags: {
        status,
        ...span.tags,
      },
    });
  }

  addTraceTag(spanId: string, key: string, value: any): void {
    const span = this.traces.get(spanId);
    if (span) {
      span.tags = span.tags || {};
      span.tags[key] = value;
    }
  }

  // Health Checks
  recordHealthCheck(result: HealthCheckResult): void {
    this.healthChecks.set(result.service, {
      ...result,
      lastCheck: new Date(),
    });

    // Create alert if service is unhealthy
    if (result.status === 'unhealthy') {
      this.createAlert({
        type: 'health_check_failed',
        severity: 'error',
        message: `Service ${result.service} is unhealthy: ${result.message}`,
        details: result.details,
      });
    }
  }

  getHealthStatus(): {
    overall: 'healthy' | 'degraded' | 'unhealthy';
    services: HealthCheckResult[];
  } {
    const services = Array.from(this.healthChecks.values());
    
    const unhealthyCount = services.filter(s => s.status === 'unhealthy').length;
    const degradedCount = services.filter(s => s.status === 'degraded').length;

    let overall: 'healthy' | 'degraded' | 'unhealthy' = 'healthy';
    if (unhealthyCount > 0) {
      overall = 'unhealthy';
    } else if (degradedCount > 0) {
      overall = 'degraded';
    }

    return { overall, services };
  }

  // Alerts
  createAlert(alert: Omit<MonitoringAlert, 'id' | 'timestamp' | 'resolved'>): void {
    if (!this.config?.enableAlerts) return;

    const newAlert: MonitoringAlert = {
      ...alert,
      id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      timestamp: new Date(),
      resolved: false,
    };

    this.alerts.unshift(newAlert);

    // Limit alert retention
    const maxAlerts = this.config?.alertRetentionCount || 1000;
    if (this.alerts.length > maxAlerts) {
      this.alerts = this.alerts.slice(0, maxAlerts);
    }

    // Log critical alerts
    if (alert.severity === 'critical') {
      console.error(`[CRITICAL ALERT] ${alert.type}: ${alert.message}`, alert.details);
    }
  }

  resolveAlert(alertId: string): void {
    const alert = this.alerts.find(a => a.id === alertId);
    if (alert && !alert.resolved) {
      alert.resolved = true;
      alert.resolvedAt = new Date();
    }
  }

  getAlerts(options?: {
    severity?: string;
    type?: string;
    resolved?: boolean;
    limit?: number;
  }): MonitoringAlert[] {
    let filtered = this.alerts;

    if (options?.severity) {
      filtered = filtered.filter(a => a.severity === options.severity);
    }

    if (options?.type) {
      filtered = filtered.filter(a => a.type === options.type);
    }

    if (options?.resolved !== undefined) {
      filtered = filtered.filter(a => a.resolved === options.resolved);
    }

    if (options?.limit) {
      filtered = filtered.slice(0, options.limit);
    }

    return filtered;
  }

  // Dashboard Data
  getDashboardData(): {
    metrics: {
      errorRate: number;
      avgResponseTime: number;
      successRate: number;
      activeUsers: number;
    };
    health: any;
    recentAlerts: MonitoringAlert[];
    performance: {
      slowestEndpoints: Array<{name: string; avgTime: number}>;
      errorProne: Array<{name: string; errorCount: number}>;
    };
  } {
    const errorRate = this.aggregateMetrics('application.errors', 'count', 5);
    const totalRequests = this.aggregateMetrics('http.requests', 'count', 5);
    const successRate = totalRequests > 0 ? 
      ((totalRequests - errorRate) / totalRequests) * 100 : 100;

    // Get performance data
    const traceMetrics: Record<string, number[]> = {};
    this.metrics.forEach((metricList, name) => {
      if (name.startsWith('trace.')) {
        const endpoint = name.replace('trace.', '');
        traceMetrics[endpoint] = metricList.map(m => m.value);
      }
    });

    const slowestEndpoints = Object.entries(traceMetrics)
      .map(([name, times]) => ({
        name,
        avgTime: times.reduce((a, b) => a + b, 0) / times.length,
      }))
      .sort((a, b) => b.avgTime - a.avgTime)
      .slice(0, 5);

    const errorMetrics: Record<string, number> = {};
    this.getMetrics('application.errors').forEach(metric => {
      const endpoint = metric.tags?.endpoint;
      if (endpoint) {
        errorMetrics[endpoint] = (errorMetrics[endpoint] || 0) + 1;
      }
    });

    const errorProne = Object.entries(errorMetrics)
      .map(([name, errorCount]) => ({ name, errorCount }))
      .sort((a, b) => b.errorCount - a.errorCount)
      .slice(0, 5);

    return {
      metrics: {
        errorRate,
        avgResponseTime: this.aggregateMetrics('http.response_time', 'avg', 5),
        successRate,
        activeUsers: this.aggregateMetrics('users.active', 'count', 5),
      },
      health: this.getHealthStatus(),
      recentAlerts: this.getAlerts({ resolved: false, limit: 10 }),
      performance: {
        slowestEndpoints,
        errorProne,
      },
    };
  }
}

// Export singleton instance
export const monitoring = new MonitoringService({
  enableTracing: true,
  enableMetrics: true,
  enableAlerts: true,
  metricsRetentionMinutes: 60,
  alertRetentionCount: 1000,
});