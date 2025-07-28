import React, { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import {
  BarChart3,
  TrendingUp,
  Users,
  Calendar,
  PoundSterling,
  Activity,
  BookOpen,
  ChevronRight,
} from "lucide-react";
import { AdminCard } from "../../components/ui/AdminCard";
import { LoadingSpinner } from "../../components/common/LoadingSpinner";
import { MetricCard } from "../../components/common/MetricCard";
import { CoursePopularityChart } from "./components/CoursePopularityChart";
import { RevenueByCoursePie } from "./components/RevenueByCoursePie";
import { DayOfWeekHeatmap } from "./components/DayOfWeekHeatmap";
import { MonthlyTrendChart } from "./components/MonthlyTrendChart";
import { BookingFunnelChart } from "./components/BookingFunnelChart";
import { adminAnalyticsService } from "../../services/admin-analytics.service";

export const AnalyticsPage: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [loading, setLoading] = useState(true);
  const [timeRange, setTimeRange] = useState(
    searchParams.get("range") || "30days",
  );
  const [analyticsData, setAnalyticsData] = useState<any>(null);

  useEffect(() => {
    fetchAnalytics();
  }, [timeRange]);

  const fetchAnalytics = async () => {
    try {
      setLoading(true);
      const data =
        await adminAnalyticsService.getComprehensiveAnalytics(timeRange);
      setAnalyticsData(data);
    } catch (error) {
      console.error("Failed to fetch analytics:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleTimeRangeChange = (range: string) => {
    setTimeRange(range);
    setSearchParams({ range });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <LoadingSpinner />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-900">
          Analytics Dashboard
        </h1>

        <div className="flex gap-2">
          <button
            onClick={() => handleTimeRangeChange("7days")}
            className={`px-4 py-2 rounded-lg ${
              timeRange === "7days"
                ? "bg-primary-600 text-white"
                : "bg-gray-100 text-gray-700 hover:bg-gray-200"
            }`}
          >
            Last 7 Days
          </button>
          <button
            onClick={() => handleTimeRangeChange("30days")}
            className={`px-4 py-2 rounded-lg ${
              timeRange === "30days"
                ? "bg-primary-600 text-white"
                : "bg-gray-100 text-gray-700 hover:bg-gray-200"
            }`}
          >
            Last 30 Days
          </button>
          <button
            onClick={() => handleTimeRangeChange("90days")}
            className={`px-4 py-2 rounded-lg ${
              timeRange === "90days"
                ? "bg-primary-600 text-white"
                : "bg-gray-100 text-gray-700 hover:bg-gray-200"
            }`}
          >
            Last 90 Days
          </button>
          <button
            onClick={() => handleTimeRangeChange("365days")}
            className={`px-4 py-2 rounded-lg ${
              timeRange === "365days"
                ? "bg-primary-600 text-white"
                : "bg-gray-100 text-gray-700 hover:bg-gray-200"
            }`}
          >
            Last Year
          </button>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <MetricCard
          title="Total Revenue"
          value={`£${analyticsData?.overview?.totalRevenue?.toLocaleString() || 0}`}
          change={analyticsData?.overview?.revenueChange || 0}
          icon={<PoundSterling className="w-5 h-5" />}
          trend={analyticsData?.overview?.revenueChange > 0 ? "up" : "down"}
        />
        <MetricCard
          title="Total Bookings"
          value={analyticsData?.overview?.totalBookings || 0}
          change={analyticsData?.overview?.bookingsChange || 0}
          icon={<BookOpen className="w-5 h-5" />}
          trend={analyticsData?.overview?.bookingsChange > 0 ? "up" : "down"}
        />
        <MetricCard
          title="Unique Visitors"
          value={analyticsData?.overview?.uniqueVisitors || 0}
          change={analyticsData?.overview?.visitorsChange || 0}
          icon={<Users className="w-5 h-5" />}
          trend={analyticsData?.overview?.visitorsChange > 0 ? "up" : "down"}
        />
        <MetricCard
          title="Conversion Rate"
          value={`${analyticsData?.overview?.conversionRate?.toFixed(1) || 0}%`}
          change={analyticsData?.overview?.conversionChange || 0}
          icon={<Activity className="w-5 h-5" />}
          trend={analyticsData?.overview?.conversionChange > 0 ? "up" : "down"}
        />
      </div>

      {/* Course Popularity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <AdminCard title="Course Popularity by Bookings" icon={<BarChart3 />}>
          <CoursePopularityChart data={analyticsData?.coursePopularity || []} />
        </AdminCard>

        <AdminCard title="Revenue by Course" icon={<PoundSterling />}>
          <RevenueByCoursePie data={analyticsData?.revenueByCourse || []} />
        </AdminCard>
      </div>

      {/* Time-based Analytics */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <AdminCard title="Popular Days of the Week" icon={<Calendar />}>
          <DayOfWeekHeatmap data={analyticsData?.dayOfWeekAnalysis || []} />
        </AdminCard>

        <AdminCard title="Monthly Booking Trends" icon={<TrendingUp />}>
          <MonthlyTrendChart data={analyticsData?.monthlyTrends || []} />
        </AdminCard>
      </div>

      {/* Booking Funnel */}
      <AdminCard title="Booking Funnel Analysis" icon={<Activity />}>
        <BookingFunnelChart data={analyticsData?.bookingFunnel || {}} />
      </AdminCard>

      {/* Detailed Stats Table */}
      <AdminCard title="Course Performance Details">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="text-xs text-gray-700 uppercase bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left">Course</th>
                <th className="px-6 py-3 text-center">Total Bookings</th>
                <th className="px-6 py-3 text-center">Revenue</th>
                <th className="px-6 py-3 text-center">Avg. Attendees</th>
                <th className="px-6 py-3 text-center">Fill Rate</th>
                <th className="px-6 py-3 text-center">Most Popular Day</th>
                <th className="px-6 py-3"></th>
              </tr>
            </thead>
            <tbody>
              {analyticsData?.courseDetails?.map(
                (course: any, index: number) => (
                  <tr
                    key={index}
                    className="bg-white border-b hover:bg-gray-50"
                  >
                    <td className="px-6 py-4 font-medium text-gray-900">
                      {course.courseName}
                    </td>
                    <td className="px-6 py-4 text-center">
                      {course.totalBookings}
                    </td>
                    <td className="px-6 py-4 text-center">
                      £{course.revenue.toLocaleString()}
                    </td>
                    <td className="px-6 py-4 text-center">
                      {course.avgAttendees}
                    </td>
                    <td className="px-6 py-4 text-center">
                      <span
                        className={`inline-flex px-2 py-1 text-xs rounded-full ${
                          course.fillRate >= 80
                            ? "bg-green-100 text-green-800"
                            : course.fillRate >= 50
                              ? "bg-yellow-100 text-yellow-800"
                              : "bg-red-100 text-red-800"
                        }`}
                      >
                        {course.fillRate}%
                      </span>
                    </td>
                    <td className="px-6 py-4 text-center">
                      {course.popularDay}
                    </td>
                    <td className="px-6 py-4 text-center">
                      <button className="text-primary-600 hover:text-primary-700">
                        <ChevronRight className="w-5 h-5" />
                      </button>
                    </td>
                  </tr>
                ),
              )}
            </tbody>
          </table>
        </div>
      </AdminCard>
    </div>
  );
};
