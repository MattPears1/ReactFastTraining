import {bind, BindingScope, inject} from '@loopback/core';
import {repository, Transaction} from '@loopback/repository';
import {CourseSessionRepository, BookingRepository} from '../repositories';
import {CourseSession, SessionStatus} from '../models';
import {HttpErrors} from '@loopback/rest';
import {websocketService} from './websocket.service';
import {BaseService} from './base.service';

export interface SessionAvailability {
  sessionId: string;
  courseType: string;
  sessionDate: Date;
  startTime: string;
  endTime: string;
  location: string;
  currentBookings: number;
  maxCapacity: number;
  availableSpots: number;
  status: 'AVAILABLE' | 'ALMOST_FULL' | 'FULL';
}

export interface SessionFilters {
  startDate?: Date;
  endDate?: Date;
  courseType?: string;
  location?: string;
  showOnlyAvailable?: boolean;
}

export interface BookingCapacityResult {
  success: boolean;
  sessionId: string;
  previousCount: number;
  newCount: number;
  availableSpots: number;
  message?: string;
}

@bind({scope: BindingScope.SINGLETON})
export class CourseSessionCapacityService extends BaseService {
  private readonly MAX_CAPACITY_LIMIT = 12;

  constructor(
    @repository(CourseSessionRepository)
    private courseSessionRepository: CourseSessionRepository,
    @repository(BookingRepository)
    private bookingRepository: BookingRepository,
  ) {
    super('CourseSessionCapacityService');
  }

  /**
   * Get available sessions with real-time capacity information
   */
  async getAvailableSessions(filters: SessionFilters): Promise<SessionAvailability[]> {
    return this.executeWithErrorHandling('getAvailableSessions', async () => {
      // Validate date range if both dates provided
      if (filters.startDate && filters.endDate) {
        this.validateDateRange(filters.startDate, filters.endDate);
      }

      const whereClause: any = {
        status: SessionStatus.SCHEDULED,
      };

      if (filters.startDate) {
        whereClause.startDate = {gte: filters.startDate};
      }
      if (filters.endDate) {
        whereClause.endDate = {lte: filters.endDate};
      }

      const sessions = await this.courseSessionRepository.find({
        where: whereClause,
        include: ['course', 'location'],
      });

      const sessionAvailability: SessionAvailability[] = [];

      // Process sessions in parallel for better performance
      const processingPromises = sessions.map(async (session) => {
        try {
          const bookingCount = await this.bookingRepository.count({
            sessionId: session.id,
            status: {inq: ['CONFIRMED', 'PENDING']},
          });

          const currentBookings = bookingCount.count;
          const maxCapacity = Math.min(session.maxParticipants, this.MAX_CAPACITY_LIMIT);
          const availableSpots = maxCapacity - currentBookings;

          // Apply course type filter
          if (filters.courseType && session.course?.name !== filters.courseType) {
            return null;
          }

          // Apply location filter (simplified to A/B)
          const simplifiedLocation = this.getSimplifiedLocation(session.location?.name || '');
          if (filters.location && simplifiedLocation !== filters.location) {
            return null;
          }

          // Apply availability filter
          if (filters.showOnlyAvailable && availableSpots <= 0) {
            return null;
          }

          return {
            sessionId: session.id,
            courseType: session.course?.name || '',
            sessionDate: session.startDate,
            startTime: session.startTime,
            endTime: session.endTime,
            location: simplifiedLocation,
            currentBookings,
            maxCapacity,
            availableSpots,
            status: this.getAvailabilityStatus(availableSpots, maxCapacity),
          };
        } catch (error) {
          console.error(`Error processing session ${session.id}:`, error);
          return null;
        }
      });

      const results = await Promise.all(processingPromises);
      
      // Filter out null results and sort by date
      return results
        .filter((result): result is SessionAvailability => result !== null)
        .sort((a, b) => a.sessionDate.getTime() - b.sessionDate.getTime());
    });
  }

