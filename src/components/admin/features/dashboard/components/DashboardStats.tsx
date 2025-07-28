import React from "react";
import {
  Calendar,
  Users,
  PoundSterling,
  AlertCircle,
  TrendingUp,
} from "lucide-react";
import { cn } from "@utils/cn";

interface StatCardProps {
  title: string;
  value: string | number;
  change?: string;
  changeType?: "increase" | "decrease" | "neutral";
  icon: React.ElementType;
  color: "blue" | "green" | "purple" | "red" | "yellow";
  alert?: boolean;
}

export const DashboardStats: React.FC<{ stats: any }> = ({ stats }) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      <StatCard
        title="Today's Bookings"
        value={stats.today.count}
        change={`£${stats.today.revenue.toFixed(2)} revenue`}
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
        change="+12% from last week"
        changeType="increase"
        icon={PoundSterling}
        color="purple"
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
  );
};

const StatCard: React.FC<StatCardProps> = ({
  title,
  value,
  change,
  changeType,
  icon: Icon,
  color,
  alert,
}) => {
  const colorClasses = {
    blue: {
      bg: "bg-blue-50 dark:bg-blue-900/20",
      icon: "bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400",
      border: alert ? "ring-2 ring-blue-500" : "",
    },
    green: {
      bg: "bg-green-50 dark:bg-green-900/20",
      icon: "bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-400",
      border: alert ? "ring-2 ring-green-500" : "",
    },
    purple: {
      bg: "bg-purple-50 dark:bg-purple-900/20",
      icon: "bg-purple-100 text-purple-600 dark:bg-purple-900/30 dark:text-purple-400",
      border: alert ? "ring-2 ring-purple-500" : "",
    },
    red: {
      bg: "bg-red-50 dark:bg-red-900/20",
      icon: "bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400",
      border: alert ? "ring-2 ring-red-500" : "",
    },
    yellow: {
      bg: "bg-yellow-50 dark:bg-yellow-900/20",
      icon: "bg-yellow-100 text-yellow-600 dark:bg-yellow-900/30 dark:text-yellow-400",
      border: alert ? "ring-2 ring-yellow-500" : "",
    },
  };

  return (
    <div
      className={cn(
        "bg-white dark:bg-gray-800 rounded-lg shadow-sm hover:shadow-md transition-shadow p-6",
        colorClasses[color].border,
      )}
    >
      <div className="flex items-center justify-between">
        <div className="flex-1">
          <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
            {title}
          </p>
          <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">
            {value}
          </p>
          {change && (
            <div className="flex items-center gap-1 mt-2">
              {changeType === "increase" && (
                <TrendingUp className="w-4 h-4 text-green-500" />
              )}
              {changeType === "decrease" && (
                <TrendingUp className="w-4 h-4 text-red-500 rotate-180" />
              )}
              <p
                className={cn(
                  "text-sm",
                  changeType === "increase" &&
                    "text-green-600 dark:text-green-400",
                  changeType === "decrease" && "text-red-600 dark:text-red-400",
                  !changeType && "text-gray-500 dark:text-gray-400",
                )}
              >
                {change}
              </p>
            </div>
          )}
        </div>
        <div
          className={cn(
            "w-12 h-12 rounded-lg flex items-center justify-center",
            colorClasses[color].icon,
          )}
        >
          <Icon className="w-6 h-6" />
        </div>
      </div>
    </div>
  );
};
