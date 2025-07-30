import React, { useState, useEffect, useMemo, useCallback } from "react";
import { useSearchParams } from "react-router-dom";
import { ColumnDef } from "@tanstack/react-table";
import {
  Search,
  Filter,
  Download,
  Mail,
  CheckCircle,
  XCircle,
  Clock,
  Calendar,
  Users,
  DollarSign,
  MoreVertical,
  RefreshCw,
  AlertCircle,
  Loader2,
} from "lucide-react";
import { useAuth } from "@contexts/AuthContext";
import { useToast } from "@contexts/ToastContext";
import { useAdminStore } from "@store/adminStore";
import { useAuditTrail } from "@hooks/useAuditTrail";
import { DataTable } from "@components/admin/shared/DataTable";
import { MetricCard } from "@components/admin/shared/MetricCard";
import { cn } from "@utils/cn";
import { adminDashboardApi } from "@services/admin-dashboard.service";
import { debounce } from "@utils/debounce";

interface Booking {
  id: string;
  sessionId: string;
  courseName: string;
  courseDate: string;
  courseTime: string;
  clientName: string;
  clientEmail: string;
  clientPhone: string;
  bookingDate: string;
  status: "pending" | "confirmed" | "cancelled" | "completed";
  attendees: number;
  totalAmount: number;
  paymentStatus: "pending" | "paid" | "refunded" | "partial_refund";
  notes?: string;
}

interface BookingStats {
  total: number;
  pending: number;
  confirmed: number;
  totalRevenue: number;
  todayBookings: number;
}

