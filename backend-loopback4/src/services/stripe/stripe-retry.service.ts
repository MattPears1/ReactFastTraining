import { StripeErrorService } from './stripe-error.service';

export interface RetryOptions {
  maxAttempts?: number;
  initialDelay?: number;
  maxDelay?: number;
  backoffMultiplier?: number;
}

export class StripeRetryService {
  static readonly DEFAULT_RETRY_OPTIONS: Required<RetryOptions> = {
    maxAttempts: 3,
    initialDelay: 1000,
    maxDelay: 10000,
    backoffMultiplier: 2
  };

  static async retryOperation<T>(
    operation: () => Promise<T>,
    operationName: string,
    options: RetryOptions = {}
  ): Promise<T> {
    const opts = { ...this.DEFAULT_RETRY_OPTIONS, ...options };
    let lastError: any;
    let delay = opts.initialDelay;

    for (let attempt = 1; attempt <= opts.maxAttempts; attempt++) {
      try {
        return await operation();
      } catch (error: any) {
        lastError = error;
        
        // Don't retry on certain errors
        if (StripeErrorService.isNonRetryableError(error)) {
          throw error;
        }

        if (attempt === opts.maxAttempts) {
          break;
        }

        console.warn(
          `${operationName} attempt ${attempt} failed, retrying in ${delay}ms...`,
          error.message
        );

        await new Promise(resolve => setTimeout(resolve, delay));
        delay = Math.min(delay * opts.backoffMultiplier, opts.maxDelay);
      }
    }

    throw lastError;
  }

  static calculateNextRetryTime(retryCount: number): Date {
    // Exponential backoff: 5min, 30min, 2hr, 6hr, 24hr
    const delays = [5, 30, 120, 360, 1440];
    const delayMinutes = delays[Math.min(retryCount - 1, delays.length - 1)];
    
    return new Date(Date.now() + delayMinutes * 60 * 1000);
  }
}