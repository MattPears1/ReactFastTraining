import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Calendar,
  MapPin,
  Users,
  Clock,
  ChevronRight,
  AlertCircle,
  RefreshCw,
  Grid3X3,
  CalendarDays,
  Filter,
  Search,
} from "lucide-react";
import { cn } from "@utils/cn";
import {
  CourseSchedule,
  CourseTypeCode,
  VenueCode,
} from "@/types/booking.types";
import { COURSE_TYPE_CONFIG } from "@/config/courseTypes.config";
import { VENUE_CONFIG } from "@/config/venues.config";
import { bookingService } from "@/services/booking.service";
import {
  formatDate,
  formatTime,
  formatCountdown,
} from "@/utils/dateFormatting";
import { CalendarView } from "./CalendarView";
import { CourseFilters } from "./CourseFilters";
import { CourseCard } from "./shared/CourseCard";
import { BookingSkeleton } from "./shared/BookingSkeleton";

type ViewMode = "calendar" | "list";

interface CourseAvailabilityEnhancedProps {
  courseType?: string;
  venue?: string;
  onSelectCourse: (schedule: CourseSchedule) => void;
  selectedScheduleId?: number;
}

export const CourseAvailabilityEnhanced: React.FC<
  CourseAvailabilityEnhancedProps
