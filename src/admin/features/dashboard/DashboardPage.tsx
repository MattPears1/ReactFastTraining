import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { 
  TrendingUp, 
  Users, 
  Calendar, 
  PoundSterling,
  ArrowUp,
  ArrowDown
} from 'lucide-react';
import { adminDashboardService } from '../../services/admin-dashboard.service';
import { MetricCard } from '../../components/common/MetricCard';
import { RevenueChart } from './components/RevenueChart';
import { BookingStatusChart } from './components/BookingStatusChart';
import { UpcomingSchedules } from './components/UpcomingSchedules';
import { RecentActivity } from './components/RecentActivity';
import { LoadingSpinner } from '../../components/common/LoadingSpinner';
import './dashboard.css';

export const DashboardPage: React.FC = () => {
  const { data: dashboardData, isLoading, error } = useQuery({
    queryKey: ['admin-dashboard'],
    queryFn: () => adminDashboardService.getDashboardOverview(),
    refetchInterval: 5 * 60 * 1000, // Refresh every 5 minutes
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-12">
        <p className="text-red-600">Failed to load dashboard data</p>
      </div>
    );
  }

  const metrics = dashboardData?.metrics || {
    revenue: { current: 0, previous: 0, change: 0 },
    bookings: { current: 0, previous: 0, change: 0 },
    users: { total: 0, new: 0, active: 0 },
    courses: { upcoming: 0, inProgress: 0, completed: 0 }
  };

  return (
    <div className="space-y-6">
      {/* Page header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
        <p className="mt-1 text-sm text-gray-500">
          Welcome back! Here's what's happening with your business today.
        </p>
      </div>

      {/* Key metrics */}
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
        <MetricCard
          title="Monthly Revenue"
          value={`£${metrics.revenue.current.toLocaleString()}`}
          change={metrics.revenue.change}
          changeType={metrics.revenue.change >= 0 ? 'increase' : 'decrease'}
          icon={<PoundSterling className="h-6 w-6" />}
        />
        
        <MetricCard
          title="Total Bookings"
          value={metrics.bookings.current}
          change={metrics.bookings.change}
          changeType={metrics.bookings.change >= 0 ? 'increase' : 'decrease'}
          icon={<Calendar className="h-6 w-6" />}
        />
        
        <MetricCard
          title="Active Users"
          value={metrics.users.active}
          subtitle={`${metrics.users.new} new this month`}
          icon={<Users className="h-6 w-6" />}
        />
        
        <MetricCard
          title="Upcoming Courses"
          value={metrics.courses.upcoming}
          subtitle={`${metrics.courses.inProgress} in progress`}
          icon={<TrendingUp className="h-6 w-6" />}
        />
      </div>

      {/* Charts row */}
      <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-medium text-gray-900">Revenue Trend</h2>
              <span className="text-sm text-gray-500">Last 6 months</span>
            </div>
            <RevenueChart data={dashboardData?.revenueData || []} />
          </div>
        </div>
        
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-medium text-gray-900">Booking Status</h2>
              <span className="text-sm text-gray-500">Current distribution</span>
            </div>
            <BookingStatusChart data={dashboardData?.bookingStatus || []} />
          </div>
        </div>
      </div>

      {/* Bottom row */}
      <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-medium text-gray-900">Upcoming Schedules</h2>
              <a href="/admin/schedule" className="text-sm text-primary-600 hover:text-primary-700">
                View all →
              </a>
            </div>
            <UpcomingSchedules schedules={dashboardData?.upcomingSchedules || []} />
          </div>
        </div>
        
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-medium text-gray-900">Recent Activity</h2>
              <a href="/admin/activity" className="text-sm text-primary-600 hover:text-primary-700">
                View all →
              </a>
            </div>
            <RecentActivity activities={dashboardData?.recentActivity || []} />
          </div>
        </div>
      </div>
    </div>
  );
};