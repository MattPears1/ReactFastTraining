import {HttpErrors} from '@loopback/rest';
import {v4 as uuid} from 'uuid';

export enum ErrorSeverity {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  CRITICAL = 'critical',
}

export enum ErrorCategory {
  VALIDATION = 'validation',
  AUTHENTICATION = 'authentication',
  AUTHORIZATION = 'authorization',
  DATABASE = 'database',
  PAYMENT = 'payment',
  EXTERNAL_API = 'external_api',
  BUSINESS_LOGIC = 'business_logic',
  SYSTEM = 'system',
}

export interface ErrorContext {
  userId?: string;
  sessionId?: string;
  bookingId?: string;
  requestId?: string;
  action?: string;
  metadata?: Record<string, any>;
}

export interface ErrorDetails {
  id: string;
  timestamp: Date;
  category: ErrorCategory;
  severity: ErrorSeverity;
  message: string;
  stack?: string;
  context: ErrorContext;
  httpStatus?: number;
  originalError?: any;
  resolution?: string;
}

export interface ErrorMetrics {
  totalErrors: number;
  errorsByCategory: Record<ErrorCategory, number>;
  errorsBySeverity: Record<ErrorSeverity, number>;
  errorRate: number;
  lastError?: Date;
}

export class ErrorHandlerService {
  private errorLog: ErrorDetails[] = [];
  private errorMetrics: ErrorMetrics = {
    totalErrors: 0,
    errorsByCategory: {} as Record<ErrorCategory, number>,
    errorsBySeverity: {} as Record<ErrorSeverity, number>,
    errorRate: 0,
  };
  private monitoringCallbacks: ((error: ErrorDetails) => void)[] = [];
  private errorRateWindow = 60000; // 1 minute window for error rate calculation
  private recentErrors: { timestamp: number }[] = [];

  handleError(
    error: Error | HttpErrors.HttpError,
    context: ErrorContext = {},
    category?: ErrorCategory
  ): ErrorDetails {
    const errorDetails = this.createErrorDetails(error, context, category);
    
    // Log error
    this.logError(errorDetails);
    
    // Update metrics
    this.updateMetrics(errorDetails);
    
    // Notify monitoring systems
    this.notifyMonitoring(errorDetails);
    
    // Check for critical patterns
    this.checkCriticalPatterns(errorDetails);
    
    return errorDetails;
  }

  private createErrorDetails(
    error: Error | HttpErrors.HttpError,
    context: ErrorContext,
    category?: ErrorCategory
  ): ErrorDetails {
    const id = uuid();
    const timestamp = new Date();
    
    // Determine category if not provided
    if (!category) {
      category = this.determineErrorCategory(error);
    }
    
    // Determine severity
    const severity = this.determineErrorSeverity(error, category);
    
    // Get HTTP status if available
    const httpStatus = (error as HttpErrors.HttpError).statusCode || 500;
    
    // Create error details
    const errorDetails: ErrorDetails = {
      id,
      timestamp,
      category,
      severity,
      message: this.sanitizeErrorMessage(error.message),
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined,
      context: {
        ...context,
        requestId: context.requestId || id,
      },
      httpStatus,
      originalError: process.env.NODE_ENV === 'development' ? error : undefined,
      resolution: this.suggestResolution(error, category),
    };
    
    return errorDetails;
  }

  private determineErrorCategory(error: Error | HttpErrors.HttpError): ErrorCategory {
    const errorMessage = error.message.toLowerCase();
    const errorName = error.name.toLowerCase();
    
    if (errorName.includes('validation') || errorMessage.includes('validation')) {
      return ErrorCategory.VALIDATION;
    }
    
    if (errorName.includes('unauthorized') || errorMessage.includes('unauthorized')) {
      return ErrorCategory.AUTHENTICATION;
    }
    
    if (errorName.includes('forbidden') || errorMessage.includes('forbidden')) {
      return ErrorCategory.AUTHORIZATION;
    }
    
    if (errorMessage.includes('database') || errorMessage.includes('postgres') || 
        errorMessage.includes('sql')) {
      return ErrorCategory.DATABASE;
    }
    
    if (errorMessage.includes('payment') || errorMessage.includes('stripe')) {
      return ErrorCategory.PAYMENT;
    }
    
    if (errorMessage.includes('api') || errorMessage.includes('external')) {
      return ErrorCategory.EXTERNAL_API;
    }
    
    if (error instanceof HttpErrors.HttpError) {
      const status = error.statusCode;
      if (status >= 400 && status < 500) {
        return ErrorCategory.BUSINESS_LOGIC;
      }
    }
    
    return ErrorCategory.SYSTEM;
  }

