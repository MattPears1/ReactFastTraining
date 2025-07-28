import React from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
  BarChart,
  Bar,
  ComposedChart,
} from "recharts";
import { format, parseISO } from "date-fns";

interface RevenueData {
  date: string;
  revenue: number;
  bookings: number;
}

interface RevenueChartProps {
  data: RevenueData[];
}

export const RevenueChart: React.FC<RevenueChartProps> = ({ data }) => {
  const formatDate = (dateStr: string) => {
    try {
      // Handle YYYY-MM format from backend
      if (dateStr && dateStr.match(/^\d{4}-\d{2}$/)) {
        return format(new Date(dateStr + "-01"), "MMM yyyy");
      }
      return format(parseISO(dateStr), "MMM d");
    } catch {
      return dateStr;
    }
  };

  const formatCurrency = (value: number) => {
    return `£${value.toLocaleString()}`;
  };

  // If no data, show empty chart with axes
  const chartData =
    data && data.length > 0
      ? data
      : [
          { date: "Jan", revenue: 0, bookings: 0 },
          { date: "Feb", revenue: 0, bookings: 0 },
          { date: "Mar", revenue: 0, bookings: 0 },
          { date: "Apr", revenue: 0, bookings: 0 },
          { date: "May", revenue: 0, bookings: 0 },
          { date: "Jun", revenue: 0, bookings: 0 },
        ];

  // Prepare data with proper formatting
  const formattedData = chartData.map((item) => ({
    ...item,
    formattedDate: data && data.length > 0 ? formatDate(item.date) : item.date,
  }));

  const hasData = data && data.length > 0;

  return (
    <div className="h-80 w-full relative">
      <ResponsiveContainer width="100%" height="100%">
        <ComposedChart
          data={formattedData}
          margin={{ top: 10, right: 30, left: 60, bottom: 60 }}
        >
          <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
          <XAxis
            dataKey="formattedDate"
            stroke="#6b7280"
            fontSize={12}
            tick={{ fontSize: 12 }}
            height={60}
          />
          <YAxis
            yAxisId="revenue"
            orientation="left"
            tickFormatter={formatCurrency}
            stroke="#0EA5E9"
            tick={{ fontSize: 12 }}
            width={80}
          />
          <YAxis
            yAxisId="bookings"
            orientation="right"
            stroke="#10B981"
            tick={{ fontSize: 12 }}
            width={50}
          />
          <Tooltip
            formatter={(value: any, name: string) => {
              if (name === "Revenue") {
                return [formatCurrency(value), "Revenue"];
              }
              return [value, name];
            }}
            labelFormatter={(index) => {
              const item = formattedData[index];
              return item ? `Month: ${item.formattedDate}` : "";
            }}
            contentStyle={{
              backgroundColor: "rgba(255, 255, 255, 0.95)",
              border: "1px solid #e5e7eb",
              borderRadius: "6px",
            }}
          />
          <Legend
            verticalAlign="top"
            height={36}
            iconType="rect"
            wrapperStyle={{
              paddingBottom: "10px",
            }}
          />
          <Bar
            yAxisId="revenue"
            dataKey="revenue"
            fill="#0EA5E9"
            name="Revenue (£)"
            opacity={0.8}
            radius={[4, 4, 0, 0]}
          />
          <Line
            yAxisId="bookings"
            type="monotone"
            dataKey="bookings"
            stroke="#10B981"
            strokeWidth={3}
            name="Bookings"
            dot={{ fill: "#10B981", r: 5 }}
            activeDot={{ r: 7 }}
          />
        </ComposedChart>
      </ResponsiveContainer>
      {!hasData && (
        <div className="absolute inset-0 flex items-center justify-center bg-white bg-opacity-80">
          <p className="text-gray-500 text-sm">No data available</p>
        </div>
      )}
    </div>
  );
};
