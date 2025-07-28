import React from "react";
import { cn } from "@utils/cn";

// Loading types for different contexts
export type LoadingType =
  | "spinner"
  | "dots"
  | "pulse"
  | "skeleton"
  | "bar"
  | "medical";

interface LoadingStateProps {
  type?: LoadingType;
  size?: "xs" | "sm" | "md" | "lg" | "xl";
  text?: string;
  fullScreen?: boolean;
  overlay?: boolean;
  className?: string;
}

const sizeMap = {
  xs: "h-4 w-4",
  sm: "h-6 w-6",
  md: "h-8 w-8",
  lg: "h-12 w-12",
  xl: "h-16 w-16",
};

const textSizeMap = {
  xs: "text-xs",
  sm: "text-sm",
  md: "text-base",
  lg: "text-lg",
  xl: "text-xl",
};

// Spinner Component
const Spinner: React.FC<{ size: string }> = ({ size }) => (
  <div
    className={cn(
      "animate-spin rounded-full border-b-2 border-primary-600",
      size,
    )}
  />
);

// Dots Component
const Dots: React.FC<{ size: string }> = ({ size }) => {
  const dotSize = {
    xs: "h-1 w-1",
    sm: "h-1.5 w-1.5",
    md: "h-2 w-2",
    lg: "h-3 w-3",
    xl: "h-4 w-4",
  };

  const sizeKey = Object.keys(sizeMap).find(
    (key) => sizeMap[key as keyof typeof sizeMap] === size,
  ) as keyof typeof dotSize;

  return (
    <div className="flex space-x-1">
      {[0, 1, 2].map((i) => (
        <div
          key={i}
          className={cn(
            "rounded-full bg-primary-600 animate-pulse",
            dotSize[sizeKey],
          )}
          style={{
            animationDelay: `${i * 150}ms`,
          }}
        />
      ))}
    </div>
  );
};

// Pulse Component
const Pulse: React.FC<{ size: string }> = ({ size }) => (
  <div className="relative">
    <div className={cn("rounded-full bg-primary-600", size)}>
      <div
        className={cn(
          "absolute inset-0 rounded-full bg-primary-600 animate-ping opacity-75",
          size,
        )}
      />
    </div>
  </div>
);

// Progress Bar Component
const ProgressBar: React.FC = () => (
  <div className="w-full max-w-xs">
    <div className="h-1 w-full bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
      <div className="h-full bg-primary-600 rounded-full animate-progress" />
    </div>
  </div>
);

// Medical Themed Loader (Heart/Cross)
const MedicalLoader: React.FC<{ size: string }> = ({ size }) => {
  const sizeClasses = {
    xs: "h-4 w-4",
    sm: "h-6 w-6",
    md: "h-8 w-8",
    lg: "h-12 w-12",
    xl: "h-16 w-16",
  };

  const sizeKey = Object.keys(sizeMap).find(
    (key) => sizeMap[key as keyof typeof sizeMap] === size,
  ) as keyof typeof sizeClasses;

  return (
    <div className={cn("relative", sizeClasses[sizeKey])}>
      <svg
        viewBox="0 0 24 24"
        fill="none"
        className="animate-pulse text-primary-600"
      >
        <path
          d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"
          fill="currentColor"
        />
        <path d="M13 9H11V7H9V9H7V11H9V13H11V11H13V9Z" fill="white" />
      </svg>
    </div>
  );
};

// Skeleton Loading Component
const Skeleton: React.FC<{ className?: string }> = ({ className }) => (
  <div
    className={cn(
      "animate-pulse bg-gray-200 dark:bg-gray-700 rounded",
      className,
    )}
  />
);

export const LoadingState: React.FC<LoadingStateProps> = ({
  type = "spinner",
  size = "md",
  text,
  fullScreen = false,
  overlay = false,
  className,
}) => {
  const sizeClass = sizeMap[size];
  const textSize = textSizeMap[size];

  const renderLoader = () => {
    switch (type) {
      case "dots":
        return <Dots size={sizeClass} />;
      case "pulse":
        return <Pulse size={sizeClass} />;
      case "bar":
        return <ProgressBar />;
      case "medical":
        return <MedicalLoader size={sizeClass} />;
      case "skeleton":
        return null; // Skeleton is handled differently
      default:
        return <Spinner size={sizeClass} />;
    }
  };

  if (type === "skeleton") {
    return <Skeleton className={className} />;
  }

  const content = (
    <div
      className={cn(
        "flex flex-col items-center justify-center",
        fullScreen && "min-h-screen",
        overlay &&
          "fixed inset-0 bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm z-50",
        !fullScreen && !overlay && "p-8",
        className,
      )}
    >
      {renderLoader()}
      {text && (
        <p className={cn("mt-4 text-gray-600 dark:text-gray-400", textSize)}>
          {text}
        </p>
      )}
    </div>
  );

  return content;
};

// Specific loading components for common use cases
export const PageLoader: React.FC<{ text?: string }> = ({
  text = "Loading...",
}) => <LoadingState type="spinner" size="lg" text={text} fullScreen />;

export const OverlayLoader: React.FC<{ text?: string }> = ({ text }) => (
  <LoadingState type="spinner" size="md" text={text} overlay />
);

export const InlineLoader: React.FC<{ size?: "xs" | "sm" | "md" }> = ({
  size = "sm",
}) => <LoadingState type="spinner" size={size} />;

export const ButtonLoader: React.FC = () => (
  <LoadingState type="dots" size="xs" />
);

// Skeleton loading helpers
export const SkeletonText: React.FC<{ lines?: number; className?: string }> = ({
  lines = 1,
  className,
}) => (
  <div className={cn("space-y-2", className)}>
    {Array.from({ length: lines }).map((_, i) => (
      <Skeleton
        key={i}
        className={cn("h-4", i === lines - 1 && lines > 1 && "w-3/4")}
      />
    ))}
  </div>
);

export const SkeletonCard: React.FC<{ className?: string }> = ({
  className,
}) => (
  <div className={cn("p-6 space-y-4", className)}>
    <Skeleton className="h-6 w-1/3" />
    <SkeletonText lines={3} />
    <div className="flex gap-2">
      <Skeleton className="h-10 w-24" />
      <Skeleton className="h-10 w-24" />
    </div>
  </div>
);

// Add CSS for progress animation
const styles = `
  @keyframes progress {
    0% {
      transform: translateX(-100%);
    }
    50% {
      transform: translateX(0);
    }
    100% {
      transform: translateX(100%);
    }
  }
  
  .animate-progress {
    animation: progress 1.5s ease-in-out infinite;
  }
`;

// Inject styles
if (typeof document !== "undefined") {
  const styleSheet = document.createElement("style");
  styleSheet.textContent = styles;
  document.head.appendChild(styleSheet);
}