  private determineErrorSeverity(
    error: Error | HttpErrors.HttpError,
    category: ErrorCategory
  ): ErrorSeverity {
    // Critical errors
    if (category === ErrorCategory.PAYMENT && error.message.includes('failed')) {
      return ErrorSeverity.CRITICAL;
    }
    
    if (category === ErrorCategory.DATABASE && error.message.includes('connection')) {
      return ErrorSeverity.CRITICAL;
    }
    
    if (error instanceof HttpErrors.HttpError) {
      const status = error.statusCode;
      if (status >= 500) {
        return ErrorSeverity.HIGH;
      }
      if (status >= 400 && status < 500) {
        return ErrorSeverity.MEDIUM;
      }
    }
    
    // High severity
    if (category === ErrorCategory.AUTHENTICATION || 
        category === ErrorCategory.AUTHORIZATION) {
      return ErrorSeverity.HIGH;
    }
    
    // Medium severity
    if (category === ErrorCategory.VALIDATION || 
        category === ErrorCategory.BUSINESS_LOGIC) {
      return ErrorSeverity.MEDIUM;
    }
    
    // Default to medium
    return ErrorSeverity.MEDIUM;
  }

  private sanitizeErrorMessage(message: string): string {
    // Remove sensitive information from error messages
    const sensitivePatterns = [
      /password=[\w]+/gi,
      /token=[\w]+/gi,
      /api[_-]?key=[\w]+/gi,
      /secret=[\w]+/gi,
      /\b\d{4}[\s-]?\d{4}[\s-]?\d{4}[\s-]?\d{4}\b/g, // Credit card numbers
      /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g, // Email addresses
    ];
    
    let sanitized = message;
    sensitivePatterns.forEach(pattern => {
      sanitized = sanitized.replace(pattern, '[REDACTED]');
    });
    
    return sanitized;
  }

  private suggestResolution(error: Error, category: ErrorCategory): string {
    const resolutions: Record<ErrorCategory, string> = {
      [ErrorCategory.VALIDATION]: 'Check input data format and required fields',
      [ErrorCategory.AUTHENTICATION]: 'Verify credentials and login again',
      [ErrorCategory.AUTHORIZATION]: 'Check user permissions for this action',
      [ErrorCategory.DATABASE]: 'Database connection issue - retry in a few moments',
      [ErrorCategory.PAYMENT]: 'Payment processing issue - verify payment details',
      [ErrorCategory.EXTERNAL_API]: 'External service issue - retry later',
      [ErrorCategory.BUSINESS_LOGIC]: 'Check business rules and constraints',
      [ErrorCategory.SYSTEM]: 'System error - contact support if persists',
    };
    
    return resolutions[category] || 'Unexpected error - please try again';
  }

  private logError(errorDetails: ErrorDetails): void {
    // Add to in-memory log (limited size)
    this.errorLog.unshift(errorDetails);
    if (this.errorLog.length > 1000) {
      this.errorLog = this.errorLog.slice(0, 1000);
    }
    
    // Log to console with appropriate level
    const logLevel = this.getLogLevel(errorDetails.severity);
    console[logLevel](`[${errorDetails.category}] ${errorDetails.message}`, {
      id: errorDetails.id,
      context: errorDetails.context,
      severity: errorDetails.severity,
    });
  }

  private getLogLevel(severity: ErrorSeverity): 'error' | 'warn' | 'info' {
    switch (severity) {
      case ErrorSeverity.CRITICAL:
      case ErrorSeverity.HIGH:
        return 'error';
      case ErrorSeverity.MEDIUM:
        return 'warn';
      default:
        return 'info';
    }
  }

