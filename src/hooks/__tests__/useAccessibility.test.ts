import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { useAccessibility } from "../useAccessibility";

describe("useAccessibility Hook", () => {
  beforeEach(() => {
    // Reset document state
    document.body.className = "";
    localStorage.clear();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe("Keyboard Navigation", () => {
    it("detects keyboard navigation", () => {
      const { result } = renderHook(() => useAccessibility());

      expect(result.current.isKeyboardNav).toBe(false);

      // Simulate tab key press
      act(() => {
        const event = new KeyboardEvent("keydown", { key: "Tab" });
        window.dispatchEvent(event);
      });

      expect(result.current.isKeyboardNav).toBe(true);
      expect(document.body.classList.contains("keyboard-nav")).toBe(true);

      // Simulate mouse click
      act(() => {
        const event = new MouseEvent("mousedown");
        window.dispatchEvent(event);
      });

      expect(result.current.isKeyboardNav).toBe(false);
      expect(document.body.classList.contains("keyboard-nav")).toBe(false);
    });
  });

  describe("Reduced Motion", () => {
    it("respects prefers-reduced-motion", () => {
      Object.defineProperty(window, "matchMedia", {
        writable: true,
        value: vi.fn().mockImplementation((query) => ({
          matches: query === "(prefers-reduced-motion: reduce)",
          media: query,
          addEventListener: vi.fn(),
          removeEventListener: vi.fn(),
        })),
      });

      const { result } = renderHook(() => useAccessibility());

      expect(result.current.prefersReducedMotion).toBe(true);
    });

    it("toggles reduced motion preference", () => {
      const { result } = renderHook(() => useAccessibility());

      act(() => {
        result.current.toggleReducedMotion();
      });

      expect(result.current.prefersReducedMotion).toBe(true);
      expect(localStorage.getItem("prefers-reduced-motion")).toBe("true");
      expect(document.body.classList.contains("reduce-motion")).toBe(true);
    });
  });

  describe("High Contrast", () => {
    it("detects high contrast mode", () => {
      Object.defineProperty(window, "matchMedia", {
        writable: true,
        value: vi.fn().mockImplementation((query) => ({
          matches: query === "(prefers-contrast: high)",
          media: query,
          addEventListener: vi.fn(),
          removeEventListener: vi.fn(),
        })),
      });

      const { result } = renderHook(() => useAccessibility());

      expect(result.current.prefersHighContrast).toBe(true);
    });

    it("toggles high contrast mode", () => {
      const { result } = renderHook(() => useAccessibility());

      act(() => {
        result.current.toggleHighContrast();
      });

      expect(result.current.prefersHighContrast).toBe(true);
      expect(document.body.classList.contains("high-contrast")).toBe(true);
    });
  });

  describe("Font Size", () => {
    it("adjusts font size", () => {
      const { result } = renderHook(() => useAccessibility());

      expect(result.current.fontSize).toBe(100);

      act(() => {
        result.current.increaseFontSize();
      });

      expect(result.current.fontSize).toBe(110);
      expect(document.documentElement.style.fontSize).toBe("110%");

      act(() => {
        result.current.decreaseFontSize();
      });

      expect(result.current.fontSize).toBe(100);
    });

    it("respects min/max font size limits", () => {
      const { result } = renderHook(() => useAccessibility());

      // Try to decrease below minimum
      for (let i = 0; i < 10; i++) {
        act(() => {
          result.current.decreaseFontSize();
        });
      }

      expect(result.current.fontSize).toBe(80); // Minimum

      // Try to increase above maximum
      for (let i = 0; i < 20; i++) {
        act(() => {
          result.current.increaseFontSize();
        });
      }

      expect(result.current.fontSize).toBe(150); // Maximum
    });

    it("resets font size", () => {
      const { result } = renderHook(() => useAccessibility());

      act(() => {
        result.current.increaseFontSize();
        result.current.increaseFontSize();
      });

      expect(result.current.fontSize).toBe(120);

      act(() => {
        result.current.resetFontSize();
      });

      expect(result.current.fontSize).toBe(100);
    });
  });

  describe("Focus Management", () => {
    it("traps focus within element", () => {
      const { result } = renderHook(() => useAccessibility());

      const container = document.createElement("div");
      const button1 = document.createElement("button");
      const button2 = document.createElement("button");
      const button3 = document.createElement("button");

      container.appendChild(button1);
      container.appendChild(button2);
      container.appendChild(button3);
      document.body.appendChild(container);

      act(() => {
        result.current.trapFocus(container);
      });

      // Simulate tab from last element
      button3.focus();
      const tabEvent = new KeyboardEvent("keydown", {
        key: "Tab",
        shiftKey: false,
      });

      act(() => {
        container.dispatchEvent(tabEvent);
      });

      // Focus should wrap to first element
      expect(document.activeElement).toBe(button1);

      // Cleanup
      document.body.removeChild(container);
    });

    it("releases focus trap", () => {
      const { result } = renderHook(() => useAccessibility());

      const container = document.createElement("div");

      act(() => {
        result.current.trapFocus(container);
      });

      expect(result.current.focusTrap).toBe(container);

      act(() => {
        result.current.releaseFocus();
      });

      expect(result.current.focusTrap).toBeNull();
    });
  });

  describe("Screen Reader Announcements", () => {
    it("announces messages to screen readers", () => {
      const { result } = renderHook(() => useAccessibility());

      act(() => {
        result.current.announce("Important message");
      });

      const liveRegion = document.querySelector('[aria-live="polite"]');
      expect(liveRegion).toBeInTheDocument();
      expect(liveRegion?.textContent).toBe("Important message");
    });

    it("announces with different priorities", () => {
      const { result } = renderHook(() => useAccessibility());

      act(() => {
        result.current.announce("Urgent message", "assertive");
      });

      const liveRegion = document.querySelector('[aria-live="assertive"]');
      expect(liveRegion).toBeInTheDocument();
    });

    it("clears announcements after delay", async () => {
      vi.useFakeTimers();
      const { result } = renderHook(() => useAccessibility());

      act(() => {
        result.current.announce("Temporary message");
      });

      const liveRegion = document.querySelector('[aria-live="polite"]');
      expect(liveRegion?.textContent).toBe("Temporary message");

      act(() => {
        vi.advanceTimersByTime(1000);
      });

      expect(liveRegion?.textContent).toBe("");

      vi.useRealTimers();
    });
  });

  describe("Skip Links", () => {
    it("manages skip links", () => {
      const { result } = renderHook(() => useAccessibility());

      expect(result.current.skipLinks).toEqual([
        { id: "main", label: "Skip to main content" },
        { id: "nav", label: "Skip to navigation" },
        { id: "footer", label: "Skip to footer" },
      ]);

      act(() => {
        result.current.addSkipLink("search", "Skip to search");
      });

      expect(result.current.skipLinks).toHaveLength(4);
      expect(result.current.skipLinks[3]).toEqual({
        id: "search",
        label: "Skip to search",
      });
    });

    it("focuses skip link target", () => {
      const { result } = renderHook(() => useAccessibility());

      const main = document.createElement("main");
      main.id = "main";
      main.tabIndex = -1;
      document.body.appendChild(main);

      act(() => {
        result.current.skipTo("main");
      });

      expect(document.activeElement).toBe(main);

      document.body.removeChild(main);
    });
  });

  describe("ARIA Labels", () => {
    it("generates unique IDs for labels", () => {
      const { result } = renderHook(() => useAccessibility());

      const id1 = result.current.generateId("input");
      const id2 = result.current.generateId("input");

      expect(id1).not.toBe(id2);
      expect(id1).toMatch(/^input-\d+$/);
    });

    it("manages label associations", () => {
      const { result } = renderHook(() => useAccessibility());

      const input = document.createElement("input");
      const label = document.createElement("label");

      act(() => {
        result.current.associateLabel(input, label);
      });

      expect(input.id).toBeTruthy();
      expect(label.htmlFor).toBe(input.id);
    });
  });

  describe("Focus Indicators", () => {
    it("enhances focus indicators", () => {
      const { result } = renderHook(() => useAccessibility());

      act(() => {
        result.current.setFocusIndicator("ring");
      });

      expect(document.body.classList.contains("focus-ring")).toBe(true);

      act(() => {
        result.current.setFocusIndicator("outline");
      });

      expect(document.body.classList.contains("focus-outline")).toBe(true);
      expect(document.body.classList.contains("focus-ring")).toBe(false);
    });
  });

  describe("Preferences Persistence", () => {
    it("saves and loads preferences", () => {
      const { result: result1 } = renderHook(() => useAccessibility());

      act(() => {
        result1.current.toggleReducedMotion();
        result1.current.increaseFontSize();
      });

      // Create new hook instance
      const { result: result2 } = renderHook(() => useAccessibility());

      expect(result2.current.prefersReducedMotion).toBe(true);
      expect(result2.current.fontSize).toBe(110);
    });
  });

  describe("Accessibility Checker", () => {
    it("checks for common accessibility issues", () => {
      const { result } = renderHook(() => useAccessibility());

      // Create elements with issues
      const img = document.createElement("img");
      img.src = "test.jpg"; // No alt text

      const button = document.createElement("button");
      // No text content

      document.body.appendChild(img);
      document.body.appendChild(button);

      const issues = result.current.checkAccessibility();

      expect(issues).toContainEqual(
        expect.objectContaining({
          type: "missing-alt",
          element: img,
        }),
      );

      expect(issues).toContainEqual(
        expect.objectContaining({
          type: "empty-button",
          element: button,
        }),
      );

      // Cleanup
      document.body.removeChild(img);
      document.body.removeChild(button);
    });
  });
});
