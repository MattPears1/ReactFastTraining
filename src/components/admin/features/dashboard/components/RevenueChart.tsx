import React, { useMemo } from "react";
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
  Legend,
  Area,
  AreaChart,
} from "recharts";
import { format } from "date-fns";

interface RevenueChartProps {
  data: {
    dailyStats: Array<{
      date: string;
      bookings: number;
      revenue: number;
      attendees: number;
    }>;
    coursePopularity: Array<{
      courseType: string;
      bookings: number;
      attendees: number;
      revenue: number;
    }>;
  };
}

export const RevenueChart: React.FC<RevenueChartProps> = ({ data }) => {
  const [chartType, setChartType] = React.useState<
    "revenue" | "bookings" | "combined"
  >("combined");

  const chartData = useMemo(() => {
    return data.dailyStats.map((stat) => ({
      ...stat,
      date: format(new Date(stat.date), "MMM dd"),
      formattedRevenue: `£${stat.revenue.toFixed(2)}`,
    }));
  }, [data.dailyStats]);

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white dark:bg-gray-800 p-3 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700">
          <p className="font-medium text-gray-900 dark:text-white mb-1">
            {label}
          </p>
          {payload.map((entry: any, index: number) => (
            <p key={index} className="text-sm" style={{ color: entry.color }}>
              {entry.name}:{" "}
              {entry.name === "Revenue"
                ? `£${entry.value.toFixed(2)}`
                : entry.value}
            </p>
          ))}
        </div>
      );
    }
    return null;
  };

  return (
    <div className="space-y-4">
      {/* Chart Type Selector */}
      <div className="flex gap-2">
        <button
          onClick={() => setChartType("combined")}
          className={`px-3 py-1 text-sm rounded-lg transition-colors ${
            chartType === "combined"
              ? "bg-primary-100 text-primary-700 dark:bg-primary-900/30 dark:text-primary-400"
              : "text-gray-600 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-700"
          }`}
        >
          Combined View
        </button>
        <button
          onClick={() => setChartType("revenue")}
          className={`px-3 py-1 text-sm rounded-lg transition-colors ${
            chartType === "revenue"
              ? "bg-primary-100 text-primary-700 dark:bg-primary-900/30 dark:text-primary-400"
              : "text-gray-600 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-700"
          }`}
        >
          Revenue Only
        </button>
        <button
          onClick={() => setChartType("bookings")}
          className={`px-3 py-1 text-sm rounded-lg transition-colors ${
            chartType === "bookings"
              ? "bg-primary-100 text-primary-700 dark:bg-primary-900/30 dark:text-primary-400"
              : "text-gray-600 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-700"
          }`}
        >
          Bookings Only
        </button>
      </div>

      {/* Chart */}
      <div className="h-80">
        <ResponsiveContainer width="100%" height="100%">
          {chartType === "combined" ? (
            <LineChart
              data={chartData}
              margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
              <XAxis
                dataKey="date"
                tick={{ fontSize: 12, fill: "#6b7280" }}
                stroke="#e5e7eb"
              />
              <YAxis
                yAxisId="left"
                tick={{ fontSize: 12, fill: "#6b7280" }}
                stroke="#e5e7eb"
                label={{
                  value: "Revenue (£)",
                  angle: -90,
                  position: "insideLeft",
                }}
              />
              <YAxis
                yAxisId="right"
                orientation="right"
                tick={{ fontSize: 12, fill: "#6b7280" }}
                stroke="#e5e7eb"
                label={{
                  value: "Bookings",
                  angle: 90,
                  position: "insideRight",
                }}
              />
              <Tooltip content={<CustomTooltip />} />
              <Legend />
              <Line
                yAxisId="left"
                type="monotone"
                dataKey="revenue"
                stroke="#8b5cf6"
                strokeWidth={2}
                name="Revenue"
                dot={{ r: 4 }}
                activeDot={{ r: 6 }}
              />
              <Line
                yAxisId="right"
                type="monotone"
                dataKey="bookings"
                stroke="#10b981"
                strokeWidth={2}
                name="Bookings"
                dot={{ r: 4 }}
                activeDot={{ r: 6 }}
              />
            </LineChart>
          ) : chartType === "revenue" ? (
            <AreaChart
              data={chartData}
              margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
              <XAxis
                dataKey="date"
                tick={{ fontSize: 12, fill: "#6b7280" }}
                stroke="#e5e7eb"
              />
              <YAxis
                tick={{ fontSize: 12, fill: "#6b7280" }}
                stroke="#e5e7eb"
                label={{
                  value: "Revenue (£)",
                  angle: -90,
                  position: "insideLeft",
                }}
              />
              <Tooltip content={<CustomTooltip />} />
              <Area
                type="monotone"
                dataKey="revenue"
                stroke="#8b5cf6"
                fill="#8b5cf6"
                fillOpacity={0.2}
                strokeWidth={2}
                name="Revenue"
              />
            </AreaChart>
          ) : (
            <BarChart
              data={chartData}
              margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
              <XAxis
                dataKey="date"
                tick={{ fontSize: 12, fill: "#6b7280" }}
                stroke="#e5e7eb"
              />
              <YAxis
                tick={{ fontSize: 12, fill: "#6b7280" }}
                stroke="#e5e7eb"
                label={{ value: "Count", angle: -90, position: "insideLeft" }}
              />
              <Tooltip content={<CustomTooltip />} />
              <Legend />
              <Bar
                dataKey="bookings"
                fill="#10b981"
                name="Bookings"
                radius={[4, 4, 0, 0]}
              />
              <Bar
                dataKey="attendees"
                fill="#3b82f6"
                name="Attendees"
                radius={[4, 4, 0, 0]}
              />
            </BarChart>
          )}
        </ResponsiveContainer>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-3 gap-4 pt-4 border-t border-gray-200 dark:border-gray-700">
        <div className="text-center">
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Total Revenue
          </p>
          <p className="text-lg font-semibold text-gray-900 dark:text-white">
            £
            {data.dailyStats
              .reduce((sum, stat) => sum + stat.revenue, 0)
              .toFixed(2)}
          </p>
        </div>
        <div className="text-center">
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Total Bookings
          </p>
          <p className="text-lg font-semibold text-gray-900 dark:text-white">
            {data.dailyStats.reduce((sum, stat) => sum + stat.bookings, 0)}
          </p>
        </div>
        <div className="text-center">
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Avg per Day
          </p>
          <p className="text-lg font-semibold text-gray-900 dark:text-white">
            £
            {(
              data.dailyStats.reduce((sum, stat) => sum + stat.revenue, 0) /
              data.dailyStats.length
            ).toFixed(2)}
          </p>
        </div>
      </div>
    </div>
  );
};
