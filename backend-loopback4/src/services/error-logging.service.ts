import {injectable, BindingScope} from '@loopback/core';
import {repository} from '@loopback/repository';
import {CourseRepository} from '../repositories';

export enum ErrorLevel {
  INFO = 'INFO',
  WARNING = 'WARNING',
  ERROR = 'ERROR',
  CRITICAL = 'CRITICAL'
}

export enum ErrorCategory {
  BOOKING = 'booking',
  PAYMENT = 'payment',
  AUTH = 'auth',
  SYSTEM = 'system',
  DATABASE = 'database',
  EMAIL = 'email',
  VALIDATION = 'validation'
}

export interface ErrorLogEntry {
  level: ErrorLevel;
  type: string;
  message: string;
  stack?: string;
  userEmail?: string;
  requestUrl?: string;
  requestMethod?: string;
  category: ErrorCategory;
  metadata?: any;
}

@injectable({scope: BindingScope.SINGLETON})
export class ErrorLoggingService {
  constructor(
    @repository(CourseRepository)
    private courseRepository: CourseRepository,
  ) {}

  async logError(error: ErrorLogEntry): Promise<void> {
    try {
      // Sanitize sensitive data
      const sanitizedError = this.sanitizeError(error);
      
      const query = `
        INSERT INTO error_logs (
          error_level, error_type, error_message, error_stack,
          user_email, request_url, request_method, category,
          created_at
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
      `;

      const params = [
        sanitizedError.level,
        sanitizedError.type,
        sanitizedError.message,
        sanitizedError.stack,
        sanitizedError.userEmail,
        sanitizedError.requestUrl,
        sanitizedError.requestMethod,
        sanitizedError.category,
        new Date()
      ];

      await this.courseRepository.dataSource.execute(query, params);

      // If it's a critical error, trigger alert
      if (error.level === ErrorLevel.CRITICAL) {
        await this.sendCriticalErrorAlert(error);
      }
    } catch (loggingError) {
      // Fallback to console logging if database logging fails
      console.error('Failed to log error to database:', loggingError);
      console.error('Original error:', error);
    }
  }

  async logInfo(message: string, category: ErrorCategory, metadata?: any): Promise<void> {
    await this.logError({
      level: ErrorLevel.INFO,
      type: 'info',
      message,
      category,
      metadata
    });
  }

  async logWarning(message: string, category: ErrorCategory, metadata?: any): Promise<void> {
    await this.logError({
      level: ErrorLevel.WARNING,
      type: 'warning',
      message,
      category,
      metadata
    });
  }

  async logCritical(error: Error, category: ErrorCategory, context?: any): Promise<void> {
    await this.logError({
      level: ErrorLevel.CRITICAL,
      type: error.name || 'critical',
      message: error.message,
      stack: error.stack,
      category,
      metadata: context
    });
  }

  private sanitizeError(error: ErrorLogEntry): ErrorLogEntry {
    // Remove sensitive data from error messages and stack traces
    const sanitized = {...error};
    
    // List of sensitive patterns to remove
    const sensitivePatterns = [
      /password['\"]?\s*[:=]\s*['\"]?[^'",\s]+/gi,
      /api[_-]?key['\"]?\s*[:=]\s*['\"]?[^'",\s]+/gi,
      /token['\"]?\s*[:=]\s*['\"]?[^'",\s]+/gi,
      /credit[_-]?card['\"]?\s*[:=]\s*['\"]?[^'",\s]+/gi,
    ];

    // Sanitize message
    if (sanitized.message) {
      sensitivePatterns.forEach(pattern => {
        sanitized.message = sanitized.message.replace(pattern, '[REDACTED]');
      });
    }

    // Sanitize stack trace
    if (sanitized.stack) {
      sensitivePatterns.forEach(pattern => {
        sanitized.stack = sanitized.stack!.replace(pattern, '[REDACTED]');
      });
    }

    return sanitized;
  }

  private async sendCriticalErrorAlert(error: ErrorLogEntry): Promise<void> {
    // In production, this would send an email or push notification
    // For now, just log to console
    console.error('🚨 CRITICAL ERROR ALERT:', {
      type: error.type,
      message: error.message,
      category: error.category,
      timestamp: new Date().toISOString()
    });
  }

  async getErrorSummary(hours: number = 24): Promise<any> {
    const query = `
      SELECT 
        error_level,
        category,
        COUNT(*) as count,
        MAX(created_at) as last_occurrence
      FROM error_logs
      WHERE created_at >= NOW() - INTERVAL '${hours} hours'
      GROUP BY error_level, category
      ORDER BY count DESC
    `;

    return await this.courseRepository.dataSource.execute(query);
  }

  async markErrorResolved(errorId: number, resolvedBy: string): Promise<void> {
    const query = `
      UPDATE error_logs 
      SET resolved = true, 
          resolved_at = NOW(), 
          resolved_by = $2
      WHERE id = $1
    `;

    await this.courseRepository.dataSource.execute(query, [errorId, resolvedBy]);
  }

  static createErrorHandler() {
    return async (error: Error, context: any) => {
      const loggingService = new ErrorLoggingService(context.courseRepository);
      
      // Determine error category based on error type or message
      let category = ErrorCategory.SYSTEM;
      if (error.message.includes('payment')) {
        category = ErrorCategory.PAYMENT;
      } else if (error.message.includes('booking')) {
        category = ErrorCategory.BOOKING;
      } else if (error.message.includes('auth')) {
        category = ErrorCategory.AUTH;
      } else if (error.message.includes('database')) {
        category = ErrorCategory.DATABASE;
      }

      await loggingService.logError({
        level: ErrorLevel.ERROR,
        type: error.name,
        message: error.message,
        stack: error.stack,
        category,
        requestUrl: context.request?.url,
        requestMethod: context.request?.method,
        userEmail: context.user?.email
      });
    };
  }
}