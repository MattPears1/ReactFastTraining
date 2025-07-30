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
  X,
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
  const [expandedDate, setExpandedDate] = useState<string | null>(null);
  const [showMobileSheet, setShowMobileSheet] = useState(false);
  const [selectedDaySchedules, setSelectedDaySchedules] =
    useState<DaySchedules | null>(null);

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
  };

  const handleDayClick = (day: DaySchedules) => {
    if (day.schedules.length > 0 && !isPastDate(day.date)) {
      setSelectedDaySchedules(day);
      // Only show mobile sheet on mobile devices
      if (window.innerWidth < 1024) {
        setShowMobileSheet(true);
      }
    }
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
    <>
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm overflow-hidden">
        {/* Calendar Header - Mobile Optimized */}
        <div className="p-4 sm:p-6 border-b dark:border-gray-700">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg sm:text-xl md:text-2xl font-bold">
              {currentMonth.toLocaleDateString("en-GB", {
                month: "long",
                year: "numeric",
              })}
            </h2>
            <div className="flex items-center gap-1 sm:gap-2">
              <button
                onClick={handleToday}
                className="px-2 sm:px-3 py-1 text-xs sm:text-sm font-medium text-primary-600 hover:bg-primary-50 dark:text-primary-400 dark:hover:bg-primary-900/20 rounded-lg transition-colors"
              >
                Today
              </button>
              <button
                onClick={handlePreviousMonth}
                className="p-1.5 sm:p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
              >
                <ChevronLeft className="w-4 h-4 sm:w-5 sm:h-5" />
              </button>
              <button
                onClick={handleNextMonth}
                className="p-1.5 sm:p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
              >
                <ChevronRight className="w-4 h-4 sm:w-5 sm:h-5" />
              </button>
            </div>
          </div>

          {/* Weekday Headers - Abbreviated on Mobile */}
          <div className="grid grid-cols-7 gap-0 text-center">
            {["M", "T", "W", "T", "F", "S", "S"].map((day, index) => (
              <div
                key={index}
                className="text-xs sm:text-sm font-medium text-gray-500 dark:text-gray-400 py-1 sm:py-2"
              >
                <span className="sm:hidden">{day}</span>
                <span className="hidden sm:inline">
                  {["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"][index]}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Calendar Grid - Mobile Optimized */}
        <div className="p-2 sm:p-4 md:p-6">
          <div className="grid grid-cols-7 gap-1">
            {calendarDays.map((day, index) => {
              const dateKey = day.date.toDateString();
              const coursesCount = getDayCoursesCount(day);
              const hasCourses = day.schedules.length > 0;
              const isPast = isPastDate(day.date);
              const isInCurrentMonth = isCurrentMonth(day.date);

              return (
                <motion.div
                  key={dateKey}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: index * 0.005 }}
                  className={cn(
                    "aspect-square border rounded-lg p-0.5 sm:p-1 md:p-2 transition-all relative",
                    isToday(day.date) &&
                      "ring-2 ring-primary-500 border-primary-500",
                    selectedDaySchedules?.date.toDateString() ===
                      day.date.toDateString() &&
                      "bg-primary-50 dark:bg-primary-900/20 border-primary-500",
                    !isInCurrentMonth && "opacity-40",
                    isPast && "bg-gray-50 dark:bg-gray-900",
                    hasCourses &&
                      !isPast &&
                      "cursor-pointer hover:shadow-md active:scale-95",
                    "dark:border-gray-700",
                    "min-h-[50px] sm:min-h-[60px] md:min-h-[80px]",
                  )}
                  onClick={() => handleDayClick(day)}
                >
                  <div className="flex flex-col h-full">
                    <span
                      className={cn(
                        "text-xs sm:text-sm font-medium",
                        isToday(day.date) &&
                          "text-primary-600 dark:text-primary-400",
                        !isInCurrentMonth && "text-gray-400 dark:text-gray-600",
                      )}
                    >
                      {day.date.getDate()}
                    </span>

                    {/* Course Count Badge - Mobile Optimized */}
                    {coursesCount > 0 && !isPast && (
                      <div className="flex-1 flex items-center justify-center">
                        <span
                          className={cn(
                            "inline-flex items-center justify-center text-xs font-bold rounded-full",
                            "w-5 h-5 sm:w-6 sm:h-6",
                            "bg-primary-100 text-primary-700 dark:bg-primary-900/30 dark:text-primary-300",
                          )}
                        >
                          {coursesCount}
                        </span>
                      </div>
                    )}

                    {/* Course Dots - Hidden on Mobile */}
                    {hasCourses && !isPast && (
                      <div className="hidden sm:flex gap-0.5 absolute bottom-1 left-1 right-1">
                        {day.schedules.slice(0, 3).map((schedule, idx) => {
                          const config =
                            COURSE_TYPE_CONFIG[schedule.courseType];
                          return (
                            <div
                              key={idx}
                              className={cn(
                                "w-1.5 h-1.5 rounded-full",
                                schedule.availableSpots === 0
                                  ? "bg-gray-300"
                                  : config.color.dot,
                              )}
                            />
                          );
                        })}
                      </div>
                    )}
                  </div>
                </motion.div>
              );
            })}
          </div>
        </div>

        {/* Legend - Mobile Optimized */}
        <div className="p-3 sm:p-4 md:p-6 border-t dark:border-gray-700 bg-gray-50 dark:bg-gray-900">
          <div className="flex flex-wrap items-center gap-3 sm:gap-6 text-xs sm:text-sm">
            <div className="flex items-center gap-1.5 sm:gap-2">
              <div className="w-5 h-5 sm:w-6 sm:h-6 bg-primary-100 text-primary-700 dark:bg-primary-900/30 dark:text-primary-300 rounded-full flex items-center justify-center text-xs font-bold">
                3
              </div>
              <span className="text-gray-600 dark:text-gray-400">
                Available
              </span>
            </div>
            <div className="flex items-center gap-1.5 sm:gap-2">
              <Calendar className="w-4 h-4 text-primary-600 dark:text-primary-400" />
              <span className="text-gray-600 dark:text-gray-400">
                Tap to view
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Desktop Sessions Display */}
      <div className="hidden lg:block mt-6">
        {selectedDaySchedules && selectedDaySchedules.schedules.length > 0 ? (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="hidden lg:block mt-6"
          >
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6">
              <h3 className="text-xl font-bold mb-4">
                Sessions for{" "}
                {selectedDaySchedules.date.toLocaleDateString("en-GB", {
                  weekday: "long",
                  day: "numeric",
                  month: "long",
                })}
              </h3>

              <div className="grid gap-4 md:grid-cols-2">
                {selectedDaySchedules.schedules.map((schedule) => {
                  const config = COURSE_TYPE_CONFIG[schedule.courseType];
                  const isSelected = selectedScheduleId === schedule.id;
                  const isFull = schedule.availableSpots === 0;

                  return (
                    <motion.div
                      key={schedule.id}
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      whileHover={{ scale: 1.02 }}
                      className={cn(
                        "p-4 rounded-lg border-2 transition-all cursor-pointer",
                        config.color.border,
                        config.color.background,
                        isSelected && "ring-2 ring-primary-500",
                        isFull && "opacity-60 cursor-not-allowed",
                        !isFull && "hover:shadow-md",
                      )}
                      onClick={() => {
                        if (!isFull) {
                          onSelectCourse(schedule);
                        }
                      }}
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
                          <p className="text-lg font-bold text-primary-600 dark:text-primary-400">
                            £{schedule.pricePerPerson}
                          </p>
                          {!isFull && (
                            <span className="text-sm text-green-600 dark:text-green-400">
                              Book Now
                            </span>
                          )}
                        </div>
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            </div>
          </motion.div>
        ) : (
          <div className="bg-gray-50 dark:bg-gray-900 rounded-lg p-8 text-center">
            <Calendar className="w-12 h-12 text-gray-400 mx-auto mb-3" />
            <p className="text-gray-600 dark:text-gray-400 font-medium">
              Click on a date with available sessions to view course details
            </p>
          </div>
        )}
      </div>

      {/* Mobile Bottom Sheet for Course Details */}
      <AnimatePresence>
        {showMobileSheet && selectedDaySchedules && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/50 z-40 lg:hidden"
              onClick={() => setShowMobileSheet(false)}
            />

            {/* Bottom Sheet */}
            <motion.div
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              exit={{ y: "100%" }}
              transition={{ type: "spring", damping: 25 }}
              className="fixed bottom-0 left-0 right-0 bg-white dark:bg-gray-800 rounded-t-2xl shadow-xl z-50 lg:hidden max-h-[85vh] overflow-hidden"
            >
              {/* Handle */}
              <div className="flex justify-center pt-4 pb-2">
                <div className="w-16 h-1.5 bg-gray-300 dark:bg-gray-600 rounded-full" />
              </div>

              {/* Header */}
              <div className="flex items-center justify-between px-4 py-3 border-b dark:border-gray-700">
                <h3 className="text-xl font-semibold">
                  {selectedDaySchedules.date.toLocaleDateString("en-GB", {
                    weekday: "long",
                    day: "numeric",
                    month: "long",
                  })}
                </h3>
                <button
                  onClick={() => setShowMobileSheet(false)}
                  className="p-3 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg min-w-[44px] min-h-[44px] flex items-center justify-center"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>

              {/* Course List */}
              <div className="p-4 space-y-4 overflow-y-auto max-h-[65vh] -webkit-overflow-scrolling-touch">
                {selectedDaySchedules.schedules.map((schedule) => {
                  const config = COURSE_TYPE_CONFIG[schedule.courseType];
                  const isSelected = selectedScheduleId === schedule.id;
                  const isFull = schedule.availableSpots === 0;

                  return (
                    <motion.div
                      key={schedule.id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      className={cn(
                        "p-4 rounded-lg border-2 transition-all min-h-[120px] cursor-pointer",
                        config.color.border,
                        config.color.background,
                        isSelected && "ring-2 ring-primary-500",
                        isFull && "opacity-60",
                        !isFull && "active:scale-98",
                      )}
                      onClick={() => {
                        if (!isFull) {
                          onSelectCourse(schedule);
                          setShowMobileSheet(false);
                        }
                      }}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <h4 className="font-semibold text-base sm:text-lg mb-2">
                            {schedule.courseName}
                          </h4>
                          <div className="space-y-2 text-base text-gray-600 dark:text-gray-400">
                            <div className="flex items-center gap-2">
                              <Clock className="w-5 h-5 flex-shrink-0" />
                              <span>
                                {formatTime(schedule.startDate)} -{" "}
                                {formatTime(schedule.endDate)}
                              </span>
                            </div>
                            <div className="flex items-center gap-2">
                              <MapPin className="w-5 h-5 flex-shrink-0" />
                              <span>{schedule.venueName}</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <Users className="w-5 h-5 flex-shrink-0" />
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
                                "mt-2 px-4 py-2.5 rounded-lg text-base font-medium transition-colors min-h-[44px]",
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
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
};
