import { AuthErrorCode, ApiError } from '@/types/auth.types';

/**
 * Authentication error handling service
 */
export class AuthError extends Error implements ApiError {
  constructor(
    public code: AuthErrorCode,
    message: string,
    public statusCode: number,
    public field?: string,
    public details?: Record<string, any>
  ) {
    super(message);
    this.name = 'AuthError';
  }
}

// User-friendly error messages
const ERROR_MESSAGES: Record<AuthErrorCode, string> = {
  'auth/invalid-credentials': 'Email or password is incorrect',
  'auth/account-locked': 'Your account has been locked due to too many failed attempts. Please reset your password.',
  'auth/email-not-verified': 'Please verify your email address before logging in',
  'auth/session-expired': 'Your session has expired. Please login again.',
  'auth/rate-limited': 'Too many attempts. Please try again later.',
  'auth/email-in-use': 'This email address is already registered',
  'auth/weak-password': 'Password does not meet security requirements',
  'auth/invalid-token': 'This link has expired or is invalid',
  'auth/network-error': 'Network error. Please check your connection and try again.'
};

export class AuthErrorService {
  /**
   * Parse error response and return user-friendly error
   */
  static parseError(error: any): AuthError {
    // Handle Axios errors
    if (error.response) {
      const { status, data } = error.response;
      
      // Extract error code from response
      const code = data?.code || this.getErrorCodeFromStatus(status);
      const message = data?.message || ERROR_MESSAGES[code] || 'An unexpected error occurred';
      const field = data?.field;
      
      return new AuthError(code, message, status, field, data?.details);
    }
    
    // Handle network errors
    if (error.code === 'ECONNABORTED' || !navigator.onLine) {
      return new AuthError(
        'auth/network-error',
        ERROR_MESSAGES['auth/network-error'],
        0
      );
    }
    
    // Default error
    return new AuthError(
      'auth/network-error',
      error.message || 'An unexpected error occurred',
      500
    );
  }

  /**
   * Map HTTP status codes to auth error codes
   */
  private static getErrorCodeFromStatus(status: number): AuthErrorCode {
    switch (status) {
      case 401:
        return 'auth/invalid-credentials';
      case 403:
        return 'auth/email-not-verified';
      case 423:
        return 'auth/account-locked';
      case 429:
        return 'auth/rate-limited';
      default:
        return 'auth/network-error';
    }
  }

  /**
   * Get user-friendly error message
   */
  static getErrorMessage(code: AuthErrorCode): string {
    return ERROR_MESSAGES[code] || 'An unexpected error occurred';
  }

  /**
   * Check if error is retryable
   */
  static isRetryable(error: AuthError): boolean {
    return error.code === 'auth/network-error' || error.statusCode >= 500;
  }
}

/**
 * Retry failed requests with exponential backoff
 */
export async function retryWithBackoff<T>(
  fn: () => Promise<T>,
  maxRetries = 3,
  initialDelay = 1000
): Promise<T> {
  let lastError: any;
  
  for (let i = 0; i < maxRetries; i++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error;
      const authError = AuthErrorService.parseError(error);
      
      // Don't retry non-retryable errors
      if (!AuthErrorService.isRetryable(authError)) {
        throw authError;
      }
      
      // Wait before retrying (exponential backoff)
      if (i < maxRetries - 1) {
        const delay = initialDelay * Math.pow(2, i);
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
  }
  
  throw lastError;
}