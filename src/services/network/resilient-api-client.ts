import axios, { AxiosInstance, AxiosRequestConfig, AxiosError } from "axios";
import { tokenService } from "../auth/token.service";

interface RetryConfig {
  retries: number;
  retryDelay: number;
  retryCondition?: (error: AxiosError) => boolean;
  onRetry?: (retryCount: number, error: AxiosError) => void;
}

interface CircuitBreakerConfig {
  threshold: number;
  timeout: number;
  fallback?: () => any;
}

/**
 * Network resilient API client with:
 * - Automatic retry with exponential backoff
 * - Circuit breaker pattern
 * - Request queuing for offline support
 * - Response caching
 */
export class ResilientApiClient {
  private axiosInstance: AxiosInstance;
  private requestQueue: Map<string, AxiosRequestConfig> = new Map();
  private circuitBreaker: CircuitBreaker;
  private responseCache: ResponseCache;
  private isOnline: boolean = navigator.onLine;

  constructor(baseURL: string) {
    this.axiosInstance = axios.create({
      baseURL,
      timeout: 30000,
      headers: {
        "Content-Type": "application/json",
      },
    });

    this.circuitBreaker = new CircuitBreaker({
      threshold: 5,
      timeout: 60000,
    });

    this.responseCache = new ResponseCache();

    this.setupInterceptors();
    this.setupNetworkListeners();
  }

  private setupInterceptors(): void {
    // Request interceptor
    this.axiosInstance.interceptors.request.use(
      (config) => {
        // Add auth token
        const token = tokenService.getAccessToken();
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
        }

        // Add request ID for tracking
        config.headers["X-Request-ID"] = this.generateRequestId();

        // Check if we should queue the request
        if (!this.isOnline && this.isQueuableRequest(config)) {
          return this.queueRequest(config);
        }

        return config;
      },
      (error) => Promise.reject(error),
    );

    // Response interceptor with retry logic
    this.axiosInstance.interceptors.response.use(
      (response) => {
        // Cache successful responses
        if (this.isCacheable(response.config)) {
          this.responseCache.set(response.config, response);
        }

        // Reset circuit breaker on success
        this.circuitBreaker.recordSuccess();

        return response;
      },
      async (error: AxiosError) => {
        const config = error.config as AxiosRequestConfig & { _retry?: number };

        // Record failure for circuit breaker
        this.circuitBreaker.recordFailure();

        // Check if circuit is open
        if (this.circuitBreaker.isOpen()) {
          // Try to return cached response
          const cached = this.responseCache.get(config);
          if (cached) {
            console.warn("Circuit open, returning cached response");
            return cached;
          }

          // Execute fallback if available
          if (this.circuitBreaker.fallback) {
            return this.circuitBreaker.fallback();
          }

          throw new Error("Service temporarily unavailable");
        }

        // Implement retry logic
        const retryConfig: RetryConfig = {
          retries: 3,
          retryDelay: 1000,
          retryCondition: (error) => {
            return !error.response || error.response.status >= 500;
          },
        };

        config._retry = config._retry || 0;

        if (
          config._retry < retryConfig.retries &&
          retryConfig.retryCondition?.(error)
        ) {
          config._retry++;

          // Exponential backoff
          const delay = retryConfig.retryDelay * Math.pow(2, config._retry - 1);

          await new Promise((resolve) => setTimeout(resolve, delay));

          // Log retry attempt
          console.log(
            `Retrying request (${config._retry}/${retryConfig.retries})...`,
          );

          return this.axiosInstance(config);
        }

        // If it's a network error and we have a cached response, return it
        if (!error.response && this.isCacheable(config)) {
          const cached = this.responseCache.get(config);
          if (cached) {
            console.warn("Network error, returning stale cached response");
            return { ...cached, stale: true };
          }
        }

        return Promise.reject(error);
      },
    );
  }

  private setupNetworkListeners(): void {
    window.addEventListener("online", () => {
      this.isOnline = true;
      this.processQueuedRequests();
    });

    window.addEventListener("offline", () => {
      this.isOnline = false;
    });
  }

  private generateRequestId(): string {
    return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  private isQueuableRequest(config: AxiosRequestConfig): boolean {
    // Only queue POST, PUT, PATCH requests
    return ["post", "put", "patch"].includes(
      config.method?.toLowerCase() || "",
    );
  }

  private isCacheable(config: AxiosRequestConfig): boolean {
    // Only cache GET requests
    return config.method?.toLowerCase() === "get";
  }

  private async queueRequest(config: AxiosRequestConfig): Promise<any> {
    const requestId = config.headers?.["X-Request-ID"] as string;
    this.requestQueue.set(requestId, config);

    // Return a pending promise that will be resolved when online
    return new Promise((resolve, reject) => {
      const checkOnline = setInterval(() => {
        if (this.isOnline) {
          clearInterval(checkOnline);
          this.axiosInstance(config).then(resolve).catch(reject);
        }
      }, 1000);

      // Timeout after 5 minutes
      setTimeout(() => {
        clearInterval(checkOnline);
        reject(new Error("Request timeout - device offline"));
      }, 300000);
    });
  }

  private async processQueuedRequests(): Promise<void> {
    console.log(`Processing ${this.requestQueue.size} queued requests...`);

    for (const [requestId, config] of this.requestQueue.entries()) {
      try {
        await this.axiosInstance(config);
        this.requestQueue.delete(requestId);
      } catch (error) {
        console.error(`Failed to process queued request ${requestId}:`, error);
      }
    }
  }

  // Public methods
  get(url: string, config?: AxiosRequestConfig) {
    return this.axiosInstance.get(url, config);
  }

  post(url: string, data?: any, config?: AxiosRequestConfig) {
    return this.axiosInstance.post(url, data, config);
  }

  put(url: string, data?: any, config?: AxiosRequestConfig) {
    return this.axiosInstance.put(url, data, config);
  }

  patch(url: string, data?: any, config?: AxiosRequestConfig) {
    return this.axiosInstance.patch(url, data, config);
  }

  delete(url: string, config?: AxiosRequestConfig) {
    return this.axiosInstance.delete(url, config);
  }
}

