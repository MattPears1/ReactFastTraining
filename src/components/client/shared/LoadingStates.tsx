import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Loader2, AlertCircle, CheckCircle, Info } from "lucide-react";

interface LoadingSpinnerProps {
  size?: "sm" | "md" | "lg";
  className?: string;
  label?: string;
}

export const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({
  size = "md",
  className = "",
  label = "Loading...",
}) => {
  const sizeClasses = {
    sm: "w-4 h-4",
    md: "w-8 h-8",
    lg: "w-12 h-12",
  };

  return (
    <div className={`flex flex-col items-center justify-center ${className}`}>
      <Loader2
        className={`${sizeClasses[size]} animate-spin text-primary-600`}
        aria-hidden="true"
      />
      <span className="sr-only">{label}</span>
    </div>
  );
};

interface SkeletonProps {
  className?: string;
  animate?: boolean;
}

export const Skeleton: React.FC<SkeletonProps> = ({
  className = "",
  animate = true,
}) => {
  return (
    <div
      className={`
        bg-gray-200 dark:bg-gray-700 rounded
        ${animate ? "animate-pulse" : ""}
        ${className}
      `}
      aria-hidden="true"
    />
  );
};

interface LoadingCardProps {
  rows?: number;
  showAvatar?: boolean;
  showActions?: boolean;
}

export const LoadingCard: React.FC<LoadingCardProps> = ({
  rows = 3,
  showAvatar = false,
  showActions = false,
}) => {
  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          {showAvatar && (
            <div className="flex items-center mb-4">
              <Skeleton className="w-12 h-12 rounded-full mr-4" />
              <div>
                <Skeleton className="h-5 w-32 mb-2" />
                <Skeleton className="h-4 w-24" />
              </div>
            </div>
          )}

          <div className="space-y-3">
            {Array.from({ length: rows }).map((_, i) => (
              <Skeleton
                key={i}
                className={`h-4 ${i === rows - 1 ? "w-3/4" : "w-full"}`}
              />
            ))}
          </div>
        </div>

        {showActions && <Skeleton className="w-8 h-8 rounded ml-4" />}
      </div>
    </div>
  );
};

interface LoadingGridProps {
  columns?: number;
  rows?: number;
  gap?: number;
}

export const LoadingGrid: React.FC<LoadingGridProps> = ({
  columns = 3,
  rows = 2,
  gap = 4,
}) => {
  const items = columns * rows;

  return (
    <div
      className={`grid grid-cols-1 md:grid-cols-${columns} gap-${gap}`}
      style={{
        gridTemplateColumns: `repeat(${columns}, minmax(0, 1fr))`,
        gap: `${gap * 0.25}rem`,
      }}
    >
      {Array.from({ length: items }).map((_, i) => (
        <LoadingCard key={i} />
      ))}
    </div>
  );
};

interface LoadingStateProps {
  isLoading: boolean;
  error?: Error | null;
  isEmpty?: boolean;
  loadingComponent?: React.ReactNode;
  errorComponent?: React.ReactNode;
  emptyComponent?: React.ReactNode;
  children: React.ReactNode;
  onRetry?: () => void;
  className?: string;
}

export const LoadingState: React.FC<LoadingStateProps> = ({
  isLoading,
  error,
  isEmpty = false,
  loadingComponent,
  errorComponent,
  emptyComponent,
  children,
  onRetry,
  className = "",
}) => {
  if (isLoading) {
    return (
      <AnimatePresence mode="wait">
        <motion.div
          key="loading"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className={className}
        >
          {loadingComponent || <LoadingSpinner size="lg" />}
        </motion.div>
      </AnimatePresence>
    );
  }

  if (error) {
    return (
      <AnimatePresence mode="wait">
        <motion.div
          key="error"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          className={className}
        >
          {errorComponent || (
            <div className="flex flex-col items-center justify-center py-12">
              <AlertCircle className="w-12 h-12 text-red-500 mb-4" />
              <p className="text-gray-700 dark:text-gray-300 mb-4">
                {error.message || "An error occurred"}
              </p>
              {onRetry && (
                <button
                  onClick={onRetry}
                  className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
                >
                  Try Again
                </button>
              )}
            </div>
          )}
        </motion.div>
      </AnimatePresence>
    );
  }

  if (isEmpty) {
    return (
      <AnimatePresence mode="wait">
        <motion.div
          key="empty"
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          className={className}
        >
          {emptyComponent || (
            <div className="flex flex-col items-center justify-center py-12">
              <Info className="w-12 h-12 text-gray-400 mb-4" />
              <p className="text-gray-600 dark:text-gray-400">
                No data available
              </p>
            </div>
          )}
        </motion.div>
      </AnimatePresence>
    );
  }

  return (
    <AnimatePresence mode="wait">
      <motion.div
        key="content"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className={className}
      >
        {children}
      </motion.div>
    </AnimatePresence>
  );
};

interface ProgressBarProps {
  progress: number;
  className?: string;
  showLabel?: boolean;
  color?: "primary" | "success" | "warning" | "danger";
}

export const ProgressBar: React.FC<ProgressBarProps> = ({
  progress,
  className = "",
  showLabel = false,
  color = "primary",
}) => {
  const colorClasses = {
    primary: "bg-primary-600",
    success: "bg-green-600",
    warning: "bg-yellow-600",
    danger: "bg-red-600",
  };

  return (
    <div className={`relative ${className}`}>
      <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
        <motion.div
          className={`${colorClasses[color]} h-2 rounded-full`}
          initial={{ width: 0 }}
          animate={{ width: `${Math.min(100, Math.max(0, progress))}%` }}
          transition={{ duration: 0.3, ease: "easeOut" }}
        />
      </div>
      {showLabel && (
        <span className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 text-xs font-medium">
          {Math.round(progress)}%
        </span>
      )}
    </div>
  );
};

interface StepProgressProps {
  steps: string[];
  currentStep: number;
  className?: string;
}

export const StepProgress: React.FC<StepProgressProps> = ({
  steps,
  currentStep,
  className = "",
}) => {
  return (
    <div className={`flex items-center justify-between ${className}`}>
      {steps.map((step, index) => {
        const isCompleted = index < currentStep;
        const isCurrent = index === currentStep;

        return (
          <React.Fragment key={index}>
            <div className="flex items-center">
              <motion.div
                className={`
                  w-8 h-8 rounded-full flex items-center justify-center font-medium text-sm
                  ${isCompleted ? "bg-green-600 text-white" : ""}
                  ${isCurrent ? "bg-primary-600 text-white" : ""}
                  ${!isCompleted && !isCurrent ? "bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-400" : ""}
                `}
                animate={{
                  scale: isCurrent ? 1.1 : 1,
                }}
                transition={{ duration: 0.2 }}
              >
                {isCompleted ? <CheckCircle className="w-5 h-5" /> : index + 1}
              </motion.div>
              <span
                className={`ml-2 text-sm ${isCurrent ? "font-medium" : ""}`}
              >
                {step}
              </span>
            </div>
            {index < steps.length - 1 && (
              <div className="flex-1 mx-4">
                <div className="h-0.5 bg-gray-200 dark:bg-gray-700">
                  <motion.div
                    className="h-full bg-primary-600"
                    initial={{ width: 0 }}
                    animate={{ width: isCompleted ? "100%" : "0%" }}
                    transition={{ duration: 0.3, delay: 0.1 }}
                  />
                </div>
              </div>
            )}
          </React.Fragment>
        );
      })}
    </div>
  );
};
