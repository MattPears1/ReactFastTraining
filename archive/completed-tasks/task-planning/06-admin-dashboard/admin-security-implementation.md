# Admin Dashboard Security Implementation Guide

## Overview
This document outlines the comprehensive security measures for the React Fast Training admin dashboard, ensuring protection against common attack vectors and maintaining data integrity.

## 1. Authentication System

### Multi-Factor Authentication (MFA)
```typescript
// backend-loopback4/src/services/admin-auth.service.ts
import speakeasy from 'speakeasy';
import QRCode from 'qrcode';

export class AdminAuthService {
  static async setupMFA(adminId: string) {
    const secret = speakeasy.generateSecret({
      name: `React Fast Training Admin (${adminId})`,
      issuer: 'React Fast Training',
      length: 32,
    });

    // Store encrypted secret
    await db
      .update(admins)
      .set({
        mfaSecret: encrypt(secret.base32),
        mfaEnabled: false, // Enable after verification
      })
      .where(eq(admins.id, adminId));

    // Generate QR code
    const qrCodeUrl = await QRCode.toDataURL(secret.otpauth_url);
    
    return {
      secret: secret.base32,
      qrCode: qrCodeUrl,
    };
  }

  static async verifyMFA(adminId: string, token: string) {
    const admin = await db
      .select()
      .from(admins)
      .where(eq(admins.id, adminId))
      .limit(1);

    if (!admin[0]?.mfaSecret) {
      throw new Error('MFA not configured');
    }

    const secret = decrypt(admin[0].mfaSecret);
    const verified = speakeasy.totp.verify({
      secret,
      encoding: 'base32',
      token,
      window: 2, // Allow 2 time windows for clock drift
    });

    if (!verified) {
      // Log failed attempt
      await this.logFailedMFA(adminId);
      throw new Error('Invalid MFA token');
    }

    return true;
  }

  private static async logFailedMFA(adminId: string) {
    await db.insert(securityLogs).values({
      type: 'mfa_failed',
      adminId,
      timestamp: new Date(),
      metadata: { attempts: sql`attempts + 1` },
    });

    // Check for brute force
    const recentFailures = await db
      .select({ count: count() })
      .from(securityLogs)
      .where(
        and(
          eq(securityLogs.adminId, adminId),
          eq(securityLogs.type, 'mfa_failed'),
          gte(securityLogs.timestamp, new Date(Date.now() - 15 * 60 * 1000))
        )
      );

    if (recentFailures[0].count >= 5) {
      await this.lockAccount(adminId, 'Too many failed MFA attempts');
    }
  }
}
```

### Session Management
```typescript
// Secure session configuration
export const sessionConfig = {
  secret: process.env.SESSION_SECRET!,
  name: 'admin.sid',
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: true, // HTTPS only
    httpOnly: true, // No JS access
    sameSite: 'strict', // CSRF protection
    maxAge: 4 * 60 * 60 * 1000, // 4 hours
    domain: '.reactfasttraining.co.uk',
  },
  store: new RedisStore({
    client: redis,
    prefix: 'admin:sess:',
    ttl: 4 * 60 * 60, // 4 hours
  }),
};

// Session validation middleware
export const validateAdminSession = async (req: Request, res: Response, next: Next) => {
  if (!req.session?.adminId) {
    return res.status(401).json({ error: 'No session' });
  }

  // Check session validity
  const session = await redis.get(`admin:sess:${req.sessionID}`);
  if (!session) {
    return res.status(401).json({ error: 'Invalid session' });
  }

  // Verify IP hasn't changed (optional but recommended)
  const sessionData = JSON.parse(session);
  if (sessionData.ip !== req.ip) {
    await this.terminateSession(req.sessionID);
    return res.status(401).json({ error: 'Session hijacking detected' });
  }

  // Extend session on activity
  req.session.touch();
  next();
};
```

## 2. Authorization System

