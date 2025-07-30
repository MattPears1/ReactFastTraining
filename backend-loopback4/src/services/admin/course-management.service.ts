import {bind, BindingScope} from '@loopback/core';
import {repository} from '@loopback/repository';
import {CourseSessionRepository, BookingRepository, LocationRepository} from '../../repositories';
import {CourseSession, SessionStatus} from '../../models';
import {HttpErrors} from '@loopback/rest';
import {websocketService} from '../websocket.service';

export interface CreateSessionData {
  courseId: string;
  trainerId: string;
  locationId: string;
  startDate: Date;
  endDate: Date;
  startTime: string;
  endTime: string;
  maxParticipants?: number;
  pricePerPerson: number;
  notes?: string;
}

export interface RecurringSessionData extends CreateSessionData {
  recurrenceEndDate: Date;
  daysOfWeek: number[]; // 0 = Sunday, 6 = Saturday
}

@bind({scope: BindingScope.SINGLETON})
export class CourseManagementService {
  constructor(
    @repository(CourseSessionRepository)
    private courseSessionRepository: CourseSessionRepository,
    @repository(BookingRepository)
    private bookingRepository: BookingRepository,
    @repository(LocationRepository)
    private locationRepository: LocationRepository,
  ) {}

  /**
   * Create a single course session
   */
  async createSession(data: CreateSessionData): Promise<CourseSession> {
    // Validate max participants doesn't exceed 12
    const maxParticipants = Math.min(data.maxParticipants || 12, 12);

    // Check for scheduling conflicts
    const conflicts = await this.checkScheduleConflicts(
      data.trainerId,
      data.startDate,
      data.endDate,
      data.startTime,
      data.endTime,
    );

    if (conflicts.length > 0) {
      throw new HttpErrors.Conflict(
        `Schedule conflict: Trainer already has a session on ${conflicts[0].startDate}`
      );
    }

    // Check location availability
    const locationConflicts = await this.checkLocationConflicts(
      data.locationId,
      data.startDate,
      data.endDate,
      data.startTime,
      data.endTime,
    );

    if (locationConflicts.length > 0) {
      throw new HttpErrors.Conflict(
        `Location conflict: Location is already booked for another session`
      );
    }

    // Create the session
    const session = await this.courseSessionRepository.create({
      courseId: data.courseId,
      trainerId: data.trainerId,
      locationId: data.locationId,
      startDate: data.startDate,
      endDate: data.endDate,
      startTime: data.startTime,
      endTime: data.endTime,
      maxParticipants,
      currentParticipants: 0,
      pricePerPerson: data.pricePerPerson,
      status: SessionStatus.SCHEDULED,
      notes: data.notes,
      isOnsite: false,
    });

    // Emit session created event
    websocketService.emitSessionCreated(session);

    return session;
  }

  /**
   * Create recurring sessions
   */
  async createRecurringSessions(data: RecurringSessionData): Promise<CourseSession[]> {
    const sessions: CourseSession[] = [];
    const currentDate = new Date(data.startDate);
    const endDate = new Date(data.recurrenceEndDate);

    // Validate max participants
    const maxParticipants = Math.min(data.maxParticipants || 12, 12);

    while (currentDate <= endDate) {
      // Check if current day is in the selected days of week
      if (data.daysOfWeek.includes(currentDate.getDay())) {
        try {
          // Calculate session end date (for multi-day courses, though we're limiting to 1 day)
          const sessionEndDate = new Date(currentDate);
          const daysDiff = Math.floor((data.endDate.getTime() - data.startDate.getTime()) / (1000 * 60 * 60 * 24));
          sessionEndDate.setDate(sessionEndDate.getDate() + daysDiff);

          const session = await this.createSession({
            ...data,
            startDate: new Date(currentDate),
            endDate: sessionEndDate,
            maxParticipants,
          });
          sessions.push(session);
        } catch (error) {
          // Log conflict but continue with other dates
          console.warn(`Skipping session on ${currentDate.toISOString()} due to conflict:`, error.message);
        }
      }
      
      // Move to next day
      currentDate.setDate(currentDate.getDate() + 1);
    }

    if (sessions.length === 0) {
      throw new HttpErrors.BadRequest('No sessions could be created due to conflicts');
    }

    return sessions;
  }

