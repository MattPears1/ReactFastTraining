export interface DateRange {
  start: Date;
  end: Date;
  label: string;
}

export interface ReportData {
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

export interface CoursePerformance {
  name: string;
  sessions: number;
  attendees: number;
  avg: number;
  revenue: number;
  completion: number;
}

export type ReportTab = "revenue" | "bookings" | "attendance" | "courses";