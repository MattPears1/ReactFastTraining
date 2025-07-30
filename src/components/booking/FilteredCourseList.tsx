import React, { useState, useEffect } from "react";
import { CourseFilters, FilterState } from "./CourseFilters";
import { CapacityIndicator } from "./CapacityIndicator";
import {
  calendarApi,
  SessionAvailability,
} from "@services/api/calendar.service";
import { format } from "date-fns";
import { Calendar, Clock, MapPin, ChevronRight, Loader2 } from "lucide-react";
import { cn } from "@utils/cn";
import { useNavigate } from "react-router-dom";
import { useWebSocket, SessionUpdateEvent } from "@hooks/useWebSocket";

export const FilteredCourseList: React.FC = () => {
  const [sessions, setSessions] = useState<SessionAvailability[]>([]);
  const [loading, setLoading] = useState(false);
  const [filters, setFilters] = useState<FilterState>({
    dateFrom: null,
    dateTo: null,
    courseType: "",
    showOnlyAvailable: true,
    location: "",
  });

  const navigate = useNavigate();
  const { subscribe } = useWebSocket();

  useEffect(() => {
    loadSessions();
  }, [filters]);

  // Subscribe to real-time updates
  useEffect(() => {
    const handleSessionUpdate = (data: SessionUpdateEvent) => {
      setSessions((prevSessions) =>
        prevSessions.map((session) =>
          session.sessionId === data.sessionId
            ? {
                ...session,
                currentBookings: data.currentBookings,
                availableSpots: data.availableSpots,
                status:
                  data.availableSpots === 0
                    ? "FULL"
                    : data.availableSpots <= 3
                      ? "ALMOST_FULL"
                      : "AVAILABLE",
              }
            : session,
        ),
      );
    };

    const unsubscribe = subscribe("session-update", handleSessionUpdate);
    return unsubscribe;
  }, [subscribe]);

  const loadSessions = async () => {
    setLoading(true);
    try {
      const data = await calendarApi.getFilteredSessions({
        startDate: filters.dateFrom || undefined,
        endDate: filters.dateTo || undefined,
        courseType: filters.courseType || undefined,
        location: filters.location || undefined,
        showOnlyAvailable: filters.showOnlyAvailable,
      });
      setSessions(data);
    } catch (error) {
      console.error("Failed to load sessions:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleBookNow = (sessionId: string) => {
    navigate(`/booking?session=${sessionId}`);
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Filters Sidebar */}
        <div className="lg:col-span-1">
          <div className="sticky top-4">
            <CourseFilters onFiltersChange={setFilters} />
          </div>
        </div>

        {/* Course List */}
        <div className="lg:col-span-3">
          <div className="mb-4">
            <h2 className="text-2xl font-bold text-gray-900">
              Available Courses
            </h2>
            <p className="text-gray-600 mt-1">
              {loading ? "Loading..." : `${sessions.length} courses found`}
            </p>
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-8 h-8 animate-spin text-primary-500" />
            </div>
          ) : sessions.length === 0 ? (
            <div className="text-center py-12 bg-gray-50 rounded-lg">
              <p className="text-gray-600 mb-4">
                No courses found matching your criteria.
              </p>
              <button
                onClick={() =>
                  setFilters({
                    dateFrom: null,
                    dateTo: null,
                    courseType: "",
                    showOnlyAvailable: true,
                    location: "",
                  })
                }
                className="text-primary-600 hover:text-primary-700 font-medium"
              >
                Clear all filters
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              {sessions.map((session) => {
                const sessionDate = new Date(session.sessionDate);
                const isPast = sessionDate < new Date();

                return (
                  <div
                    key={session.sessionId}
                    className={cn(
                      "bg-white rounded-lg shadow-md overflow-hidden transition-all",
                      session.status === "FULL" && "opacity-75",
                      isPast && "opacity-50",
                      !isPast && session.status !== "FULL" && "hover:shadow-lg",
                    )}
                  >
                    <div className="p-6">
                      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                        {/* Course Info */}
                        <div className="flex-1">
                          <h3 className="text-xl font-semibold text-gray-900 mb-3">
                            {session.courseType}
                          </h3>

                          <div className="space-y-2 text-sm text-gray-600">
                            <div className="flex items-center gap-2">
                              <Calendar className="w-4 h-4 text-gray-400" />
                              <span>
                                {format(sessionDate, "EEEE, MMMM d, yyyy")}
                              </span>
                            </div>
                            <div className="flex items-center gap-2">
                              <Clock className="w-4 h-4 text-gray-400" />
                              <span>
                                {session.startTime} - {session.endTime}
                              </span>
                            </div>
                            <div className="flex items-center gap-2">
                              <MapPin className="w-4 h-4 text-gray-400" />
                              <span>{session.location}</span>
                            </div>
                          </div>
                        </div>

                        {/* Capacity and Booking */}
                        <div className="md:w-80">
                          <CapacityIndicator
                            current={session.currentBookings}
                            max={session.maxCapacity}
                            size="md"
                            className="mb-4"
                          />

                          {!isPast && session.status !== "FULL" ? (
                            <button
                              onClick={() => handleBookNow(session.sessionId)}
                              className="w-full bg-primary-600 text-white py-3 px-4 rounded-lg font-medium hover:bg-primary-700 transition-colors flex items-center justify-center gap-2"
                            >
                              Book Now
                              <ChevronRight className="w-5 h-5" />
                            </button>
                          ) : isPast ? (
                            <div className="text-center text-gray-500 py-3">
                              This session has already taken place
                            </div>
                          ) : (
                            <div className="text-center text-red-600 font-medium py-3">
                              This session is fully booked
                            </div>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Status Banner */}
                    {session.status === "ALMOST_FULL" && !isPast && (
                      <div className="bg-yellow-50 border-t border-yellow-200 px-6 py-3">
                        <p className="text-sm text-yellow-800 font-medium">
                          ⚠️ Only {session.availableSpots} spots remaining -
                          book soon!
                        </p>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
