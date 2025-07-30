import React, { forwardRef, useState } from "react";
import { Link } from "react-router-dom";
import { motion, HTMLMotionProps, AnimatePresence } from "framer-motion";
import { cn } from "@utils/cn";

export interface ButtonProps extends Omit<HTMLMotionProps<"button">, "size"> {
  variant?:
    | "primary"
    | "secondary"
    | "outline"
    | "ghost"
    | "danger"
    | "success";
  size?: "sm" | "md" | "lg" | "xl";
  fullWidth?: boolean;
  loading?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  href?: string;
  external?: boolean;
}

interface Ripple {
  x: number;
  y: number;
  id: number;
}

const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      children,
      variant = "primary",
      size = "md",
      fullWidth = false,
      loading = false,
      leftIcon,
      rightIcon,
      href,
      external,
      className,
      disabled,
      onClick,
      ...props
    },
    ref,
  ) => {
    const [ripples, setRipples] = useState<Ripple[]>([]);
    const [isHovered, setIsHovered] = useState(false);

    const createRipple = (event: React.MouseEvent<HTMLElement>) => {
      const button = event.currentTarget;
      const rect = button.getBoundingClientRect();
      const x = event.clientX - rect.left;
      const y = event.clientY - rect.top;
      const ripple = { x, y, id: Date.now() };

      setRipples([...ripples, ripple]);
      setTimeout(() => {
        setRipples((prev) => prev.filter((r) => r.id !== ripple.id));
      }, 600);

      if (onClick && !href) {
        onClick(event as any);
      }
    };
    const baseStyles =
      "relative inline-flex items-center justify-center font-semibold transition-all duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed overflow-hidden";

    const variants = {
      primary:
        "bg-primary-600 text-white hover:bg-primary-700 shadow-sm hover:shadow-md transition-all focus-visible:ring-primary-500",
      secondary:
        "bg-secondary-600 text-white hover:bg-secondary-700 shadow-sm hover:shadow-md transition-all focus-visible:ring-secondary-500",
      outline:
        "border-2 border-primary-400 text-primary-700 dark:text-primary-300 hover:bg-primary-50 dark:hover:bg-primary-900/10 hover:border-primary-500 transition-all",
      ghost:
        "text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 hover:text-primary-600 dark:hover:text-primary-400 transition-all",
      danger:
        "bg-gray-100 text-error border border-error/20 hover:bg-error/10 hover:border-error/40 focus-visible:ring-error/50 transition-all",
      success:
        "bg-secondary-600 text-white hover:bg-secondary-700 shadow-sm hover:shadow-md transition-all focus-visible:ring-secondary-500",
    };

    const sizes = {
      sm: "px-4 py-3 sm:px-3 sm:py-1.5 text-base sm:text-sm rounded gap-1.5 min-h-[48px] sm:min-h-[32px]",
      md: "px-5 py-3.5 sm:px-4 sm:py-2 text-base sm:text-sm rounded-md gap-2 min-h-[48px] sm:min-h-[36px]",
      lg: "px-6 py-4 sm:px-5 sm:py-3 text-base rounded-md gap-2 min-h-[52px] sm:min-h-[42px]",
      xl: "px-8 py-4 sm:px-6 sm:py-3.5 text-lg sm:text-base rounded-md gap-3 min-h-[56px] sm:min-h-[48px]",
    };

    const iconSizes = {
      sm: "w-3.5 h-3.5",
      md: "w-4 h-4",
      lg: "w-5 h-5",
      xl: "w-6 h-6",
    };

    const loadingIconSize = iconSizes[size];

    const buttonClasses = cn(
      baseStyles,
      variants[variant],
      sizes[size],
      fullWidth && "w-full",
      className,
    );

    const content = (
      <>
        {loading ? (
          <span
            className={cn(
              "animate-spin border-2 border-current border-t-transparent rounded-full",
              loadingIconSize,
            )}
          />
        ) : leftIcon ? (
          <span className={loadingIconSize}>
            {leftIcon}
          </span>
        ) : null}
        <span className="relative z-10">{children}</span>
        {!loading && rightIcon && (
          <span className={loadingIconSize}>
            {rightIcon}
          </span>
        )}
        {/* Ripple effects container */}
        <AnimatePresence>
          {ripples.map((ripple) => (
            <motion.span
              key={ripple.id}
              className="absolute bg-white/30 rounded-full pointer-events-none"
              style={{
                left: ripple.x,
                top: ripple.y,
              }}
              initial={{ width: 0, height: 0, opacity: 0.5 }}
              animate={{ width: 400, height: 400, opacity: 0 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.6, ease: "easeOut" }}
            />
          ))}
        </AnimatePresence>
      </>
    );

    if (href && !disabled) {
      if (external) {
        return (
          <a
            href={href}
            target="_blank"
            rel="noopener noreferrer"
            className={buttonClasses}
          >
            {content}
          </a>
        );
      }

      return (
        <Link to={href} className={buttonClasses}>
          {content}
        </Link>
      );
    }

    return (
      <motion.button
        ref={ref}
        className={buttonClasses}
        disabled={disabled || loading}
        whileHover={{ scale: disabled || loading ? 1 : 1.02 }}
        whileTap={{ scale: disabled || loading ? 1 : 0.98 }}
        onHoverStart={() => setIsHovered(true)}
        onHoverEnd={() => setIsHovered(false)}
        onClick={createRipple}
        transition={{ type: "spring", stiffness: 400, damping: 25 }}
        {...props}
      >
        {content}
      </motion.button>
    );
  },
);

Button.displayName = "Button";

export { Button };
export default Button;
