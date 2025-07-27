import winston from 'winston';
import DailyRotateFile from 'winston-daily-rotate-file';
import { Request } from '@loopback/rest';
import * as os from 'os';
import * as path from 'path';

interface LogContext {
  userId?: string;
  requestId?: string;
  ip?: string;
  userAgent?: string;
  method?: string;
  path?: string;
  statusCode?: number;
  duration?: number;
  error?: any;
  metadata?: Record<string, any>;
}

interface MetricData {
  name: string;
  value: number;
  tags?: Record<string, string>;
  timestamp?: Date;
}

interface PerformanceMetrics {
  paymentProcessing: {
    total: number;
    successful: number;
    failed: number;
    averageTime: number;
    p95Time: number;
    p99Time: number;
  };
  invoiceGeneration: {
    total: number;
    successful: number;
    failed: number;
    averageTime: number;
  };
  refundProcessing: {
    requested: number;
    approved: number;
    rejected: number;
    processed: number;
    averageApprovalTime: number;
  };
  apiEndpoints: Record<string, {
    calls: number;
    errors: number;
    averageResponseTime: number;
    lastError?: string;
  }>;
}

export class MonitoringService {
  private static logger: winston.Logger;
  private static metricsBuffer: MetricData[] = [];
  private static performanceMetrics: PerformanceMetrics = {
    paymentProcessing: {
      total: 0,
      successful: 0,
      failed: 0,
      averageTime: 0,
      p95Time: 0,
      p99Time: 0,
    },
    invoiceGeneration: {
      total: 0,
      successful: 0,
      failed: 0,
      averageTime: 0,
    },
    refundProcessing: {
      requested: 0,
      approved: 0,
      rejected: 0,
      processed: 0,
      averageApprovalTime: 0,
    },
    apiEndpoints: {},
  };
  private static timings: Map<string, number[]> = new Map();

  static initialize() {
    const logDir = process.env.LOG_DIR || path.join(process.cwd(), 'logs');

    // Create custom format
    const customFormat = winston.format.combine(
      winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss.SSS' }),
      winston.format.errors({ stack: true }),
      winston.format.json(),
      winston.format.printf(({ timestamp, level, message, ...meta }) => {
        const logEntry = {
          timestamp,
          level,
          message,
          ...meta,
          environment: process.env.NODE_ENV || 'development',
          hostname: os.hostname(),
          pid: process.pid,
        };
        return JSON.stringify(logEntry);
      })
    );

    // Configure transports
    const transports: winston.transport[] = [
      // Console transport for development
      new winston.transports.Console({
        format: winston.format.combine(
          winston.format.colorize(),
          winston.format.simple()
        ),
        level: process.env.NODE_ENV === 'production' ? 'info' : 'debug',
      }),
    ];

    // File transports for production
    if (process.env.NODE_ENV === 'production') {
      // Error logs
      transports.push(
        new DailyRotateFile({
          filename: path.join(logDir, 'error-%DATE%.log'),
          datePattern: 'YYYY-MM-DD',
          level: 'error',
          maxSize: '20m',
          maxFiles: '30d',
          format: customFormat,
        })
      );

      // Combined logs
      transports.push(
        new DailyRotateFile({
          filename: path.join(logDir, 'combined-%DATE%.log'),
          datePattern: 'YYYY-MM-DD',
          maxSize: '20m',
          maxFiles: '14d',
          format: customFormat,
        })
      );

      // Payment specific logs
      transports.push(
        new DailyRotateFile({
          filename: path.join(logDir, 'payments-%DATE%.log'),
          datePattern: 'YYYY-MM-DD',
          maxSize: '20m',
          maxFiles: '90d', // Keep payment logs longer
          format: customFormat,
          filter: (info) => info.category === 'payment',
        })
      );

      // Security logs
      transports.push(
        new DailyRotateFile({
          filename: path.join(logDir, 'security-%DATE%.log'),
          datePattern: 'YYYY-MM-DD',
          maxSize: '20m',
          maxFiles: '90d',
          format: customFormat,
          filter: (info) => info.category === 'security',
        })
      );
    }

    // Create logger instance
    this.logger = winston.createLogger({
      level: process.env.LOG_LEVEL || 'info',
      format: customFormat,
      transports,
      exceptionHandlers: [
        new winston.transports.File({ 
          filename: path.join(logDir, 'exceptions.log') 
        }),
      ],
      rejectionHandlers: [
        new winston.transports.File({ 
          filename: path.join(logDir, 'rejections.log') 
        }),
      ],
    });

    // Start metrics flushing
    this.startMetricsFlush();

    console.log('Monitoring service initialized');
  }

  // Logging methods

  static info(message: string, context?: LogContext) {
    this.logger.info(message, this.enrichContext(context));
  }

