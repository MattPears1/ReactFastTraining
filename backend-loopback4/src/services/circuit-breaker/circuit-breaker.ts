export enum CircuitState {
  CLOSED = 'CLOSED',
  OPEN = 'OPEN',
  HALF_OPEN = 'HALF_OPEN',
}

export interface CircuitBreakerOptions {
  failureThreshold: number;
  successThreshold: number;
  timeout: number;
  monitoringPeriod: number;
  fallbackFunction?: () => Promise<any>;
  onStateChange?: (newState: CircuitState) => void;
}

export interface CircuitBreakerStats {
  state: CircuitState;
  failures: number;
  successes: number;
  consecutiveFailures: number;
  consecutiveSuccesses: number;
  lastFailureTime?: Date;
  lastSuccessTime?: Date;
  totalRequests: number;
  totalFailures: number;
  totalSuccesses: number;
}

export class CircuitBreaker {
  private state: CircuitState = CircuitState.CLOSED;
  private failures: number = 0;
  private successes: number = 0;
  private consecutiveFailures: number = 0;
  private consecutiveSuccesses: number = 0;
  private lastFailureTime?: Date;
  private lastSuccessTime?: Date;
  private nextAttempt?: Date;
  private monitoringWindowStart: Date = new Date();
  private totalRequests: number = 0;
  private totalFailures: number = 0;
  private totalSuccesses: number = 0;

  constructor(private readonly options: CircuitBreakerOptions) {}

  async execute<T>(operation: () => Promise<T>): Promise<T> {
    this.totalRequests++;

    // Check if we should reset monitoring window
    this.checkMonitoringWindow();

    // Check circuit state
    if (this.state === CircuitState.OPEN) {
      if (this.canAttemptReset()) {
        this.transitionTo(CircuitState.HALF_OPEN);
      } else {
        if (this.options.fallbackFunction) {
          return this.options.fallbackFunction() as Promise<T>;
        }
        throw new Error(
          `Circuit breaker is OPEN. Service unavailable. Next attempt at ${this.nextAttempt?.toISOString()}`
        );
      }
    }

    try {
      const result = await this.executeWithTimeout(operation);
      this.onSuccess();
      return result;
    } catch (error) {
      this.onFailure();
      throw error;
    }
  }

  private async executeWithTimeout<T>(operation: () => Promise<T>): Promise<T> {
    return new Promise<T>((resolve, reject) => {
      const timer = setTimeout(() => {
        reject(new Error(`Operation timed out after ${this.options.timeout}ms`));
      }, this.options.timeout);

      operation()
        .then(result => {
          clearTimeout(timer);
          resolve(result);
        })
        .catch(error => {
          clearTimeout(timer);
          reject(error);
        });
    });
  }

  private onSuccess(): void {
    this.successes++;
    this.totalSuccesses++;
    this.consecutiveSuccesses++;
    this.consecutiveFailures = 0;
    this.lastSuccessTime = new Date();

    if (this.state === CircuitState.HALF_OPEN) {
      if (this.consecutiveSuccesses >= this.options.successThreshold) {
        this.transitionTo(CircuitState.CLOSED);
      }
    }
  }

  private onFailure(): void {
    this.failures++;
    this.totalFailures++;
    this.consecutiveFailures++;
    this.consecutiveSuccesses = 0;
    this.lastFailureTime = new Date();

    if (this.state === CircuitState.HALF_OPEN) {
      this.transitionTo(CircuitState.OPEN);
    } else if (this.state === CircuitState.CLOSED) {
      if (this.consecutiveFailures >= this.options.failureThreshold) {
        this.transitionTo(CircuitState.OPEN);
      }
    }
  }

  private canAttemptReset(): boolean {
    if (!this.nextAttempt) return true;
    return new Date() >= this.nextAttempt;
  }

  private transitionTo(newState: CircuitState): void {
    const oldState = this.state;
    this.state = newState;

    if (newState === CircuitState.OPEN) {
      this.nextAttempt = new Date(Date.now() + this.options.timeout);
      this.consecutiveFailures = 0;
      this.consecutiveSuccesses = 0;
    }

    if (this.options.onStateChange && oldState !== newState) {
      this.options.onStateChange(newState);
    }
  }

  private checkMonitoringWindow(): void {
    const now = new Date();
    const windowDuration = now.getTime() - this.monitoringWindowStart.getTime();

    if (windowDuration >= this.options.monitoringPeriod) {
      // Reset monitoring window
      this.monitoringWindowStart = now;
      this.failures = 0;
      this.successes = 0;
    }
  }

  getStats(): CircuitBreakerStats {
    return {
      state: this.state,
      failures: this.failures,
      successes: this.successes,
      consecutiveFailures: this.consecutiveFailures,
      consecutiveSuccesses: this.consecutiveSuccesses,
      lastFailureTime: this.lastFailureTime,
      lastSuccessTime: this.lastSuccessTime,
      totalRequests: this.totalRequests,
      totalFailures: this.totalFailures,
      totalSuccesses: this.totalSuccesses,
    };
  }

  reset(): void {
    this.state = CircuitState.CLOSED;
    this.failures = 0;
    this.successes = 0;
    this.consecutiveFailures = 0;
    this.consecutiveSuccesses = 0;
    this.lastFailureTime = undefined;
    this.lastSuccessTime = undefined;
    this.nextAttempt = undefined;
  }

  getState(): CircuitState {
    return this.state;
  }

  isOpen(): boolean {
    return this.state === CircuitState.OPEN;
  }

  isClosed(): boolean {
    return this.state === CircuitState.CLOSED;
  }

  isHalfOpen(): boolean {
    return this.state === CircuitState.HALF_OPEN;
  }
}

// Factory for creating circuit breakers with common configurations
export class CircuitBreakerFactory {
  static createPaymentCircuitBreaker(
    onStateChange?: (state: CircuitState) => void
  ): CircuitBreaker {
    return new CircuitBreaker({
      failureThreshold: 5,
      successThreshold: 3,
      timeout: 30000, // 30 seconds
      monitoringPeriod: 60000, // 1 minute
      onStateChange,
      fallbackFunction: async () => {
        throw new Error('Payment service is temporarily unavailable. Please try again later.');
      },
    });
  }

  static createEmailCircuitBreaker(
    onStateChange?: (state: CircuitState) => void
  ): CircuitBreaker {
    return new CircuitBreaker({
      failureThreshold: 10,
      successThreshold: 5,
      timeout: 60000, // 1 minute
      monitoringPeriod: 300000, // 5 minutes
      onStateChange,
      fallbackFunction: async () => {
        // Email failures are less critical - we can queue them
        console.log('Email service unavailable - message queued for retry');
        return { queued: true };
      },
    });
  }

  static createExternalAPICircuitBreaker(
    serviceName: string,
    onStateChange?: (state: CircuitState) => void
  ): CircuitBreaker {
    return new CircuitBreaker({
      failureThreshold: 3,
      successThreshold: 2,
      timeout: 10000, // 10 seconds
      monitoringPeriod: 120000, // 2 minutes
      onStateChange,
      fallbackFunction: async () => {
        throw new Error(`${serviceName} is temporarily unavailable`);
      },
    });
  }
}