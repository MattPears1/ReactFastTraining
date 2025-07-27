import {
  injectable,
  Interceptor,
  InvocationContext,
  InvocationResult,
  Provider,
  ValueOrPromise,
} from '@loopback/core';
import { HttpErrors } from '@loopback/rest';

enum CircuitState {
  CLOSED = 'CLOSED',
  OPEN = 'OPEN',
  HALF_OPEN = 'HALF_OPEN',
}

interface CircuitBreakerOptions {
  failureThreshold: number;
  resetTimeout: number;
  halfOpenRetries: number;
  timeout: number;
}

class CircuitBreaker {
  private state: CircuitState = CircuitState.CLOSED;
  private failureCount = 0;
  private lastFailureTime?: Date;
  private successCount = 0;
  private halfOpenAttempts = 0;
  private resetTimer?: NodeJS.Timeout;

  constructor(private options: CircuitBreakerOptions) {}

  async execute<T>(
    operation: () => Promise<T>,
    fallback?: () => T | Promise<T>,
  ): Promise<T> {
    if (this.state === CircuitState.OPEN) {
      if (this.canAttemptReset()) {
        this.state = CircuitState.HALF_OPEN;
        this.halfOpenAttempts = 0;
      } else {
        if (fallback) {
          return fallback();
        }
        throw new HttpErrors.ServiceUnavailable('Service temporarily unavailable');
      }
    }

    try {
      // Add timeout to operation
      const result = await this.withTimeout(operation(), this.options.timeout);
      this.onSuccess();
      return result;
    } catch (error) {
      this.onFailure();
      
      if (fallback && this.state === CircuitState.OPEN) {
        return fallback();
      }
      
      throw error;
    }
  }

  private async withTimeout<T>(promise: Promise<T>, timeout: number): Promise<T> {
    return Promise.race([
      promise,
      new Promise<T>((_, reject) =>
        setTimeout(() => reject(new Error('Operation timeout')), timeout),
      ),
    ]);
  }

  private onSuccess(): void {
    this.failureCount = 0;
    
    if (this.state === CircuitState.HALF_OPEN) {
      this.successCount++;
      
      if (this.successCount >= this.options.halfOpenRetries) {
        this.state = CircuitState.CLOSED;
        this.successCount = 0;
        this.clearResetTimer();
      }
    }
  }

  private onFailure(): void {
    this.failureCount++;
    this.lastFailureTime = new Date();
    
    if (this.state === CircuitState.HALF_OPEN) {
      this.halfOpenAttempts++;
      
      if (this.halfOpenAttempts >= this.options.halfOpenRetries) {
        this.trip();
      }
    } else if (this.failureCount >= this.options.failureThreshold) {
      this.trip();
    }
  }

  private trip(): void {
    this.state = CircuitState.OPEN;
    this.successCount = 0;
    
    this.resetTimer = setTimeout(() => {
      this.state = CircuitState.HALF_OPEN;
      this.halfOpenAttempts = 0;
    }, this.options.resetTimeout);
  }

  private canAttemptReset(): boolean {
    if (!this.lastFailureTime) return true;
    
    const timeSinceLastFailure = Date.now() - this.lastFailureTime.getTime();
    return timeSinceLastFailure >= this.options.resetTimeout;
  }

  private clearResetTimer(): void {
    if (this.resetTimer) {
      clearTimeout(this.resetTimer);
      this.resetTimer = undefined;
    }
  }

  getState(): CircuitState {
    return this.state;
  }

  getStats() {
    return {
      state: this.state,
      failureCount: this.failureCount,
      successCount: this.successCount,
      lastFailureTime: this.lastFailureTime,
    };
  }

  reset(): void {
    this.state = CircuitState.CLOSED;
    this.failureCount = 0;
    this.successCount = 0;
    this.halfOpenAttempts = 0;
    this.lastFailureTime = undefined;
    this.clearResetTimer();
  }
}

/**
 * Circuit breaker interceptor for LoopBack 4
 */
@injectable({tags: {key: CircuitBreakerInterceptor.BINDING_KEY}})
export class CircuitBreakerInterceptor implements Provider<Interceptor> {
  static readonly BINDING_KEY = `interceptors.${CircuitBreakerInterceptor.name}`;
  
  private static circuitBreakers = new Map<string, CircuitBreaker>();

  value() {
    return this.intercept.bind(this);
  }

  async intercept(
    invocationCtx: InvocationContext,
    next: () => ValueOrPromise<InvocationResult>,
  ) {
    const key = this.getCircuitBreakerKey(invocationCtx);
    const circuitBreaker = this.getOrCreateCircuitBreaker(key);
    
    // Get options from method decorator or use defaults
    const options = this.getOptions(invocationCtx);
    
    return circuitBreaker.execute(
      async () => next(),
      options.fallback,
    );
  }

  private getCircuitBreakerKey(invocationCtx: InvocationContext): string {
    const className = invocationCtx.targetClass?.name || 'Unknown';
    const methodName = invocationCtx.methodName || 'unknown';
    return `${className}.${methodName}`;
  }

  private getOrCreateCircuitBreaker(key: string): CircuitBreaker {
    if (!CircuitBreakerInterceptor.circuitBreakers.has(key)) {
      const options = this.getDefaultOptions(key);
      CircuitBreakerInterceptor.circuitBreakers.set(
        key,
        new CircuitBreaker(options),
      );
    }
    
    return CircuitBreakerInterceptor.circuitBreakers.get(key)!;
  }

  private getOptions(invocationCtx: InvocationContext): any {
    // Check for decorator metadata
    const metadata = invocationCtx.target?.constructor?.prototype?.[invocationCtx.methodName]?._circuitBreakerOptions;
    
    return {
      ...this.getDefaultOptions(this.getCircuitBreakerKey(invocationCtx)),
      ...metadata,
    };
  }

  private getDefaultOptions(key: string): CircuitBreakerOptions {
    // Different defaults for different operations
    const defaults: Record<string, Partial<CircuitBreakerOptions>> = {
      'AuthController.login': {
        failureThreshold: 5,
        resetTimeout: 60000,
        halfOpenRetries: 3,
        timeout: 5000,
      },
      'UserRepository.find': {
        failureThreshold: 10,
        resetTimeout: 30000,
        halfOpenRetries: 5,
        timeout: 3000,
      },
    };

    return {
      failureThreshold: 5,
      resetTimeout: 60000,
      halfOpenRetries: 3,
      timeout: 10000,
      ...defaults[key],
    };
  }

  static getStats(): Record<string, any> {
    const stats: Record<string, any> = {};
    
    CircuitBreakerInterceptor.circuitBreakers.forEach((breaker, key) => {
      stats[key] = breaker.getStats();
    });
    
    return stats;
  }

  static reset(key?: string): void {
    if (key) {
      CircuitBreakerInterceptor.circuitBreakers.get(key)?.reset();
    } else {
      CircuitBreakerInterceptor.circuitBreakers.forEach(breaker => breaker.reset());
    }
  }
}

/**
 * Decorator for applying circuit breaker with custom options
 */
export function circuitBreaker(options?: Partial<CircuitBreakerOptions>) {
  return function (target: any, propertyKey: string, descriptor: PropertyDescriptor) {
    // Store options in metadata
    descriptor.value._circuitBreakerOptions = options;
    return descriptor;
  };
}