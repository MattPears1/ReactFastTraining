import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@utils/cn";
import { Link } from "react-router-dom";

interface RippleButtonProps {
  children: React.ReactNode;
  onClick?: () => void;
  href?: string;
  variant?: "primary" | "secondary" | "outline";
  size?: "sm" | "md" | "lg";
  fullWidth?: boolean;
  className?: string;
  type?: "button" | "submit" | "reset";
  disabled?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

interface Ripple {
  x: number;
  y: number;
  id: number;
}

export const RippleButton: React.FC<RippleButtonProps> = ({
  children,
  onClick,
  href,
  variant = "primary",
  size = "md",
  fullWidth = false,
  className,
  type = "button",
  disabled = false,
  leftIcon,
  rightIcon,
}) => {
  const [ripples, setRipples] = useState<Ripple[]>([]);

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
      onClick();
    }
  };

  const baseClasses = cn(
    "relative overflow-hidden inline-flex items-center justify-center font-medium transition-all duration-200",
    "focus:outline-none focus:ring-2 focus:ring-offset-2",
    {
      "bg-gradient-to-r from-primary-500 to-primary-600 text-white hover:from-primary-600 hover:to-primary-700 focus:ring-primary-500":
        variant === "primary",
      "bg-gradient-to-r from-secondary-500 to-secondary-600 text-white hover:from-secondary-600 hover:to-secondary-700 focus:ring-secondary-500":
        variant === "secondary",
      "border-2 border-primary-500 text-primary-600 hover:bg-primary-50 focus:ring-primary-500":
        variant === "outline",
      "px-3 py-1.5 text-sm rounded-md": size === "sm",
      "px-4 py-2 text-base rounded-lg": size === "md",
      "px-6 py-3 text-lg rounded-xl": size === "lg",
      "w-full": fullWidth,
      "opacity-50 cursor-not-allowed": disabled,
    },
    className,
  );

  const content = (
    <>
      {leftIcon && <span className="mr-2">{leftIcon}</span>}
      {children}
      {rightIcon && <span className="ml-2">{rightIcon}</span>}
      <AnimatePresence>
        {ripples.map((ripple) => (
          <motion.span
            key={ripple.id}
            className="absolute bg-white/30 rounded-full pointer-events-none"
            style={{ left: ripple.x, top: ripple.y }}
            initial={{ width: 0, height: 0, x: 0, y: 0, opacity: 1 }}
            animate={{
              width: 300,
              height: 300,
              x: -150,
              y: -150,
              opacity: 0,
            }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.6, ease: "easeOut" }}
          />
        ))}
      </AnimatePresence>
    </>
  );

  if (href) {
    return (
      <Link to={href} className={baseClasses} onClick={createRipple}>
        {content}
      </Link>
    );
  }

  return (
    <button
      type={type}
      className={baseClasses}
      onClick={createRipple}
      disabled={disabled}
    >
      {content}
    </button>
  );
};
