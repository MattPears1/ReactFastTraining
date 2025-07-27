import React from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts';
import { format } from 'date-fns';

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
    return format(new Date(dateStr), 'MMM d');
  };

  const formatCurrency = (value: number) => {
    return `£${value.toLocaleString()}`;
  };

  return (
    <div className="h-80">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart
          data={data}
          margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
        >
          <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
          <XAxis
            dataKey="date"
            tickFormatter={formatDate}
            stroke="#6b7280"
            fontSize={12}
          />
          <YAxis
            yAxisId="revenue"
            orientation="left"
            tickFormatter={formatCurrency}
            stroke="#6b7280"
            fontSize={12}
          />
          <YAxis
            yAxisId="bookings"
            orientation="right"
            stroke="#6b7280"
            fontSize={12}
          />
          <Tooltip
            formatter={(value: any, name: string) => {
              if (name === 'Revenue') {
                return formatCurrency(value);
              }
              return value;
            }}
            labelFormatter={(label) => `Date: ${formatDate(label)}`}
          />
          <Legend />
          <Line
            yAxisId="revenue"
            type="monotone"
            dataKey="revenue"
            stroke="#0EA5E9"
            strokeWidth={2}
            name="Revenue"
            dot={{ fill: '#0EA5E9', r: 4 }}
            activeDot={{ r: 6 }}
          />
          <Line
            yAxisId="bookings"
            type="monotone"
            dataKey="bookings"
            stroke="#10B981"
            strokeWidth={2}
            name="Bookings"
            dot={{ fill: '#10B981', r: 4 }}
            activeDot={{ r: 6 }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
};