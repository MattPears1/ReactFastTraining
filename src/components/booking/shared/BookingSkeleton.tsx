import React from 'react';
import { cn } from '@utils/cn';

interface BookingSkeletonProps {
  variant?: 'grid' | 'list' | 'form';
  className?: string;
}

export const BookingSkeleton: React.FC<BookingSkeletonProps> = ({ 
  variant = 'grid',
  className 
}) => {
  if (variant === 'form') {
    return (
      <div className={cn('space-y-6 animate-pulse', className)}>
        {/* Form Header */}
        <div className="bg-gray-200 dark:bg-gray-700 h-24 rounded-lg" />
        
        {/* Form Fields */}
        <div className="space-y-4">
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-20 mb-2" />
              <div className="h-10 bg-gray-200 dark:bg-gray-700 rounded" />
            </div>
            <div>
              <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-20 mb-2" />
              <div className="h-10 bg-gray-200 dark:bg-gray-700 rounded" />
            </div>
          </div>
          
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-24 mb-2" />
              <div className="h-10 bg-gray-200 dark:bg-gray-700 rounded" />
            </div>
            <div>
              <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-24 mb-2" />
              <div className="h-10 bg-gray-200 dark:bg-gray-700 rounded" />
            </div>
          </div>
          
          <div>
            <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-32 mb-2" />
            <div className="h-10 bg-gray-200 dark:bg-gray-700 rounded" />
          </div>
        </div>
        
        {/* Participants Section */}
        <div className="space-y-3">
          <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-40" />
          <div className="flex items-center gap-4">
            <div className="h-10 w-10 bg-gray-200 dark:bg-gray-700 rounded" />
            <div className="h-12 w-16 bg-gray-200 dark:bg-gray-700 rounded" />
            <div className="h-10 w-10 bg-gray-200 dark:bg-gray-700 rounded" />
          </div>
        </div>
        
        {/* Price Summary */}
        <div className="bg-gray-100 dark:bg-gray-800 rounded-lg p-4 space-y-2">
          <div className="flex justify-between">
            <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-24" />
            <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-16" />
          </div>
          <div className="flex justify-between">
            <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-32" />
            <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-16" />
          </div>
          <div className="border-t pt-2 flex justify-between">
            <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-16" />
            <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-20" />
          </div>
        </div>
        
        {/* Actions */}
        <div className="flex gap-4">
          <div className="flex-1 h-12 bg-gray-200 dark:bg-gray-700 rounded-lg" />
          <div className="flex-1 h-12 bg-gray-200 dark:bg-gray-700 rounded-lg" />
        </div>
      </div>
    );
  }
  
  if (variant === 'list') {
    return (
      <div className={cn('space-y-4 animate-pulse', className)}>
        {Array.from({ length: 3 }).map((_, index) => (
          <div key={index} className="border-2 border-gray-200 dark:border-gray-700 rounded-xl p-6">
            <div className="flex justify-between items-start">
              <div className="flex-1 space-y-3">
                <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-3/4" />
                <div className="space-y-2">
                  <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/2" />
                  <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-2/3" />
                  <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/3" />
                </div>
              </div>
              <div className="text-right space-y-2">
                <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-20" />
                <div className="h-10 bg-gray-200 dark:bg-gray-700 rounded-lg w-32" />
              </div>
            </div>
          </div>
        ))}
      </div>
    );
  }
  
  // Grid variant (default)
  return (
    <div className={cn('animate-pulse', className)}>
      {/* Filters Skeleton */}
      <div className="mb-6 space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-20 mb-2" />
            <div className="h-10 bg-gray-200 dark:bg-gray-700 rounded" />
          </div>
          <div>
            <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-20 mb-2" />
            <div className="h-10 bg-gray-200 dark:bg-gray-700 rounded" />
          </div>
          <div>
            <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-24 mb-2" />
            <div className="h-10 bg-gray-200 dark:bg-gray-700 rounded" />
          </div>
        </div>
      </div>
      
      {/* Calendar View Toggle */}
      <div className="mb-6 flex justify-end">
        <div className="flex gap-2">
          <div className="h-10 w-10 bg-gray-200 dark:bg-gray-700 rounded" />
          <div className="h-10 w-10 bg-gray-200 dark:bg-gray-700 rounded" />
        </div>
      </div>
      
      {/* Course Cards Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {Array.from({ length: 6 }).map((_, index) => (
          <div 
            key={index}
            className="border-2 border-gray-200 dark:border-gray-700 rounded-xl p-6"
          >
            <div className="flex justify-between items-start mb-4">
              <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-3/4" />
              <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded-full w-20" />
            </div>
            
            <div className="space-y-2 mb-4">
              <div className="flex items-center gap-2">
                <div className="h-4 w-4 bg-gray-200 dark:bg-gray-700 rounded" />
                <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-32" />
              </div>
              <div className="flex items-center gap-2">
                <div className="h-4 w-4 bg-gray-200 dark:bg-gray-700 rounded" />
                <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-40" />
              </div>
              <div className="flex items-center gap-2">
                <div className="h-4 w-4 bg-gray-200 dark:bg-gray-700 rounded" />
                <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-36" />
              </div>
              <div className="flex items-center gap-2">
                <div className="h-4 w-4 bg-gray-200 dark:bg-gray-700 rounded" />
                <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-28" />
              </div>
            </div>
            
            <div className="flex items-center justify-between">
              <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-24" />
              <div className="text-right">
                <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-16 mb-1" />
                <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-20" />
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};