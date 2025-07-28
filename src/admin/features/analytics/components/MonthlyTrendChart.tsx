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
  Area,
  AreaChart
} from 'recharts';

interface MonthlyData {
  month: string;
  bookings: number;
  revenue: number;
  attendees: number;
}

interface Props {
  data: MonthlyData[];
}

export const MonthlyTrendChart: React.FC<Props> = ({ data }) => {
  // Handle empty or invalid data
  if (!data || data.length === 0) {
    return (
      <div className="h-80 flex items-center justify-center text-gray-500">
        <p>No trend data available for the selected period</p>
      </div>
    );
  }

  try {
    return (
    <div className="h-80">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
          <defs>
            <linearGradient id="colorBookings" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#0EA5E9" stopOpacity={0.8}/>
              <stop offset="95%" stopColor="#0EA5E9" stopOpacity={0}/>
            </linearGradient>
            <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#10B981" stopOpacity={0.8}/>
              <stop offset="95%" stopColor="#10B981" stopOpacity={0}/>
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
          <XAxis 
            dataKey="month" 
            fontSize={12}
            tickFormatter={(value) => value.slice(0, 3)}
          />
          <YAxis 
            yAxisId="left" 
            fontSize={12}
            label={{ value: 'Bookings', angle: -90, position: 'insideLeft' }}
          />
          <YAxis 
            yAxisId="right" 
            orientation="right" 
            fontSize={12}
            label={{ value: 'Revenue (£)', angle: 90, position: 'insideRight' }}
            tickFormatter={(value) => `£${value}`}
          />
          <Tooltip 
            contentStyle={{ 
              backgroundColor: 'rgba(255, 255, 255, 0.95)', 
              border: '1px solid #e5e7eb',
              borderRadius: '8px'
            }}
            formatter={(value: number, name: string) => {
              if (name === 'revenue') return [`£${value.toLocaleString()}`, 'Revenue'];
              return [value, name.charAt(0).toUpperCase() + name.slice(1)];
            }}
          />
          <Legend />
          <Area
            yAxisId="left"
            type="monotone"
            dataKey="bookings"
            stroke="#0EA5E9"
            fillOpacity={1}
            fill="url(#colorBookings)"
            strokeWidth={2}
          />
          <Area
            yAxisId="right"
            type="monotone"
            dataKey="revenue"
            stroke="#10B981"
            fillOpacity={1}
            fill="url(#colorRevenue)"
            strokeWidth={2}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
  } catch (error) {
    console.error('Error rendering MonthlyTrendChart:', error);
    return (
      <div className="h-80 flex items-center justify-center text-red-500">
        <p>Error loading chart. Please try again.</p>
      </div>
    );
  }
};