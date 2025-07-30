import { useEffect, useRef, useCallback, useState } from "react";
import { useLocation } from "react-router-dom";

export const useFocusManagement = () => {
  const location = useLocation();
  const previousPath = useRef(location.pathname);

  useEffect(() => {
    if (previousPath.current !== location.pathname) {
      // Reset focus to main content on route change
      const mainContent = document.getElementById("main-content");
      if (mainContent) {
        mainContent.focus();
      }
      previousPath.current = location.pathname;
    }
  }, [location]);
};

export const useAnnouncement = () => {
  const announce = (
    message: string,
    priority: "polite" | "assertive" = "polite",
  ) => {
    const announcement = document.createElement("div");
    announcement.setAttribute("role", "status");
    announcement.setAttribute("aria-live", priority);
    announcement.className = "sr-only";
    announcement.textContent = message;

    document.body.appendChild(announcement);

    setTimeout(() => {
      document.body.removeChild(announcement);
    }, 1000);
  };

  return { announce };
};

export const useKeyboardNavigation = (
  itemsRef: React.RefObject<HTMLElement[]>,
  onSelect?: (index: number) => void,
) => {
  const handleKeyDown = (event: React.KeyboardEvent, currentIndex: number) => {
    const items = itemsRef.current;
    if (!items) return;

    let nextIndex = currentIndex;

    switch (event.key) {
      case "ArrowDown":
        event.preventDefault();
        nextIndex = currentIndex < items.length - 1 ? currentIndex + 1 : 0;
        break;
      case "ArrowUp":
        event.preventDefault();
        nextIndex = currentIndex > 0 ? currentIndex - 1 : items.length - 1;
        break;
      case "Home":
        event.preventDefault();
        nextIndex = 0;
        break;
      case "End":
        event.preventDefault();
        nextIndex = items.length - 1;
        break;
      case "Enter":
      case " ":
        event.preventDefault();
        if (onSelect) {
          onSelect(currentIndex);
        }
        return;
      default:
        return;
    }

    items[nextIndex]?.focus();
  };

  return { handleKeyDown };
};

export const useEscapeKey = (onEscape: () => void) => {
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        onEscape();
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [onEscape]);
};

export const useTrapFocus = (ref: React.RefObject<HTMLElement>) => {
  useEffect(() => {
    const element = ref.current;
    if (!element) return;

    const focusableElements = element.querySelectorAll(
      'a[href], button, textarea, input[type="text"], input[type="radio"], input[type="checkbox"], select, [tabindex]:not([tabindex="-1"])',
    );

    const firstFocusable = focusableElements[0] as HTMLElement;
    const lastFocusable = focusableElements[
      focusableElements.length - 1
    ] as HTMLElement;

    const handleTabKey = (event: KeyboardEvent) => {
      if (event.key !== "Tab") return;

      if (event.shiftKey) {
        if (document.activeElement === firstFocusable) {
          event.preventDefault();
          lastFocusable?.focus();
        }
      } else {
        if (document.activeElement === lastFocusable) {
          event.preventDefault();
          firstFocusable?.focus();
        }
      }
    };

    element.addEventListener("keydown", handleTabKey);
    firstFocusable?.focus();

    return () => {
      element.removeEventListener("keydown", handleTabKey);
    };
  }, [ref]);
};

/**
 * Hook for reduced motion preference
 */
export const useReducedMotion = () => {
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);

  useEffect(() => {
    const mediaQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
    setPrefersReducedMotion(mediaQuery.matches);

    const handleChange = (e: MediaQueryListEvent) => {
      setPrefersReducedMotion(e.matches);
    };

    mediaQuery.addEventListener("change", handleChange);
    return () => mediaQuery.removeEventListener("change", handleChange);
  }, []);

  return prefersReducedMotion;
};

/**
 * Hook for form field error announcements
 */
export const useFieldErrorAnnouncements = (errors: Record<string, any>) => {
  const { announce } = useAnnouncement();
  const previousErrorsRef = useRef<string[]>([]);

  useEffect(() => {
    const currentErrors = Object.entries(errors)
      .filter(([_, error]) => error)
      .map(([field, error]) => {
        const message = error?.message || error;
        return `${field.replace(/([A-Z])/g, " $1").toLowerCase()}: ${message}`;
      });

    const newErrors = currentErrors.filter(
      (error) => !previousErrorsRef.current.includes(error),
    );

    if (newErrors.length > 0) {
      const errorMessage =
        newErrors.length === 1
          ? `Validation error: ${newErrors[0]}`
          : `${newErrors.length} validation errors: ${newErrors.join(". ")}`;

      announce(errorMessage, "assertive");
    }

    previousErrorsRef.current = currentErrors;
  }, [errors, announce]);
};

/**
 * Hook for high contrast mode detection
 */
export const useHighContrast = () => {
  const [isHighContrast, setIsHighContrast] = useState(false);

  useEffect(() => {
    const mediaQuery = window.matchMedia("(prefers-contrast: high)");
    setIsHighContrast(mediaQuery.matches);

    const handleChange = (e: MediaQueryListEvent) => {
      setIsHighContrast(e.matches);
    };

    mediaQuery.addEventListener("change", handleChange);
    return () => mediaQuery.removeEventListener("change", handleChange);
  }, []);

  return isHighContrast;
};
