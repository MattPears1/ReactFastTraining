// Calendar filters component
import React from "react";
import { FilterState } from "../types";
import { COURSE_TYPES, LOCATIONS, INSTRUCTORS } from "../constants";

interface CalendarFiltersProps {
  filters: FilterState;
  onChange: (filters: FilterState) => void;
}

export const CalendarFilters: React.FC<CalendarFiltersProps> = ({
  filters,
  onChange,
}) => {
  return (
    <div className="mb-6 p-4 bg-white dark:bg-gray-800 rounded-lg shadow">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <select
          value={filters.courseType}
          onChange={(e) => onChange({ ...filters, courseType: e.target.value })}
          className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500"
        >
          {COURSE_TYPES.map((type) => (
            <option key={type.value} value={type.value}>
              {type.label}
            </option>
          ))}
        </select>

        <select
          value={filters.location}
          onChange={(e) => onChange({ ...filters, location: e.target.value })}
          className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500"
        >
          {LOCATIONS.map((location) => (
            <option key={location.value} value={location.value}>
              {location.label}
            </option>
          ))}
        </select>

        <select
          value={filters.instructor}
          onChange={(e) => onChange({ ...filters, instructor: e.target.value })}
          className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500"
        >
          {INSTRUCTORS.map((instructor) => (
            <option key={instructor.value} value={instructor.value}>
              {instructor.label}
            </option>
          ))}
        </select>
      </div>

      <div className="mt-4 flex justify-end">
        <button
          onClick={() =>
            onChange({ courseType: "", location: "", instructor: "" })
          }
          className="px-4 py-2 text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"
        >
          Clear Filters
        </button>
      </div>
    </div>
  );
};
