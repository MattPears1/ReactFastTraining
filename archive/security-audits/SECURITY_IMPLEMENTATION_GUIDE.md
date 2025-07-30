# Security Implementation Guide

This guide provides code examples and implementation details for fixing the security vulnerabilities identified in the audit.

## 1. JWT Secret Configuration

### Generate Secure Secret
```bash
# Generate a cryptographically secure secret
openssl rand -base64 64

# Or using Node.js
node -e "console.log(require('crypto').randomBytes(64).toString('base64'))"
```

### Update Environment Configuration
```env
# .env.production
JWT_SECRET=YOUR_GENERATED_SECRET_HERE
JWT_REFRESH_SECRET=ANOTHER_GENERATED_SECRET_HERE
```

### Enhanced JWT Configuration
```typescript
// src/config/auth.config.ts
export const authConfig = {
  jwt: {
    secret: process.env.JWT_SECRET,
    refreshSecret: process.env.JWT_REFRESH_SECRET,
    expiresIn: '15m', // Shorter expiration for security
    refreshExpiresIn: '7d',
    issuer: 'lex-business',
    audience: 'lex-business-users',
  },
  bcrypt: {
    saltRounds: 12, // Increased from 10
  },
};
```

## 2. CSRF Protection Implementation

### Install Dependencies
```bash
npm install csurf cookie-parser
npm install --save-dev @types/csurf @types/cookie-parser
```

### Implement CSRF Middleware
```typescript
// src/middleware/csrf.ts
import csrf from 'csurf';
import { Request, Response, NextFunction } from 'express';

// Configure CSRF protection
export const csrfProtection = csrf({
  cookie: {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
  },
});

// Middleware to inject CSRF token into response
export const injectCsrfToken = (req: Request, res: Response, next: NextFunction) => {
  res.locals.csrfToken = req.csrfToken();
  next();
};

// Error handler for CSRF token errors
export const csrfErrorHandler = (err: any, req: Request, res: Response, next: NextFunction) => {
  if (err.code === 'EBADCSRFTOKEN') {
    res.status(403).json({
      error: 'Invalid CSRF token',
      message: 'Form submission rejected due to invalid security token.',
    });
  } else {
    next(err);
  }
};
```

### Apply to Routes
```typescript
// src/index.ts
import cookieParser from 'cookie-parser';
import { csrfProtection, csrfErrorHandler } from './middleware/csrf';

app.use(cookieParser());

// Apply CSRF protection to state-changing routes
app.use('/api/auth/logout', csrfProtection);
app.use('/api/auth/change-password', csrfProtection);
app.use('/api/users', csrfProtection);
app.use('/api/orders', csrfProtection);
app.use('/api/payments', csrfProtection);

// CSRF error handler
app.use(csrfErrorHandler);
```

### Frontend Integration
```typescript
// src/hooks/useCsrf.ts
export const useCsrf = () => {
  const [csrfToken, setCsrfToken] = useState<string>('');

  useEffect(() => {
    fetch('/api/csrf-token')
      .then(res => res.json())
      .then(data => setCsrfToken(data.csrfToken));
  }, []);

  return csrfToken;
};

// Include in requests
const response = await fetch('/api/auth/logout', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'CSRF-Token': csrfToken,
  },
  credentials: 'include',
});
```

## 3. SQL Injection Prevention

### Fix Analytics Store Queries
```typescript
// src/services/analytics/analytics.store.ts
export class AnalyticsStore {
  async createTables(): Promise<void> {
    // Use migrations instead of raw SQL
    // Move table creation to migrations/

    // For necessary raw queries, use parameterized queries
    const query = `
      INSERT INTO analytics_events (event_type, user_id, data)
      VALUES ($1, $2, $3)
    `;
    await this.pool.query(query, [eventType, userId, JSON.stringify(data)]);
  }

  // NEVER do this:
  // await this.pool.query(`SELECT * FROM users WHERE id = ${userId}`);
  
  // ALWAYS do this:
  async getUser(userId: string) {
    const query = 'SELECT * FROM users WHERE id = $1';
    const result = await this.pool.query(query, [userId]);
    return result.rows[0];
  }
}
```

## 4. Enhanced Security Headers

