import React from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { Activity, AlertCircle, TrendingDown, CheckCircle } from "lucide-react";
import { ReportData } from "../types";

interface BookingTrendsProps {
  reportData: ReportData;
}

export const BookingTrends: React.FC<BookingTrendsProps> = ({ reportData }) => {
  return (
    <div className="space-y-6">
      {/* Booking Trend Chart */}
      <div>
        <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
          Booking Volume Trend
        </h3>
        <div className="h-80">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={reportData.bookings.trend}>
              <CartesianGrid
                strokeDasharray="3 3"
                className="stroke-gray-200 dark:stroke-gray-700"
              />
              <XAxis
                dataKey="date"
                className="text-gray-600 dark:text-gray-400"
              />
              <YAxis className="text-gray-600 dark:text-gray-400" />
              <Tooltip
                contentStyle={{
                  backgroundColor: "rgba(255, 255, 255, 0.95)",
                  border: "1px solid #e5e7eb",
                  borderRadius: "0.375rem",
                }}
              />
              <Bar
                dataKey="count"
                fill="#10B981"
                radius={[8, 8, 0, 0]}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Booking Status Breakdown */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <BookingStatusCard
          title="Completed"
          value={reportData.bookings.completed}
          percentage={((reportData.bookings.completed / reportData.bookings.total) * 100).toFixed(1)}
          color="green"
          icon={CheckCircle}
        />
        <BookingStatusCard
          title="Cancelled"
          value={reportData.bookings.cancelled}
          percentage={((reportData.bookings.cancelled / reportData.bookings.total) * 100).toFixed(1)}
          color="yellow"
          icon={AlertCircle}
        />
        <BookingStatusCard
          title="Refunded"
          value={reportData.bookings.refunded}
          percentage={((reportData.bookings.refunded / reportData.bookings.total) * 100).toFixed(1)}
          color="red"
          icon={TrendingDown}
        />
        <BookingStatusCard
          title="Active"
          value={
            reportData.bookings.total -
            reportData.bookings.completed -
            reportData.bookings.cancelled -
            reportData.bookings.refunded
          }
          subtitle="Upcoming sessions"
          color="blue"
          icon={Activity}
        />
      </div>
    </div>
  );
};

interface BookingStatusCardProps {
  title: string;
  value: number;
  percentage?: string;
  subtitle?: string;
  color: "green" | "yellow" | "red" | "blue";
  icon: React.ComponentType<{ className?: string }>;
}

const BookingStatusCard: React.FC<BookingStatusCardProps> = ({
  title,
  value,
  percentage,
  subtitle,
  color,
  icon: Icon,
}) => {
  const colorClasses = {
    green: {
      bg: "bg-green-50 dark:bg-green-900/20",
      text: "text-green-900 dark:text-green-100",
      subtext: "text-green-700 dark:text-green-300",
      icon: "text-green-600",
    },
    yellow: {
      bg: "bg-yellow-50 dark:bg-yellow-900/20",
      text: "text-yellow-900 dark:text-yellow-100",
      subtext: "text-yellow-700 dark:text-yellow-300",
      icon: "text-yellow-600",
    },
    red: {
      bg: "bg-red-50 dark:bg-red-900/20",
      text: "text-red-900 dark:text-red-100",
      subtext: "text-red-700 dark:text-red-300",
      icon: "text-red-600",
    },
    blue: {
      bg: "bg-blue-50 dark:bg-blue-900/20",
      text: "text-blue-900 dark:text-blue-100",
      subtext: "text-blue-700 dark:text-blue-300",
      icon: "text-blue-600",
    },
  };

  const classes = colorClasses[color];

  return (
    <div className={`${classes.bg} rounded-lg p-4`}>
      <div className="flex items-center justify-between mb-2">
        <span className={`text-sm font-medium ${classes.text}`}>
          {title}
        </span>
        <Icon className={`w-5 h-5 ${classes.icon}`} />
      </div>
      <p className={`text-2xl font-bold ${classes.text}`}>
        {value}
      </p>
      <p className={`text-xs ${classes.subtext} mt-1`}>
        {percentage ? `${percentage}% of total` : subtitle}
      </p>
    </div>
  );
};