import { useEffect, useRef, useCallback } from "react";

interface UseModalBehaviorOptions {
  isOpen: boolean;
  onClose: () => void;
  closeOnEscape?: boolean;
  closeOnClickOutside?: boolean;
  preventScroll?: boolean;
}

export function useModalBehavior({
  isOpen,
  onClose,
  closeOnEscape = true,
  closeOnClickOutside = true,
  preventScroll = true,
}: UseModalBehaviorOptions) {
  const modalRef = useRef<HTMLDivElement>(null);

  // Handle escape key
  useEffect(() => {
    if (!closeOnEscape || !isOpen) return;

    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose();
      }
    };

    document.addEventListener("keydown", handleEscape);
    return () => document.removeEventListener("keydown", handleEscape);
  }, [isOpen, onClose, closeOnEscape]);

  // Prevent body scroll
  useEffect(() => {
    if (!preventScroll) return;

    if (isOpen) {
      const scrollbarWidth =
        window.innerWidth - document.documentElement.clientWidth;
      document.body.style.overflow = "hidden";
      document.body.style.paddingRight = `${scrollbarWidth}px`;
    } else {
      document.body.style.overflow = "";
      document.body.style.paddingRight = "";
    }

    return () => {
      document.body.style.overflow = "";
      document.body.style.paddingRight = "";
    };
  }, [isOpen, preventScroll]);

  // Handle click outside
  const handleClickOutside = useCallback(
    (e: MouseEvent) => {
      if (!closeOnClickOutside || !modalRef.current) return;

      const target = e.target as Node;
      if (!modalRef.current.contains(target)) {
        onClose();
      }
    },
    [onClose, closeOnClickOutside],
  );

  useEffect(() => {
    if (!closeOnClickOutside || !isOpen) return;

    // Delay to avoid closing on the same click that opened the modal
    const timer = setTimeout(() => {
      document.addEventListener("mousedown", handleClickOutside);
    }, 0);

    return () => {
      clearTimeout(timer);
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isOpen, handleClickOutside, closeOnClickOutside]);

  // Focus trap
  useEffect(() => {
    if (!isOpen || !modalRef.current) return;

    const focusableElements = modalRef.current.querySelectorAll(
      'a[href], button, textarea, input[type="text"], input[type="radio"], input[type="checkbox"], select',
    );
    const firstFocusable = focusableElements[0] as HTMLElement;
    const lastFocusable = focusableElements[
      focusableElements.length - 1
    ] as HTMLElement;

    const handleTabKey = (e: KeyboardEvent) => {
      if (e.key !== "Tab") return;

      if (e.shiftKey) {
        if (document.activeElement === firstFocusable) {
          lastFocusable?.focus();
          e.preventDefault();
        }
      } else {
        if (document.activeElement === lastFocusable) {
          firstFocusable?.focus();
          e.preventDefault();
        }
      }
    };

    document.addEventListener("keydown", handleTabKey);
    firstFocusable?.focus();

    return () => {
      document.removeEventListener("keydown", handleTabKey);
    };
  }, [isOpen]);

  return { modalRef };
}