### Role-Based Access Control (RBAC)
```typescript
// Permission definitions
export const AdminPermissions = {
  // Dashboard
  DASHBOARD_VIEW: 'dashboard:view',
  DASHBOARD_EXPORT: 'dashboard:export',
  
  // Bookings
  BOOKINGS_VIEW: 'bookings:view',
  BOOKINGS_EDIT: 'bookings:edit',
  BOOKINGS_CANCEL: 'bookings:cancel',
  BOOKINGS_REFUND: 'bookings:refund',
  
  // Calendar
  CALENDAR_VIEW: 'calendar:view',
  CALENDAR_EDIT: 'calendar:edit',
  CALENDAR_CREATE: 'calendar:create',
  CALENDAR_DELETE: 'calendar:delete',
  
  // Clients
  CLIENTS_VIEW: 'clients:view',
  CLIENTS_EDIT: 'clients:edit',
  CLIENTS_EXPORT: 'clients:export',
  CLIENTS_EMAIL: 'clients:email',
  
  // System
  SYSTEM_AUDIT: 'system:audit',
  SYSTEM_SETTINGS: 'system:settings',
  ADMIN_MANAGE: 'admin:manage',
} as const;

// Role definitions
export const AdminRoles = {
  SUPER_ADMIN: {
    name: 'Super Admin',
    permissions: Object.values(AdminPermissions),
  },
  ADMIN: {
    name: 'Admin',
    permissions: [
      AdminPermissions.DASHBOARD_VIEW,
      AdminPermissions.BOOKINGS_VIEW,
      AdminPermissions.BOOKINGS_EDIT,
      AdminPermissions.CALENDAR_VIEW,
      AdminPermissions.CALENDAR_EDIT,
      AdminPermissions.CLIENTS_VIEW,
      AdminPermissions.CLIENTS_EMAIL,
    ],
  },
  MANAGER: {
    name: 'Manager',
    permissions: [
      AdminPermissions.DASHBOARD_VIEW,
      AdminPermissions.BOOKINGS_VIEW,
      AdminPermissions.CALENDAR_VIEW,
      AdminPermissions.CLIENTS_VIEW,
    ],
  },
  VIEWER: {
    name: 'Viewer',
    permissions: [
      AdminPermissions.DASHBOARD_VIEW,
      AdminPermissions.BOOKINGS_VIEW,
      AdminPermissions.CALENDAR_VIEW,
    ],
  },
};

// Permission checking middleware
export const requirePermission = (permission: string) => {
  return async (req: AdminRequest, res: Response, next: Next) => {
    const admin = req.admin;
    
    if (!admin) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    // Super admins bypass all checks
    if (admin.role === 'SUPER_ADMIN') {
      return next();
    }

    const hasPermission = await adminService.checkPermission(admin.id, permission);
    
    if (!hasPermission) {
      // Log unauthorized attempt
      await auditService.log({
        adminId: admin.id,
        action: 'unauthorized_access',
        resource: permission,
        ip: req.ip,
        userAgent: req.get('user-agent'),
      });
      
      return res.status(403).json({ error: 'Insufficient permissions' });
    }

    next();
  };
};
```

### Attribute-Based Access Control (ABAC)
```typescript
// Dynamic permission policies
interface AccessPolicy {
  resource: string;
  conditions: {
    timeRange?: { start: string; end: string };
    locations?: string[];
    dataAge?: { maxDays: number };
    customRules?: ((admin: Admin, resource: any) => boolean)[];
  };
}

export class AccessControlService {
  static async checkAccess(
    admin: Admin,
    resource: string,
    resourceData: any
  ): Promise<boolean> {
    // Get applicable policies
    const policies = await this.getPoliciesForAdmin(admin.id);
    
    for (const policy of policies) {
      if (policy.resource !== resource) continue;
      
      // Check time-based access
      if (policy.conditions.timeRange) {
        const now = new Date();
        const currentTime = format(now, 'HH:mm');
        if (
          currentTime < policy.conditions.timeRange.start ||
          currentTime > policy.conditions.timeRange.end
        ) {
          return false;
        }
      }
      
      // Check location-based access
      if (policy.conditions.locations && resourceData.location) {
        if (!policy.conditions.locations.includes(resourceData.location)) {
          return false;
        }
      }
      
      // Check data age restrictions
      if (policy.conditions.dataAge && resourceData.createdAt) {
        const daysSinceCreation = differenceInDays(
          new Date(),
          new Date(resourceData.createdAt)
        );
        if (daysSinceCreation > policy.conditions.dataAge.maxDays) {
          return false;
        }
      }
      
      // Apply custom rules
      if (policy.conditions.customRules) {
        for (const rule of policy.conditions.customRules) {
          if (!rule(admin, resourceData)) {
            return false;
          }
        }
      }
    }
    
    return true;
  }
}
```

