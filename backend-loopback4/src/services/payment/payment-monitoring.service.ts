import { performance } from 'perf_hooks';
import * as pino from 'pino';
import { EventEmitter } from 'events';
import { db } from '../../config/database.config';
import { sql } from 'drizzle-orm';

// Metrics types
interface PaymentMetric {
  timestamp: Date;
  metric: string;
  value: number;
  tags: Record<string, string>;
}

interface PerformanceMetric {
  operation: string;
  duration: number;
  success: boolean;
  metadata?: any;
}

interface AlertConfig {
  name: string;
  condition: (metrics: any) => boolean;
  message: (metrics: any) => string;
  severity: 'info' | 'warning' | 'critical';
  cooldown: number; // minutes
}

export class PaymentMonitoringService {
  private static logger: pino.Logger;
  private static metricsBuffer: PaymentMetric[] = [];
  private static performanceBuffer: PerformanceMetric[] = [];
  private static eventEmitter = new EventEmitter();
  private static lastAlertTime = new Map<string, Date>();
  
  // Performance tracking
  private static activeOperations = new Map<string, number>();
  
  // Alert configurations
  private static alerts: AlertConfig[] = [
    {
      name: 'high_failure_rate',
      condition: (metrics) => metrics.failureRate > 10, // 10% failure rate
      message: (metrics) => `Payment failure rate is ${metrics.failureRate}%`,
      severity: 'critical',
      cooldown: 15,
    },
    {
      name: 'slow_response_time',
      condition: (metrics) => metrics.avgResponseTime > 5000, // 5 seconds
      message: (metrics) => `Average response time is ${metrics.avgResponseTime}ms`,
      severity: 'warning',
      cooldown: 30,
    },
    {
      name: 'low_success_rate',
      condition: (metrics) => metrics.successRate < 90, // Below 90% success
      message: (metrics) => `Payment success rate dropped to ${metrics.successRate}%`,
      severity: 'critical',
      cooldown: 15,
    },
    {
      name: 'high_refund_rate',
      condition: (metrics) => metrics.refundRate > 5, // 5% refund rate
      message: (metrics) => `Refund rate is ${metrics.refundRate}%`,
      severity: 'warning',
      cooldown: 60,
    },
    {
      name: 'webhook_failures',
      condition: (metrics) => metrics.webhookFailureRate > 1, // 1% webhook failures
      message: (metrics) => `Webhook failure rate is ${metrics.webhookFailureRate}%`,
      severity: 'critical',
      cooldown: 30,
    },
  ];

  /**
   * Initialize monitoring service
   */
  static initialize(): void {
    // Initialize structured logger
    this.logger = pino({
      level: process.env.LOG_LEVEL || 'info',
      formatters: {
        level: (label) => {
          return { level: label };
        },
      },
      base: {
        service: 'payment-system',
        environment: process.env.NODE_ENV || 'development',
      },
      timestamp: pino.stdTimeFunctions.isoTime,
    });

    // Start background metric flushing
    this.startMetricsFlushing();
    
    // Start alert checking
    this.startAlertChecking();
  }

  /**
   * Log structured payment event
   */
  static logPaymentEvent(
    eventType: string,
    data: any,
    level: 'info' | 'warn' | 'error' = 'info'
  ): void {
    const logData = {
      eventType,
      ...data,
      timestamp: new Date().toISOString(),
    };

    switch (level) {
      case 'error':
        this.logger.error(logData);
        break;
      case 'warn':
        this.logger.warn(logData);
        break;
      default:
        this.logger.info(logData);
    }
  }

  /**
   * Track performance metric
   */
  static startOperation(operationId: string): void {
    this.activeOperations.set(operationId, performance.now());
  }

  /**
   * Complete operation tracking
   */
  static endOperation(
    operationId: string,
    operation: string,
    success: boolean,
    metadata?: any
  ): void {
    const startTime = this.activeOperations.get(operationId);
    if (!startTime) {
      console.warn(`No start time found for operation ${operationId}`);
      return;
    }

    const duration = performance.now() - startTime;
    this.activeOperations.delete(operationId);

    // Record performance metric
    this.performanceBuffer.push({
      operation,
      duration,
      success,
      metadata,
    });

    // Log slow operations
    if (duration > 3000) {
      this.logger.warn({
        message: 'Slow operation detected',
        operation,
        duration,
        operationId,
        metadata,
      });
    }
  }

  /**
   * Record custom metric
   */
  static recordMetric(
    metric: string,
    value: number,
    tags: Record<string, string> = {}
  ): void {
    this.metricsBuffer.push({
      timestamp: new Date(),
      metric,
      value,
      tags,
    });
  }

