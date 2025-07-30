import { injectable, inject } from '@loopback/core';
import { repository } from '@loopback/repository';
import { 
  CourseSessionRepository, 
  BookingRepository,
  BookingAttendeeRepository,
  SpecialRequirementRepository,
  UserRepository
} from '../repositories';
import { EmailService } from './email.service';

interface CalendarSession {
  id: string;
  title: string;
  start: string;
  end: string;
  location: string;
  instructor: string;
  capacity: {
    max: number;
    booked: number;
    available: number;
    percentFull: number;
    status: 'available' | 'filling' | 'nearly-full' | 'full';
  };
  stats: {
    bookings: number;
    revenue: number;
    waitlist: number;
    hasSpecialRequirements: boolean;
  };
  color: string;
  editable: boolean;
}

@injectable()
export class CalendarManagementService {
  constructor(
    @repository(CourseSessionRepository)
    protected courseSessionRepository: CourseSessionRepository,
    @repository(BookingRepository)
    protected bookingRepository: BookingRepository,
    @repository(BookingAttendeeRepository)
    protected bookingAttendeeRepository: BookingAttendeeRepository,
    @repository(SpecialRequirementRepository)
    protected specialRequirementRepository: SpecialRequirementRepository,
    @repository(UserRepository)
    protected userRepository: UserRepository,
    @inject('services.EmailService')
    protected emailService: EmailService,
  ) {}

  async getCalendarSessions(
    startDate: Date,
    endDate: Date,
    filters?: {
      courseType?: string;
      location?: string;
      instructor?: string;
    }
  ): Promise<CalendarSession[]> {
    const whereConditions: any = {
      sessionDate: {
        gte: startDate,
        lte: endDate
      }
    };

    if (filters?.courseType) {
      whereConditions.courseType = filters.courseType;
    }
    if (filters?.location) {
      whereConditions.location = filters.location;
    }

    const sessions = await this.courseSessionRepository.find({
      where: whereConditions,
      include: [
        {
          relation: 'bookings',
          scope: {
            where: { status: { inq: ['confirmed', 'waitlist'] } },
            include: ['attendees', 'payment']
          }
        }
      ]
    });

    const calendarSessions = await Promise.all(
      sessions.map(async (session) => {
        const bookings = session.bookings || [];
        const confirmedBookings = bookings.filter(b => b.status === 'confirmed');
        const waitlistBookings = bookings.filter(b => b.status === 'waitlist');
        
        const attendeeCount = confirmedBookings.reduce((sum, booking) => 
          sum + (booking.attendees?.length || 0), 0
        );
        
        const revenue = confirmedBookings.reduce((sum, booking) => 
          sum + (booking.totalAmount || 0), 0
        );

        // Check for special requirements
        const hasSpecialRequirements = await this.hasSpecialRequirements(
          confirmedBookings.map(b => b.id!)
        );

        const percentFull = (attendeeCount / (session.maxCapacity || 1)) * 100;

        return this.formatCalendarEvent(
          session,
          attendeeCount,
          confirmedBookings.length,
          revenue,
          waitlistBookings.length,
          hasSpecialRequirements,
          percentFull
        );
      })
    );

    return calendarSessions;
  }

  private formatCalendarEvent(
    session: any,
    attendeeCount: number,
    bookingCount: number,
    revenue: number,
    waitlistCount: number,
    hasSpecialRequirements: boolean,
    percentFull: number
  ): CalendarSession {
    const sessionDate = new Date(session.sessionDate);
    const [startHour, startMin] = session.startTime.split(':').map(Number);
    const [endHour, endMin] = session.endTime.split(':').map(Number);
    
    const startDateTime = new Date(sessionDate);
    startDateTime.setHours(startHour, startMin);
    
    const endDateTime = new Date(sessionDate);
    endDateTime.setHours(endHour, endMin);

    return {
      id: session.id!,
      title: session.courseType,
      start: startDateTime.toISOString(),
      end: endDateTime.toISOString(),
      location: session.location || 'TBD',
      instructor: session.instructor || 'Lex',
      capacity: {
        max: session.maxCapacity || 0,
        booked: attendeeCount,
        available: Math.max(0, (session.maxCapacity || 0) - attendeeCount),
        percentFull,
        status: this.getCapacityStatus(percentFull)
      },
      stats: {
        bookings: bookingCount,
        revenue,
        waitlist: waitlistCount,
        hasSpecialRequirements
      },
      color: this.getEventColor(percentFull, session.status),
      editable: session.status === 'scheduled'
    };
  }

