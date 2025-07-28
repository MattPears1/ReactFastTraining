import React, { useRef, useEffect } from "react";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ChartOptions,
  TooltipItem,
  Filler,
} from 'chart.js';
import { Chart } from 'react-chartjs-2';
import { format } from "date-fns";
import { gradientPlugin, createGradient, animationConfig } from './ChartPlugins';
import './charts.css';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

interface RevenueData {
  date: string;
  revenue: number;
  bookings: number;
}

interface RevenueChartProps {
  data: RevenueData[];
}

export const RevenueChartJS: React.FC<RevenueChartProps> = ({ data }) => {
  const chartRef = useRef<ChartJS>(null);
  const [enhancedChartData, setEnhancedChartData] = React.useState<any>(null);
  const formatDate = (dateStr: string) => {
    try {
      if (dateStr && dateStr.match(/^\d{4}-\d{2}$/)) {
        return format(new Date(dateStr + "-01"), "MMM yyyy");
      }
      return format(new Date(dateStr), "MMM d");
    } catch {
      return dateStr;
    }
  };

  const hasData = data && data.length > 0;
  
  const baseChartData = hasData
    ? data
    : [
        { date: "Jan", revenue: 0, bookings: 0 },
        { date: "Feb", revenue: 0, bookings: 0 },
        { date: "Mar", revenue: 0, bookings: 0 },
        { date: "Apr", revenue: 0, bookings: 0 },
        { date: "May", revenue: 0, bookings: 0 },
        { date: "Jun", revenue: 0, bookings: 0 },
      ];

  const labels = baseChartData.map(item => hasData ? formatDate(item.date) : item.date);
  const revenueData = baseChartData.map(item => item.revenue);
  const bookingsData = baseChartData.map(item => item.bookings);

  useEffect(() => {
    if (chartRef.current) {
      const chart = chartRef.current;
      const ctx = chart.ctx;
      const gradient = createGradient(ctx, chart.height, '#10B981', [0.3, 0]);
      const barGradient = createGradient(ctx, chart.height, '#0EA5E9', [0.9, 0.6]);
      
      setEnhancedChartData({
        labels,
        datasets: [
          {
            type: 'bar' as const,
            label: 'Revenue (£)',
            data: revenueData,
            backgroundColor: barGradient,
            borderColor: 'rgb(14, 165, 233)',
            borderWidth: 0,
            borderRadius: 6,
            borderSkipped: false,
            barThickness: 'flex',
            yAxisID: 'y',
          },
          {
            type: 'line' as const,
            label: 'Bookings',
            data: bookingsData,
            borderColor: 'rgb(16, 185, 129)',
            backgroundColor: gradient,
            borderWidth: 3,
            pointBackgroundColor: 'rgb(16, 185, 129)',
            pointBorderColor: '#fff',
            pointBorderWidth: 2,
            pointRadius: 6,
            pointHoverRadius: 8,
            pointHoverBorderWidth: 3,
            tension: 0.4,
            fill: true,
            yAxisID: 'y1',
          },
        ],
      });
    }
  }, [data, labels, revenueData, bookingsData]);

  // Initial chart config before gradient is applied
  const initialChartConfig = {
    labels,
    datasets: [
      {
        type: 'bar' as const,
        label: 'Revenue (£)',
        data: revenueData,
        backgroundColor: 'rgba(14, 165, 233, 0.8)',
        borderColor: 'rgb(14, 165, 233)',
        borderWidth: 0,
        borderRadius: 6,
        borderSkipped: false,
        barThickness: 'flex',
        yAxisID: 'y',
      },
      {
        type: 'line' as const,
        label: 'Bookings',
        data: bookingsData,
        borderColor: 'rgb(16, 185, 129)',
        backgroundColor: 'rgba(16, 185, 129, 0.1)',
        borderWidth: 3,
        pointBackgroundColor: 'rgb(16, 185, 129)',
        pointBorderColor: '#fff',
        pointBorderWidth: 2,
        pointRadius: 6,
        pointHoverRadius: 8,
        pointHoverBorderWidth: 3,
        tension: 0.4,
        fill: true,
        yAxisID: 'y1',
      },
    ],
  };

  const options: ChartOptions<'bar' | 'line'> = {
    responsive: true,
    maintainAspectRatio: false,
    interaction: {
      mode: 'index' as const,
      intersect: false,
    },
    animation: animationConfig,
    plugins: {
      legend: {
        display: true,
        position: 'top' as const,
        labels: {
          usePointStyle: true,
          padding: 20,
          font: {
            size: 13,
            weight: '600',
          },
          color: '#374151',
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
          label: function(context: TooltipItem<'bar' | 'line'>) {
            let label = context.dataset.label || '';
            if (label) {
              label += ': ';
            }
            if (context.parsed.y !== null) {
              if (context.dataset.label?.includes('Revenue')) {
                label += `£${context.parsed.y.toLocaleString()}`;
              } else {
                label += context.parsed.y;
              }
            }
            return label;
          }
        }
      },
    },
    scales: {
      x: {
        grid: {
          display: false,
        },
        ticks: {
          font: {
            size: 12,
            weight: '500',
          },
          color: '#6B7280',
          padding: 8,
        },
      },
      y: {
        type: 'linear' as const,
        display: true,
        position: 'left' as const,
        grid: {
          color: 'rgba(229, 231, 235, 0.5)',
          lineWidth: 1,
        },
        ticks: {
          font: {
            size: 12,
            weight: '500',
          },
          color: '#0EA5E9',
          padding: 8,
          callback: function(value) {
            return `£${value.toLocaleString()}`;
          }
        },
        title: {
          display: true,
          text: 'Revenue (£)',
          color: '#0EA5E9',
          font: {
            size: 13,
            weight: '600',
          },
          padding: 8,
        }
      },
      y1: {
        type: 'linear' as const,
        display: true,
        position: 'right' as const,
        grid: {
          drawOnChartArea: false,
        },
        ticks: {
          font: {
            size: 12,
            weight: '500',
          },
          color: '#10B981',
          padding: 8,
        },
        title: {
          display: true,
          text: 'Number of Bookings',
          color: '#10B981',
          font: {
            size: 13,
            weight: '600',
          },
          padding: 8,
        }
      },
    },
  };

  return (
    <div className="chart-container chart-fade-in">
      <div className="h-80 w-full relative chart-wrapper">
        <Chart 
          ref={chartRef}
          type='bar' 
          data={enhancedChartData || initialChartConfig} 
          options={options} 
          plugins={[gradientPlugin]}
        />
        {!hasData && (
          <div className="absolute inset-0 flex items-center justify-center bg-white bg-opacity-80 rounded-lg">
            <p className="text-gray-500 text-sm font-medium">No data available</p>
          </div>
        )}
      </div>
    </div>
  );
};