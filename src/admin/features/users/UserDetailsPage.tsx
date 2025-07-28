import React from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import {
  ArrowLeft,
  User,
  Mail,
  Phone,
  Building,
  MapPin,
  Calendar,
  PoundSterling,
  Package,
  Clock,
  CreditCard,
  AlertCircle,
  Settings,
  BarChart3,
} from "lucide-react";
import { format } from "date-fns";
import { AdminCard } from "../../components/ui/AdminCard";
import { AdminBadge } from "../../components/ui/AdminBadge";
import { LoadingSpinner } from "../../components/common/LoadingSpinner";
import { Button } from "../../../components/ui/Button";
import { adminApi } from "../../utils/api";
import "../../styles/admin-design-system.css";

export const UserDetailsPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const {
    data: user,
    isLoading,
    error,
  } = useQuery({
    queryKey: ["admin-user-details", id],
    queryFn: async () => {
      if (!id) throw new Error("User ID is required");
      const response = await adminApi.get(`/api/admin/users/${id}`);
      if (!response.ok) throw new Error("Failed to fetch user details");
      return response.json();
    },
    enabled: !!id,
  });

  if (isLoading) {
    return (
      <div className="admin-loading-container">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (error || !user) {
    return (
      <AdminCard className="admin-mt-8">
        <div className="text-center">
          <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <p className="text-red-600 font-medium">
            Failed to load user details
          </p>
          <Button
            variant="secondary"
            onClick={() => navigate("/admin/users")}
            className="mt-4"
          >
            Back to Users
          </Button>
        </div>
      </AdminCard>
    );
  }

  const getRoleBadgeVariant = (
    role: string,
  ): "success" | "warning" | "error" | "neutral" => {
    switch (role) {
      case "admin":
        return "error";
      case "instructor":
        return "warning";
      default:
        return "success";
    }
  };

  const getPaymentStatusBadge = (
    status: string,
  ): "success" | "warning" | "error" | "neutral" => {
    switch (status) {
      case "completed":
        return "success";
      case "pending":
        return "warning";
      case "failed":
        return "error";
      default:
        return "neutral";
    }
  };

  const getBookingStatusBadge = (
    status: string,
  ): "success" | "warning" | "error" | "neutral" => {
    switch (status) {
      case "confirmed":
        return "success";
      case "pending":
        return "warning";
      case "cancelled":
        return "error";
      default:
        return "neutral";
    }
  };

  return (
    <div className="space-y-6 admin-fade-in">
      {/* Header */}
      <div className="admin-page-header">
        <button
          onClick={() => navigate("/admin/users")}
          className="inline-flex items-center text-gray-500 hover:text-gray-700 mb-4"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Users
        </button>

        <div className="sm:flex sm:items-center sm:justify-between">
          <div>
            <h1 className="admin-page-title flex items-center gap-3">
              {user.name}
              <AdminBadge variant={getRoleBadgeVariant(user.role)}>
                {user.role}
              </AdminBadge>
            </h1>
            <p className="admin-page-subtitle">
              Member since {format(new Date(user.created_at), "MMMM yyyy")}
            </p>
          </div>
        </div>
      </div>

      {/* User Information */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Contact Information */}
        <AdminCard title="Contact Information" icon={User} iconColor="primary">
          <div className="space-y-4">
            <div className="flex items-start gap-3">
              <Mail className="w-5 h-5 text-gray-400 mt-0.5" />
              <div>
                <p className="text-sm font-medium text-gray-600">Email</p>
                <p className="text-sm text-gray-900">{user.email}</p>
              </div>
            </div>

            {user.phone && (
              <div className="flex items-start gap-3">
                <Phone className="w-5 h-5 text-gray-400 mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-gray-600">Phone</p>
                  <p className="text-sm text-gray-900">{user.phone}</p>
                </div>
              </div>
            )}

            {(user.address_line1 || user.city) && (
              <div className="flex items-start gap-3">
                <MapPin className="w-5 h-5 text-gray-400 mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-gray-600">Address</p>
                  {user.address_line1 && (
                    <p className="text-sm text-gray-900">
                      {user.address_line1}
                    </p>
                  )}
                  {user.address_line2 && (
                    <p className="text-sm text-gray-900">
                      {user.address_line2}
                    </p>
                  )}
                  <p className="text-sm text-gray-900">
                    {[user.city, user.county, user.postcode]
                      .filter(Boolean)
                      .join(", ")}
                  </p>
                </div>
              </div>
            )}

            {user.company_name && (
              <div className="flex items-start gap-3">
                <Building className="w-5 h-5 text-gray-400 mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-gray-600">Company</p>
                  <p className="text-sm text-gray-900">{user.company_name}</p>
                </div>
              </div>
            )}
          </div>
        </AdminCard>

        {/* Account Details */}
        <AdminCard
          title="Account Details"
          icon={Settings}
          iconColor="secondary"
        >
          <div className="space-y-4">
            <div>
              <p className="text-sm font-medium text-gray-600">Customer Type</p>
              <p className="text-sm text-gray-900 capitalize">
                {user.customer_type || "Individual"}
              </p>
            </div>

            <div>
              <p className="text-sm font-medium text-gray-600">Newsletter</p>
              <p className="text-sm text-gray-900">
                {user.newsletter_subscribed ? "Subscribed" : "Not Subscribed"}
              </p>
            </div>

            <div>
              <p className="text-sm font-medium text-gray-600">
                Account Status
              </p>
              <AdminBadge variant={user.is_active ? "success" : "neutral"}>
                {user.is_active ? "Active" : "Inactive"}
              </AdminBadge>
            </div>

            {user.last_login && (
              <div>
                <p className="text-sm font-medium text-gray-600">Last Login</p>
                <p className="text-sm text-gray-900">
                  {format(new Date(user.last_login), "dd MMM yyyy HH:mm")}
                </p>
              </div>
            )}
          </div>
        </AdminCard>

        {/* Statistics */}
        <AdminCard title="Statistics" icon={BarChart3} iconColor="accent">
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-sm font-medium text-gray-600">
                Total Bookings
              </span>
              <span className="text-lg font-semibold text-gray-900">
                {user.total_bookings || 0}
              </span>
            </div>

            <div className="flex justify-between items-center">
              <span className="text-sm font-medium text-gray-600">
                Total Spent
              </span>
              <span className="text-lg font-semibold text-gray-900">
                £{parseFloat(user.total_spent || 0).toFixed(2)}
              </span>
            </div>

            {user.total_bookings > 0 && (
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium text-gray-600">
                  Average Order
                </span>
                <span className="text-lg font-semibold text-gray-900">
                  £
                  {(
                    parseFloat(user.total_spent || 0) /
                    (user.total_bookings || 1)
                  ).toFixed(2)}
                </span>
              </div>
            )}

            {user.last_booking_date && (
              <div>
                <p className="text-sm font-medium text-gray-600">
                  Last Booking
                </p>
                <p className="text-sm text-gray-900">
                  {format(new Date(user.last_booking_date), "dd MMM yyyy")}
                </p>
              </div>
            )}
          </div>
        </AdminCard>
      </div>

      {/* Booking History */}
      <AdminCard title="Booking History" icon={Package} iconColor="primary">
        {user.bookings && user.bookings.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Course
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Date & Time
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Venue
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Amount
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {user.bookings.map((booking: any) => (
                  <tr key={booking.id}>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">
                        {booking.course_name}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        {format(
                          new Date(booking.start_datetime),
                          "dd MMM yyyy",
                        )}
                      </div>
                      <div className="text-sm text-gray-500">
                        {format(new Date(booking.start_datetime), "HH:mm")} -
                        {format(new Date(booking.end_datetime), "HH:mm")}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        {booking.venue_name}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        £{booking.payment_amount}
                      </div>
                      <AdminBadge
                        variant={getPaymentStatusBadge(booking.payment_status)}
                      >
                        {booking.payment_status}
                      </AdminBadge>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <AdminBadge
                        variant={getBookingStatusBadge(booking.status)}
                      >
                        {booking.status}
                      </AdminBadge>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="text-center py-8">
            <Package className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-500">No bookings found</p>
          </div>
        )}
      </AdminCard>
    </div>
  );
};
