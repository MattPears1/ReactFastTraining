import { useState, useEffect } from "react";
import { useToast } from "@contexts/ToastContext";
import { ReportData, DateRange } from "../types";

// Mock data - replace with actual API call
const getMockData = (): ReportData => ({
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
});

export const useReportData = (dateRange: DateRange) => {
  const { showToast } = useToast();
  const [loading, setLoading] = useState(true);
  const [reportData, setReportData] = useState<ReportData | null>(null);

  const loadReportData = async () => {
    try {
      setLoading(true);
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 500));
      const data = getMockData();
      setReportData(data);
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

  return { loading, reportData, refetch: loadReportData };
};