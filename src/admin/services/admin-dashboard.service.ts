import axios, { AxiosInstance } from 'axios';

interface DashboardMetrics {
  revenue: {
    current: number;
    previous: number;
    change: number;
  };
  bookings: {
    current: number;
    previous: number;
    change: number;
  };
  users: {
    total: number;
    new: number;
    active: number;
  };
  courses: {
    upcoming: number;
    inProgress: number;
    completed: number;
  };
}

interface RevenueData {
  date: string;
  revenue: number;
  bookings: number;
}

interface BookingStatus {
  status: string;
  count: number;
  percentage: number;
}

interface UpcomingSchedule {
  id: number;
  courseName: string;
  date: string;
  time: string;
  venue: string;
  currentCapacity: number;
  maxCapacity: number;
}

interface ActivityItem {
  id: number;
  action: string;
  user: string;
  timestamp: string;
  details: string;
}

interface DashboardOverview {
  metrics: DashboardMetrics;
  revenueData: RevenueData[];
  bookingStatus: BookingStatus[];
  upcomingSchedules: UpcomingSchedule[];
  recentActivity: ActivityItem[];
}

class AdminDashboardService {
  private api: AxiosInstance;

  constructor() {
    this.api = axios.create({
      baseURL: import.meta.env.VITE_API_URL || 'http://localhost:3000',
    });

    // Add auth token to requests
    this.api.interceptors.request.use((config) => {
      const token = localStorage.getItem('adminAccessToken');
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
      return config;
    });
  }

  async getDashboardOverview(): Promise<DashboardOverview> {
    const response = await this.api.get<DashboardOverview>('/api/admin/dashboard/overview');
    return response.data;
  }

  async getRevenueAnalytics(period: 'week' | 'month' | 'year' = 'month'): Promise<any> {
    const response = await this.api.get('/api/admin/analytics/revenue', {
      params: { period }
    });
    return response.data;
  }

  async getBookingAnalytics(filters?: any): Promise<any> {
    const response = await this.api.get('/api/admin/analytics/bookings', {
      params: filters
    });
    return response.data;
  }

  async getUserAnalytics(segment?: string): Promise<any> {
    const response = await this.api.get('/api/admin/analytics/users', {
      params: { segment }
    });
    return response.data;
  }

  async getTrafficAnalytics(page?: string): Promise<any> {
    const response = await this.api.get('/api/admin/analytics/traffic', {
      params: { page }
    });
    return response.data;
  }

  async exportReport(reportType: string, format: 'pdf' | 'excel' | 'csv'): Promise<Blob> {
    const response = await this.api.post('/api/admin/export/analytics', {
      reportType,
      format
    }, {
      responseType: 'blob'
    });
    return response.data;
  }
}

export const adminDashboardService = new AdminDashboardService();