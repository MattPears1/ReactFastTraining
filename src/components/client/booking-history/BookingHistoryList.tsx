import React from "react";
import {
  Calendar,
  MapPin,
  Users,
  FileText,
  Award,
  XCircle,
} from "lucide-react";
import { format } from "date-fns";
import { BookingHistorySkeleton } from "./BookingHistorySkeleton";
import type { BookingHistoryItem, PaginationInfo } from "@/types/client";

interface BookingHistoryListProps {
  bookings: BookingHistoryItem[];
  loading: boolean;
  onSelectBooking: (bookingId: string) => void;
  pagination: Omit<PaginationInfo, "hasMore">;
  onPageChange: (offset: number) => void;
}

export const BookingHistoryList: React.FC<BookingHistoryListProps> = ({
  bookings,
  loading,
  onSelectBooking,
  pagination,
  onPageChange,
}) => {
  const getStatusBadge = (booking: BookingHistoryItem) => {
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

  if (loading && bookings.length === 0) {
    return <BookingHistorySkeleton />;
  }

  if (!loading && bookings.length === 0) {
    return (
      <div className="text-center py-12">
        <FileText className="w-12 h-12 text-gray-400 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-gray-900 dark:text-white">
          No bookings found
        </h3>
        <p className="mt-2 text-gray-600 dark:text-gray-400">
          Adjust your filters or search term to see results
        </p>
      </div>
    );
  }

  const totalPages = Math.ceil(pagination.total / pagination.limit);
  const currentPage = Math.floor(pagination.offset / pagination.limit) + 1;

  return (
    <div className="space-y-4">
      {bookings.map((booking) => {
        const status = getStatusBadge(booking);
        const StatusIcon = status.icon;

        return (
          <div
            key={booking.booking.id}
            onClick={() => onSelectBooking(booking.booking.id)}
            className="bg-white dark:bg-gray-800 rounded-lg shadow hover:shadow-lg transition-shadow cursor-pointer p-4 sm:p-6"
          >
            <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
              <div className="flex-1">
                <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3 mb-3">
                  <h3 className="text-base sm:text-lg font-semibold text-gray-900 dark:text-white">
                    {booking.session.courseType}
                  </h3>
                  <span
                    className={`px-2 sm:px-3 py-0.5 sm:py-1 rounded-full text-xs font-medium flex items-center gap-1 self-start ${status.className}`}
                  >
                    <StatusIcon className="w-3 h-3" />
                    {status.label}
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-3 text-xs sm:text-sm text-gray-600 dark:text-gray-400">
                  <div className="flex items-center gap-2">
                    <Calendar className="w-4 h-4" />
                    <span>
                      {format(
                        new Date(booking.session.sessionDate),
                        "dd MMM yyyy",
                      )}
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    <MapPin className="w-4 h-4" />
                    <span>{booking.session.location}</span>
                  </div>

                  <div className="flex items-center gap-2">
                    <Users className="w-4 h-4" />
                    <span>
                      {booking.attendeeCount} attendee
                      {booking.attendeeCount !== 1 ? "s" : ""}
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    <FileText className="w-4 h-4" />
                    <span className="font-mono">
                      {booking.booking.bookingReference}
                    </span>
                  </div>
                </div>

                <div className="mt-3 flex flex-wrap items-center gap-2 sm:gap-4">
                  {booking.payment && (
                    <span className="text-xs sm:text-sm text-gray-500">
                      Paid: £{booking.payment.amount}
                    </span>
                  )}

                  {booking.certificateAvailable && (
                    <span className="text-xs sm:text-sm text-green-600 dark:text-green-400 flex items-center gap-1">
                      <Award className="w-3 h-3 sm:w-4 sm:h-4" />
                      Certificate Available
                    </span>
                  )}

                  {booking.hasSpecialRequirements && (
                    <span className="text-xs sm:text-sm text-yellow-600 dark:text-yellow-400">
                      Special Requirements
                    </span>
                  )}
                </div>
              </div>

              <div className="hidden sm:block ml-4 text-gray-400">
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
      })}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-4">
          <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400 text-center sm:text-left">
            Showing {pagination.offset + 1} to{" "}
            {Math.min(pagination.offset + pagination.limit, pagination.total)}{" "}
            of {pagination.total} bookings
          </p>

          <div className="flex gap-2">
            <button
              onClick={() =>
                onPageChange(Math.max(0, pagination.offset - pagination.limit))
              }
              disabled={currentPage === 1}
              className="px-2 sm:px-3 py-1 text-sm border border-gray-300 dark:border-gray-600 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 dark:hover:bg-gray-700 touch-target-sm"
            >
              Previous
            </button>

            <span className="px-2 sm:px-3 py-1 text-sm text-gray-700 dark:text-gray-300">
              Page {currentPage} of {totalPages}
            </span>

            <button
              onClick={() => onPageChange(pagination.offset + pagination.limit)}
              disabled={currentPage === totalPages}
              className="px-2 sm:px-3 py-1 text-sm border border-gray-300 dark:border-gray-600 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 dark:hover:bg-gray-700 touch-target-sm"
            >
              Next
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
