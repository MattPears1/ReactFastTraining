import React from "react";
import {
  Users,
  BarChart3,
  Award,
  AlertCircle,
  TrendingUp,
} from "lucide-react";
import { ReportData } from "../types";

interface AttendanceMetricsProps {
  reportData: ReportData;
}

export const AttendanceMetrics: React.FC<AttendanceMetricsProps> = ({ reportData }) => {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Attendance Metrics */}
        <div className="space-y-4">
          <h3 className="text-lg font-medium text-gray-900 dark:text-white">
            Attendance Overview
          </h3>
          <div className="space-y-3">
            <MetricCard
              title="Total Attendees"
              value={reportData.attendance.totalAttendees}
              icon={Users}
              iconColor="text-primary-600"
              bgColor="bg-gray-50 dark:bg-gray-700/50"
            />
            <MetricCard
              title="Average per Session"
              value={reportData.attendance.averagePerSession}
              icon={BarChart3}
              iconColor="text-blue-600"
              bgColor="bg-gray-50 dark:bg-gray-700/50"
            />
            <MetricCard
              title="Completion Rate"
              value={`${reportData.attendance.completionRate}%`}
              icon={Award}
              iconColor="text-green-600"
              bgColor="bg-green-50 dark:bg-green-900/20"
              textColor="text-green-700 dark:text-green-300"
              valueColor="text-green-900 dark:text-green-100"
            />
            <MetricCard
              title="No-Show Rate"
              value={`${reportData.attendance.noShowRate}%`}
              icon={AlertCircle}
              iconColor="text-red-600"
              bgColor="bg-red-50 dark:bg-red-900/20"
              textColor="text-red-700 dark:text-red-300"
              valueColor="text-red-900 dark:text-red-100"
            />
          </div>
        </div>

        {/* Attendance Insights */}
        <div className="space-y-4">
          <h3 className="text-lg font-medium text-gray-900 dark:text-white">
            Key Insights
          </h3>
          <div className="space-y-3">
            <InsightCard
              type="success"
              title="High Completion Rate"
              description={`Your completion rate of ${reportData.attendance.completionRate}% is above industry average.`}
              icon={TrendingUp}
            />
            <InsightCard
              type="warning"
              title="No-Show Impact"
              description={`${reportData.attendance.noShowRate}% no-show rate represents approximately £2,287 in lost revenue.`}
              icon={AlertCircle}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

interface MetricCardProps {
  title: string;
  value: string | number;
  icon: React.ComponentType<{ className?: string }>;
  iconColor: string;
  bgColor: string;
  textColor?: string;
  valueColor?: string;
}

const MetricCard: React.FC<MetricCardProps> = ({
  title,
  value,
  icon: Icon,
  iconColor,
  bgColor,
  textColor = "text-gray-600 dark:text-gray-400",
  valueColor = "text-gray-900 dark:text-white",
}) => {
  return (
    <div className={`${bgColor} rounded-lg p-4`}>
      <div className="flex items-center justify-between">
        <div>
          <p className={`text-sm ${textColor}`}>{title}</p>
          <p className={`text-2xl font-bold ${valueColor} mt-1`}>{value}</p>
        </div>
        <Icon className={`w-8 h-8 ${iconColor}`} />
      </div>
    </div>
  );
};

interface InsightCardProps {
  type: "success" | "warning";
  title: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
}

const InsightCard: React.FC<InsightCardProps> = ({
  type,
  title,
  description,
  icon: Icon,
}) => {
  const styles = {
    success: {
      bg: "bg-blue-50 dark:bg-blue-900/20",
      border: "border-blue-200 dark:border-blue-800",
      icon: "text-blue-600 dark:text-blue-400",
      title: "text-blue-900 dark:text-blue-100",
      text: "text-blue-700 dark:text-blue-300",
    },
    warning: {
      bg: "bg-yellow-50 dark:bg-yellow-900/20",
      border: "border-yellow-200 dark:border-yellow-800",
      icon: "text-yellow-600 dark:text-yellow-400",
      title: "text-yellow-900 dark:text-yellow-100",
      text: "text-yellow-700 dark:text-yellow-300",
    },
  };

  const style = styles[type];

  return (
    <div className={`${style.bg} border ${style.border} rounded-lg p-4`}>
      <div className="flex items-start gap-3">
        <Icon className={`w-5 h-5 ${style.icon} mt-0.5`} />
        <div>
          <p className={`text-sm font-medium ${style.title}`}>{title}</p>
          <p className={`text-sm ${style.text} mt-1`}>{description}</p>
        </div>
      </div>
    </div>
  );
};