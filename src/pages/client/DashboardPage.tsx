import React from 'react';
import { Calendar } from 'lucide-react';
import { NextCourseCard } from '@/components/client/dashboard/NextCourseCard';
import { CourseList } from '@/components/client/dashboard/CourseList';
import { DashboardStats } from '@/components/client/dashboard/DashboardStats';
import { EmptyState } from '@/components/client/shared/EmptyState';
import { DashboardSkeleton } from '@/components/client/dashboard/DashboardSkeleton';
import { LoadingState } from '@/components/client/shared/LoadingStates';
import { useClientPortal } from '@/contexts/ClientPortalContext';
import { useAnnouncement } from '@/hooks/useAccessibility';
import { usePageTracking, useErrorTracking, analytics } from '@/utils/client/analytics';
import { useOnlineStatus } from '@/utils/client/persistence';
import { ErrorRecovery } from '@/utils/client/error-recovery';
import { performanceMonitor } from '@/utils/client/performance';

export const DashboardPage: React.FC = () => {
  const { stats, nextCourse, upcomingCourses, loading, error, refreshData } = useClientPortal();
  const { announce } = useAnnouncement();
  const isOnline = useOnlineStatus();
  
  // Analytics setup
  usePageTracking();
  useErrorTracking();
  
  // Performance monitoring
  React.useEffect(() => {
    performanceMonitor.mark('dashboard-render-start');
    return () => {
      performanceMonitor.measure('dashboard-render', 'dashboard-render-start');
    };
  }, []);

  // Announce data updates for screen readers
  React.useEffect(() => {
    if (!loading) {
      if (nextCourse) {
        announce(`Dashboard loaded. Your next course is ${nextCourse.session.courseType} on ${new Date(nextCourse.session.sessionDate).toLocaleDateString()}`, 'polite');
      } else {
        announce('Dashboard loaded. No upcoming courses found.', 'polite');
      }
      
      // Track successful load
      analytics.trackPageView('/client/dashboard', {
        hasUpcomingCourses: upcomingCourses.length > 0,
        stats,
      });
    }
  }, [loading, nextCourse, upcomingCourses, stats, announce]);
  
  // Retry with error recovery
  const handleRetry = React.useCallback(async () => {
    try {
      await ErrorRecovery.retry(
        refreshData,
        {
          maxAttempts: 3,
          onRetry: (error, attempt) => {
            analytics.trackError(error, { attempt, page: 'dashboard' });
          },
        }
      );
    } catch (retryError) {
      console.error('Retry failed:', retryError);
    }
  }, [refreshData]);

  // Show offline indicator
  const offlineIndicator = !isOnline && (
    <div className="fixed top-20 right-2 sm:right-4 bg-yellow-500 text-white px-3 sm:px-4 py-2 rounded-lg shadow-lg z-50 max-w-xs">
      <p className="text-xs sm:text-sm font-medium">You're offline - Some features may be limited</p>
    </div>
  );

  return (
    <>
      {offlineIndicator}
      <LoadingState
        isLoading={loading}
        error={error}
        loadingComponent={<DashboardSkeleton />}
        onRetry={handleRetry}
        className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8"
      >
        <div className="space-y-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            My Training Dashboard
          </h1>
          <p className="mt-2 text-gray-600 dark:text-gray-400">
            Manage your upcoming first aid training courses
          </p>
        </div>

        {/* Stats Overview */}
        {stats && <DashboardStats stats={stats} />}

        {/* Next Course Highlight */}
        {nextCourse ? (
          <NextCourseCard course={nextCourse} onUpdate={refreshData} />
        ) : (
          <div className="mb-8">
            <EmptyState
              icon={Calendar}
              title="No Upcoming Courses"
              description="You don't have any courses booked yet."
              action={{
                label: "Browse Available Courses",
                href: "/courses",
              }}
            />
          </div>
        )}

        {/* Other Upcoming Courses */}
        {upcomingCourses.length > 1 && (
          <div className="mt-8">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
              All Upcoming Courses
            </h2>
            <CourseList 
              courses={upcomingCourses}
              onUpdate={refreshData}
            />
          </div>
        )}
        </div>
      </LoadingState>
    </>
  );
};

export default DashboardPage;