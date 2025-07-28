import React, { useState } from 'react';
import { Calendar, ChevronDown } from 'lucide-react';
import { DateRange } from '../types';
import { cn } from '@utils/cn';

interface DateRangePickerProps {
  dateRange: DateRange;
  onDateRangeChange: (range: DateRange) => void;
}

export const DateRangePicker: React.FC<DateRangePickerProps> = ({
  dateRange,
  onDateRangeChange
}) => {
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [customStart, setCustomStart] = useState('');
  const [customEnd, setCustomEnd] = useState('');

  const predefinedRanges: DateRange[] = [
    {
      start: new Date(new Date().setDate(new Date().getDate() - 7)),
      end: new Date(),
      label: 'Last 7 Days'
    },
    {
      start: new Date(new Date().setMonth(new Date().getMonth() - 1)),
      end: new Date(),
      label: 'Last 30 Days'
    },
    {
      start: new Date(new Date().setMonth(new Date().getMonth() - 3)),
      end: new Date(),
      label: 'Last 3 Months'
    },
    {
      start: new Date(new Date().setMonth(new Date().getMonth() - 6)),
      end: new Date(),
      label: 'Last 6 Months'
    },
    {
      start: new Date(new Date().getFullYear(), 0, 1),
      end: new Date(),
      label: 'Year to Date'
    }
  ];

  const handleCustomDateRange = () => {
    if (customStart && customEnd) {
      const start = new Date(customStart);
      const end = new Date(customEnd);
      if (start <= end) {
        onDateRangeChange({
          start,
          end,
          label: 'Custom Range'
        });
        setShowDatePicker(false);
      }
    }
  };

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('en-GB', {
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    });
  };

  return (
    <div className="relative">
      <button
        onClick={() => setShowDatePicker(!showDatePicker)}
        className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2"
      >
        <Calendar className="h-4 w-4 text-gray-500" />
        <span className="text-sm font-medium text-gray-700">{dateRange.label}</span>
        <span className="text-sm text-gray-500">
          ({formatDate(dateRange.start)} - {formatDate(dateRange.end)})
        </span>
        <ChevronDown className="h-4 w-4 text-gray-400" />
      </button>

      {showDatePicker && (
        <>
          <div 
            className="fixed inset-0 z-30" 
            onClick={() => setShowDatePicker(false)}
          />
          <div className="absolute right-0 mt-2 w-80 bg-white rounded-lg shadow-lg border border-gray-200 z-40">
            <div className="p-4">
              <h3 className="text-sm font-medium text-gray-900 mb-3">Select Date Range</h3>
              
              {/* Predefined Ranges */}
              <div className="space-y-1 mb-4">
                {predefinedRanges.map((range) => (
                  <button
                    key={range.label}
                    onClick={() => {
                      onDateRangeChange(range);
                      setShowDatePicker(false);
                    }}
                    className={cn(
                      "w-full text-left px-3 py-2 text-sm rounded-md hover:bg-gray-100 transition-colors",
                      dateRange.label === range.label 
                        ? "bg-primary-50 text-primary-700 font-medium" 
                        : "text-gray-700"
                    )}
                  >
                    {range.label}
                  </button>
                ))}
              </div>

              {/* Custom Range */}
              <div className="border-t pt-4">
                <p className="text-sm font-medium text-gray-900 mb-3">Custom Range</p>
                <div className="space-y-3">
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">
                      Start Date
                    </label>
                    <input
                      type="date"
                      value={customStart}
                      onChange={(e) => setCustomStart(e.target.value)}
                      max={new Date().toISOString().split('T')[0]}
                      className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">
                      End Date
                    </label>
                    <input
                      type="date"
                      value={customEnd}
                      onChange={(e) => setCustomEnd(e.target.value)}
                      min={customStart}
                      max={new Date().toISOString().split('T')[0]}
                      className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                    />
                  </div>
                  <button
                    onClick={handleCustomDateRange}
                    disabled={!customStart || !customEnd}
                    className={cn(
                      "w-full px-3 py-2 text-sm font-medium rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2",
                      customStart && customEnd
                        ? "bg-primary-600 text-white hover:bg-primary-700"
                        : "bg-gray-100 text-gray-400 cursor-not-allowed"
                    )}
                  >
                    Apply Custom Range
                  </button>
                </div>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
};