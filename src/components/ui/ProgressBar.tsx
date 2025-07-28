import React from "react";
import { cn } from "@/utils/cn";
import { motion } from "framer-motion";

interface ProgressBarProps {
  value: number;
  max?: number;
  size?: "xs" | "sm" | "md" | "lg";
  variant?: "primary" | "secondary" | "success" | "warning" | "error";
  showLabel?: boolean;
  label?: string;
  animated?: boolean;
  striped?: boolean;
  indeterminate?: boolean;
  className?: string;
}

const ProgressBar: React.FC<ProgressBarProps> = ({
  value,
  max = 100,
  size = "md",
  variant = "primary",
  showLabel = false,
  label,
  animated = true,
  striped = false,
  indeterminate = false,
  className,
}) => {
  const percentage = indeterminate
    ? 100
    : Math.min(100, Math.max(0, (value / max) * 100));

  const sizeClasses = {
    xs: "h-1",
    sm: "h-2",
    md: "h-3",
    lg: "h-4",
  };

  const variantClasses = {
    primary: "bg-primary-600 dark:bg-primary-500",
    secondary: "bg-secondary-600 dark:bg-secondary-500",
    success: "bg-green-600 dark:bg-green-500",
    warning: "bg-yellow-600 dark:bg-yellow-500",
    error: "bg-red-600 dark:bg-red-500",
  };

  const stripedClass = striped ? "bg-stripes bg-stripes-animated" : "";

  const indeterminateClass = indeterminate
    ? "animate-progress-indeterminate"
    : "";

  return (
    <div className={cn("w-full", className)}>
      {(showLabel || label) && (
        <div className="flex justify-between items-center mb-1">
          <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
            {label || "Progress"}
          </span>
          {!indeterminate && (
            <span className="text-sm text-gray-600 dark:text-gray-400">
              {percentage.toFixed(0)}%
            </span>
          )}
        </div>
      )}

      <div
        className={cn(
          "w-full bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden",
          sizeClasses[size],
        )}
        role="progressbar"
        aria-valuenow={value}
        aria-valuemin={0}
        aria-valuemax={max}
      >
        {animated ? (
          <motion.div
            className={cn(
              "h-full rounded-full transition-all",
              variantClasses[variant],
              stripedClass,
              indeterminateClass,
            )}
            initial={{ width: 0 }}
            animate={{ width: indeterminate ? "30%" : `${percentage}%` }}
            transition={{ duration: 0.5, ease: "easeOut" }}
          />
        ) : (
          <div
            className={cn(
              "h-full rounded-full transition-all",
              variantClasses[variant],
              stripedClass,
              indeterminateClass,
            )}
            style={{ width: indeterminate ? "30%" : `${percentage}%` }}
          />
        )}
      </div>
    </div>
  );
};

// Circular Progress
export const CircularProgress: React.FC<{
  value: number;
  size?: number;
  strokeWidth?: number;
  variant?: ProgressBarProps["variant"];
  showLabel?: boolean;
  className?: string;
}> = ({
  value,
  size = 120,
  strokeWidth = 8,
  variant = "primary",
  showLabel = true,
  className,
}) => {
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const offset = circumference - (value / 100) * circumference;

  const variantColors = {
    primary: "stroke-primary-600 dark:stroke-primary-500",
    secondary: "stroke-secondary-600 dark:stroke-secondary-500",
    success: "stroke-green-600 dark:stroke-green-500",
    warning: "stroke-yellow-600 dark:stroke-yellow-500",
    error: "stroke-red-600 dark:stroke-red-500",
  };

  return (
    <div className={cn("relative inline-flex", className)}>
      <svg width={size} height={size} className="transform -rotate-90">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="currentColor"
          strokeWidth={strokeWidth}
          fill="none"
          className="text-gray-200 dark:text-gray-700"
        />
        <motion.circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          strokeWidth={strokeWidth}
          fill="none"
          className={variantColors[variant]}
          initial={{ strokeDashoffset: circumference }}
          animate={{ strokeDashoffset: offset }}
          transition={{ duration: 0.5, ease: "easeOut" }}
          style={{
            strokeDasharray: `${circumference} ${circumference}`,
            strokeLinecap: "round",
          }}
        />
      </svg>
      {showLabel && (
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="text-lg font-semibold text-gray-900 dark:text-white">
            {value}%
          </span>
        </div>
      )}
    </div>
  );
};

