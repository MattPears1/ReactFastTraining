import { apiClient } from "./api-client";
import type { MaybeAsync } from "@/types/client/enhanced.types";

interface CacheEntry<T> {
  data: T;
  timestamp: number;
  etag?: string;
}

interface RequestConfig {
  cacheKey?: string;
  cacheDuration?: number;
  deduplicate?: boolean;
  retries?: number;
  timeout?: number;
}

class RequestOptimizer {
  private cache = new Map<string, CacheEntry<any>>();
  private pendingRequests = new Map<string, Promise<any>>();
  private defaultCacheDuration = 5 * 60 * 1000; // 5 minutes

  async get<T>(url: string, config: RequestConfig = {}): Promise<T> {
    const cacheKey = config.cacheKey || url;

    // Check cache first
    if (config.cacheDuration !== 0) {
      const cached = this.getFromCache<T>(cacheKey, config.cacheDuration);
      if (cached) {
        return cached;
      }
    }

    // Deduplicate concurrent requests
    if (config.deduplicate !== false) {
      const pending = this.pendingRequests.get(cacheKey);
      if (pending) {
        return pending;
      }
    }

    // Make the request
    const requestPromise = this.makeRequest<T>(url, config);

    if (config.deduplicate !== false) {
      this.pendingRequests.set(cacheKey, requestPromise);
    }

    try {
      const data = await requestPromise;

      // Cache the result
      if (config.cacheDuration !== 0) {
        this.setCache(cacheKey, data);
      }

      return data;
    } finally {
      this.pendingRequests.delete(cacheKey);
    }
  }

  async post<T>(
    url: string,
    data: any,
    config: RequestConfig = {},
  ): Promise<T> {
    // POST requests typically shouldn't be cached or deduplicated
    return apiClient.post<T>(url, data, {
      timeout: config.timeout,
    });
  }

  async put<T>(url: string, data: any, config: RequestConfig = {}): Promise<T> {
    // Clear related caches on update
    this.clearCachePattern(url);

    return apiClient.put<T>(url, data, {
      timeout: config.timeout,
    });
  }

  async delete<T>(url: string, config: RequestConfig = {}): Promise<T> {
    // Clear related caches on delete
    this.clearCachePattern(url);

    return apiClient.delete<T>(url, {
      timeout: config.timeout,
    });
  }

  // Batch multiple requests
  async batch<T extends Record<string, MaybeAsync<any>>>(
    requests: T,
  ): Promise<{ [K in keyof T]: Awaited<T[K]> }> {
    const entries = Object.entries(requests);
    const results = await Promise.all(
      entries.map(([key, request]) =>
        Promise.resolve(request).then((data) => ({ key, data })),
      ),
    );

    return results.reduce(
      (acc, { key, data }) => {
        acc[key as keyof T] = data;
        return acc;
      },
      {} as { [K in keyof T]: Awaited<T[K]> },
    );
  }

  // Prefetch data for future use
  async prefetch<T>(url: string, config: RequestConfig = {}): Promise<void> {
    await this.get<T>(url, {
      ...config,
      cacheDuration: config.cacheDuration || this.defaultCacheDuration,
    });
  }

  // Clear cache
  clearCache(key?: string): void {
    if (key) {
      this.cache.delete(key);
    } else {
      this.cache.clear();
    }
  }

  clearCachePattern(pattern: string): void {
    const regex = new RegExp(pattern);
    Array.from(this.cache.keys())
      .filter((key) => regex.test(key))
      .forEach((key) => this.cache.delete(key));
  }

  // Get cache statistics
  getCacheStats(): {
    size: number;
    keys: string[];
    oldestEntry?: Date;
    newestEntry?: Date;
  } {
    const entries = Array.from(this.cache.values());
    const timestamps = entries.map((e) => e.timestamp).sort();

    return {
      size: this.cache.size,
      keys: Array.from(this.cache.keys()),
      oldestEntry: timestamps[0] ? new Date(timestamps[0]) : undefined,
      newestEntry: timestamps[timestamps.length - 1]
        ? new Date(timestamps[timestamps.length - 1])
        : undefined,
    };
  }

  private getFromCache<T>(key: string, duration?: number): T | null {
    const entry = this.cache.get(key);
    if (!entry) return null;

    const maxAge = duration || this.defaultCacheDuration;
    if (Date.now() - entry.timestamp > maxAge) {
      this.cache.delete(key);
      return null;
    }

    return entry.data as T;
  }

  private setCache<T>(key: string, data: T): void {
    this.cache.set(key, {
      data,
      timestamp: Date.now(),
    });
  }

  private async makeRequest<T>(url: string, config: RequestConfig): Promise<T> {
    return apiClient.get<T>(url, {
      timeout: config.timeout,
    });
  }
}

// Singleton instance
export const requestOptimizer = new RequestOptimizer();

// Export the optimizer instance
export { requestOptimizer };
