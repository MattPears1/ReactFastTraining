import { useState, useEffect, useRef, useCallback } from "react";

/**
 * Hook that delays updating a value until after a specified delay
 */
export function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
}

/**
 * Hook that returns a debounced callback function
 */
export function useDebouncedCallback<T extends (...args: any[]) => any>(
  callback: T,
  delay: number,
  options: { leading?: boolean; trailing?: boolean; maxWait?: number } = {},
): [T, () => void] {
  const { leading = false, trailing = true, maxWait } = options;

  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const lastCallTimeRef = useRef<number | null>(null);
  const lastInvokeTimeRef = useRef<number>(0);
  const leadingRef = useRef(leading);
  const trailingRef = useRef(trailing);
  const maxWaitRef = useRef(maxWait);
  const callbackRef = useRef(callback);

  // Update callback ref when it changes
  useEffect(() => {
    callbackRef.current = callback;
  }, [callback]);

  const cancel = useCallback(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
    lastCallTimeRef.current = null;
  }, []);

  const debouncedCallback = useCallback(
    (...args: Parameters<T>) => {
      const now = Date.now();
      const isFirstCall = !lastCallTimeRef.current;
      lastCallTimeRef.current = now;

      const invokeCallback = () => {
        lastInvokeTimeRef.current = Date.now();
        lastCallTimeRef.current = null;
        timeoutRef.current = null;
        callbackRef.current(...args);
      };

      const shouldInvokeLeading = leadingRef.current && isFirstCall;
      const shouldInvokeTrailing = trailingRef.current;

      // Clear existing timeout
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }

      // Handle leading edge
      if (shouldInvokeLeading) {
        invokeCallback();
      }

      // Handle maxWait
      if (maxWaitRef.current && lastInvokeTimeRef.current) {
        const timeSinceLastInvoke = now - lastInvokeTimeRef.current;
        if (timeSinceLastInvoke >= maxWaitRef.current) {
          invokeCallback();
          return;
        }
      }

      // Set up trailing edge
      if (shouldInvokeTrailing) {
        timeoutRef.current = setTimeout(() => {
          if (lastCallTimeRef.current && trailingRef.current) {
            invokeCallback();
          }
        }, delay);
      }
    },
    [delay, cancel],
  ) as T;

  // Cleanup on unmount
  useEffect(() => {
    return cancel;
  }, [cancel]);

  return [debouncedCallback, cancel];
}

/**
 * Hook for debounced search input
 */
export function useDebouncedSearch(
  initialValue = "",
  delay = 500,
): {
  value: string;
  debouncedValue: string;
  setValue: (value: string) => void;
  clear: () => void;
} {
  const [value, setValue] = useState(initialValue);
  const debouncedValue = useDebounce(value, delay);

  const clear = useCallback(() => {
    setValue("");
  }, []);

  return {
    value,
    debouncedValue,
    setValue,
    clear,
  };
}
