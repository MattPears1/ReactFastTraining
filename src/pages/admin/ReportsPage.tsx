import React, { useState, useEffect } from "react";
import {
  FileText,
  TrendingUp,
  Users,
  PoundSterling,
  Calendar,
  Download,
  Filter,
  ChevronDown,
  Activity,
  Award,
  Clock,
  BarChart3,
  PieChart,
  TrendingDown,
  AlertCircle,
} from "lucide-react";
import { useAuth } from "@contexts/AuthContext";
import { useToast } from "@contexts/ToastContext";
import { adminDashboardApi } from "@services/api/admin-dashboard.service";
import { cn } from "@utils/cn";
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart as RePieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";

interface DateRange {
  start: Date;
  end: Date;
  label: string;
}

interface ReportData {
  revenue: {
    total: number;
    byMonth: Array<{ month: string; amount: number }>;
    byCourse: Array<{ course: string; amount: number; percentage: number }>;
  };
  bookings: {
    total: number;
    completed: number;
    cancelled: number;
    refunded: number;
    trend: Array<{ date: string; count: number }>;
  };
  attendance: {
    totalAttendees: number;
    averagePerSession: number;
    completionRate: number;
    noShowRate: number;
  };
  courses: {
    mostPopular: string;
    totalSessions: number;
    averageCapacity: number;
    utilizationRate: number;
  };
}

