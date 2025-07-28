import React, { useState } from "react";
import DatePicker from "react-datepicker";
import { Calendar, Filter, X } from "lucide-react";
import { cn } from "@utils/cn";
import "react-datepicker/dist/react-datepicker.css";

export interface FilterState {
  dateFrom: Date | null;
  dateTo: Date | null;
  courseType: string;
  showOnlyAvailable: boolean;
  location: string;
}

interface CourseFiltersProps {
  onFiltersChange: (filters: FilterState) => void;
  className?: string;
}

export const CourseFilters: React.FC<CourseFiltersProps> = ({
  onFiltersChange,
  className = "",
}) => {
  const [filters, setFilters] = useState<FilterState>({
    dateFrom: null,
    dateTo: null,
    courseType: "",
    showOnlyAvailable: true,
    location: "",
  });

  const [hasActiveFilters, setHasActiveFilters] = useState(false);

  const updateFilter = <K extends keyof FilterState>(
    key: K,
    value: FilterState[K],
  ) => {
    const newFilters = { ...filters, [key]: value };
    setFilters(newFilters);
    onFiltersChange(newFilters);

    // Check if any filters are active
    const active = !!(
      newFilters.dateFrom ||
      newFilters.dateTo ||
      newFilters.courseType ||
      newFilters.location ||
      !newFilters.showOnlyAvailable
    );
    setHasActiveFilters(active);
  };

  const clearFilters = () => {
    const clearedFilters: FilterState = {
      dateFrom: null,
      dateTo: null,
      courseType: "",
      showOnlyAvailable: true,
      location: "",
    };
    setFilters(clearedFilters);
    onFiltersChange(clearedFilters);
    setHasActiveFilters(false);
  };

  return (
    <div className={cn("bg-white rounded-lg shadow p-4 space-y-4", className)}>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Filter className="w-5 h-5 text-gray-500" />
          <h3 className="text-lg font-semibold">Filter Courses</h3>
          {hasActiveFilters && (
            <span className="text-xs bg-primary-100 text-primary-700 px-2 py-1 rounded-full">
              Active
            </span>
          )}
        </div>
        {hasActiveFilters && (
          <button
            onClick={clearFilters}
            className="text-sm text-primary-600 hover:text-primary-700 hover:underline flex items-center gap-1"
          >
            <X className="w-4 h-4" />
            Clear all
          </button>
        )}
      </div>

      {/* Date Range */}
      <div className="space-y-3">
        <label className="block text-sm font-medium text-gray-700">
          Date Range
        </label>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <div>
            <label className="block text-xs text-gray-600 mb-1">From</label>
            <DatePicker
              selected={filters.dateFrom}
              onChange={(date) => updateFilter("dateFrom", date)}
              minDate={new Date()}
              maxDate={filters.dateTo || undefined}
              placeholderText="Select start date"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              dateFormat="dd/MM/yyyy"
              isClearable
              showMonthDropdown
              showYearDropdown
              dropdownMode="select"
            />
          </div>
          <div>
            <label className="block text-xs text-gray-600 mb-1">To</label>
            <DatePicker
              selected={filters.dateTo}
              onChange={(date) => updateFilter("dateTo", date)}
              minDate={filters.dateFrom || new Date()}
              placeholderText="Select end date"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              dateFormat="dd/MM/yyyy"
              isClearable
              showMonthDropdown
              showYearDropdown
              dropdownMode="select"
            />
          </div>
        </div>
      </div>

      {/* Course Type */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Course Type
        </label>
        <select
          value={filters.courseType}
          onChange={(e) => updateFilter("courseType", e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
        >
          <option value="">All Courses</option>
          <option value="Emergency First Aid at Work">
            Emergency First Aid at Work
          </option>
          <option value="First Aid at Work">First Aid at Work</option>
          <option value="Paediatric First Aid">Paediatric First Aid</option>
          <option value="Emergency Paediatric First Aid">
            Emergency Paediatric First Aid
          </option>
          <option value="FAW Requalification">FAW Requalification</option>
          <option value="EFAW Requalification">EFAW Requalification</option>
          <option value="Paediatric Requalification">
            Paediatric Requalification
          </option>
          <option value="Emergency Paediatric Requalification">
            Emergency Paediatric Requalification
          </option>
          <option value="Activity First Aid">Activity First Aid</option>
          <option value="Activity First Aid Requalification">
            Activity First Aid Requalification
          </option>
          <option value="CPR and AED">CPR and AED</option>
          <option value="Annual Skills Refresher">
            Annual Skills Refresher
          </option>
          <option value="Oxygen Therapy">Oxygen Therapy</option>
        </select>
      </div>

      {/* Location */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Location
        </label>
        <select
          value={filters.location}
          onChange={(e) => updateFilter("location", e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
        >
          <option value="">All Locations</option>
          <option value="SHEFFIELD">Sheffield</option>
          <option value="LEEDS">Leeds</option>
          <option value="BARNSLEY">Barnsley</option>
          <option value="DONCASTER">Doncaster</option>
          <option value="ROTHERHAM">Rotherham</option>
        </select>
      </div>

      {/* Availability Toggle */}
      <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
        <label
          htmlFor="showOnlyAvailable"
          className="text-sm font-medium text-gray-700 cursor-pointer"
        >
          Show only available courses
        </label>
        <button
          id="showOnlyAvailable"
          type="button"
          role="switch"
          aria-checked={filters.showOnlyAvailable}
          onClick={() =>
            updateFilter("showOnlyAvailable", !filters.showOnlyAvailable)
          }
          className={cn(
            "relative inline-flex h-6 w-11 items-center rounded-full transition-colors",
            filters.showOnlyAvailable ? "bg-primary-600" : "bg-gray-200",
          )}
        >
          <span
            className={cn(
              "inline-block h-4 w-4 transform rounded-full bg-white transition-transform",
              filters.showOnlyAvailable ? "translate-x-6" : "translate-x-1",
            )}
          />
        </button>
      </div>

      {/* Active Filters Summary */}
      {hasActiveFilters && (
        <div className="pt-3 border-t border-gray-200">
          <p className="text-xs text-gray-600">
            Filtering by:{" "}
            {filters.dateFrom &&
              `From ${filters.dateFrom.toLocaleDateString()} `}
            {filters.dateTo && `To ${filters.dateTo.toLocaleDateString()} `}
            {filters.courseType && `• ${filters.courseType} `}
            {filters.location && `• ${filters.location} `}
            {!filters.showOnlyAvailable && "• Including full courses"}
          </p>
        </div>
      )}
    </div>
  );
};
