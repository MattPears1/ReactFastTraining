import { MonitoringService } from './monitoring.service';
import { EventEmitter } from 'events';

export enum CircuitState {
  CLOSED = 'CLOSED',
  OPEN = 'OPEN',
  HALF_OPEN = 'HALF_OPEN'
}

export interface CircuitBreakerOptions {
  failureThreshold?: number;
  successThreshold?: number;
  timeout?: number;
  monitoringPeriod?: number;
  volumeThreshold?: number;
  errorThresholdPercentage?: number;
}

export interface CircuitBreakerMetrics {
  state: CircuitState;
  failures: number;
  successes: number;
  totalRequests: number;
  lastFailureTime?: Date;
  lastSuccessTime?: Date;
  errorRate: number;
  averageResponseTime: number;
}

export class CircuitBreaker extends EventEmitter {
  private state: CircuitState = CircuitState.CLOSED;
  private failures = 0;
  private successes = 0;
  private totalRequests = 0;
  private lastFailureTime?: Date;
  private lastSuccessTime?: Date;
  private halfOpenRequests = 0;
  private responseTimes: number[] = [];
  private requestTimestamps: number[] = [];
  
  private readonly options: Required<CircuitBreakerOptions> = {
    failureThreshold: 5,
    successThreshold: 2,
    timeout: 60000, // 1 minute
    monitoringPeriod: 60000, // 1 minute
    volumeThreshold: 10, // Minimum requests before opening
    errorThresholdPercentage: 50, // 50% error rate
  };

  constructor(
    private name: string,
    options?: CircuitBreakerOptions
  ) {
    super();
    this.options = { ...this.options, ...options };
    this.startMonitoring();
  }

  async execute<T>(
    operation: () => Promise<T>,
    fallback?: () => Promise<T>
  ): Promise<T> {
    // Check if circuit should be opened based on error rate
    this.evaluateCircuitHealth();

    if (this.state === CircuitState.OPEN) {
      if (this.shouldAttemptReset()) {
        this.transitionToHalfOpen();
      } else {
        MonitoringService.warn(`Circuit breaker ${this.name} is OPEN`, {
          state: this.state,
          failures: this.failures,
          lastFailureTime: this.lastFailureTime,
        });

        if (fallback) {
          return this.executeFallback(fallback);
        }

        throw new CircuitBreakerError(
          `Circuit breaker ${this.name} is OPEN`,
          this.getMetrics()
        );
      }
    }

    if (this.state === CircuitState.HALF_OPEN && this.halfOpenRequests >= 1) {
      // Only allow one request through in half-open state
      if (fallback) {
        return this.executeFallback(fallback);
      }
      throw new CircuitBreakerError(
        `Circuit breaker ${this.name} is testing in HALF_OPEN state`,
        this.getMetrics()
      );
    }

    const startTime = Date.now();
    this.totalRequests++;
    this.requestTimestamps.push(startTime);

    try {
      if (this.state === CircuitState.HALF_OPEN) {
        this.halfOpenRequests++;
      }

      const result = await operation();
      const responseTime = Date.now() - startTime;
      
      this.onSuccess(responseTime);
      return result;
    } catch (error) {
      const responseTime = Date.now() - startTime;
      this.onFailure(error, responseTime);

      if (fallback && this.state === CircuitState.OPEN) {
        return this.executeFallback(fallback);
      }

      throw error;
    }
  }

  private async executeFallback<T>(fallback: () => Promise<T>): Promise<T> {
    try {
      MonitoringService.info(`Executing fallback for circuit ${this.name}`);
      return await fallback();
    } catch (fallbackError) {
      MonitoringService.error(
        `Fallback failed for circuit ${this.name}`,
        fallbackError
      );
      throw fallbackError;
    }
  }

  private onSuccess(responseTime: number): void {
    this.successes++;
    this.lastSuccessTime = new Date();
    this.responseTimes.push(responseTime);
    this.keepResponseTimesWindow();

    if (this.state === CircuitState.HALF_OPEN) {
      if (this.successes >= this.options.successThreshold) {
        this.transitionToClosed();
      }
    }

    // Reset failure count on success in closed state
    if (this.state === CircuitState.CLOSED) {
      this.failures = 0;
    }

    this.emit('success', {
      circuit: this.name,
      responseTime,
      state: this.state,
    });
  }

  private onFailure(error: any, responseTime: number): void {
    this.failures++;
    this.lastFailureTime = new Date();
    this.responseTimes.push(responseTime);
    this.keepResponseTimesWindow();

    MonitoringService.error(`Circuit ${this.name} operation failed`, error, {
      circuit: this.name,
      failures: this.failures,
      state: this.state,
    });

    if (this.state === CircuitState.HALF_OPEN) {
      this.transitionToOpen();
    } else if (
      this.state === CircuitState.CLOSED &&
      this.failures >= this.options.failureThreshold
    ) {
      this.transitionToOpen();
    }

    this.emit('failure', {
      circuit: this.name,
      error,
      failures: this.failures,
      state: this.state,
    });
  }

  private transitionToOpen(): void {
    this.state = CircuitState.OPEN;
    this.emit('open', { circuit: this.name });
    
    MonitoringService.warn(`Circuit ${this.name} transitioned to OPEN`, {
      failures: this.failures,
      lastFailureTime: this.lastFailureTime,
    });

    // Schedule automatic retry
    setTimeout(() => {
      if (this.state === CircuitState.OPEN) {
        this.transitionToHalfOpen();
      }
    }, this.options.timeout);
  }

