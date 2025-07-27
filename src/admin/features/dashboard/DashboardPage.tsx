import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { 
  TrendingUp, 
  Users, 
  Calendar, 
  PoundSterling,
  ArrowUp,
  ArrowDown,
  ArrowRight
} from 'lucide-react';
import { adminDashboardService } from '../../services/admin-dashboard.service';
import { MetricCard } from '../../components/common/MetricCard';
import { AdminCard } from '../../components/ui/AdminCard';
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
      <div className="admin-loading-container">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="admin-card admin-mt-8">
        <div className="admin-card-body text-center">
          <p className="text-red-600 font-medium">Failed to load dashboard data</p>
          <p className="admin-text-small admin-text-muted admin-mt-2">Please try refreshing the page</p>
        </div>
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
      <div className="admin-page-header admin-fade-in">
        <h1 className="admin-page-title">Dashboard</h1>
        <p className="admin-page-subtitle">
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
        <AdminCard
          title="Revenue Trend"
          subtitle="Last 6 months"
          icon={TrendingUp}
          iconColor="success"
        >
          <RevenueChart data={dashboardData?.revenueData || []} />
        </AdminCard>
        
        <AdminCard
          title="Booking Status"
          subtitle="Current distribution"
          icon={PoundSterling}
          iconColor="primary"
        >
          <BookingStatusChart data={dashboardData?.bookingStatus || []} />
        </AdminCard>
      </div>

      {/* Bottom row */}
      <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
        <AdminCard
          title="Upcoming Schedules"
          icon={Calendar}
          iconColor="primary"
          actions={
            <a href="/admin/schedule" className="admin-btn admin-btn-secondary admin-btn-sm">
              View all
              <ArrowRight className="admin-icon-sm" />
            </a>
          }
        >
          <UpcomingSchedules schedules={dashboardData?.upcomingSchedules || []} />
        </AdminCard>
        
        <AdminCard
          title="Recent Activity"
          icon={Users}
          iconColor="accent"
          actions={
            <a href="/admin/activity" className="admin-btn admin-btn-secondary admin-btn-sm">
              View all
              <ArrowRight className="admin-icon-sm" />
            </a>
          }
        >
          <RecentActivity activities={dashboardData?.recentActivity || []} />
        </AdminCard>
      </div>
    </div>
  );
};