## 3. Input Validation and Sanitization

### Request Validation Middleware
```typescript
import { body, param, query, validationResult } from 'express-validator';
import DOMPurify from 'isomorphic-dompurify';

// Validation schemas
export const adminValidations = {
  updateBooking: [
    param('id').isUUID().withMessage('Invalid booking ID'),
    body('status')
      .isIn(['confirmed', 'cancelled', 'completed'])
      .withMessage('Invalid status'),
    body('notes')
      .optional()
      .isString()
      .isLength({ max: 1000 })
      .customSanitizer((value) => DOMPurify.sanitize(value)),
  ],
  
  searchClients: [
    query('search')
      .optional()
      .isString()
      .isLength({ min: 2, max: 100 })
      .customSanitizer((value) => value.replace(/[<>]/g, '')),
    query('page').optional().isInt({ min: 1 }),
    query('limit').optional().isInt({ min: 10, max: 100 }),
  ],
  
  rescheduleSession: [
    param('id').isUUID(),
    body('date').isISO8601().toDate(),
    body('startTime').matches(/^([01]\d|2[0-3]):([0-5]\d)$/),
    body('endTime').matches(/^([01]\d|2[0-3]):([0-5]\d)$/),
    body('reason').isString().isLength({ min: 10, max: 500 }),
  ],
};

// Validation error handler
export const handleValidationErrors = (req: Request, res: Response, next: Next) => {
  const errors = validationResult(req);
  
  if (!errors.isEmpty()) {
    // Log validation failures
    auditService.log({
      action: 'validation_failed',
      adminId: req.admin?.id,
      errors: errors.array(),
      ip: req.ip,
    });
    
    return res.status(400).json({
      error: 'Validation failed',
      details: errors.array(),
    });
  }
  
  next();
};
```

### SQL Injection Prevention
```typescript
// Safe query builder wrapper
export class SafeQueryBuilder {
  static async findBookings(filters: BookingFilters) {
    let query = db
      .select()
      .from(bookings)
      .innerJoin(users, eq(bookings.userId, users.id))
      .innerJoin(courseSessions, eq(bookings.sessionId, courseSessions.id));

    // Safe parameter binding
    if (filters.status) {
      // Whitelist allowed statuses
      const allowedStatuses = ['confirmed', 'pending', 'cancelled', 'completed'];
      if (allowedStatuses.includes(filters.status)) {
        query = query.where(eq(bookings.status, filters.status));
      }
    }

    if (filters.dateFrom && filters.dateTo) {
      // Validate dates
      const fromDate = new Date(filters.dateFrom);
      const toDate = new Date(filters.dateTo);
      
      if (isValid(fromDate) && isValid(toDate)) {
        query = query.where(
          and(
            gte(bookings.createdAt, fromDate),
            lte(bookings.createdAt, toDate)
          )
        );
      }
    }

    if (filters.search) {
      // Escape special characters for LIKE queries
      const searchTerm = filters.search
        .replace(/[%_\\]/g, '\\$&')
        .substring(0, 100); // Limit length
      
      query = query.where(
        or(
          ilike(users.name, `%${searchTerm}%`),
          ilike(users.email, `%${searchTerm}%`),
          ilike(bookings.bookingReference, `%${searchTerm}%`)
        )
      );
    }

    return await query.limit(1000); // Always limit results
  }
}
```

## 4. Audit Trail System

