import React from "react";
import { cn } from "@utils/cn";

export const DashboardSkeleton: React.FC = () => {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header Skeleton */}
        <div className="mb-8">
          <div className="h-8 w-48 bg-gray-200 dark:bg-gray-700 rounded animate-pulse mb-2" />
          <div className="h-4 w-96 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
        </div>

        {/* Quick Actions Skeleton */}
        <div className="mb-8">
          <div className="h-6 w-32 bg-gray-200 dark:bg-gray-700 rounded animate-pulse mb-4" />
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            {[...Array(6)].map((_, i) => (
              <div
                key={i}
                className="h-24 bg-gray-200 dark:bg-gray-700 rounded-lg animate-pulse"
              />
            ))}
          </div>
        </div>

        {/* Stats Grid Skeleton */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {[...Array(4)].map((_, i) => (
            <div
              key={i}
              className="bg-white dark:bg-gray-800 rounded-lg shadow p-6"
            >
              <div className="flex items-center justify-between">
                <div>
                  <div className="h-4 w-24 bg-gray-200 dark:bg-gray-700 rounded animate-pulse mb-2" />
                  <div className="h-8 w-16 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
                </div>
                <div className="w-12 h-12 bg-gray-200 dark:bg-gray-700 rounded-lg animate-pulse" />
              </div>
            </div>
          ))}
        </div>

        {/* Main Content Grid Skeleton */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Chart Skeleton */}
          <div className="lg:col-span-2">
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
              <div className="h-6 w-32 bg-gray-200 dark:bg-gray-700 rounded animate-pulse mb-4" />
              <div className="h-80 bg-gray-100 dark:bg-gray-700 rounded animate-pulse" />
            </div>
          </div>

          {/* Sessions List Skeleton */}
          <div>
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
              <div className="h-6 w-32 bg-gray-200 dark:bg-gray-700 rounded animate-pulse mb-4" />
              <div className="space-y-3">
                {[...Array(4)].map((_, i) => (
                  <div
                    key={i}
                    className="p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg"
                  >
                    <div className="h-4 w-3/4 bg-gray-200 dark:bg-gray-600 rounded animate-pulse mb-2" />
                    <div className="h-3 w-1/2 bg-gray-200 dark:bg-gray-600 rounded animate-pulse" />
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// Individual skeleton components for reuse
export const StatCardSkeleton: React.FC = () => (
  <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
    <div className="flex items-center justify-between">
      <div>
        <div className="h-4 w-24 bg-gray-200 dark:bg-gray-700 rounded animate-pulse mb-2" />
        <div className="h-8 w-16 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
      </div>
      <div className="w-12 h-12 bg-gray-200 dark:bg-gray-700 rounded-lg animate-pulse" />
    </div>
  </div>
);

export const TableRowSkeleton: React.FC = () => (
  <tr className="border-b border-gray-200 dark:border-gray-700">
    <td className="px-6 py-4">
      <div className="h-4 w-4 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
    </td>
    <td className="px-6 py-4">
      <div className="h-4 w-32 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
    </td>
    <td className="px-6 py-4">
      <div className="h-4 w-24 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
    </td>
    <td className="px-6 py-4">
      <div className="h-4 w-20 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
    </td>
    <td className="px-6 py-4">
      <div className="h-4 w-16 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
    </td>
    <td className="px-6 py-4">
      <div className="h-8 w-20 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
    </td>
  </tr>
);

export const CardSkeleton: React.FC<{ className?: string }> = ({
  className,
}) => (
  <div
    className={cn("bg-white dark:bg-gray-800 rounded-lg shadow p-6", className)}
  >
    <div className="h-6 w-32 bg-gray-200 dark:bg-gray-700 rounded animate-pulse mb-4" />
    <div className="space-y-3">
      <div className="h-4 w-full bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
      <div className="h-4 w-3/4 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
      <div className="h-4 w-1/2 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
    </div>
  </div>
);