  private getCapacityStatus(percentFull: number): 'available' | 'filling' | 'nearly-full' | 'full' {
    if (percentFull >= 100) return 'full';
    if (percentFull >= 75) return 'nearly-full';
    if (percentFull >= 50) return 'filling';
    return 'available';
  }

  private getEventColor(percentFull: number, status: string): string {
    if (status === 'cancelled') return '#6B7280'; // Gray
    if (status === 'completed') return '#8B5CF6'; // Purple
    
    if (percentFull >= 100) return '#EF4444'; // Red
    if (percentFull >= 75) return '#F59E0B'; // Amber
    if (percentFull >= 50) return '#3B82F6'; // Blue
    return '#10B981'; // Green
  }

  private async hasSpecialRequirements(bookingIds: string[]): Promise<boolean> {
    if (bookingIds.length === 0) return false;
    
    const requirements = await this.specialRequirementRepository.count({
      bookingId: { inq: bookingIds }
    });
    
    return requirements.count > 0;
  }

  async rescheduleSession(
    sessionId: string,
    newDate: Date,
    newStartTime: string,
    newEndTime: string
  ): Promise<{ success: boolean; notified: number }> {
    // Check for conflicts
    const conflicts = await this.checkScheduleConflicts(
      sessionId,
      newDate,
      newStartTime,
      newEndTime
    );

    if (conflicts.length > 0) {
      throw new Error('Schedule conflict detected with existing sessions');
    }

    // Update session
    await this.courseSessionRepository.updateById(sessionId, {
      sessionDate: newDate,
      startTime: newStartTime,
      endTime: newEndTime,
      updatedAt: new Date()
    });

    // Get affected bookings
    const affectedBookings = await this.bookingRepository.find({
      where: {
        sessionId: sessionId,
        status: 'confirmed'
      },
      include: ['user']
    });

    // Send reschedule notifications
    let notified = 0;
    for (const booking of affectedBookings) {
      if (booking.user?.email) {
        try {
          await this.emailService.sendSessionRescheduleNotification({
            booking,
            user: booking.user,
            newDate,
            newStartTime,
            newEndTime
          });
          notified++;
        } catch (error) {
          console.error(`Failed to notify user ${booking.user.id}:`, error);
        }
      }
    }

    return { success: true, notified };
  }

  async checkScheduleConflicts(
    excludeSessionId: string,
    date: Date,
    startTime: string,
    endTime: string
  ): Promise<any[]> {
    const sessions = await this.courseSessionRepository.find({
      where: {
        id: { neq: excludeSessionId },
        sessionDate: date,
        status: 'scheduled'
      }
    });

    const conflicts = sessions.filter(session => {
      const sessionStart = this.timeToMinutes(session.startTime);
      const sessionEnd = this.timeToMinutes(session.endTime);
      const newStart = this.timeToMinutes(startTime);
      const newEnd = this.timeToMinutes(endTime);

      // Check for overlap
      return (
        (newStart >= sessionStart && newStart < sessionEnd) || // New starts during existing
        (newEnd > sessionStart && newEnd <= sessionEnd) ||     // New ends during existing
        (newStart <= sessionStart && newEnd >= sessionEnd)     // New encompasses existing
      );
    });

    return conflicts;
  }

  private timeToMinutes(time: string): number {
    const [hours, minutes] = time.split(':').map(Number);
    return hours * 60 + minutes;
  }