### Comprehensive Audit Logging
```typescript
interface AuditEntry {
  id: string;
  timestamp: Date;
  adminId: string;
  adminEmail: string;
  action: string;
  resource: string;
  resourceId?: string;
  changes?: {
    field: string;
    oldValue: any;
    newValue: any;
  }[];
  metadata: {
    ip: string;
    userAgent: string;
    sessionId: string;
    requestId: string;
  };
  risk: 'low' | 'medium' | 'high' | 'critical';
}

export class AuditService {
  private static riskActions = {
    critical: ['delete_session', 'bulk_refund', 'admin_create', 'permission_change'],
    high: ['session_reschedule', 'booking_cancel', 'client_export'],
    medium: ['booking_edit', 'client_email', 'note_add'],
    low: ['view', 'search', 'filter'],
  };

  static async logAction(params: {
    req: AdminRequest;
    action: string;
    resource: string;
    resourceId?: string;
    previousData?: any;
    newData?: any;
  }) {
    const { req, action, resource, resourceId, previousData, newData } = params;
    
    // Calculate risk level
    const risk = this.calculateRisk(action);
    
    // Extract changes
    const changes = previousData && newData
      ? this.extractChanges(previousData, newData)
      : undefined;

    const entry: AuditEntry = {
      id: generateId(),
      timestamp: new Date(),
      adminId: req.admin.id,
      adminEmail: req.admin.email,
      action,
      resource,
      resourceId,
      changes,
      metadata: {
        ip: req.ip || 'unknown',
        userAgent: req.get('user-agent') || 'unknown',
        sessionId: req.sessionID,
        requestId: req.id,
      },
      risk,
    };

    // Store in database
    await db.insert(auditLogs).values(entry);

    // Alert on high-risk actions
    if (risk === 'critical' || risk === 'high') {
      await this.alertSecurityTeam(entry);
    }

    // Real-time audit stream for monitoring
    await this.streamToMonitoring(entry);
  }

  private static calculateRisk(action: string): AuditEntry['risk'] {
    for (const [risk, actions] of Object.entries(this.riskActions)) {
      if (actions.includes(action)) {
        return risk as AuditEntry['risk'];
      }
    }
    return 'low';
  }

  private static extractChanges(oldData: any, newData: any) {
    const changes = [];
    const allKeys = new Set([
      ...Object.keys(oldData),
      ...Object.keys(newData),
    ]);

    for (const key of allKeys) {
      if (oldData[key] !== newData[key]) {
        changes.push({
          field: key,
          oldValue: oldData[key],
          newValue: newData[key],
        });
      }
    }

    return changes;
  }

  static async getAuditTrail(filters: {
    adminId?: string;
    resource?: string;
    action?: string;
    dateFrom?: Date;
    dateTo?: Date;
    risk?: string[];
  }) {
    let query = db.select().from(auditLogs);

    if (filters.adminId) {
      query = query.where(eq(auditLogs.adminId, filters.adminId));
    }

    if (filters.resource) {
      query = query.where(eq(auditLogs.resource, filters.resource));
    }

    if (filters.risk?.length) {
      query = query.where(inArray(auditLogs.risk, filters.risk));
    }

    return await query.orderBy(desc(auditLogs.timestamp)).limit(1000);
  }
}
```

## 5. API Security

### Rate Limiting
```typescript
import rateLimit from 'express-rate-limit';
import RedisStore from 'rate-limit-redis';

// Different limits for different operations
export const rateLimiters = {
  // General API limit
  general: rateLimit({
    store: new RedisStore({
      client: redis,
      prefix: 'rl:admin:general:',
    }),
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // 100 requests per window
    message: 'Too many requests',
    standardHeaders: true,
    legacyHeaders: false,
  }),

  // Strict limit for sensitive operations
  sensitive: rateLimit({
    store: new RedisStore({
      client: redis,
      prefix: 'rl:admin:sensitive:',
    }),
    windowMs: 60 * 60 * 1000, // 1 hour
    max: 10, // 10 requests per hour
    message: 'Too many sensitive operations',
    skip: (req) => req.admin?.role === 'SUPER_ADMIN',
  }),

  // Export operations
  export: rateLimit({
    store: new RedisStore({
      client: redis,
      prefix: 'rl:admin:export:',
    }),
    windowMs: 60 * 60 * 1000, // 1 hour
    max: 5, // 5 exports per hour
    message: 'Export limit exceeded',
  }),

  // Login attempts
  login: rateLimit({
    store: new RedisStore({
      client: redis,
      prefix: 'rl:admin:login:',
    }),
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 5, // 5 attempts per window
    message: 'Too many login attempts',
    skipSuccessfulRequests: true,
    keyGenerator: (req) => req.body?.email || req.ip,
  }),
};
```

