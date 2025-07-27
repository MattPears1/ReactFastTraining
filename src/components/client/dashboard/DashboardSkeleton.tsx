import React from 'react';

export const DashboardSkeleton: React.FC = () => {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header Skeleton */}
      <div className="mb-8">
        <div className="h-9 bg-gray-300 dark:bg-gray-700 rounded w-64 mb-2 animate-pulse"></div>
        <div className="h-5 bg-gray-200 dark:bg-gray-600 rounded w-96 animate-pulse"></div>
      </div>

      {/* Stats Skeleton */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {[...Array(4)].map((_, index) => (
          <div key={index} className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
            <div className="flex items-center justify-between mb-2">
              <div className="w-10 h-10 bg-gray-200 dark:bg-gray-600 rounded-lg animate-pulse"></div>
              <div className="h-8 bg-gray-300 dark:bg-gray-700 rounded w-12 animate-pulse"></div>
            </div>
            <div className="h-4 bg-gray-200 dark:bg-gray-600 rounded w-24 animate-pulse"></div>
          </div>
        ))}
      </div>

      {/* Next Course Skeleton */}
      <div className="rounded-lg border-2 border-gray-200 dark:border-gray-700 p-6 mb-6">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between">
          <div className="flex-1">
            <div className="h-8 bg-gray-300 dark:bg-gray-700 rounded w-48 mb-2 animate-pulse"></div>
            <div className="h-6 bg-gray-200 dark:bg-gray-600 rounded w-64 mb-4 animate-pulse"></div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {[...Array(4)].map((_, index) => (
                <div key={index} className="flex items-center gap-2">
                  <div className="w-5 h-5 bg-gray-200 dark:bg-gray-600 rounded animate-pulse"></div>
                  <div className="h-4 bg-gray-200 dark:bg-gray-600 rounded w-32 animate-pulse"></div>
                </div>
              ))}
            </div>
          </div>

          <div className="mt-6 lg:mt-0 lg:ml-8 space-y-3">
            <div className="h-12 bg-primary-200 dark:bg-primary-800 rounded-lg w-full lg:w-36 animate-pulse"></div>
            <div className="h-12 bg-gray-200 dark:bg-gray-600 rounded-lg w-full lg:w-36 animate-pulse"></div>
          </div>
        </div>
      </div>

      {/* Course List Skeleton */}
      <div className="mt-8">
        <div className="h-6 bg-gray-300 dark:bg-gray-700 rounded w-48 mb-4 animate-pulse"></div>
        
        <div className="space-y-4">
          {[...Array(2)].map((_, index) => (
            <div key={index} className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="h-5 bg-gray-300 dark:bg-gray-700 rounded w-64 mb-2 animate-pulse"></div>
                  
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                    {[...Array(4)].map((_, idx) => (
                      <div key={idx} className="flex items-center gap-2">
                        <div className="w-4 h-4 bg-gray-200 dark:bg-gray-600 rounded animate-pulse"></div>
                        <div className="h-3 bg-gray-200 dark:bg-gray-600 rounded w-24 animate-pulse"></div>
                      </div>
                    ))}
                  </div>

                  <div className="mt-3 flex items-center gap-2">
                    <div className="h-3 bg-gray-200 dark:bg-gray-600 rounded w-32 animate-pulse"></div>
                    <div className="h-3 bg-gray-300 dark:bg-gray-700 rounded w-24 animate-pulse"></div>
                  </div>
                </div>

                <div className="w-8 h-8 bg-gray-200 dark:bg-gray-600 rounded animate-pulse"></div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};