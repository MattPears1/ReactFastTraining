import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  Activity,
  Filter,
  Download,
  User,
  UserPlus,
  UserMinus,
  Edit3,
  Trash2,
  Calendar,
  DollarSign,
  CheckCircle,
  XCircle,
  AlertCircle,
  Clock,
  Search,
  LogIn,
  LogOut,
  Settings,
  Shield,
  FileText,
} from "lucide-react";
import { LoadingSpinner } from "../../components/common/LoadingSpinner";
import { AdminCard } from "../../components/ui/AdminCard";
import { AdminBadge } from "../../components/ui/AdminBadge";
import { AdminEmptyState } from "../../components/ui/AdminEmptyState";
import "../../styles/admin-design-system.css";

interface ActivityLog {
  id: string;
  action: string;
  category: "auth" | "user" | "booking" | "course" | "system" | "payment";
  description: string;
  user: {
    id: string;
    name: string;
    role: string;
  };
  metadata?: {
    [key: string]: any;
  };
  timestamp: string;
  ipAddress: string;
  status: "success" | "warning" | "error";
}

const mockActivities: ActivityLog[] = [
  {
    id: "1",
    action: "USER_LOGIN",
    category: "auth",
    description: "Admin logged in successfully",
    user: {
      id: "1",
      name: "Lex Richardson",
      role: "admin",
    },
    timestamp: "2025-01-27T10:30:00Z",
    ipAddress: "192.168.1.1",
    status: "success",
  },
  {
    id: "2",
    action: "BOOKING_CREATED",
    category: "booking",
    description: "New booking created for Emergency First Aid at Work",
    user: {
      id: "2",
      name: "John Smith",
      role: "customer",
    },
    metadata: {
      bookingId: "RFT-2025-004",
      courseId: "1",
      amount: 75,
    },
    timestamp: "2025-01-27T09:45:00Z",
    ipAddress: "192.168.1.2",
    status: "success",
  },
  {
    id: "3",
    action: "COURSE_UPDATED",
    category: "course",
    description: "Course details updated: Changed price from £70 to £75",
    user: {
      id: "1",
      name: "Lex Richardson",
      role: "admin",
    },
    metadata: {
      courseId: "1",
      changes: {
        price: { from: 70, to: 75 },
      },
    },
    timestamp: "2025-01-27T08:20:00Z",
    ipAddress: "192.168.1.1",
    status: "success",
  },
  {
    id: "4",
    action: "PAYMENT_FAILED",
    category: "payment",
    description: "Payment failed for booking RFT-2025-003",
    user: {
      id: "3",
      name: "Emma Wilson",
      role: "customer",
    },
    metadata: {
      bookingId: "RFT-2025-003",
      amount: 85,
      error: "Insufficient funds",
    },
    timestamp: "2025-01-26T16:30:00Z",
    ipAddress: "192.168.1.3",
    status: "error",
  },
  {
    id: "5",
    action: "USER_CREATED",
    category: "user",
    description: "New instructor account created",
    user: {
      id: "1",
      name: "Lex Richardson",
      role: "admin",
    },
    metadata: {
      newUserId: "4",
      newUserName: "Michael Brown",
      newUserRole: "instructor",
    },
    timestamp: "2025-01-26T14:15:00Z",
    ipAddress: "192.168.1.1",
    status: "success",
  },
  {
    id: "6",
    action: "SYSTEM_BACKUP",
    category: "system",
    description: "Automated system backup completed",
    user: {
      id: "system",
      name: "System",
      role: "system",
    },
    metadata: {
      backupSize: "2.4GB",
      duration: "3m 24s",
    },
    timestamp: "2025-01-26T03:00:00Z",
    ipAddress: "127.0.0.1",
    status: "success",
  },
  {
    id: "7",
    action: "USER_LOGOUT",
    category: "auth",
    description: "User logged out",
    user: {
      id: "2",
      name: "John Smith",
      role: "customer",
    },
    timestamp: "2025-01-25T18:00:00Z",
    ipAddress: "192.168.1.2",
    status: "success",
  },
  {
    id: "8",
    action: "BOOKING_CANCELLED",
    category: "booking",
    description: "Booking cancelled by customer",
    user: {
      id: "5",
      name: "Emma Wilson",
      role: "customer",
    },
    metadata: {
      bookingId: "RFT-2025-002",
      reason: "Schedule conflict",
    },
    timestamp: "2025-01-25T15:45:00Z",
    ipAddress: "192.168.1.4",
    status: "warning",
  },
];

