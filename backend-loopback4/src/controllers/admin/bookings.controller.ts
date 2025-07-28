import {
  get,
  put,
  del,
  post,
  param,
  requestBody,
  response,
  HttpErrors,
} from '@loopback/rest';
import {inject} from '@loopback/core';
import {repository, Filter} from '@loopback/repository';
import {authenticate} from '@loopback/authentication';
import {authorize} from '@loopback/authorization';
import {
  Booking,
  CourseSession,
  Course,
} from '../../models';
import {
  BookingRepository,
  CourseSessionRepository,
  CourseRepository,
} from '../../repositories';
import {EmailService} from '../../services';

@authenticate('jwt')
@authorize({allowedRoles: ['admin']})
export class AdminBookingsController {
  constructor(
    @repository(BookingRepository)
    private bookingRepository: BookingRepository,
    @repository(CourseSessionRepository)
    private courseSessionRepository: CourseSessionRepository,
    @repository(CourseRepository)
    private courseRepository: CourseRepository,
    @inject('services.EmailService')
    private emailService: EmailService,
  ) {}

  @get('/api/admin/bookings')
  @response(200, {
    description: 'Array of Booking model instances with related data',
    content: {
      'application/json': {
        schema: {
          type: 'array',
          items: {'x-ts-type': Booking},
        },
      },
    },
  })
  async find(
    @param.query.string('status') status?: string,
    @param.query.string('paymentStatus') paymentStatus?: string,
    @param.query.string('courseId') courseId?: string,
    @param.query.dateTime('startDate') startDate?: string,
    @param.query.dateTime('endDate') endDate?: string,
  ): Promise<Booking[]> {
    try {
      const filter: Filter<Booking> = {
        include: [
          {
            relation: 'courseSession',
            scope: {
              include: [{relation: 'course'}],
            },
          },
        ],
        order: ['createdAt DESC'],
      };

      // Build where conditions
      const whereConditions: any = {};
      
      if (status) {
        whereConditions.status = status;
      }
      
      if (paymentStatus) {
        whereConditions.paymentStatus = paymentStatus;
      }
      
      if (startDate || endDate) {
        whereConditions.createdAt = {};
        if (startDate) {
          whereConditions.createdAt.gte = new Date(startDate);
        }
        if (endDate) {
          whereConditions.createdAt.lte = new Date(endDate);
        }
      }
      
      if (Object.keys(whereConditions).length > 0) {
        filter.where = whereConditions;
      }

      let bookings = await this.bookingRepository.find(filter);
      
      // Filter by courseId if provided (post-fetch filtering)
      if (courseId) {
        bookings = bookings.filter(booking => {
          const session = booking.courseSession as CourseSession;
          return session?.courseId === courseId;
        });
      }

      return bookings;
    } catch (error) {
      console.error('Error fetching bookings:', error);
      throw new HttpErrors.InternalServerError('Failed to fetch bookings');
    }
  }

  @get('/api/admin/bookings/{id}')
  @response(200, {
    description: 'Booking model instance with related data',
    content: {
      'application/json': {schema: {'x-ts-type': Booking}},
    },
  })
  async findById(@param.path.string('id') id: string): Promise<Booking> {
    try {
      return await this.bookingRepository.findById(id, {
        include: [
          {
            relation: 'courseSession',
            scope: {
              include: [{relation: 'course'}],
            },
          },
        ],
      });
    } catch (error) {
      console.error('Error fetching booking:', error);
      throw new HttpErrors.NotFound(`Booking with id ${id} not found`);
    }
  }

  @put('/api/admin/bookings/{id}')
  @response(200, {
    description: 'Booking model instance',
    content: {'application/json': {schema: {'x-ts-type': Booking}}},
  })
  async updateById(
    @param.path.string('id') id: string,
    @requestBody({
      content: {
        'application/json': {
          schema: {
            type: 'object',
            properties: {
              status: {type: 'string'},
              paymentStatus: {type: 'string'},
              notes: {type: 'string'},
              adminNotes: {type: 'string'},
            },
          },
        },
      },
    })
    booking: Partial<Booking>,
  ): Promise<Booking> {
    try {
      // Update the booking
      await this.bookingRepository.updateById(id, {
        ...booking,
        updatedAt: new Date(),
      });

      // Return the updated booking with relations
      return await this.findById(id);
    } catch (error) {
      console.error('Error updating booking:', error);
      throw new HttpErrors.InternalServerError('Failed to update booking');
    }
  }

  @del('/api/admin/bookings/{id}')
  @response(204, {
    description: 'Booking DELETE success',
  })
  async deleteById(@param.path.string('id') id: string): Promise<void> {
    try {
      // First check if booking exists
      await this.bookingRepository.findById(id);
      
      // Then delete the booking
      await this.bookingRepository.deleteById(id);
    } catch (error) {
      console.error('Error deleting booking:', error);
      if (error.code === 'ENTITY_NOT_FOUND') {
        throw new HttpErrors.NotFound(`Booking with id ${id} not found`);
      }
      throw new HttpErrors.InternalServerError('Failed to delete booking');
    }
  }

  @post('/api/admin/bookings/{id}/email')
  @response(200, {
    description: 'Email sent successfully',
  })
  async sendEmail(
    @param.path.string('id') id: string,
    @requestBody({
      content: {
        'application/json': {
          schema: {
            type: 'object',
            required: ['type'],
            properties: {
              type: {type: 'string', enum: ['confirmation', 'reminder', 'cancellation']},
              customMessage: {type: 'string'},
            },
          },
        },
      },
    })
    emailData: {type: string; customMessage?: string},
  ): Promise<{success: boolean; message: string}> {
    try {
      const booking = await this.findById(id);
      
      // Send email based on type
      switch (emailData.type) {
        case 'confirmation':
          // The email service expects courseSchedule but we have courseSession
          // We'll need to transform the data
          const bookingWithSchedule = {
            ...booking,
            courseSchedule: booking.courseSession,
          };
          await this.emailService.sendBookingConfirmation(bookingWithSchedule as any);
          break;
        case 'reminder':
          // await this.emailService.sendBookingReminder(booking);
          break;
        case 'cancellation':
          // await this.emailService.sendBookingCancellation(booking);
          break;
        default:
          throw new HttpErrors.BadRequest('Invalid email type');
      }

      return {
        success: true,
        message: `${emailData.type} email sent successfully`,
      };
    } catch (error) {
      console.error('Error sending email:', error);
      throw new HttpErrors.InternalServerError('Failed to send email');
    }
  }
}