  /**
   * Update a course session
   */
  async updateSession(
    sessionId: string,
    updates: Partial<CourseSession>
  ): Promise<CourseSession> {
    const existing = await this.courseSessionRepository.findById(sessionId);

    if (!existing) {
      throw new HttpErrors.NotFound('Session not found');
    }

    // Ensure max participants doesn't exceed 12
    if (updates.maxParticipants) {
      updates.maxParticipants = Math.min(updates.maxParticipants, 12);
    }

    // Check if date/time changed and has bookings
    const hasTimeChange = 
      updates.startDate !== undefined || 
      updates.endDate !== undefined ||
      updates.startTime !== undefined || 
      updates.endTime !== undefined;

    if (hasTimeChange && existing.currentParticipants > 0) {
      // TODO: Implement notification to attendees
      console.log('Session time change detected - notifications would be sent');
    }

    // Update the session
    await this.courseSessionRepository.updateById(sessionId, {
      ...updates,
      updatedAt: new Date(),
    });

    const updated = await this.courseSessionRepository.findById(sessionId);

    // Emit update event
    if (existing.currentParticipants !== updated.currentParticipants) {
      websocketService.emitCapacityUpdate(
        sessionId,
        updated.currentParticipants,
        updated.maxParticipants - updated.currentParticipants
      );
    }

    return updated;
  }

  /**
   * Cancel a course session
   */
  async cancelSession(sessionId: string, reason: string): Promise<CourseSession> {
    const session = await this.courseSessionRepository.findById(sessionId);

    if (!session) {
      throw new HttpErrors.NotFound('Session not found');
    }

    if (session.status === SessionStatus.CANCELLED) {
      throw new HttpErrors.BadRequest('Session is already cancelled');
    }

    // Update session status
    await this.courseSessionRepository.updateById(sessionId, {
      status: SessionStatus.CANCELLED,
      notes: `Cancelled: ${reason}`,
      updatedAt: new Date(),
    });

    // Handle bookings if any exist
    if (session.currentParticipants > 0) {
      // TODO: Process refunds and send notifications
      console.log('Session has bookings - refunds and notifications would be processed');
    }

    // Emit cancellation event
    websocketService.emitSessionCancelled(sessionId, reason);

    return this.courseSessionRepository.findById(sessionId);
  }

  /**
   * Clone an existing session
   */
  async cloneSession(
    sessionId: string,
    newDate: Date
  ): Promise<CourseSession> {
    const original = await this.courseSessionRepository.findById(sessionId);

    if (!original) {
      throw new HttpErrors.NotFound('Original session not found');
    }

    // Calculate new end date based on duration
    const duration = original.endDate.getTime() - original.startDate.getTime();
    const newEndDate = new Date(newDate.getTime() + duration);

    return this.createSession({
      courseId: original.courseId,
      trainerId: original.trainerId,
      locationId: original.locationId,
      startDate: newDate,
      endDate: newEndDate,
      startTime: original.startTime,
      endTime: original.endTime,
      maxParticipants: original.maxParticipants,
      pricePerPerson: original.pricePerPerson,
      notes: `Cloned from session ${sessionId}`,
    });
  }

  /**
   * Check for trainer scheduling conflicts
   */
  private async checkScheduleConflicts(
    trainerId: string,
    startDate: Date,
    endDate: Date,
    startTime: string,
    endTime: string
  ): Promise<CourseSession[]> {
    // Find sessions for the same trainer on overlapping dates
    const sessions = await this.courseSessionRepository.find({
      where: {
        trainerId,
        status: {neq: SessionStatus.CANCELLED},
        and: [
          {startDate: {lte: endDate}},
          {endDate: {gte: startDate}},
        ],
      },
    });

    // Check time overlaps
    return sessions.filter(session => {
      // If different days, no time conflict
      if (session.startDate.toDateString() !== startDate.toDateString()) {
        return false;
      }

      // Check time overlap
      return this.timeOverlaps(
        session.startTime,
        session.endTime,
        startTime,
        endTime
      );
    });
  }

  /**
   * Check for location conflicts
   */
  private async checkLocationConflicts(
    locationId: string,
    startDate: Date,
    endDate: Date,
    startTime: string,
    endTime: string
  ): Promise<CourseSession[]> {
    const sessions = await this.courseSessionRepository.find({
      where: {
        locationId,
        status: {neq: SessionStatus.CANCELLED},
        and: [
          {startDate: {lte: endDate}},
          {endDate: {gte: startDate}},
        ],
      },
    });

    return sessions.filter(session => {
      if (session.startDate.toDateString() !== startDate.toDateString()) {
        return false;
      }

      return this.timeOverlaps(
        session.startTime,
        session.endTime,
        startTime,
        endTime
      );
    });
  }

  /**
   * Check if two time ranges overlap
   */
  private timeOverlaps(
    start1: string,
    end1: string,
    start2: string,
    end2: string
  ): boolean {
    const toMinutes = (time: string) => {
      const [hours, minutes] = time.split(':').map(Number);
      return hours * 60 + minutes;
    };

    const start1Min = toMinutes(start1);
    const end1Min = toMinutes(end1);
    const start2Min = toMinutes(start2);
    const end2Min = toMinutes(end2);

    return start1Min < end2Min && start2Min < end1Min;
  }
}