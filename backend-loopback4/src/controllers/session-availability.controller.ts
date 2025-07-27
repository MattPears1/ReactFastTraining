import {
  get,
  param,
  response,
  RestBindings,
  Request,
} from '@loopback/rest';
import { inject } from '@loopback/core';
import { BookingValidationService } from '../services/booking-validation.service';
import { db } from '../db';
import { courseSchedules, courses } from '../db/schema';
import { eq } from 'drizzle-orm';

export class SessionAvailabilityController {
  constructor(
    @inject('services.BookingValidationService')
    private validationService: BookingValidationService,
  ) {}

  /**
   * Check session availability
   */
  @get('/api/courses/sessions/{id}/availability', {
    responses: {
      '200': {
        description: 'Session availability information',
        content: {
          'application/json': {
            schema: {
              type: 'object',
              properties: {
                sessionId: { type: 'number' },
                available: { type: 'boolean' },
                availableSpots: { type: 'number' },
                status: { type: 'string' },
                price: { type: 'number' },
                isFull: { type: 'boolean' },
                message: { type: 'string' },
              },
            },
          },
        },
      },
      '404': {
        description: 'Session not found',
      },
    },
  })
  async checkAvailability(
    @param.path.number('id') sessionId: number,
  ): Promise<any> {
    try {
      // Get session availability
      const availability = await this.validationService.getSessionAvailability(sessionId);
      
      if (!availability) {
        throw { statusCode: 404, message: 'Session not found' };
      }

      // Determine availability message
      let message = '';
      if (availability.isFull) {
        message = 'This session is full';
      } else if (availability.availableSpots <= 5) {
        message = `Only ${availability.availableSpots} spots remaining!`;
      } else {
        message = `${availability.availableSpots} spots available`;
      }

      return {
        sessionId: availability.sessionId,
        available: availability.availableSpots > 0 && availability.status === 'published',
        availableSpots: Number(availability.availableSpots),
        currentCapacity: availability.currentCapacity,
        maxCapacity: availability.maxCapacity,
        status: availability.status,
        price: parseFloat(availability.price),
        isFull: availability.isFull,
        percentageFull: Number(availability.percentageFull),
        message,
      };
    } catch (error) {
      console.error('Error checking availability:', error);
      throw error;
    }
  }

  /**
   * Get all available sessions for a course
   */
  @get('/api/courses/{courseId}/available-sessions', {
    responses: {
      '200': {
        description: 'Available sessions for the course',
        content: {
          'application/json': {
            schema: {
              type: 'array',
              items: {
                type: 'object',
              },
            },
          },
        },
      },
    },
  })
  async getAvailableSessions(
    @param.path.number('courseId') courseId: number,
  ): Promise<any[]> {
    try {
      const sessions = await db
        .select({
          id: courseSchedules.id,
          startDatetime: courseSchedules.startDatetime,
          endDatetime: courseSchedules.endDatetime,
          venueId: courseSchedules.venueId,
          maxCapacity: courseSchedules.maxCapacity,
          currentCapacity: courseSchedules.currentCapacity,
          availableSpots: db.raw(`${courseSchedules.maxCapacity} - ${courseSchedules.currentCapacity}`),
          status: courseSchedules.status,
          isFull: db.raw(`CASE WHEN ${courseSchedules.currentCapacity} >= ${courseSchedules.maxCapacity} THEN true ELSE false END`),
        })
        .from(courseSchedules)
        .where(eq(courseSchedules.courseId, courseId))
        .where(eq(courseSchedules.status, 'published'))
        .where(db.raw(`${courseSchedules.startDatetime} > NOW()`))
        .where(db.raw(`${courseSchedules.currentCapacity} < ${courseSchedules.maxCapacity}`))
        .orderBy(courseSchedules.startDatetime);

      return sessions.map(session => ({
        ...session,
        availableSpots: Number(session.availableSpots),
        available: Number(session.availableSpots) > 0,
      }));
    } catch (error) {
      console.error('Error getting available sessions:', error);
      throw error;
    }
  }

  /**
   * Validate booking before payment
   */
  @get('/api/bookings/validate', {
    responses: {
      '200': {
        description: 'Booking validation result',
        content: {
          'application/json': {
            schema: {
              type: 'object',
              properties: {
                isValid: { type: 'boolean' },
                errors: { type: 'array' },
                warnings: { type: 'array' },
              },
            },
          },
        },
      },
    },
  })
  async validateBooking(
    @param.query.number('sessionId') sessionId: number,
    @param.query.number('participants') numberOfParticipants: number,
    @param.query.number('amount') totalAmount: number,
    @param.query.string('email') email: string,
  ): Promise<any> {
    try {
      const validation = await this.validationService.validateBooking({
        courseScheduleId: sessionId,
        numberOfParticipants,
        totalAmount,
        email,
      });

      return validation;
    } catch (error) {
      console.error('Error validating booking:', error);
      throw error;
    }
  }
}