> = ({
  courseType: initialCourseType,
  venue: initialVenue,
  onSelectCourse,
  selectedScheduleId,
}) => {
  const [schedules, setSchedules] = useState<CourseSchedule[]>([]);
  const [filteredSchedules, setFilteredSchedules] = useState<CourseSchedule[]>(
    [],
  );
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<ViewMode>("calendar");

  // Filter states
  const [selectedCourseType, setSelectedCourseType] = useState<
    CourseTypeCode | "all"
  >((initialCourseType as CourseTypeCode) || "all");
  const [selectedVenue, setSelectedVenue] = useState<VenueCode | "all">(
    (initialVenue as VenueCode) || "all",
  );
  const [selectedMonth, setSelectedMonth] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [showFullCourses, setShowFullCourses] = useState(false);

  useEffect(() => {
    fetchAvailableCourses();
  }, []);

  useEffect(() => {
    applyFilters();
  }, [
    schedules,
    selectedCourseType,
    selectedVenue,
    selectedMonth,
    searchQuery,
    showFullCourses,
  ]);

  const fetchAvailableCourses = async () => {
    try {
      setLoading(true);
      setError(null);

      const allSchedules = await bookingService.getAvailableCourses({
        showFullCourses: true,
      });

      setSchedules(allSchedules);
    } catch (err) {
      setError("Failed to load available courses. Please try again.");
      console.error("Error fetching courses:", err);
    } finally {
      setLoading(false);
    }
  };

  const applyFilters = () => {
    let filtered = [...schedules];

    // Filter by course type
    if (selectedCourseType !== "all") {
      filtered = filtered.filter((s) => s.courseType === selectedCourseType);
    }

    // Filter by venue
    if (selectedVenue !== "all") {
      filtered = filtered.filter((s) => s.venue === selectedVenue);
    }

    // Filter by month
    if (selectedMonth !== "all") {
      const [year, month] = selectedMonth.split("-").map(Number);
      filtered = filtered.filter((s) => {
        const date = new Date(s.startDate);
        return date.getFullYear() === year && date.getMonth() === month - 1;
      });
    }

    // Filter by search query
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (s) =>
          s.courseName.toLowerCase().includes(query) ||
          s.venueName.toLowerCase().includes(query) ||
          s.instructorName.toLowerCase().includes(query),
      );
    }

    // Filter out full courses if needed
    if (!showFullCourses) {
      filtered = filtered.filter((s) => s.availableSpots > 0);
    }

    setFilteredSchedules(filtered);
  };

  const handleRetry = () => {
    fetchAvailableCourses();
  };

  const getAvailableMonths = () => {
    const months = new Set<string>();
    schedules.forEach((schedule) => {
      const date = new Date(schedule.startDate);
      const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
      months.add(monthKey);
    });
    return Array.from(months).sort();
  };

  if (loading) {
    return (
      <BookingSkeleton variant={viewMode === "calendar" ? "grid" : "list"} />
    );
  }

  if (error) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center py-12 px-6 bg-red-50 dark:bg-red-900/20 rounded-xl border border-red-200 dark:border-red-800"
      >
        <AlertCircle className="w-12 h-12 text-red-600 dark:text-red-400 mx-auto mb-4" />
        <h3 className="text-lg font-semibold text-red-900 dark:text-red-100 mb-2">
          Unable to Load Courses
        </h3>
        <p className="text-red-700 dark:text-red-300 mb-4">{error}</p>
        <button
          onClick={handleRetry}
          className="btn btn-outline btn-sm inline-flex items-center gap-2"
        >
          <RefreshCw className="w-4 h-4" />
          Try Again
        </button>
      </motion.div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Filters Section */}
      <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold flex items-center gap-2">
            <Filter className="w-5 h-5" />
            Filter Courses
          </h3>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setViewMode("calendar")}
              className={cn(
                "p-2 rounded-lg transition-colors",
                viewMode === "calendar"
                  ? "bg-primary-100 text-primary-600 dark:bg-primary-900/30 dark:text-primary-400"
                  : "hover:bg-gray-100 dark:hover:bg-gray-700",
              )}
              title="Calendar View"
            >
              <CalendarDays className="w-5 h-5" />
            </button>
            <button
              onClick={() => setViewMode("list")}
              className={cn(
                "p-2 rounded-lg transition-colors",
                viewMode === "list"
                  ? "bg-primary-100 text-primary-600 dark:bg-primary-900/30 dark:text-primary-400"
                  : "hover:bg-gray-100 dark:hover:bg-gray-700",
              )}
              title="List View"
            >
              <Grid3X3 className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Search Bar */}
        <div className="mb-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search courses, venues, or instructors..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            />
          </div>
        </div>

        {/* Filter Controls */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div>
            <label className="block text-sm font-medium mb-1">
              Course Type
            </label>
            <select
              value={selectedCourseType}
              onChange={(e) =>
                setSelectedCourseType(e.target.value as CourseTypeCode | "all")
              }
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500"
            >
              <option value="all">All Courses</option>
              {Object.entries(COURSE_TYPE_CONFIG).map(([code, config]) => (
                <option key={code} value={code}>
                  {config.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Location</label>
            <select
              value={selectedVenue}
              onChange={(e) =>
                setSelectedVenue(e.target.value as VenueCode | "all")
              }
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500"
            >
              <option value="all">All Locations</option>
              {Object.entries(VENUE_CONFIG).map(([code, venue]) => (
                <option key={code} value={code}>
                  {venue.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Month</label>
            <select
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500"
            >
              <option value="all">All Months</option>
              {getAvailableMonths().map((month) => {
                const [year, monthNum] = month.split("-");
                const monthName = new Date(
                  Number(year),
                  Number(monthNum) - 1,
                ).toLocaleDateString("en-GB", {
                  month: "long",
                  year: "numeric",
                });
                return (
                  <option key={month} value={month}>
                    {monthName}
                  </option>
                );
              })}
            </select>
          </div>

          <div className="flex items-end">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={showFullCourses}
                onChange={(e) => setShowFullCourses(e.target.checked)}
                className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
              />
              <span className="text-sm">Show fully booked courses</span>
            </label>
          </div>
        </div>

        {/* Results Count */}
        <div className="mt-4 text-sm text-gray-600 dark:text-gray-400">
          Showing {filteredSchedules.length} of {schedules.length} courses
        </div>
      </div>

      {/* View Content */}
      <AnimatePresence mode="wait">
        {viewMode === "calendar" ? (
          <motion.div
            key="calendar"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
          >
            <CalendarView
              schedules={filteredSchedules}
              onSelectCourse={onSelectCourse}
              selectedScheduleId={selectedScheduleId}
            />
          </motion.div>
        ) : (
          <motion.div
            key="list"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
          >
            {filteredSchedules.length === 0 ? (
              <div className="text-center py-12 px-6 bg-gray-50 dark:bg-gray-800 rounded-xl">
                <Calendar className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">No Courses Found</h3>
                <p className="text-gray-600 dark:text-gray-400">
                  Try adjusting your filters or search criteria
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {filteredSchedules.map((schedule) => (
                  <CourseCard
                    key={schedule.id}
                    schedule={schedule}
                    isSelected={selectedScheduleId === schedule.id}
                    onSelect={() => onSelectCourse(schedule)}
                    variant="default"
                  />
                ))}
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
