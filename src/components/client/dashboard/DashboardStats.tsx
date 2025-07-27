import React from 'react';
import { BookOpen, Award, Users, Calendar } from 'lucide-react';
import type { UserStats } from '@/types/client';

interface DashboardStatsProps {
  stats: UserStats;
}

export const DashboardStats: React.FC<DashboardStatsProps> = ({ stats }) => {
  const statCards = [
    {
      icon: BookOpen,
      label: 'Total Bookings',
      value: stats.totalBookings,
      color: 'text-blue-600',
      bgColor: 'bg-blue-100 dark:bg-blue-900/30',
    },
    {
      icon: Award,
      label: 'Certificates Earned',
      value: stats.certificatesEarned,
      color: 'text-green-600',
      bgColor: 'bg-green-100 dark:bg-green-900/30',
    },
    {
      icon: Users,
      label: 'People Trained',
      value: stats.totalAttendees,
      color: 'text-purple-600',
      bgColor: 'bg-purple-100 dark:bg-purple-900/30',
    },
    {
      icon: Calendar,
      label: 'Courses Completed',
      value: stats.completedCourses,
      color: 'text-orange-600',
      bgColor: 'bg-orange-100 dark:bg-orange-900/30',
    },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-8">
      {statCards.map((stat, index) => {
        const Icon = stat.icon;
        return (
          <div key={index} className="bg-white dark:bg-gray-800 rounded-lg shadow p-4 sm:p-6">
            <div className="flex items-center justify-between mb-2">
              <div className={`p-1.5 sm:p-2 rounded-lg ${stat.bgColor}`}>
                <Icon className={`w-5 h-5 sm:w-6 sm:h-6 ${stat.color}`} />
              </div>
              <span className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white">
                {stat.value}
              </span>
            </div>
            <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400">{stat.label}</p>
          </div>
        );
      })}
    </div>
  );
};