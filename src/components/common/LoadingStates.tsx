import React from "react";
import { Loader2 } from "lucide-react";
import { cn } from "@utils/cn";

interface LoadingSpinnerProps {
  size?: "sm" | "md" | "lg" | "xl";
  className?: string;
  label?: string;
}

export const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({
  size = "md",
  className,
  label = "Loading...",
}) => {
  const sizeClasses = {
    sm: "w-4 h-4",
    md: "w-6 h-6",
    lg: "w-8 h-8",
    xl: "w-12 h-12",
  };

  return (
    <div
      className={cn("flex items-center justify-center", className)}
      role="status"
      aria-label={label}
    >
      <Loader2
        className={cn("animate-spin text-primary-600", sizeClasses[size])}
      />
      <span className="sr-only">{label}</span>
    </div>
  );
};

interface LoadingOverlayProps {
  isLoading: boolean;
  children: React.ReactNode;
  label?: string;
  blur?: boolean;
}

export const LoadingOverlay: React.FC<LoadingOverlayProps> = ({
  isLoading,
  children,
  label = "Loading...",
  blur = true,
}) => {
  return (
    <div className="relative">
      {children}
      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center bg-white/75 dark:bg-gray-900/75 z-10">
          {blur && <div className="absolute inset-0 backdrop-blur-sm" />}
          <LoadingSpinner size="lg" label={label} />
        </div>
      )}
    </div>
  );
};

interface SkeletonProps {
  className?: string;
  animate?: boolean;
}

export const Skeleton: React.FC<SkeletonProps> = ({
  className,
  animate = true,
}) => {
  return (
    <div
      className={cn(
        "bg-gray-200 dark:bg-gray-700 rounded",
        animate && "animate-pulse",
        className,
      )}
    />
  );
};

interface CardSkeletonProps {
  showImage?: boolean;
  lines?: number;
}

export const CardSkeleton: React.FC<CardSkeletonProps> = ({
  showImage = true,
  lines = 3,
}) => {
  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4">
      {showImage && <Skeleton className="w-full h-48 mb-4" />}
      <Skeleton className="h-6 w-3/4 mb-2" />
      {Array.from({ length: lines }).map((_, i) => (
        <Skeleton
          key={i}
          className={cn("h-4 mb-2", i === lines - 1 ? "w-1/2" : "w-full")}
        />
      ))}
    </div>
  );
};

interface TableSkeletonProps {
  rows?: number;
  columns?: number;
}

export const TableSkeleton: React.FC<TableSkeletonProps> = ({
  rows = 5,
  columns = 4,
}) => {
  return (
    <div className="w-full">
      {/* Header */}
      <div className="border-b border-gray-200 dark:border-gray-700 pb-2 mb-2">
        <div
          className="grid gap-4"
          style={{ gridTemplateColumns: `repeat(${columns}, 1fr)` }}
        >
          {Array.from({ length: columns }).map((_, i) => (
            <Skeleton key={i} className="h-4" />
          ))}
        </div>
      </div>

      {/* Rows */}
      {Array.from({ length: rows }).map((_, rowIndex) => (
        <div
          key={rowIndex}
          className="grid gap-4 py-3 border-b border-gray-100 dark:border-gray-800"
          style={{ gridTemplateColumns: `repeat(${columns}, 1fr)` }}
        >
          {Array.from({ length: columns }).map((_, colIndex) => (
            <Skeleton
              key={colIndex}
              className={cn("h-4", colIndex === 0 && "w-3/4")}
            />
          ))}
        </div>
      ))}
    </div>
  );
};

interface LoadingButtonProps {
  isLoading: boolean;
  children: React.ReactNode;
  loadingText?: string;
  className?: string;
  disabled?: boolean;
  onClick?: () => void;
  type?: "button" | "submit" | "reset";
}

export const LoadingButton: React.FC<LoadingButtonProps> = ({
  isLoading,
  children,
  loadingText = "Loading...",
  className,
  disabled,
  onClick,
  type = "button",
}) => {
  return (
    <button
      type={type}
      disabled={isLoading || disabled}
      onClick={onClick}
      className={cn(
        "relative flex items-center justify-center gap-2",
        "disabled:opacity-50 disabled:cursor-not-allowed",
        className,
      )}
    >
      {isLoading ? (
        <>
          <LoadingSpinner size="sm" />
          <span>{loadingText}</span>
        </>
      ) : (
        children
      )}
    </button>
  );
};

interface LoadingStateProps {
  isLoading: boolean;
  isEmpty?: boolean;
  error?: Error | null;
  children: React.ReactNode;
  loadingComponent?: React.ReactNode;
  emptyComponent?: React.ReactNode;
  errorComponent?: React.ReactNode;
  emptyMessage?: string;
  errorMessage?: string;
}

export const LoadingState: React.FC<LoadingStateProps> = ({
  isLoading,
  isEmpty = false,
  error,
  children,
  loadingComponent,
  emptyComponent,
  errorComponent,
  emptyMessage = "No data available",
  errorMessage = "An error occurred",
}) => {
  if (isLoading) {
    return <>{loadingComponent || <LoadingSpinner size="lg" />}</>;
  }

  if (error) {
    return (
      <>
        {errorComponent || (
          <div className="text-center py-8">
            <p className="text-red-600 dark:text-red-400">{errorMessage}</p>
            {process.env.NODE_ENV === "development" && (
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">
                {error.message}
              </p>
            )}
          </div>
        )}
      </>
    );
  }

  if (isEmpty) {
    return (
      <>
        {emptyComponent || (
          <div className="text-center py-8">
            <p className="text-gray-600 dark:text-gray-400">{emptyMessage}</p>
          </div>
        )}
      </>
    );
  }

  return <>{children}</>;
};
