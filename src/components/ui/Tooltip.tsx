import React, { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@utils/cn";

interface TooltipProps {
  children: React.ReactElement;
  content: string | React.ReactNode;
  position?: "top" | "bottom" | "left" | "right";
  delay?: number;
  className?: string;
  contentClassName?: string;
  showArrow?: boolean;
}

const Tooltip: React.FC<TooltipProps> = ({
  children,
  content,
  position = "top",
  delay = 200,
  className,
  contentClassName,
  showArrow = true,
}) => {
  const [isVisible, setIsVisible] = useState(false);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const tooltipRef = useRef<HTMLDivElement>(null);

  const showTooltip = () => {
    timeoutRef.current = setTimeout(() => {
      setIsVisible(true);
    }, delay);
  };

  const hideTooltip = () => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    setIsVisible(false);
  };

  const positions = {
    top: "bottom-full left-1/2 -translate-x-1/2 mb-3",
    bottom: "top-full left-1/2 -translate-x-1/2 mt-3",
    left: "right-full top-1/2 -translate-y-1/2 mr-3",
    right: "left-full top-1/2 -translate-y-1/2 ml-3",
  };

  const arrows = {
    top: "top-full left-1/2 -translate-x-1/2 -mt-1",
    bottom: "bottom-full left-1/2 -translate-x-1/2 -mb-1 rotate-180",
    left: "left-full top-1/2 -translate-y-1/2 -ml-1 -rotate-90",
    right: "right-full top-1/2 -translate-y-1/2 -mr-1 rotate-90",
  };

  return (
    <div className="relative inline-block">
      {React.cloneElement(children, {
        onMouseEnter: showTooltip,
        onMouseLeave: hideTooltip,
        onFocus: showTooltip,
        onBlur: hideTooltip,
        "aria-describedby": isVisible ? "tooltip" : undefined,
      })}

      <AnimatePresence>
        {isVisible && (
          <motion.div
            ref={tooltipRef}
            initial={{ 
              opacity: 0, 
              scale: 0.95,
              ...(position === "top" && { y: 5 }),
              ...(position === "bottom" && { y: -5 }),
              ...(position === "left" && { x: 5 }),
              ...(position === "right" && { x: -5 }),
            }}
            animate={{ opacity: 1, scale: 1, x: 0, y: 0 }}
            exit={{ 
              opacity: 0, 
              scale: 0.95,
              ...(position === "top" && { y: 5 }),
              ...(position === "bottom" && { y: -5 }),
              ...(position === "left" && { x: 5 }),
              ...(position === "right" && { x: -5 }),
            }}
            transition={{ 
              duration: 0.2,
              ease: [0.4, 0, 0.2, 1]
            }}
            className={cn(
              "absolute z-50 pointer-events-none",
              positions[position],
              className
            )}
          >
            <div
              id="tooltip"
              role="tooltip"
              className={cn(
                "px-4 py-2.5 text-sm font-medium text-white bg-gray-900/95 dark:bg-gray-100/95 dark:text-gray-900",
                "rounded-lg shadow-xl backdrop-blur-sm",
                "border border-gray-800/20 dark:border-gray-200/20",
                "max-w-xs break-words",
                contentClassName
              )}
            >
              {content}
              {showArrow && (
                <div
                  className={cn(
                    "absolute w-2.5 h-2.5 bg-gray-900/95 dark:bg-gray-100/95 transform rotate-45",
                    "border-l border-t border-gray-800/20 dark:border-gray-200/20",
                    arrows[position],
                  )}
                />
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default Tooltip;
