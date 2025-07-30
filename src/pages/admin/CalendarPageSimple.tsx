import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { AvailabilityCalendar } from "@components/booking/AvailabilityCalendar";
import { Plus, Calendar, Filter, AlertCircle } from "lucide-react";
import { cn } from "@utils/cn";

interface FilterState {
  courseType: string;
  location: string;
}

const AdminCalendarPageSimple: React.FC = () => {
  const navigate = useNavigate();
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState<FilterState>({
    courseType: "",
    location: "",
  });

  const handleDateSelect = (date: Date, sessions: any[]) => {
    if (sessions.length > 0) {
      // Navigate to the first session's details
      navigate(`/admin/sessions/${sessions[0].id}`);
    } else {
      // Create a new session for this date
      navigate("/admin/sessions/new");
    }
  };

  return (
    <div>
      {/* Page Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
              Session Calendar
            </h1>
            <p className="text-gray-600 dark:text-gray-400">
              View and manage all course sessions
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => setShowFilters(!showFilters)}
              className={cn(
                "px-4 py-2 border rounded-lg flex items-center gap-2 transition-colors",
                showFilters
                  ? "bg-primary-50 border-primary-300 text-primary-700 dark:bg-primary-900/20 dark:border-primary-700 dark:text-primary-400"
                  : "border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700",
              )}
            >
              <Filter className="w-4 h-4" />
              Filters
            </button>

            <button
              onClick={() => navigate("/admin/sessions/new")}
              className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 flex items-center gap-2"
            >
              <Plus className="w-4 h-4" />
              New Session
            </button>
          </div>
        </div>
      </div>

      {/* Filters */}
      {showFilters && (
        <div className="mb-6 p-4 bg-white dark:bg-gray-800 rounded-lg shadow">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <select
              value={filters.courseType}
              onChange={(e) =>
                setFilters({ ...filters, courseType: e.target.value })
              }
              className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500"
            >
              <option value="">All Course Types</option>
              <option value="efaw">Emergency First Aid at Work</option>
              <option value="faw">First Aid at Work</option>
              <option value="paediatric">Paediatric First Aid</option>
              <option value="mental-health">Mental Health First Aid</option>
            </select>

            <select
              value={filters.location}
              onChange={(e) =>
                setFilters({ ...filters, location: e.target.value })
              }
              className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500"
            >
              <option value="">All Locations</option>
              <option value="location-a">Location A</option>
              <option value="location-b">Location B</option>
            </select>
          </div>

          <div className="mt-4 flex justify-end">
            <button
              onClick={() => setFilters({ courseType: "", location: "" })}
              className="px-4 py-2 text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"
            >
              Clear Filters
            </button>
          </div>
        </div>
      )}

      {/* Important Notice */}
      <div className="mb-6 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
        <div className="flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" />
          <div>
            <h3 className="text-sm font-medium text-blue-900 dark:text-blue-200 mb-1">
              Calendar Features
            </h3>
            <ul className="text-sm text-blue-800 dark:text-blue-300 space-y-1">
              <li>• Click on any date to view sessions or create a new one</li>
              <li>• Maximum 12 participants per session (strictly enforced)</li>
              <li>• Sessions limited to single-day courses only</li>
              <li>• Locations: Location A and Location B only</li>
            </ul>
          </div>
        </div>
      </div>

      {/* Calendar */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
        <AvailabilityCalendar
          onDateSelect={handleDateSelect}
          filters={filters}
          isAdminView={true}
        />
      </div>

      {/* Calendar Legend */}
      <div className="mt-4 flex flex-wrap items-center gap-4 text-sm">
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 rounded bg-green-500"></div>
          <span>Available (0-50% full)</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 rounded bg-yellow-500"></div>
          <span>Filling Up (50-75% full)</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 rounded bg-orange-500"></div>
          <span>Nearly Full (75-99% full)</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 rounded bg-red-500"></div>
          <span>Full (100% capacity)</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 rounded bg-gray-500"></div>
          <span>Cancelled</span>
        </div>
      </div>
    </div>
  );
};

export default AdminCalendarPageSimple;
