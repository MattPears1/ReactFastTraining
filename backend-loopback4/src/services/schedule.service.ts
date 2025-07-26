import {injectable, BindingScope} from '@loopback/core';
import {repository} from '@loopback/repository';
import {
  CourseSessionRepository,
  TrainerRepository,
  LocationRepository,
  BookingRepository,
} from '../repositories';
import {CourseSession, SessionStatus} from '../models';
import {EmailService} from './email.service';
import {CronJob, cronJob} from '@loopback/cron';

@injectable({scope: BindingScope.SINGLETON})
export class ScheduleService {
  constructor(
    @repository(CourseSessionRepository)
    private courseSessionRepository: CourseSessionRepository,
    @repository(TrainerRepository)
    private trainerRepository: TrainerRepository,
    @repository(LocationRepository)
    private locationRepository: LocationRepository,
    @repository(BookingRepository)
    private bookingRepository: BookingRepository,
    private emailService: EmailService,
  ) {}

  @cronJob({
    name: 'send-course-reminders',
    onTick: async () => {
      await this.sendCourseReminders();
    },
    cronTime: '0 9 * * *', // Every day at 9 AM
    start: true,
  })
  async sendCourseReminders(): Promise<void> {
    try {
      const bookings = await this.bookingRepository.findUpcomingBookingsForReminder();
      
      for (const booking of bookings) {
        if (booking.session) {
          await this.emailService.sendCourseReminder(booking, booking.session);
        }
      }
    } catch (error) {
      console.error('Failed to send course reminders:', error);
    }
  }

  @cronJob({
    name: 'cleanup-pending-bookings',
    onTick: async () => {
      await this.cleanupPendingBookings();
    },
    cronTime: '0 0 * * *', // Every day at midnight
    start: true,
  })
  async cleanupPendingBookings(): Promise<void> {
    try {
      const pendingBookings = await this.bookingRepository.findPendingBookings();
      
      for (const booking of pendingBookings) {
        await this.bookingRepository.updateById(booking.id, {
          status: 'CANCELLED',
        });
        
        // Update session participant count
        await this.courseSessionRepository.updateParticipantCount(booking.sessionId);
      }
    } catch (error) {
      console.error('Failed to cleanup pending bookings:', error);
    }
  }

  @cronJob({
    name: 'update-session-status',
    onTick: async () => {
      await this.updateSessionStatuses();
    },
    cronTime: '0 * * * *', // Every hour
    start: true,
  })
  async updateSessionStatuses(): Promise<void> {
    try {
      // Mark in-progress sessions
      const startingSessions = await this.courseSessionRepository.find({
        where: {
          status: SessionStatus.CONFIRMED,
          startDate: {lte: new Date()},
          endDate: {gte: new Date()},
        },
      });
      
      for (const session of startingSessions) {
        await this.courseSessionRepository.updateById(session.id, {
          status: SessionStatus.IN_PROGRESS,
        });
      }
      
      // Mark completed sessions
      const completedSessions = await this.courseSessionRepository.find({
        where: {
          status: SessionStatus.IN_PROGRESS,
          endDate: {lt: new Date()},
        },
      });
      
      for (const session of completedSessions) {
        await this.courseSessionRepository.updateById(session.id, {
          status: SessionStatus.COMPLETED,
        });
      }
    } catch (error) {
      console.error('Failed to update session statuses:', error);
    }
  }

  async getTrainerAvailability(
    trainerId: string,
    startDate: Date,
    endDate: Date,
  ): Promise<{available: boolean; conflicts: CourseSession[]}> {
    const sessions = await this.trainerRepository.sessions(trainerId).find({
      where: {
        and: [
          {status: {neq: SessionStatus.CANCELLED}},
          {
            or: [
              {
                and: [
                  {startDate: {lte: startDate}},
                  {endDate: {gte: startDate}},
                ],
              },
              {
                and: [
                  {startDate: {lte: endDate}},
                  {endDate: {gte: endDate}},
                ],
              },
            ],
          },
        ],
      },
    });
    
    return {
      available: sessions.length === 0,
      conflicts: sessions,
    };
  }

  async getLocationAvailability(
    locationId: string,
    startDate: Date,
    endDate: Date,
  ): Promise<boolean> {
    return this.locationRepository.checkAvailability(locationId, startDate, endDate);
  }

  async suggestAlternativeDates(
    courseId: string,
    trainerId: string,
    locationId: string,
    preferredStartDate: Date,
    durationDays: number,
  ): Promise<Date[]> {
    const suggestions: Date[] = [];
    const checkDate = new Date(preferredStartDate);
    const maxAttempts = 30; // Check up to 30 days ahead
    
    for (let i = 0; i < maxAttempts && suggestions.length < 5; i++) {
      const endDate = new Date(checkDate);
      endDate.setDate(endDate.getDate() + durationDays - 1);
      
      const trainerAvailable = await this.getTrainerAvailability(trainerId, checkDate, endDate);
      const locationAvailable = await this.getLocationAvailability(locationId, checkDate, endDate);
      
      if (trainerAvailable.available && locationAvailable) {
        suggestions.push(new Date(checkDate));
      }
      
      checkDate.setDate(checkDate.getDate() + 1);
    }
    
    return suggestions;
  }
}