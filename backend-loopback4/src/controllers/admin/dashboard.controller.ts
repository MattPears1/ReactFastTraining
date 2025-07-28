import {
  get,
  response,
} from '@loopback/rest';
import {inject} from '@loopback/core';
import {authenticate} from '@loopback/authentication';
import {authorize} from '@loopback/authorization';
import {repository} from '@loopback/repository';
import {
  CourseSessionRepository,
  BookingRepository,
  UserRepository,
  CourseRepository,
} from '../../repositories';
import {SecurityBindings, securityId, UserProfile} from '@loopback/security';
import {BookingStatus, SessionStatus} from '../../models';

export class AdminDashboardController {
  constructor(
    @repository(CourseSessionRepository)
    public courseSessionRepository: CourseSessionRepository,
    @repository(BookingRepository)
    public bookingRepository: BookingRepository,
    @repository(UserRepository)
    public userRepository: UserRepository,
    @repository(CourseRepository)
    public courseRepository: CourseRepository,
  ) {}

  @get('/api/admin/dashboard/overview')
  @authenticate('jwt')
  @authorize({allowedRoles: ['admin']})
  @response(200, {
    description: 'Dashboard overview data',
    content: {
      'application/json': {
        schema: {
          type: 'object',
          properties: {
            metrics: {type: 'object'},
            revenueData: {type: 'array'},
            bookingStatus: {type: 'array'},
            upcomingSchedules: {type: 'array'},
            recentActivity: {type: 'array'},
          },
        },
      },
    },
  })
  async getDashboardOverview(
    @inject(SecurityBindings.USER) currentUserProfile: UserProfile,
  ): Promise<any> {
    // Get current date
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const endOfLastMonth = new Date(now.getFullYear(), now.getMonth(), 0);

    // Get metrics
    const currentMonthBookings = await this.bookingRepository.count({
      createdAt: {gte: startOfMonth},
    });

    const lastMonthBookings = await this.bookingRepository.count({
      and: [
        {createdAt: {gte: startOfLastMonth}},
        {createdAt: {lte: endOfLastMonth}},
      ],
    });

    // Calculate revenue (simplified - would need payment integration)
    const currentMonthRevenue = await this.calculateRevenue(startOfMonth, now);
    const lastMonthRevenue = await this.calculateRevenue(startOfLastMonth, endOfLastMonth);

    const totalUsers = await this.userRepository.count();
    const newUsersThisMonth = await this.userRepository.count({
      createdAt: {gte: startOfMonth},
    });

    // Get upcoming sessions with course details
    const upcomingSessions = await this.courseSessionRepository.find({
      where: {
        startDate: {gte: now},
        status: {neq: SessionStatus.CANCELLED},
      },
      order: ['startDate ASC'],
      limit: 5,
      include: ['course', 'location'],
    });

    // Format upcoming schedules for frontend
    const upcomingSchedules = upcomingSessions.map((session: any) => ({
      id: session.id, // UUID string, but frontend will handle it
      courseName: session.course?.name || 'Unknown Course',
      date: session.startDate,
      time: session.startTime,
      venue: session.location?.name || 'Unknown Venue',
      currentCapacity: session.currentParticipants,
      maxCapacity: session.maxParticipants,
    }));

    // Get booking status distribution
    const bookingStatuses = await this.getBookingStatusDistribution();

    // Get revenue data for chart (last 6 months)
    const revenueData = await this.getRevenueData(6);

    // Get recent activity (simplified)
    const recentActivity = await this.getRecentActivity();

    // Count courses by status
    const upcomingCourses = await this.courseSessionRepository.count({
      startDate: {gte: now},
      status: {neq: 'CANCELLED'},
    });

    const inProgressCourses = await this.courseSessionRepository.count({
      and: [
        {startDate: {lte: now}},
        {endDate: {gte: now}},
        {status: SessionStatus.IN_PROGRESS},
      ],
    });

    const completedCourses = await this.courseSessionRepository.count({
      status: SessionStatus.COMPLETED,
    });

    return {
      metrics: {
        revenue: {
          current: currentMonthRevenue,
          previous: lastMonthRevenue,
          change: lastMonthRevenue > 0 
            ? ((currentMonthRevenue - lastMonthRevenue) / lastMonthRevenue) * 100 
            : 0,
        },
        bookings: {
          current: currentMonthBookings.count,
          previous: lastMonthBookings.count,
          change: lastMonthBookings.count > 0
            ? ((currentMonthBookings.count - lastMonthBookings.count) / lastMonthBookings.count) * 100
            : 0,
        },
        users: {
          total: totalUsers.count,
          new: newUsersThisMonth.count,
          active: Math.floor(totalUsers.count * 0.7), // Simplified - would need real activity tracking
        },
        courses: {
          upcoming: upcomingCourses.count,
          inProgress: inProgressCourses.count,
          completed: completedCourses.count,
        },
      },
      revenueData,
      bookingStatus: bookingStatuses,
      upcomingSchedules,
      recentActivity,
    };
  }

  private async calculateRevenue(startDate: Date, endDate: Date): Promise<number> {
    // Simplified revenue calculation - would need to aggregate from payments
    const bookings = await this.bookingRepository.find({
      where: {
        and: [
          {createdAt: {gte: startDate}},
          {createdAt: {lte: endDate}},
          {status: BookingStatus.CONFIRMED},
        ],
      },
    });

    // Assuming £75 per booking for now
    return bookings.length * 75;
  }

  private async getBookingStatusDistribution(): Promise<any[]> {
    const total = await this.bookingRepository.count();
    const confirmed = await this.bookingRepository.count({status: BookingStatus.CONFIRMED});
    const pending = await this.bookingRepository.count({status: BookingStatus.PENDING});
    const cancelled = await this.bookingRepository.count({status: BookingStatus.CANCELLED});

    const totalCount = total.count || 1; // Avoid division by zero

    return [
      {
        status: 'Confirmed',
        count: confirmed.count,
        percentage: (confirmed.count / totalCount) * 100,
      },
      {
        status: 'Pending',
        count: pending.count,
        percentage: (pending.count / totalCount) * 100,
      },
      {
        status: 'Cancelled',
        count: cancelled.count,
        percentage: (cancelled.count / totalCount) * 100,
      },
    ];
  }

  private async getRevenueData(months: number): Promise<any[]> {
    const data = [];
    const now = new Date();

    for (let i = months - 1; i >= 0; i--) {
      const startOfMonth = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const endOfMonth = new Date(now.getFullYear(), now.getMonth() - i + 1, 0);

      const bookingsCount = await this.bookingRepository.count({
        and: [
          {createdAt: {gte: startOfMonth}},
          {createdAt: {lte: endOfMonth}},
          {status: BookingStatus.CONFIRMED},
        ],
      });

      const revenue = bookingsCount.count * 75; // Simplified

      data.push({
        date: startOfMonth.toISOString().slice(0, 7), // YYYY-MM format
        revenue,
        bookings: bookingsCount.count,
      });
    }

    return data;
  }

  private async getRecentActivity(): Promise<any[]> {
    // Simplified recent activity - would need proper activity logging
    const recentBookings = await this.bookingRepository.find({
      order: ['createdAt DESC'],
      limit: 5,
      include: ['user'],
    });

    return recentBookings.map((booking: any, index: number) => ({
      id: index + 1,
      action: 'New booking',
      user: booking.user?.name || 'Unknown User',
      timestamp: booking.createdAt,
      details: `Booked for session on ${new Date(booking.sessionDate).toLocaleDateString()}`,
    }));
  }
}