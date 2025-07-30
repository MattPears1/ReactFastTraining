import { useEffect, useCallback } from "react";
import { useLocation } from "react-router-dom";
import {
  analytics,
  AnalyticsEvent,
  EcommerceEvent,
  ConversionEvent,
} from "@/services/analytics/analytics.service";

export const useAnalytics = () => {
  const trackEvent = useCallback((event: AnalyticsEvent) => {
    analytics.trackEvent(event);
  }, []);

  const trackEcommerce = useCallback((event: EcommerceEvent) => {
    analytics.trackEcommerce(event);
  }, []);

  const trackConversion = useCallback((conversion: ConversionEvent) => {
    analytics.trackConversion(conversion);
  }, []);

  const trackSearch = useCallback(
    (searchTerm: string, resultsCount?: number) => {
      analytics.trackSearch(searchTerm, resultsCount);
    },
    [],
  );

  const trackSocial = useCallback(
    (network: string, action: string, target?: string) => {
      analytics.trackSocialInteraction(network, action, target);
    },
    [],
  );

  const trackTiming = useCallback(
    (category: string, variable: string, value: number, label?: string) => {
      analytics.trackTiming(category, variable, value, label);
    },
    [],
  );

  const trackError = useCallback((error: Error, fatal: boolean = false) => {
    analytics.trackError(error, fatal);
  }, []);

  return {
    trackEvent,
    trackEcommerce,
    trackConversion,
    trackSearch,
    trackSocial,
    trackTiming,
    trackError,
  };
};

export const usePageTracking = () => {
  const location = useLocation();

  useEffect(() => {
    analytics.trackPageView({
      url: window.location.href,
      title: document.title,
      referrer: document.referrer,
    });
  }, [location]);
};

export const useErrorTracking = () => {
  useEffect(() => {
    const handleError = (event: ErrorEvent) => {
      analytics.trackError(new Error(event.message), false);
    };

    const handleUnhandledRejection = (event: PromiseRejectionEvent) => {
      analytics.trackError(new Error(event.reason), false);
    };

    window.addEventListener("error", handleError);
    window.addEventListener("unhandledrejection", handleUnhandledRejection);

    return () => {
      window.removeEventListener("error", handleError);
      window.removeEventListener(
        "unhandledrejection",
        handleUnhandledRejection,
      );
    };
  }, []);
};

export const usePerformanceTracking = () => {
  useEffect(() => {
    // Track page load performance
    if ("performance" in window && "timing" in window.performance) {
      window.addEventListener("load", () => {
        setTimeout(() => {
          const perfData = window.performance.timing;
          const pageLoadTime = perfData.loadEventEnd - perfData.navigationStart;
          const dnsTime = perfData.domainLookupEnd - perfData.domainLookupStart;
          const tcpTime = perfData.connectEnd - perfData.connectStart;
          const ttfb = perfData.responseStart - perfData.navigationStart;
          const domReady =
            perfData.domContentLoadedEventEnd - perfData.navigationStart;

          analytics.trackTiming("performance", "page_load", pageLoadTime);
          analytics.trackTiming("performance", "dns_lookup", dnsTime);
          analytics.trackTiming("performance", "tcp_connect", tcpTime);
          analytics.trackTiming("performance", "ttfb", ttfb);
          analytics.trackTiming("performance", "dom_ready", domReady);
        }, 0);
      });
    }

    // Track Largest Contentful Paint
    if ("PerformanceObserver" in window) {
      try {
        const lcpObserver = new PerformanceObserver((entryList) => {
          const entries = entryList.getEntries();
          const lastEntry = entries[entries.length - 1];
          analytics.trackTiming("performance", "lcp", lastEntry.startTime);
        });
        lcpObserver.observe({ entryTypes: ["largest-contentful-paint"] });

        // Track First Input Delay
        const fidObserver = new PerformanceObserver((entryList) => {
          const entries = entryList.getEntries();
          entries.forEach((entry: any) => {
            analytics.trackTiming(
              "performance",
              "fid",
              entry.processingStart - entry.startTime,
            );
          });
        });
        fidObserver.observe({ entryTypes: ["first-input"] });

        // Track Cumulative Layout Shift
        const clsObserver = new PerformanceObserver((entryList) => {
          let clsValue = 0;
          for (const entry of entryList.getEntries()) {
            if (!(entry as any).hadRecentInput) {
              clsValue += (entry as any).value;
            }
          }
          analytics.trackTiming("performance", "cls", clsValue * 1000); // Convert to ms
        });
        clsObserver.observe({ entryTypes: ["layout-shift"] });

        return () => {
          lcpObserver.disconnect();
          fidObserver.disconnect();
          clsObserver.disconnect();
        };
      } catch (e) {
        console.error("Performance tracking error:", e);
      }
    }
  }, []);
};

