import { useEffect, useRef, useState, RefObject } from "react";

interface UseIntersectionObserverOptions extends IntersectionObserverInit {
  freezeOnceVisible?: boolean;
  onChange?: (
    isIntersecting: boolean,
    entry: IntersectionObserverEntry,
  ) => void;
}

export function useIntersectionObserver<T extends Element>(
  options: UseIntersectionObserverOptions = {},
): [RefObject<T>, boolean, IntersectionObserverEntry | undefined] {
  const {
    threshold = 0,
    root = null,
    rootMargin = "0%",
    freezeOnceVisible = false,
    onChange,
  } = options;

  const elementRef = useRef<T>(null);
  const [entry, setEntry] = useState<IntersectionObserverEntry>();
  const [isIntersecting, setIsIntersecting] = useState(false);
  const frozen = useRef(false);

  useEffect(() => {
    const element = elementRef.current;
    if (!element || frozen.current) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        const isElementIntersecting = entry.isIntersecting;

        setEntry(entry);
        setIsIntersecting(isElementIntersecting);
        onChange?.(isElementIntersecting, entry);

        if (freezeOnceVisible && isElementIntersecting) {
          frozen.current = true;
          observer.disconnect();
        }
      },
      { threshold, root, rootMargin },
    );

    observer.observe(element);

    return () => {
      observer.disconnect();
    };
  }, [threshold, root, rootMargin, freezeOnceVisible, onChange]);

  return [elementRef, isIntersecting, entry];
}

// Specialized hook for lazy loading
export function useLazyLoading<T extends Element>(
  options?: Omit<UseIntersectionObserverOptions, "freezeOnceVisible">,
) {
  const [hasLoaded, setHasLoaded] = useState(false);

  const [ref, isIntersecting] = useIntersectionObserver<T>({
    ...options,
    freezeOnceVisible: true,
    onChange: (isIntersecting) => {
      if (isIntersecting) {
        setHasLoaded(true);
      }
    },
  });

  return {
    ref,
    hasLoaded,
    isIntersecting,
  };
}

// Hook for infinite scroll
export function useInfiniteScroll(
  callback: () => void | Promise<void>,
  options?: UseIntersectionObserverOptions & {
    enabled?: boolean;
    delay?: number;
  },
) {
  const { enabled = true, delay = 0, ...observerOptions } = options || {};
  const [isLoading, setIsLoading] = useState(false);
  const timeoutRef = useRef<NodeJS.Timeout>();

  const [ref, isIntersecting] = useIntersectionObserver<HTMLDivElement>({
    ...observerOptions,
    onChange: async (isIntersecting) => {
      if (isIntersecting && enabled && !isLoading) {
        if (timeoutRef.current) {
          clearTimeout(timeoutRef.current);
        }

        timeoutRef.current = setTimeout(async () => {
          setIsLoading(true);
          try {
            await callback();
          } finally {
            setIsLoading(false);
          }
        }, delay);
      }
    },
  });

  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  return {
    ref,
    isLoading,
    isIntersecting,
  };
}