/**
 * Circuit Breaker implementation
 */
class CircuitBreaker {
  private failures: number = 0;
  private lastFailureTime: number = 0;
  private state: "closed" | "open" | "half-open" = "closed";

  constructor(private config: CircuitBreakerConfig) {}

  recordSuccess(): void {
    this.failures = 0;
    this.state = "closed";
  }

  recordFailure(): void {
    this.failures++;
    this.lastFailureTime = Date.now();

    if (this.failures >= this.config.threshold) {
      this.state = "open";

      // Schedule half-open state
      setTimeout(() => {
        this.state = "half-open";
      }, this.config.timeout);
    }
  }

  isOpen(): boolean {
    if (this.state === "half-open") {
      // Allow one request through
      return false;
    }

    return this.state === "open";
  }

  get fallback() {
    return this.config.fallback;
  }
}

/**
 * Response cache with TTL
 */
class ResponseCache {
  private cache: Map<string, { response: any; timestamp: number }> = new Map();
  private ttl: number = 300000; // 5 minutes

  set(config: AxiosRequestConfig, response: any): void {
    const key = this.generateCacheKey(config);
    this.cache.set(key, {
      response,
      timestamp: Date.now(),
    });

    // Cleanup old entries
    this.cleanup();
  }

  get(config: AxiosRequestConfig): any | null {
    const key = this.generateCacheKey(config);
    const cached = this.cache.get(key);

    if (!cached) return null;

    // Check if expired
    if (Date.now() - cached.timestamp > this.ttl) {
      this.cache.delete(key);
      return null;
    }

    return cached.response;
  }

  private generateCacheKey(config: AxiosRequestConfig): string {
    return `${config.method}:${config.url}:${JSON.stringify(config.params || {})}`;
  }

  private cleanup(): void {
    const now = Date.now();
    for (const [key, value] of this.cache.entries()) {
      if (now - value.timestamp > this.ttl) {
        this.cache.delete(key);
      }
    }
  }
}

// Export singleton instance
export const resilientApiClient = new ResilientApiClient(
  process.env.VITE_API_URL || "http://localhost:3000/api",
);
