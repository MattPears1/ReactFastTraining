import {injectable, BindingScope} from '@loopback/core';
import {repository} from '@loopback/repository';
import {CourseRepository, BookingRepository} from '../repositories';

export interface CourseAnalytics {
  courseId: number;
  courseName: string;
  category: string;
  totalBookings: number;
  completedBookings: number;
  revenue: number;
  fillRate: number;
  popularDays: string[];
  popularMonths: string[];
}

export interface BookingFunnel {
  date: Date;
  totalVisitors: number;
  viewedCourses: number;
  startedBooking: number;
  completedBooking: number;
  conversionRate: number;
}

export interface RevenueByPeriod {
  period: string;
  revenue: number;
  bookings: number;
  averageOrderValue: number;
}

@injectable({scope: BindingScope.SINGLETON})
export class AnalyticsService {
  constructor(
    @repository(CourseRepository)
    private courseRepository: CourseRepository,
    @repository(BookingRepository)
    private bookingRepository: BookingRepository,
  ) {}

  async getCoursePopularity(timeRange: '7days' | '30days' | '90days'): Promise<CourseAnalytics[]> {
    const startDate = this.getStartDate(timeRange);
    
    const query = `
      SELECT 
        c.id as course_id,
        c.name as course_name,
        c.category,
        COUNT(DISTINCT b.id) as total_bookings,
        COUNT(DISTINCT CASE WHEN b.status IN ('ATTENDED', 'COMPLETED') THEN b.id END) as completed_bookings,
        SUM(b.final_amount) as revenue,
        AVG(b.number_of_participants::float / cs.max_participants::float * 100) as fill_rate,
        ARRAY_AGG(DISTINCT TO_CHAR(cs.start_datetime, 'Day')) as popular_days,
        ARRAY_AGG(DISTINCT TO_CHAR(cs.start_datetime, 'Month')) as popular_months
      FROM courses c
      LEFT JOIN course_schedules cs ON c.id = cs.course_id
      LEFT JOIN bookings b ON cs.id = b.session_id
      WHERE cs.start_datetime >= $1
        AND b.status NOT IN ('CANCELLED', 'PENDING')
      GROUP BY c.id, c.name, c.category
      ORDER BY total_bookings DESC
    `;
    
    const result = await this.courseRepository.dataSource.execute(query, [startDate]);
    return result;
  }

  async getRevenueByCoursue(startDate: Date, endDate: Date): Promise<RevenueByPeriod[]> {
    const query = `
      SELECT 
        c.name as period,
        SUM(b.final_amount) as revenue,
        COUNT(b.id) as bookings,
        AVG(b.final_amount) as average_order_value
      FROM courses c
      LEFT JOIN course_schedules cs ON c.id = cs.course_id
      LEFT JOIN bookings b ON cs.id = b.session_id
      WHERE cs.start_datetime BETWEEN $1 AND $2
        AND b.payment_status = 'paid'
      GROUP BY c.id, c.name
      ORDER BY revenue DESC
    `;
    
    const result = await this.courseRepository.dataSource.execute(query, [startDate, endDate]);
    return result;
  }

  async getDayOfWeekAnalysis(courseId?: number): Promise<any> {
    const whereClause = courseId ? 'WHERE c.id = $1' : '';
    const params = courseId ? [courseId] : [];
    
    const query = `
      SELECT 
        c.name as course_name,
        EXTRACT(DOW FROM cs.start_datetime) as day_of_week,
        TO_CHAR(cs.start_datetime, 'Day') as day_name,
        COUNT(b.id) as bookings,
        AVG(b.number_of_participants::float / cs.max_participants::float * 100) as avg_fill_rate
      FROM courses c
      JOIN course_schedules cs ON c.id = cs.course_id
      JOIN bookings b ON cs.id = b.session_id
      ${whereClause}
      GROUP BY c.name, day_of_week, day_name
      ORDER BY c.name, day_of_week
    `;
    
    const result = await this.courseRepository.dataSource.execute(query, params);
    return result;
  }

