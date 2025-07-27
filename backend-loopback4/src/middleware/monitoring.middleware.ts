import {
  Middleware,
  MiddlewareContext,
  RequestContext,
  RestMiddlewareGroups,
} from '@loopback/rest';
import { inject, Provider } from '@loopback/core';
import { MonitoringService } from '../services/monitoring.service';
import { v4 as uuidv4 } from 'uuid';

export class MonitoringMiddleware implements Provider<Middleware> {
  constructor(
    @inject(RestMiddlewareGroups.CORS)
    protected middlewareGroups: string[],
  ) {}

  value(): Middleware {
    return async (ctx: MiddlewareContext, next) => {
      const { request, response } = ctx;
      const startTime = process.hrtime.bigint();
      const requestId = MonitoringService.generateRequestId();

      // Add request ID to headers
      request.headers['x-request-id'] = requestId;
      response.setHeader('x-request-id', requestId);

      // Extract request context
      const context = {
        requestId,
        method: request.method,
        path: request.path,
        ip: this.getClientIP(request),
        userAgent: request.headers['user-agent'] as string,
        userId: (request as any).user?.id,
      };

      // Log request start
      MonitoringService.info(`Request started: ${request.method} ${request.path}`, context);

      // Track sensitive endpoints
      this.checkSensitiveEndpoint(request);

      try {
        // Continue with request processing
        const result = await next();

        // Calculate duration
        const endTime = process.hrtime.bigint();
        const duration = Number(endTime - startTime) / 1000000; // Convert to milliseconds

        // Log successful request
        const responseContext = {
          ...context,
          statusCode: response.statusCode || 200,
          duration,
        };

        MonitoringService.info(
          `Request completed: ${request.method} ${request.path} - ${response.statusCode || 200} in ${duration.toFixed(2)}ms`,
          responseContext
        );

        // Track API performance
        MonitoringService.trackApiCall(request, {
          statusCode: response.statusCode || 200,
          duration,
        });

        // Record metrics
        MonitoringService.recordHistogram('http_request_duration', duration, {
          method: request.method,
          path: request.path,
          status: String(response.statusCode || 200),
        });

        MonitoringService.incrementCounter('http_requests_total', {
          method: request.method,
          path: request.path,
          status: String(response.statusCode || 200),
        });

        return result;
      } catch (error) {
        // Calculate duration
        const endTime = process.hrtime.bigint();
        const duration = Number(endTime - startTime) / 1000000;

        // Determine error status code
        const statusCode = (error as any).statusCode || 500;
        response.statusCode = statusCode;

        // Log error
        const errorContext = {
          ...context,
          statusCode,
          duration,
          error: {
            name: error.name,
            message: error.message,
            stack: process.env.NODE_ENV === 'development' ? error.stack : undefined,
          },
        };

        MonitoringService.error(
          `Request failed: ${request.method} ${request.path} - ${statusCode} in ${duration.toFixed(2)}ms`,
          error,
          errorContext
        );

        // Track error metrics
        MonitoringService.incrementCounter('http_requests_errors_total', {
          method: request.method,
          path: request.path,
          status: String(statusCode),
          error: error.name,
        });

        // Security monitoring for suspicious errors
        this.checkSuspiciousError(error, context);

        throw error;
      }
    };
  }

  private getClientIP(request: any): string {
    const forwarded = request.headers['x-forwarded-for'];
    const realIP = request.headers['x-real-ip'];
    const socketIP = request.socket?.remoteAddress;

    if (forwarded) {
      return forwarded.split(',')[0].trim();
    }
    if (realIP) {
      return realIP;
    }
    return socketIP || 'unknown';
  }

  private checkSensitiveEndpoint(request: any) {
    const sensitivePaths = [
      '/api/admin',
      '/api/payments',
      '/api/refunds',
      '/api/webhooks',
    ];

    const isSensitive = sensitivePaths.some(path => request.path.startsWith(path));

    if (isSensitive) {
      MonitoringService.logSecurityEvent({
        type: 'invalid_access',
        ip: this.getClientIP(request),
        userId: (request as any).user?.id,
        details: `Access to sensitive endpoint: ${request.method} ${request.path}`,
        severity: 'low',
        metadata: {
          path: request.path,
          method: request.method,
          headers: this.sanitizeHeaders(request.headers),
        },
      });
    }
  }

