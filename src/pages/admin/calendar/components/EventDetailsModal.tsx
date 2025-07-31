import React from "react";
import { X, Calendar, Clock, MapPin, Users, AlertCircle } from "lucide-react";
import { CalendarEvent } from "../types";
import { cn } from "@utils/cn";

interface EventDetailsModalProps {
  event: CalendarEvent;
  onClose: () => void;
  onUpdate: () => void;
}

export const EventDetailsModal: React.FC<EventDetailsModalProps> = ({
  event,
  onClose,
  onUpdate,
}) => {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
            {event.title}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-500 dark:hover:text-gray-300"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Course Details */}
          <div className="grid grid-cols-2 gap-4">
            <div className="flex items-center gap-3">
              <Calendar className="w-5 h-5 text-gray-400" />
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400">Date</p>
                <p className="text-gray-900 dark:text-white">
                  {event.start.toLocaleDateString('en-GB', {
                    weekday: 'long',
                    day: 'numeric',
                    month: 'long',
                    year: 'numeric',
                  })}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <Clock className="w-5 h-5 text-gray-400" />
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400">Time</p>
                <p className="text-gray-900 dark:text-white">
                  {event.start.toLocaleTimeString('en-GB', {
                    hour: '2-digit',
                    minute: '2-digit',
                  })} - {event.end.toLocaleTimeString('en-GB', {
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <MapPin className="w-5 h-5 text-gray-400" />
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400">Location</p>
                <p className="text-gray-900 dark:text-white">
                  {event.resource.location}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <Users className="w-5 h-5 text-gray-400" />
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400">Instructor</p>
                <p className="text-gray-900 dark:text-white">
                  {event.resource.instructor}
                </p>
              </div>
            </div>
          </div>

          {/* Capacity */}
          <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
            <h3 className="font-medium text-gray-900 dark:text-white mb-3">
              Capacity
            </h3>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-gray-600 dark:text-gray-400">Booked</span>
                <span className="font-medium text-gray-900 dark:text-white">
                  {event.resource.capacity.booked} / {event.resource.capacity.max}
                </span>
              </div>
              <div className="w-full bg-gray-200 dark:bg-gray-600 rounded-full h-2">
                <div
                  className={cn(
                    "h-2 rounded-full transition-all",
                    event.resource.capacity.status === 'available' && "bg-green-500",
                    event.resource.capacity.status === 'filling' && "bg-blue-500",
                    event.resource.capacity.status === 'nearly-full' && "bg-yellow-500",
                    event.resource.capacity.status === 'full' && "bg-red-500"
                  )}
                  style={{ width: `${event.resource.capacity.percentFull}%` }}
                />
              </div>
              {event.resource.stats.waitlist > 0 && (
                <p className="text-sm text-yellow-600 dark:text-yellow-400 mt-2">
                  {event.resource.stats.waitlist} on waitlist
                </p>
              )}
            </div>
          </div>

          {/* Stats */}
          <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
            <h3 className="font-medium text-gray-900 dark:text-white mb-3">
              Statistics
            </h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400">Revenue</p>
                <p className="text-lg font-semibold text-gray-900 dark:text-white">
                  £{event.resource.stats.revenue}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400">Bookings</p>
                <p className="text-lg font-semibold text-gray-900 dark:text-white">
                  {event.resource.stats.bookings}
                </p>
              </div>
            </div>
          </div>

          {/* Special Requirements */}
          {event.resource.stats.hasSpecialRequirements && (
            <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4">
              <div className="flex items-center gap-2">
                <AlertCircle className="w-5 h-5 text-yellow-600 dark:text-yellow-400" />
                <p className="text-sm text-yellow-800 dark:text-yellow-200">
                  Some attendees have special requirements
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex justify-end gap-3 p-6 border-t border-gray-200 dark:border-gray-700">
          <button
            onClick={onClose}
            className="btn btn-outline"
          >
            Close
          </button>
          <button
            onClick={() => {
              // Handle edit action
              console.log('Edit event:', event.id);
              onUpdate();
            }}
            className="btn btn-primary"
          >
            Edit Session
          </button>
        </div>
      </div>
    </div>
  );
};