  /**
   * Increment booking count with atomic operation
   */
  async incrementBooking(
    sessionId: string, 
    numberOfParticipants: number = 1,
    transaction?: Transaction
  ): Promise<BookingCapacityResult> {
    return this.executeWithErrorHandling('incrementBooking', async () => {
      // Validate inputs
      this.validateRequired({sessionId}, ['sessionId']);
      this.validatePositiveNumber(numberOfParticipants, 'numberOfParticipants');

      // Use transaction for atomic operation
      const tx = transaction || await this.courseSessionRepository.dataSource.beginTransaction();
      
      try {
        // Get session with row-level lock
        const session = await this.courseSessionRepository.findById(sessionId, {}, {transaction: tx});
        
        if (!session) {
          throw new HttpErrors.NotFound('Session not found');
        }

        if (session.status !== SessionStatus.SCHEDULED) {
          throw new HttpErrors.BadRequest(`Cannot book ${session.status.toLowerCase()} session`);
        }

        // Get current booking count
        const currentCount = await this.bookingRepository.count(
          {
            sessionId,
            status: {inq: ['CONFIRMED', 'PENDING']},
          },
          {transaction: tx}
        );

        const currentBookings = currentCount.count;
        const maxCapacity = Math.min(session.maxParticipants, this.MAX_CAPACITY_LIMIT);
        const availableSpots = maxCapacity - currentBookings;
        
        if (availableSpots < numberOfParticipants) {
          if (!transaction) await tx.rollback();
          return {
            success: false,
            sessionId,
            previousCount: currentBookings,
            newCount: currentBookings,
            availableSpots,
            message: `Only ${availableSpots} spots available, requested ${numberOfParticipants}`
          };
        }

        const newCount = currentBookings + numberOfParticipants;

        // Update the current participants count
        await this.courseSessionRepository.updateById(
          sessionId, 
          {
            currentParticipants: newCount,
            updatedAt: new Date(),
          },
          {transaction: tx}
        );

        // Commit transaction if we created it
        if (!transaction) {
          await tx.commit();
        }

        // Emit WebSocket event after successful commit
        this.emitCapacityUpdate(sessionId, newCount, maxCapacity - newCount);

        // Log for audit
        await this.logOperation('incrementBooking', 'system', {
          sessionId,
          previousCount: currentBookings,
          newCount,
          numberOfParticipants
        });

        return {
          success: true,
          sessionId,
          previousCount: currentBookings,
          newCount,
          availableSpots: maxCapacity - newCount,
        };
      } catch (error) {
        if (!transaction) await tx.rollback();
        throw error;
      }
    });
  }

  /**
   * Decrement booking count
   */
  async decrementBooking(
    sessionId: string,
    numberOfParticipants: number = 1,
    transaction?: Transaction
  ): Promise<BookingCapacityResult> {
    return this.executeWithErrorHandling('decrementBooking', async () => {
      // Validate inputs
      this.validateRequired({sessionId}, ['sessionId']);
      this.validatePositiveNumber(numberOfParticipants, 'numberOfParticipants');

      const tx = transaction || await this.courseSessionRepository.dataSource.beginTransaction();
      
      try {
        const session = await this.courseSessionRepository.findById(sessionId, {}, {transaction: tx});
        
        if (!session) {
          throw new HttpErrors.NotFound('Session not found');
        }

        const currentCount = await this.bookingRepository.count(
          {
            sessionId,
            status: {inq: ['CONFIRMED', 'PENDING']},
          },
          {transaction: tx}
        );

        const currentBookings = currentCount.count;
        const newCount = Math.max(0, currentBookings - numberOfParticipants);
        const maxCapacity = Math.min(session.maxParticipants, this.MAX_CAPACITY_LIMIT);

        await this.courseSessionRepository.updateById(
          sessionId,
          {
            currentParticipants: newCount,
            updatedAt: new Date(),
          },
          {transaction: tx}
        );

        if (!transaction) {
          await tx.commit();
        }

        // Emit WebSocket event
        this.emitCapacityUpdate(sessionId, newCount, maxCapacity - newCount);

        // Log for audit
        await this.logOperation('decrementBooking', 'system', {
          sessionId,
          previousCount: currentBookings,
          newCount,
          numberOfParticipants
        });

        return {
          success: true,
          sessionId,
          previousCount: currentBookings,
          newCount,
          availableSpots: maxCapacity - newCount,
        };
      } catch (error) {
        if (!transaction) await tx.rollback();
        throw error;
      }
    });
  }

