import React from "react";
import { Calendar, MapPin, Users, AlertCircle, Clock } from "lucide-react";
import { format } from "date-fns";
import { Link } from "react-router-dom";
import { cn } from "@utils/cn";

interface SessionSummary {
  session: {
    id: string;
    courseType: string;
    sessionDate: string;
    startTime: string;
    endTime: string;
    location: string;
    maxCapacity: number;
    status: string;
  };
  bookingsCount: number;
  attendeesCount: number;
  remainingSpots: number;
}

interface UpcomingSessionsListProps {
  sessions: SessionSummary[];
}

export const UpcomingSessionsList: React.FC<UpcomingSessionsListProps> = ({
  sessions,
}) => {
  if (sessions.length === 0) {
    return (
      <div className="text-center py-8">
        <Calendar className="w-12 h-12 text-gray-400 mx-auto mb-3" />
        <p className="text-gray-500 dark:text-gray-400">No upcoming sessions</p>
        <Link
          to="/admin/calendar"
          className="text-primary-600 hover:text-primary-700 text-sm mt-2 inline-block"
        >
          Schedule a session →
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-3 max-h-96 overflow-y-auto">
      {sessions.map((item) => {
        const { session, bookingsCount, attendeesCount, remainingSpots } = item;
        const percentFull = (attendeesCount / session.maxCapacity) * 100;
        const isNearlyFull = percentFull >= 75;
        const isFull = percentFull >= 100;

        return (
          <Link
            key={session.id}
            to={`/admin/sessions/${session.id}`}
            className="block p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
          >
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <h4 className="font-medium text-gray-900 dark:text-white">
                  {session.courseType}
                </h4>
                <div className="flex items-center gap-3 mt-1 text-sm text-gray-600 dark:text-gray-400">
                  <span className="flex items-center gap-1">
                    <Calendar className="w-3 h-3" />
                    {format(new Date(session.sessionDate), "MMM dd")}
                  </span>
                  <span className="flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    {session.startTime}
                  </span>
                  <span className="flex items-center gap-1">
                    <MapPin className="w-3 h-3" />
                    {session.location}
                  </span>
                </div>
              </div>

              <div className="text-right ml-4">
                <div
                  className={cn(
                    "inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium",
                    isFull &&
                      "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400",
                    isNearlyFull &&
                      !isFull &&
                      "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400",
                    !isNearlyFull &&
                      "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400",
                  )}
                >
                  <Users className="w-3 h-3" />
                  {attendeesCount}/{session.maxCapacity}
                </div>

                {remainingSpots > 0 && (
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                    {remainingSpots} spots left
                  </p>
                )}
              </div>
            </div>

            {/* Progress bar */}
            <div className="mt-3">
              <div className="w-full bg-gray-200 dark:bg-gray-600 rounded-full h-1.5">
                <div
                  className={cn(
                    "h-1.5 rounded-full transition-all",
                    isFull && "bg-red-500",
                    isNearlyFull && !isFull && "bg-amber-500",
                    !isNearlyFull && "bg-green-500",
                  )}
                  style={{ width: `${Math.min(100, percentFull)}%` }}
                />
              </div>
            </div>

            {session.status === "scheduled" && percentFull < 50 && (
              <div className="flex items-center gap-1 mt-2 text-xs text-amber-600 dark:text-amber-400">
                <AlertCircle className="w-3 h-3" />
                Low enrollment
              </div>
            )}
          </Link>
        );
      })}

      <Link
        to="/admin/calendar"
        className="block text-center py-2 text-sm text-primary-600 hover:text-primary-700 dark:text-primary-400 dark:hover:text-primary-300"
      >
        View all sessions →
      </Link>
    </div>
  );
};