```typescript
// src/middleware/security.ts
import helmet from 'helmet';

export const securityHeaders = helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'", 'https://fonts.googleapis.com'],
      fontSrc: ["'self'", 'https://fonts.gstatic.com'],
      imgSrc: ["'self'", 'data:', 'https:', 'blob:'],
      scriptSrc: ["'self'", "'unsafe-inline'", 'https://www.google-analytics.com'],
      connectSrc: ["'self'", 'https://api.stripe.com', 'wss://'],
      frameSrc: ["'none'"],
      objectSrc: ["'none'"],
      upgradeInsecureRequests: [],
    },
  },
  hsts: {
    maxAge: 31536000,
    includeSubDomains: true,
    preload: true,
  },
  referrerPolicy: { policy: 'strict-origin-when-cross-origin' },
  permittedCrossDomainPolicies: false,
});

// Additional security headers
export const additionalSecurityHeaders = (req: Request, res: Response, next: NextFunction) => {
  res.setHeader('X-Permitted-Cross-Domain-Policies', 'none');
  res.setHeader('Expect-CT', 'enforce, max-age=86400');
  res.setHeader('Feature-Policy', "camera 'none'; microphone 'none'; geolocation 'self'");
  next();
};
```

## 5. Session Management

```typescript
// src/middleware/session.ts
import session from 'express-session';
import connectRedis from 'connect-redis';
import { redisClient } from '../config/redis';

const RedisStore = connectRedis(session);

export const sessionConfig = session({
  store: new RedisStore({ client: redisClient }),
  secret: process.env.SESSION_SECRET!,
  resave: false,
  saveUninitialized: false,
  rolling: true, // Reset expiry on activity
  cookie: {
    secure: process.env.NODE_ENV === 'production',
    httpOnly: true,
    maxAge: 30 * 60 * 1000, // 30 minutes
    sameSite: 'strict',
  },
  name: 'sessionId', // Don't use default name
});

// Session invalidation on password change
export const invalidateUserSessions = async (userId: string) => {
  const sessions = await redisClient.keys(`sess:*`);
  
  for (const sessionKey of sessions) {
    const sessionData = await redisClient.get(sessionKey);
    if (sessionData) {
      const session = JSON.parse(sessionData);
      if (session.userId === userId) {
        await redisClient.del(sessionKey);
      }
    }
  }
};
```

## 6. Token Blacklisting

```typescript
// src/services/auth/token-blacklist.service.ts
export class TokenBlacklistService {
  private readonly PREFIX = 'blacklist:';

  async blacklistToken(token: string, expiresIn: number): Promise<void> {
    const decoded = jwt.decode(token) as any;
    const key = `${this.PREFIX}${decoded.jti}`; // JWT ID
    
    await redisClient.setex(key, expiresIn, '1');
  }

  async isBlacklisted(token: string): Promise<boolean> {
    const decoded = jwt.decode(token) as any;
    const key = `${this.PREFIX}${decoded.jti}`;
    
    const result = await redisClient.get(key);
    return result === '1';
  }
}

// Update auth middleware
export const authenticate = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    
    if (!token) {
      throw new ApiError(401, 'Access token required');
    }

    // Check if token is blacklisted
    const isBlacklisted = await tokenBlacklistService.isBlacklisted(token);
    if (isBlacklisted) {
      throw new ApiError(401, 'Token has been revoked');
    }

    // Continue with existing validation...
  } catch (error) {
    // Handle errors...
  }
};
```

## 7. Two-Factor Authentication

```typescript
// src/services/auth/two-factor.service.ts
import speakeasy from 'speakeasy';
import QRCode from 'qrcode';

export class TwoFactorService {
  generateSecret(user: User): speakeasy.GeneratedSecret {
    return speakeasy.generateSecret({
      name: `LexBusiness (${user.email})`,
      issuer: 'LexBusiness',
      length: 32,
    });
  }

  async generateQRCode(secret: speakeasy.GeneratedSecret): Promise<string> {
    return QRCode.toDataURL(secret.otpauth_url!);
  }

  verifyToken(secret: string, token: string): boolean {
    return speakeasy.totp.verify({
      secret,
      encoding: 'base32',
      token,
      window: 2, // Allow 2 time steps tolerance
    });
  }

  generateBackupCodes(): string[] {
    const codes: string[] = [];
    for (let i = 0; i < 10; i++) {
      codes.push(crypto.randomBytes(4).toString('hex').toUpperCase());
    }
    return codes;
  }
}
```

## 8. Enhanced File Upload Security

```typescript
// src/services/file-upload/content-validator.ts
import fileType from 'file-type';
import isSvg from 'is-svg';
import sharp from 'sharp';

export class ContentValidator {
  async validateFileContent(buffer: Buffer, expectedMimeType: string): Promise<boolean> {
    const type = await fileType.fromBuffer(buffer);
    
    if (!type) {
      // Check for text-based files
      if (expectedMimeType.startsWith('text/')) {
        return this.isValidTextFile(buffer, expectedMimeType);
      }
      return false;
    }

    // Special handling for SVG
    if (expectedMimeType === 'image/svg+xml') {
      return this.isValidSvg(buffer);
    }

    return type.mime === expectedMimeType;
  }

  private isValidSvg(buffer: Buffer): boolean {
    const content = buffer.toString();
    
    // Check for malicious content
    const dangerousPatterns = [
      /<script/i,
      /javascript:/i,
      /on\w+\s*=/i, // Event handlers
      /<iframe/i,
      /<object/i,
      /<embed/i,
    ];

    if (dangerousPatterns.some(pattern => pattern.test(content))) {
      return false;
    }

    return isSvg(content);
  }

  async sanitizeImage(buffer: Buffer): Promise<Buffer> {
    // Re-encode image to remove any embedded malicious content
    return sharp(buffer)
      .rotate() // Auto-rotate based on EXIF
      .withMetadata({
        // Strip all metadata except basic
        orientation: undefined,
      })
      .toBuffer();
  }
}
```