  private updateMetrics(errorDetails: ErrorDetails): void {
    // Update total count
    this.errorMetrics.totalErrors++;
    
    // Update category count
    if (!this.errorMetrics.errorsByCategory[errorDetails.category]) {
      this.errorMetrics.errorsByCategory[errorDetails.category] = 0;
    }
    this.errorMetrics.errorsByCategory[errorDetails.category]++;
    
    // Update severity count
    if (!this.errorMetrics.errorsBySeverity[errorDetails.severity]) {
      this.errorMetrics.errorsBySeverity[errorDetails.severity] = 0;
    }
    this.errorMetrics.errorsBySeverity[errorDetails.severity]++;
    
    // Update error rate
    const now = Date.now();
    this.recentErrors.push({ timestamp: now });
    
    // Remove errors outside the window
    this.recentErrors = this.recentErrors.filter(
      e => now - e.timestamp < this.errorRateWindow
    );
    
    // Calculate error rate (errors per minute)
    this.errorMetrics.errorRate = this.recentErrors.length;
    this.errorMetrics.lastError = errorDetails.timestamp;
  }

  private notifyMonitoring(errorDetails: ErrorDetails): void {
    // Notify all registered monitoring callbacks
    this.monitoringCallbacks.forEach(callback => {
      try {
        callback(errorDetails);
      } catch (err) {
        console.error('Error in monitoring callback:', err);
      }
    });
  }

  private checkCriticalPatterns(errorDetails: ErrorDetails): void {
    // Check for error rate spike
    if (this.errorMetrics.errorRate > 50) {
      this.triggerAlert({
        type: 'error_rate_spike',
        message: `Error rate spike detected: ${this.errorMetrics.errorRate} errors/minute`,
        severity: ErrorSeverity.CRITICAL,
      });
    }
    
    // Check for repeated critical errors
    const recentCriticalErrors = this.errorLog
      .slice(0, 10)
      .filter(e => e.severity === ErrorSeverity.CRITICAL);
    
    if (recentCriticalErrors.length >= 3) {
      this.triggerAlert({
        type: 'repeated_critical_errors',
        message: `Multiple critical errors detected: ${recentCriticalErrors.length} in recent logs`,
        severity: ErrorSeverity.CRITICAL,
      });
    }
    
    // Check for database connection issues
    const dbErrors = this.errorLog
      .slice(0, 20)
      .filter(e => e.category === ErrorCategory.DATABASE);
    
    if (dbErrors.length >= 5) {
      this.triggerAlert({
        type: 'database_issues',
        message: 'Multiple database errors detected',
        severity: ErrorSeverity.HIGH,
      });
    }
  }

  private triggerAlert(alert: {
    type: string;
    message: string;
    severity: ErrorSeverity;
  }): void {
    console.error(`[ALERT] ${alert.type}: ${alert.message}`);
    // In production, this would send alerts to monitoring services
  }

  // Public methods for monitoring integration
  onError(callback: (error: ErrorDetails) => void): () => void {
    this.monitoringCallbacks.push(callback);
    
    // Return unsubscribe function
    return () => {
      const index = this.monitoringCallbacks.indexOf(callback);
      if (index > -1) {
        this.monitoringCallbacks.splice(index, 1);
      }
    };
  }

  getMetrics(): ErrorMetrics {
    return { ...this.errorMetrics };
  }

  getRecentErrors(limit: number = 10): ErrorDetails[] {
    return this.errorLog.slice(0, limit);
  }

  getErrorsByCategory(category: ErrorCategory, limit: number = 10): ErrorDetails[] {
    return this.errorLog
      .filter(e => e.category === category)
      .slice(0, limit);
  }

  getErrorsBySeverity(severity: ErrorSeverity, limit: number = 10): ErrorDetails[] {
    return this.errorLog
      .filter(e => e.severity === severity)
      .slice(0, limit);
  }

  clearMetrics(): void {
    this.errorMetrics = {
      totalErrors: 0,
      errorsByCategory: {} as Record<ErrorCategory, number>,
      errorsBySeverity: {} as Record<ErrorSeverity, number>,
      errorRate: 0,
    };
    this.recentErrors = [];
  }
}

// Singleton instance
export const errorHandler = new ErrorHandlerService();