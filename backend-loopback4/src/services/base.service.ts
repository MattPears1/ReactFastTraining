import {HttpErrors} from '@loopback/rest';
import {DefaultCrudRepository} from '@loopback/repository';

export interface ServiceError {
  code: string;
  message: string;
  statusCode: number;
  details?: any;
}

export interface ServiceResult<T> {
  success: boolean;
  data?: T;
  error?: ServiceError;
}

export abstract class BaseService {
  protected serviceName: string;

  constructor(serviceName: string) {
    this.serviceName = serviceName;
  }

  /**
   * Standard error handler with logging
   */
  protected handleError(error: any, operation: string): never {
    console.error(`[${this.serviceName}] Error in ${operation}:`, error);

    if (error instanceof HttpErrors.HttpError) {
      throw error;
    }

    if (error.name === 'ValidationError') {
      throw new HttpErrors.BadRequest(error.message || 'Validation failed');
    }

    if (error.code === 'ECONNREFUSED') {
      throw new HttpErrors.ServiceUnavailable('External service unavailable');
    }

    if (error.code === '23505') { // PostgreSQL unique constraint violation
      throw new HttpErrors.Conflict('Resource already exists');
    }

    if (error.code === '23503') { // PostgreSQL foreign key violation
      throw new HttpErrors.BadRequest('Referenced resource does not exist');
    }

    throw new HttpErrors.InternalServerError(
      `Operation failed: ${operation}`
    );
  }

  /**
   * Execute operation with consistent error handling
   */
  protected async executeWithErrorHandling<T>(
    operation: string,
    fn: () => Promise<T>
  ): Promise<T> {
    try {
      const startTime = Date.now();
      const result = await fn();
      const duration = Date.now() - startTime;
      
      if (duration > 1000) {
        console.warn(`[${this.serviceName}] Slow operation ${operation}: ${duration}ms`);
      }
      
      return result;
    } catch (error) {
      this.handleError(error, operation);
    }
  }

  /**
   * Validate required fields
   */
  protected validateRequired(data: any, fields: string[]): void {
    const missing = fields.filter(field => !data[field]);
    if (missing.length > 0) {
      throw new HttpErrors.BadRequest(
        `Missing required fields: ${missing.join(', ')}`
      );
    }
  }

  /**
   * Validate email format
   */
  protected validateEmail(email: string): void {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      throw new HttpErrors.BadRequest('Invalid email format');
    }
  }

  /**
   * Validate date range
   */
  protected validateDateRange(startDate: Date, endDate: Date): void {
    if (startDate >= endDate) {
      throw new HttpErrors.BadRequest('Start date must be before end date');
    }
  }

  /**
   * Validate positive number
   */
  protected validatePositiveNumber(value: number, fieldName: string): void {
    if (value <= 0) {
      throw new HttpErrors.BadRequest(`${fieldName} must be a positive number`);
    }
  }

  /**
   * Check resource exists
   */
  protected async checkResourceExists<T>(
    repository: DefaultCrudRepository<T, any>,
    id: string,
    resourceName: string
  ): Promise<T> {
    try {
      return await repository.findById(id);
    } catch (error) {
      if (error.code === 'ENTITY_NOT_FOUND') {
        throw new HttpErrors.NotFound(`${resourceName} not found`);
      }
      throw error;
    }
  }

  /**
   * Format success response
   */
  protected formatSuccess<T>(data: T, message?: string): ServiceResult<T> {
    return {
      success: true,
      data,
      ...(message && {message})
    };
  }

  /**
   * Format error response
   */
  protected formatError(
    code: string,
    message: string,
    statusCode: number = 500,
    details?: any
  ): ServiceResult<any> {
    return {
      success: false,
      error: {
        code,
        message,
        statusCode,
        details
      }
    };
  }

  /**
   * Log operation for audit
   */
  protected async logOperation(
    operation: string,
    userId: string,
    details: any
  ): Promise<void> {
    console.log(`[AUDIT] ${this.serviceName}.${operation}`, {
      userId,
      timestamp: new Date().toISOString(),
      details
    });
  }
}