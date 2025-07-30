import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  Search,
  Users,
  Phone,
  Building,
  Calendar,
  PoundSterling,
  Mail,
  MapPin,
  Activity,
  Download,
  Eye,
  Filter,
} from "lucide-react";
import { format } from "date-fns";
import { AdminCard } from "../../components/ui/AdminCard";
import { AdminBadge } from "../../components/ui/AdminBadge";
import { LoadingSpinner } from "../../components/common/LoadingSpinner";
import { AdminEmptyState } from "../../components/ui/AdminEmptyState";
import { adminApi } from "../../utils/api";
import type { User, UserListResponse } from "../../../types/user";
import { useNavigate } from "react-router-dom";
import "../../styles/admin-design-system.css";

export const UsersPage: React.FC = () => {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState("");
  const [roleFilter, setRoleFilter] = useState<string>("all");
  const [customerTypeFilter, setCustomerTypeFilter] = useState<string>("all");
  const [hasBookingsFilter, setHasBookingsFilter] = useState<string>("all");
  const [currentPage, setCurrentPage] = useState(0);
  const pageSize = 50;

  const { data, isLoading, error } = useQuery({
    queryKey: [
      "admin-users",
      searchTerm,
      roleFilter,
      customerTypeFilter,
      hasBookingsFilter,
      currentPage,
    ],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (searchTerm) params.append("search", searchTerm);
      if (roleFilter !== "all") params.append("role", roleFilter);
      if (customerTypeFilter !== "all")
        params.append("customerType", customerTypeFilter);
      if (hasBookingsFilter !== "all")
        params.append("hasBookings", hasBookingsFilter);
      params.append("limit", pageSize.toString());
      params.append("offset", (currentPage * pageSize).toString());

      const response = await adminApi.get(`/api/admin/users?${params}`);
      if (!response.ok) throw new Error("Failed to fetch users");
      return response.json() as Promise<UserListResponse>;
    },
    staleTime: 5 * 60 * 1000,
  });

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

  const formatCurrency = (amount: number | string) => {
    const numAmount = typeof amount === "string" ? parseFloat(amount) : amount;
    return `£${numAmount.toFixed(2)}`;
  };

  const handleExport = async () => {
    try {
      const params = new URLSearchParams();
      if (roleFilter !== "all") params.append("role", roleFilter);
      params.append("format", "csv");

      const response = await adminApi.get(`/api/admin/users/export?${params}`);
      const blob = await response.blob();

      // Create download link
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `users-${format(new Date(), "yyyy-MM-dd")}.csv`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error("Export failed:", error);
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
          <p className="text-red-600 font-medium">Failed to load users</p>
          <p className="admin-text-small admin-text-muted admin-mt-2">
            Please try refreshing the page
          </p>
        </div>
      </AdminCard>
    );
  }

  const totalPages = Math.ceil((data?.total || 0) / pageSize);

  return (
    <div className="space-y-6 admin-fade-in">
      {/* Header */}
      <div className="admin-page-header">
        <div className="sm:flex sm:items-center sm:justify-between">
          <div>
            <h1 className="admin-page-title">User Management</h1>
            <p className="admin-page-subtitle">
              Manage customers, administrators, and instructors
            </p>
          </div>
          <div className="mt-4 sm:mt-0">
            <button
              onClick={handleExport}
              className="admin-btn admin-btn-secondary"
            >
              <Download className="admin-icon-sm" />
              Export
            </button>
          </div>
        </div>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <AdminCard className="p-4">
          <div className="flex items-center">
            <div className="p-2 bg-blue-100 rounded-lg">
              <Users className="w-5 h-5 text-blue-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Total Users</p>
              <p className="text-2xl font-semibold text-gray-900">
                {data?.total || 0}
              </p>
            </div>
          </div>
        </AdminCard>

        <AdminCard className="p-4">
          <div className="flex items-center">
            <div className="p-2 bg-green-100 rounded-lg">
              <Activity className="w-5 h-5 text-green-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">
                Active Customers
              </p>
              <p className="text-2xl font-semibold text-gray-900">
                {data?.data.filter(
                  (u) => u.role === "customer" && u.totalBookings > 0,
                ).length || 0}
              </p>
            </div>
          </div>
        </AdminCard>

        <AdminCard className="p-4">
          <div className="flex items-center">
            <div className="p-2 bg-purple-100 rounded-lg">
              <Building className="w-5 h-5 text-purple-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Corporate</p>
              <p className="text-2xl font-semibold text-gray-900">
                {data?.data.filter((u) => u.customerType === "corporate")
                  .length || 0}
              </p>
            </div>
          </div>
        </AdminCard>

        <AdminCard className="p-4">
          <div className="flex items-center">
            <div className="p-2 bg-yellow-100 rounded-lg">
              <Mail className="w-5 h-5 text-yellow-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Subscribed</p>
              <p className="text-2xl font-semibold text-gray-900">
                {data?.data.filter((u) => u.newsletterSubscribed).length || 0}
              </p>
            </div>
          </div>
        </AdminCard>
      </div>

      {/* Filters */}
      <AdminCard>
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          <div className="md:col-span-2">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => {
                  setSearchTerm(e.target.value);
                  setCurrentPage(0);
                }}
                placeholder="Search by name, email, phone, or company..."
                className="admin-input pl-10"
              />
            </div>
          </div>
          <div>
            <select
              value={roleFilter}
              onChange={(e) => {
                setRoleFilter(e.target.value);
                setCurrentPage(0);
              }}
              className="admin-select"
            >
              <option value="all">All Roles</option>
              <option value="customer">Customers</option>
              <option value="admin">Administrators</option>
              <option value="instructor">Instructors</option>
            </select>
          </div>
          <div>
            <select
              value={customerTypeFilter}
              onChange={(e) => {
                setCustomerTypeFilter(e.target.value);
                setCurrentPage(0);
              }}
              className="admin-select"
            >
              <option value="all">All Types</option>
              <option value="individual">Individual</option>
              <option value="corporate">Corporate</option>
            </select>
          </div>
          <div>
            <select
              value={hasBookingsFilter}
              onChange={(e) => {
                setHasBookingsFilter(e.target.value);
                setCurrentPage(0);
              }}
              className="admin-select"
            >
              <option value="all">All Users</option>
              <option value="true">With Bookings</option>
              <option value="false">No Bookings</option>
            </select>
          </div>
        </div>
      </AdminCard>

      {/* Users Table */}
      <AdminCard>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  User
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Contact
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Role
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Activity
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Lifetime Value
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {data?.data.map((user) => (
                <tr key={user.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div>
                      <div className="text-sm font-medium text-gray-900">
                        {user.name}
                      </div>
                      <div className="text-sm text-gray-500">{user.email}</div>
                      {user.companyName && (
                        <div className="text-sm text-gray-500 flex items-center mt-1">
                          <Building className="w-3 h-3 mr-1" />
                          {user.companyName}
                        </div>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="space-y-1">
                      {user.phone && (
                        <div className="text-sm text-gray-900 flex items-center">
                          <Phone className="w-3 h-3 mr-1 text-gray-400" />
                          {user.phone}
                        </div>
                      )}
                      {user.city && (
                        <div className="text-sm text-gray-500 flex items-center">
                          <MapPin className="w-3 h-3 mr-1 text-gray-400" />
                          {user.city}
                          {user.postcode && `, ${user.postcode}`}
                        </div>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <AdminBadge variant={getRoleBadgeVariant(user.role)}>
                      {user.role}
                    </AdminBadge>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm">
                      <div className="text-gray-900 font-medium">
                        {user.totalBookings} booking
                        {user.totalBookings !== 1 ? "s" : ""}
                      </div>
                      {user.lastBookingDate && (
                        <div className="text-gray-500 text-xs">
                          Last:{" "}
                          {format(
                            new Date(user.lastBookingDate),
                            "dd MMM yyyy",
                          )}
                        </div>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm">
                      <div className="font-medium text-gray-900">
                        {formatCurrency(user.totalSpent)}
                      </div>
                      {user.customerSince && (
                        <div className="text-gray-500 text-xs">
                          Since{" "}
                          {format(new Date(user.customerSince), "MMM yyyy")}
                        </div>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <button
                      onClick={() => navigate(`/admin/users/${user.id}`)}
                      className="inline-flex items-center px-3 py-1.5 border border-blue-500 rounded-md text-blue-600 bg-blue-50 hover:bg-blue-100 transition-all duration-150"
                    >
                      <Eye className="w-4 h-4 mr-1" />
                      View
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Empty state */}
        {data?.data.length === 0 && (
          <AdminEmptyState
            icon={Users}
            title="No users found"
            description={
              searchTerm ||
              roleFilter !== "all" ||
              customerTypeFilter !== "all" ||
              hasBookingsFilter !== "all"
                ? "Try adjusting your filters"
                : "Users will appear here as customers book courses"
            }
          />
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="px-6 py-4 border-t border-gray-200">
            <div className="flex items-center justify-between">
              <div className="text-sm text-gray-700">
                Showing {currentPage * pageSize + 1} to{" "}
                {Math.min((currentPage + 1) * pageSize, data?.total || 0)} of{" "}
                {data?.total || 0} users
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => setCurrentPage(Math.max(0, currentPage - 1))}
                  disabled={currentPage === 0}
                  className="admin-btn admin-btn-secondary disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Previous
                </button>
                <button
                  onClick={() =>
                    setCurrentPage(Math.min(totalPages - 1, currentPage + 1))
                  }
                  disabled={currentPage === totalPages - 1}
                  className="admin-btn admin-btn-secondary disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Next
                </button>
              </div>
            </div>
          </div>
        )}
      </AdminCard>
    </div>
  );
};
