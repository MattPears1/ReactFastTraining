import React from 'react';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  Cell
} from 'recharts';

interface CoursePopularityData {
  courseName: string;
  bookings: number;
  capacity: number;
}

interface Props {
  data: CoursePopularityData[];
}

const COLORS = ['#0EA5E9', '#10B981', '#F97316', '#8B5CF6', '#EF4444', '#F59E0B'];

export const CoursePopularityChart: React.FC<Props> = ({ data }) => {
  // Handle empty or invalid data
  if (!data || data.length === 0) {
    return (
      <div className="h-80 flex items-center justify-center text-gray-500">
        <p>No data available for the selected period</p>
      </div>
    );
  }

  try {
    const sortedData = [...data].sort((a, b) => b.bookings - a.bookings);

  return (
    <div className="h-80">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={sortedData} margin={{ top: 20, right: 30, left: 20, bottom: 60 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
          <XAxis 
            dataKey="courseName" 
            angle={-45}
            textAnchor="end"
            height={100}
            fontSize={12}
          />
          <YAxis fontSize={12} />
          <Tooltip 
            contentStyle={{ 
              backgroundColor: 'rgba(255, 255, 255, 0.95)', 
              border: '1px solid #e5e7eb',
              borderRadius: '8px'
            }}
            formatter={(value: number) => [`${value} bookings`, 'Total']}
          />
          <Bar dataKey="bookings" radius={[8, 8, 0, 0]}>
            {sortedData.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
  } catch (error) {
    console.error('Error rendering CoursePopularityChart:', error);
    return (
      <div className="h-80 flex items-center justify-center text-red-500">
        <p>Error loading chart. Please try again.</p>
      </div>
    );
  }
};