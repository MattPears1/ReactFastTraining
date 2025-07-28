import React from "react";
import {
  Calendar,
  CheckCircle,
  XCircle,
  AlertCircle,
  RefreshCw,
  TrendingUp,
} from "lucide-react";
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from "recharts";
import { ReportData } from "../types";
import { cn } from "@utils/cn";

interface BookingsReportProps {
  data: ReportData;
  dateRangeLabel: string;
}

export const BookingsReport: React.FC<BookingsReportProps> = ({
  data,
  dateRangeLabel,
}) => {
  const bookingStatusData = [
    { name: "Completed", value: data.bookings.completed, color: "#10B981" },
    { name: "Cancelled", value: data.bookings.cancelled, color: "#EF4444" },
    { name: "Refunded", value: data.bookings.refunded, color: "#F59E0B" },
  ];

  const completionRate = (data.bookings.completed / data.bookings.total) * 100;
  const cancellationRate =
    (data.bookings.cancelled / data.bookings.total) * 100;

  const CustomTooltip = ({
    active,
    payload,
    label,
  }: {
    active?: boolean;
    payload?: Array<{ value: number }>;
    label?: string;
  }) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white p-3 rounded-lg shadow-lg border border-gray-200">
          <p className="text-sm font-medium text-gray-900">{label}</p>
          <p className="text-sm text-gray-600">Bookings: {payload[0].value}</p>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">
                Total Bookings
              </p>
              <p className="text-2xl font-bold text-gray-900 mt-1">
                {data.bookings.total}
              </p>
              <p className="text-sm text-gray-500 mt-2">{dateRangeLabel}</p>
            </div>
            <div className="p-3 bg-primary-100 rounded-lg">
              <Calendar className="h-6 w-6 text-primary-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Completed</p>
              <p className="text-2xl font-bold text-green-600 mt-1">
                {data.bookings.completed}
              </p>
              <p className="text-sm text-gray-500 mt-2">
                {completionRate.toFixed(1)}% rate
              </p>
            </div>
            <div className="p-3 bg-green-100 rounded-lg">
              <CheckCircle className="h-6 w-6 text-green-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Cancelled</p>
              <p className="text-2xl font-bold text-red-600 mt-1">
                {data.bookings.cancelled}
              </p>
              <p className="text-sm text-gray-500 mt-2">
                {cancellationRate.toFixed(1)}% rate
              </p>
            </div>
            <div className="p-3 bg-red-100 rounded-lg">
              <XCircle className="h-6 w-6 text-red-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Refunded</p>
              <p className="text-2xl font-bold text-yellow-600 mt-1">
                {data.bookings.refunded}
              </p>
              <p className="text-sm text-gray-500 mt-2">
                {((data.bookings.refunded / data.bookings.total) * 100).toFixed(
                  1,
                )}
                % rate
              </p>
            </div>
            <div className="p-3 bg-yellow-100 rounded-lg">
              <RefreshCw className="h-6 w-6 text-yellow-600" />
            </div>
          </div>
        </div>
      </div>

      {/* Booking Trend Chart */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4">
          Booking Trend
        </h3>
        <div className="h-80">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={data.bookings.trend}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
              <XAxis dataKey="date" stroke="#6b7280" fontSize={12} />
              <YAxis stroke="#6b7280" fontSize={12} />
              <Tooltip content={<CustomTooltip />} />
              <Line
                type="monotone"
                dataKey="count"
                stroke="#0EA5E9"
                strokeWidth={2}
                dot={{ fill: "#0EA5E9", r: 4 }}
                activeDot={{ r: 6 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Booking Status Distribution */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">
            Booking Status Distribution
          </h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={bookingStatusData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
                <XAxis dataKey="name" stroke="#6b7280" fontSize={12} />
                <YAxis stroke="#6b7280" fontSize={12} />
                <Tooltip />
                <Bar dataKey="value" radius={[4, 4, 0, 0]}>
                  {bookingStatusData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">
            Booking Metrics
          </h3>
          <div className="space-y-4">
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-gray-700">
                  Completion Rate
                </span>
                <span className="text-sm font-bold text-green-600">
                  {completionRate.toFixed(1)}%
                </span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className="bg-green-600 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${completionRate}%` }}
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-gray-700">
                  Cancellation Rate
                </span>
                <span className="text-sm font-bold text-red-600">
                  {cancellationRate.toFixed(1)}%
                </span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className="bg-red-600 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${cancellationRate}%` }}
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-gray-700">
                  Refund Rate
                </span>
                <span className="text-sm font-bold text-yellow-600">
                  {(
                    (data.bookings.refunded / data.bookings.total) *
                    100
                  ).toFixed(1)}
                  %
                </span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className="bg-yellow-600 h-2 rounded-full transition-all duration-300"
                  style={{
                    width: `${(data.bookings.refunded / data.bookings.total) * 100}%`,
                  }}
                />
              </div>
            </div>
          </div>

          <div className="mt-6 p-4 bg-blue-50 rounded-lg">
            <div className="flex items-start gap-3">
              <AlertCircle className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" />
              <div className="text-sm">
                <p className="font-medium text-blue-900">Performance Insight</p>
                <p className="text-blue-700 mt-1">
                  {completionRate > 80
                    ? "Excellent completion rate! Keep up the good work."
                    : cancellationRate > 20
                      ? "High cancellation rate detected. Consider reviewing your booking policies."
                      : "Booking performance is within normal range."}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
