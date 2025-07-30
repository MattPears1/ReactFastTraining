import { injectable, inject } from '@loopback/core';
import { db } from '../db';
import { 
  bookings, 
  courseSchedules,
  venues, 
  courses,
  adminAlerts,
  users
} from '../db/schema';
import { eq, and, sql, ne, gte, lte } from 'drizzle-orm';
import { HttpErrors } from '@loopback/rest';

export interface BookingValidationData {
  courseScheduleId: number;
  numberOfParticipants: number;
  totalAmount: number;
  email: string;
  userId?: number;
}

export interface ValidationResult {
  isValid: boolean;
  errors: ValidationError[];
  warnings: ValidationWarning[];
}

export interface ValidationError {
  code: string;
  message: string;
  field?: string;
}

export interface ValidationWarning {
  code: string;
  message: string;
}

export interface CapacityCheckResult {
  available: boolean;
  currentCapacity: number;
  maxCapacity: number;
  availableSpots: number;
  isFull: boolean;
}

export interface DuplicateCheckResult {
  isDuplicate: boolean;
  existingBookingId?: number;
  message?: string;
}

@injectable()
export class BookingValidationService {
  constructor(
    @inject('services.WebSocketService', { optional: true })
    private websocketService?: any,
  ) {}

  /**
   * Comprehensive booking validation
   */
  async validateBooking(data: BookingValidationData): Promise<ValidationResult> {
    const errors: ValidationError[] = [];
    const warnings: ValidationWarning[] = [];

    try {
      // Run all validations in parallel
      const [
        capacityResult,
        priceResult,
        duplicateResult,
        sessionResult
      ] = await Promise.all([
        this.checkCapacity(data.courseScheduleId, data.numberOfParticipants),
        this.validatePaymentAmount(data.courseScheduleId, data.totalAmount, data.numberOfParticipants),
        this.checkDuplicateBooking(data.courseScheduleId, data.email),
        this.validateSessionStatus(data.courseScheduleId)
      ]);

      // Process capacity check
      if (!capacityResult.available) {
        errors.push({
          code: 'INSUFFICIENT_CAPACITY',
          message: `Only ${capacityResult.availableSpots} spots available. You requested ${data.numberOfParticipants}.`,
          field: 'numberOfParticipants'
        });
      } else if (capacityResult.availableSpots <= 5) {
        warnings.push({
          code: 'LOW_CAPACITY',
          message: `Only ${capacityResult.availableSpots} spots remaining for this session.`
        });
      }

      // Process price validation
      if (!priceResult.isValid) {
        errors.push({
          code: 'INVALID_AMOUNT',
          message: priceResult.message,
          field: 'totalAmount'
        });
      }

      // Process duplicate check
      if (duplicateResult.isDuplicate) {
        errors.push({
          code: 'DUPLICATE_BOOKING',
          message: duplicateResult.message || 'A booking already exists for this email in this session.',
          field: 'email'
        });
      }

      // Process session status
      if (!sessionResult.isValid) {
        errors.push({
          code: 'INVALID_SESSION_STATUS',
          message: sessionResult.message
        });
      }

      // Additional business rule validations
      if (data.numberOfParticipants < 1) {
        errors.push({
          code: 'INVALID_PARTICIPANTS',
          message: 'Number of participants must be at least 1',
          field: 'numberOfParticipants'
        });
      }

      if (data.numberOfParticipants > 10) {
        warnings.push({
          code: 'LARGE_GROUP',
          message: 'For groups larger than 10, please contact us directly for special arrangements.'
        });
      }

      return {
        isValid: errors.length === 0,
        errors,
        warnings
      };
    } catch (error) {
      console.error('Booking validation error:', error);
      errors.push({
        code: 'VALIDATION_ERROR',
        message: 'An error occurred during validation. Please try again.'
      });
      return { isValid: false, errors, warnings };
    }
  }

