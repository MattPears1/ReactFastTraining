/**
 * Circuit Breaker pattern implementation for API resilience
 * Prevents cascading failures and provides fallback mechanisms
 */

interface CircuitBreakerOptions {
  failureThreshold: number;
  resetTimeout: number;
  monitoringPeriod: number;
  halfOpenRetries: number;
}

enum CircuitState {
  CLOSED = 'CLOSED',
  OPEN = 'OPEN',
  HALF_OPEN = 'HALF_OPEN',
}

class CircuitBreaker {
  private state: CircuitState = CircuitState.CLOSED;
  private failureCount = 0;
  private lastFailureTime?: Date;
  private successCount = 0;
  private halfOpenAttempts = 0;
  private readonly options: CircuitBreakerOptions;
  private resetTimer?: NodeJS.Timeout;

  constructor(options: Partial<CircuitBreakerOptions> = {}) {
    this.options = {
      failureThreshold: options.failureThreshold || 5,
      resetTimeout: options.resetTimeout || 60000, // 1 minute
      monitoringPeriod: options.monitoringPeriod || 10000, // 10 seconds
      halfOpenRetries: options.halfOpenRetries || 3,
    };
  }

  async execute<T>(
    operation: () => Promise<T>,
    fallback?: () => T | Promise<T>
  ): Promise<T> {
    if (this.state === CircuitState.OPEN) {
      if (this.canAttemptReset()) {
        this.state = CircuitState.HALF_OPEN;
        this.halfOpenAttempts = 0;
      } else {
        if (fallback) {
          return fallback();
        }
        throw new Error('Circuit breaker is OPEN');
      }
    }

    try {
      const result = await operation();
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
    
    // Set timer to attempt reset
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

// Circuit breakers for different API endpoints
const circuitBreakers = new Map<string, CircuitBreaker>();

export function getCircuitBreaker(endpoint: string): CircuitBreaker {
  if (!circuitBreakers.has(endpoint)) {
    circuitBreakers.set(endpoint, new CircuitBreaker({
      failureThreshold: 5,
      resetTimeout: 60000,
      monitoringPeriod: 10000,
      halfOpenRetries: 3,
    }));
  }
  
  return circuitBreakers.get(endpoint)!;
}

// Request queue for handling bursts
class RequestQueue {
  private queue: Array<{
    request: () => Promise<any>;
    resolve: (value: any) => void;
    reject: (error: any) => void;
  }> = [];
  private processing = false;
  private readonly maxConcurrent = 3;
  private activeRequests = 0;

  async add<T>(request: () => Promise<T>): Promise<T> {
    return new Promise((resolve, reject) => {
      this.queue.push({ request, resolve, reject });
      this.process();
    });
  }

  private async process(): Promise<void> {
    if (this.processing || this.activeRequests >= this.maxConcurrent) {
      return;
    }

    this.processing = true;

    while (this.queue.length > 0 && this.activeRequests < this.maxConcurrent) {
      const item = this.queue.shift();
      if (!item) continue;

      this.activeRequests++;

      item.request()
        .then(item.resolve)
        .catch(item.reject)
        .finally(() => {
          this.activeRequests--;
          this.process();
        });
    }

    this.processing = false;
  }

  getQueueSize(): number {
    return this.queue.length;
  }

  clear(): void {
    this.queue.forEach(item => {
      item.reject(new Error('Queue cleared'));
    });
    this.queue = [];
  }
}

// Shared request queue
export const requestQueue = new RequestQueue();

// Enhanced API client with circuit breaker
export async function resilientApiCall<T>(
  endpoint: string,
  request: () => Promise<T>,
  options: {
    fallback?: () => T | Promise<T>;
    useQueue?: boolean;
    retries?: number;
  } = {}
): Promise<T> {
  const circuitBreaker = getCircuitBreaker(endpoint);
  
  const executeRequest = async (): Promise<T> => {
    return circuitBreaker.execute(request, options.fallback);
  };

  if (options.useQueue) {
    return requestQueue.add(executeRequest);
  }

  return executeRequest();
}

// Health check for circuit breakers
export function getCircuitBreakerHealth(): Record<string, any> {
  const health: Record<string, any> = {};
  
  circuitBreakers.forEach((breaker, endpoint) => {
    health[endpoint] = breaker.getStats();
  });
  
  return health;
}