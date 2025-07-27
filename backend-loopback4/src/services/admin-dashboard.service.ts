import { injectable, inject } from '@loopback/core';
import { repository } from '@loopback/repository';
import { 
  BookingRepository, 
  CourseSessionRepository, 
  UserRepository,
  BookingAttendeeRepository,
  RefundRepository,
  SpecialRequirementRepository
} from '../repositories';
import { sql } from '@loopback/repository';

interface DashboardStats {
  today: {
    count: number;
    revenue: number;
  };
  week: {
    count: number;
    revenue: number;
    attendees: number;
  };
  month: {
    count: number;
    revenue: number;
    attendees: number;
  };
  upcomingSessions: SessionSummary[];
  pendingRefunds: {
    count: number;
    totalAmount: number;
  };
  recentActivity: ActivityLog[];
  chartData: {
    dailyStats: DailyStats[];
    coursePopularity: CourseStats[];
  };
}

interface SessionSummary {
  session: any;
  bookingsCount: number;
  attendeesCount: number;
  remainingSpots: number;
}

interface ActivityLog {
  type: 'new_booking' | 'cancellation' | 'update';
  booking: any;
  user: any;
  timestamp: Date;
}

interface DailyStats {
  date: string;
  bookings: number;
  revenue: number;
  attendees: number;
}

interface CourseStats {
  courseType: string;
  bookings: number;
  attendees: number;
  revenue: number;
}

@injectable()
export class AdminDashboardService {
  constructor(
    @repository(BookingRepository)
    protected bookingRepository: BookingRepository,
    @repository(CourseSessionRepository)
    protected courseSessionRepository: CourseSessionRepository,
    @repository(UserRepository)
    protected userRepository: UserRepository,
    @repository(BookingAttendeeRepository)
    protected bookingAttendeeRepository: BookingAttendeeRepository,
    @repository(RefundRepository)
    protected refundRepository: RefundRepository,
    @repository(SpecialRequirementRepository)
    protected specialRequirementRepository: SpecialRequirementRepository,
  ) {}

  async getDashboardStats(dateRange?: { start: Date; end: Date }): Promise<DashboardStats> {
    const now = new Date();
    const startOfDay = new Date(now.setHours(0, 0, 0, 0));
    const startOfWeek = new Date(now);
    startOfWeek.setDate(now.getDate() - now.getDay());
    startOfWeek.setHours(0, 0, 0, 0);
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    // Today's bookings
    const todayBookings = await this.bookingRepository.find({
      where: {
        createdAt: { gte: startOfDay },
        status: 'confirmed'
      }
    });

    const todayStats = {
      count: todayBookings.length,
      revenue: todayBookings.reduce((sum, b) => sum + (b.totalAmount || 0), 0)
    };

    // This week's stats
    const weekBookings = await this.bookingRepository.find({
      where: {
        createdAt: { gte: startOfWeek },
        status: 'confirmed'
      },
      include: ['attendees']
    });

    const weekAttendees = weekBookings.reduce((sum, b) => 
      sum + (b.attendees?.length || 0), 0
    );

    const weekStats = {
      count: weekBookings.length,
      revenue: weekBookings.reduce((sum, b) => sum + (b.totalAmount || 0), 0),
      attendees: weekAttendees
    };

    // Month stats
    const monthBookings = await this.bookingRepository.find({
      where: {
        createdAt: { gte: startOfMonth },
        status: 'confirmed'
      },
      include: ['attendees']
    });

    const monthAttendees = monthBookings.reduce((sum, b) => 
      sum + (b.attendees?.length || 0), 0
    );

    const monthStats = {
      count: monthBookings.length,
      revenue: monthBookings.reduce((sum, b) => sum + (b.totalAmount || 0), 0),
      attendees: monthAttendees
    };

    // Upcoming sessions
    const upcomingSessions = await this.getUpcomingSessions();

    // Pending refunds
    const pendingRefunds = await this.getPendingRefunds();

    // Recent activity
    const recentActivity = await this.getRecentActivity();

    // Chart data
    const chartData = await this.getChartData(dateRange);

    return {
      today: todayStats,
      week: weekStats,
      month: monthStats,
      upcomingSessions,
      pendingRefunds,
      recentActivity,
      chartData
    };
  }

