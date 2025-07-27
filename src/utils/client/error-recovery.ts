import React from 'react';
import { ClientPortalError, NetworkError } from '@/types/client/enhanced.types';

interface RetryOptions {
  maxAttempts?: number;
  delay?: number;
  backoff?: 'linear' | 'exponential';
  shouldRetry?: (error: Error, attempt: number) => boolean;
  onRetry?: (error: Error, attempt: number) => void;
}

export class ErrorRecovery {
  static async retry<T>(
    fn: () => Promise<T>,
    options: RetryOptions = {}
  ): Promise<T> {
    const {
      maxAttempts = 3,
      delay = 1000,
      backoff = 'exponential',
      shouldRetry = this.defaultShouldRetry,
      onRetry,
    } = options;

    let lastError: Error;

    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
      try {
        return await fn();
      } catch (error) {
        lastError = error instanceof Error ? error : new Error('Unknown error');

        if (attempt === maxAttempts || !shouldRetry(lastError, attempt)) {
          throw lastError;
        }

        onRetry?.(lastError, attempt);

        const waitTime = backoff === 'exponential' 
          ? delay * Math.pow(2, attempt - 1)
          : delay * attempt;

        await this.delay(waitTime);
      }
    }

    throw lastError!;
  }

  static async retryWithFallback<T>(
    primary: () => Promise<T>,
    fallback: () => Promise<T>,
    options?: RetryOptions
  ): Promise<T> {
    try {
      return await this.retry(primary, options);
    } catch (primaryError) {
      console.warn('Primary function failed, trying fallback:', primaryError);
      
      try {
        return await fallback();
      } catch (fallbackError) {
        throw new ClientPortalError(
          'Both primary and fallback operations failed',
          'FALLBACK_FAILED',
          { primaryError, fallbackError }
        );
      }
    }
  }

  static async withTimeout<T>(
    fn: () => Promise<T>,
    timeoutMs: number,
    timeoutError?: Error
  ): Promise<T> {
    return Promise.race([
      fn(),
      new Promise<never>((_, reject) => {
        setTimeout(() => {
          reject(timeoutError || new Error(`Operation timed out after ${timeoutMs}ms`));
        }, timeoutMs);
      }),
    ]);
  }

  static async gracefulDegrade<T, F>(
    fn: () => Promise<T>,
    fallbackValue: F,
    onError?: (error: Error) => void
  ): Promise<T | F> {
    try {
      return await fn();
    } catch (error) {
      const err = error instanceof Error ? error : new Error('Unknown error');
      onError?.(err);
      return fallbackValue;
    }
  }

  static createCircuitBreaker(
    threshold: number = 5,
    resetTimeout: number = 60000
  ) {
    let failures = 0;
    let lastFailureTime = 0;
    let state: 'closed' | 'open' | 'half-open' = 'closed';

    return async function circuitBreaker<T>(
      fn: () => Promise<T>
    ): Promise<T> {
      // Check if circuit should be reset
      if (state === 'open' && Date.now() - lastFailureTime > resetTimeout) {
        state = 'half-open';
        failures = 0;
      }

      if (state === 'open') {
        throw new ClientPortalError('Circuit breaker is open', 'CIRCUIT_OPEN');
      }

      try {
        const result = await fn();
        
        if (state === 'half-open') {
          state = 'closed';
          failures = 0;
        }
        
        return result;
      } catch (error) {
        failures++;
        lastFailureTime = Date.now();

        if (failures >= threshold) {
          state = 'open';
        }

        throw error;
      }
    };
  }

  static async bulkhead<T>(
    fn: () => Promise<T>,
    maxConcurrent: number,
    queue: Array<() => Promise<any>>
  ): Promise<T> {
    if (queue.length >= maxConcurrent) {
      throw new ClientPortalError(
        'Too many concurrent requests',
        'BULKHEAD_FULL'
      );
    }

    queue.push(fn);
    
    try {
      return await fn();
    } finally {
      const index = queue.indexOf(fn);
      if (index > -1) {
        queue.splice(index, 1);
      }
    }
  }

  private static defaultShouldRetry(error: Error, attempt: number): boolean {
    // Don't retry on client errors (4xx)
    if (error instanceof NetworkError && error.statusCode) {
      return error.statusCode >= 500 || error.statusCode === 0;
    }

    // Don't retry on validation errors
    if (error instanceof ClientPortalError && error.code === 'VALIDATION_ERROR') {
      return false;
    }

    // Retry on network errors
    if (error.message.includes('Network') || error.message.includes('timeout')) {
      return true;
    }

    return attempt < 3;
  }

  private static delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

