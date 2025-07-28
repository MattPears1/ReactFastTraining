import { apiService } from '@/services/api.service';

export interface AnalyticsOverview {
  totalRevenue: number;
  revenueChange: number;
  totalBookings: number;
  bookingsChange: number;
  uniqueVisitors: number;
  visitorsChange: number;
  conversionRate: number;
  conversionChange: number;
}

export interface CoursePopularity {
  courseName: string;
  bookings: number;
  capacity: number;
}

export interface RevenueByourse {
  courseName: string;
  revenue: number;
  percentage: number;
}

export interface DayOfWeekData {
  day: string;
  bookings: number;
  revenue: number;
}

export interface MonthlyTrend {
  month: string;
  bookings: number;
  revenue: number;
  attendees: number;
}

export interface BookingFunnel {
  visitors: number;
  coursesViewed: number;
  bookingStarted: number;
  bookingCompleted: number;
  bookingCancelled: number;
}

export interface CourseDetail {
  courseName: string;
  totalBookings: number;
  revenue: number;
  avgAttendees: number;
  fillRate: number;
  popularDay: string;
}

export interface ComprehensiveAnalytics {
  overview: AnalyticsOverview;
  coursePopularity: CoursePopularity[];
  revenueByourse: RevenueByourse[];
  dayOfWeekAnalysis: DayOfWeekData[];
  monthlyTrends: MonthlyTrend[];
  bookingFunnel: BookingFunnel;
  courseDetails: CourseDetail[];
}

class AdminAnalyticsService {
  private baseURL = import.meta.env.PROD ? '' : (import.meta.env.VITE_API_URL || 'http://localhost:3000');

  async getComprehensiveAnalytics(timeRange: string): Promise<ComprehensiveAnalytics> {
    try {
      const response = await fetch(`${this.baseURL}/api/admin/analytics/comprehensive?range=${timeRange}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('adminToken')}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error('Failed to fetch analytics');
      }

      return await response.json();
    } catch (error) {
      console.error('Analytics fetch error:', error);
      // Return mock data for development
      return this.getMockAnalytics();
    }
  }

  async getCoursePopularity(days: number = 30): Promise<CoursePopularity[]> {
    try {
      const response = await fetch(`${this.baseURL}/api/admin/analytics/course-popularity?days=${days}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('adminToken')}`,
        },
      });

      if (!response.ok) {
        throw new Error('Failed to fetch course popularity');
      }

      return await response.json();
    } catch (error) {
      console.error('Course popularity fetch error:', error);
      return [];
    }
  }

  async getRevenueByourse(days: number = 30): Promise<RevenueByourse[]> {
    try {
      const response = await fetch(`${this.baseURL}/api/admin/analytics/revenue-by-course?days=${days}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('adminToken')}`,
        },
      });

      if (!response.ok) {
        throw new Error('Failed to fetch revenue by course');
      }

      return await response.json();
    } catch (error) {
      console.error('Revenue by course fetch error:', error);
      return [];
    }
  }

  async getDayOfWeekAnalysis(days: number = 30): Promise<DayOfWeekData[]> {
    try {
      const response = await fetch(`${this.baseURL}/api/admin/analytics/day-of-week?days=${days}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('adminToken')}`,
        },
      });

      if (!response.ok) {
        throw new Error('Failed to fetch day of week analysis');
      }

      return await response.json();
    } catch (error) {
      console.error('Day of week analysis fetch error:', error);
      return [];
    }
  }

  async getBookingFunnel(days: number = 30): Promise<BookingFunnel> {
    try {
      const response = await fetch(`${this.baseURL}/api/admin/analytics/booking-funnel?days=${days}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('adminToken')}`,
        },
      });

      if (!response.ok) {
        throw new Error('Failed to fetch booking funnel');
      }

      return await response.json();
    } catch (error) {
      console.error('Booking funnel fetch error:', error);
      return {
        visitors: 0,
        coursesViewed: 0,
        bookingStarted: 0,
        bookingCompleted: 0,
        bookingCancelled: 0,
      };
    }
  }

  private getMockAnalytics(): ComprehensiveAnalytics {
    return {
      overview: {
        totalRevenue: 45650,
        revenueChange: 12.5,
        totalBookings: 324,
        bookingsChange: 8.3,
        uniqueVisitors: 2847,
        visitorsChange: 15.2,
        conversionRate: 11.4,
        conversionChange: 2.1,
      },
      coursePopularity: [
        { courseName: 'Emergency First Aid at Work', bookings: 87, capacity: 120 },
        { courseName: 'First Aid at Work', bookings: 65, capacity: 80 },
        { courseName: 'Paediatric First Aid', bookings: 52, capacity: 60 },
        { courseName: 'Mental Health First Aid', bookings: 43, capacity: 50 },
        { courseName: 'Fire Safety Training', bookings: 38, capacity: 40 },
        { courseName: 'Basic Life Support', bookings: 39, capacity: 40 },
      ],
      revenueByourse: [
        { courseName: 'Emergency First Aid at Work', revenue: 6525, percentage: 28.5 },
        { courseName: 'First Aid at Work', revenue: 9750, percentage: 21.3 },
        { courseName: 'Paediatric First Aid', revenue: 7800, percentage: 17.1 },
        { courseName: 'Mental Health First Aid', revenue: 8600, percentage: 18.8 },
        { courseName: 'Fire Safety Training', revenue: 4560, percentage: 10.0 },
        { courseName: 'Basic Life Support', revenue: 1950, percentage: 4.3 },
      ],
      dayOfWeekAnalysis: [
        { day: 'Monday', bookings: 58, revenue: 4350 },
        { day: 'Tuesday', bookings: 72, revenue: 5400 },
        { day: 'Wednesday', bookings: 85, revenue: 6375 },
        { day: 'Thursday', bookings: 91, revenue: 6825 },
        { day: 'Friday', bookings: 45, revenue: 3375 },
        { day: 'Saturday', bookings: 32, revenue: 2400 },
        { day: 'Sunday', bookings: 12, revenue: 900 },
      ],
      monthlyTrends: [
        { month: 'January', bookings: 28, revenue: 2100, attendees: 140 },
        { month: 'February', bookings: 35, revenue: 2625, attendees: 175 },
        { month: 'March', bookings: 42, revenue: 3150, attendees: 210 },
        { month: 'April', bookings: 38, revenue: 2850, attendees: 190 },
        { month: 'May', bookings: 45, revenue: 3375, attendees: 225 },
        { month: 'June', bookings: 52, revenue: 3900, attendees: 260 },
      ],
      bookingFunnel: {
        visitors: 2847,
        coursesViewed: 1423,
        bookingStarted: 412,
        bookingCompleted: 324,
        bookingCancelled: 88,
      },
      courseDetails: [
        {
          courseName: 'Emergency First Aid at Work',
          totalBookings: 87,
          revenue: 6525,
          avgAttendees: 8.2,
          fillRate: 72.5,
          popularDay: 'Thursday',
        },
        {
          courseName: 'First Aid at Work',
          totalBookings: 65,
          revenue: 9750,
          avgAttendees: 10.5,
          fillRate: 81.3,
          popularDay: 'Wednesday',
        },
        {
          courseName: 'Paediatric First Aid',
          totalBookings: 52,
          revenue: 7800,
          avgAttendees: 9.8,
          fillRate: 86.7,
          popularDay: 'Tuesday',
        },
      ],
    };
  }
}

export const adminAnalyticsService = new AdminAnalyticsService();