  static warn(message: string, context?: LogContext) {
    this.logger.warn(message, this.enrichContext(context));
  }

  static error(message: string, error?: Error | any, context?: LogContext) {
    const errorContext = {
      ...this.enrichContext(context),
      error: this.serializeError(error),
      category: 'error',
    };
    this.logger.error(message, errorContext);
  }

  static debug(message: string, context?: LogContext) {
    this.logger.debug(message, this.enrichContext(context));
  }

  // Payment logging

  static logPayment(event: {
    type: 'created' | 'succeeded' | 'failed' | 'refunded';
    paymentId: string;
    amount: number;
    currency: string;
    bookingId?: string;
    customerId?: string;
    error?: any;
    metadata?: Record<string, any>;
  }) {
    const context: LogContext = {
      category: 'payment',
      paymentId: event.paymentId,
      eventType: event.type,
      amount: event.amount,
      currency: event.currency,
      bookingId: event.bookingId,
      customerId: event.customerId,
      metadata: event.metadata,
    };

    if (event.error) {
      context.error = this.serializeError(event.error);
    }

    const message = `Payment ${event.type}: ${event.paymentId} - ${event.currency} ${event.amount}`;
    
    if (event.type === 'failed') {
      this.error(message, event.error, context);
    } else {
      this.info(message, context);
    }

    // Update metrics
    this.performanceMetrics.paymentProcessing.total++;
    if (event.type === 'succeeded') {
      this.performanceMetrics.paymentProcessing.successful++;
    } else if (event.type === 'failed') {
      this.performanceMetrics.paymentProcessing.failed++;
    }
  }

  // Security logging

  static logSecurityEvent(event: {
    type: 'auth_failed' | 'suspicious_activity' | 'rate_limit' | 'invalid_access' | 'data_breach_attempt';
    userId?: string;
    ip?: string;
    details: string;
    severity: 'low' | 'medium' | 'high' | 'critical';
    metadata?: Record<string, any>;
  }) {
    const context: LogContext = {
      category: 'security',
      eventType: event.type,
      severity: event.severity,
      userId: event.userId,
      ip: event.ip,
      metadata: event.metadata,
    };

    const message = `Security Event [${event.severity.toUpperCase()}]: ${event.type} - ${event.details}`;
    
    if (event.severity === 'critical' || event.severity === 'high') {
      this.error(message, undefined, context);
      // TODO: Send alert to admin
    } else {
      this.warn(message, context);
    }
  }

  // Performance tracking

  static startTimer(operation: string): () => number {
    const startTime = process.hrtime.bigint();
    
    return () => {
      const endTime = process.hrtime.bigint();
      const duration = Number(endTime - startTime) / 1000000; // Convert to milliseconds
      
      // Store timing
      if (!this.timings.has(operation)) {
        this.timings.set(operation, []);
      }
      this.timings.get(operation)!.push(duration);
      
      // Keep only last 1000 timings per operation
      const timings = this.timings.get(operation)!;
      if (timings.length > 1000) {
        timings.shift();
      }
      
      return duration;
    };
  }

  static trackApiCall(request: Request, response: any) {
    const path = request.path;
    const method = request.method;
    const statusCode = response.statusCode || 200;
    const duration = response.duration || 0;
    const key = `${method} ${path}`;

    if (!this.performanceMetrics.apiEndpoints[key]) {
      this.performanceMetrics.apiEndpoints[key] = {
        calls: 0,
        errors: 0,
        averageResponseTime: 0,
      };
    }

    const endpoint = this.performanceMetrics.apiEndpoints[key];
    endpoint.calls++;
    
    if (statusCode >= 400) {
      endpoint.errors++;
      endpoint.lastError = `${statusCode} at ${new Date().toISOString()}`;
    }

    // Update average response time
    endpoint.averageResponseTime = 
      (endpoint.averageResponseTime * (endpoint.calls - 1) + duration) / endpoint.calls;

    // Log slow requests
    if (duration > 1000) {
      this.warn(`Slow API request: ${key} took ${duration}ms`, {
        method,
        path,
        statusCode,
        duration,
      });
    }
  }

  // Metrics collection

  static recordMetric(metric: MetricData) {
    this.metricsBuffer.push({
      ...metric,
      timestamp: metric.timestamp || new Date(),
    });

    // Flush if buffer is getting large
    if (this.metricsBuffer.length > 100) {
      this.flushMetrics();
    }
  }

  static incrementCounter(name: string, tags?: Record<string, string>) {
    this.recordMetric({
      name,
      value: 1,
      tags,
    });
  }

  static recordGauge(name: string, value: number, tags?: Record<string, string>) {
    this.recordMetric({
      name,
      value,
      tags,
    });
  }

