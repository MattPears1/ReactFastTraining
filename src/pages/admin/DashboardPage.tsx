import React, { useState, useEffect } from "react";
import {
  Calendar,
  Users,
  PoundSterling,
  AlertCircle,
  TrendingUp,
  Clock,
  CheckCircle,
  XCircle,
} from "lucide-react";
import { adminDashboardApi } from "@services/api/admin-dashboard.service";
import { useAuth } from "@contexts/AuthContext";
import { Navigate } from "react-router-dom";
import LoadingScreen from "@components/common/LoadingScreen";
import { DashboardStats } from "@components/admin/features/dashboard/components/DashboardStats";
import { RevenueChart } from "@components/admin/features/dashboard/components/RevenueChart";
import { UpcomingSessionsList } from "@components/admin/features/dashboard/components/UpcomingSessionsList";
import { RecentActivityFeed } from "@components/admin/features/dashboard/components/RecentActivityFeed";
import { QuickActions } from "@components/admin/features/dashboard/components/QuickActions";
import { DashboardSkeleton } from "@components/admin/shared/components/DashboardSkeleton";
import { format } from "date-fns";
import { cn } from "@utils/cn";

interface DashboardData {
  today: {
    count: number;
    revenue: number;
  };
  week: {
    count: number;
    revenue: number;
    attendees: number;
  };
  month: {
    count: number;
    revenue: number;
    attendees: number;
  };
  upcomingSessions: any[];
  pendingRefunds: {
    count: number;
    totalAmount: number;
  };
  recentActivity: any[];
  chartData: {
    dailyStats: any[];
    coursePopularity: any[];
  };
}