## 9. Rate Limiting Enhancement

```typescript
// src/middleware/rate-limiter.ts
import rateLimit from 'express-rate-limit';
import RedisStore from 'rate-limit-redis';
import { redisClient } from '../config/redis';

// Different limits for different endpoints
export const rateLimiters = {
  general: rateLimit({
    store: new RedisStore({ client: redisClient }),
    windowMs: 15 * 60 * 1000,
    max: 100,
    message: 'Too many requests',
    standardHeaders: true,
    legacyHeaders: false,
  }),

  auth: rateLimit({
    store: new RedisStore({ client: redisClient }),
    windowMs: 15 * 60 * 1000,
    max: 5,
    skipSuccessfulRequests: true, // Don't count successful logins
    message: 'Too many authentication attempts',
  }),

  api: rateLimit({
    store: new RedisStore({ client: redisClient }),
    windowMs: 1 * 60 * 1000,
    max: 60,
    keyGenerator: (req) => {
      // Rate limit per user if authenticated
      return req.user?.id || req.ip;
    },
  }),

  upload: rateLimit({
    store: new RedisStore({ client: redisClient }),
    windowMs: 60 * 60 * 1000,
    max: 20,
    message: 'Upload limit exceeded',
  }),
};
```

## 10. Security Monitoring

```typescript
// src/services/security/security-monitor.ts
export class SecurityMonitor {
  private readonly events = {
    FAILED_LOGIN: 'security.failed_login',
    SUSPICIOUS_ACTIVITY: 'security.suspicious_activity',
    PERMISSION_DENIED: 'security.permission_denied',
    INVALID_TOKEN: 'security.invalid_token',
    CSRF_VIOLATION: 'security.csrf_violation',
    RATE_LIMIT_EXCEEDED: 'security.rate_limit_exceeded',
  };

  async logSecurityEvent(
    eventType: string,
    userId: string | null,
    ipAddress: string,
    details: any
  ): Promise<void> {
    const event = {
      type: eventType,
      userId,
      ipAddress,
      timestamp: new Date(),
      details,
      userAgent: details.userAgent,
    };

    // Log to database
    await AuditLog.create(event);

    // Alert on critical events
    if (this.isCriticalEvent(eventType)) {
      await this.sendSecurityAlert(event);
    }

    // Check for patterns
    await this.analyzeSecurityPatterns(userId, ipAddress);
  }

  private async analyzeSecurityPatterns(
    userId: string | null,
    ipAddress: string
  ): Promise<void> {
    const recentEvents = await this.getRecentEvents(userId, ipAddress);
    
    // Detect brute force attempts
    const failedLogins = recentEvents.filter(
      e => e.type === this.events.FAILED_LOGIN
    );
    
    if (failedLogins.length > 10) {
      await this.blockIpAddress(ipAddress);
      await this.sendSecurityAlert({
        type: 'BRUTE_FORCE_DETECTED',
        ipAddress,
        attemptCount: failedLogins.length,
      });
    }
  }

  private async blockIpAddress(ip: string): Promise<void> {
    await redisClient.setex(`blocked:${ip}`, 86400, '1'); // 24 hour block
  }
}
```

## Implementation Priority

1. **Day 1**: JWT secret, CSRF protection, SQL injection fixes
2. **Day 2-3**: Security headers, session management, token blacklisting
3. **Week 1**: 2FA implementation, file upload security, enhanced rate limiting
4. **Week 2**: Security monitoring, dependency updates, testing

## Testing Security Implementations

```bash
# Run security tests
npm run test:security

# Check for vulnerabilities
npm audit
npm audit fix

# OWASP dependency check
npm install -g owasp-dependency-check
dependency-check --scan ./

# Run static analysis
npm install -g snyk
snyk test
```

## Security Checklist for Developers

- [ ] Never commit secrets or credentials
- [ ] Always use parameterized queries
- [ ] Validate all user input
- [ ] Use HTTPS in production
- [ ] Keep dependencies updated
- [ ] Test for security vulnerabilities
- [ ] Review security headers
- [ ] Implement proper error handling
- [ ] Use secure session management
- [ ] Enable security monitoring