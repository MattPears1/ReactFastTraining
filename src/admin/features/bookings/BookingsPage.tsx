import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Search,
  Filter,
  Calendar,
  Mail,
  Eye,
  Edit3,
  Trash2,
  Download,
  CheckCircle,
  XCircle,
  Clock,
  CreditCard,
  Users,
  MapPin,
  Phone,
  Building,
} from "lucide-react";
import { format, parseISO } from "date-fns";
import { AdminCard } from "../../components/ui/AdminCard";
import { AdminBadge } from "../../components/ui/AdminBadge";
import { LoadingSpinner } from "../../components/common/LoadingSpinner";
import { AdminEmptyState } from "../../components/ui/AdminEmptyState";
import { BookingDetailsModal } from "./components/BookingDetailsModal";
import { CalendarView } from "./components/CalendarView";
import type { Booking, BookingFilters } from "../../../types/booking";
import { adminApi } from "../../utils/api";
import "../../styles/admin-design-system.css";

export const BookingsPage: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [paymentFilter, setPaymentFilter] = useState<string>("all");
  const [viewMode, setViewMode] = useState<"list" | "calendar">("list");
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);

  const queryClient = useQueryClient();

  // Fetch bookings
  const {
    data: bookings,
    isLoading,
    error,
  } = useQuery({
    queryKey: ["admin-bookings", searchTerm, statusFilter, paymentFilter],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (searchTerm) params.append("search", searchTerm);
      if (statusFilter !== "all") params.append("status", statusFilter);
      if (paymentFilter !== "all")
        params.append("paymentStatus", paymentFilter);

      const response = await adminApi.get(`/api/admin/bookings?${params}`);
      if (!response.ok) throw new Error("Failed to fetch bookings");
      return response.json() as Promise<Booking[]>;
    },
    staleTime: 5 * 60 * 1000,
  });

  // Update booking mutation
  const updateMutation = useMutation({
    mutationFn: async ({
      id,
      data,
    }: {
      id: string;
      data: Partial<Booking>;
    }) => {
      const response = await adminApi.put(`/api/admin/bookings/${id}`, data);
      if (!response.ok) throw new Error("Failed to update booking");
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-bookings"] });
      setShowDetailsModal(false);
    },
  });

  // Delete booking mutation
  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const response = await adminApi.delete(`/api/admin/bookings/${id}`);
      if (!response.ok) throw new Error("Failed to delete booking");
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-bookings"] });
    },
  });

  const handleDelete = (id: string) => {
    if (window.confirm("Are you sure you want to delete this booking?")) {
      deleteMutation.mutate(id);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "confirmed":
        return <CheckCircle className="admin-icon-sm text-green-500" />;
      case "pending":
        return <Clock className="admin-icon-sm text-yellow-500" />;
      case "cancelled":
        return <XCircle className="admin-icon-sm text-red-500" />;
      case "completed":
        return <CheckCircle className="admin-icon-sm text-blue-500" />;
      default:
        return null;
    }
  };

  const getStatusVariant = (
    status: string,
  ): "success" | "warning" | "error" | "neutral" => {
    switch (status) {
      case "confirmed":
      case "completed":
        return "success";
      case "pending":
        return "warning";
      case "cancelled":
        return "error";
      default:
        return "neutral";
    }
  };

  const getPaymentVariant = (
    status: string,
  ): "success" | "warning" | "error" => {
    switch (status) {
      case "paid":
        return "success";
      case "pending":
        return "warning";
      case "refunded":
        return "error";
      default:
        return "warning";
    }
  };

  if (isLoading) {
    return (
      <div className="admin-loading-container">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (error) {
    return (
      <AdminCard className="admin-mt-8">
        <div className="text-center">
          <p className="text-red-600 font-medium">Failed to load bookings</p>
          <p className="admin-text-small admin-text-muted admin-mt-2">
            Please try refreshing the page
          </p>
        </div>
      </AdminCard>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="admin-page-header admin-fade-in">
        <div className="sm:flex sm:items-center sm:justify-between">
          <div>
            <h1 className="admin-page-title">Booking Management</h1>
            <p className="admin-page-subtitle">
              Manage course bookings, payments, and customer communications
            </p>
          </div>
          <div className="mt-4 sm:mt-0 flex gap-2">
            <button
              onClick={() => setViewMode("list")}
              className={`admin-btn ${viewMode === "list" ? "admin-btn-primary" : "admin-btn-secondary"}`}
            >
              List View
            </button>
            <button
              onClick={() => setViewMode("calendar")}
              className={`admin-btn ${viewMode === "calendar" ? "admin-btn-primary" : "admin-btn-secondary"}`}
            >
              <Calendar className="admin-icon-sm" />
              Calendar
            </button>
          </div>
        </div>
      </div>

      {viewMode === "list" ? (
        <>
          {/* Filters */}
          <AdminCard>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div>
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Search bookings..."
                  className="admin-input"
                />
              </div>
              <div>
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="admin-select"
                >
                  <option value="all">All Status</option>
                  <option value="pending">Pending</option>
                  <option value="confirmed">Confirmed</option>
                  <option value="cancelled">Cancelled</option>
                  <option value="completed">Completed</option>
                </select>
              </div>
              <div>
                <select
                  value={paymentFilter}
                  onChange={(e) => setPaymentFilter(e.target.value)}
                  className="admin-select"
                >
                  <option value="all">All Payments</option>
                  <option value="pending">Payment Pending</option>
                  <option value="paid">Paid</option>
                  <option value="refunded">Refunded</option>
                </select>
              </div>
              <div className="flex justify-end">
                <button className="admin-btn admin-btn-secondary">
                  <Download className="admin-icon-sm" />
                  Export
                </button>
              </div>
            </div>
          </AdminCard>

          {/* Bookings Table */}
          <AdminCard>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Booking Ref
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Customer
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Course
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Date & Time
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Payment
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Amount
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {bookings?.map((booking) => (
                    <tr key={booking.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">
                          {booking.bookingReference}
                        </div>
                        <div className="text-sm text-gray-500">
                          {format(parseISO(booking.bookingDate), "dd MMM yyyy")}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">
                          {booking.customerName}
                        </div>
                        <div className="text-sm text-gray-500">
                          {booking.customerEmail}
                        </div>
                        {booking.companyName && (
                          <div className="text-sm text-gray-500">
                            {booking.companyName}
                          </div>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm font-medium text-gray-900">
                          {booking.courseName}
                        </div>
                        <div className="text-sm text-gray-500">
                          <Users className="inline-block w-3 h-3 mr-1" />
                          {booking.attendees}{" "}
                          {booking.attendees === 1 ? "attendee" : "attendees"}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">
                          {format(parseISO(booking.courseDate), "dd MMM yyyy")}
                        </div>
                        <div className="text-sm text-gray-500">
                          {booking.courseTime} • {booking.courseVenue}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          {getStatusIcon(booking.status)}
                          <AdminBadge
                            variant={getStatusVariant(booking.status)}
                            className="ml-2"
                          >
                            {booking.status}
                          </AdminBadge>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <AdminBadge
                          variant={getPaymentVariant(booking.paymentStatus)}
                        >
                          {booking.paymentStatus}
                        </AdminBadge>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">
                          £{booking.totalAmount}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <div className="flex gap-2">
                          <button
                            onClick={() => {
                              setSelectedBooking(booking);
                              setShowDetailsModal(true);
                            }}
                            className="inline-flex items-center justify-center px-3 py-2 border border-blue-500 rounded-md text-blue-600 bg-blue-50 hover:bg-blue-100 hover:border-blue-600 hover:text-blue-700 transition-all duration-150"
                            title="View Details"
                          >
                            <Eye className="w-4 h-4 mr-1.5" />
                            <span className="text-sm font-medium">View</span>
                          </button>
                          <button
                            onClick={() => {
                              setSelectedBooking(booking);
                              setShowDetailsModal(true);
                            }}
                            className="inline-flex items-center justify-center px-3 py-2 border border-green-500 rounded-md text-green-600 bg-green-50 hover:bg-green-100 hover:border-green-600 hover:text-green-700 transition-all duration-150"
                            title="Email Customer"
                          >
                            <Mail className="w-4 h-4 mr-1.5" />
                            <span className="text-sm font-medium">Email</span>
                          </button>
                          <button
                            onClick={() => handleDelete(booking.id)}
                            className="inline-flex items-center justify-center px-3 py-2 border border-red-500 rounded-md text-red-600 bg-red-50 hover:bg-red-100 hover:border-red-600 hover:text-red-700 transition-all duration-150"
                            title="Delete Booking"
                          >
                            <Trash2 className="w-4 h-4 mr-1.5" />
                            <span className="text-sm font-medium">Delete</span>
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Empty state */}
            {bookings?.length === 0 && (
              <AdminEmptyState
                icon={Calendar}
                title="No bookings found"
                description={
                  searchTerm ||
                  statusFilter !== "all" ||
                  paymentFilter !== "all"
                    ? "Try adjusting your filters"
                    : "Bookings will appear here when customers book courses"
                }
              />
            )}
          </AdminCard>
        </>
      ) : (
        <CalendarView bookings={bookings || []} />
      )}

      {/* Booking Details Modal */}
      {showDetailsModal && selectedBooking && (
        <BookingDetailsModal
          booking={selectedBooking}
          onClose={() => {
            setShowDetailsModal(false);
            setSelectedBooking(null);
          }}
          onUpdate={(data) =>
            updateMutation.mutate({ id: selectedBooking.id, data })
          }
          isUpdating={updateMutation.isPending}
        />
      )}
    </div>
  );
};
