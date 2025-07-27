import { useState, useCallback, useRef, useEffect } from 'react';

interface AsyncState<T> {
  data: T | null;
  error: Error | null;
  isLoading: boolean;
  isSuccess: boolean;
  isError: boolean;
}

interface UseAsyncOptions {
  onSuccess?: (data: any) => void;
  onError?: (error: Error) => void;
  retryCount?: number;
  retryDelay?: number;
}

export function useAsync<T = any>(
  asyncFunction: (...args: any[]) => Promise<T>,
  options: UseAsyncOptions = {}
) {
  const { onSuccess, onError, retryCount = 0, retryDelay = 1000 } = options;
  
  const [state, setState] = useState<AsyncState<T>>({
    data: null,
    error: null,
    isLoading: false,
    isSuccess: false,
    isError: false,
  });

  const isMountedRef = useRef(true);
  const abortControllerRef = useRef<AbortController | null>(null);

  useEffect(() => {
    return () => {
      isMountedRef.current = false;
      abortControllerRef.current?.abort();
    };
  }, []);

  const execute = useCallback(
    async (...args: any[]) => {
      // Cancel any pending request
      abortControllerRef.current?.abort();
      abortControllerRef.current = new AbortController();

      setState({
        data: null,
        error: null,
        isLoading: true,
        isSuccess: false,
        isError: false,
      });

      let attempts = 0;
      
      while (attempts <= retryCount) {
        try {
          const result = await asyncFunction(...args, {
            signal: abortControllerRef.current.signal,
          });

          if (isMountedRef.current) {
            setState({
              data: result,
              error: null,
              isLoading: false,
              isSuccess: true,
              isError: false,
            });
            onSuccess?.(result);
          }

          return result;
        } catch (error: any) {
          if (error.name === 'AbortError') {
            // Request was cancelled
            return;
          }

          attempts++;
          
          if (attempts > retryCount) {
            if (isMountedRef.current) {
              setState({
                data: null,
                error,
                isLoading: false,
                isSuccess: false,
                isError: true,
              });
              onError?.(error);
            }
            throw error;
          }

          // Wait before retrying
          await new Promise(resolve => setTimeout(resolve, retryDelay));
        }
      }
    },
    [asyncFunction, onSuccess, onError, retryCount, retryDelay]
  );

  const reset = useCallback(() => {
    setState({
      data: null,
      error: null,
      isLoading: false,
      isSuccess: false,
      isError: false,
    });
  }, []);

  return {
    execute,
    reset,
    ...state,
  };
}

// Specialized version for API calls
export function useApiCall<T = any>(
  apiCall: (...args: any[]) => Promise<T>,
  options: UseAsyncOptions = {}
) {
  return useAsync(apiCall, {
    retryCount: 3,
    retryDelay: 1000,
    ...options,
  });
}