// Multi-step Progress
export const StepProgress: React.FC<{
  currentStep: number;
  totalSteps: number;
  labels?: string[];
  variant?: ProgressBarProps["variant"];
  className?: string;
}> = ({ currentStep, totalSteps, labels, variant = "primary", className }) => {
  const variantClasses = {
    primary: "bg-primary-600 dark:bg-primary-500",
    secondary: "bg-secondary-600 dark:bg-secondary-500",
    success: "bg-green-600 dark:bg-green-500",
    warning: "bg-yellow-600 dark:bg-yellow-500",
    error: "bg-red-600 dark:bg-red-500",
  };

  return (
    <div className={cn("w-full", className)}>
      <div className="flex items-center justify-between">
        {[...Array(totalSteps)].map((_, index) => {
          const stepNumber = index + 1;
          const isCompleted = stepNumber < currentStep;
          const isCurrent = stepNumber === currentStep;
          const isLast = stepNumber === totalSteps;

          return (
            <React.Fragment key={index}>
              <div className="flex flex-col items-center">
                <motion.div
                  className={cn(
                    "w-10 h-10 rounded-full flex items-center justify-center text-sm font-medium transition-colors",
                    isCompleted || isCurrent
                      ? cn(variantClasses[variant], "text-white")
                      : "bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-400",
                  )}
                  initial={{ scale: 0.8 }}
                  animate={{ scale: isCurrent ? 1.1 : 1 }}
                  transition={{ duration: 0.2 }}
                >
                  {isCompleted ? "✓" : stepNumber}
                </motion.div>
                {labels && labels[index] && (
                  <span className="mt-2 text-xs text-gray-600 dark:text-gray-400 text-center">
                    {labels[index]}
                  </span>
                )}
              </div>
              {!isLast && (
                <div className="flex-1 mx-2">
                  <div className="h-1 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                    <motion.div
                      className={cn("h-full", variantClasses[variant])}
                      initial={{ width: 0 }}
                      animate={{ width: isCompleted ? "100%" : "0%" }}
                      transition={{ duration: 0.5, ease: "easeOut" }}
                    />
                  </div>
                </div>
              )}
            </React.Fragment>
          );
        })}
      </div>
    </div>
  );
};

// Add striped background styles
const stripedStyles = `
  .bg-stripes {
    background-image: linear-gradient(
      45deg,
      rgba(255, 255, 255, 0.15) 25%,
      transparent 25%,
      transparent 50%,
      rgba(255, 255, 255, 0.15) 50%,
      rgba(255, 255, 255, 0.15) 75%,
      transparent 75%,
      transparent
    );
    background-size: 1rem 1rem;
  }

  .bg-stripes-animated {
    animation: stripes 1s linear infinite;
  }

  @keyframes stripes {
    0% {
      background-position: 0 0;
    }
    100% {
      background-position: 1rem 0;
    }
  }

  @keyframes progress-indeterminate {
    0% {
      transform: translateX(-100%);
    }
    100% {
      transform: translateX(400%);
    }
  }

  .animate-progress-indeterminate {
    animation: progress-indeterminate 1.5s ease-in-out infinite;
  }
`;

// Inject styles
if (typeof document !== "undefined") {
  const styleSheet = document.createElement("style");
  styleSheet.innerHTML = stripedStyles;
  document.head.appendChild(styleSheet);
}

export default ProgressBar;
