import {
  injectable,
  Interceptor,
  InvocationContext,
  InvocationResult,
  Provider,
  ValueOrPromise,
} from '@loopback/core';
import { RestBindings } from '@loopback/rest';
import { SecurityBindings } from '@loopback/security';
import { inject } from '@loopback/context';

/**
 * Enhanced auth security interceptor with comprehensive security features
 */
@injectable({tags: {key: AuthSecurityInterceptor.BINDING_KEY}})
export class AuthSecurityInterceptor implements Provider<Interceptor> {
  static readonly BINDING_KEY = `interceptors.${AuthSecurityInterceptor.name}`;

  constructor(
    @inject(RestBindings.Http.REQUEST) private request: any,
    @inject(RestBindings.Http.RESPONSE) private response: any,
  ) {}

  value() {
    return this.intercept.bind(this);
  }

  async intercept(
    invocationCtx: InvocationContext,
    next: () => ValueOrPromise<InvocationResult>,
  ) {
    try {
      // Apply security headers
      this.applySecurityHeaders();

      // Validate request
      await this.validateRequest();

      // Check for security threats
      await this.checkSecurityThreats();

      // Add request metadata
      this.addRequestMetadata(invocationCtx);

      // Execute the method
      const result = await next();

      // Sanitize response
      return this.sanitizeResponse(result);
    } catch (error) {
      // Log security events
      this.logSecurityEvent('auth:security-error', {
        error: error.message,
        path: this.request.path,
        method: this.request.method,
      });
      throw error;
    }
  }

  private applySecurityHeaders(): void {
    const headers = {
      'X-Content-Type-Options': 'nosniff',
      'X-Frame-Options': 'DENY',
      'X-XSS-Protection': '1; mode=block',
      'Strict-Transport-Security': 'max-age=31536000; includeSubDomains',
      'Content-Security-Policy': "default-src 'self'",
      'Referrer-Policy': 'strict-origin-when-cross-origin',
      'Permissions-Policy': 'geolocation=(), microphone=(), camera=()',
    };

    Object.entries(headers).forEach(([key, value]) => {
      this.response.set(key, value);
    });

    // Auth-specific headers
    if (this.request.path.includes('/auth/')) {
      this.response.set('Cache-Control', 'no-store, no-cache, must-revalidate');
      this.response.set('Pragma', 'no-cache');
      this.response.set('Expires', '0');
    }
  }

  private async validateRequest(): Promise<void> {
    // Check content type for POST/PUT requests
    if (['POST', 'PUT', 'PATCH'].includes(this.request.method)) {
      const contentType = this.request.get('content-type');
      if (!contentType?.includes('application/json')) {
        throw new Error('Invalid content type');
      }
    }

    // Validate user agent
    const userAgent = this.request.get('user-agent');
    if (!userAgent) {
      throw new Error('Missing user agent');
    }

    // Check for suspicious headers
    const suspiciousHeaders = [
      'x-forwarded-host',
      'x-original-url',
      'x-rewrite-url',
    ];

    for (const header of suspiciousHeaders) {
      if (this.request.get(header)) {
        this.logSecurityEvent('auth:suspicious-header', {
          header,
          value: this.request.get(header),
        });
        throw new Error('Suspicious request detected');
      }
    }
  }

  private async checkSecurityThreats(): Promise<void> {
    // Check for SQL injection patterns
    const sqlInjectionPatterns = [
      /(\b(union|select|insert|update|delete|drop|create)\b)/i,
      /(--|\||;|\/\*|\*\/)/,
      /(\bor\b\s*\d+\s*=\s*\d+)/i,
    ];

    const requestData = JSON.stringify({
      body: this.request.body,
      query: this.request.query,
      params: this.request.params,
    });

    for (const pattern of sqlInjectionPatterns) {
      if (pattern.test(requestData)) {
        this.logSecurityEvent('auth:sql-injection-attempt', {
          pattern: pattern.toString(),
          path: this.request.path,
        });
        throw new Error('Invalid request data');
      }
    }

    // Check for XSS patterns
    const xssPatterns = [
      /<script[^>]*>[\s\S]*?<\/script>/gi,
      /<iframe[^>]*>[\s\S]*?<\/iframe>/gi,
      /javascript:/gi,
      /on\w+\s*=/gi,
    ];

    for (const pattern of xssPatterns) {
      if (pattern.test(requestData)) {
        this.logSecurityEvent('auth:xss-attempt', {
          pattern: pattern.toString(),
          path: this.request.path,
        });
        throw new Error('Invalid request data');
      }
    }

    // Check request size
    const maxSize = 1024 * 1024; // 1MB
    const contentLength = parseInt(this.request.get('content-length') || '0');
    if (contentLength > maxSize) {
      throw new Error('Request too large');
    }
  }

