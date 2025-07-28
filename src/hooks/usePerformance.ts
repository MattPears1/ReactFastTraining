import { useEffect, useRef, useState, useCallback } from "react";
import { debounce } from "@utils/helpers";

interface PerformanceMetrics {
  renderTime: number;
  updateTime: number;
  componentName: string;
  timestamp: number;
  memoryUsage?: number;
}

interface PerformanceOptions {
  trackMemory?: boolean;
  trackRenderCount?: boolean;
  warnThreshold?: number;
  enableLogging?: boolean;
}

export const usePerformance = (
  componentName: string,
  options: PerformanceOptions = {},
) => {
  const {
    trackMemory = true,
    trackRenderCount = true,
    warnThreshold = 16.67, // 60fps threshold
    enableLogging = process.env.NODE_ENV === "development",
  } = options;

  const renderCount = useRef(0);
  const lastRenderTime = useRef(performance.now());
  const [metrics, setMetrics] = useState<PerformanceMetrics[]>([]);

  // Track render performance
  useEffect(() => {
    const currentTime = performance.now();
    const renderTime = currentTime - lastRenderTime.current;
    lastRenderTime.current = currentTime;

    if (trackRenderCount) {
      renderCount.current++;
    }

    const metric: PerformanceMetrics = {
      renderTime,
      updateTime: 0,
      componentName,
      timestamp: currentTime,
    };

    // Track memory if available
    if (trackMemory && "memory" in performance) {
      metric.memoryUsage = (performance as any).memory.usedJSHeapSize;
    }

    // Warn if render time exceeds threshold
    if (renderTime > warnThreshold && enableLogging) {
      console.warn(
        `[Performance] ${componentName} render took ${renderTime.toFixed(2)}ms (threshold: ${warnThreshold}ms)`,
      );
    }

    setMetrics((prev) => [...prev.slice(-99), metric]);
  });

  // Mark performance measures
  const markStart = useCallback(
    (label: string) => {
      performance.mark(`${componentName}-${label}-start`);
    },
    [componentName],
  );

  const markEnd = useCallback(
    (label: string) => {
      const startMark = `${componentName}-${label}-start`;
      const endMark = `${componentName}-${label}-end`;
      const measureName = `${componentName}-${label}`;

      performance.mark(endMark);
      performance.measure(measureName, startMark, endMark);

      const measure = performance.getEntriesByName(measureName)[0];
      if (measure && enableLogging) {
        console.log(
          `[Performance] ${measureName}: ${measure.duration.toFixed(2)}ms`,
        );
      }

      // Cleanup marks
      performance.clearMarks(startMark);
      performance.clearMarks(endMark);
      performance.clearMeasures(measureName);

      return measure?.duration || 0;
    },
    [componentName, enableLogging],
  );

  // Get average metrics
  const getAverageMetrics = useCallback(() => {
    if (metrics.length === 0) return null;

    const sum = metrics.reduce(
      (acc, metric) => ({
        renderTime: acc.renderTime + metric.renderTime,
        memoryUsage: (acc.memoryUsage || 0) + (metric.memoryUsage || 0),
      }),
      { renderTime: 0, memoryUsage: 0 },
    );

    return {
      averageRenderTime: sum.renderTime / metrics.length,
      averageMemoryUsage: sum.memoryUsage / metrics.length,
      renderCount: renderCount.current,
      totalSamples: metrics.length,
    };
  }, [metrics]);

  // Report metrics (debounced)
  const reportMetrics = useCallback(
    debounce(() => {
      const averages = getAverageMetrics();
      if (averages && enableLogging) {
        console.log(`[Performance Summary] ${componentName}:`, averages);
      }
    }, 5000),
    [componentName, getAverageMetrics, enableLogging],
  );

  useEffect(() => {
    reportMetrics();
  }, [metrics, reportMetrics]);

  return {
    markStart,
    markEnd,
    metrics,
    renderCount: renderCount.current,
    getAverageMetrics,
  };
};

