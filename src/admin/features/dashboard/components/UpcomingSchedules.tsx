import React from "react";
import { Link } from "react-router-dom";
import { Calendar, MapPin, Users } from "lucide-react";
import { format } from "date-fns";

interface Schedule {
  id: number;
  courseName: string;
  date: string;
  time: string;
  venue: string;
  currentCapacity: number;
  maxCapacity: number;
}

interface UpcomingSchedulesProps {
  schedules: Schedule[];
}

export const UpcomingSchedules: React.FC<UpcomingSchedulesProps> = ({
  schedules,
}) => {
  if (schedules.length === 0) {
    return (
      <div className="text-center py-6 text-gray-500">
        No upcoming schedules
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {schedules.slice(0, 5).map((schedule) => (
        <div
          key={schedule.id}
          className="border rounded-lg p-4 hover:shadow-md transition-shadow"
        >
          <div className="flex justify-between items-start">
            <div className="flex-1">
              <h3 className="font-medium text-gray-900">
                {schedule.courseName}
              </h3>
              <div className="mt-2 space-y-1 text-sm text-gray-500">
                <div className="flex items-center">
                  <Calendar className="h-4 w-4 mr-2" />
                  {format(new Date(schedule.date), "MMM d, yyyy")} at{" "}
                  {schedule.time}
                </div>
                <div className="flex items-center">
                  <MapPin className="h-4 w-4 mr-2" />
                  {schedule.venue}
                </div>
                <div className="flex items-center">
                  <Users className="h-4 w-4 mr-2" />
                  {schedule.currentCapacity} / {schedule.maxCapacity} attendees
                </div>
              </div>
            </div>
            <Link
              to={`/admin/schedule/${schedule.id}`}
              className="text-primary-600 hover:text-primary-700 text-sm font-medium"
            >
              View Details
            </Link>
          </div>
        </div>
      ))}

      {schedules.length > 5 && (
        <Link
          to="/admin/schedule"
          className="block text-center text-primary-600 hover:text-primary-700 text-sm font-medium pt-2"
        >
          View all schedules →
        </Link>
      )}
    </div>
  );
};
