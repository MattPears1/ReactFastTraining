import React from "react";
import { LucideIcon, TrendingUp, TrendingDown, Minus } from "lucide-react";
import { cn } from "@utils/cn";
import { motion } from "framer-motion";

interface MetricCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: LucideIcon;
  trend?: {
    value: number;
    label: string;
  };
  color?: "blue" | "green" | "purple" | "red" | "yellow" | "gray";
  loading?: boolean;
  onClick?: () => void;
  className?: string;
}

const colorClasses = {
  blue: {
    bg: "bg-blue-50 dark:bg-blue-900/20",
    icon: "text-blue-600 dark:text-blue-400",
    trend: {
      up: "text-green-600 dark:text-green-400",
      down: "text-red-600 dark:text-red-400",
      neutral: "text-gray-600 dark:text-gray-400",
    },
  },
  green: {
    bg: "bg-green-50 dark:bg-green-900/20",
    icon: "text-green-600 dark:text-green-400",
    trend: {
      up: "text-green-600 dark:text-green-400",
      down: "text-red-600 dark:text-red-400",
      neutral: "text-gray-600 dark:text-gray-400",
    },
  },
  purple: {
    bg: "bg-purple-50 dark:bg-purple-900/20",
    icon: "text-purple-600 dark:text-purple-400",
    trend: {
      up: "text-green-600 dark:text-green-400",
      down: "text-red-600 dark:text-red-400",
      neutral: "text-gray-600 dark:text-gray-400",
    },
  },
  red: {
    bg: "bg-red-50 dark:bg-red-900/20",
    icon: "text-red-600 dark:text-red-400",
    trend: {
      up: "text-green-600 dark:text-green-400",
      down: "text-red-600 dark:text-red-400",
      neutral: "text-gray-600 dark:text-gray-400",
    },
  },
  yellow: {
    bg: "bg-yellow-50 dark:bg-yellow-900/20",
    icon: "text-yellow-600 dark:text-yellow-400",
    trend: {
      up: "text-green-600 dark:text-green-400",
      down: "text-red-600 dark:text-red-400",
      neutral: "text-gray-600 dark:text-gray-400",
    },
  },
  gray: {
    bg: "bg-gray-50 dark:bg-gray-900/20",
    icon: "text-gray-600 dark:text-gray-400",
    trend: {
      up: "text-green-600 dark:text-green-400",
      down: "text-red-600 dark:text-red-400",
      neutral: "text-gray-600 dark:text-gray-400",
    },
  },
};

export const MetricCard: React.FC<MetricCardProps> = ({
  title,
  value,
  subtitle,
  icon: Icon,
  trend,
  color = "blue",
  loading = false,
  onClick,
  className,
}) => {
  const colors = colorClasses[color];
  const isClickable = !!onClick;

  const getTrendIcon = () => {
    if (!trend) return null;
    if (trend.value > 0) return TrendingUp;
    if (trend.value < 0) return TrendingDown;
    return Minus;
  };

  const TrendIcon = getTrendIcon();
  const trendColor =
    trend?.value > 0 ? "up" : trend?.value < 0 ? "down" : "neutral";

  return (
    <motion.div
      whileHover={isClickable ? { scale: 1.02 } : undefined}
      whileTap={isClickable ? { scale: 0.98 } : undefined}
      className={cn(
        "bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6",
        isClickable && "cursor-pointer hover:shadow-md transition-shadow",
        className,
      )}
      onClick={onClick}
    >
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
            {title}
          </p>

          {loading ? (
            <div className="mt-2 space-y-2">
              <div className="h-8 w-24 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
              {subtitle && (
                <div className="h-4 w-32 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
              )}
            </div>
          ) : (
            <>
              <motion.p
                className="mt-2 text-3xl font-bold text-gray-900 dark:text-white"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3 }}
              >
                {value}
              </motion.p>

              {subtitle && (
                <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                  {subtitle}
                </p>
              )}

              {trend && TrendIcon && (
                <div className="mt-3 flex items-center gap-2">
                  <div
                    className={cn(
                      "flex items-center gap-1",
                      colors.trend[trendColor],
                    )}
                  >
                    <TrendIcon className="w-4 h-4" />
                    <span className="text-sm font-medium">
                      {Math.abs(trend.value)}%
                    </span>
                  </div>
                  <span className="text-sm text-gray-500 dark:text-gray-400">
                    {trend.label}
                  </span>
                </div>
              )}
            </>
          )}
        </div>

        <div className={cn("p-3 rounded-lg", colors.bg)}>
          <Icon className={cn("w-6 h-6", colors.icon)} />
        </div>
      </div>
    </motion.div>
  );
};

interface MetricCardSkeletonProps {
  showTrend?: boolean;
}

export const MetricCardSkeleton: React.FC<MetricCardSkeletonProps> = ({
  showTrend = false,
}) => {
  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <div className="h-4 w-24 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
          <div className="mt-3 h-8 w-32 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
          <div className="mt-2 h-4 w-40 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
          {showTrend && (
            <div className="mt-3 h-4 w-28 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
          )}
        </div>
        <div className="w-12 h-12 bg-gray-200 dark:bg-gray-700 rounded-lg animate-pulse" />
      </div>
    </div>
  );
};
