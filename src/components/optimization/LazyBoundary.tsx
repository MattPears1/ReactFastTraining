import React, {
  Suspense,
  lazy,
  ComponentType,
  ReactNode,
  useEffect,
  useState,
} from "react";
import { ErrorBoundary } from "@components/common/ErrorBoundary";
import { LoadingSpinner } from "@components/common/LoadingStates";
import { useIntersectionObserver } from "@hooks/useIntersectionObserver";

interface LazyBoundaryProps {
  fallback?: ReactNode;
  errorFallback?: ReactNode;
  delay?: number;
  threshold?: number;
  rootMargin?: string;
  children: ReactNode;
}

export const LazyBoundary: React.FC<LazyBoundaryProps> = ({
  fallback = <LoadingSpinner size="md" />,
  errorFallback,
  delay = 0,
  children,
}) => {
  const [showFallback, setShowFallback] = useState(delay > 0);

  useEffect(() => {
    if (delay > 0) {
      const timer = setTimeout(() => setShowFallback(false), delay);
      return () => clearTimeout(timer);
    }
  }, [delay]);

  return (
    <ErrorBoundary fallback={errorFallback}>
      <Suspense fallback={showFallback ? fallback : null}>{children}</Suspense>
    </ErrorBoundary>
  );
};

// Lazy load with intersection observer
interface LazyLoadOptions {
  fallback?: ReactNode;
  errorFallback?: ReactNode;
  threshold?: number;
  rootMargin?: string;
  preload?: boolean;
}

export function lazyWithPreload<T extends ComponentType<any>>(
  importFn: () => Promise<{ default: T }>,
  options: LazyLoadOptions = {},
) {
  const LazyComponent = lazy(importFn);

  // Preload function
  const preload = () => {
    importFn();
  };

  // Wrapped component with intersection observer
  const WrappedComponent = (props: any) => {
    const [ref, isIntersecting] = useIntersectionObserver<HTMLDivElement>({
      threshold: options.threshold || 0,
      rootMargin: options.rootMargin || "50px",
      freezeOnceVisible: true,
    });

    // Preload on hover if enabled
    const handleMouseEnter = () => {
      if (options.preload && !isIntersecting) {
        preload();
      }
    };

    if (!isIntersecting) {
      return (
        <div
          ref={ref}
          onMouseEnter={handleMouseEnter}
          className="min-h-[200px] flex items-center justify-center"
        >
          {options.fallback || <LoadingSpinner size="md" />}
        </div>
      );
    }

    return (
      <LazyBoundary
        fallback={options.fallback}
        errorFallback={options.errorFallback}
      >
        <LazyComponent {...props} />
      </LazyBoundary>
    );
  };

  WrappedComponent.preload = preload;
  WrappedComponent.displayName = `LazyWithPreload(${LazyComponent.displayName || "Component"})`;

  return WrappedComponent;
}

// Route-based code splitting helper
interface RouteConfig {
  path: string;
  component: () => Promise<{ default: ComponentType<any> }>;
  preload?: boolean;
  exact?: boolean;
}

export function createLazyRoutes(routes: RouteConfig[]) {
  return routes.map((route) => ({
    ...route,
    component: lazyWithPreload(route.component, { preload: route.preload }),
  }));
}

// Progressive image loading
interface ProgressiveImageProps {
  src: string;
  placeholder?: string;
  alt: string;
  className?: string;
  onLoad?: () => void;
  onError?: () => void;
}

export const ProgressiveImage: React.FC<ProgressiveImageProps> = ({
  src,
  placeholder,
  alt,
  className,
  onLoad,
  onError,
}) => {
  const [currentSrc, setCurrentSrc] = useState(placeholder || "");
  const [isLoading, setIsLoading] = useState(true);
  const [ref, isIntersecting] = useIntersectionObserver<HTMLDivElement>({
    threshold: 0,
    rootMargin: "50px",
    freezeOnceVisible: true,
  });

  useEffect(() => {
    if (isIntersecting && src) {
      const img = new Image();
      img.src = src;

      img.onload = () => {
        setCurrentSrc(src);
        setIsLoading(false);
        onLoad?.();
      };

      img.onerror = () => {
        setIsLoading(false);
        onError?.();
      };
    }
  }, [isIntersecting, src, onLoad, onError]);

  return (
    <div ref={ref} className="relative">
      {isLoading && placeholder && (
        <img
          src={placeholder}
          alt={alt}
          className={`${className} filter blur-sm`}
          aria-hidden="true"
        />
      )}
      <img
        src={currentSrc}
        alt={alt}
        className={`${className} ${isLoading ? "opacity-0" : "opacity-100"} transition-opacity duration-300`}
        loading="lazy"
      />
    </div>
  );
};

// List virtualization wrapper
interface VirtualListProps<T> {
  items: T[];
  itemHeight: number;
  renderItem: (item: T, index: number) => ReactNode;
  overscan?: number;
  className?: string;
  onEndReached?: () => void;
  endReachedThreshold?: number;
}

export function VirtualList<T>({
  items,
  itemHeight,
  renderItem,
  overscan = 3,
  className,
  onEndReached,
  endReachedThreshold = 0.8,
}: VirtualListProps<T>) {
  const [scrollTop, setScrollTop] = useState(0);
  const [containerHeight, setContainerHeight] = useState(0);
  const containerRef = React.useRef<HTMLDivElement>(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const updateSize = () => {
      setContainerHeight(container.clientHeight);
    };

    const handleScroll = () => {
      setScrollTop(container.scrollTop);

      // Check if end reached
      if (onEndReached) {
        const scrollPercentage =
          (container.scrollTop + container.clientHeight) /
          container.scrollHeight;
        if (scrollPercentage > endReachedThreshold) {
          onEndReached();
        }
      }
    };

    updateSize();
    window.addEventListener("resize", updateSize);
    container.addEventListener("scroll", handleScroll, { passive: true });

    return () => {
      window.removeEventListener("resize", updateSize);
      container.removeEventListener("scroll", handleScroll);
    };
  }, [onEndReached, endReachedThreshold]);

  const totalHeight = items.length * itemHeight;
  const startIndex = Math.max(0, Math.floor(scrollTop / itemHeight) - overscan);
  const endIndex = Math.min(
    items.length,
    Math.ceil((scrollTop + containerHeight) / itemHeight) + overscan,
  );
  const visibleItems = items.slice(startIndex, endIndex);
  const offsetY = startIndex * itemHeight;

  return (
    <div
      ref={containerRef}
      className={`overflow-auto ${className}`}
      style={{ height: "100%" }}
    >
      <div style={{ height: totalHeight, position: "relative" }}>
        <div
          style={{
            transform: `translateY(${offsetY}px)`,
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
          }}
        >
          {visibleItems.map((item, index) => (
            <div key={startIndex + index} style={{ height: itemHeight }}>
              {renderItem(item, startIndex + index)}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