// Memory leak detector
export const useMemoryLeakDetector = (
  componentName: string,
  threshold = 10 * 1024 * 1024, // 10MB
) => {
  const initialMemory = useRef<number>(0);
  const [isLeaking, setIsLeaking] = useState(false);

  useEffect(() => {
    if (!("memory" in performance)) return;

    const checkMemory = () => {
      const currentMemory = (performance as any).memory.usedJSHeapSize;

      if (initialMemory.current === 0) {
        initialMemory.current = currentMemory;
        return;
      }

      const memoryIncrease = currentMemory - initialMemory.current;

      if (memoryIncrease > threshold) {
        setIsLeaking(true);
        console.warn(
          `[Memory Leak] ${componentName} may have a memory leak. Memory increased by ${(
            memoryIncrease /
            1024 /
            1024
          ).toFixed(2)}MB`,
        );
      }
    };

    const interval = setInterval(checkMemory, 5000);
    return () => clearInterval(interval);
  }, [componentName, threshold]);

  return { isLeaking };
};

// FPS monitor
export const useFPSMonitor = () => {
  const [fps, setFPS] = useState(0);
  const frameCount = useRef(0);
  const lastTime = useRef(performance.now());

  useEffect(() => {
    let animationId: number;

    const measureFPS = () => {
      frameCount.current++;
      const currentTime = performance.now();
      const delta = currentTime - lastTime.current;

      if (delta >= 1000) {
        const currentFPS = Math.round((frameCount.current * 1000) / delta);
        setFPS(currentFPS);
        frameCount.current = 0;
        lastTime.current = currentTime;
      }

      animationId = requestAnimationFrame(measureFPS);
    };

    animationId = requestAnimationFrame(measureFPS);

    return () => {
      if (animationId) {
        cancelAnimationFrame(animationId);
      }
    };
  }, []);

  return { fps, isLowFPS: fps < 30 && fps > 0 };
};

// Bundle size analyzer
export const useBundleSizeAnalyzer = () => {
  const [bundleInfo, setBundleInfo] = useState<{
    scripts: number;
    styles: number;
    total: number;
  }>({ scripts: 0, styles: 0, total: 0 });

  useEffect(() => {
    const analyzeBundle = () => {
      const scripts = performance
        .getEntriesByType("resource")
        .filter((entry) => entry.name.endsWith(".js"))
        .reduce((sum, entry) => sum + entry.transferSize, 0);

      const styles = performance
        .getEntriesByType("resource")
        .filter((entry) => entry.name.endsWith(".css"))
        .reduce((sum, entry) => sum + entry.transferSize, 0);

      setBundleInfo({
        scripts: scripts / 1024, // Convert to KB
        styles: styles / 1024,
        total: (scripts + styles) / 1024,
      });
    };

    // Wait for all resources to load
    if (document.readyState === "complete") {
      analyzeBundle();
    } else {
      window.addEventListener("load", analyzeBundle);
      return () => window.removeEventListener("load", analyzeBundle);
    }
  }, []);

  return bundleInfo;
};

// Render optimization hook
export const useRenderOptimization = <T extends Record<string, any>>(
  props: T,
  dependencies: any[] = [],
) => {
  const previousProps = useRef<T>(props);
  const changedProps = useRef<Partial<T>>({});
  const renderCount = useRef(0);

  useEffect(() => {
    renderCount.current++;

    // Track which props changed
    const changes: Partial<T> = {};
    let hasChanges = false;

    Object.keys(props).forEach((key) => {
      if (previousProps.current[key] !== props[key]) {
        changes[key as keyof T] = props[key];
        hasChanges = true;
      }
    });

    if (hasChanges) {
      changedProps.current = changes;
      previousProps.current = { ...props };
    }
  }, dependencies);

  return {
    renderCount: renderCount.current,
    changedProps: changedProps.current,
    shouldSkipRender: Object.keys(changedProps.current).length === 0,
  };
};