  async getSessionDetails(sessionId: string): Promise<{
    session: any;
    bookings: any[];
    totalRevenue: number;
    specialRequirements: any[];
  }> {
    const session = await this.courseSessionRepository.findById(sessionId, {
      include: [
        {
          relation: 'bookings',
          scope: {
            where: { status: 'confirmed' },
            include: ['user', 'attendees', 'payment']
          }
        }
      ]
    });

    const bookings = session.bookings || [];
    const bookingIds = bookings.map(b => b.id!);
    
    const specialRequirements = bookingIds.length > 0
      ? await this.specialRequirementRepository.find({
          where: { bookingId: { inq: bookingIds } }
        })
      : [];

    const totalRevenue = bookings.reduce((sum, booking) => 
      sum + (booking.totalAmount || 0), 0
    );

    return {
      session,
      bookings: bookings.map(booking => ({
        id: booking.id,
        bookingReference: booking.bookingReference,
        userName: booking.user?.name || 'Unknown',
        userEmail: booking.user?.email || '',
        attendeeCount: booking.attendees?.length || 0,
        totalAmount: booking.totalAmount,
        paymentStatus: booking.payment?.status || 'pending',
        hasSpecialRequirements: specialRequirements.some(sr => sr.bookingId === booking.id)
      })),
      totalRevenue,
      specialRequirements
    };
  }

  async cancelSession(sessionId: string): Promise<void> {
    const session = await this.courseSessionRepository.findById(sessionId, {
      include: [
        {
          relation: 'bookings',
          scope: {
            where: { status: 'confirmed' },
            include: ['user']
          }
        }
      ]
    });

    // Update session status
    await this.courseSessionRepository.updateById(sessionId, {
      status: 'cancelled',
      updatedAt: new Date()
    });

    // Cancel all bookings
    const bookings = session.bookings || [];
    for (const booking of bookings) {
      await this.bookingRepository.updateById(booking.id!, {
        status: 'cancelled',
        cancelledAt: new Date(),
        cancellationReason: 'Session cancelled by administrator'
      });

      // TODO: Process refunds

      // Send cancellation notification
      if (booking.user?.email) {
        try {
          await this.emailService.sendSessionCancellationNotification({
            booking,
            user: booking.user,
            session
          });
        } catch (error) {
          console.error(`Failed to notify user ${booking.user.id}:`, error);
        }
      }
    }
  }

  async createSession(data: {
    courseType: string;
    sessionDate: Date;
    startTime: string;
    endTime: string;
    maxCapacity: number;
    location: string;
    instructor?: string;
    price: number;
    notes?: string;
  }): Promise<any> {
    // Check for conflicts
    const conflicts = await this.checkScheduleConflicts(
      'new-session',
      data.sessionDate,
      data.startTime,
      data.endTime
    );

    if (conflicts.length > 0) {
      throw new Error('Schedule conflict detected with existing sessions');
    }

    const session = await this.courseSessionRepository.create({
      ...data,
      instructor: data.instructor || 'Lex',
      status: 'scheduled',
      createdAt: new Date(),
      updatedAt: new Date()
    });

    return session;
  }

  async updateSession(sessionId: string, updates: any): Promise<any> {
    if (updates.sessionDate || updates.startTime || updates.endTime) {
      const conflicts = await this.checkScheduleConflicts(
        sessionId,
        updates.sessionDate || (await this.courseSessionRepository.findById(sessionId)).sessionDate,
        updates.startTime || (await this.courseSessionRepository.findById(sessionId)).startTime,
        updates.endTime || (await this.courseSessionRepository.findById(sessionId)).endTime
      );

      if (conflicts.length > 0) {
        throw new Error('Schedule conflict detected with existing sessions');
      }
    }

    await this.courseSessionRepository.updateById(sessionId, {
      ...updates,
      updatedAt: new Date()
    });

    return this.courseSessionRepository.findById(sessionId);
  }
}