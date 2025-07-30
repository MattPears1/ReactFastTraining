import React from "react";
import { motion } from "framer-motion";
import { cn } from "@utils/cn";

interface LoadingSpinnerProps {
  size?: "sm" | "md" | "lg" | "xl";
  variant?: "default" | "dots" | "bars" | "pulse" | "medical";
  color?: "primary" | "secondary" | "white";
  className?: string;
  label?: string;
}

const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({
  size = "md",
  variant = "default",
  color = "primary",
  className,
  label,
}) => {
  const sizes = {
    sm: "w-4 h-4",
    md: "w-8 h-8",
    lg: "w-12 h-12",
    xl: "w-16 h-16",
  };

  const colors = {
    primary: "text-primary-500",
    secondary: "text-secondary-500",
    white: "text-white",
  };

  // Default spinner
  if (variant === "default") {
    return (
      <div className={cn("flex flex-col items-center gap-3", className)}>
        <div
          className={cn(
            "animate-spin rounded-full border-2 border-current border-t-transparent",
            sizes[size],
            colors[color]
          )}
          role="status"
          aria-label={label || "Loading"}
        />
        {label && (
          <span className="text-sm text-gray-600 dark:text-gray-400 animate-pulse">
            {label}
          </span>
        )}
      </div>
    );
  }

  // Dots variant
  if (variant === "dots") {
    return (
      <div className={cn("flex items-center gap-1", className)}>
        {[0, 1, 2].map((i) => (
          <motion.div
            key={i}
            className={cn(
              "rounded-full bg-current",
              size === "sm" && "w-1.5 h-1.5",
              size === "md" && "w-2 h-2",
              size === "lg" && "w-3 h-3",
              size === "xl" && "w-4 h-4",
              colors[color]
            )}
            animate={{
              scale: [1, 1.5, 1],
              opacity: [0.5, 1, 0.5],
            }}
            transition={{
              duration: 1.2,
              repeat: Infinity,
              delay: i * 0.2,
            }}
          />
        ))}
        {label && (
          <span className="ml-2 text-sm text-gray-600 dark:text-gray-400">
            {label}
          </span>
        )}
      </div>
    );
  }

  // Bars variant
  if (variant === "bars") {
    return (
      <div className={cn("flex items-end gap-1", className)}>
        {[0, 1, 2, 3].map((i) => (
          <motion.div
            key={i}
            className={cn(
              "bg-current rounded-full",
              size === "sm" && "w-1 h-3",
              size === "md" && "w-1.5 h-6",
              size === "lg" && "w-2 h-8",
              size === "xl" && "w-3 h-12",
              colors[color]
            )}
            animate={{
              scaleY: [0.3, 1, 0.3],
            }}
            transition={{
              duration: 1,
              repeat: Infinity,
              delay: i * 0.15,
              ease: "easeInOut",
            }}
          />
        ))}
        {label && (
          <span className="ml-3 text-sm text-gray-600 dark:text-gray-400">
            {label}
          </span>
        )}
      </div>
    );
  }

  // Pulse variant
  if (variant === "pulse") {
    return (
      <div className={cn("flex flex-col items-center gap-3", className)}>
        <div className="relative">
          <motion.div
            className={cn(
              "rounded-full bg-current",
              sizes[size],
              colors[color]
            )}
            animate={{
              scale: [1, 1.2, 1],
              opacity: [1, 0.7, 1],
            }}
            transition={{
              duration: 1.5,
              repeat: Infinity,
              ease: "easeInOut",
            }}
          />
          <motion.div
            className={cn(
              "absolute inset-0 rounded-full bg-current",
              colors[color]
            )}
            animate={{
              scale: [1, 1.5, 2],
              opacity: [0.5, 0.3, 0],
            }}
            transition={{
              duration: 1.5,
              repeat: Infinity,
              ease: "easeOut",
            }}
          />
        </div>
        {label && (
          <span className="text-sm text-gray-600 dark:text-gray-400 animate-pulse">
            {label}
          </span>
        )}
      </div>
    );
  }

  // Medical variant (heartbeat)
  if (variant === "medical") {
    return (
      <div className={cn("flex flex-col items-center gap-3", className)}>
        <div className="relative">
          <svg
            className={cn(sizes[size], colors[color])}
            viewBox="0 0 24 24"
            fill="currentColor"
          >
            <motion.path
              d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"
              animate={{
                scale: [1, 1.2, 1, 1.1, 1],
              }}
              transition={{
                duration: 1.5,
                repeat: Infinity,
                times: [0, 0.14, 0.28, 0.42, 1],
              }}
            />
          </svg>
          <motion.div
            className={cn(
              "absolute inset-0 rounded-full",
              colors[color]
            )}
            style={{
              background: `radial-gradient(circle, currentColor 0%, transparent 70%)`,
              opacity: 0.3,
            }}
            animate={{
              scale: [1, 1.4, 1.8],
              opacity: [0.3, 0.1, 0],
            }}
            transition={{
              duration: 1.5,
              repeat: Infinity,
              ease: "easeOut",
            }}
          />
        </div>
        {label && (
          <span className="text-sm text-gray-600 dark:text-gray-400 animate-pulse">
            {label}
          </span>
        )}
      </div>
    );
  }

  return null;
};

// Full page loading overlay
export const LoadingOverlay: React.FC<{
  isLoading: boolean;
  label?: string;
  variant?: LoadingSpinnerProps["variant"];
}> = ({ isLoading, label = "Loading...", variant = "default" }) => {
  if (!isLoading) return null;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm z-50 flex items-center justify-center"
    >
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl p-8">
        <LoadingSpinner size="lg" variant={variant} label={label} />
      </div>
    </motion.div>
  );
};

export default LoadingSpinner;