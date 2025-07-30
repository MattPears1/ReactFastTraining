import React from "react";
import {
  LineChart,
  Line,
  PieChart as RePieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { AlertCircle } from "lucide-react";
import { ReportData } from "../types";
import { CHART_COLORS } from "../constants";

interface RevenueAnalysisProps {
  reportData: ReportData;
}

export const RevenueAnalysis: React.FC<RevenueAnalysisProps> = ({ reportData }) => {
  return (
    <div className="space-y-6">
      {/* Revenue Trend Chart */}
      <div>
        <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
          Revenue Trend
        </h3>
        <div className="h-80">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={reportData.revenue.byMonth}>
              <CartesianGrid
                strokeDasharray="3 3"
                className="stroke-gray-200 dark:stroke-gray-700"
              />
              <XAxis
                dataKey="month"
                className="text-gray-600 dark:text-gray-400"
              />
              <YAxis
                className="text-gray-600 dark:text-gray-400"
                tickFormatter={(value) => `£${value}`}
              />
              <Tooltip
                formatter={(value: number) => `£${value}`}
                contentStyle={{
                  backgroundColor: "rgba(255, 255, 255, 0.95)",
                  border: "1px solid #e5e7eb",
                  borderRadius: "0.375rem",
                }}
              />
              <Line
                type="monotone"
                dataKey="amount"
                stroke="#0EA5E9"
                strokeWidth={2}
                dot={{ fill: "#0EA5E9", r: 4 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Revenue by Course */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div>
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
            Revenue by Course Type
          </h3>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <RePieChart>
                <Pie
                  data={reportData.revenue.byCourse}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={(entry) => `${entry.percentage}%`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="amount"
                >
                  {reportData.revenue.byCourse.map((entry, index) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={CHART_COLORS[index % CHART_COLORS.length]}
                    />
                  ))}
                </Pie>
                <Tooltip formatter={(value: number) => `£${value}`} />
              </RePieChart>
            </ResponsiveContainer>
          </div>
          <div className="mt-4 space-y-2">
            {reportData.revenue.byCourse.map((course, index) => (
              <div
                key={course.course}
                className="flex items-center justify-between"
              >
                <div className="flex items-center gap-2">
                  <div
                    className="w-3 h-3 rounded-full"
                    style={{
                      backgroundColor: CHART_COLORS[index % CHART_COLORS.length],
                    }}
                  />
                  <span className="text-sm text-gray-600 dark:text-gray-400">
                    {course.course}
                  </span>
                </div>
                <span className="text-sm font-medium text-gray-900 dark:text-white">
                  £{course.amount.toLocaleString()}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Revenue Stats */}
        <div className="space-y-4">
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
            Revenue Statistics
          </h3>
          <div className="space-y-4">
            <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-gray-600 dark:text-gray-400">
                  Average Revenue per Booking
                </span>
                <span className="font-medium text-gray-900 dark:text-white">
                  £
                  {(
                    reportData.revenue.total / reportData.bookings.total
                  ).toFixed(2)}
                </span>
              </div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-gray-600 dark:text-gray-400">
                  Monthly Average
                </span>
                <span className="font-medium text-gray-900 dark:text-white">
                  £{(reportData.revenue.total / 5).toFixed(2)}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600 dark:text-gray-400">
                  Refund Rate
                </span>
                <span className="font-medium text-gray-900 dark:text-white">
                  {(
                    (reportData.bookings.refunded /
                      reportData.bookings.total) *
                    100
                  ).toFixed(1)}
                  %
                </span>
              </div>
            </div>

            <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4">
              <div className="flex items-start gap-3">
                <AlertCircle className="w-5 h-5 text-yellow-600 dark:text-yellow-400 mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-yellow-900 dark:text-yellow-100">
                    Revenue Opportunity
                  </p>
                  <p className="text-sm text-yellow-700 dark:text-yellow-300 mt-1">
                    Increasing course capacity by 20% could generate an
                    additional £9,150 in revenue.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};