  private transitionToHalfOpen(): void {
    this.state = CircuitState.HALF_OPEN;
    this.halfOpenRequests = 0;
    this.successes = 0;
    this.failures = 0;
    this.emit('half-open', { circuit: this.name });
    
    MonitoringService.info(`Circuit ${this.name} transitioned to HALF_OPEN`);
  }

  private transitionToClosed(): void {
    this.state = CircuitState.CLOSED;
    this.failures = 0;
    this.successes = 0;
    this.halfOpenRequests = 0;
    this.emit('closed', { circuit: this.name });
    
    MonitoringService.info(`Circuit ${this.name} transitioned to CLOSED`);
  }

  private shouldAttemptReset(): boolean {
    return (
      this.lastFailureTime &&
      Date.now() - this.lastFailureTime.getTime() >= this.options.timeout
    );
  }

  private evaluateCircuitHealth(): void {
    const now = Date.now();
    const monitoringWindow = now - this.options.monitoringPeriod;
    
    // Remove old timestamps
    this.requestTimestamps = this.requestTimestamps.filter(
      timestamp => timestamp > monitoringWindow
    );

    // Only evaluate if we have enough volume
    if (this.requestTimestamps.length < this.options.volumeThreshold) {
      return;
    }

    // Calculate error rate for the monitoring window
    const recentErrors = this.getRecentErrorCount(monitoringWindow);
    const errorRate = (recentErrors / this.requestTimestamps.length) * 100;

    if (
      errorRate > this.options.errorThresholdPercentage &&
      this.state === CircuitState.CLOSED
    ) {
      this.transitionToOpen();
    }
  }

  private getRecentErrorCount(since: number): number {
    // This is a simplified version - in production, you'd track error timestamps
    return this.failures;
  }

  private keepResponseTimesWindow(): void {
    // Keep only last 100 response times
    if (this.responseTimes.length > 100) {
      this.responseTimes = this.responseTimes.slice(-100);
    }
  }

  getMetrics(): CircuitBreakerMetrics {
    const errorRate = this.totalRequests > 0
      ? (this.failures / this.totalRequests) * 100
      : 0;

    const averageResponseTime = this.responseTimes.length > 0
      ? this.responseTimes.reduce((a, b) => a + b, 0) / this.responseTimes.length
      : 0;

    return {
      state: this.state,
      failures: this.failures,
      successes: this.successes,
      totalRequests: this.totalRequests,
      lastFailureTime: this.lastFailureTime,
      lastSuccessTime: this.lastSuccessTime,
      errorRate: Number(errorRate.toFixed(2)),
      averageResponseTime: Number(averageResponseTime.toFixed(2)),
    };
  }

  reset(): void {
    this.state = CircuitState.CLOSED;
    this.failures = 0;
    this.successes = 0;
    this.totalRequests = 0;
    this.halfOpenRequests = 0;
    this.responseTimes = [];
    this.requestTimestamps = [];
    this.lastFailureTime = undefined;
    this.lastSuccessTime = undefined;
    
    this.emit('reset', { circuit: this.name });
  }

  private startMonitoring(): void {
    // Periodic health check
    setInterval(() => {
      const metrics = this.getMetrics();
      MonitoringService.recordGauge('circuit_breaker_state', 
        this.state === CircuitState.CLOSED ? 0 : 
        this.state === CircuitState.HALF_OPEN ? 0.5 : 1,
        { circuit: this.name }
      );
      
      MonitoringService.recordGauge('circuit_breaker_error_rate', 
        metrics.errorRate,
        { circuit: this.name }
      );
      
      MonitoringService.recordGauge('circuit_breaker_response_time', 
        metrics.averageResponseTime,
        { circuit: this.name }
      );
    }, 30000); // Every 30 seconds
  }
}

export class CircuitBreakerError extends Error {
  constructor(
    message: string,
    public metrics: CircuitBreakerMetrics
  ) {
    super(message);
    this.name = 'CircuitBreakerError';
  }
}

// Circuit Breaker Manager for centralized management
export class CircuitBreakerManager {
  private static circuits = new Map<string, CircuitBreaker>();

  static getCircuit(
    name: string,
    options?: CircuitBreakerOptions
  ): CircuitBreaker {
    if (!this.circuits.has(name)) {
      const circuit = new CircuitBreaker(name, options);
      this.circuits.set(name, circuit);
      
      // Set up monitoring
      circuit.on('open', (data) => {
        MonitoringService.logSecurityEvent({
          type: 'suspicious_activity',
          details: `Circuit breaker ${data.circuit} opened due to failures`,
          severity: 'medium',
          metadata: data,
        });
      });
    }
    
    return this.circuits.get(name)!;
  }

  static getAllMetrics(): Record<string, CircuitBreakerMetrics> {
    const metrics: Record<string, CircuitBreakerMetrics> = {};
    
    this.circuits.forEach((circuit, name) => {
      metrics[name] = circuit.getMetrics();
    });
    
    return metrics;
  }

  static resetAll(): void {
    this.circuits.forEach(circuit => circuit.reset());
  }

  static resetCircuit(name: string): void {
    const circuit = this.circuits.get(name);
    if (circuit) {
      circuit.reset();
    }
  }
}