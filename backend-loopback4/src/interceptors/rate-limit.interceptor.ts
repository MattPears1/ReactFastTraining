import {
  injectable,
  Interceptor,
  InvocationContext,
  InvocationResult,
  Provider,
  ValueOrPromise,
} from '@loopback/core';
import {RestBindings, Request, HttpErrors} from '@loopback/rest';

interface RateLimitOptions {
  windowMs: number;
  maxRequests: number;
  message?: string;
  skipSuccessfulRequests?: boolean;
  keyGenerator?: (req: Request) => string;
}

interface RateLimitStore {
  [key: string]: {
    count: number;
    resetTime: number;
  };
}

// In-memory store for rate limiting
const rateLimitStore: RateLimitStore = {};

// Clean up expired entries
setInterval(() => {
  const now = Date.now();
  Object.keys(rateLimitStore).forEach(key => {
    if (rateLimitStore[key].resetTime < now) {
      delete rateLimitStore[key];
    }
  });
}, 60000);

/**
 * Rate limiting interceptor for LoopBack 4
 */
@injectable({tags: {key: RateLimitInterceptor.BINDING_KEY}})
export class RateLimitInterceptor implements Provider<Interceptor> {
  static readonly BINDING_KEY = `interceptors.${RateLimitInterceptor.name}`;

  constructor(private options: RateLimitOptions) {}

  value() {
    return this.intercept.bind(this);
  }

  async intercept(
    invocationCtx: InvocationContext,
    next: () => ValueOrPromise<InvocationResult>,
  ): Promise<InvocationResult> {
    const {
      windowMs,
      maxRequests,
      message = 'Too many requests, please try again later.',
      skipSuccessfulRequests = false,
      keyGenerator = (req: Request) => req.ip || 'unknown',
    } = this.options;

    const req = await invocationCtx.get(RestBindings.Http.REQUEST);
    const res = await invocationCtx.get(RestBindings.Http.RESPONSE);
    
    const key = keyGenerator(req);
    const now = Date.now();
    
    // Get or create rate limit entry
    if (!rateLimitStore[key] || rateLimitStore[key].resetTime < now) {
      rateLimitStore[key] = {
        count: 0,
        resetTime: now + windowMs,
      };
    }
    
    const rateLimit = rateLimitStore[key];
    
    // Check if limit exceeded
    if (rateLimit.count >= maxRequests) {
      const retryAfter = Math.ceil((rateLimit.resetTime - now) / 1000);
      
      res.setHeader('X-RateLimit-Limit', maxRequests.toString());
      res.setHeader('X-RateLimit-Remaining', '0');
      res.setHeader('X-RateLimit-Reset', new Date(rateLimit.resetTime).toISOString());
      res.setHeader('Retry-After', retryAfter.toString());
      
      throw new HttpErrors.TooManyRequests(message);
    }
    
    // Increment counter
    if (!skipSuccessfulRequests) {
      rateLimit.count++;
    }
    
    // Set headers
    res.setHeader('X-RateLimit-Limit', maxRequests.toString());
    res.setHeader('X-RateLimit-Remaining', (maxRequests - rateLimit.count).toString());
    res.setHeader('X-RateLimit-Reset', new Date(rateLimit.resetTime).toISOString());
    
    try {
      const result = await next();
      return result;
    } catch (error) {
      // If skipSuccessfulRequests is true, increment on error
      if (skipSuccessfulRequests && rateLimit.count < maxRequests) {
        rateLimit.count++;
      }
      throw error;
    }
  }
}

// Factory functions for specific rate limiters
export function createLoginRateLimiter() {
  return new RateLimitInterceptor({
    windowMs: 15 * 60 * 1000, // 15 minutes
    maxRequests: 5,
    message: 'Too many login attempts. Please try again later.',
    skipSuccessfulRequests: true,
    keyGenerator: (req: Request) => {
      const email = req.body?.email?.toLowerCase() || 'unknown';
      const ip = req.ip || 'unknown';
      return `login:${ip}:${email}`;
    },
  });
}

export function createSignupRateLimiter() {
  return new RateLimitInterceptor({
    windowMs: 60 * 60 * 1000, // 1 hour
    maxRequests: 3,
    message: 'Too many signup attempts. Please try again later.',
    keyGenerator: (req: Request) => `signup:${req.ip || 'unknown'}`,
  });
}

export function createPasswordResetRateLimiter() {
  return new RateLimitInterceptor({
    windowMs: 60 * 60 * 1000, // 1 hour
    maxRequests: 3,
    message: 'Too many password reset requests. Please try again later.',
    keyGenerator: (req: Request) => {
      const email = req.body?.email?.toLowerCase() || 'unknown';
      const ip = req.ip || 'unknown';
      return `forgot:${ip}:${email}`;
    },
  });
}