// Hook for tracking form interactions
export const useFormTracking = (formName: string) => {
  const trackFormStart = useCallback(() => {
    analytics.trackEvent({
      category: "form",
      action: "start",
      label: formName,
    });
  }, [formName]);

  const trackFormComplete = useCallback(() => {
    analytics.trackEvent({
      category: "form",
      action: "complete",
      label: formName,
    });
  }, [formName]);

  const trackFormError = useCallback(
    (field: string, error: string) => {
      analytics.trackEvent({
        category: "form",
        action: "error",
        label: formName,
        properties: { field, error },
      });
    },
    [formName],
  );

  const trackFormAbandon = useCallback(() => {
    analytics.trackEvent({
      category: "form",
      action: "abandon",
      label: formName,
    });
  }, [formName]);

  return {
    trackFormStart,
    trackFormComplete,
    trackFormError,
    trackFormAbandon,
  };
};

// Hook for tracking user engagement
export const useEngagementTracking = () => {
  useEffect(() => {
    let startTime = Date.now();
    let isHidden = false;

    const trackEngagement = () => {
      if (!isHidden) {
        const engagementTime = Date.now() - startTime;
        analytics.trackEvent({
          category: "engagement",
          action: "time_on_page",
          value: Math.round(engagementTime / 1000), // Convert to seconds
        });
      }
    };

    const handleVisibilityChange = () => {
      if (document.hidden) {
        isHidden = true;
        trackEngagement();
      } else {
        isHidden = false;
        startTime = Date.now();
      }
    };

    // Track engagement every 30 seconds
    const interval = setInterval(trackEngagement, 30000);

    // Track when page visibility changes
    document.addEventListener("visibilitychange", handleVisibilityChange);

    // Track when user leaves
    window.addEventListener("beforeunload", trackEngagement);

    return () => {
      clearInterval(interval);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      window.removeEventListener("beforeunload", trackEngagement);
      trackEngagement();
    };
  }, []);
};

// Hook for tracking scroll depth
export const useScrollTracking = () => {
  useEffect(() => {
    const scrollPercentages = [25, 50, 75, 90, 100];
    const trackedPercentages = new Set<number>();

    const handleScroll = () => {
      const windowHeight = window.innerHeight;
      const documentHeight = document.documentElement.scrollHeight;
      const scrollTop =
        window.pageYOffset || document.documentElement.scrollTop;
      const scrollPercentage = Math.round(
        (scrollTop / (documentHeight - windowHeight)) * 100,
      );

      scrollPercentages.forEach((percentage) => {
        if (
          scrollPercentage >= percentage &&
          !trackedPercentages.has(percentage)
        ) {
          trackedPercentages.add(percentage);
          analytics.trackEvent({
            category: "engagement",
            action: "scroll_depth",
            label: `${percentage}%`,
            value: percentage,
          });
        }
      });
    };

    window.addEventListener("scroll", handleScroll, { passive: true });

    return () => {
      window.removeEventListener("scroll", handleScroll);
    };
  }, []);
};
