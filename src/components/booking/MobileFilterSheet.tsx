import React, { useState } from 'react';
import { Filter, X } from 'lucide-react';
import { cn } from '@utils/cn';

interface MobileFilterSheetProps {
  children: React.ReactNode;
  className?: string;
}

export const MobileFilterSheet: React.FC<MobileFilterSheetProps> = ({ 
  children, 
  className = '' 
}) => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      {/* Filter Button - Only visible on mobile */}
      <button
        onClick={() => setIsOpen(true)}
        className={cn(
          'md:hidden fixed bottom-4 right-4 bg-primary-600 text-white p-3 rounded-full shadow-lg z-40 hover:bg-primary-700 transition-colors',
          className
        )}
        aria-label="Open filters"
      >
        <Filter className="w-6 h-6" />
      </button>

      {/* Backdrop */}
      {isOpen && (
        <div
          className="md:hidden fixed inset-0 bg-black bg-opacity-50 z-40 transition-opacity"
          onClick={() => setIsOpen(false)}
          aria-hidden="true"
        />
      )}

      {/* Filter Sheet */}
      <div
        className={cn(
          'md:hidden fixed inset-x-0 bottom-0 bg-white rounded-t-2xl shadow-xl z-50 transition-transform duration-300 max-h-[85vh]',
          isOpen ? 'translate-y-0' : 'translate-y-full'
        )}
      >
        {/* Header */}
        <div className="sticky top-0 bg-white border-b border-gray-200 px-4 py-4 rounded-t-2xl">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold">Filter Courses</h3>
            <button
              onClick={() => setIsOpen(false)}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              aria-label="Close filters"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="overflow-y-auto p-4" style={{ maxHeight: 'calc(85vh - 4rem)' }}>
          {children}
        </div>

        {/* Apply Button */}
        <div className="sticky bottom-0 bg-white border-t border-gray-200 p-4">
          <button
            onClick={() => setIsOpen(false)}
            className="w-full bg-primary-600 text-white py-3 rounded-lg font-medium hover:bg-primary-700 transition-colors"
          >
            Apply Filters
          </button>
        </div>
      </div>
    </>
  );
};