### CORS Configuration
```typescript
export const corsOptions: CorsOptions = {
  origin: (origin, callback) => {
    const allowedOrigins = [
      'https://admin.reactfasttraining.co.uk',
      'https://reactfasttraining.co.uk',
    ];

    // Development origins
    if (process.env.NODE_ENV === 'development') {
      allowedOrigins.push('http://localhost:3000', 'http://localhost:5173');
    }

    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-CSRF-Token'],
  exposedHeaders: ['X-Total-Count', 'X-Page-Count'],
  maxAge: 86400, // 24 hours
};
```

## 6. Frontend Security

### Content Security Policy
```typescript
// Strict CSP for admin panel
export const adminCSP = {
  directives: {
    defaultSrc: ["'self'"],
    scriptSrc: [
      "'self'",
      "'nonce-{NONCE}'", // Generate per request
      "https://www.google.com/recaptcha/", // If using reCAPTCHA
    ],
    styleSrc: ["'self'", "'unsafe-inline'"], // For Tailwind
    imgSrc: ["'self'", "data:", "https:"],
    fontSrc: ["'self'"],
    connectSrc: [
      "'self'",
      "https://api.reactfasttraining.co.uk",
      "wss://admin.reactfasttraining.co.uk", // WebSocket
    ],
    formAction: ["'self'"],
    frameAncestors: ["'none'"],
    objectSrc: ["'none'"],
    upgradeInsecureRequests: [],
  },
  reportUri: '/api/csp-report',
};

// Apply CSP middleware
app.use((req, res, next) => {
  const nonce = crypto.randomBytes(16).toString('base64');
  res.locals.nonce = nonce;
  
  const cspString = Object.entries(adminCSP.directives)
    .map(([key, values]) => {
      const directive = key.replace(/([A-Z])/g, '-$1').toLowerCase();
      const value = values
        .join(' ')
        .replace('{NONCE}', nonce);
      return `${directive} ${value}`;
    })
    .join('; ');
  
  res.setHeader('Content-Security-Policy', cspString);
  next();
});
```

### XSS Protection
```typescript
// React component with XSS protection
import DOMPurify from 'dompurify';

export const SafeHTMLDisplay: React.FC<{ html: string }> = ({ html }) => {
  const sanitized = useMemo(() => 
    DOMPurify.sanitize(html, {
      ALLOWED_TAGS: ['b', 'i', 'em', 'strong', 'p', 'br'],
      ALLOWED_ATTR: [],
    }),
    [html]
  );

  return <div dangerouslySetInnerHTML={{ __html: sanitized }} />;
};

// Input sanitization hook
export const useSanitizedInput = (initialValue = '') => {
  const [value, setValue] = useState(initialValue);
  
  const handleChange = useCallback((e: ChangeEvent<HTMLInputElement>) => {
    // Remove potentially dangerous characters
    const sanitized = e.target.value
      .replace(/[<>]/g, '')
      .substring(0, 1000); // Limit length
    
    setValue(sanitized);
  }, []);
  
  return [value, handleChange] as const;
};
```

## 7. Security Monitoring

