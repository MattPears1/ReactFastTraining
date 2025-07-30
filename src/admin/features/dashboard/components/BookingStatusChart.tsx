import React from "react";
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Legend,
  Tooltip,
} from "recharts";

interface BookingStatusData {
  status: string;
  count: number;
  percentage: number;
}

interface BookingStatusChartProps {
  data: BookingStatusData[];
}

const COLORS = {
  Confirmed: "#10B981",
  Pending: "#F59E0B",
  Cancelled: "#EF4444",
  Completed: "#3B82F6",
  confirmed: "#10B981",
  pending: "#F59E0B",
  cancelled: "#EF4444",
  completed: "#3B82F6",
};

export const BookingStatusChart: React.FC<BookingStatusChartProps> = ({
  data,
}) => {
  // Ensure we have valid data
  const validData =
    data && data.length > 0 && data.some((item) => item.count > 0);

  // If no valid data, use placeholder data
  const chartData = validData
    ? data
    : [
        { status: "Confirmed", count: 0, percentage: 0 },
        { status: "Pending", count: 0, percentage: 0 },
        { status: "Cancelled", count: 0, percentage: 0 },
      ];

  // Calculate total for percentage display
  const total = chartData.reduce((sum, item) => sum + item.count, 0);

  // Custom label to show both count and percentage
  const renderCustomLabel = (entry: any) => {
    if (!validData || total === 0) return "";
    const percent = ((entry.count / total) * 100).toFixed(0);
    return `${percent}%`;
  };

  // Custom legend to show count alongside status
  const renderLegend = (props: any) => {
    const { payload } = props;
    return (
      <ul className="flex flex-col space-y-2 mt-4">
        {payload.map((entry: any, index: number) => (
          <li
            key={`item-${index}`}
            className="flex items-center justify-between text-sm"
          >
            <span className="flex items-center">
              <span
                className="w-3 h-3 rounded-full mr-2"
                style={{ backgroundColor: entry.color }}
              />
              <span className="text-gray-600">{entry.value}</span>
            </span>
            <span className="font-medium text-gray-900">
              {chartData[index]?.count || 0}
            </span>
          </li>
        ))}
      </ul>
    );
  };

  return (
    <div className="h-80 w-full relative">
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={chartData}
            cx="50%"
            cy="45%"
            labelLine={false}
            label={renderCustomLabel}
            outerRadius={80}
            fill="#8884d8"
            dataKey="count"
          >
            {chartData.map((entry, index) => (
              <Cell
                key={`cell-${index}`}
                fill={COLORS[entry.status as keyof typeof COLORS] || "#8884d8"}
              />
            ))}
          </Pie>
          <Tooltip
            formatter={(value: any) => [`${value} bookings`, ""]}
            contentStyle={{
              backgroundColor: "rgba(255, 255, 255, 0.95)",
              border: "1px solid #e5e7eb",
              borderRadius: "6px",
            }}
          />
          <Legend
            content={renderLegend}
            verticalAlign="bottom"
            align="center"
          />
        </PieChart>
      </ResponsiveContainer>
      {!validData && (
        <div className="absolute inset-0 flex items-center justify-center bg-white bg-opacity-80">
          <p className="text-gray-500 text-sm">No booking data available</p>
        </div>
      )}
    </div>
  );
};
