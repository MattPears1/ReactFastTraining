import React, { useState } from "react";
import { ChartOptions, TooltipItem } from 'chart.js';
import { Doughnut } from 'react-chartjs-2';
import { animationConfig } from './ChartPlugins';
import '../../../utils/chartSetup'; // Import central Chart.js setup
import './charts.css';

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

const HOVER_COLORS = {
  Confirmed: "#059669",
  Pending: "#DC2626",
  Cancelled: "#DC2626",
  Completed: "#2563EB",
  confirmed: "#059669",
  pending: "#DC2626",
  cancelled: "#DC2626",
  completed: "#2563EB",
};

export const BookingStatusChartJS: React.FC<BookingStatusChartProps> = ({
  data,
}) => {
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);
  const validData = data && data.length > 0 && data.some((item) => item.count > 0);

  const chartData = validData
    ? data
    : [
        { status: "Confirmed", count: 0, percentage: 0 },
        { status: "Pending", count: 0, percentage: 0 },
        { status: "Cancelled", count: 0, percentage: 0 },
      ];

  const total = chartData.reduce((sum, item) => sum + item.count, 0);

  const chartConfig = React.useMemo(() => ({
    labels: chartData.map(item => item.status),
    datasets: [
      {
        data: chartData.map(item => item.count),
        backgroundColor: chartData.map((item, index) => {
          const baseColor = COLORS[item.status as keyof typeof COLORS] || "#8884d8";
          return hoveredIndex === index ? HOVER_COLORS[item.status as keyof typeof HOVER_COLORS] || baseColor : baseColor;
        }),
        borderColor: '#ffffff',
        borderWidth: 3,
        hoverBorderWidth: 4,
        hoverOffset: 15,
        spacing: 2,
      },
    ],
  }), [chartData, hoveredIndex]);

  const options: ChartOptions<'doughnut'> = {
    responsive: true,
    maintainAspectRatio: false,
    cutout: '60%',
    onHover: (event, activeElements) => {
      if (activeElements.length > 0) {
        const newIndex = activeElements[0].index;
        setHoveredIndex(prev => prev !== newIndex ? newIndex : prev);
      } else {
        setHoveredIndex(prev => prev !== null ? null : prev);
      }
    },
    plugins: {
      legend: {
        display: true,
        position: 'bottom' as const,
        labels: {
          usePointStyle: true,
          pointStyle: 'circle',
          padding: 20,
          font: {
            size: 13,
            weight: '600',
          },
          color: '#374151',
          generateLabels: (chart) => {
            const datasets = chart.data.datasets;
            if (datasets.length && chart.data.labels) {
              return chart.data.labels.map((label, i) => {
                const value = datasets[0].data[i] as number;
                const percentage = total > 0 ? ((value / total) * 100).toFixed(0) : '0';
                return {
                  text: `${label}: ${value} (${percentage}%)`,
                  fillStyle: COLORS[label as keyof typeof COLORS] || datasets[0].backgroundColor?.[i] as string,
                  strokeStyle: '#ffffff',
                  lineWidth: 2,
                  hidden: false,
                  index: i,
                };
              });
            }
            return [];
          },
        },
      },
      tooltip: {
        backgroundColor: 'rgba(255, 255, 255, 0.98)',
        titleColor: '#111827',
        bodyColor: '#4B5563',
        borderColor: '#E5E7EB',
        borderWidth: 1,
        padding: 16,
        cornerRadius: 8,
        displayColors: true,
        titleFont: {
          size: 14,
          weight: '600',
        },
        bodyFont: {
          size: 13,
        },
        callbacks: {
          label: function(context: TooltipItem<'doughnut'>) {
            const label = context.label || '';
            const value = context.parsed;
            const percentage = total > 0 ? ((value / total) * 100).toFixed(1) : '0';
            return `${label}: ${value} bookings (${percentage}%)`;
          }
        }
      },
    },
    animation: {
      animateRotate: true,
      animateScale: true,
      duration: 1500,
      easing: 'easeInOutQuart' as const,
    },
  };

  const centerTextPlugin = {
    id: 'centerText',
    beforeDraw: (chart: any) => {
      const { width, height, ctx } = chart;
      ctx.save();
      
      // Draw center circle background
      const centerX = width / 2;
      const centerY = height / 2;
      const innerRadius = 70;
      
      ctx.beginPath();
      ctx.arc(centerX, centerY, innerRadius, 0, 2 * Math.PI);
      ctx.fillStyle = 'rgba(249, 250, 251, 0.8)';
      ctx.fill();
      
      // Draw text
      const fontSize = (height / 140).toFixed(2);
      ctx.font = `bold ${fontSize}em Inter, Arial`;
      ctx.textBaseline = 'middle';
      ctx.textAlign = 'center';
      
      const text = total.toString();
      const textX = width / 2;
      const textY = height / 2 - 8;
      
      ctx.fillStyle = '#111827';
      ctx.fillText(text, textX, textY);
      
      ctx.font = `${(parseFloat(fontSize) * 0.6).toFixed(2)}em Inter, Arial`;
      ctx.fillStyle = '#6B7280';
      ctx.fillText('Total Bookings', textX, textY + 18);
      
      ctx.restore();
    }
  };

  return (
    <div className="chart-container chart-fade-in">
      <div className="h-80 w-full relative flex flex-col items-center chart-wrapper">
        <div className="flex-1 w-full" style={{ minHeight: 0 }}>
          <Doughnut 
            data={chartConfig} 
            options={options} 
            plugins={validData ? [centerTextPlugin] : []}
          />
        </div>
        {!validData && (
          <div className="absolute inset-0 flex items-center justify-center bg-white bg-opacity-80 rounded-lg">
            <p className="text-gray-500 text-sm font-medium">No booking data available</p>
          </div>
        )}
      </div>
    </div>
  );
};