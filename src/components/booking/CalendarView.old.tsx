import React, { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  ChevronLeft,
  ChevronRight,
  Calendar,
  Clock,
  MapPin,
  Users,
  AlertCircle,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import { cn } from "@utils/cn";
import { CourseSchedule } from "@/types/booking.types";
import { COURSE_TYPE_CONFIG } from "@/config/courseTypes.config";
import { formatTime } from "@/utils/dateFormatting";

interface CalendarViewProps {
  schedules: CourseSchedule[];
  onSelectCourse: (schedule: CourseSchedule) => void;
  selectedScheduleId?: number;
}

interface DaySchedules {
  date: Date;
  schedules: CourseSchedule[];
}

export const CalendarView: React.FC<CalendarViewProps> = ({
  schedules,
  onSelectCourse,
  selectedScheduleId,
}) => {
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [expandedDays, setExpandedDays] = useState<Set<string>>(new Set());
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);

  // Group schedules by date
  const schedulesByDate = useMemo(() => {
    const grouped = new Map<string, CourseSchedule[]>();

    schedules.forEach((schedule) => {
      const dateKey = new Date(schedule.startDate).toDateString();
      if (!grouped.has(dateKey)) {
        grouped.set(dateKey, []);
      }
      grouped.get(dateKey)!.push(schedule);
    });

    return grouped;
  }, [schedules]);

  // Get calendar days for current month
  const calendarDays = useMemo(() => {
    const year = currentMonth.getFullYear();
    const month = currentMonth.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const startDate = new Date(firstDay);
    const endDate = new Date(lastDay);

    // Adjust to start on Monday
    const firstDayOfWeek = firstDay.getDay();
    const daysToSubtract = firstDayOfWeek === 0 ? 6 : firstDayOfWeek - 1;
    startDate.setDate(startDate.getDate() - daysToSubtract);

    // Adjust to end on Sunday
    const lastDayOfWeek = lastDay.getDay();
    const daysToAdd = lastDayOfWeek === 0 ? 0 : 7 - lastDayOfWeek;
    endDate.setDate(endDate.getDate() + daysToAdd);

    const days: DaySchedules[] = [];
    const current = new Date(startDate);

    while (current <= endDate) {
      const dateKey = current.toDateString();
      days.push({
        date: new Date(current),
        schedules: schedulesByDate.get(dateKey) || [],
      });
      current.setDate(current.getDate() + 1);
    }

    return days;
  }, [currentMonth, schedulesByDate]);

  const handlePreviousMonth = () => {
    setCurrentMonth(
      (prev) => new Date(prev.getFullYear(), prev.getMonth() - 1),
    );
  };

  const handleNextMonth = () => {
    setCurrentMonth(
      (prev) => new Date(prev.getFullYear(), prev.getMonth() + 1),
    );
  };

  const handleToday = () => {
    setCurrentMonth(new Date());
    setSelectedDate(new Date());
  };

  const toggleDayExpanded = (dateKey: string) => {
    setExpandedDays((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(dateKey)) {
        newSet.delete(dateKey);
      } else {
        newSet.add(dateKey);
      }
      return newSet;
    });
  };

  const isToday = (date: Date) => {
    const today = new Date();
    return date.toDateString() === today.toDateString();
  };

  const isPastDate = (date: Date) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return date < today;
  };

  const isCurrentMonth = (date: Date) => {
    return (
      date.getMonth() === currentMonth.getMonth() &&
      date.getFullYear() === currentMonth.getFullYear()
    );
  };

  const getDayCoursesCount = (day: DaySchedules) => {
    return day.schedules.filter((s) => s.availableSpots > 0).length;
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm">
      {/* Calendar Header */}
      <div className="p-6 border-b dark:border-gray-700">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-2xl font-bold">
            {currentMonth.toLocaleDateString("en-GB", {
              month: "long",
              year: "numeric",
            })}
          </h2>
          <div className="flex items-center gap-2">
            <button
              onClick={handleToday}
              className="px-3 py-1 text-sm font-medium text-primary-600 hover:bg-primary-50 dark:text-primary-400 dark:hover:bg-primary-900/20 rounded-lg transition-colors"
            >
              Today
            </button>
            <button
              onClick={handlePreviousMonth}
              className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <button
              onClick={handleNextMonth}
              className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Weekday Headers */}
        <div className="grid grid-cols-7 gap-1 text-center">
          {["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map((day) => (
            <div
              key={day}
              className="text-sm font-medium text-gray-500 dark:text-gray-400 py-2"
            >
              {day}
            </div>
          ))}
        </div>
      </div>

      {/* Calendar Grid */}
      <div className="p-6">
        <div className="grid grid-cols-7 gap-1">
          {calendarDays.map((day, index) => {
            const dateKey = day.date.toDateString();
            const isExpanded = expandedDays.has(dateKey);
            const coursesCount = getDayCoursesCount(day);
            const hasCourses = day.schedules.length > 0;
            const isPast = isPastDate(day.date);
            const isInCurrentMonth = isCurrentMonth(day.date);

            return (
              <motion.div
                key={dateKey}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: index * 0.01 }}
                className={cn(
                  "min-h-[80px] border rounded-lg p-2 transition-all",
                  isToday(day.date) &&
                    "ring-2 ring-primary-500 border-primary-500",
                  !isInCurrentMonth && "opacity-40",
                  isPast && "bg-gray-50 dark:bg-gray-900",
                  hasCourses && !isPast && "cursor-pointer hover:shadow-md",
                  "dark:border-gray-700",
                )}
                onClick={() =>
                  hasCourses && !isPast && toggleDayExpanded(dateKey)
                }
              >
                <div className="flex items-start justify-between mb-1">
                  <span
                    className={cn(
                      "text-sm font-medium",
                      isToday(day.date) &&
                        "text-primary-600 dark:text-primary-400",
                      !isInCurrentMonth && "text-gray-400 dark:text-gray-600",
                    )}
                  >
                    {day.date.getDate()}
                  </span>
                  {hasCourses && !isPast && (
                    <motion.div
                      animate={{ rotate: isExpanded ? 180 : 0 }}
                      transition={{ duration: 0.2 }}
                    >
                      <ChevronDown className="w-4 h-4 text-gray-400" />
                    </motion.div>
                  )}
                </div>

                {/* Course Count Badge */}
                {coursesCount > 0 && !isPast && (
                  <div className="flex items-center justify-center">
                    <span
                      className={cn(
                        "inline-flex items-center justify-center w-6 h-6 text-xs font-bold rounded-full",
                        "bg-primary-100 text-primary-700 dark:bg-primary-900/30 dark:text-primary-300",
                      )}
                    >
                      {coursesCount}
                    </span>
                  </div>
                )}

                {/* Course Preview Dots */}
                {hasCourses && !isExpanded && !isPast && (
                  <div className="flex gap-1 mt-2 flex-wrap">
                    {day.schedules.slice(0, 3).map((schedule, idx) => {
                      const config = COURSE_TYPE_CONFIG[schedule.courseType];
                      return (
                        <div
                          key={idx}
                          className={cn(
                            "w-2 h-2 rounded-full",
                            schedule.availableSpots === 0
                              ? "bg-gray-300"
                              : config.color.dot,
                          )}
                          title={schedule.courseName}
                        />
                      );
                    })}
                    {day.schedules.length > 3 && (
                      <span className="text-xs text-gray-500">
                        +{day.schedules.length - 3}
                      </span>
                    )}
                  </div>
                )}
              </motion.div>
            );
          })}
        </div>
      </div>

      {/* Expanded Day Details */}
      <AnimatePresence>
        {Array.from(expandedDays).map((dateKey) => {
          const day = calendarDays.find(
            (d) => d.date.toDateString() === dateKey,
          );
          if (!day || day.schedules.length === 0) return null;

          return (
            <motion.div
              key={dateKey}
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="border-t dark:border-gray-700"
            >
              <div className="p-6">
                <h3 className="text-lg font-semibold mb-4">
                  Courses on{" "}
                  {day.date.toLocaleDateString("en-GB", {
                    weekday: "long",
                    day: "numeric",
                    month: "long",
                  })}
                </h3>

                <div className="space-y-3">
                  {day.schedules.map((schedule) => {
                    const config = COURSE_TYPE_CONFIG[schedule.courseType];
                    const isSelected = selectedScheduleId === schedule.id;
                    const isFull = schedule.availableSpots === 0;

                    return (
                      <motion.div
                        key={schedule.id}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        className={cn(
                          "p-4 rounded-lg border-2 cursor-pointer transition-all",
                          config.color.border,
                          config.color.background,
                          isSelected && "ring-2 ring-primary-500",
                          isFull && "opacity-60 cursor-not-allowed",
                          !isFull && "hover:shadow-md",
                        )}
                        onClick={() => !isFull && onSelectCourse(schedule)}
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <h4 className="font-semibold mb-2">
                              {schedule.courseName}
                            </h4>
                            <div className="space-y-1 text-sm text-gray-600 dark:text-gray-400">
                              <div className="flex items-center gap-2">
                                <Clock className="w-4 h-4" />
                                <span>
                                  {formatTime(schedule.startDate)} -{" "}
                                  {formatTime(schedule.endDate)}
                                </span>
                              </div>
                              <div className="flex items-center gap-2">
                                <MapPin className="w-4 h-4" />
                                <span>{schedule.venueName}</span>
                              </div>
                              <div className="flex items-center gap-2">
                                <Users className="w-4 h-4" />
                                <span>
                                  {isFull
                                    ? "Fully booked"
                                    : `${schedule.availableSpots} spots available`}
                                </span>
                              </div>
                            </div>
                          </div>
                          <div className="text-right">
                            <p className="text-xl font-bold text-primary-600 dark:text-primary-400">
                              £{schedule.pricePerPerson}
                            </p>
                            {!isFull && (
                              <button
                                className={cn(
                                  "mt-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors",
                                  isSelected
                                    ? "bg-primary-600 text-white"
                                    : "bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600",
                                )}
                              >
                                {isSelected ? "Selected" : "Select"}
                              </button>
                            )}
                          </div>
                        </div>
                      </motion.div>
                    );
                  })}
                </div>
              </div>
            </motion.div>
          );
        })}
      </AnimatePresence>

      {/* Legend */}
      <div className="p-6 border-t dark:border-gray-700 bg-gray-50 dark:bg-gray-900">
        <div className="flex flex-wrap items-center gap-6 text-sm">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 bg-primary-100 text-primary-700 dark:bg-primary-900/30 dark:text-primary-300 rounded-full flex items-center justify-center text-xs font-bold">
              3
            </div>
            <span className="text-gray-600 dark:text-gray-400">
              Available courses
            </span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-gray-300 rounded-full" />
            <span className="text-gray-600 dark:text-gray-400">
              Fully booked
            </span>
          </div>
          <div className="flex items-center gap-2">
            <Calendar className="w-4 h-4 text-primary-600 dark:text-primary-400" />
            <span className="text-gray-600 dark:text-gray-400">
              Click dates to view courses
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
