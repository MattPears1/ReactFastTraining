import React, { useState } from "react";
import {
  PoundSterling,
  Users,
  Award,
  Activity,
} from "lucide-react";
import { useAuth } from "@contexts/AuthContext";
import {
  MetricCard,
  DateRangeSelector,
  ExportButtons,
  TabNavigation,
  RevenueAnalysis,
  BookingTrends,
  AttendanceMetrics,
  CoursePerformance,
} from "@admin/features/reports/components";
import { useReportData } from "@admin/features/reports/hooks/useReportData";
import { DateRange, ReportTab } from "@admin/features/reports/types";
import { PREDEFINED_DATE_RANGES } from "@admin/features/reports/constants";

const AdminReportsPage: React.FC = () => {
  const { user } = useAuth();
  
  // State
  const [dateRange, setDateRange] = useState<DateRange>(PREDEFINED_DATE_RANGES[1]); // Last 30 Days
  const [activeTab, setActiveTab] = useState<ReportTab>("revenue");
  
  // Custom hook for data fetching
  const { loading, reportData } = useReportData(dateRange);

  if (loading) {
    return (
      <div className="flex justify-center items-center h-96">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  if (!reportData) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500">No data available</p>
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
            <DateRangeSelector
              dateRange={dateRange}
              onDateRangeChange={setDateRange}
            />
            <ExportButtons />
          </div>
        </div>
      </div>

      {/* Key Metrics Summary */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
        <MetricCard
          title="Total Revenue"
          value={`£${reportData.revenue.total.toLocaleString()}`}
          change={{ value: 12.5, positive: true }}
          icon={PoundSterling}
          iconColor="text-green-600"
        />
        <MetricCard
          title="Total Bookings"
          value={reportData.bookings.total}
          change={{ value: 8.3, positive: true }}
          icon={Users}
          iconColor="text-blue-600"
        />
        <MetricCard
          title="Completion Rate"
          value={`${reportData.attendance.completionRate}%`}
          change={{ value: 2.1, positive: true }}
          icon={Award}
          iconColor="text-purple-600"
        />
        <MetricCard
          title="Avg. Utilization"
          value={`${reportData.courses.utilizationRate}%`}
          change={{ value: 3.2, positive: false }}
          icon={Activity}
          iconColor="text-orange-600"
        />
      </div>

      {/* Report Tabs */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow">
        <TabNavigation activeTab={activeTab} onTabChange={setActiveTab} />

        {/* Tab Content */}
        <div className="p-6">
          {activeTab === "revenue" && <RevenueAnalysis reportData={reportData} />}
          {activeTab === "bookings" && <BookingTrends reportData={reportData} />}
          {activeTab === "attendance" && <AttendanceMetrics reportData={reportData} />}
          {activeTab === "courses" && <CoursePerformance reportData={reportData} />}
        </div>
      </div>
    </div>
  );
};

export default AdminReportsPage;