  /**
   * Check session capacity with row locking
   */
  async checkCapacity(
    sessionId: number, 
    requestedParticipants: number
  ): Promise<CapacityCheckResult> {
    try {
      // Use a transaction with row locking
      const result = await db.transaction(async (tx) => {
        // Lock the session row for update
        const [session] = await tx
          .select({
            id: courseSchedules.id,
            currentCapacity: courseSchedules.currentCapacity,
            maxCapacity: courseSchedules.maxCapacity,
            status: courseSchedules.status,
          })
          .from(courseSchedules)
          .where(eq(courseSchedules.id, sessionId))
          .for('update')
          .limit(1);

        if (!session) {
          throw new HttpErrors.NotFound('Course session not found');
        }

        const availableSpots = session.maxCapacity - session.currentCapacity;
        const isFull = availableSpots <= 0;
        const available = availableSpots >= requestedParticipants;

        return {
          available,
          currentCapacity: session.currentCapacity,
          maxCapacity: session.maxCapacity,
          availableSpots,
          isFull
        };
      });

      return result;
    } catch (error) {
      console.error('Capacity check error:', error);
      throw error;
    }
  }

  /**
   * Validate payment amount matches course price
   */
  async validatePaymentAmount(
    sessionId: number,
    totalAmount: number,
    numberOfParticipants: number
  ): Promise<{ isValid: boolean; message: string; expectedAmount?: number }> {
    try {
      // Get course price
      const [sessionData] = await db
        .select({
          price: courses.price,
          courseName: courses.name,
        })
        .from(courseSchedules)
        .innerJoin(courses, eq(courseSchedules.courseId, courses.id))
        .where(eq(courseSchedules.id, sessionId))
        .limit(1);

      if (!sessionData) {
        return {
          isValid: false,
          message: 'Course session not found'
        };
      }

      const expectedAmount = parseFloat(sessionData.price) * numberOfParticipants;
      const tolerance = 0.01; // 1 penny tolerance for rounding

      if (Math.abs(totalAmount - expectedAmount) > tolerance) {
        return {
          isValid: false,
          message: `Payment amount £${totalAmount.toFixed(2)} does not match expected amount £${expectedAmount.toFixed(2)} for ${numberOfParticipants} participant(s) at £${sessionData.price} each.`,
          expectedAmount
        };
      }

      // Check for negative or zero amounts
      if (totalAmount <= 0) {
        return {
          isValid: false,
          message: 'Payment amount must be greater than zero'
        };
      }

      return {
        isValid: true,
        message: 'Payment amount is valid',
        expectedAmount
      };
    } catch (error) {
      console.error('Payment validation error:', error);
      return {
        isValid: false,
        message: 'Error validating payment amount'
      };
    }
  }

  /**
   * Check for duplicate bookings
   */
  async checkDuplicateBooking(
    sessionId: number,
    email: string
  ): Promise<DuplicateCheckResult> {
    try {
      const normalizedEmail = email.toLowerCase().trim();

      // Check for existing bookings with same email
      const existingBookings = await db
        .select({
          id: bookings.id,
          bookingReference: bookings.bookingReference,
          status: bookings.status,
          createdAt: bookings.createdAt,
        })
        .from(bookings)
        .where(and(
          eq(bookings.courseScheduleId, sessionId),
          eq(sql`LOWER(${bookings.userEmail})`, normalizedEmail),
          sql`${bookings.status} NOT IN ('cancelled', 'refunded', 'failed')`
        ));

      if (existingBookings.length > 0) {
        // Create admin alert for duplicate booking attempt
        await this.createDuplicateBookingAlert(sessionId, email, existingBookings[0]);

        return {
          isDuplicate: true,
          existingBookingId: existingBookings[0].id,
          message: `A booking already exists for ${email} in this session (Reference: ${existingBookings[0].bookingReference})`
        };
      }

      return { isDuplicate: false };
    } catch (error) {
      console.error('Duplicate check error:', error);
      // Don't fail the validation on error, just log it
      return { isDuplicate: false };
    }
  }