  private checkSuspiciousError(error: any, context: any) {
    const suspiciousPatterns = [
      /sql.*injection/i,
      /union.*select/i,
      /script.*alert/i,
      /\.\.\/\.\.\//,
      /etc\/passwd/,
      /cmd\.exe/,
    ];

    const errorString = JSON.stringify(error);
    const isSuspicious = suspiciousPatterns.some(pattern => pattern.test(errorString));

    if (isSuspicious) {
      MonitoringService.logSecurityEvent({
        type: 'suspicious_activity',
        ip: context.ip,
        userId: context.userId,
        details: 'Suspicious error pattern detected',
        severity: 'high',
        metadata: {
          path: context.path,
          method: context.method,
          errorMessage: error.message,
          errorType: error.name,
        },
      });
    }

    // Check for authentication failures
    if (error.statusCode === 401 || error.message.includes('authentication')) {
      MonitoringService.logSecurityEvent({
        type: 'auth_failed',
        ip: context.ip,
        userId: context.userId,
        details: 'Authentication failure',
        severity: 'medium',
        metadata: {
          path: context.path,
          method: context.method,
        },
      });
    }
  }

  private sanitizeHeaders(headers: any): any {
    const sanitized: Record<string, any> = {};
    const allowedHeaders = [
      'content-type',
      'user-agent',
      'referer',
      'origin',
      'x-forwarded-for',
      'x-real-ip',
    ];

    for (const [key, value] of Object.entries(headers)) {
      if (allowedHeaders.includes(key.toLowerCase())) {
        sanitized[key] = value;
      }
    }

    return sanitized;
  }
}

// Performance monitoring middleware
export class PerformanceMonitoringMiddleware implements Provider<Middleware> {
  value(): Middleware {
    return async (ctx: MiddlewareContext, next) => {
      const { request } = ctx;
      const timer = MonitoringService.startTimer(`api_${request.method}_${request.path}`);

      try {
        const result = await next();
        const duration = timer();

        // Log slow requests
        if (duration > 1000) {
          MonitoringService.warn(`Slow request detected: ${request.method} ${request.path} took ${duration.toFixed(2)}ms`, {
            method: request.method,
            path: request.path,
            duration,
          });
        }

        return result;
      } catch (error) {
        timer(); // Stop timer even on error
        throw error;
      }
    };
  }
}

// Payment-specific monitoring middleware
export class PaymentMonitoringMiddleware implements Provider<Middleware> {
  value(): Middleware {
    return async (ctx: MiddlewareContext, next) => {
      const { request } = ctx;

      // Only monitor payment endpoints
      if (!request.path.includes('/payments') && !request.path.includes('/refunds')) {
        return next();
      }

      const timer = MonitoringService.startTimer('payment_operation');
      const paymentContext = {
        userId: (request as any).user?.id,
        ip: this.getClientIP(request),
        path: request.path,
        method: request.method,
      };

      try {
        const result = await next();
        const duration = timer();

        // Log payment operations
        if (request.method === 'POST' && request.path.includes('create-intent')) {
          MonitoringService.logPayment({
            type: 'created',
            paymentId: result?.paymentIntentId || 'unknown',
            amount: result?.amount || 0,
            currency: 'GBP',
            metadata: {
              duration,
              ...paymentContext,
            },
          });
        }

        return result;
      } catch (error) {
        const duration = timer();

        // Log payment failures
        MonitoringService.logPayment({
          type: 'failed',
          paymentId: 'unknown',
          amount: 0,
          currency: 'GBP',
          error,
          metadata: {
            duration,
            ...paymentContext,
          },
        });

        throw error;
      }
    };
  }

  private getClientIP(request: any): string {
    const forwarded = request.headers['x-forwarded-for'];
    const realIP = request.headers['x-real-ip'];
    const socketIP = request.socket?.remoteAddress;

    if (forwarded) {
      return forwarded.split(',')[0].trim();
    }
    if (realIP) {
      return realIP;
    }
    return socketIP || 'unknown';
  }
}