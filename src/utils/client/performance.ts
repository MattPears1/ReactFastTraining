import { useEffect, useRef, useCallback, useState } from 'react';
import type { DependencyList } from 'react';

// Virtual scrolling hook for large lists
interface VirtualScrollOptions {
  itemHeight: number;
  containerHeight: number;
  overscan?: number;
  getItemHeight?: (index: number) => number;
}

export const useVirtualScroll = <T>(
  items: T[],
  options: VirtualScrollOptions
) => {
  const { itemHeight, containerHeight, overscan = 3, getItemHeight } = options;
  const [scrollTop, setScrollTop] = useState(0);
  const scrollElementRef = useRef<HTMLDivElement>(null);

  const totalHeight = getItemHeight
    ? items.reduce((sum, _, index) => sum + getItemHeight(index), 0)
    : items.length * itemHeight;

  const startIndex = Math.max(
    0,
    Math.floor(scrollTop / itemHeight) - overscan
  );

  const endIndex = Math.min(
    items.length - 1,
    Math.ceil((scrollTop + containerHeight) / itemHeight) + overscan
  );

  const visibleItems = items.slice(startIndex, endIndex + 1);

  const offsetY = getItemHeight
    ? items.slice(0, startIndex).reduce((sum, _, index) => sum + getItemHeight(index), 0)
    : startIndex * itemHeight;

  const handleScroll = useCallback((e: React.UIEvent<HTMLDivElement>) => {
    setScrollTop(e.currentTarget.scrollTop);
  }, []);

  return {
    scrollElementRef,
    visibleItems,
    totalHeight,
    offsetY,
    handleScroll,
    startIndex,
    endIndex,
  };
};

// Intersection observer hook for lazy loading
export const useIntersectionObserver = (
  callback: IntersectionObserverCallback,
  options?: IntersectionObserverInit
) => {
  const observerRef = useRef<IntersectionObserver | null>(null);
  const elementRefs = useRef<Set<Element>>(new Set());

  useEffect(() => {
    observerRef.current = new IntersectionObserver(callback, options);

    elementRefs.current.forEach(element => {
      observerRef.current?.observe(element);
    });

    return () => {
      observerRef.current?.disconnect();
    };
  }, [callback, options]);

  const observe = useCallback((element: Element | null) => {
    if (!element) return;

    elementRefs.current.add(element);
    observerRef.current?.observe(element);
  }, []);

  const unobserve = useCallback((element: Element | null) => {
    if (!element) return;

    elementRefs.current.delete(element);
    observerRef.current?.unobserve(element);
  }, []);

  return { observe, unobserve };
};

// Debounced value hook
export const useDebouncedValue = <T>(value: T, delay: number): T => {
  const [debouncedValue, setDebouncedValue] = useState(value);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => clearTimeout(timer);
  }, [value, delay]);

  return debouncedValue;
};

// Throttled callback hook
export const useThrottledCallback = <T extends (...args: any[]) => any>(
  callback: T,
  delay: number,
  deps: DependencyList
): T => {
  const lastCall = useRef(0);
  const timeout = useRef<NodeJS.Timeout>();

  return useCallback((...args: Parameters<T>) => {
    const now = Date.now();
    const timeSinceLastCall = now - lastCall.current;

    if (timeSinceLastCall >= delay) {
      lastCall.current = now;
      return callback(...args);
    }

    if (timeout.current) {
      clearTimeout(timeout.current);
    }

    timeout.current = setTimeout(() => {
      lastCall.current = Date.now();
      callback(...args);
    }, delay - timeSinceLastCall);
  }, [...deps, delay]) as T;
};

// Performance monitoring
export class PerformanceMonitor {
  private marks = new Map<string, number>();
  private measures = new Map<string, number[]>();

  mark(name: string): void {
    this.marks.set(name, performance.now());
  }

