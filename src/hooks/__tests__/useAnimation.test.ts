import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { useAnimation } from "../useAnimation";

describe("useAnimation Hook", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe("useFadeIn", () => {
    it("starts with opacity 0 and transitions to 1", () => {
      const { result } = renderHook(() => useAnimation.useFadeIn());

      expect(result.current.style.opacity).toBe(0);

      act(() => {
        vi.advanceTimersByTime(500);
      });

      expect(result.current.style.opacity).toBe(1);
    });

    it("respects custom duration", () => {
      const { result } = renderHook(() =>
        useAnimation.useFadeIn({ duration: 1000 }),
      );

      expect(result.current.style.transition).toContain("1000ms");
    });

    it("applies delay when specified", () => {
      const { result } = renderHook(() =>
        useAnimation.useFadeIn({ delay: 200 }),
      );

      expect(result.current.style.opacity).toBe(0);

      act(() => {
        vi.advanceTimersByTime(100);
      });

      // Should still be 0 due to delay
      expect(result.current.style.opacity).toBe(0);

      act(() => {
        vi.advanceTimersByTime(200);
      });

      // Now should be visible
      expect(result.current.style.opacity).toBe(1);
    });

    it("triggers onComplete callback", () => {
      const onComplete = vi.fn();
      renderHook(() => useAnimation.useFadeIn({ onComplete }));

      act(() => {
        vi.advanceTimersByTime(1000);
      });

      expect(onComplete).toHaveBeenCalled();
    });
  });

  describe("useSlideIn", () => {
    it("slides in from the right by default", () => {
      const { result } = renderHook(() => useAnimation.useSlideIn());

      expect(result.current.style.transform).toContain("translateX(100%)");

      act(() => {
        vi.advanceTimersByTime(500);
      });

      expect(result.current.style.transform).toContain("translateX(0)");
    });

    it("slides in from specified direction", () => {
      const directions = ["left", "right", "top", "bottom"] as const;

      directions.forEach((direction) => {
        const { result } = renderHook(() =>
          useAnimation.useSlideIn({ direction }),
        );

        if (direction === "left") {
          expect(result.current.style.transform).toContain("translateX(-100%)");
        } else if (direction === "right") {
          expect(result.current.style.transform).toContain("translateX(100%)");
        } else if (direction === "top") {
          expect(result.current.style.transform).toContain("translateY(-100%)");
        } else if (direction === "bottom") {
          expect(result.current.style.transform).toContain("translateY(100%)");
        }
      });
    });

    it("respects custom distance", () => {
      const { result } = renderHook(() =>
        useAnimation.useSlideIn({ distance: 50 }),
      );

      expect(result.current.style.transform).toContain("translateX(50px)");
    });
  });

  describe("useScale", () => {
    it("scales from 0 to 1 by default", () => {
      const { result } = renderHook(() => useAnimation.useScale());

      expect(result.current.style.transform).toContain("scale(0)");

      act(() => {
        vi.advanceTimersByTime(500);
      });

      expect(result.current.style.transform).toContain("scale(1)");
    });

    it("scales between custom values", () => {
      const { result } = renderHook(() =>
        useAnimation.useScale({ from: 0.5, to: 1.5 }),
      );

      expect(result.current.style.transform).toContain("scale(0.5)");

      act(() => {
        vi.advanceTimersByTime(500);
      });

      expect(result.current.style.transform).toContain("scale(1.5)");
    });
  });

  describe("useRotate", () => {
    it("rotates to specified angle", () => {
      const { result } = renderHook(() =>
        useAnimation.useRotate({ angle: 180 }),
      );

      expect(result.current.style.transform).toContain("rotate(0deg)");

      act(() => {
        vi.advanceTimersByTime(500);
      });

      expect(result.current.style.transform).toContain("rotate(180deg)");
    });

    it("supports continuous rotation", () => {
      const { result } = renderHook(() =>
        useAnimation.useRotate({ continuous: true }),
      );

      expect(result.current.style.animation).toContain("spin");
      expect(result.current.style.animationIterationCount).toBe("infinite");
    });
  });

  describe("useStagger", () => {
    it("staggers animations for multiple elements", () => {
      const { result } = renderHook(() =>
        useAnimation.useStagger({ count: 3, delay: 100 }),
      );

      expect(result.current.getDelay(0)).toBe(0);
      expect(result.current.getDelay(1)).toBe(100);
      expect(result.current.getDelay(2)).toBe(200);
    });

    it("applies stagger styles correctly", () => {
      const { result } = renderHook(() =>
        useAnimation.useStagger({ count: 3, delay: 100 }),
      );

      const style1 = result.current.getStyle(0);
      const style2 = result.current.getStyle(1);

      expect(style1.transitionDelay).toBe("0ms");
      expect(style2.transitionDelay).toBe("100ms");
    });
  });

  describe("useParallax", () => {
    it("applies parallax effect based on scroll", () => {
      const { result } = renderHook(() => useAnimation.useParallax());

      // Mock scroll position
      Object.defineProperty(window, "scrollY", {
        writable: true,
        value: 100,
      });

      act(() => {
        window.dispatchEvent(new Event("scroll"));
      });

      expect(result.current.offset).toBeGreaterThan(0);
    });

    it("respects speed multiplier", () => {
      const { result: slow } = renderHook(() =>
        useAnimation.useParallax({ speed: 0.5 }),
      );
      const { result: fast } = renderHook(() =>
        useAnimation.useParallax({ speed: 2 }),
      );

      Object.defineProperty(window, "scrollY", {
        writable: true,
        value: 100,
      });

      act(() => {
        window.dispatchEvent(new Event("scroll"));
      });

      expect(fast.current.offset).toBeGreaterThan(slow.current.offset);
    });

    it("cleans up scroll listener on unmount", () => {
      const removeEventListenerSpy = vi.spyOn(window, "removeEventListener");
      const { unmount } = renderHook(() => useAnimation.useParallax());

      unmount();

      expect(removeEventListenerSpy).toHaveBeenCalledWith(
        "scroll",
        expect.any(Function),
      );
    });
  });

  describe("useIntersectionAnimation", () => {
    let mockIntersectionObserver: any;

    beforeEach(() => {
      mockIntersectionObserver = vi.fn((callback) => ({
        observe: vi.fn(),
        unobserve: vi.fn(),
        disconnect: vi.fn(),
        trigger: (entries: any[]) => callback(entries),
      }));

      global.IntersectionObserver = mockIntersectionObserver;
    });

    it("triggers animation when element intersects", () => {
      const { result } = renderHook(() => useIntersectionAnimation());

      const element = document.createElement("div");
      result.current.ref.current = element;

      const observer = mockIntersectionObserver.mock.results[0].value;

      act(() => {
        observer.trigger([{ isIntersecting: true, target: element }]);
      });

      expect(result.current.isIntersecting).toBe(true);
    });

    it("respects threshold option", () => {
      renderHook(() => useIntersectionAnimation({ threshold: 0.5 }));

      expect(mockIntersectionObserver).toHaveBeenCalledWith(
        expect.any(Function),
        expect.objectContaining({ threshold: 0.5 }),
      );
    });

    it("triggers once when specified", () => {
      const { result } = renderHook(() =>
        useIntersectionAnimation({ once: true }),
      );

      const element = document.createElement("div");
      result.current.ref.current = element;

      const observer = mockIntersectionObserver.mock.results[0].value;

      // First intersection
      act(() => {
        observer.trigger([{ isIntersecting: true, target: element }]);
      });

      expect(result.current.hasIntersected).toBe(true);

      // Leave viewport
      act(() => {
        observer.trigger([{ isIntersecting: false, target: element }]);
      });

      // Re-enter viewport
      act(() => {
        observer.trigger([{ isIntersecting: true, target: element }]);
      });

      // Should not re-trigger animation
      expect(observer.unobserve).toHaveBeenCalledWith(element);
    });
  });

  describe("useSpring", () => {
    it("applies spring physics to animation", () => {
      const { result } = renderHook(() => useAnimation.useSpring());

      expect(result.current.value).toBe(0);

      act(() => {
        result.current.setValue(100);
      });

      // Spring animation should overshoot
      act(() => {
        vi.advanceTimersByTime(100);
      });

      expect(result.current.value).toBeGreaterThan(100);

      // Should settle back to target
      act(() => {
        vi.advanceTimersByTime(1000);
      });

      expect(result.current.value).toBeCloseTo(100, 1);
    });

    it("respects stiffness and damping", () => {
      const { result: stiff } = renderHook(() =>
        useAnimation.useSpring({ stiffness: 300, damping: 10 }),
      );
      const { result: soft } = renderHook(() =>
        useAnimation.useSpring({ stiffness: 100, damping: 30 }),
      );

      act(() => {
        stiff.current.setValue(100);
        soft.current.setValue(100);
      });

      act(() => {
        vi.advanceTimersByTime(50);
      });

      // Stiffer spring should move faster initially
      expect(stiff.current.value).toBeGreaterThan(soft.current.value);
    });
  });

  describe("useAnimationGroup", () => {
    it("coordinates multiple animations", () => {
      const { result } = renderHook(() =>
        useAnimation.useAnimationGroup([
          { type: "fadeIn", duration: 500 },
          { type: "slideIn", duration: 500, delay: 200 },
          { type: "scale", duration: 300, delay: 400 },
        ]),
      );

      expect(result.current.animations).toHaveLength(3);
      expect(result.current.isPlaying).toBe(false);

      act(() => {
        result.current.play();
      });

      expect(result.current.isPlaying).toBe(true);

      act(() => {
        vi.advanceTimersByTime(1000);
      });

      expect(result.current.isComplete).toBe(true);
    });

    it("supports sequential animations", () => {
      const onComplete = vi.fn();
      const { result } = renderHook(() =>
        useAnimation.useAnimationGroup(
          [
            { type: "fadeIn", duration: 200 },
            { type: "slideIn", duration: 200 },
          ],
          { sequential: true, onComplete },
        ),
      );

      act(() => {
        result.current.play();
      });

      act(() => {
        vi.advanceTimersByTime(200);
      });

      // First animation complete, second should start
      expect(result.current.currentIndex).toBe(1);

      act(() => {
        vi.advanceTimersByTime(200);
      });

      expect(result.current.isComplete).toBe(true);
      expect(onComplete).toHaveBeenCalled();
    });
  });
});