// Error boundary hook
export const useErrorBoundary = () => {
  const [error, setError] = React.useState<Error | null>(null);

  React.useEffect(() => {
    const handleError = (event: ErrorEvent) => {
      setError(new Error(event.message));
    };

    const handleRejection = (event: PromiseRejectionEvent) => {
      setError(new Error(event.reason));
    };

    window.addEventListener('error', handleError);
    window.addEventListener('unhandledrejection', handleRejection);

    return () => {
      window.removeEventListener('error', handleError);
      window.removeEventListener('unhandledrejection', handleRejection);
    };
  }, []);

  const resetError = () => setError(null);

  return { error, resetError };
};

// Auto-save functionality
export class AutoSave {
  private timer: NodeJS.Timeout | null = null;
  private lastSave: number = 0;

  constructor(
    private saveFn: () => Promise<void>,
    private options: {
      debounceMs?: number;
      minInterval?: number;
      onError?: (error: Error) => void;
      onSuccess?: () => void;
    } = {}
  ) {}

  trigger(): void {
    const { debounceMs = 1000, minInterval = 5000 } = this.options;

    if (this.timer) {
      clearTimeout(this.timer);
    }

    this.timer = setTimeout(() => {
      const now = Date.now();
      if (now - this.lastSave < minInterval) {
        this.trigger();
        return;
      }

      this.save();
    }, debounceMs);
  }

  async save(): Promise<void> {
    try {
      await this.saveFn();
      this.lastSave = Date.now();
      this.options.onSuccess?.();
    } catch (error) {
      const err = error instanceof Error ? error : new Error('Save failed');
      this.options.onError?.(err);
    }
  }

  cancel(): void {
    if (this.timer) {
      clearTimeout(this.timer);
      this.timer = null;
    }
  }
}

// Offline queue for failed requests
export class OfflineQueue {
  private queue: Array<{
    id: string;
    request: () => Promise<any>;
    timestamp: number;
    retries: number;
  }> = [];

  constructor(private storageKey: string = 'offline-queue') {
    this.loadFromStorage();
  }

  add(request: () => Promise<any>): string {
    const id = Math.random().toString(36).substr(2, 9);
    const item = {
      id,
      request,
      timestamp: Date.now(),
      retries: 0,
    };

    this.queue.push(item);
    this.saveToStorage();
    
    return id;
  }

  async process(): Promise<void> {
    const items = [...this.queue];
    
    for (const item of items) {
      try {
        await item.request();
        this.remove(item.id);
      } catch (error) {
        item.retries++;
        
        if (item.retries >= 3) {
          this.remove(item.id);
        }
      }
    }
    
    this.saveToStorage();
  }

  remove(id: string): void {
    this.queue = this.queue.filter(item => item.id !== id);
  }

  clear(): void {
    this.queue = [];
    this.saveToStorage();
  }

  private saveToStorage(): void {
    try {
      const data = this.queue.map(({ id, timestamp, retries }) => ({
        id,
        timestamp,
        retries,
      }));
      localStorage.setItem(this.storageKey, JSON.stringify(data));
    } catch (error) {
      console.error('Failed to save offline queue:', error);
    }
  }

  private loadFromStorage(): void {
    try {
      const data = localStorage.getItem(this.storageKey);
      if (data) {
        // Note: We can't restore the actual request functions from storage
        // This would need to be handled differently in a real implementation
        console.warn('Offline queue loaded but requests cannot be restored');
      }
    } catch (error) {
      console.error('Failed to load offline queue:', error);
    }
  }
}