import React, { useState } from "react";
import { Calendar, ChevronDown } from "lucide-react";
import { cn } from "@utils/cn";
import { DateRange } from "../types";
import { PREDEFINED_DATE_RANGES } from "../constants";

interface DateRangeSelectorProps {
  dateRange: DateRange;
  onDateRangeChange: (range: DateRange) => void;
}

export const DateRangeSelector: React.FC<DateRangeSelectorProps> = ({
  dateRange,
  onDateRangeChange,
}) => {
  const [showDatePicker, setShowDatePicker] = useState(false);

  return (
    <div className="relative">
      <button
        onClick={() => setShowDatePicker(!showDatePicker)}
        className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 flex items-center gap-2"
      >
        <Calendar className="w-4 h-4" />
        <span className="text-sm">{dateRange.label}</span>
        <ChevronDown className="w-4 h-4" />
      </button>

      {showDatePicker && (
        <div className="absolute right-0 mt-2 w-48 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 py-2 z-10">
          {PREDEFINED_DATE_RANGES.map((range) => (
            <button
              key={range.label}
              onClick={() => {
                onDateRangeChange(range);
                setShowDatePicker(false);
              }}
              className={cn(
                "w-full text-left px-4 py-2 text-sm hover:bg-gray-100 dark:hover:bg-gray-700",
                dateRange.label === range.label &&
                  "bg-primary-50 dark:bg-primary-900/20 text-primary-600"
              )}
            >
              {range.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};