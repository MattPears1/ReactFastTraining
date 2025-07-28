import React from "react";

export const BookingHistorySkeleton: React.FC = () => {
  return (
    <div className="space-y-4">
      {[...Array(5)].map((_, index) => (
        <div
          key={index}
          className="bg-white dark:bg-gray-800 rounded-lg shadow p-6"
        >
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-2">
                <div className="h-5 bg-gray-300 dark:bg-gray-700 rounded w-48 animate-pulse"></div>
                <div className="h-5 bg-gray-200 dark:bg-gray-600 rounded-full w-24 animate-pulse"></div>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {[...Array(4)].map((_, idx) => (
                  <div key={idx} className="flex items-center gap-2">
                    <div className="w-4 h-4 bg-gray-200 dark:bg-gray-600 rounded animate-pulse"></div>
                    <div className="h-3 bg-gray-200 dark:bg-gray-600 rounded w-24 animate-pulse"></div>
                  </div>
                ))}
              </div>

              <div className="mt-3 flex items-center gap-4">
                <div className="h-3 bg-gray-200 dark:bg-gray-600 rounded w-20 animate-pulse"></div>
                <div className="h-3 bg-gray-200 dark:bg-gray-600 rounded w-32 animate-pulse"></div>
              </div>
            </div>

            <div className="w-5 h-5 bg-gray-200 dark:bg-gray-600 rounded animate-pulse"></div>
          </div>
        </div>
      ))}
    </div>
  );
};
