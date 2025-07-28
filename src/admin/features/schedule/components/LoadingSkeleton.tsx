import React from "react";

interface LoadingSkeletonProps {
  className?: string;
  height?: string;
  width?: string;
  rounded?: boolean;
}

export const LoadingSkeleton: React.FC<LoadingSkeletonProps> = ({
  className = "",
  height = "h-4",
  width = "w-full",
  rounded = false,
}) => {
  return (
    <div
      className={`skeleton ${height} ${width} ${rounded ? "rounded-full" : "rounded-md"} ${className}`}
    />
  );
};

export const SessionDetailsSkeleton: React.FC = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-primary-50/10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 space-y-6">
        {/* Header Skeleton */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 sm:p-6">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
            <div className="flex items-start sm:items-center flex-col sm:flex-row gap-3 sm:gap-4">
              <LoadingSkeleton height="h-10" width="w-24" />
              <div className="flex-1 space-y-2">
                <LoadingSkeleton height="h-8" width="w-64" />
                <div className="flex items-center gap-3">
                  <LoadingSkeleton height="h-5" width="w-32" />
                  <LoadingSkeleton height="h-5" width="w-24" />
                  <LoadingSkeleton height="h-5" width="w-28" />
                </div>
              </div>
            </div>
            <div className="hidden lg:flex items-center gap-6">
              <LoadingSkeleton height="h-16" width="w-20" />
              <LoadingSkeleton height="h-12" width="w-px" />
              <LoadingSkeleton height="h-16" width="w-20" />
              <LoadingSkeleton height="h-12" width="w-px" />
              <LoadingSkeleton height="h-16" width="w-20" />
            </div>
          </div>
        </div>

        {/* Main Content Grid Skeleton */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 lg:gap-8">
          {/* Left Column */}
          <div className="lg:col-span-2 space-y-6">
            {/* Session Info Card */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                  <LoadingSkeleton height="h-8" width="w-8" rounded />
                  <LoadingSkeleton height="h-6" width="w-48" />
                </div>
                <LoadingSkeleton height="h-10" width="w-24" />
              </div>
              <div className="space-y-6">
                {[1, 2, 3, 4].map((i) => (
                  <div key={i} className="space-y-2">
                    <LoadingSkeleton height="h-4" width="w-24" />
                    <LoadingSkeleton height="h-6" width="w-full" />
                  </div>
                ))}
              </div>
            </div>

            {/* Attendees Card */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                  <LoadingSkeleton height="h-8" width="w-8" rounded />
                  <LoadingSkeleton height="h-6" width="w-32" />
                </div>
                <LoadingSkeleton height="h-10" width="w-20" />
              </div>
              <div className="space-y-4">
                {[1, 2, 3].map((i) => (
                  <div
                    key={i}
                    className="p-4 border border-gray-200 rounded-lg space-y-3"
                  >
                    <div className="flex justify-between">
                      <div className="space-y-2 flex-1">
                        <LoadingSkeleton height="h-5" width="w-32" />
                        <LoadingSkeleton height="h-4" width="w-48" />
                      </div>
                      <LoadingSkeleton height="h-6" width="w-6" rounded />
                    </div>
                    <div className="flex gap-2">
                      <LoadingSkeleton height="h-8" width="w-20" />
                      <LoadingSkeleton height="h-8" width="w-24" />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Right Column */}
          <div className="space-y-6">
            {/* Capacity Card */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
              <div className="flex items-center gap-3 mb-4">
                <LoadingSkeleton height="h-8" width="w-8" rounded />
                <LoadingSkeleton height="h-6" width="w-36" />
              </div>
              <LoadingSkeleton height="h-24" width="w-full" className="mb-4" />
              <LoadingSkeleton height="h-10" width="w-full" />
            </div>

            {/* Financial Summary */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
              <div className="flex items-center gap-3 mb-4">
                <LoadingSkeleton height="h-8" width="w-8" rounded />
                <LoadingSkeleton height="h-6" width="w-40" />
              </div>
              <div className="space-y-3">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="flex justify-between">
                    <LoadingSkeleton height="h-5" width="w-24" />
                    <LoadingSkeleton height="h-5" width="w-16" />
                  </div>
                ))}
              </div>
            </div>

            {/* Actions Card */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
              <div className="flex items-center gap-3 mb-4">
                <LoadingSkeleton height="h-8" width="w-8" rounded />
                <LoadingSkeleton height="h-6" width="w-32" />
              </div>
              <div className="space-y-3">
                <div className="grid grid-cols-3 gap-2">
                  <LoadingSkeleton height="h-10" width="w-full" />
                  <LoadingSkeleton height="h-10" width="w-full" />
                  <LoadingSkeleton height="h-10" width="w-full" />
                </div>
                <LoadingSkeleton height="h-10" width="w-full" />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
