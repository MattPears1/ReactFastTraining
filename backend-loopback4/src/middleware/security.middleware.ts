import {
  Middleware,
  MiddlewareContext,
  RestMiddlewareGroups,
} from '@loopback/rest';
import { inject, Provider } from '@loopback/core';
import { HttpErrors } from '@loopback/rest';
import { MonitoringService } from '../services/monitoring.service';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import slowDown from 'express-slow-down';
import { createHash, randomBytes } from 'crypto';
import validator from 'validator';

interface RateLimitConfig {
  windowMs: number;
  max: number;
  message?: string;
  keyGenerator?: (req: any) => string;
  skip?: (req: any) => boolean;
}

interface SecurityConfig {
  rateLimits: {
    global: RateLimitConfig;
    auth: RateLimitConfig;
    payment: RateLimitConfig;
    api: RateLimitConfig;
  };
  slowDown: {
    windowMs: number;
    delayAfter: number;
    delayMs: number;
    maxDelayMs: number;
  };
  csrf: {
    enabled: boolean;
    excludePaths: string[];
  };
}

// Security configuration
const SECURITY_CONFIG: SecurityConfig = {
  rateLimits: {
    global: {
      windowMs: 15 * 60 * 1000, // 15 minutes
      max: 100, // 100 requests per window
      message: 'Too many requests, please try again later',
    },
    auth: {
      windowMs: 15 * 60 * 1000, // 15 minutes
      max: 5, // 5 login attempts per window
      message: 'Too many authentication attempts, please try again later',
    },
    payment: {
      windowMs: 60 * 60 * 1000, // 1 hour
      max: 10, // 10 payment attempts per hour
      message: 'Too many payment attempts, please try again later',
    },
    api: {
      windowMs: 1 * 60 * 1000, // 1 minute
      max: 60, // 60 requests per minute
      message: 'API rate limit exceeded',
    },
  },
  slowDown: {
    windowMs: 15 * 60 * 1000, // 15 minutes
    delayAfter: 50, // Start slowing down after 50 requests
    delayMs: 100, // Add 100ms delay per request
    maxDelayMs: 2000, // Max 2 second delay
  },
  csrf: {
    enabled: true,
    excludePaths: ['/api/webhooks/stripe'], // Stripe webhooks need to be excluded
  },
};

// Rate limiting storage
const rateLimitStore = new Map<string, { count: number; resetTime: number }>();

// CSRF token storage
const csrfTokens = new Map<string, { token: string; expires: number }>();

export class SecurityMiddleware implements Provider<Middleware> {
  constructor(
    @inject(RestMiddlewareGroups.CORS)
    protected middlewareGroups: string[],
  ) {}

  value(): Middleware {
    return async (ctx: MiddlewareContext, next) => {
      const { request, response } = ctx;

      // Apply security headers
      this.applySecurityHeaders(response);

      // Check for SQL injection attempts
      if (this.detectSQLInjection(request)) {
        MonitoringService.logSecurityEvent({
          type: 'suspicious_activity',
          ip: this.getClientIP(request),
          details: 'Potential SQL injection attempt detected',
          severity: 'critical',
          metadata: {
            path: request.path,
            method: request.method,
            query: request.query,
            body: this.sanitizeBody(request.body),
          },
        });
        throw new HttpErrors.BadRequest('Invalid request parameters');
      }

      // Check for XSS attempts
      if (this.detectXSS(request)) {
        MonitoringService.logSecurityEvent({
          type: 'suspicious_activity',
          ip: this.getClientIP(request),
          details: 'Potential XSS attempt detected',
          severity: 'high',
          metadata: {
            path: request.path,
            method: request.method,
            body: this.sanitizeBody(request.body),
          },
        });
        throw new HttpErrors.BadRequest('Invalid request content');
      }

      // Check for path traversal attempts
      if (this.detectPathTraversal(request)) {
        MonitoringService.logSecurityEvent({
          type: 'suspicious_activity',
          ip: this.getClientIP(request),
          details: 'Path traversal attempt detected',
          severity: 'critical',
          metadata: {
            path: request.path,
            method: request.method,
          },
        });
        throw new HttpErrors.Forbidden('Access denied');
      }

      // Validate content type for POST/PUT requests
      if (['POST', 'PUT', 'PATCH'].includes(request.method)) {
        if (!this.isValidContentType(request)) {
          throw new HttpErrors.UnsupportedMediaType('Invalid content type');
        }
      }

      // Input validation
      this.validateInput(request);

      return next();
    };
  }