  /**
   * Validate session status and availability
   */
  async validateSessionStatus(
    sessionId: number
  ): Promise<{ isValid: boolean; message: string }> {
    try {
      const [session] = await db
        .select({
          status: courseSchedules.status,
          startDatetime: courseSchedules.startDatetime,
          endDatetime: courseSchedules.endDatetime,
        })
        .from(courseSchedules)
        .where(eq(courseSchedules.id, sessionId))
        .limit(1);

      if (!session) {
        return {
          isValid: false,
          message: 'Course session not found'
        };
      }

      // Check if session is cancelled
      if (session.status === 'cancelled') {
        return {
          isValid: false,
          message: 'This course session has been cancelled'
        };
      }

      // Check if session is full
      if (session.status === 'full') {
        return {
          isValid: false,
          message: 'This course session is full'
        };
      }

      // Check if session is in the past
      const now = new Date();
      if (session.startDatetime && new Date(session.startDatetime) < now) {
        return {
          isValid: false,
          message: 'Cannot book a session that has already started'
        };
      }

      // Check if session is published/available
      if (session.status !== 'published' && session.status !== 'draft') {
        return {
          isValid: false,
          message: 'This course session is not available for booking'
        };
      }

      return {
        isValid: true,
        message: 'Session is available for booking'
      };
    } catch (error) {
      console.error('Session validation error:', error);
      return {
        isValid: false,
        message: 'Error validating session status'
      };
    }
  }

  /**
   * Update session capacity after booking changes
   */
  async updateSessionCapacity(sessionId: number): Promise<void> {
    try {
      await db.transaction(async (tx) => {
        // Calculate total participants for the session
        const [{ totalParticipants }] = await tx
          .select({
            totalParticipants: sql`COALESCE(SUM(${bookings.numberOfParticipants}), 0)`,
          })
          .from(bookings)
          .where(and(
            eq(bookings.courseScheduleId, sessionId),
            sql`${bookings.status} IN ('confirmed', 'pending')`
          ));

        // Get current session details
        const [session] = await tx
          .select({
            maxCapacity: courseSchedules.maxCapacity,
            status: courseSchedules.status,
          })
          .from(courseSchedules)
          .where(eq(courseSchedules.id, sessionId))
          .limit(1);

        if (!session) return;

        const currentCapacity = Number(totalParticipants);
        const isFull = currentCapacity >= session.maxCapacity;

        // Update capacity and status
        await tx
          .update(courseSchedules)
          .set({
            currentCapacity,
            status: isFull ? 'full' : (session.status === 'full' ? 'published' : session.status),
            updatedAt: new Date(),
          })
          .where(eq(courseSchedules.id, sessionId));

        // Emit websocket event for real-time updates
        if (this.websocketService) {
          this.websocketService.emitCapacityUpdate({
            sessionId,
            currentCapacity,
            maxCapacity: session.maxCapacity,
            availableSpots: session.maxCapacity - currentCapacity,
            isFull
          });
        }

        // Create alert if session is nearly full
        const percentageFull = (currentCapacity / session.maxCapacity) * 100;
        if (percentageFull >= 80 && percentageFull < 100) {
          await this.createCapacityAlert(sessionId, currentCapacity, session.maxCapacity);
        }
      });
    } catch (error) {
      console.error('Error updating session capacity:', error);
      throw error;
    }
  }

  /**
   * Create admin alert for duplicate booking
   */
  private async createDuplicateBookingAlert(
    sessionId: number,
    email: string,
    existingBooking: any
  ): Promise<void> {
    try {
      await db.insert(adminAlerts).values({
        alertType: 'duplicate_booking_attempt',
        severity: 'medium',
        title: 'Duplicate Booking Attempt Detected',
        description: `Email ${email} attempted to book session ${sessionId} but already has booking ${existingBooking.bookingReference}`,
        metadata: {
          sessionId,
          email,
          existingBookingId: existingBooking.id,
          existingBookingReference: existingBooking.bookingReference,
          attemptTime: new Date().toISOString()
        },
      });
    } catch (error) {
      console.error('Error creating duplicate booking alert:', error);
    }
  }

  /**
   * Create admin alert for capacity warning
   */
  private async createCapacityAlert(
    sessionId: number,
    currentCapacity: number,
    maxCapacity: number
  ): Promise<void> {
    try {
      // Check if alert already exists for this session
      const existingAlert = await db
        .select()
        .from(adminAlerts)
        .where(and(
          eq(adminAlerts.alertType, 'session_nearly_full'),
          eq(sql`metadata->>'session_id'`, sessionId.toString()),
          gte(adminAlerts.createdAt, sql`NOW() - INTERVAL '24 hours'`)
        ))
        .limit(1);

      if (existingAlert.length === 0) {
        await db.insert(adminAlerts).values({
          alertType: 'session_nearly_full',
          severity: 'medium',
          title: 'Course Session Nearly Full',
          description: `Session ${sessionId} is at ${Math.round((currentCapacity / maxCapacity) * 100)}% capacity`,
          metadata: {
            sessionId,
            currentCapacity,
            maxCapacity,
            percentageFull: Math.round((currentCapacity / maxCapacity) * 100)
          },
        });
      }
    } catch (error) {
      console.error('Error creating capacity alert:', error);
    }
  }