  /**
   * Get real-time metrics
   */
  static async getRealTimeMetrics(): Promise<{
    payments: {
      total: number;
      succeeded: number;
      failed: number;
      processing: number;
      averageAmount: number;
      totalAmount: number;
    };
    performance: {
      avgResponseTime: number;
      p95ResponseTime: number;
      p99ResponseTime: number;
      activeOperations: number;
    };
    system: {
      uptime: number;
      memoryUsage: number;
      cpuUsage?: number;
    };
  }> {
    // Get payment metrics from last hour
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
    
    const paymentStats = await db.execute(sql`
      SELECT 
        COUNT(*) as total,
        COUNT(*) FILTER (WHERE status = 'succeeded') as succeeded,
        COUNT(*) FILTER (WHERE status = 'failed') as failed,
        COUNT(*) FILTER (WHERE status = 'processing') as processing,
        AVG(CAST(amount AS DECIMAL)) as avg_amount,
        SUM(CAST(amount AS DECIMAL)) as total_amount
      FROM payments
      WHERE created_at >= ${oneHourAgo}
    `);

    // Calculate performance metrics from buffer
    const recentPerformance = this.performanceBuffer.filter(
      p => Date.now() - p.duration < 300000 // Last 5 minutes
    );

    const durations = recentPerformance.map(p => p.duration).sort((a, b) => a - b);
    const avgResponseTime = durations.length > 0
      ? durations.reduce((a, b) => a + b, 0) / durations.length
      : 0;
    const p95ResponseTime = durations[Math.floor(durations.length * 0.95)] || 0;
    const p99ResponseTime = durations[Math.floor(durations.length * 0.99)] || 0;

    // System metrics
    const memoryUsage = process.memoryUsage();
    const uptime = process.uptime();

    return {
      payments: {
        total: Number(paymentStats.rows[0].total) || 0,
        succeeded: Number(paymentStats.rows[0].succeeded) || 0,
        failed: Number(paymentStats.rows[0].failed) || 0,
        processing: Number(paymentStats.rows[0].processing) || 0,
        averageAmount: Number(paymentStats.rows[0].avg_amount) || 0,
        totalAmount: Number(paymentStats.rows[0].total_amount) || 0,
      },
      performance: {
        avgResponseTime: Math.round(avgResponseTime),
        p95ResponseTime: Math.round(p95ResponseTime),
        p99ResponseTime: Math.round(p99ResponseTime),
        activeOperations: this.activeOperations.size,
      },
      system: {
        uptime,
        memoryUsage: Math.round(memoryUsage.heapUsed / 1024 / 1024), // MB
      },
    };
  }

  /**
   * Get historical metrics
   */
  static async getHistoricalMetrics(
    startDate: Date,
    endDate: Date,
    interval: 'hour' | 'day' | 'week' = 'hour'
  ): Promise<any> {
    const query = sql`
      SELECT 
        date_trunc(${interval}, created_at) as period,
        COUNT(*) as total_payments,
        COUNT(*) FILTER (WHERE status = 'succeeded') as successful_payments,
        COUNT(*) FILTER (WHERE status = 'failed') as failed_payments,
        AVG(CAST(amount AS DECIMAL)) as avg_amount,
        SUM(CAST(amount AS DECIMAL)) as total_amount
      FROM payments
      WHERE created_at BETWEEN ${startDate} AND ${endDate}
      GROUP BY period
      ORDER BY period DESC
    `;

    const results = await db.execute(query);
    
    return results.rows.map(row => ({
      period: row.period,
      totalPayments: Number(row.total_payments),
      successfulPayments: Number(row.successful_payments),
      failedPayments: Number(row.failed_payments),
      successRate: row.total_payments > 0
        ? (Number(row.successful_payments) / Number(row.total_payments) * 100).toFixed(2)
        : 0,
      avgAmount: Number(row.avg_amount) || 0,
      totalAmount: Number(row.total_amount) || 0,
    }));
  }

  /**
   * Check for alerts
   */
  private static async checkAlerts(): Promise<void> {
    try {
      // Get current metrics
      const metrics = await this.getCurrentMetrics();
      
      // Check each alert condition
      for (const alert of this.alerts) {
        if (alert.condition(metrics)) {
          // Check cooldown
          const lastAlert = this.lastAlertTime.get(alert.name);
          if (lastAlert) {
            const minutesSinceLastAlert = (Date.now() - lastAlert.getTime()) / 60000;
            if (minutesSinceLastAlert < alert.cooldown) {
              continue; // Skip due to cooldown
            }
          }
          
          // Trigger alert
          await this.triggerAlert(alert, metrics);
          this.lastAlertTime.set(alert.name, new Date());
        }
      }
    } catch (error) {
      this.logger.error({ message: 'Alert checking failed', error });
    }
  }

  /**
   * Get current metrics for alerting
   */
  private static async getCurrentMetrics(): Promise<any> {
    const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);
    
    const stats = await db.execute(sql`
      SELECT 
        COUNT(*) as total,
        COUNT(*) FILTER (WHERE status = 'succeeded') as succeeded,
        COUNT(*) FILTER (WHERE status = 'failed') as failed
      FROM payments
      WHERE created_at >= ${fiveMinutesAgo}
    `);