  private applySecurityHeaders(response: any) {
    // Use helmet for comprehensive security headers
    const helmetMiddleware = helmet({
      contentSecurityPolicy: {
        directives: {
          defaultSrc: ["'self'"],
          scriptSrc: ["'self'", "'unsafe-inline'", 'https://js.stripe.com'],
          styleSrc: ["'self'", "'unsafe-inline'"],
          imgSrc: ["'self'", 'data:', 'https:'],
          connectSrc: ["'self'", 'https://api.stripe.com'],
          frameSrc: ["'self'", 'https://js.stripe.com'],
          fontSrc: ["'self'"],
          objectSrc: ["'none'"],
          upgradeInsecureRequests: [],
        },
      },
      hsts: {
        maxAge: 31536000,
        includeSubDomains: true,
        preload: true,
      },
    });

    // Additional security headers
    response.setHeader('X-Content-Type-Options', 'nosniff');
    response.setHeader('X-Frame-Options', 'DENY');
    response.setHeader('X-XSS-Protection', '1; mode=block');
    response.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
    response.setHeader('Permissions-Policy', 'geolocation=(), microphone=(), camera=()');
  }

  private detectSQLInjection(request: any): boolean {
    const sqlPatterns = [
      /(\b(union|select|insert|update|delete|drop|create|alter|exec|execute)\b[\s\S]*\b(from|into|where|table)\b)/i,
      /(\b(or|and)\b[\s]*[\'\"]?[\s]*[\d]+[\s]*=[\s]*[\d]+)/i,
      /(\'|\")[\s]*;[\s]*(drop|delete|update|insert)/i,
      /(\-\-|\/\*|\*\/|xp_|sp_|@@)/i,
    ];

    const checkString = (str: string): boolean => {
      return sqlPatterns.some(pattern => pattern.test(str));
    };

    // Check URL parameters
    const queryString = JSON.stringify(request.query);
    if (checkString(queryString)) return true;

    // Check request body
    if (request.body) {
      const bodyString = JSON.stringify(request.body);
      if (checkString(bodyString)) return true;
    }

    // Check path parameters
    if (checkString(request.path)) return true;

    return false;
  }

  private detectXSS(request: any): boolean {
    const xssPatterns = [
      /<script[^>]*>[\s\S]*?<\/script>/gi,
      /<iframe[^>]*>[\s\S]*?<\/iframe>/gi,
      /javascript:/gi,
      /on\w+\s*=/gi, // Event handlers like onclick, onload, etc.
      /<img[^>]+src[\\s]*=[\\s]*["\']javascript:/gi,
      /eval\s*\(/gi,
      /expression\s*\(/gi,
    ];

    const checkString = (str: string): boolean => {
      return xssPatterns.some(pattern => pattern.test(str));
    };

    // Check request body
    if (request.body) {
      const bodyString = JSON.stringify(request.body);
      if (checkString(bodyString)) return true;
    }

    // Check query parameters
    const queryString = JSON.stringify(request.query);
    if (checkString(queryString)) return true;

    return false;
  }

  private detectPathTraversal(request: any): boolean {
    const pathPatterns = [
      /\.\.\//g,
      /\.\.\\/, 
      /%2e%2e%2f/gi,
      /%252e%252e%252f/gi,
      /\.\./,
    ];

    return pathPatterns.some(pattern => pattern.test(request.path));
  }

  private isValidContentType(request: any): boolean {
    const contentType = request.headers['content-type'];
    if (!contentType) return false;

    const allowedTypes = [
      'application/json',
      'application/x-www-form-urlencoded',
      'multipart/form-data',
    ];

    return allowedTypes.some(type => contentType.includes(type));
  }

  private validateInput(request: any) {
    if (!request.body) return;

    // Validate email fields
    this.validateEmailFields(request.body);

    // Validate monetary amounts
    this.validateMonetaryFields(request.body);

    // Validate IDs
    this.validateIdFields(request.body);

    // Check for oversized inputs
    this.checkInputSize(request.body);
  }

  private validateEmailFields(obj: any, path: string = '') {
    for (const [key, value] of Object.entries(obj)) {
      const currentPath = path ? `${path}.${key}` : key;
      
      if (key.toLowerCase().includes('email') && typeof value === 'string') {
        if (!validator.isEmail(value)) {
          throw new HttpErrors.BadRequest(`Invalid email format at ${currentPath}`);
        }
      } else if (typeof value === 'object' && value !== null) {
        this.validateEmailFields(value, currentPath);
      }
    }
  }

  private validateMonetaryFields(obj: any, path: string = '') {
    for (const [key, value] of Object.entries(obj)) {
      const currentPath = path ? `${path}.${key}` : key;
      
      if ((key.toLowerCase().includes('amount') || key.toLowerCase().includes('price')) && value !== null) {
        const numValue = Number(value);
        if (isNaN(numValue) || numValue < 0 || numValue > 999999) {
          throw new HttpErrors.BadRequest(`Invalid monetary value at ${currentPath}`);
        }
      } else if (typeof value === 'object' && value !== null) {
        this.validateMonetaryFields(value, currentPath);
      }
    }
  }

  private validateIdFields(obj: any, path: string = '') {
    for (const [key, value] of Object.entries(obj)) {
      const currentPath = path ? `${path}.${key}` : key;
      
      if (key.toLowerCase().includes('id') && typeof value === 'string') {
        // Validate UUID format
        if (!validator.isUUID(value) && !value.startsWith('pi_') && !value.startsWith('re_')) {
          throw new HttpErrors.BadRequest(`Invalid ID format at ${currentPath}`);
        }
      } else if (typeof value === 'object' && value !== null) {
        this.validateIdFields(value, currentPath);
      }
    }
  }

  private checkInputSize(obj: any, depth: number = 0) {
    if (depth > 10) {
      throw new HttpErrors.BadRequest('Request object too deeply nested');
    }

    const jsonString = JSON.stringify(obj);
    if (jsonString.length > 1024 * 1024) { // 1MB limit
      throw new HttpErrors.PayloadTooLarge('Request payload too large');
    }

    for (const value of Object.values(obj)) {
      if (typeof value === 'string' && value.length > 10000) {
        throw new HttpErrors.BadRequest('Input field too long');
      } else if (typeof value === 'object' && value !== null) {
        this.checkInputSize(value, depth + 1);
      }
    }
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

  private sanitizeBody(body: any): any {
    if (!body) return null;
    
    const sanitized = { ...body };
    const sensitiveFields = ['password', 'token', 'secret', 'apiKey', 'cardNumber', 'cvv'];
    
    const sanitizeObject = (obj: any) => {
      for (const [key, value] of Object.entries(obj)) {
        if (sensitiveFields.some(field => key.toLowerCase().includes(field))) {
          obj[key] = '[REDACTED]';
        } else if (typeof value === 'object' && value !== null) {
          sanitizeObject(value);
        }
      }
    };
    
    sanitizeObject(sanitized);
    return sanitized;
  }
}

// Rate limiting middleware
export class RateLimitingMiddleware implements Provider<Middleware> {
  private limiters: Map<string, any> = new Map();

  constructor() {
    this.setupLimiters();
  }

  private setupLimiters() {
    // Global rate limiter
    this.limiters.set('global', rateLimit({
      ...SECURITY_CONFIG.rateLimits.global,
      keyGenerator: (req) => this.getClientIP(req),
      handler: (req, res) => {
        MonitoringService.logSecurityEvent({
          type: 'rate_limit',
          ip: this.getClientIP(req),
          details: 'Global rate limit exceeded',
          severity: 'medium',
          metadata: {
            path: req.path,
            method: req.method,
          },
        });
        res.status(429).json({
          error: {
            statusCode: 429,
            name: 'TooManyRequests',
            message: SECURITY_CONFIG.rateLimits.global.message,
          },
        });
      },
    }));

    // Auth rate limiter
    this.limiters.set('auth', rateLimit({
      ...SECURITY_CONFIG.rateLimits.auth,
      keyGenerator: (req) => this.getClientIP(req),
      skip: (req) => !req.path.includes('/auth') && !req.path.includes('/login'),
      handler: (req, res) => {
        MonitoringService.logSecurityEvent({
          type: 'rate_limit',
          ip: this.getClientIP(req),
          details: 'Authentication rate limit exceeded',
          severity: 'high',
          metadata: {
            path: req.path,
            method: req.method,
          },
        });
        res.status(429).json({
          error: {
            statusCode: 429,
            name: 'TooManyRequests',
            message: SECURITY_CONFIG.rateLimits.auth.message,
          },
        });
      },
    }));

    // Payment rate limiter
    this.limiters.set('payment', rateLimit({
      ...SECURITY_CONFIG.rateLimits.payment,
      keyGenerator: (req) => {
        const userId = (req as any).user?.id;
        return userId || this.getClientIP(req);
      },
      skip: (req) => !req.path.includes('/payment'),
      handler: (req, res) => {
        MonitoringService.logSecurityEvent({
          type: 'rate_limit',
          ip: this.getClientIP(req),
          userId: (req as any).user?.id,
          details: 'Payment rate limit exceeded',
          severity: 'high',
          metadata: {
            path: req.path,
            method: req.method,
          },
        });
        res.status(429).json({
          error: {
            statusCode: 429,
            name: 'TooManyRequests',
            message: SECURITY_CONFIG.rateLimits.payment.message,
          },
        });
      },
    }));

    // API rate limiter
    this.limiters.set('api', rateLimit({
      ...SECURITY_CONFIG.rateLimits.api,
      keyGenerator: (req) => {
        const apiKey = req.headers['x-api-key'];
        return apiKey || this.getClientIP(req);
      },
      skip: (req) => !req.path.startsWith('/api'),
      handler: (req, res) => {
        MonitoringService.logSecurityEvent({
          type: 'rate_limit',
          ip: this.getClientIP(req),
          details: 'API rate limit exceeded',
          severity: 'low',
          metadata: {
            path: req.path,
            method: req.method,
          },
        });
        res.status(429).json({
          error: {
            statusCode: 429,
            name: 'TooManyRequests',
            message: SECURITY_CONFIG.rateLimits.api.message,
          },
        });
      },
    }));
  }

  value(): Middleware {
    return async (ctx: MiddlewareContext, next) => {
      const { request, response } = ctx;

      // Apply rate limiters in order
      for (const [name, limiter] of this.limiters) {
        await new Promise((resolve, reject) => {
          limiter(request, response, (err: any) => {
            if (err) reject(err);
            else resolve(undefined);
          });
        });
      }

      return next();
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

// CSRF protection middleware
export class CSRFProtectionMiddleware implements Provider<Middleware> {
  value(): Middleware {
    return async (ctx: MiddlewareContext, next) => {
      const { request, response } = ctx;

      // Skip CSRF for excluded paths
      if (SECURITY_CONFIG.csrf.excludePaths.some(path => request.path.startsWith(path))) {
        return next();
      }

      // Skip CSRF for GET requests
      if (request.method === 'GET') {
        return next();
      }

      // Generate CSRF token for authenticated users
      const userId = (request as any).user?.id;
      if (userId && request.method === 'GET') {
        const token = this.generateCSRFToken(userId);
        response.setHeader('X-CSRF-Token', token);
      }

      // Verify CSRF token for state-changing requests
      if (['POST', 'PUT', 'PATCH', 'DELETE'].includes(request.method)) {
        const token = request.headers['x-csrf-token'] as string;
        
        if (!token) {
          throw new HttpErrors.Forbidden('CSRF token missing');
        }

        if (!this.verifyCSRFToken(userId, token)) {
          MonitoringService.logSecurityEvent({
            type: 'suspicious_activity',
            ip: this.getClientIP(request),
            userId,
            details: 'Invalid CSRF token',
            severity: 'high',
            metadata: {
              path: request.path,
              method: request.method,
            },
          });
          throw new HttpErrors.Forbidden('Invalid CSRF token');
        }
      }

      return next();
    };
  }

  private generateCSRFToken(userId: string): string {
    const token = randomBytes(32).toString('hex');
    const expires = Date.now() + 24 * 60 * 60 * 1000; // 24 hours
    
    csrfTokens.set(userId, { token, expires });
    
    // Clean up expired tokens
    this.cleanupExpiredTokens();
    
    return token;
  }

  private verifyCSRFToken(userId: string, token: string): boolean {
    const storedToken = csrfTokens.get(userId);
    
    if (!storedToken) return false;
    if (storedToken.expires < Date.now()) {
      csrfTokens.delete(userId);
      return false;
    }
    
    return storedToken.token === token;
  }

  private cleanupExpiredTokens() {
    const now = Date.now();
    for (const [userId, data] of csrfTokens.entries()) {
      if (data.expires < now) {
        csrfTokens.delete(userId);
      }
    }
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

// Slow down middleware for gradual rate limiting
export class SlowDownMiddleware implements Provider<Middleware> {
  private slowDown = slowDown({
    ...SECURITY_CONFIG.slowDown,
    keyGenerator: (req) => this.getClientIP(req),
    onLimitReached: (req) => {
      MonitoringService.warn('Request slowdown limit reached', {
        ip: this.getClientIP(req),
        path: req.path,
        method: req.method,
      });
    },
  });

  value(): Middleware {
    return async (ctx: MiddlewareContext, next) => {
      const { request, response } = ctx;

      await new Promise((resolve, reject) => {
        this.slowDown(request, response, (err: any) => {
          if (err) reject(err);
          else resolve(undefined);
        });
      });

      return next();
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