  /**
   * Get session availability information
   */
  async getSessionAvailability(sessionId: number): Promise<any> {
    try {
      const [result] = await db
        .select({
          sessionId: courseSchedules.id,
          courseId: courseSchedules.courseId,
          courseName: courses.name,
          price: courses.price,
          startDatetime: courseSchedules.startDatetime,
          status: courseSchedules.status,
          maxCapacity: courseSchedules.maxCapacity,
          currentCapacity: courseSchedules.currentCapacity,
          availableSpots: sql`${courseSchedules.maxCapacity} - ${courseSchedules.currentCapacity}`,
          isFull: sql`CASE WHEN ${courseSchedules.currentCapacity} >= ${courseSchedules.maxCapacity} THEN true ELSE false END`,
          percentageFull: sql`ROUND((${courseSchedules.currentCapacity}::NUMERIC / NULLIF(${courseSchedules.maxCapacity}, 0)) * 100, 2)`,
        })
        .from(courseSchedules)
        .innerJoin(courses, eq(courseSchedules.courseId, courses.id))
        .where(eq(courseSchedules.id, sessionId))
        .limit(1);

      return result;
    } catch (error) {
      console.error('Error getting session availability:', error);
      throw error;
    }
  }

  /**
   * Recalculate capacity for all sessions
   */
  async recalculateAllCapacities(): Promise<{ updated: number }> {
    try {
      let updatedCount = 0;

      // Get all sessions
      const sessions = await db
        .select({ id: courseSchedules.id })
        .from(courseSchedules);

      // Update each session
      for (const session of sessions) {
        await this.updateSessionCapacity(session.id);
        updatedCount++;
      }

      return { updated: updatedCount };
    } catch (error) {
      console.error('Error recalculating capacities:', error);
      throw error;
    }
  }

  /**
   * Get all available sessions with real-time capacity
   */
  async getAvailableSessionsWithCapacity(): Promise<any[]> {
    try {
      const sessions = await db
        .select({
          id: courseSchedules.id,
          courseId: courseSchedules.courseId,
          courseName: courses.name,
          courseType: courses.code,
          courseDescription: courses.description,
          price: courses.price,
          startDatetime: courseSchedules.startDatetime,
          endDatetime: courseSchedules.endDatetime,
          venueId: courseSchedules.venueId,
          venueName: venues.name,
          venueCode: venues.code,
          venueAddress: venues.address,
          instructorId: courseSchedules.instructorId,
          instructorName: users.name,
          maxCapacity: courseSchedules.maxCapacity,
          currentCapacity: courseSchedules.currentCapacity,
          availableSpots: sql`${courseSchedules.maxCapacity} - ${courseSchedules.currentCapacity}`,
          status: courseSchedules.status,
          isFull: sql`CASE WHEN ${courseSchedules.currentCapacity} >= ${courseSchedules.maxCapacity} THEN true ELSE false END`,
          percentageFull: sql`ROUND((${courseSchedules.currentCapacity}::numeric / ${courseSchedules.maxCapacity}) * 100, 2)`,
        })
        .from(courseSchedules)
        .innerJoin(courses, eq(courseSchedules.courseId, courses.id))
        .leftJoin(venues, eq(courseSchedules.venueId, venues.id))
        .leftJoin(users, eq(courseSchedules.instructorId, users.id))
        .where(and(
          eq(courseSchedules.status, 'published'),
          sql`${courseSchedules.startDatetime} > NOW()`
        ))
        .orderBy(courseSchedules.startDatetime);

      return sessions.map(session => ({
        ...session,
        availableSpots: Number(session.availableSpots),
        percentageFull: Number(session.percentageFull),
      }));
    } catch (error) {
      console.error('Error getting available sessions:', error);
      throw error;
    }
  }
}