  static recordHistogram(name: string, value: number, tags?: Record<string, string>) {
    this.recordMetric({
      name: `${name}.histogram`,
      value,
      tags,
    });
  }

  // Get metrics

  static getMetrics(): PerformanceMetrics {
    // Calculate percentiles for payment processing
    const paymentTimings = this.timings.get('payment_processing') || [];
    if (paymentTimings.length > 0) {
      const sorted = [...paymentTimings].sort((a, b) => a - b);
      const p95Index = Math.floor(sorted.length * 0.95);
      const p99Index = Math.floor(sorted.length * 0.99);
      
      this.performanceMetrics.paymentProcessing.p95Time = sorted[p95Index] || 0;
      this.performanceMetrics.paymentProcessing.p99Time = sorted[p99Index] || 0;
    }

    return { ...this.performanceMetrics };
  }

  static getHealthStatus(): {
    status: 'healthy' | 'degraded' | 'unhealthy';
    checks: Record<string, boolean>;
    metrics: {
      errorRate: number;
      averageResponseTime: number;
      paymentSuccessRate: number;
    };
  } {
    const totalApiCalls = Object.values(this.performanceMetrics.apiEndpoints)
      .reduce((sum, endpoint) => sum + endpoint.calls, 0);
    
    const totalApiErrors = Object.values(this.performanceMetrics.apiEndpoints)
      .reduce((sum, endpoint) => sum + endpoint.errors, 0);
    
    const errorRate = totalApiCalls > 0 ? (totalApiErrors / totalApiCalls) * 100 : 0;
    
    const averageResponseTime = Object.values(this.performanceMetrics.apiEndpoints)
      .reduce((sum, endpoint) => sum + endpoint.averageResponseTime * endpoint.calls, 0) / 
      (totalApiCalls || 1);
    
    const paymentSuccessRate = this.performanceMetrics.paymentProcessing.total > 0
      ? (this.performanceMetrics.paymentProcessing.successful / this.performanceMetrics.paymentProcessing.total) * 100
      : 100;

    const checks = {
      errorRateAcceptable: errorRate < 5,
      responseTimeAcceptable: averageResponseTime < 500,
      paymentSuccessRateAcceptable: paymentSuccessRate > 95,
      recentErrors: !this.hasRecentCriticalErrors(),
    };

    const healthyChecks = Object.values(checks).filter(Boolean).length;
    const status = healthyChecks === 4 ? 'healthy' : 
                  healthyChecks >= 2 ? 'degraded' : 'unhealthy';

    return {
      status,
      checks,
      metrics: {
        errorRate: Number(errorRate.toFixed(2)),
        averageResponseTime: Number(averageResponseTime.toFixed(2)),
        paymentSuccessRate: Number(paymentSuccessRate.toFixed(2)),
      },
    };
  }

  // Helper methods

  private static enrichContext(context?: LogContext): any {
    return {
      ...context,
      timestamp: new Date().toISOString(),
      environment: process.env.NODE_ENV || 'development',
      service: 'payment-system',
      version: process.env.APP_VERSION || '1.0.0',
    };
  }

  private static serializeError(error: any): any {
    if (!error) return null;
    
    if (error instanceof Error) {
      return {
        name: error.name,
        message: error.message,
        stack: error.stack,
        ...error,
      };
    }
    
    return error;
  }

  private static startMetricsFlush() {
    // Flush metrics every 30 seconds
    setInterval(() => {
      this.flushMetrics();
    }, 30000);
  }

  private static flushMetrics() {
    if (this.metricsBuffer.length === 0) return;

    // In production, send to metrics service
    if (process.env.NODE_ENV === 'production') {
      // TODO: Send to CloudWatch, DataDog, etc.
      console.log(`Flushing ${this.metricsBuffer.length} metrics`);
    }

    // Clear buffer
    this.metricsBuffer = [];
  }

  private static hasRecentCriticalErrors(): boolean {
    // Check if there were critical errors in the last 5 minutes
    // This would typically check recent logs
    return false;
  }

  // Request ID generation
  static generateRequestId(): string {
    return `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  // Audit logging
  static logAuditEvent(event: {
    action: string;
    userId: string;
    targetType: 'payment' | 'refund' | 'invoice' | 'user' | 'booking';
    targetId: string;
    changes?: Record<string, { old: any; new: any }>;
    result: 'success' | 'failure';
    metadata?: Record<string, any>;
  }) {
    const context: LogContext = {
      category: 'audit',
      userId: event.userId,
      action: event.action,
      targetType: event.targetType,
      targetId: event.targetId,
      result: event.result,
      changes: event.changes,
      metadata: event.metadata,
    };

    const message = `Audit: ${event.action} on ${event.targetType}:${event.targetId} by user:${event.userId} - ${event.result}`;
    this.info(message, context);
  }
}

// Initialize on module load
MonitoringService.initialize();