  private addRequestMetadata(invocationCtx: InvocationContext): void {
    // Add security context
    const securityContext = {
      requestId: this.generateRequestId(),
      timestamp: new Date().toISOString(),
      ip: this.getClientIp(),
      userAgent: this.request.get('user-agent'),
      method: this.request.method,
      path: this.request.path,
    };

    // Store in invocation context
    invocationCtx.bind('security.context').to(securityContext);
  }

  private sanitizeResponse(result: any): any {
    if (!result || typeof result !== 'object') {
      return result;
    }

    // Remove sensitive fields
    const sensitiveFields = [
      'password',
      'passwordHash',
      'salt',
      'token',
      'refreshToken',
      'apiKey',
      'secret',
    ];

    const sanitize = (obj: any): any => {
      if (Array.isArray(obj)) {
        return obj.map(sanitize);
      }

      if (obj && typeof obj === 'object') {
        const sanitized = { ...obj };
        
        for (const field of sensitiveFields) {
          if (field in sanitized) {
            delete sanitized[field];
          }
        }

        // Recursively sanitize nested objects
        for (const key in sanitized) {
          if (sanitized[key] && typeof sanitized[key] === 'object') {
            sanitized[key] = sanitize(sanitized[key]);
          }
        }

        return sanitized;
      }

      return obj;
    };

    return sanitize(result);
  }

  private logSecurityEvent(event: string, data: any): void {
    console.log(`[SECURITY] ${event}:`, {
      ...data,
      timestamp: new Date().toISOString(),
      ip: this.getClientIp(),
    });

    // Emit event for audit logging
    if (process.emit) {
      process.emit('security:event' as any, {
        event,
        data,
        request: {
          method: this.request.method,
          path: this.request.path,
          ip: this.getClientIp(),
        },
      });
    }
  }

  private getClientIp(): string {
    return (
      this.request.get('x-forwarded-for')?.split(',')[0] ||
      this.request.connection?.remoteAddress ||
      'unknown'
    );
  }

  private generateRequestId(): string {
    return `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
}

/**
 * Auth performance interceptor
 */
@injectable({tags: {key: AuthPerformanceInterceptor.BINDING_KEY}})
export class AuthPerformanceInterceptor implements Provider<Interceptor> {
  static readonly BINDING_KEY = `interceptors.${AuthPerformanceInterceptor.name}`;

  value() {
    return this.intercept.bind(this);
  }

  async intercept(
    invocationCtx: InvocationContext,
    next: () => ValueOrPromise<InvocationResult>,
  ) {
    const startTime = Date.now();
    const method = invocationCtx.methodName;
    const className = invocationCtx.targetClass?.name || 'Unknown';

    try {
      const result = await next();
      
      const duration = Date.now() - startTime;
      this.logPerformance(className, method, duration, true);
      
      return result;
    } catch (error) {
      const duration = Date.now() - startTime;
      this.logPerformance(className, method, duration, false);
      throw error;
    }
  }

  private logPerformance(
    className: string,
    method: string,
    duration: number,
    success: boolean,
  ): void {
    const threshold = this.getThreshold(className, method);
    const isSlowl = duration > threshold;

    if (isSlowl) {
      console.warn(`[PERFORMANCE] Slow operation detected:`, {
        class: className,
        method,
        duration: `${duration}ms`,
        threshold: `${threshold}ms`,
        success,
      });
    }

    // Emit performance event
    if (process.emit) {
      process.emit('performance:metric' as any, {
        operation: `${className}.${method}`,
        duration,
        success,
        slow: isSlowl,
      });
    }
  }

  private getThreshold(className: string, method: string): number {
    const thresholds: Record<string, number> = {
      'AuthController.login': 2000,
      'AuthController.signup': 3000,
      'AuthController.refreshToken': 500,
      'AuthController.logout': 1000,
      'UserRepository.findById': 100,
      'UserRepository.find': 500,
    };

    return thresholds[`${className}.${method}`] || 1000;
  }
}