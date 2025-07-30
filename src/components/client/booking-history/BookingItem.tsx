import React, { memo } from "react";
import {
  Calendar,
  MapPin,
  Users,
  FileText,
  Award,
  XCircle,
} from "lucide-react";
import { format } from "date-fns";
import type { BookingHistoryItem } from "@/types/client";

interface BookingItemProps {
  booking: BookingHistoryItem;
  onSelect: (bookingId: string) => void;
}

const BookingItemComponent: React.FC<BookingItemProps> = ({
  booking,
  onSelect,
}) => {
  const getStatusBadge = () => {
    const now = new Date();
    const sessionDate = new Date(booking.session.sessionDate);

    if (booking.booking.status === "cancelled") {
      return {
        label: "Cancelled",
        className:
          "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400",
        icon: XCircle,
      };
    }

    if (booking.refund && booking.refund.status === "processed") {
      return {
        label: "Refunded",
        className:
          "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-400",
        icon: XCircle,
      };
    }

    if (booking.session.status === "completed") {
      return {
        label: "Completed",
        className:
          "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400",
        icon: Award,
      };
    }

    if (sessionDate > now) {
      return {
        label: "Upcoming",
        className:
          "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400",
        icon: Calendar,
      };
    }

    return {
      label: "Past",
      className:
        "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-400",
      icon: Calendar,
    };
  };

  const status = getStatusBadge();
  const StatusIcon = status.icon;

  return (
    <div
      onClick={() => onSelect(booking.booking.id)}
      className="bg-white dark:bg-gray-800 rounded-lg shadow hover:shadow-lg transition-shadow cursor-pointer p-6 focus-within:ring-2 focus-within:ring-primary-500"
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          onSelect(booking.booking.id);
        }
      }}
      aria-label={`View details for ${booking.session.courseType} on ${format(new Date(booking.session.sessionDate), "dd MMM yyyy")}`}
    >
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <div className="flex items-center gap-3 mb-2">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              {booking.session.courseType}
            </h3>
            <span
              className={`px-3 py-1 rounded-full text-xs font-medium flex items-center gap-1 ${status.className}`}
            >
              <StatusIcon className="w-3 h-3" aria-hidden="true" />
              {status.label}
            </span>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm text-gray-600 dark:text-gray-400">
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4" aria-hidden="true" />
              <span>
                {format(new Date(booking.session.sessionDate), "dd MMM yyyy")}
              </span>
            </div>

            <div className="flex items-center gap-2">
              <MapPin className="w-4 h-4" aria-hidden="true" />
              <span>{booking.session.location}</span>
            </div>

            <div className="flex items-center gap-2">
              <Users className="w-4 h-4" aria-hidden="true" />
              <span>
                {booking.attendeeCount} attendee
                {booking.attendeeCount !== 1 ? "s" : ""}
              </span>
            </div>

            <div className="flex items-center gap-2">
              <FileText className="w-4 h-4" aria-hidden="true" />
              <span className="font-mono">
                {booking.booking.bookingReference}
              </span>
            </div>
          </div>

          <div className="mt-3 flex items-center gap-4">
            {booking.payment && (
              <span className="text-sm text-gray-500">
                Paid: £{booking.payment.amount}
              </span>
            )}

            {booking.certificateAvailable && (
              <span className="text-sm text-green-600 dark:text-green-400 flex items-center gap-1">
                <Award className="w-4 h-4" aria-hidden="true" />
                Certificate Available
              </span>
            )}

            {booking.hasSpecialRequirements && (
              <span className="text-sm text-yellow-600 dark:text-yellow-400">
                Special Requirements
              </span>
            )}
          </div>
        </div>

        <div className="ml-4 text-gray-400" aria-hidden="true">
          <svg
            className="w-5 h-5"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M9 5l7 7-7 7"
            />
          </svg>
        </div>
      </div>
    </div>
  );
};

export const BookingItem = memo(
  BookingItemComponent,
  (prevProps, nextProps) => {
    return (
      prevProps.booking.booking.id === nextProps.booking.booking.id &&
      prevProps.booking.booking.status === nextProps.booking.booking.status &&
      prevProps.booking.session.status === nextProps.booking.session.status &&
      prevProps.booking.certificateAvailable ===
        nextProps.booking.certificateAvailable
    );
  },
);