export const AdminDashboardPage: React.FC = () => {
  const { isAuthenticated, user, loading: authLoading } = useAuth();
  const [stats, setStats] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [dateRange, setDateRange] = useState({
    start: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
    end: new Date(),
  });

  useEffect(() => {
    if (isAuthenticated && user?.role === "admin") {
      loadDashboardData();
      // Refresh every 30 seconds
      const interval = setInterval(loadDashboardData, 30000);
      return () => clearInterval(interval);
    }
  }, [dateRange, isAuthenticated, user]);

  const loadDashboardData = async () => {
    try {
      setError(null);
      const data = await adminDashboardApi.getDashboardStats(dateRange);
      setStats(data);
    } catch (err: any) {
      setError(err.message || "Failed to load dashboard data");
      console.error("Dashboard error:", err);
    } finally {
      setLoading(false);
    }
  };

  // Check authentication
  if (authLoading) {
    return <LoadingScreen />;
  }

  if (!isAuthenticated || user?.role !== "admin") {
    return <Navigate to="/login" replace />;
  }

  if (loading && !stats) {
    return <DashboardSkeleton />;
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
            Error Loading Dashboard
          </h2>
          <p className="text-gray-600 dark:text-gray-400 mb-4">{error}</p>
          <button
            onClick={loadDashboardData}
            className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  if (!stats) return null;

  // Calculate percentage changes
  const weeklyRevenueChange =
    stats.week.revenue > 0 && stats.month.revenue > 0
      ? (stats.week.revenue / (stats.month.revenue / 4) - 1) * 100
      : 0;

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            Admin Dashboard
          </h1>
          <p className="mt-2 text-gray-600 dark:text-gray-400">
            Welcome back! Here's what's happening with your business today.
          </p>
        </div>

        {/* Quick Actions */}
        <QuickActions />

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <StatCard
            title="Today's Bookings"
            value={stats.today.count}
            change={`£${stats.today.revenue.toFixed(2)}`}
            icon={Calendar}
            color="blue"
          />
          <StatCard
            title="This Week"
            value={stats.week.count}
            change={`${stats.week.attendees} attendees`}
            icon={Users}
            color="green"
          />
          <StatCard
            title="Weekly Revenue"
            value={`£${stats.week.revenue.toFixed(2)}`}
            change={`${weeklyRevenueChange >= 0 ? "+" : ""}${weeklyRevenueChange.toFixed(0)}% from last week`}
            icon={PoundSterling}
            color="purple"
            trend={weeklyRevenueChange >= 0 ? "up" : "down"}
          />
          <StatCard
            title="Pending Refunds"
            value={stats.pendingRefunds.count}
            change={`£${stats.pendingRefunds.totalAmount.toFixed(2)}`}
            icon={AlertCircle}
            color="red"
            alert={stats.pendingRefunds.count > 0}
          />
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Revenue Chart - 2 columns */}
          <div className="lg:col-span-2">
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                  Revenue Overview
                </h2>
                <select
                  value="30"
                  onChange={(e) => {
                    const days = parseInt(e.target.value);
                    setDateRange({
                      start: new Date(Date.now() - days * 24 * 60 * 60 * 1000),
                      end: new Date(),
                    });
                  }}
                  className="px-3 py-1 border border-gray-300 dark:border-gray-600 rounded-lg text-sm bg-white dark:bg-gray-700"
                >
                  <option value="7">Last 7 days</option>
                  <option value="30">Last 30 days</option>
                  <option value="90">Last 90 days</option>
                </select>
              </div>
              <RevenueChart data={stats.chartData} />
            </div>
          </div>

          {/* Upcoming Sessions - 1 column */}
          <div>
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                Upcoming Sessions
              </h2>
              <UpcomingSessionsList sessions={stats.upcomingSessions} />
            </div>
          </div>
        </div>

        {/* Course Popularity */}
        <div className="mt-8 grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Course Stats */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              Course Popularity
            </h2>
            <div className="space-y-4">
              {stats.chartData.coursePopularity
                .slice(0, 5)
                .map((course, index) => (
                  <div
                    key={course.courseType}
                    className="flex items-center justify-between"
                  >
                    <div className="flex items-center gap-3">
                      <span className="text-2xl font-bold text-gray-400">
                        {index + 1}
                      </span>
                      <div>
                        <p className="font-medium text-gray-900 dark:text-white">
                          {course.courseType}
                        </p>
                        <p className="text-sm text-gray-500">
                          {course.bookings} bookings • {course.attendees}{" "}
                          attendees
                        </p>
                      </div>
                    </div>
                    <p className="font-semibold text-gray-900 dark:text-white">
                      £{course.revenue.toFixed(2)}
                    </p>
                  </div>
                ))}
            </div>
          </div>

          {/* Month Summary */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              Month Summary
            </h2>
            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                <div className="flex items-center gap-3">
                  <Calendar className="w-8 h-8 text-blue-600" />
                  <div>
                    <p className="font-medium text-gray-900 dark:text-white">
                      Total Bookings
                    </p>
                    <p className="text-sm text-gray-500">This month</p>
                  </div>
                </div>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  {stats.month.count}
                </p>
              </div>

              <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                <div className="flex items-center gap-3">
                  <Users className="w-8 h-8 text-green-600" />
                  <div>
                    <p className="font-medium text-gray-900 dark:text-white">
                      Total Attendees
                    </p>
                    <p className="text-sm text-gray-500">This month</p>
                  </div>
                </div>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  {stats.month.attendees}
                </p>
              </div>

              <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                <div className="flex items-center gap-3">
                  <PoundSterling className="w-8 h-8 text-purple-600" />
                  <div>
                    <p className="font-medium text-gray-900 dark:text-white">
                      Total Revenue
                    </p>
                    <p className="text-sm text-gray-500">This month</p>
                  </div>
                </div>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  £{stats.month.revenue.toFixed(2)}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Recent Activity */}
        <div className="mt-8">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              Recent Activity
            </h2>
            <RecentActivityFeed activities={stats.recentActivity} />
          </div>
        </div>
      </div>
    </div>
  );
};

// Stat Card Component
const StatCard: React.FC<{
  title: string;
  value: string | number;
  change?: string;
  icon: React.ElementType;
  color: "blue" | "green" | "purple" | "red";
  alert?: boolean;
  trend?: "up" | "down";
}> = ({ title, value, change, icon: Icon, color, alert, trend }) => {
  const colorClasses = {
    blue: "bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400",
    green:
      "bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-400",
    purple:
      "bg-purple-100 text-purple-600 dark:bg-purple-900/30 dark:text-purple-400",
    red: "bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400",
  };

  return (
    <div
      className={cn(
        "bg-white dark:bg-gray-800 rounded-lg shadow p-6",
        alert && "ring-2 ring-red-500",
      )}
    >
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
            {title}
          </p>
          <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">
            {value}
          </p>
          {change && (
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1 flex items-center gap-1">
              {trend === "up" && (
                <TrendingUp className="w-4 h-4 text-green-500" />
              )}
              {trend === "down" && (
                <TrendingUp className="w-4 h-4 text-red-500 rotate-180" />
              )}
              {change}
            </p>
          )}
        </div>
        <div
          className={cn(
            "w-12 h-12 rounded-lg flex items-center justify-center",
            colorClasses[color],
          )}
        >
          <Icon className="w-6 h-6" />
        </div>
      </div>
    </div>
  );
};

export default AdminDashboardPage;
