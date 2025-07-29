import React from "react";
import { motion } from "framer-motion";
import { cn } from "@utils/cn";

interface SkeletonLoaderProps {
  variant?: "text" | "button" | "card" | "avatar" | "image" | "input";
  width?: string | number;
  height?: string | number;
  count?: number;
  className?: string;
  animate?: boolean;
}

const SkeletonLoader: React.FC<SkeletonLoaderProps> = ({
  variant = "text",
  width,
  height,
  count = 1,
  className,
  animate = true,
}) => {
  const baseClasses = "relative overflow-hidden bg-gray-200 dark:bg-gray-700";
  
  const variants = {
    text: "h-4 w-full rounded",
    button: "h-10 w-24 rounded-lg",
    card: "h-64 w-full rounded-xl",
    avatar: "h-12 w-12 rounded-full",
    image: "h-48 w-full rounded-lg",
    input: "h-11 w-full rounded-lg",
  };

  const shimmerAnimation = animate ? (
    <motion.div
      className="absolute inset-0 -translate-x-full"
      animate={{
        translateX: ["100%", "-100%"],
      }}
      transition={{
        repeat: Infinity,
        duration: 1.5,
        ease: "linear",
      }}
    >
      <div className="h-full w-full bg-gradient-to-r from-transparent via-white/20 to-transparent" />
    </motion.div>
  ) : null;

  const skeletonElements = Array.from({ length: count }, (_, index) => (
    <div
      key={index}
      className={cn(
        baseClasses,
        variants[variant],
        className,
        index < count - 1 && "mb-3"
      )}
      style={{
        width: width,
        height: height,
      }}
    >
      {shimmerAnimation}
    </div>
  ));

  return <>{skeletonElements}</>;
};

// Compound components for complex skeleton layouts
export const SkeletonCard: React.FC<{ className?: string }> = ({ className }) => (
  <div className={cn("bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm", className)}>
    <SkeletonLoader variant="avatar" className="mb-4" />
    <SkeletonLoader variant="text" width="60%" className="mb-2" />
    <SkeletonLoader variant="text" count={3} className="mb-4" />
    <div className="flex gap-2">
      <SkeletonLoader variant="button" />
      <SkeletonLoader variant="button" />
    </div>
  </div>
);

export const SkeletonTable: React.FC<{ rows?: number; className?: string }> = ({ 
  rows = 5, 
  className 
}) => (
  <div className={cn("bg-white dark:bg-gray-800 rounded-xl shadow-sm overflow-hidden", className)}>
    {/* Table header */}
    <div className="border-b border-gray-200 dark:border-gray-700 p-4">
      <div className="grid grid-cols-4 gap-4">
        {Array.from({ length: 4 }, (_, i) => (
          <SkeletonLoader key={i} variant="text" height={20} />
        ))}
      </div>
    </div>
    {/* Table rows */}
    {Array.from({ length: rows }, (_, rowIndex) => (
      <div key={rowIndex} className="border-b border-gray-100 dark:border-gray-800 p-4">
        <div className="grid grid-cols-4 gap-4">
          {Array.from({ length: 4 }, (_, colIndex) => (
            <SkeletonLoader key={colIndex} variant="text" height={16} />
          ))}
        </div>
      </div>
    ))}
  </div>
);

export const SkeletonForm: React.FC<{ fields?: number; className?: string }> = ({ 
  fields = 4, 
  className 
}) => (
  <div className={cn("bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm", className)}>
    {Array.from({ length: fields }, (_, i) => (
      <div key={i} className="mb-4">
        <SkeletonLoader variant="text" width="30%" height={16} className="mb-2" />
        <SkeletonLoader variant="input" />
      </div>
    ))}
    <div className="flex gap-3 mt-6">
      <SkeletonLoader variant="button" width={120} height={40} />
      <SkeletonLoader variant="button" width={100} height={40} />
    </div>
  </div>
);

export const SkeletonList: React.FC<{ items?: number; className?: string }> = ({ 
  items = 3, 
  className 
}) => (
  <div className={cn("space-y-4", className)}>
    {Array.from({ length: items }, (_, i) => (
      <div key={i} className="flex items-center gap-4 p-4 bg-white dark:bg-gray-800 rounded-lg shadow-sm">
        <SkeletonLoader variant="avatar" />
        <div className="flex-1">
          <SkeletonLoader variant="text" width="40%" className="mb-2" />
          <SkeletonLoader variant="text" width="70%" />
        </div>
        <SkeletonLoader variant="button" />
      </div>
    ))}
  </div>
);

export default SkeletonLoader;