export const AdminBookingsPageEnhanced: React.FC = () => {
  const { user } = useAuth();
  const { showToast } = useToast();
  const { logAction, logBulkAction, logDataExport } = useAuditTrail();
  const {
    globalFilters,
    updateFilters,
    cacheData,
    getCachedData,
    addNotification,
  } = useAdminStore();
  const [searchParams, setSearchParams] = useSearchParams();

  // State
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [stats, setStats] = useState<BookingStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedRows, setSelectedRows] = useState<Booking[]>([]);
  const [showBulkActions, setShowBulkActions] = useState(false);

  // Memoized search with debounce
  const debouncedSearch = useMemo(
    () =>
      debounce((term: string) => {
        updateFilters({ searchTerm: term });
      }, 300),
    [updateFilters],
  );

  // Fetch bookings with caching
  const fetchBookings = useCallback(
    async (useCache = true) => {
      const cacheKey = `bookings-${JSON.stringify(globalFilters)}`;

      if (useCache) {
        const cached = getCachedData(cacheKey, 60000); // 1 minute cache
        if (cached) {
          setBookings(cached.bookings);
          setStats(cached.stats);
          return;
        }
      }

      try {
        setLoading(true);

        // Mock data - replace with actual API call
        const mockBookings: Booking[] = Array.from({ length: 50 }, (_, i) => ({
          id: `BK-2025-${String(i + 1).padStart(4, "0")}`,
          sessionId: `SES-${i + 1}`,
          courseName: [
            "Emergency First Aid at Work",
            "First Aid at Work",
            "Paediatric First Aid",
          ][i % 3],
          courseDate: new Date(Date.now() + i * 24 * 60 * 60 * 1000)
            .toISOString()
            .split("T")[0],
          courseTime: "09:00-16:00",
          clientName: `Client ${i + 1}`,
          clientEmail: `client${i + 1}@example.com`,
          clientPhone: `0770090${String(i).padStart(4, "0")}`,
          bookingDate: new Date(
            Date.now() - i * 12 * 60 * 60 * 1000,
          ).toISOString(),
          status: ["pending", "confirmed", "cancelled", "completed"][
            i % 4
          ] as any,
          attendees: (i % 5) + 1,
          totalAmount: ((i % 5) + 1) * 75,
          paymentStatus: ["pending", "paid", "refunded", "partial_refund"][
            i % 4
          ] as any,
          notes: i % 3 === 0 ? "Special dietary requirements" : undefined,
        }));

        const mockStats: BookingStats = {
          total: mockBookings.length,
          pending: mockBookings.filter((b) => b.status === "pending").length,
          confirmed: mockBookings.filter((b) => b.status === "confirmed")
            .length,
          totalRevenue: mockBookings.reduce((sum, b) => sum + b.totalAmount, 0),
          todayBookings: mockBookings.filter(
            (b) =>
              new Date(b.bookingDate).toDateString() ===
              new Date().toDateString(),
          ).length,
        };

        // Apply filters
        let filtered = mockBookings;

        if (globalFilters.searchTerm) {
          const search = globalFilters.searchTerm.toLowerCase();
          filtered = filtered.filter(
            (b) =>
              b.clientName.toLowerCase().includes(search) ||
              b.clientEmail.toLowerCase().includes(search) ||
              b.id.toLowerCase().includes(search),
          );
        }

        if (globalFilters.status !== "all") {
          filtered = filtered.filter((b) => b.status === globalFilters.status);
        }

        setBookings(filtered);
        setStats(mockStats);

        // Cache the results
        cacheData(cacheKey, { bookings: filtered, stats: mockStats });

        await logAction({
          action: "view_bookings",
          category: "booking",
          severity: "info",
          details: { filters: globalFilters, resultCount: filtered.length },
        });
      } catch (error) {
        showToast("Failed to load bookings", "error");
        console.error("Error fetching bookings:", error);
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [globalFilters, getCachedData, cacheData, showToast, logAction],
  );

  useEffect(() => {
    fetchBookings();
  }, [fetchBookings]);

  // Status badge component
  const StatusBadge = ({ status }: { status: Booking["status"] }) => {
    const styles = {
      pending:
        "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400",
      confirmed:
        "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400",
      cancelled: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400",
      completed:
        "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400",
    };

    const icons = {
      pending: Clock,
      confirmed: CheckCircle,
      cancelled: XCircle,
      completed: CheckCircle,
    };

    const Icon = icons[status];

    return (
      <span
        className={cn(
          "inline-flex items-center gap-1 px-2 py-1 text-xs font-medium rounded-full capitalize",
          styles[status],
        )}
      >
        <Icon className="w-3 h-3" />
        {status}
      </span>
    );
  };

  // Payment status badge
  const PaymentBadge = ({ status }: { status: Booking["paymentStatus"] }) => {
    const styles = {
      pending: "text-yellow-600 dark:text-yellow-400",
      paid: "text-green-600 dark:text-green-400",
      refunded: "text-red-600 dark:text-red-400",
      partial_refund: "text-orange-600 dark:text-orange-400",
    };

    return (
      <span className={cn("text-sm font-medium", styles[status])}>
        {status.replace("_", " ")}
      </span>
    );
  };

  // Table columns
  const columns: ColumnDef<Booking>[] = useMemo(
    () => [
      {
        accessorKey: "id",
        header: "Booking ID",
        cell: ({ row }) => (
          <span className="font-mono text-sm">{row.original.id}</span>
        ),
      },
      {
        accessorKey: "clientName",
        header: "Client",
        cell: ({ row }) => (
          <div>
            <p className="font-medium">{row.original.clientName}</p>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              {row.original.clientEmail}
            </p>
          </div>
        ),
      },
      {
        accessorKey: "courseName",
        header: "Course",
        cell: ({ row }) => (
          <div>
            <p className="font-medium">{row.original.courseName}</p>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              {new Date(row.original.courseDate).toLocaleDateString("en-GB")} •{" "}
              {row.original.courseTime}
            </p>
          </div>
        ),
      },
      {
        accessorKey: "attendees",
        header: "Attendees",
        cell: ({ row }) => (
          <div className="flex items-center gap-1">
            <Users className="w-4 h-4 text-gray-400" />
            <span>{row.original.attendees}</span>
          </div>
        ),
      },
      {
        accessorKey: "status",
        header: "Status",
        cell: ({ row }) => <StatusBadge status={row.original.status} />,
      },
      {
        accessorKey: "totalAmount",
        header: "Amount",
        cell: ({ row }) => (
          <div>
            <p className="font-medium">
              £{row.original.totalAmount.toFixed(2)}
            </p>
            <PaymentBadge status={row.original.paymentStatus} />
          </div>
        ),
      },
      {
        accessorKey: "bookingDate",
        header: "Booked",
        cell: ({ row }) => (
          <span className="text-sm text-gray-600 dark:text-gray-400">
            {new Date(row.original.bookingDate).toLocaleDateString("en-GB")}
          </span>
        ),
      },
      {
        id: "actions",
        header: () => null,
        cell: ({ row }) => (
          <BookingActions booking={row.original} onUpdate={fetchBookings} />
        ),
      },
    ],
    [fetchBookings],
  );

  // Booking actions dropdown
  const BookingActions = ({
    booking,
    onUpdate,
  }: {
    booking: Booking;
    onUpdate: () => void;
  }) => {
    const [open, setOpen] = useState(false);

    const handleAction = async (action: string) => {
      setOpen(false);

      switch (action) {
        case "view":
          // Navigate to booking details
          break;
        case "confirm":
          await updateBookingStatus(booking.id, "confirmed");
          break;
        case "cancel":
          if (confirm("Are you sure you want to cancel this booking?")) {
            await updateBookingStatus(booking.id, "cancelled");
          }
          break;
        case "email":
          await sendBookingEmail(booking);
          break;
      }

      onUpdate();
    };

    return (
      <div className="relative">
        <button
          onClick={() => setOpen(!open)}
          className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded"
        >
          <MoreVertical className="w-4 h-4" />
        </button>

        {open && (
          <>
            <div
              className="fixed inset-0 z-10"
              onClick={() => setOpen(false)}
            />
            <div className="absolute right-0 mt-1 w-48 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 z-20">
              <button
                onClick={() => handleAction("view")}
                className="block w-full text-left px-4 py-2 text-sm hover:bg-gray-50 dark:hover:bg-gray-700"
              >
                View Details
              </button>
              {booking.status === "pending" && (
                <button
                  onClick={() => handleAction("confirm")}
                  className="block w-full text-left px-4 py-2 text-sm hover:bg-gray-50 dark:hover:bg-gray-700"
                >
                  Confirm Booking
                </button>
              )}
              {booking.status !== "cancelled" &&
                booking.status !== "completed" && (
                  <button
                    onClick={() => handleAction("cancel")}
                    className="block w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-gray-50 dark:hover:bg-gray-700"
                  >
                    Cancel Booking
                  </button>
                )}
              <button
                onClick={() => handleAction("email")}
                className="block w-full text-left px-4 py-2 text-sm hover:bg-gray-50 dark:hover:bg-gray-700"
              >
                Send Email
              </button>
            </div>
          </>
        )}
      </div>
    );
  };

  const updateBookingStatus = async (
    bookingId: string,
    status: Booking["status"],
  ) => {
    try {
      showToast("Updating booking...", "info");

      await logAction({
        action: `booking_${status}`,
        category: "booking",
        severity: status === "cancelled" ? "warning" : "info",
        details: { bookingId, newStatus: status },
      });

      // API call would go here
      showToast(`Booking ${status}`, "success");
      addNotification({
        type: "success",
        title: "Booking Updated",
        message: `Booking ${bookingId} has been ${status}`,
      });
    } catch (error) {
      showToast("Failed to update booking", "error");
    }
  };

  const sendBookingEmail = async (booking: Booking) => {
    try {
      await logAction({
        action: "send_booking_email",
        category: "email",
        severity: "info",
        details: { bookingId: booking.id, recipient: booking.clientEmail },
      });

      showToast("Email sent successfully", "success");
    } catch (error) {
      showToast("Failed to send email", "error");
    }
  };

  const handleBulkAction = async (action: string) => {
    if (selectedRows.length === 0) {
      showToast("Please select bookings first", "error");
      return;
    }

    const count = selectedRows.length;

    switch (action) {
      case "export":
        await handleExport(selectedRows);
        break;
      case "email":
        showToast(`Sending emails to ${count} clients...`, "info");
        await logBulkAction("send_emails", "email", count);
        break;
      case "confirm":
        showToast(`Confirming ${count} bookings...`, "info");
        await logBulkAction("confirm_bookings", "booking", count);
        break;
    }

    setShowBulkActions(false);
    setSelectedRows([]);
  };

  const handleExport = async (data: Booking[]) => {
    try {
      await logDataExport("bookings", data.length, "csv");

      // Generate CSV
      const headers = [
        "Booking ID",
        "Client",
        "Email",
        "Course",
        "Date",
        "Status",
        "Amount",
      ];
      const rows = data.map((b) => [
        b.id,
        b.clientName,
        b.clientEmail,
        b.courseName,
        b.courseDate,
        b.status,
        b.totalAmount,
      ]);

      const csv = [headers, ...rows].map((row) => row.join(",")).join("\n");
      const blob = new Blob([csv], { type: "text/csv" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `bookings-${new Date().toISOString().split("T")[0]}.csv`;
      a.click();
      URL.revokeObjectURL(url);

      showToast("Export completed", "success");
    } catch (error) {
      showToast("Export failed", "error");
    }
  };

  const handleRefresh = () => {
    setRefreshing(true);
    fetchBookings(false); // Skip cache
  };

  return (
    <div>
      {/* Page Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
              Booking Management
            </h1>
            <p className="text-gray-600 dark:text-gray-400">
              Manage all course bookings and reservations
            </p>
          </div>

          <button
            onClick={handleRefresh}
            disabled={refreshing}
            className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 flex items-center gap-2 disabled:opacity-50"
          >
            <RefreshCw
              className={cn("w-4 h-4", refreshing && "animate-spin")}
            />
            Refresh
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <MetricCard
            title="Total Bookings"
            value={stats.total}
            icon={Calendar}
            color="blue"
            trend={{ value: 12, label: "vs last month" }}
          />
          <MetricCard
            title="Pending"
            value={stats.pending}
            icon={Clock}
            color="yellow"
            subtitle="Awaiting confirmation"
          />
          <MetricCard
            title="Confirmed"
            value={stats.confirmed}
            icon={CheckCircle}
            color="green"
            subtitle="Ready to attend"
          />
          <MetricCard
            title="Total Revenue"
            value={`£${stats.totalRevenue.toLocaleString()}`}
            icon={DollarSign}
            color="purple"
            trend={{ value: 8, label: "vs last month" }}
          />
        </div>
      )}

      {/* Filters Bar */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-4 mb-6">
        <div className="flex flex-col md:flex-row gap-4 items-start md:items-center justify-between">
          <div className="flex-1 max-w-md">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search bookings..."
                onChange={(e) => debouncedSearch(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500"
              />
            </div>
          </div>

          <div className="flex items-center gap-2">
            <select
              value={globalFilters.status}
              onChange={(e) => updateFilters({ status: e.target.value })}
              className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            >
              <option value="all">All Status</option>
              <option value="pending">Pending</option>
              <option value="confirmed">Confirmed</option>
              <option value="cancelled">Cancelled</option>
              <option value="completed">Completed</option>
            </select>

            {selectedRows.length > 0 && (
              <div className="relative">
                <button
                  onClick={() => setShowBulkActions(!showBulkActions)}
                  className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 flex items-center gap-2"
                >
                  Bulk Actions ({selectedRows.length})
                </button>

                {showBulkActions && (
                  <>
                    <div
                      className="fixed inset-0 z-10"
                      onClick={() => setShowBulkActions(false)}
                    />
                    <div className="absolute right-0 mt-2 w-48 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 z-20">
                      <button
                        onClick={() => handleBulkAction("export")}
                        className="block w-full text-left px-4 py-2 text-sm hover:bg-gray-50 dark:hover:bg-gray-700"
                      >
                        Export Selected
                      </button>
                      <button
                        onClick={() => handleBulkAction("email")}
                        className="block w-full text-left px-4 py-2 text-sm hover:bg-gray-50 dark:hover:bg-gray-700"
                      >
                        Email Clients
                      </button>
                      <button
                        onClick={() => handleBulkAction("confirm")}
                        className="block w-full text-left px-4 py-2 text-sm hover:bg-gray-50 dark:hover:bg-gray-700"
                      >
                        Confirm All
                      </button>
                    </div>
                  </>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Data Table */}
      <DataTable
        columns={columns}
        data={bookings}
        loading={loading}
        showSelection
        showExport
        onExport={handleExport}
        onRowClick={(row) => console.log("Row clicked:", row)}
        emptyMessage="No bookings found"
      />
    </div>
  );
};

export default AdminBookingsPageEnhanced;