  private async getUpcomingSessions(): Promise<SessionSummary[]> {
    const upcomingSessions = await this.courseSessionRepository.find({
      where: {
        sessionDate: { gte: new Date() },
        status: 'scheduled'
      },
      order: ['sessionDate ASC', 'startTime ASC'],
      limit: 10,
      include: [
        {
          relation: 'bookings',
          scope: {
            where: { status: 'confirmed' },
            include: ['attendees']
          }
        }
      ]
    });

    return upcomingSessions.map(session => {
      const bookingsCount = session.bookings?.length || 0;
      const attendeesCount = session.bookings?.reduce((sum, b) => 
        sum + (b.attendees?.length || 0), 0
      ) || 0;
      
      return {
        session,
        bookingsCount,
        attendeesCount,
        remainingSpots: Math.max(0, (session.maxCapacity || 0) - attendeesCount)
      };
    });
  }

  private async getPendingRefunds(): Promise<{ count: number; totalAmount: number }> {
    const pendingRefunds = await this.refundRepository.find({
      where: { status: 'pending' }
    });

    return {
      count: pendingRefunds.length,
      totalAmount: pendingRefunds.reduce((sum, r) => sum + (r.amount || 0), 0)
    };
  }

  private async getRecentActivity(): Promise<ActivityLog[]> {
    const recentBookings = await this.bookingRepository.find({
      order: ['updatedAt DESC'],
      limit: 20,
      include: ['user']
    });

    return recentBookings.map(booking => {
      let type: 'new_booking' | 'cancellation' | 'update' = 'update';
      
      if (booking.createdAt === booking.updatedAt) {
        type = 'new_booking';
      } else if (booking.status === 'cancelled') {
        type = 'cancellation';
      }

      return {
        type,
        booking,
        user: booking.user,
        timestamp: booking.updatedAt!
      };
    });
  }

  private async getChartData(dateRange?: { start: Date; end: Date }): Promise<{
    dailyStats: DailyStats[];
    coursePopularity: CourseStats[];
  }> {
    const days = 30; // Last 30 days
    const endDate = dateRange?.end || new Date();
    const startDate = dateRange?.start || new Date(endDate.getTime() - days * 24 * 60 * 60 * 1000);

    // Daily bookings and revenue
    const bookingsInRange = await this.bookingRepository.find({
      where: {
        createdAt: {
          gte: startDate,
          lte: endDate
        },
        status: 'confirmed'
      },
      include: ['attendees', 'session']
    });

    // Group by date
    const dailyStatsMap = new Map<string, DailyStats>();
    
    bookingsInRange.forEach(booking => {
      const dateStr = booking.createdAt!.toISOString().split('T')[0];
      
      if (!dailyStatsMap.has(dateStr)) {
        dailyStatsMap.set(dateStr, {
          date: dateStr,
          bookings: 0,
          revenue: 0,
          attendees: 0
        });
      }
      
      const stats = dailyStatsMap.get(dateStr)!;
      stats.bookings += 1;
      stats.revenue += booking.totalAmount || 0;
      stats.attendees += booking.attendees?.length || 0;
    });

    const dailyStats = Array.from(dailyStatsMap.values()).sort((a, b) => 
      a.date.localeCompare(b.date)
    );

    // Course popularity
    const courseStatsMap = new Map<string, CourseStats>();
    
    bookingsInRange.forEach(booking => {
      const courseType = booking.session?.courseType || 'Unknown';
      
      if (!courseStatsMap.has(courseType)) {
        courseStatsMap.set(courseType, {
          courseType,
          bookings: 0,
          attendees: 0,
          revenue: 0
        });
      }
      
      const stats = courseStatsMap.get(courseType)!;
      stats.bookings += 1;
      stats.attendees += booking.attendees?.length || 0;
      stats.revenue += booking.totalAmount || 0;
    });

    const coursePopularity = Array.from(courseStatsMap.values()).sort((a, b) => 
      b.revenue - a.revenue
    );

    return {
      dailyStats,
      coursePopularity
    };
  }

