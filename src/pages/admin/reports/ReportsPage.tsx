import React, { useState, useEffect } from 'react';
import {
  FileText,
  TrendingUp,
  Download,
  Activity
} from 'lucide-react';
import { useAuth } from '@contexts/AuthContext';
import { useToast } from '@contexts/ToastContext';
import { adminDashboardApi } from '@services/api/admin-dashboard.service';
import { cn } from '@utils/cn';
import { DateRange, ReportData, ReportTab } from './types';
import { DateRangePicker } from './components/DateRangePicker';
import { RevenueReport } from './components/RevenueReport';
import { BookingsReport } from './components/BookingsReport';
import { AttendanceReport } from './components/AttendanceReport';

const AdminReportsPage: React.FC = () => {
  const { user } = useAuth();
  const { showToast } = useToast();
  
  // State
  const [loading, setLoading] = useState(true);
  const [reportData, setReportData] = useState<ReportData | null>(null);
  const [dateRange, setDateRange] = useState<DateRange>({
    start: new Date(new Date().setMonth(new Date().getMonth() - 1)),
    end: new Date(),
    label: 'Last 30 Days'
  });
  const [activeTab, setActiveTab] = useState<ReportTab>('revenue');

  // Load report data
  const loadReportData = async () => {
    try {
      setLoading(true);
      // Simulate API call - replace with actual API
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      const mockData: ReportData = {
        revenue: {
          total: 45750,
          byMonth: [
            { month: 'Jan', amount: 12500 },
            { month: 'Feb', amount: 14200 },
            { month: 'Mar', amount: 13800 },
            { month: 'Apr', amount: 15250 }
          ],
          byCourse: [
            { course: 'Emergency First Aid', amount: 22875, percentage: 50 },
            { course: 'Paediatric First Aid', amount: 13725, percentage: 30 },
            { course: 'First Aid at Work', amount: 9150, percentage: 20 }
          ]
        },
        bookings: {
          total: 156,
          completed: 134,
          cancelled: 18,
          refunded: 4,
          trend: [
            { date: 'Week 1', count: 32 },
            { date: 'Week 2', count: 41 },
            { date: 'Week 3', count: 38 },
            { date: 'Week 4', count: 45 }
          ]
        },
        attendance: {
          totalAttendees: 1243,
          averagePerSession: 10.2,
          completionRate: 96,
          noShowRate: 8
        },
        courses: {
          mostPopular: 'Emergency First Aid at Work',
          totalSessions: 52,
          averageCapacity: 85,
          utilizationRate: 87
        }
      };
      
      setReportData(mockData);
    } catch (error) {
      showToast('Failed to load report data', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadReportData();
  }, [dateRange]);

  // Export report
  const handleExportReport = async (format: 'pdf' | 'csv' | 'excel') => {
    try {
      showToast(`Exporting ${activeTab} report as ${format.toUpperCase()}...`, 'info');
      // Implement actual export functionality
    } catch (error) {
      showToast('Failed to export report', 'error');
    }
  };

  const tabs: { id: ReportTab; label: string; icon: React.ReactNode }[] = [
    { id: 'revenue', label: 'Revenue', icon: <TrendingUp className="h-4 w-4" /> },
    { id: 'bookings', label: 'Bookings', icon: <FileText className="h-4 w-4" /> },
    { id: 'attendance', label: 'Attendance', icon: <Activity className="h-4 w-4" /> },
    { id: 'courses', label: 'Courses', icon: <Activity className="h-4 w-4" /> }
  ];

  const renderContent = () => {
    if (loading || !reportData) {
      return (
        <div className="flex items-center justify-center h-96">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Loading report data...</p>
          </div>
        </div>
      );
    }

    switch (activeTab) {
      case 'revenue':
        return <RevenueReport data={reportData} dateRangeLabel={dateRange.label} />;
      case 'bookings':
        return <BookingsReport data={reportData} dateRangeLabel={dateRange.label} />;
      case 'attendance':
        return <AttendanceReport data={reportData} dateRangeLabel={dateRange.label} />;
      case 'courses':
        return (
          <div className="text-center py-12 text-gray-500">
            Course reports coming soon
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
              <FileText className="h-7 w-7" />
              Reports & Analytics
            </h1>
            <p className="text-gray-600 mt-1">Track your business performance and insights</p>
          </div>
          
          <div className="flex items-center gap-3">
            <DateRangePicker
              dateRange={dateRange}
              onDateRangeChange={setDateRange}
            />
            
            <div className="relative group">
              <button className="flex items-center gap-2 px-4 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2">
                <Download className="h-4 w-4" />
                Export
              </button>
              <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-10">
                <div className="py-1">
                  <button
                    onClick={() => handleExportReport('pdf')}
                    className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                  >
                    Export as PDF
                  </button>
                  <button
                    onClick={() => handleExportReport('csv')}
                    className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                  >
                    Export as CSV
                  </button>
                  <button
                    onClick={() => handleExportReport('excel')}
                    className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                  >
                    Export as Excel
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="mb-6">
        <div className="border-b border-gray-200">
          <nav className="flex -mb-px space-x-8">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={cn(
                  "flex items-center gap-2 py-2 px-1 border-b-2 font-medium text-sm transition-colors",
                  activeTab === tab.id
                    ? "border-primary-500 text-primary-600"
                    : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                )}
              >
                {tab.icon}
                {tab.label}
              </button>
            ))}
          </nav>
        </div>
      </div>

      {/* Content */}
      {renderContent()}
    </div>
  );
};

export default AdminReportsPage;