  async getMonthlyTrends(year: number): Promise<any> {
    const query = `
      SELECT 
        c.name as course_name,
        EXTRACT(MONTH FROM cs.start_datetime) as month,
        TO_CHAR(cs.start_datetime, 'Month') as month_name,
        COUNT(b.id) as bookings,
        SUM(b.final_amount) as revenue
      FROM courses c
      JOIN course_schedules cs ON c.id = cs.course_id
      JOIN bookings b ON cs.id = b.session_id
      WHERE EXTRACT(YEAR FROM cs.start_datetime) = $1
        AND b.payment_status = 'paid'
      GROUP BY c.name, month, month_name
      ORDER BY month
    `;
    
    const result = await this.courseRepository.dataSource.execute(query, [year]);
    return result;
  }

  async getBookingFunnel(dateRange: 'last7days' | 'last30days' | 'last90days'): Promise<BookingFunnel[]> {
    // This would require visitor tracking implementation
    // For now, return mock data structure
    const days = parseInt(dateRange.replace(/\D/g, ''));
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);
    
    // In real implementation, this would query visitor_analytics table
    return [
      {
        date: new Date(),
        totalVisitors: 1000,
        viewedCourses: 600,
        startedBooking: 200,
        completedBooking: 150,
        conversionRate: 15.0
      }
    ];
  }

  async getErrorSummary(category?: string): Promise<any> {
    const whereClause = category ? 'WHERE category = $1' : '';
    const params = category ? [category] : [];
    
    const query = `
      SELECT 
        DATE(created_at) as date,
        error_level,
        category,
        COUNT(*) as error_count,
        COUNT(DISTINCT user_email) as affected_users
      FROM error_logs
      WHERE created_at >= CURRENT_DATE - INTERVAL '7 days'
        ${category ? 'AND category = $1' : ''}
      GROUP BY DATE(created_at), error_level, category
      ORDER BY date DESC, error_count DESC
    `;
    
    const result = await this.courseRepository.dataSource.execute(query, params);
    return result;
  }

  private getStartDate(timeRange: '7days' | '30days' | '90days'): Date {
    const days = parseInt(timeRange.replace('days', ''));
    const date = new Date();
    date.setDate(date.getDate() - days);
    return date;
  }

  async updateCourseAnalytics(date: Date): Promise<void> {
    // This would be called by a scheduled job to update analytics tables
    const query = `
      INSERT INTO course_analytics (
        course_id, date, day_of_week, month, year,
        sessions_scheduled, total_bookings, completed_bookings,
        cancelled_bookings, revenue_generated, net_revenue,
        total_capacity, seats_filled, fill_rate
      )
      SELECT 
        c.id,
        $1::date,
        EXTRACT(DOW FROM $1::date),
        EXTRACT(MONTH FROM $1::date),
        EXTRACT(YEAR FROM $1::date),
        COUNT(DISTINCT cs.id),
        COUNT(DISTINCT b.id),
        COUNT(DISTINCT CASE WHEN b.status IN ('ATTENDED', 'COMPLETED') THEN b.id END),
        COUNT(DISTINCT CASE WHEN b.status = 'CANCELLED' THEN b.id END),
        COALESCE(SUM(b.final_amount), 0),
        COALESCE(SUM(b.final_amount), 0) - COALESCE(SUM(b.refund_amount), 0),
        SUM(cs.max_participants),
        SUM(b.number_of_participants),
        AVG(b.number_of_participants::float / cs.max_participants::float * 100)
      FROM courses c
      LEFT JOIN course_schedules cs ON c.id = cs.course_id 
        AND DATE(cs.start_datetime) = $1::date
      LEFT JOIN bookings b ON cs.id = b.session_id
      GROUP BY c.id
      ON CONFLICT (course_id, date) 
      DO UPDATE SET
        sessions_scheduled = EXCLUDED.sessions_scheduled,
        total_bookings = EXCLUDED.total_bookings,
        completed_bookings = EXCLUDED.completed_bookings,
        cancelled_bookings = EXCLUDED.cancelled_bookings,
        revenue_generated = EXCLUDED.revenue_generated,
        net_revenue = EXCLUDED.net_revenue,
        total_capacity = EXCLUDED.total_capacity,
        seats_filled = EXCLUDED.seats_filled,
        fill_rate = EXCLUDED.fill_rate,
        updated_at = CURRENT_TIMESTAMP
    `;
    
    await this.courseRepository.dataSource.execute(query, [date]);
  }
}