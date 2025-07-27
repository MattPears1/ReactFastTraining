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
  BarChart,
  Bar,
  ComposedChart,
} from 'recharts';
import { format, parseISO } from 'date-fns';

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
        return format(new Date(dateStr + '-01'), 'MMM yyyy');
      }
      return format(parseISO(dateStr), 'MMM d');
    } catch {
      return dateStr;
    }
  };

  const formatCurrency = (value: number) => {
    return `£${value.toLocaleString()}`;
  };

  // Prepare data with proper formatting
  const formattedData = data.map(item => ({
    ...item,
    formattedDate: formatDate(item.date),
  }));

  return (
    <div className="h-80 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <ComposedChart
          data={formattedData}
          margin={{ top: 10, right: 10, left: 10, bottom: 20 }}
        >
          <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
          <XAxis
            dataKey="formattedDate"
            stroke="#6b7280"
            fontSize={12}
            angle={-45}
            textAnchor="end"
            height={60}
          />
          <YAxis
            yAxisId="revenue"
            orientation="left"
            tickFormatter={formatCurrency}
            stroke="#0EA5E9"
            fontSize={12}
            width={60}
          />
          <YAxis
            yAxisId="bookings"
            orientation="right"
            stroke="#10B981"
            fontSize={12}
            width={40}
          />
          <Tooltip
            formatter={(value: any, name: string) => {
              if (name === 'Revenue') {
                return [formatCurrency(value), 'Revenue'];
              }
              return [value, name];
            }}
            labelFormatter={(index) => {
              const item = formattedData[index];
              return item ? `Month: ${item.formattedDate}` : '';
            }}
            contentStyle={{
              backgroundColor: 'rgba(255, 255, 255, 0.95)',
              border: '1px solid #e5e7eb',
              borderRadius: '6px',
            }}
          />
          <Legend 
            verticalAlign="top"
            height={36}
            iconType="rect"
            wrapperStyle={{
              paddingBottom: '10px',
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
            dot={{ fill: '#10B981', r: 5 }}
            activeDot={{ r: 7 }}
          />
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  );
};