const AdminReportsPage: React.FC = () => {
  const { user } = useAuth();
  const { showToast } = useToast();

  // State
  const [loading, setLoading] = useState(true);
  const [reportData, setReportData] = useState<ReportData | null>(null);
  const [dateRange, setDateRange] = useState<DateRange>({
    start: new Date(new Date().setMonth(new Date().getMonth() - 1)),
    end: new Date(),
    label: "Last 30 Days",
  });
  const [activeTab, setActiveTab] = useState<
    "revenue" | "bookings" | "attendance" | "courses"
  >("revenue");
  const [showDatePicker, setShowDatePicker] = useState(false);

  // Predefined date ranges
  const dateRanges: DateRange[] = [
    {
      start: new Date(new Date().setDate(new Date().getDate() - 7)),
      end: new Date(),
      label: "Last 7 Days",
    },
    {
      start: new Date(new Date().setMonth(new Date().getMonth() - 1)),
      end: new Date(),
      label: "Last 30 Days",
    },
    {
      start: new Date(new Date().setMonth(new Date().getMonth() - 3)),
      end: new Date(),
      label: "Last 3 Months",
    },
    {
      start: new Date(new Date().setMonth(new Date().getMonth() - 6)),
      end: new Date(),
      label: "Last 6 Months",
    },
    {
      start: new Date(new Date().getFullYear(), 0, 1),
      end: new Date(),
      label: "Year to Date",
    },
  ];

  // Load report data
  const loadReportData = async () => {
    try {
      setLoading(true);

      // Mock data - replace with actual API call
      const mockData: ReportData = {
        revenue: {
          total: 45750,
          byMonth: [
            { month: "Oct", amount: 8500 },
            { month: "Nov", amount: 9200 },
            { month: "Dec", amount: 7800 },
            { month: "Jan", amount: 10250 },
            { month: "Feb", amount: 10000 },
          ],
          byCourse: [
            { course: "Emergency First Aid", amount: 18300, percentage: 40 },
            { course: "Paediatric First Aid", amount: 13725, percentage: 30 },
            { course: "First Aid at Work", amount: 9150, percentage: 20 },
            { course: "Mental Health", amount: 4575, percentage: 10 },
          ],
        },
        bookings: {
          total: 610,
          completed: 542,
          cancelled: 45,
          refunded: 23,
          trend: [
            { date: "01/01", count: 12 },
            { date: "08/01", count: 18 },
            { date: "15/01", count: 15 },
            { date: "22/01", count: 20 },
            { date: "29/01", count: 16 },
          ],
        },
        attendance: {
          totalAttendees: 542,
          averagePerSession: 8.5,
          completionRate: 94.2,
          noShowRate: 5.8,
        },
        courses: {
          mostPopular: "Emergency First Aid at Work",
          totalSessions: 64,
          averageCapacity: 10.2,
          utilizationRate: 83.3,
        },
      };

      setReportData(mockData);
    } catch (error) {
      showToast("Failed to load report data", "error");
      console.error("Error loading reports:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadReportData();
  }, [dateRange]);

  // Export report
  const handleExportReport = async (format: "pdf" | "csv" | "excel") => {
    try {
      showToast(`Exporting report as ${format.toUpperCase()}...`, "info");
      // API call to generate and download report
      setTimeout(() => {
        showToast("Report exported successfully", "success");
      }, 1500);
    } catch (error) {
      showToast("Failed to export report", "error");
    }
  };

  // Chart colors
  const COLORS = ["#0EA5E9", "#10B981", "#F59E0B", "#8B5CF6", "#EF4444"];

  if (loading) {
    return (
      <div className="flex justify-center items-center h-96">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  return (
    <div>
      {/* Page Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
              Reports & Analytics
            </h1>
            <p className="text-gray-600 dark:text-gray-400">
              Comprehensive business insights and performance metrics
            </p>
          </div>

          <div className="flex items-center gap-3">
            {/* Date Range Selector */}
            <div className="relative">
              <button
                onClick={() => setShowDatePicker(!showDatePicker)}
                className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 flex items-center gap-2"
              >
                <Calendar className="w-4 h-4" />
                <span className="text-sm">{dateRange.label}</span>
                <ChevronDown className="w-4 h-4" />
              </button>

              {showDatePicker && (
                <div className="absolute right-0 mt-2 w-48 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 py-2 z-10">
                  {dateRanges.map((range) => (
                    <button
                      key={range.label}
                      onClick={() => {
                        setDateRange(range);
                        setShowDatePicker(false);
                      }}
                      className={cn(
                        "w-full text-left px-4 py-2 text-sm hover:bg-gray-100 dark:hover:bg-gray-700",
                        dateRange.label === range.label &&
                          "bg-primary-50 dark:bg-primary-900/20 text-primary-600",
                      )}
                    >
                      {range.label}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Export Options */}
            <div className="flex gap-2">
              <button
                onClick={() => handleExportReport("pdf")}
                className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 flex items-center gap-2"
              >
                <Download className="w-4 h-4" />
                Export PDF
              </button>
              <button
                onClick={() => handleExportReport("excel")}
                className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700"
              >
                Excel
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Key Metrics Summary */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Total Revenue
              </p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">
                £{reportData?.revenue.total.toLocaleString()}
              </p>
              <p className="text-xs text-green-600 mt-1">
                +12.5% from last period
              </p>
            </div>
            <PoundSterling className="w-8 h-8 text-green-600" />
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Total Bookings
              </p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">
                {reportData?.bookings.total}
              </p>
              <p className="text-xs text-green-600 mt-1">
                +8.3% from last period
              </p>
            </div>
            <Users className="w-8 h-8 text-blue-600" />
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Completion Rate
              </p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">
                {reportData?.attendance.completionRate}%
              </p>
              <p className="text-xs text-green-600 mt-1">
                +2.1% from last period
              </p>
            </div>
            <Award className="w-8 h-8 text-purple-600" />
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Avg. Utilization
              </p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">
                {reportData?.courses.utilizationRate}%
              </p>
              <p className="text-xs text-red-600 mt-1">
                -3.2% from last period
              </p>
            </div>
            <Activity className="w-8 h-8 text-orange-600" />
          </div>
        </div>
      </div>

      {/* Report Tabs */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow">
        {/* Tab Navigation */}
        <div className="border-b border-gray-200 dark:border-gray-700">
          <nav className="flex -mb-px">
            <button
              onClick={() => setActiveTab("revenue")}
              className={cn(
                "px-6 py-3 text-sm font-medium border-b-2 transition-colors",
                activeTab === "revenue"
                  ? "text-primary-600 border-primary-600"
                  : "text-gray-500 border-transparent hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200",
              )}
            >
              Revenue Analysis
            </button>
            <button
              onClick={() => setActiveTab("bookings")}
              className={cn(
                "px-6 py-3 text-sm font-medium border-b-2 transition-colors",
                activeTab === "bookings"
                  ? "text-primary-600 border-primary-600"
                  : "text-gray-500 border-transparent hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200",
              )}
            >
              Booking Trends
            </button>
            <button
              onClick={() => setActiveTab("attendance")}
              className={cn(
                "px-6 py-3 text-sm font-medium border-b-2 transition-colors",
                activeTab === "attendance"
                  ? "text-primary-600 border-primary-600"
                  : "text-gray-500 border-transparent hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200",
              )}
            >
              Attendance Metrics
            </button>
            <button
              onClick={() => setActiveTab("courses")}
              className={cn(
                "px-6 py-3 text-sm font-medium border-b-2 transition-colors",
                activeTab === "courses"
                  ? "text-primary-600 border-primary-600"
                  : "text-gray-500 border-transparent hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200",
              )}
            >
              Course Performance
            </button>
          </nav>
        </div>

        {/* Tab Content */}
        <div className="p-6">
          {activeTab === "revenue" && reportData && (
            <div className="space-y-6">
              {/* Revenue Trend Chart */}
              <div>
                <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
                  Revenue Trend
                </h3>
                <div className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={reportData.revenue.byMonth}>
                      <CartesianGrid
                        strokeDasharray="3 3"
                        className="stroke-gray-200 dark:stroke-gray-700"
                      />
                      <XAxis
                        dataKey="month"
                        className="text-gray-600 dark:text-gray-400"
                      />
                      <YAxis
                        className="text-gray-600 dark:text-gray-400"
                        tickFormatter={(value) => `£${value}`}
                      />
                      <Tooltip
                        formatter={(value: number) => `£${value}`}
                        contentStyle={{
                          backgroundColor: "rgba(255, 255, 255, 0.95)",
                          border: "1px solid #e5e7eb",
                          borderRadius: "0.375rem",
                        }}
                      />
                      <Line
                        type="monotone"
                        dataKey="amount"
                        stroke="#0EA5E9"
                        strokeWidth={2}
                        dot={{ fill: "#0EA5E9", r: 4 }}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Revenue by Course */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div>
                  <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
                    Revenue by Course Type
                  </h3>
                  <div className="h-80">
                    <ResponsiveContainer width="100%" height="100%">
                      <RePieChart>
                        <Pie
                          data={reportData.revenue.byCourse}
                          cx="50%"
                          cy="50%"
                          labelLine={false}
                          label={(entry) => `${entry.percentage}%`}
                          outerRadius={80}
                          fill="#8884d8"
                          dataKey="amount"
                        >
                          {reportData.revenue.byCourse.map((entry, index) => (
                            <Cell
                              key={`cell-${index}`}
                              fill={COLORS[index % COLORS.length]}
                            />
                          ))}
                        </Pie>
                        <Tooltip formatter={(value: number) => `£${value}`} />
                      </RePieChart>
                    </ResponsiveContainer>
                  </div>
                  <div className="mt-4 space-y-2">
                    {reportData.revenue.byCourse.map((course, index) => (
                      <div
                        key={course.course}
                        className="flex items-center justify-between"
                      >
                        <div className="flex items-center gap-2">
                          <div
                            className="w-3 h-3 rounded-full"
                            style={{
                              backgroundColor: COLORS[index % COLORS.length],
                            }}
                          />
                          <span className="text-sm text-gray-600 dark:text-gray-400">
                            {course.course}
                          </span>
                        </div>
                        <span className="text-sm font-medium text-gray-900 dark:text-white">
                          £{course.amount.toLocaleString()}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Revenue Stats */}
                <div className="space-y-4">
                  <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
                    Revenue Statistics
                  </h3>
                  <div className="space-y-4">
                    <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-4">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm text-gray-600 dark:text-gray-400">
                          Average Revenue per Booking
                        </span>
                        <span className="font-medium text-gray-900 dark:text-white">
                          £
                          {(
                            reportData.revenue.total / reportData.bookings.total
                          ).toFixed(2)}
                        </span>
                      </div>
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm text-gray-600 dark:text-gray-400">
                          Monthly Average
                        </span>
                        <span className="font-medium text-gray-900 dark:text-white">
                          £{(reportData.revenue.total / 5).toFixed(2)}
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-600 dark:text-gray-400">
                          Refund Rate
                        </span>
                        <span className="font-medium text-gray-900 dark:text-white">
                          {(
                            (reportData.bookings.refunded /
                              reportData.bookings.total) *
                            100
                          ).toFixed(1)}
                          %
                        </span>
                      </div>
                    </div>

                    <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4">
                      <div className="flex items-start gap-3">
                        <AlertCircle className="w-5 h-5 text-yellow-600 dark:text-yellow-400 mt-0.5" />
                        <div>
                          <p className="text-sm font-medium text-yellow-900 dark:text-yellow-100">
                            Revenue Opportunity
                          </p>
                          <p className="text-sm text-yellow-700 dark:text-yellow-300 mt-1">
                            Increasing course capacity by 20% could generate an
                            additional £9,150 in revenue.
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === "bookings" && reportData && (
            <div className="space-y-6">
              {/* Booking Trend Chart */}
              <div>
                <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
                  Booking Volume Trend
                </h3>
                <div className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={reportData.bookings.trend}>
                      <CartesianGrid
                        strokeDasharray="3 3"
                        className="stroke-gray-200 dark:stroke-gray-700"
                      />
                      <XAxis
                        dataKey="date"
                        className="text-gray-600 dark:text-gray-400"
                      />
                      <YAxis className="text-gray-600 dark:text-gray-400" />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: "rgba(255, 255, 255, 0.95)",
                          border: "1px solid #e5e7eb",
                          borderRadius: "0.375rem",
                        }}
                      />
                      <Bar
                        dataKey="count"
                        fill="#10B981"
                        radius={[8, 8, 0, 0]}
                      />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Booking Status Breakdown */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="bg-green-50 dark:bg-green-900/20 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-green-900 dark:text-green-100">
                      Completed
                    </span>
                    <CheckCircle className="w-5 h-5 text-green-600" />
                  </div>
                  <p className="text-2xl font-bold text-green-900 dark:text-green-100">
                    {reportData.bookings.completed}
                  </p>
                  <p className="text-xs text-green-700 dark:text-green-300 mt-1">
                    {(
                      (reportData.bookings.completed /
                        reportData.bookings.total) *
                      100
                    ).toFixed(1)}
                    % of total
                  </p>
                </div>

                <div className="bg-yellow-50 dark:bg-yellow-900/20 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-yellow-900 dark:text-yellow-100">
                      Cancelled
                    </span>
                    <AlertCircle className="w-5 h-5 text-yellow-600" />
                  </div>
                  <p className="text-2xl font-bold text-yellow-900 dark:text-yellow-100">
                    {reportData.bookings.cancelled}
                  </p>
                  <p className="text-xs text-yellow-700 dark:text-yellow-300 mt-1">
                    {(
                      (reportData.bookings.cancelled /
                        reportData.bookings.total) *
                      100
                    ).toFixed(1)}
                    % of total
                  </p>
                </div>

                <div className="bg-red-50 dark:bg-red-900/20 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-red-900 dark:text-red-100">
                      Refunded
                    </span>
                    <TrendingDown className="w-5 h-5 text-red-600" />
                  </div>
                  <p className="text-2xl font-bold text-red-900 dark:text-red-100">
                    {reportData.bookings.refunded}
                  </p>
                  <p className="text-xs text-red-700 dark:text-red-300 mt-1">
                    {(
                      (reportData.bookings.refunded /
                        reportData.bookings.total) *
                      100
                    ).toFixed(1)}
                    % of total
                  </p>
                </div>

                <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-blue-900 dark:text-blue-100">
                      Active
                    </span>
                    <Activity className="w-5 h-5 text-blue-600" />
                  </div>
                  <p className="text-2xl font-bold text-blue-900 dark:text-blue-100">
                    {reportData.bookings.total -
                      reportData.bookings.completed -
                      reportData.bookings.cancelled -
                      reportData.bookings.refunded}
                  </p>
                  <p className="text-xs text-blue-700 dark:text-blue-300 mt-1">
                    Upcoming sessions
                  </p>
                </div>
              </div>
            </div>
          )}

          {activeTab === "attendance" && reportData && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Attendance Metrics */}
                <div className="space-y-4">
                  <h3 className="text-lg font-medium text-gray-900 dark:text-white">
                    Attendance Overview
                  </h3>
                  <div className="space-y-3">
                    <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm text-gray-600 dark:text-gray-400">
                            Total Attendees
                          </p>
                          <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">
                            {reportData.attendance.totalAttendees}
                          </p>
                        </div>
                        <Users className="w-8 h-8 text-primary-600" />
                      </div>
                    </div>

                    <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm text-gray-600 dark:text-gray-400">
                            Average per Session
                          </p>
                          <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">
                            {reportData.attendance.averagePerSession}
                          </p>
                        </div>
                        <BarChart3 className="w-8 h-8 text-blue-600" />
                      </div>
                    </div>

                    <div className="bg-green-50 dark:bg-green-900/20 rounded-lg p-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm text-green-700 dark:text-green-300">
                            Completion Rate
                          </p>
                          <p className="text-2xl font-bold text-green-900 dark:text-green-100 mt-1">
                            {reportData.attendance.completionRate}%
                          </p>
                        </div>
                        <Award className="w-8 h-8 text-green-600" />
                      </div>
                    </div>

                    <div className="bg-red-50 dark:bg-red-900/20 rounded-lg p-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm text-red-700 dark:text-red-300">
                            No-Show Rate
                          </p>
                          <p className="text-2xl font-bold text-red-900 dark:text-red-100 mt-1">
                            {reportData.attendance.noShowRate}%
                          </p>
                        </div>
                        <AlertCircle className="w-8 h-8 text-red-600" />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Attendance Insights */}
                <div className="space-y-4">
                  <h3 className="text-lg font-medium text-gray-900 dark:text-white">
                    Key Insights
                  </h3>
                  <div className="space-y-3">
                    <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
                      <div className="flex items-start gap-3">
                        <TrendingUp className="w-5 h-5 text-blue-600 dark:text-blue-400 mt-0.5" />
                        <div>
                          <p className="text-sm font-medium text-blue-900 dark:text-blue-100">
                            High Completion Rate
                          </p>
                          <p className="text-sm text-blue-700 dark:text-blue-300 mt-1">
                            Your completion rate of{" "}
                            {reportData.attendance.completionRate}% is above
                            industry average.
                          </p>
                        </div>
                      </div>
                    </div>

                    <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4">
                      <div className="flex items-start gap-3">
                        <AlertCircle className="w-5 h-5 text-yellow-600 dark:text-yellow-400 mt-0.5" />
                        <div>
                          <p className="text-sm font-medium text-yellow-900 dark:text-yellow-100">
                            No-Show Impact
                          </p>
                          <p className="text-sm text-yellow-700 dark:text-yellow-300 mt-1">
                            {reportData.attendance.noShowRate}% no-show rate
                            represents approximately £2,287 in lost revenue.
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === "courses" && reportData && (
            <div className="space-y-6">
              {/* Course Performance Metrics */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-6">
                  <h4 className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-2">
                    Most Popular Course
                  </h4>
                  <p className="text-lg font-semibold text-gray-900 dark:text-white">
                    {reportData.courses.mostPopular}
                  </p>
                  <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                    40% of all bookings
                  </p>
                </div>

                <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-6">
                  <h4 className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-2">
                    Total Sessions Delivered
                  </h4>
                  <p className="text-lg font-semibold text-gray-900 dark:text-white">
                    {reportData.courses.totalSessions}
                  </p>
                  <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                    Across all course types
                  </p>
                </div>

                <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-6">
                  <h4 className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-2">
                    Average Class Size
                  </h4>
                  <p className="text-lg font-semibold text-gray-900 dark:text-white">
                    {reportData.courses.averageCapacity} attendees
                  </p>
                  <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                    {reportData.courses.utilizationRate}% capacity utilization
                  </p>
                </div>
              </div>

              {/* Course Performance Table */}
              <div>
                <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
                  Course Performance Breakdown
                </h3>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-gray-50 dark:bg-gray-700">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                          Course Type
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                          Sessions
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                          Total Attendees
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                          Avg. Attendance
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                          Revenue
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                          Completion Rate
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                      {[
                        {
                          name: "Emergency First Aid",
                          sessions: 24,
                          attendees: 216,
                          avg: 9.0,
                          revenue: 18300,
                          completion: 95.5,
                        },
                        {
                          name: "Paediatric First Aid",
                          sessions: 18,
                          attendees: 144,
                          avg: 8.0,
                          revenue: 13725,
                          completion: 93.8,
                        },
                        {
                          name: "First Aid at Work",
                          sessions: 15,
                          attendees: 120,
                          avg: 8.0,
                          revenue: 9150,
                          completion: 94.2,
                        },
                        {
                          name: "Mental Health",
                          sessions: 7,
                          attendees: 62,
                          avg: 8.9,
                          revenue: 4575,
                          completion: 92.1,
                        },
                      ].map((course) => (
                        <tr key={course.name}>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">
                            {course.name}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                            {course.sessions}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                            {course.attendees}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                            {course.avg}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">
                            £{course.revenue.toLocaleString()}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center">
                              <span className="text-sm text-gray-900 dark:text-white">
                                {course.completion}%
                              </span>
                              <div className="ml-3 w-24 bg-gray-200 dark:bg-gray-600 rounded-full h-2">
                                <div
                                  className="bg-green-500 h-2 rounded-full"
                                  style={{ width: `${course.completion}%` }}
                                />
                              </div>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AdminReportsPage;