  measure(name: string, startMark: string, endMark?: string): number {
    const start = this.marks.get(startMark);
    if (!start) {
      console.warn(`Start mark "${startMark}" not found`);
      return 0;
    }

    const end = endMark ? this.marks.get(endMark) : performance.now();
    if (!end) {
      console.warn(`End mark "${endMark}" not found`);
      return 0;
    }

    const duration = end - start;
    
    if (!this.measures.has(name)) {
      this.measures.set(name, []);
    }
    this.measures.get(name)!.push(duration);

    return duration;
  }

  getAverageMeasure(name: string): number {
    const measures = this.measures.get(name);
    if (!measures || measures.length === 0) return 0;

    return measures.reduce((sum, val) => sum + val, 0) / measures.length;
  }

  logMetrics(): void {
    console.group('Performance Metrics');
    this.measures.forEach((values, name) => {
      const avg = values.reduce((sum, val) => sum + val, 0) / values.length;
      const min = Math.min(...values);
      const max = Math.max(...values);
      console.log(`${name}: avg=${avg.toFixed(2)}ms, min=${min.toFixed(2)}ms, max=${max.toFixed(2)}ms`);
    });
    console.groupEnd();
  }

  clear(): void {
    this.marks.clear();
    this.measures.clear();
  }
}

export const performanceMonitor = new PerformanceMonitor();

// Image lazy loading with blur-up effect
export const useLazyImage = (src: string, placeholder?: string) => {
  const [imageSrc, setImageSrc] = useState(placeholder || '');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    const img = new Image();
    
    img.onload = () => {
      setImageSrc(src);
      setIsLoading(false);
    };

    img.onerror = () => {
      setError(new Error('Failed to load image'));
      setIsLoading(false);
    };

    img.src = src;

    return () => {
      img.onload = null;
      img.onerror = null;
    };
  }, [src]);

  return { imageSrc, isLoading, error };
};

// Web Worker manager for heavy computations
export class WorkerManager<T = any, R = any> {
  private worker: Worker | null = null;
  private pending = new Map<string, { resolve: (value: R) => void; reject: (error: Error) => void }>();

  constructor(private workerPath: string) {}

  async execute(data: T): Promise<R> {
    if (!this.worker) {
      this.worker = new Worker(this.workerPath);
      this.worker.onmessage = this.handleMessage.bind(this);
      this.worker.onerror = this.handleError.bind(this);
    }

    const id = Math.random().toString(36).substr(2, 9);
    
    return new Promise((resolve, reject) => {
      this.pending.set(id, { resolve, reject });
      this.worker!.postMessage({ id, data });
    });
  }

  private handleMessage(event: MessageEvent): void {
    const { id, result, error } = event.data;
    const pending = this.pending.get(id);
    
    if (!pending) return;

    this.pending.delete(id);
    
    if (error) {
      pending.reject(new Error(error));
    } else {
      pending.resolve(result);
    }
  }

  private handleError(error: ErrorEvent): void {
    console.error('Worker error:', error);
    this.pending.forEach(({ reject }) => reject(new Error('Worker error')));
    this.pending.clear();
  }

  terminate(): void {
    this.worker?.terminate();
    this.worker = null;
    this.pending.clear();
  }
}

// Request animation frame hook
export const useAnimationFrame = (callback: (deltaTime: number) => void) => {
  const requestRef = useRef<number>();
  const previousTimeRef = useRef<number>();

  const animate = useCallback((time: number) => {
    if (previousTimeRef.current !== undefined) {
      const deltaTime = time - previousTimeRef.current;
      callback(deltaTime);
    }
    previousTimeRef.current = time;
    requestRef.current = requestAnimationFrame(animate);
  }, [callback]);

  useEffect(() => {
    requestRef.current = requestAnimationFrame(animate);
    return () => {
      if (requestRef.current) {
        cancelAnimationFrame(requestRef.current);
      }
    };
  }, [animate]);
};