import { Request, Response, NextFunction } from 'express';
import { HttpErrors } from '@loopback/rest';

interface RateLimitOptions {
  windowMs: number; // Time window in milliseconds
  maxRequests: number; // Max requests per window
  message?: string; // Custom error message
  skipSuccessfulRequests?: boolean; // Don't count successful requests
  keyGenerator?: (req: Request) => string; // Custom key generator
}

interface RateLimitStore {
  [key: string]: {
    count: number;
    resetTime: number;
  };
}

// In-memory store (replace with Redis in production)
const rateLimitStore: RateLimitStore = {};

// Clean up expired entries periodically
setInterval(() => {
  const now = Date.now();
  Object.keys(rateLimitStore).forEach(key => {
    if (rateLimitStore[key].resetTime < now) {
      delete rateLimitStore[key];
    }
  });
}, 60000); // Clean every minute

export function createRateLimiter(options: RateLimitOptions) {
  const {
    windowMs,
    maxRequests,
    message = 'Too many requests, please try again later.',
    skipSuccessfulRequests = false,
    keyGenerator = (req: Request) => {
      // Default: Use IP address as key
      return req.ip || req.socket.remoteAddress || 'unknown';
    },
  } = options;

  return async (req: Request, res: Response, next: NextFunction) => {
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
    
    // Increment counter before processing request
    if (!skipSuccessfulRequests) {
      rateLimit.count++;
    }
    
    // Set rate limit headers
    res.setHeader('X-RateLimit-Limit', maxRequests.toString());
    res.setHeader('X-RateLimit-Remaining', (maxRequests - rateLimit.count).toString());
    res.setHeader('X-RateLimit-Reset', new Date(rateLimit.resetTime).toISOString());
    
    // Handle skipSuccessfulRequests
    if (skipSuccessfulRequests) {
      const originalSend = res.send;
      res.send = function(data: any) {
        // Only increment if response indicates failure
        if (res.statusCode >= 400) {
          rateLimit.count++;
        }
        return originalSend.call(this, data);
      };
    }
    
    next();
  };
}

// Pre-configured rate limiters for auth endpoints
export const authRateLimiters = {
  // Strict limit for login attempts
  login: createRateLimiter({
    windowMs: 15 * 60 * 1000, // 15 minutes
    maxRequests: 5, // 5 attempts per 15 minutes
    message: 'Too many login attempts. Please try again later.',
    skipSuccessfulRequests: true, // Only count failed attempts
    keyGenerator: (req: Request) => {
      // Rate limit by IP + email combination
      const email = req.body?.email?.toLowerCase() || 'unknown';
      const ip = req.ip || req.socket.remoteAddress || 'unknown';
      return `login:${ip}:${email}`;
    },
  }),
  
  // Moderate limit for signup
  signup: createRateLimiter({
    windowMs: 60 * 60 * 1000, // 1 hour
    maxRequests: 3, // 3 signups per hour per IP
    message: 'Too many signup attempts. Please try again later.',
    keyGenerator: (req: Request) => {
      const ip = req.ip || req.socket.remoteAddress || 'unknown';
      return `signup:${ip}`;
    },
  }),
  
  // Moderate limit for password reset requests
  forgotPassword: createRateLimiter({
    windowMs: 60 * 60 * 1000, // 1 hour
    maxRequests: 3, // 3 reset requests per hour
    message: 'Too many password reset requests. Please try again later.',
    keyGenerator: (req: Request) => {
      const email = req.body?.email?.toLowerCase() || 'unknown';
      const ip = req.ip || req.socket.remoteAddress || 'unknown';
      return `forgot:${ip}:${email}`;
    },
  }),
  
  // General API rate limit
  general: createRateLimiter({
    windowMs: 15 * 60 * 1000, // 15 minutes
    maxRequests: 100, // 100 requests per 15 minutes
    message: 'Too many requests. Please slow down.',
  }),
};

// Helper to apply multiple rate limiters
export function applyRateLimiters(...limiters: ReturnType<typeof createRateLimiter>[]) {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      for (const limiter of limiters) {
        await new Promise<void>((resolve, reject) => {
          limiter(req, res, (err?: any) => {
            if (err) reject(err);
            else resolve();
          });
        });
      }
      next();
    } catch (error) {
      next(error);
    }
  };
}