    const refundStats = await db.execute(sql`
      SELECT COUNT(*) as refund_count
      FROM refunds
      WHERE requested_at >= ${fiveMinutesAgo}
    `);

    const webhookStats = await db.execute(sql`
      SELECT 
        COUNT(*) as total,
        COUNT(*) FILTER (WHERE processed = true) as processed,
        COUNT(*) FILTER (WHERE error_message IS NOT NULL) as failed
      FROM webhook_events
      WHERE created_at >= ${fiveMinutesAgo}
    `);

    const total = Number(stats.rows[0].total) || 1; // Avoid division by zero
    const webhookTotal = Number(webhookStats.rows[0].total) || 1;
    
    // Calculate response times from performance buffer
    const recentOps = this.performanceBuffer.filter(
      p => Date.now() - p.duration < 300000
    );
    const avgResponseTime = recentOps.length > 0
      ? recentOps.reduce((sum, p) => sum + p.duration, 0) / recentOps.length
      : 0;

    return {
      total: Number(stats.rows[0].total),
      succeeded: Number(stats.rows[0].succeeded),
      failed: Number(stats.rows[0].failed),
      failureRate: (Number(stats.rows[0].failed) / total * 100).toFixed(2),
      successRate: (Number(stats.rows[0].succeeded) / total * 100).toFixed(2),
      refundCount: Number(refundStats.rows[0].refund_count),
      refundRate: (Number(refundStats.rows[0].refund_count) / total * 100).toFixed(2),
      avgResponseTime: Math.round(avgResponseTime),
      webhookFailureRate: (Number(webhookStats.rows[0].failed) / webhookTotal * 100).toFixed(2),
    };
  }

  /**
   * Trigger alert
   */
  private static async triggerAlert(alert: AlertConfig, metrics: any): Promise<void> {
    const alertData = {
      name: alert.name,
      severity: alert.severity,
      message: alert.message(metrics),
      metrics,
      timestamp: new Date().toISOString(),
    };

    // Log alert
    this.logger[alert.severity === 'critical' ? 'error' : 'warn'](alertData);
    
    // Emit event for external handlers
    this.eventEmitter.emit('alert', alertData);
    
    // In production, integrate with:
    // - PagerDuty
    // - Slack
    // - Email notifications
    // - SMS alerts for critical issues
  }

  /**
   * Start metrics flushing
   */
  private static startMetricsFlushing(): void {
    setInterval(() => {
      if (this.metricsBuffer.length > 0) {
        // In production, send to:
        // - Prometheus
        // - Datadog
        // - CloudWatch
        // - InfluxDB
        
        // For now, just clear the buffer
        this.metricsBuffer = [];
      }
      
      // Clean up old performance metrics
      this.performanceBuffer = this.performanceBuffer.filter(
        p => Date.now() - p.duration < 3600000 // Keep last hour
      );
    }, 60000); // Every minute
  }

  /**
   * Start alert checking
   */
  private static startAlertChecking(): void {
    setInterval(() => {
      this.checkAlerts();
    }, 60000); // Check every minute
  }

  /**
   * Subscribe to alerts
   */
  static onAlert(callback: (alert: any) => void): void {
    this.eventEmitter.on('alert', callback);
  }

  /**
   * Create monitoring dashboard data
   */
  static async getDashboardData(): Promise<{
    overview: any;
    recentPayments: any[];
    performanceMetrics: any;
    alerts: any[];
  }> {
    const realTimeMetrics = await this.getRealTimeMetrics();
    const historicalMetrics = await this.getHistoricalMetrics(
      new Date(Date.now() - 24 * 60 * 60 * 1000), // Last 24 hours
      new Date(),
      'hour'
    );

    // Get recent payments
    const recentPayments = await db.execute(sql`
      SELECT 
        p.id,
        p.amount,
        p.status,
        p.created_at,
        b.booking_reference,
        u.email
      FROM payments p
      JOIN bookings b ON p.booking_id = b.id
      JOIN users u ON b.user_id = u.id
      ORDER BY p.created_at DESC
      LIMIT 10
    `);

    // Get active alerts
    const activeAlerts = Array.from(this.lastAlertTime.entries())
      .filter(([name, time]) => {
        const alert = this.alerts.find(a => a.name === name);
        return alert && (Date.now() - time.getTime()) < alert.cooldown * 60000;
      })
      .map(([name, time]) => ({
        name,
        triggeredAt: time,
        alert: this.alerts.find(a => a.name === name),
      }));

    return {
      overview: realTimeMetrics,
      recentPayments: recentPayments.rows,
      performanceMetrics: historicalMetrics,
      alerts: activeAlerts,
    };
  }

  /**
   * Export monitoring data
   */
  static async exportMetrics(format: 'json' | 'csv' = 'json'): Promise<string> {
    const data = await this.getDashboardData();
    
    if (format === 'json') {
      return JSON.stringify(data, null, 2);
    } else {
      // CSV export implementation
      return 'CSV export not implemented';
    }
  }
}

// Initialize on module load
PaymentMonitoringService.initialize();