  async getDetailedBookingList(filters: {
    search?: string;
    status?: string;
    dateFrom?: Date;
    dateTo?: Date;
    courseType?: string;
    page?: number;
    limit?: number;
  }) {
    const { page = 1, limit = 25 } = filters;
    const offset = (page - 1) * limit;

    const whereConditions: any = {};

    if (filters.status && filters.status !== 'all') {
      whereConditions.status = filters.status;
    }

    if (filters.dateFrom || filters.dateTo) {
      whereConditions.createdAt = {};
      if (filters.dateFrom) {
        whereConditions.createdAt.gte = filters.dateFrom;
      }
      if (filters.dateTo) {
        whereConditions.createdAt.lte = filters.dateTo;
      }
    }

    const bookings = await this.bookingRepository.find({
      where: whereConditions,
      order: ['createdAt DESC'],
      limit,
      offset,
      include: [
        'user',
        'session',
        'attendees',
        {
          relation: 'payment',
          scope: {
            include: ['refunds']
          }
        }
      ]
    });

    const count = await this.bookingRepository.count(whereConditions);

    // Filter by search term if provided
    let filteredBookings = bookings;
    if (filters.search) {
      const searchLower = filters.search.toLowerCase();
      filteredBookings = bookings.filter(booking => 
        booking.bookingReference?.toLowerCase().includes(searchLower) ||
        booking.user?.name?.toLowerCase().includes(searchLower) ||
        booking.user?.email?.toLowerCase().includes(searchLower)
      );
    }

    // Filter by course type if provided
    if (filters.courseType) {
      filteredBookings = filteredBookings.filter(booking => 
        booking.session?.courseType === filters.courseType
      );
    }

    return {
      bookings: filteredBookings.map(booking => ({
        id: booking.id,
        bookingReference: booking.bookingReference,
        userName: booking.user?.name || 'Unknown',
        userEmail: booking.user?.email || '',
        courseType: booking.session?.courseType || 'Unknown',
        sessionDate: booking.session?.sessionDate,
        attendeeCount: booking.attendees?.length || 0,
        status: booking.status,
        totalAmount: booking.totalAmount,
        paymentStatus: booking.payment?.status || 'pending',
        hasRefund: booking.payment?.refunds && booking.payment.refunds.length > 0,
        createdAt: booking.createdAt
      })),
      total: count.count,
      page,
      totalPages: Math.ceil(count.count / limit)
    };
  }

  async bulkUpdateBookings(bookingIds: string[], action: string, data?: any) {
    const results = [];

    for (const bookingId of bookingIds) {
      try {
        switch (action) {
          case 'cancel':
            await this.bookingRepository.updateById(bookingId, {
              status: 'cancelled',
              cancelledAt: new Date(),
              cancellationReason: data?.reason || 'Admin bulk cancellation'
            });
            // TODO: Trigger refund process
            break;

          case 'confirm':
            await this.bookingRepository.updateById(bookingId, {
              status: 'confirmed'
            });
            break;

          case 'email':
            // TODO: Queue email job
            break;
        }

        results.push({ bookingId, success: true });
      } catch (error) {
        results.push({ bookingId, success: false, error: error.message });
      }
    }

    return results;
  }

  async exportBookings(filters: any): Promise<string> {
    const bookings = await this.getDetailedBookingList({ ...filters, limit: 10000 });
    
    // Generate CSV
    const headers = [
      'Booking Reference',
      'Client Name',
      'Client Email',
      'Course Type',
      'Session Date',
      'Attendees',
      'Status',
      'Amount',
      'Payment Status',
      'Created Date'
    ];

    const rows = bookings.bookings.map(booking => [
      booking.bookingReference,
      booking.userName,
      booking.userEmail,
      booking.courseType,
      booking.sessionDate ? new Date(booking.sessionDate).toLocaleDateString() : '',
      booking.attendeeCount.toString(),
      booking.status,
      `£${booking.totalAmount.toFixed(2)}`,
      booking.paymentStatus,
      new Date(booking.createdAt).toLocaleDateString()
    ]);

    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
    ].join('\n');

    return csvContent;
  }
}