### Real-time Threat Detection
```typescript
export class SecurityMonitor {
  private static suspiciousPatterns = [
    /union\s+select/i,
    /drop\s+table/i,
    /script\s*>/i,
    /<iframe/i,
    /javascript:/i,
  ];

  static async checkRequest(req: AdminRequest) {
    const threats = [];

    // Check request body
    const bodyStr = JSON.stringify(req.body);
    for (const pattern of this.suspiciousPatterns) {
      if (pattern.test(bodyStr)) {
        threats.push({
          type: 'suspicious_pattern',
          pattern: pattern.toString(),
          location: 'body',
        });
      }
    }

    // Check unusual access patterns
    const recentRequests = await this.getRecentRequests(req.admin.id);
    if (recentRequests.count > 1000) {
      threats.push({
        type: 'unusual_activity',
        detail: 'High request volume',
      });
    }

    // Check geographic anomalies
    const location = await this.getGeoLocation(req.ip);
    const usualLocations = await this.getUsualLocations(req.admin.id);
    
    if (!this.isLocationNormal(location, usualLocations)) {
      threats.push({
        type: 'geographic_anomaly',
        detail: `Unusual location: ${location.country}`,
      });
    }

    if (threats.length > 0) {
      await this.alertSecurityTeam({
        adminId: req.admin.id,
        threats,
        request: {
          path: req.path,
          method: req.method,
          ip: req.ip,
        },
      });
    }

    return threats;
  }
}
```

## 8. Secure Development Practices

### Environment Variables
```typescript
// Validate required environment variables
const requiredEnvVars = [
  'JWT_SECRET',
  'SESSION_SECRET',
  'DATABASE_URL',
  'REDIS_URL',
  'ENCRYPTION_KEY',
  'ADMIN_URL',
  'API_URL',
];

for (const envVar of requiredEnvVars) {
  if (!process.env[envVar]) {
    throw new Error(`Missing required environment variable: ${envVar}`);
  }
}

// Secure configuration
export const securityConfig = {
  jwt: {
    secret: process.env.JWT_SECRET!,
    expiresIn: '4h',
    refreshExpiresIn: '7d',
  },
  encryption: {
    algorithm: 'aes-256-gcm',
    key: Buffer.from(process.env.ENCRYPTION_KEY!, 'hex'),
  },
  passwords: {
    minLength: 12,
    requireUppercase: true,
    requireLowercase: true,
    requireNumbers: true,
    requireSymbols: true,
    preventCommon: true,
  },
  session: {
    secret: process.env.SESSION_SECRET!,
    maxAge: 4 * 60 * 60 * 1000, // 4 hours
    secure: process.env.NODE_ENV === 'production',
  },
};
```

### Security Headers
```typescript
import helmet from 'helmet';

app.use(helmet({
  contentSecurityPolicy: adminCSP,
  hsts: {
    maxAge: 31536000,
    includeSubDomains: true,
    preload: true,
  },
  noSniff: true,
  xssFilter: true,
  referrerPolicy: { policy: 'strict-origin-when-cross-origin' },
  permittedCrossDomainPolicies: false,
}));

// Additional security headers
app.use((req, res, next) => {
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('Permissions-Policy', 'geolocation=(), microphone=(), camera=()');
  res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, private');
  next();
});
```

## 9. Incident Response

### Security Incident Handler
```typescript
export class SecurityIncidentHandler {
  static async handleIncident(incident: SecurityIncident) {
    // 1. Immediate containment
    if (incident.severity === 'critical') {
      await this.lockdownSystem();
    }

    // 2. Preserve evidence
    await this.preserveEvidence(incident);

    // 3. Alert stakeholders
    await this.notifyStakeholders(incident);

    // 4. Begin investigation
    const investigation = await this.startInvestigation(incident);

    // 5. Remediate
    await this.remediate(incident, investigation);

    // 6. Document
    await this.documentIncident(incident, investigation);

    // 7. Post-incident review
    await this.scheduleReview(incident);
  }

  private static async lockdownSystem() {
    // Disable all admin accounts except super admin
    await db
      .update(admins)
      .set({ isActive: false })
      .where(ne(admins.role, 'SUPER_ADMIN'));

    // Clear all sessions
    await redis.flushdb();

    // Enable maintenance mode
    await this.enableMaintenanceMode();
  }
}
```

## Conclusion

This comprehensive security implementation ensures the React Fast Training admin dashboard is protected against common and advanced threats. Regular security audits, penetration testing, and staying updated with security best practices are essential for maintaining this security posture.