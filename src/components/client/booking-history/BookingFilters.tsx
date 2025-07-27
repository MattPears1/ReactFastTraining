import React from 'react';
import { X } from 'lucide-react';
import type { BookingFilters as BookingFiltersType } from '@/types/client';

interface BookingFiltersProps {
  filters: BookingFiltersType;
  onChange: (filters: BookingFiltersType) => void;
  onReset: () => void;
}

export const BookingFilters: React.FC<BookingFiltersProps> = ({
  filters,
  onChange,
  onReset,
}) => {
  const handleFilterChange = (key: keyof BookingFiltersType, value: any) => {
    onChange({
      ...filters,
      [key]: value,
    });
  };

  const statusOptions = [
    { value: '', label: 'All Statuses' },
    { value: 'upcoming', label: 'Upcoming' },
    { value: 'completed', label: 'Completed' },
    { value: 'cancelled', label: 'Cancelled' },
  ];

  const courseTypeOptions = [
    { value: '', label: 'All Course Types' },
    { value: 'Emergency First Aid at Work', label: 'EFAW' },
    { value: 'First Aid at Work', label: 'FAW' },
    { value: 'Paediatric First Aid', label: 'Paediatric' },
    { value: 'Mental Health First Aid', label: 'Mental Health' },
  ];

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4">
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3 sm:gap-4">
        {/* Status Filter */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Status
          </label>
          <select
            value={filters.status || ''}
            onChange={(e) => handleFilterChange('status', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500"
          >
            {statusOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>

        {/* Course Type Filter */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Course Type
          </label>
          <select
            value={filters.courseType || ''}
            onChange={(e) => handleFilterChange('courseType', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500"
          >
            {courseTypeOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>

        {/* Start Date Filter */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            From Date
          </label>
          <input
            type="date"
            value={filters.startDate ? filters.startDate.toISOString().split('T')[0] : ''}
            onChange={(e) => 
              handleFilterChange('startDate', e.target.value ? new Date(e.target.value) : null)
            }
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500"
          />
        </div>

        {/* End Date Filter */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            To Date
          </label>
          <input
            type="date"
            value={filters.endDate ? filters.endDate.toISOString().split('T')[0] : ''}
            onChange={(e) => 
              handleFilterChange('endDate', e.target.value ? new Date(e.target.value) : null)
            }
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500"
          />
        </div>

        {/* Reset Button */}
        <div className="flex items-end sm:col-span-2 md:col-span-1">
          <button
            onClick={onReset}
            className="w-full px-3 sm:px-4 py-2 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors flex items-center justify-center gap-2 text-sm touch-target"
          >
            <X className="w-4 h-4" />
            Reset
          </button>
        </div>
      </div>
    </div>
  );
};