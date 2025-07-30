import React from "react";
import { ReportData, CoursePerformance as CoursePerformanceType } from "../types";
import { MOCK_COURSE_PERFORMANCE } from "../constants";

interface CoursePerformanceProps {
  reportData: ReportData;
}

export const CoursePerformance: React.FC<CoursePerformanceProps> = ({ reportData }) => {
  return (
    <div className="space-y-6">
      {/* Course Performance Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <CourseMetricCard
          title="Most Popular Course"
          value={reportData.courses.mostPopular}
          subtitle="40% of all bookings"
        />
        <CourseMetricCard
          title="Total Sessions Delivered"
          value={reportData.courses.totalSessions}
          subtitle="Across all course types"
        />
        <CourseMetricCard
          title="Average Class Size"
          value={`${reportData.courses.averageCapacity} attendees`}
          subtitle={`${reportData.courses.utilizationRate}% capacity utilization`}
        />
      </div>

      {/* Course Performance Table */}
      <div>
        <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
          Course Performance Breakdown
        </h3>
        <CoursePerformanceTable courses={MOCK_COURSE_PERFORMANCE} />
      </div>
    </div>
  );
};

interface CourseMetricCardProps {
  title: string;
  value: string | number;
  subtitle: string;
}

const CourseMetricCard: React.FC<CourseMetricCardProps> = ({ title, value, subtitle }) => {
  return (
    <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-6">
      <h4 className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-2">
        {title}
      </h4>
      <p className="text-lg font-semibold text-gray-900 dark:text-white">
        {value}
      </p>
      <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
        {subtitle}
      </p>
    </div>
  );
};

interface CoursePerformanceTableProps {
  courses: CoursePerformanceType[];
}

const CoursePerformanceTable: React.FC<CoursePerformanceTableProps> = ({ courses }) => {
  return (
    <div className="overflow-x-auto">
      <table className="w-full">
        <thead className="bg-gray-50 dark:bg-gray-700">
          <tr>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
              Course Type
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
              Sessions
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
              Total Attendees
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
              Avg. Attendance
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
              Revenue
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
              Completion Rate
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
          {courses.map((course) => (
            <tr key={course.name}>
              <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">
                {course.name}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                {course.sessions}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                {course.attendees}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                {course.avg}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">
                £{course.revenue.toLocaleString()}
              </td>
              <td className="px-6 py-4 whitespace-nowrap">
                <div className="flex items-center">
                  <span className="text-sm text-gray-900 dark:text-white">
                    {course.completion}%
                  </span>
                  <div className="ml-3 w-24 bg-gray-200 dark:bg-gray-600 rounded-full h-2">
                    <div
                      className="bg-green-500 h-2 rounded-full"
                      style={{ width: `${course.completion}%` }}
                    />
                  </div>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};