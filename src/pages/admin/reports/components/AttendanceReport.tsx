import React from 'react';
import {
  Users,
  UserCheck,
  UserX,
  TrendingUp,
  Award,
  Activity
} from 'lucide-react';
import { ReportData } from '../types';
import { cn } from '@utils/cn';

interface AttendanceReportProps {
  data: ReportData;
  dateRangeLabel: string;
}

export const AttendanceReport: React.FC<AttendanceReportProps> = ({ data, dateRangeLabel }) => {
  const attendanceRate = 100 - data.attendance.noShowRate;
  
  const attendanceMetrics = [
    {
      label: 'Completion Rate',
      value: data.attendance.completionRate,
      color: 'green',
      icon: UserCheck
    },
    {
      label: 'Attendance Rate',
      value: attendanceRate,
      color: 'blue',
      icon: Users
    },
    {
      label: 'No-Show Rate',
      value: data.attendance.noShowRate,
      color: 'red',
      icon: UserX
    }
  ];

  const getColorClasses = (color: string, type: 'bg' | 'text' | 'border') => {
    const colorMap = {
      green: {
        bg: 'bg-green-100',
        text: 'text-green-600',
        border: 'border-green-600'
      },
      blue: {
        bg: 'bg-blue-100',
        text: 'text-blue-600',
        border: 'border-blue-600'
      },
      red: {
        bg: 'bg-red-100',
        text: 'text-red-600',
        border: 'border-red-600'
      }
    };
    return colorMap[color as keyof typeof colorMap][type];
  };

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Attendees</p>
              <p className="text-2xl font-bold text-gray-900 mt-1">
                {data.attendance.totalAttendees}
              </p>
              <p className="text-sm text-gray-500 mt-2">{dateRangeLabel}</p>
            </div>
            <div className="p-3 bg-primary-100 rounded-lg">
              <Users className="h-6 w-6 text-primary-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Avg per Session</p>
              <p className="text-2xl font-bold text-gray-900 mt-1">
                {data.attendance.averagePerSession.toFixed(1)}
              </p>
              <p className="text-sm text-gray-500 mt-2">Participants</p>
            </div>
            <div className="p-3 bg-purple-100 rounded-lg">
              <Activity className="h-6 w-6 text-purple-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Completion Rate</p>
              <p className="text-2xl font-bold text-green-600 mt-1">
                {data.attendance.completionRate}%
              </p>
              <p className="text-sm text-gray-500 mt-2">Passed assessment</p>
            </div>
            <div className="p-3 bg-green-100 rounded-lg">
              <Award className="h-6 w-6 text-green-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">No-Show Rate</p>
              <p className="text-2xl font-bold text-red-600 mt-1">
                {data.attendance.noShowRate}%
              </p>
              <p className="text-sm text-gray-500 mt-2">Missed sessions</p>
            </div>
            <div className="p-3 bg-red-100 rounded-lg">
              <UserX className="h-6 w-6 text-red-600" />
            </div>
          </div>
        </div>
      </div>

      {/* Attendance Metrics */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-6">Attendance Performance</h3>
        <div className="space-y-6">
          {attendanceMetrics.map((metric) => {
            const Icon = metric.icon;
            return (
              <div key={metric.label}>
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <Icon className={cn("h-5 w-5", getColorClasses(metric.color, 'text'))} />
                    <span className="text-sm font-medium text-gray-700">{metric.label}</span>
                  </div>
                  <span className={cn("text-lg font-bold", getColorClasses(metric.color, 'text'))}>
                    {metric.value}%
                  </span>
                </div>
                <div className="relative">
                  <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
                    <div 
                      className={cn("h-full rounded-full transition-all duration-500", 
                        metric.color === 'green' ? 'bg-green-500' :
                        metric.color === 'blue' ? 'bg-blue-500' :
                        'bg-red-500'
                      )}
                      style={{ width: `${metric.value}%` }}
                    />
                  </div>
                  {/* Benchmark lines */}
                  <div className="absolute top-0 left-[80%] w-0.5 h-3 bg-gray-400" />
                  <div className="absolute -bottom-5 left-[80%] transform -translate-x-1/2">
                    <span className="text-xs text-gray-500">Target</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Insights and Recommendations */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Key Insights</h3>
          <div className="space-y-4">
            <div className="flex items-start gap-3">
              <div className={cn(
                "p-2 rounded-lg flex-shrink-0",
                attendanceRate >= 90 ? "bg-green-100" : attendanceRate >= 80 ? "bg-yellow-100" : "bg-red-100"
              )}>
                <TrendingUp className={cn(
                  "h-5 w-5",
                  attendanceRate >= 90 ? "text-green-600" : attendanceRate >= 80 ? "text-yellow-600" : "text-red-600"
                )} />
              </div>
              <div>
                <p className="font-medium text-gray-900">Attendance Performance</p>
                <p className="text-sm text-gray-600 mt-1">
                  {attendanceRate >= 90 
                    ? "Excellent attendance rate indicates strong engagement and course value."
                    : attendanceRate >= 80
                      ? "Good attendance rate, but there's room for improvement."
                      : "Below-average attendance rate. Consider reviewing reminder processes."}
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <div className={cn(
                "p-2 rounded-lg flex-shrink-0",
                data.attendance.completionRate >= 95 ? "bg-green-100" : "bg-yellow-100"
              )}>
                <Award className={cn(
                  "h-5 w-5",
                  data.attendance.completionRate >= 95 ? "text-green-600" : "text-yellow-600"
                )} />
              </div>
              <div>
                <p className="font-medium text-gray-900">Completion Success</p>
                <p className="text-sm text-gray-600 mt-1">
                  {data.attendance.completionRate >= 95 
                    ? "Outstanding completion rate shows effective training delivery."
                    : "Completion rate could be improved. Review assessment difficulty and support."}
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Recommendations</h3>
          <ul className="space-y-3">
            {data.attendance.noShowRate > 10 && (
              <li className="flex items-start gap-2">
                <span className="text-primary-600 font-bold">•</span>
                <span className="text-sm text-gray-700">
                  Implement SMS reminders 24 hours before sessions to reduce no-shows
                </span>
              </li>
            )}
            {data.attendance.averagePerSession < 8 && (
              <li className="flex items-start gap-2">
                <span className="text-primary-600 font-bold">•</span>
                <span className="text-sm text-gray-700">
                  Consider marketing campaigns to increase session participation
                </span>
              </li>
            )}
            {data.attendance.completionRate < 90 && (
              <li className="flex items-start gap-2">
                <span className="text-primary-600 font-bold">•</span>
                <span className="text-sm text-gray-700">
                  Review training materials and provide additional support resources
                </span>
              </li>
            )}
            <li className="flex items-start gap-2">
              <span className="text-primary-600 font-bold">•</span>
              <span className="text-sm text-gray-700">
                Continue monitoring attendance patterns to identify trends
              </span>
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
};