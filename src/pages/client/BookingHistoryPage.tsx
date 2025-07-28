import React, { useState, useEffect, useCallback } from "react";
import { useParams } from "react-router-dom";
import { Search, Filter, Download, WifiOff } from "lucide-react";
import { ClientPortalLayout } from "@/components/client/shared/ClientPortalLayout";
import { BookingFilters } from "@/components/client/booking-history/BookingFilters";
import { BookingHistoryList } from "@/components/client/booking-history/BookingHistoryList";
import { BookingDetailModal } from "@/components/client/booking-history/BookingDetailModal";
import { LoadingState } from "@/components/client/shared/LoadingStates";
import { useBookingHistory } from "@/hooks/client/useBookingHistory";
import { usePageTracking, analytics } from "@/utils/client/analytics";
import { useOnlineStatus, usePersistedState } from "@/utils/client/persistence";
import { useVirtualScroll } from "@/utils/client/performance";
import { downloadRateLimiter } from "@/utils/client/security";
import type {
  BookingHistoryItem,
  BookingFilters as BookingFiltersType,
} from "@/types/client/booking.types";

export const BookingHistoryPage: React.FC = () => {
  const { id } = useParams<{ id?: string }>();
  const isOnline = useOnlineStatus();

  // Use enhanced booking history hook
  const {
    bookings,
    loading,
    error,
    pagination,
    filters,
    searchTerm,
    setSearchTerm,
    setFilters,
    setPage,
    refresh,
    exportToCSV,
  } = useBookingHistory({ pageSize: 20 });

  const [selectedBooking, setSelectedBooking] = useState<string | null>(
    id || null,
  );
  const [showFilters, setShowFilters] = usePersistedState(
    "booking-filters-visible",
    false,
    { storage: "session" },
  );
  const [exportLoading, setExportLoading] = useState(false);

  // Analytics
  usePageTracking();

  useEffect(() => {
    if (id) {
      setSelectedBooking(id);
      analytics.trackPageView("/client/booking-history", { bookingId: id });
    }
  }, [id]);

  // Track filter usage
  useEffect(() => {
    if (
      filters.status ||
      filters.courseType ||
      filters.startDate ||
      filters.endDate
    ) {
      analytics.trackUserAction(
        "Filter Applied",
        "Booking History",
        undefined,
        filters,
      );
    }
  }, [filters]);

  const handleExportHistory = async () => {
    // Rate limit check
    if (!downloadRateLimiter.check("export-history")) {
      analytics.trackError(new Error("Export rate limit exceeded"), {
        userId: "current",
      });
      alert("Please wait before exporting again.");
      return;
    }

    setExportLoading(true);
    analytics.trackUserAction("Export", "Booking History");

    try {
      await exportToCSV();
      analytics.trackUserAction(
        "Export Success",
        "Booking History",
        bookings.length,
      );
    } catch (error) {
      console.error("Failed to export history:", error);
      analytics.trackError(
        error instanceof Error ? error : new Error("Export failed"),
      );
      alert("Failed to export booking history. Please try again.");
    } finally {
      setExportLoading(false);
    }
  };

  const resetFilters = () => {
    setFilters({});
    setSearchTerm("");
    analytics.trackUserAction("Reset Filters", "Booking History");
  };

  const handlePageChange = (page: number) => {
    setPage(page);
    analytics.trackUserAction("Page Change", "Booking History", page);
  };

  return (
    <ClientPortalLayout>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        <div className="mb-6 sm:mb-8">
          <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white">
                Booking History
              </h1>
              <p className="mt-1 sm:mt-2 text-sm sm:text-base text-gray-600 dark:text-gray-400">
                View and manage all your past and upcoming bookings
              </p>
            </div>

            <button
              onClick={handleExportHistory}
              disabled={exportLoading}
              className="flex items-center gap-2 px-3 sm:px-4 py-2 text-sm bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed touch-target"
            >
              <Download className="w-4 h-4" />
              <span className="whitespace-nowrap">
                {exportLoading ? "Exporting..." : "Export CSV"}
              </span>
            </button>
          </div>
        </div>

        {/* Search and Filters */}
        <div className="mb-6 space-y-4">
          <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 sm:w-5 h-4 sm:h-5 text-gray-400" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search bookings..."
                className="w-full pl-9 sm:pl-10 pr-3 sm:pr-4 py-2 text-sm sm:text-base border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-500"
              />
            </div>

            <button
              onClick={() => setShowFilters(!showFilters)}
              className="flex items-center justify-center gap-2 px-3 sm:px-4 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 touch-target"
            >
              <Filter className="w-4 h-4" />
              <span>Filters</span>
              {(filters.status ||
                filters.courseType ||
                filters.startDate ||
                filters.endDate) && (
                <span className="ml-1 px-1.5 sm:px-2 py-0.5 bg-primary-100 dark:bg-primary-900 text-primary-700 dark:text-primary-300 text-xs rounded-full">
                  Active
                </span>
              )}
            </button>
          </div>

          {showFilters && (
            <BookingFilters
              filters={filters}
              onChange={setFilters}
              onReset={resetFilters}
            />
          )}
        </div>

        {/* Offline indicator */}
        {!isOnline && (
          <div className="mb-4 p-4 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg">
            <div className="flex items-center gap-2">
              <WifiOff className="w-5 h-5 text-yellow-600 dark:text-yellow-400" />
              <p className="text-yellow-800 dark:text-yellow-200">
                You're offline. Showing cached booking history.
              </p>
            </div>
          </div>
        )}

        {/* Booking List with enhanced loading states */}
        <LoadingState
          isLoading={loading && bookings.length === 0}
          error={error}
          isEmpty={!loading && bookings.length === 0}
          onRetry={refresh}
          emptyComponent={
            <div className="text-center py-12">
              <p className="text-gray-600 dark:text-gray-400 mb-4">
                No bookings found matching your criteria.
              </p>
              {(filters.status ||
                filters.courseType ||
                filters.startDate ||
                filters.endDate ||
                searchTerm) && (
                <button
                  onClick={resetFilters}
                  className="text-primary-600 hover:text-primary-700 underline"
                >
                  Clear all filters
                </button>
              )}
            </div>
          }
        >
          <BookingHistoryList
            bookings={bookings}
            loading={loading && bookings.length > 0}
            onSelectBooking={(bookingId) => {
              setSelectedBooking(bookingId);
              analytics.trackUserAction(
                "View Booking",
                "Booking History",
                undefined,
                { bookingId },
              );
            }}
            pagination={pagination}
            onPageChange={handlePageChange}
          />
        </LoadingState>

        {/* Booking Detail Modal */}
        {selectedBooking && (
          <BookingDetailModal
            bookingId={selectedBooking}
            isOpen={!!selectedBooking}
            onClose={() => setSelectedBooking(null)}
            onUpdate={loadBookings}
          />
        )}
      </div>
    </ClientPortalLayout>
  );
};

export default BookingHistoryPage;