export const ActivityLogPage: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [dateFilter, setDateFilter] = useState<string>("all");

  const {
    data: activities,
    isLoading,
    error,
  } = useQuery({
    queryKey: [
      "admin-activities",
      searchTerm,
      categoryFilter,
      statusFilter,
      dateFilter,
    ],
    queryFn: async () => {
      await new Promise((resolve) => setTimeout(resolve, 500));

      let filtered = mockActivities;

      if (searchTerm) {
        filtered = filtered.filter(
          (activity) =>
            activity.description
              .toLowerCase()
              .includes(searchTerm.toLowerCase()) ||
            activity.user.name
              .toLowerCase()
              .includes(searchTerm.toLowerCase()) ||
            activity.action.toLowerCase().includes(searchTerm.toLowerCase()),
        );
      }

      if (categoryFilter !== "all") {
        filtered = filtered.filter(
          (activity) => activity.category === categoryFilter,
        );
      }

      if (statusFilter !== "all") {
        filtered = filtered.filter(
          (activity) => activity.status === statusFilter,
        );
      }

      // Date filtering logic would go here

      return filtered.sort(
        (a, b) =>
          new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime(),
      );
    },
  });

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case "auth":
        return <Shield className="admin-icon-md" />;
      case "user":
        return <User className="admin-icon-md" />;
      case "booking":
        return <Calendar className="admin-icon-md" />;
      case "course":
        return <FileText className="admin-icon-md" />;
      case "payment":
        return <DollarSign className="admin-icon-md" />;
      case "system":
        return <Settings className="admin-icon-md" />;
      default:
        return <Activity className="admin-icon-md" />;
    }
  };

  const getActionIcon = (action: string) => {
    switch (action) {
      case "USER_LOGIN":
        return <LogIn className="admin-icon-sm" />;
      case "USER_LOGOUT":
        return <LogOut className="admin-icon-sm" />;
      case "USER_CREATED":
        return <UserPlus className="admin-icon-sm" />;
      case "USER_DELETED":
        return <UserMinus className="admin-icon-sm" />;
      case "BOOKING_CREATED":
        return <CheckCircle className="admin-icon-sm" />;
      case "BOOKING_CANCELLED":
        return <XCircle className="admin-icon-sm" />;
      case "PAYMENT_FAILED":
        return <AlertCircle className="admin-icon-sm" />;
      case "COURSE_UPDATED":
        return <Edit3 className="admin-icon-sm" />;
      case "COURSE_DELETED":
        return <Trash2 className="admin-icon-sm" />;
      default:
        return <Activity className="admin-icon-sm" />;
    }
  };

  const getCategoryColor = (category: string) => {
    switch (category) {
      case "auth":
        return "text-blue-600 bg-blue-100";
      case "user":
        return "text-purple-600 bg-purple-100";
      case "booking":
        return "text-green-600 bg-green-100";
      case "course":
        return "text-yellow-600 bg-yellow-100";
      case "payment":
        return "text-red-600 bg-red-100";
      case "system":
        return "text-gray-600 bg-gray-100";
      default:
        return "text-gray-600 bg-gray-100";
    }
  };

  const getStatusVariant = (
    status: string,
  ): "success" | "warning" | "danger" => {
    switch (status) {
      case "success":
        return "success";
      case "warning":
        return "warning";
      case "error":
        return "danger";
      default:
        return "success";
    }
  };

  const formatTimestamp = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffInMinutes = (now.getTime() - date.getTime()) / (1000 * 60);

    if (diffInMinutes < 60) {
      return `${Math.floor(diffInMinutes)}m ago`;
    } else if (diffInMinutes < 1440) {
      return `${Math.floor(diffInMinutes / 60)}h ago`;
    } else {
      return date.toLocaleDateString() + " " + date.toLocaleTimeString();
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
          <p className="text-red-600 font-medium">
            Failed to load activity log
          </p>
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
            <h1 className="admin-page-title">Activity Log</h1>
            <p className="admin-page-subtitle">
              Monitor all system activities and user actions
            </p>
          </div>
          <div className="mt-4 sm:mt-0">
            <button className="admin-btn admin-btn-secondary">
              <Download className="admin-icon-sm" />
              Export Log
            </button>
          </div>
        </div>
      </div>

      {/* Filters */}
      <AdminCard>
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          <div>
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search activities..."
              className="admin-input"
            />
          </div>
          <div>
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="admin-select"
            >
              <option value="all">All Categories</option>
              <option value="auth">Authentication</option>
              <option value="user">User</option>
              <option value="booking">Booking</option>
              <option value="course">Course</option>
              <option value="payment">Payment</option>
              <option value="system">System</option>
            </select>
          </div>
          <div>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="admin-select"
            >
              <option value="all">All Status</option>
              <option value="success">Success</option>
              <option value="warning">Warning</option>
              <option value="error">Error</option>
            </select>
          </div>
          <div>
            <select
              value={dateFilter}
              onChange={(e) => setDateFilter(e.target.value)}
              className="admin-select"
            >
              <option value="all">All Time</option>
              <option value="today">Today</option>
              <option value="week">This Week</option>
              <option value="month">This Month</option>
              <option value="custom">Custom Range</option>
            </select>
          </div>
          <div className="flex justify-end">
            <button className="admin-btn admin-btn-secondary">
              <Filter className="admin-icon-sm" />
              More Filters
            </button>
          </div>
        </div>
      </AdminCard>

      {/* Activity Timeline */}
      <AdminCard
        title="Recent Activities"
        icon={Activity}
        iconColor="primary"
        noPadding
      >
        <div className="divide-y divide-gray-200">
          {activities?.map((activity) => (
            <div
              key={activity.id}
              className="p-4 hover:bg-gray-50 transition-colors"
            >
              <div className="flex items-start gap-4">
                {/* Icon */}
                <div
                  className={`p-2 rounded-lg ${getCategoryColor(activity.category)}`}
                >
                  {getCategoryIcon(activity.category)}
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="flex items-center gap-2">
                        {getActionIcon(activity.action)}
                        <span className="font-medium text-gray-900">
                          {activity.description}
                        </span>
                        <AdminBadge variant={getStatusVariant(activity.status)}>
                          {activity.status}
                        </AdminBadge>
                      </div>

                      <div className="flex items-center gap-4 admin-mt-2 admin-text-small admin-text-muted">
                        <span className="flex items-center gap-1">
                          <User className="admin-icon-sm" />
                          {activity.user.name}
                        </span>
                        <span className="flex items-center gap-1">
                          <Clock className="admin-icon-sm" />
                          {formatTimestamp(activity.timestamp)}
                        </span>
                        <span className="flex items-center gap-1">
                          <Shield className="admin-icon-sm" />
                          {activity.ipAddress}
                        </span>
                      </div>

                      {/* Metadata */}
                      {activity.metadata && (
                        <div className="admin-mt-2 p-2 bg-gray-50 rounded-md">
                          <div className="grid grid-cols-2 gap-2 admin-text-small">
                            {Object.entries(activity.metadata).map(
                              ([key, value]) => (
                                <div key={key}>
                                  <span className="admin-text-muted capitalize">
                                    {key.replace(/([A-Z])/g, " $1").trim()}:
                                  </span>{" "}
                                  <span className="text-gray-900">
                                    {typeof value === "object"
                                      ? JSON.stringify(value)
                                      : value}
                                  </span>
                                </div>
                              ),
                            )}
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Action */}
                    <div className="flex items-center gap-2 admin-text-small">
                      <AdminBadge variant="neutral">
                        {activity.category}
                      </AdminBadge>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {activities?.length === 0 && (
          <AdminEmptyState
            icon={Activity}
            title="No activities found"
            description="Try adjusting your filters"
          />
        )}
      </AdminCard>
    </div>
  );
};