  /**
   * Check if a session has available capacity
   */
  async checkAvailability(sessionId: string): Promise<{
    available: boolean;
    currentCount: number;
    remainingSpots: number;
  }> {
    const session = await this.courseSessionRepository.findById(sessionId);
    
    if (!session) {
      throw new HttpErrors.NotFound('Session not found');
    }

    const bookingCount = await this.bookingRepository.count({
      sessionId,
      status: {inq: ['CONFIRMED', 'PENDING']},
    });

    const maxCapacity = Math.min(session.maxParticipants, 12);
    const remainingSpots = maxCapacity - bookingCount.count;

    return {
      available: remainingSpots > 0,
      currentCount: bookingCount.count,
      remainingSpots,
    };
  }

  /**
   * Get sessions for calendar display
   */
  async getCalendarSessions(startDate: Date, endDate: Date): Promise<any[]> {
    const sessions = await this.getAvailableSessions({
      startDate,
      endDate,
    });

    return sessions.map(session => ({
      id: session.sessionId,
      title: session.courseType,
      date: session.sessionDate,
      start: `${this.formatDate(session.sessionDate)}T${session.startTime}`,
      end: `${this.formatDate(session.sessionDate)}T${session.endTime}`,
      location: session.location,
      availableSpots: session.availableSpots,
      maxCapacity: session.maxCapacity,
      color: this.getCourseColor(session.courseType),
      extendedProps: {
        currentBookings: session.currentBookings,
        percentFull: Math.round((session.currentBookings / session.maxCapacity) * 100),
        status: session.status,
      },
    }));
  }

  /**
   * Helper method to simplify location to A/B
   */
  private getSimplifiedLocation(locationName: string): string {
    // Simple logic: locations starting with A-M go to Location A, N-Z go to Location B
    // This is a placeholder - adjust based on actual business logic
    if (!locationName) return 'Location A';
    
    const firstChar = locationName.toUpperCase().charAt(0);
    return firstChar <= 'M' ? 'Location A' : 'Location B';
  }

  /**
   * Get availability status based on remaining spots
   */
  private getAvailabilityStatus(availableSpots: number, maxCapacity: number): 'AVAILABLE' | 'ALMOST_FULL' | 'FULL' {
    if (availableSpots === 0) return 'FULL';
    if (availableSpots <= 3) return 'ALMOST_FULL';
    return 'AVAILABLE';
  }

  /**
   * Get color for course type
   */
  private getCourseColor(courseType: string): string {
    const colors: Record<string, string> = {
      'Emergency First Aid at Work': '#0EA5E9',
      'First Aid at Work': '#10B981',
      'Paediatric First Aid': '#F97316',
      'CPR and AED': '#8B5CF6',
      'Mental Health First Aid': '#EC4899',
      'Annual Skills Refresher': '#6366F1',
    };
    return colors[courseType] || '#6B7280';
  }

  /**
   * Format date to YYYY-MM-DD
   */
  private formatDate(date: Date): string {
    return date.toISOString().split('T')[0];
  }

  /**
   * Emit capacity update event via WebSocket
   */
  private emitCapacityUpdate(sessionId: string, currentBookings: number, maxCapacity: number): void {
    websocketService.emitCapacityUpdate(
      sessionId,
      currentBookings,
      maxCapacity - currentBookings
    );
  }
}