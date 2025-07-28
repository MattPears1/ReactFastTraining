import React, { useState } from "react";
import moment from "moment";
import { Clock, MapPin, CalendarIcon, Users, AlertCircle } from "lucide-react";
import { CalendarEvent } from "../types";
import { useToast } from "@contexts/ToastContext";
import { cn } from "@utils/cn";

interface SessionDetailModalProps {
  event: CalendarEvent;
  onClose: () => void;
  onUpdate: () => void;
}

export const SessionDetailModal: React.FC<SessionDetailModalProps> = ({
  event,
  onClose,
  onUpdate,
}) => {
  const { showToast } = useToast();
  const [activeTab, setActiveTab] = useState<
    "details" | "bookings" | "actions"
  >("details");

  const handleCancelSession = async () => {
    if (
      !confirm(
        "Are you sure you want to cancel this session? All attendees will be notified.",
      )
    ) {
      return;
    }

    try {
      // API call to cancel session
      showToast("Session cancelled successfully", "success");
      onUpdate();
      onClose();
    } catch (error) {
      showToast("Failed to cancel session", "error");
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-lg max-w-2xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
          <div>
            <h2 className="text-xl font-bold text-gray-900 dark:text-white">
              {event.title}
            </h2>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
              {moment(event.start).format("dddd, MMMM D, YYYY")}
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg"
          >
            ×
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-gray-200 dark:border-gray-700">
          <button
            onClick={() => setActiveTab("details")}
            className={cn(
              "px-6 py-3 font-medium text-sm",
              activeTab === "details"
                ? "text-primary-600 border-b-2 border-primary-600"
                : "text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200",
            )}
          >
            Session Details
          </button>
          <button
            onClick={() => setActiveTab("bookings")}
            className={cn(
              "px-6 py-3 font-medium text-sm",
              activeTab === "bookings"
                ? "text-primary-600 border-b-2 border-primary-600"
                : "text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200",
            )}
          >
            Bookings ({event.resource.stats.bookings})
          </button>
          <button
            onClick={() => setActiveTab("actions")}
            className={cn(
              "px-6 py-3 font-medium text-sm",
              activeTab === "actions"
                ? "text-primary-600 border-b-2 border-primary-600"
                : "text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200",
            )}
          >
            Actions
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {activeTab === "details" && (
            <div className="space-y-6">
              {/* Time and Location */}
              <div className="grid grid-cols-2 gap-6">
                <div>
                  <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-2">
                    Time
                  </h3>
                  <div className="flex items-center gap-2">
                    <Clock className="w-5 h-5 text-gray-400" />
                    <span className="text-gray-900 dark:text-white">
                      {moment(event.start).format("h:mm A")} -{" "}
                      {moment(event.end).format("h:mm A")}
                    </span>
                  </div>
                </div>

                <div>
                  <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-2">
                    Location
                  </h3>
                  <div className="flex items-center gap-2">
                    <MapPin className="w-5 h-5 text-gray-400" />
                    <span className="text-gray-900 dark:text-white">
                      {event.resource.location}
                    </span>
                  </div>
                </div>
              </div>

              {/* Capacity */}
              <div>
                <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-3">
                  Capacity
                </h3>
                <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-4">
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-gray-600 dark:text-gray-400">
                        Total Capacity
                      </span>
                      <span className="font-semibold text-gray-900 dark:text-white">
                        {event.resource.capacity.max}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-gray-600 dark:text-gray-400">
                        Booked
                      </span>
                      <span className="font-semibold text-gray-900 dark:text-white">
                        {event.resource.capacity.booked}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-gray-600 dark:text-gray-400">
                        Available
                      </span>
                      <span className="font-semibold text-green-600">
                        {event.resource.capacity.available}
                      </span>
                    </div>
                  </div>

                  {/* Progress bar */}
                  <div className="mt-4">
                    <div className="w-full bg-gray-200 dark:bg-gray-600 rounded-full h-2">
                      <div
                        className={cn(
                          "h-2 rounded-full transition-all",
                          event.resource.capacity.percentFull >= 100
                            ? "bg-red-500"
                            : event.resource.capacity.percentFull >= 75
                              ? "bg-amber-500"
                              : event.resource.capacity.percentFull >= 50
                                ? "bg-blue-500"
                                : "bg-green-500",
                        )}
                        style={{
                          width: `${Math.min(100, event.resource.capacity.percentFull)}%`,
                        }}
                      />
                    </div>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">
                      {event.resource.capacity.percentFull.toFixed(0)}% full
                    </p>
                  </div>
                </div>
              </div>

              {/* Financial Summary */}
              <div>
                <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-3">
                  Financial Summary
                </h3>
                <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-4">
                  <div className="flex items-center justify-between">
                    <span className="text-gray-600 dark:text-gray-400">
                      Total Revenue
                    </span>
                    <span className="font-semibold text-lg text-gray-900 dark:text-white">
                      £{event.resource.stats.revenue.toFixed(2)}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === "bookings" && (
            <div className="text-center py-8 text-gray-500 dark:text-gray-400">
              Booking list would be displayed here
            </div>
          )}

          {activeTab === "actions" && (
            <div className="space-y-4">
              <button className="w-full flex items-center gap-3 px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700">
                <CalendarIcon className="w-5 h-5" />
                <div className="text-left">
                  <p className="font-medium text-gray-900 dark:text-white">
                    Edit Session
                  </p>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Change time, location, or capacity
                  </p>
                </div>
              </button>

              <button className="w-full flex items-center gap-3 px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700">
                <Users className="w-5 h-5" />
                <div className="text-left">
                  <p className="font-medium text-gray-900 dark:text-white">
                    Email Attendees
                  </p>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Send message to all confirmed bookings
                  </p>
                </div>
              </button>

              <button
                onClick={handleCancelSession}
                className="w-full flex items-center gap-3 px-4 py-3 border border-red-300 dark:border-red-700 text-red-600 dark:text-red-400 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20"
              >
                <AlertCircle className="w-5 h-5" />
                <div className="text-left">
                  <p className="font-medium">Cancel Session</p>
                  <p className="text-sm">
                    Notify all attendees and process refunds
                  </p>
                </div>
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
