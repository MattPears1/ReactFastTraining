import { useCallback, useEffect, useState } from "react";
import { DataCache } from "@utils/cache";

interface UseCacheOptions<T> {
  cache: DataCache<T>;
  key: string;
  fetcher: () => Promise<T>;
  ttl?: number;
  staleTime?: number;
  onError?: (error: Error) => void;
  enabled?: boolean;
}

interface CacheState<T> {
  data: T | null;
  error: Error | null;
  isLoading: boolean;
  isStale: boolean;
  lastFetch: number | null;
}

export function useCache<T>({
  cache,
  key,
  fetcher,
  ttl,
  staleTime = 0,
  onError,
  enabled = true,
}: UseCacheOptions<T>) {
  const [state, setState] = useState<CacheState<T>>({
    data: null,
    error: null,
    isLoading: false,
    isStale: false,
    lastFetch: null,
  });

  // Check if data is stale
  const checkStaleness = useCallback(() => {
    if (!state.lastFetch || !staleTime) return false;
    return Date.now() - state.lastFetch > staleTime;
  }, [state.lastFetch, staleTime]);

  // Fetch data
  const fetchData = useCallback(
    async (force = false) => {
      if (!enabled) return;

      // Check cache first unless forced
      if (!force) {
        const cached = cache.get(key);
        if (cached !== null) {
          setState({
            data: cached,
            error: null,
            isLoading: false,
            isStale: checkStaleness(),
            lastFetch: Date.now(),
          });
          return cached;
        }
      }

      // Fetch fresh data
      setState((prev) => ({ ...prev, isLoading: true, error: null }));

      try {
        const data = await fetcher();
        cache.set(key, data, ttl);

        setState({
          data,
          error: null,
          isLoading: false,
          isStale: false,
          lastFetch: Date.now(),
        });

        return data;
      } catch (error) {
        const err = error as Error;
        setState((prev) => ({
          ...prev,
          error: err,
          isLoading: false,
        }));
        onError?.(err);
        throw err;
      }
    },
    [cache, key, fetcher, ttl, enabled, checkStaleness, onError],
  );

  // Initial fetch
  useEffect(() => {
    if (enabled) {
      fetchData();
    }
  }, [key, enabled]); // Only re-fetch if key or enabled changes

  // Check staleness periodically
  useEffect(() => {
    if (!staleTime || !state.data) return;

    const interval = setInterval(() => {
      setState((prev) => ({
        ...prev,
        isStale: checkStaleness(),
      }));
    }, 1000); // Check every second

    return () => clearInterval(interval);
  }, [staleTime, state.data, checkStaleness]);

  const refresh = useCallback(() => {
    return fetchData(true);
  }, [fetchData]);

  const mutate = useCallback(
    (data: T | ((prev: T | null) => T)) => {
      const newData = typeof data === "function" ? data(state.data) : data;
      cache.set(key, newData, ttl);
      setState((prev) => ({
        ...prev,
        data: newData,
        lastFetch: Date.now(),
        isStale: false,
      }));
    },
    [cache, key, ttl, state.data],
  );

  const invalidate = useCallback(() => {
    cache.delete(key);
    setState((prev) => ({
      ...prev,
      data: null,
      isStale: false,
      lastFetch: null,
    }));
  }, [cache, key]);

  return {
    data: state.data,
    error: state.error,
    isLoading: state.isLoading,
    isStale: state.isStale,
    refresh,
    mutate,
    invalidate,
  };
}

// Hook for caching API responses
export function useCachedApi<T>(
  endpoint: string,
  options?: Partial<UseCacheOptions<T>> & {
    params?: Record<string, any>;
    headers?: Record<string, string>;
  },
) {
  const { params, headers, ...cacheOptions } = options || {};

  // Generate cache key from endpoint and params
  const cacheKey = params
    ? `${endpoint}?${new URLSearchParams(params).toString()}`
    : endpoint;

  const fetcher = useCallback(async () => {
    const response = await fetch(endpoint, {
      headers: {
        "Content-Type": "application/json",
        ...headers,
      },
    });

    if (!response.ok) {
      throw new Error(`API error: ${response.statusText}`);
    }

    return response.json();
  }, [endpoint, headers]);

  return useCache({
    cache: new DataCache<T>(),
    key: cacheKey,
    fetcher,
    ttl: 5 * 60 * 1000, // 5 minutes default
    staleTime: 60 * 1000, // 1 minute default
    ...cacheOptions,
  });
}
