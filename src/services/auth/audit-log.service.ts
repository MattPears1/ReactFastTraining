import { User } from '@/types/auth.types';

interface LogEntry {
  timestamp: Date;
  level: 'info' | 'warn' | 'error' | 'security';
  action: AuthAction;
  userId?: string;
  email?: string;
  ipAddress?: string;
  userAgent?: string;
  metadata?: Record<string, any>;
  success: boolean;
  errorCode?: string;
  errorMessage?: string;
}

type AuthAction = 
  | 'login_attempt'
  | 'login_success'
  | 'login_failed'
  | 'logout'
  | 'signup_attempt'
  | 'signup_success'
  | 'signup_failed'
  | 'password_reset_request'
  | 'password_reset_success'
  | 'password_reset_failed'
  | 'email_verification_success'
  | 'email_verification_failed'
  | 'session_expired'
  | 'session_refresh'
  | 'account_locked'
  | 'rate_limit_exceeded'
  | 'unauthorized_access'
  | 'csrf_token_mismatch';

/**
 * Authentication audit logging service
 * Tracks all authentication-related events for security and compliance
 */
class AuditLogService {
  private static instance: AuditLogService;
  private logs: LogEntry[] = [];
  private readonly MAX_LOGS = 1000; // Keep last 1000 logs in memory
  private readonly LOG_BATCH_SIZE = 50;
  private pendingLogs: LogEntry[] = [];
  private batchTimer: NodeJS.Timeout | null = null;

  private constructor() {
    // Set up periodic batch sending
    this.setupBatchProcessing();
    
    // Set up unload handler to send pending logs
    if (typeof window !== 'undefined') {
      window.addEventListener('beforeunload', this.flushLogs.bind(this));
    }
  }

  static getInstance(): AuditLogService {
    if (!AuditLogService.instance) {
      AuditLogService.instance = new AuditLogService();
    }
    return AuditLogService.instance;
  }

  private setupBatchProcessing(): void {
    // Send logs every 30 seconds or when batch is full
    this.batchTimer = setInterval(() => {
      this.flushLogs();
    }, 30000);
  }

  /**
   * Log an authentication event
   */
  log(entry: Omit<LogEntry, 'timestamp'>): void {
    const logEntry: LogEntry = {
      ...entry,
      timestamp: new Date(),
      ipAddress: this.getIpAddress(),
      userAgent: navigator.userAgent,
    };

    // Add to in-memory logs
    this.logs.push(logEntry);
    if (this.logs.length > this.MAX_LOGS) {
      this.logs.shift(); // Remove oldest
    }

    // Add to pending batch
    this.pendingLogs.push(logEntry);

    // Send immediately if batch is full or it's a security event
    if (
      this.pendingLogs.length >= this.LOG_BATCH_SIZE ||
      entry.level === 'security' ||
      entry.level === 'error'
    ) {
      this.flushLogs();
    }

    // Also log to console in development
    if (process.env.NODE_ENV === 'development') {
      const consoleMethod = entry.level === 'error' ? 'error' : entry.level === 'warn' ? 'warn' : 'log';
      console[consoleMethod](`[AUTH-${entry.level.toUpperCase()}]`, entry.action, entry);
    }
  }

  /**
   * Log successful login
   */
  logLogin(user: User, metadata?: Record<string, any>): void {
    this.log({
      level: 'info',
      action: 'login_success',
      userId: user.id,
      email: user.email,
      success: true,
      metadata,
    });
  }

  /**
   * Log failed login attempt
   */
  logFailedLogin(email: string, errorCode: string, metadata?: Record<string, any>): void {
    this.log({
      level: 'warn',
      action: 'login_failed',
      email,
      success: false,
      errorCode,
      metadata: {
        ...metadata,
        attemptTime: new Date().toISOString(),
      },
    });
  }

  /**
   * Log security events
   */
  logSecurityEvent(
    action: AuthAction,
    details: {
      userId?: string;
      email?: string;
      errorCode?: string;
      metadata?: Record<string, any>;
    }
  ): void {
    this.log({
      level: 'security',
      action,
      ...details,
      success: false,
    });
  }

  /**
   * Get client IP address (best effort)
   */
  private getIpAddress(): string {
    // In production, this would come from the server
    // For now, return a placeholder
    return 'client-ip';
  }

  /**
   * Send pending logs to server
   */
  private async flushLogs(): Promise<void> {
    if (this.pendingLogs.length === 0) return;

    const logsToSend = [...this.pendingLogs];
    this.pendingLogs = [];

    try {
      // Send logs to server
      await fetch('/api/auth/audit-logs', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ logs: logsToSend }),
        // Use keepalive for unload events
        keepalive: true,
      });
    } catch (error) {
      // Re-add logs to pending if send failed
      this.pendingLogs.unshift(...logsToSend);
      console.error('Failed to send audit logs:', error);
    }
  }

  /**
   * Get recent logs (for debugging)
   */
  getRecentLogs(count = 100): LogEntry[] {
    return this.logs.slice(-count);
  }

  /**
   * Get logs by action
   */
  getLogsByAction(action: AuthAction, limit = 100): LogEntry[] {
    return this.logs
      .filter(log => log.action === action)
      .slice(-limit);
  }

  /**
   * Get failed login attempts for an email
   */
  getFailedLoginAttempts(email: string, sinceMinutes = 15): number {
    const since = new Date(Date.now() - sinceMinutes * 60 * 1000);
    return this.logs.filter(
      log =>
        log.action === 'login_failed' &&
        log.email === email &&
        log.timestamp > since
    ).length;
  }

  /**
   * Export logs (for compliance/debugging)
   */
  exportLogs(): string {
    return JSON.stringify(this.logs, null, 2);
  }

  /**
   * Clear logs (for testing)
   */
  clearLogs(): void {
    this.logs = [];
    this.pendingLogs = [];
  }

  /**
   * Destroy service (cleanup)
   */
  destroy(): void {
    if (this.batchTimer) {
      clearInterval(this.batchTimer);
    }
    this.flushLogs();
  }
}

export const auditLog = AuditLogService.getInstance();

// Helper functions for common logging scenarios
export const logAuthEvent = {
  loginAttempt: (email: string) =>
    auditLog.log({
      level: 'info',
      action: 'login_attempt',
      email,
      success: false,
    }),

  loginSuccess: (user: User) =>
    auditLog.logLogin(user),

  loginFailed: (email: string, reason: string) =>
    auditLog.logFailedLogin(email, reason),

  logout: (userId: string) =>
    auditLog.log({
      level: 'info',
      action: 'logout',
      userId,
      success: true,
    }),

  signupAttempt: (email: string) =>
    auditLog.log({
      level: 'info',
      action: 'signup_attempt',
      email,
      success: false,
    }),

  signupSuccess: (user: User) =>
    auditLog.log({
      level: 'info',
      action: 'signup_success',
      userId: user.id,
      email: user.email,
      success: true,
    }),

  accountLocked: (email: string, attempts: number) =>
    auditLog.logSecurityEvent('account_locked', {
      email,
      metadata: { failedAttempts: attempts },
    }),

  rateLimitExceeded: (email: string, endpoint: string) =>
    auditLog.logSecurityEvent('rate_limit_exceeded', {
      email,
      metadata: { endpoint },
    }),

  unauthorizedAccess: (path: string, userId?: string) =>
    auditLog.logSecurityEvent('unauthorized_access', {
      userId,
      metadata: { attemptedPath: path },
    }),
};