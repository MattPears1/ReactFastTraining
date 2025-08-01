import {
  Count,
  CountSchema,
  Filter,
  FilterExcludingWhere,
  repository,
  Where,
} from '@loopback/repository';
import {
  post,
  param,
  get,
  getModelSchemaRef,
  patch,
  put,
  del,
  requestBody,
  response,
  HttpErrors,
} from '@loopback/rest';
import {inject} from '@loopback/core';
import {authenticate} from '@loopback/authentication';
import {authorize} from '@loopback/authorization';
import {Booking, Certificate, BookingStatus} from '../models';
import {BookingRepository} from '../repositories';
import {BookingService, CreateBookingData} from '../services';
import {BookingServiceEnhanced, CreateBookingData as CreateBookingDataEnhanced} from '../services/booking-service-enhanced';
import {BookingValidationService} from '../services/booking-validation.service';

export class BookingController {
  constructor(
    @repository(BookingRepository)
    public bookingRepository: BookingRepository,
    @inject('services.BookingService')
    private bookingService: BookingService,
    @inject('services.BookingServiceEnhanced')
    private bookingServiceEnhanced: BookingServiceEnhanced,
    @inject('services.BookingValidationService')
    private validationService: BookingValidationService,
  ) {}

  @post('/bookings')
  @response(200, {
    description: 'Booking model instance',
    content: {'application/json': {schema: getModelSchemaRef(Booking)}},
  })
  async create(
    @requestBody({
      content: {
        'application/json': {
          schema: {
            type: 'object',
            required: ['courseScheduleId', 'contactDetails', 'participants', 'numberOfParticipants', 'totalAmount', 'paymentMethod', 'confirmedTermsAndConditions'],
            properties: {
              courseScheduleId: {type: 'number'},
              contactDetails: {
                type: 'object',
                required: ['firstName', 'lastName', 'email'],
                properties: {
                  firstName: {type: 'string'},
                  lastName: {type: 'string'},
                  email: {type: 'string', format: 'email'},
                  phone: {type: 'string'},
                  company: {type: 'string'},
                },
              },
              participants: {
                type: 'array',
                items: {
                  type: 'object',
                  required: ['firstName', 'lastName', 'email'],
                  properties: {
                    firstName: {type: 'string'},
                    lastName: {type: 'string'},
                    email: {type: 'string', format: 'email'},
                    certificateName: {type: 'string'},
                    dateOfBirth: {type: 'string', format: 'date'},
                    emergencyContact: {
                      type: 'object',
                      properties: {
                        name: {type: 'string'},
                        phone: {type: 'string'},
                        relationship: {type: 'string'},
                      },
                    },
                    medicalConditions: {type: 'string'},
                    dietaryRequirements: {type: 'string'},
                  },
                },
              },
              numberOfParticipants: {type: 'number'},
              totalAmount: {type: 'number'},
              paymentMethod: {type: 'string'},
              stripePaymentIntentId: {type: 'string'},
              specialRequirements: {type: 'string'},
              confirmedTermsAndConditions: {type: 'boolean'},
            },
          },
        },
      },
    })
    bookingData: CreateBookingDataEnhanced,
  ): Promise<any> {
    if (!bookingData.confirmedTermsAndConditions) {
      throw new HttpErrors.BadRequest('Terms and conditions must be accepted');
    }
    
    // Use the enhanced booking service with validation
    const result = await this.bookingServiceEnhanced.createBooking(bookingData);
    
    // Convert the enhanced result to match the expected Booking model format
    return {
      id: result.booking.id.toString(),
      bookingReference: result.booking.bookingReference,
      sessionId: result.booking.courseScheduleId.toString(),
      contactDetails: result.booking.contactDetails,
      participants: result.booking.participants,
      numberOfParticipants: result.booking.numberOfParticipants,
      totalAmount: result.booking.totalAmount,
      status: result.booking.status,
      paymentStatus: result.booking.paymentStatus,
      specialRequirements: result.booking.specialRequirements,
      createdAt: result.booking.createdAt,
      validationWarnings: result.validationWarnings,
      user: result.user,
    };
  }

  @get('/bookings/count')
  @authenticate('jwt')
  @authorize({allowedRoles: ['admin', 'trainer']})
  @response(200, {
    description: 'Booking model count',
    content: {'application/json': {schema: CountSchema}},
  })
  async count(
    @param.where(Booking) where?: Where<Booking>,
  ): Promise<Count> {
    return this.bookingRepository.count(where);
  }

  @get('/bookings')
  @authenticate('jwt')
  @authorize({allowedRoles: ['admin', 'trainer']})
  @response(200, {
    description: 'Array of Booking model instances',
    content: {
      'application/json': {
        schema: {
          type: 'array',
          items: getModelSchemaRef(Booking, {includeRelations: true}),
        },
      },
    },
  })
  async find(
    @param.filter(Booking) filter?: Filter<Booking>,
  ): Promise<Booking[]> {
    return this.bookingRepository.find(filter);
  }

  @get('/bookings/reference/{reference}')
  @response(200, {
    description: 'Booking model instance by reference',
    content: {
      'application/json': {
        schema: getModelSchemaRef(Booking, {includeRelations: true}),
      },
    },
  })
  async findByReference(
    @param.path.string('reference') reference: string,
  ): Promise<Booking> {
    const booking = await this.bookingRepository.findByReference(reference);
    if (!booking) {
      throw new HttpErrors.NotFound('Booking not found');
    }
    return booking;
  }

  @get('/bookings/email/{email}')
  @response(200, {
    description: 'Array of Booking model instances by email',
    content: {
      'application/json': {
        schema: {
          type: 'array',
          items: getModelSchemaRef(Booking, {includeRelations: true}),
        },
      },
    },
  })
  async findByEmail(
    @param.path.string('email') email: string,
  ): Promise<Booking[]> {
    return this.bookingRepository.findByEmail(email);
  }

  @get('/bookings/{id}')
  @authenticate('jwt')
  @response(200, {
    description: 'Booking model instance',
    content: {
      'application/json': {
        schema: getModelSchemaRef(Booking, {includeRelations: true}),
      },
    },
  })
  async findById(
    @param.path.string('id') id: string,
    @param.filter(Booking, {exclude: 'where'}) filter?: FilterExcludingWhere<Booking>,
  ): Promise<Booking> {
    return this.bookingRepository.findById(id, filter);
  }

  @patch('/bookings/{id}')
  @authenticate('jwt')
  @authorize({allowedRoles: ['admin']})
  @response(204, {
    description: 'Booking PATCH success',
  })
  async updateById(
    @param.path.string('id') id: string,
    @requestBody({
      content: {
        'application/json': {
          schema: getModelSchemaRef(Booking, {partial: true}),
        },
      },
    })
    booking: Booking,
  ): Promise<void> {
    await this.bookingRepository.updateById(id, {...booking, updatedAt: new Date()});
  }

  @post('/bookings/{id}/confirm')
  @authenticate('jwt')
  @authorize({allowedRoles: ['admin']})
  @response(200, {
    description: 'Confirm booking',
    content: {'application/json': {schema: getModelSchemaRef(Booking)}},
  })
  async confirmBooking(
    @param.path.string('id') id: string,
    @requestBody({
      content: {
        'application/json': {
          schema: {
            type: 'object',
            properties: {
              paymentReference: {type: 'string'},
            },
          },
        },
      },
    })
    data: {paymentReference?: string},
  ): Promise<Booking> {
    return this.bookingService.confirmBooking(id, data.paymentReference);
  }

  @post('/bookings/{id}/pay')
  @authenticate('jwt')
  @authorize({allowedRoles: ['admin']})
  @response(200, {
    description: 'Mark booking as paid',
    content: {'application/json': {schema: getModelSchemaRef(Booking)}},
  })
  async markAsPaid(
    @param.path.string('id') id: string,
    @requestBody({
      content: {
        'application/json': {
          schema: {
            type: 'object',
            required: ['paymentReference'],
            properties: {
              paymentReference: {type: 'string'},
            },
          },
        },
      },
    })
    data: {paymentReference: string},
  ): Promise<Booking> {
    return this.bookingService.markAsPaid(id, data.paymentReference);
  }

  @post('/bookings/{id}/cancel')
  @response(200, {
    description: 'Cancel booking',
    content: {'application/json': {schema: getModelSchemaRef(Booking)}},
  })
  async cancelBooking(
    @param.path.string('id') id: string,
    @requestBody({
      content: {
        'application/json': {
          schema: {
            type: 'object',
            properties: {
              reason: {type: 'string'},
            },
          },
        },
      },
    })
    data: {reason?: string},
  ): Promise<Booking> {
    return this.bookingService.cancelBooking(id, data.reason);
  }

  @post('/bookings/{id}/attend')
  @authenticate('jwt')
  @authorize({allowedRoles: ['admin', 'trainer']})
  @response(204, {
    description: 'Mark booking as attended',
  })
  async markAsAttended(
    @param.path.string('id') id: string,
  ): Promise<void> {
    await this.bookingRepository.updateById(id, {
      status: BookingStatus.ATTENDED,
      updatedAt: new Date(),
    });
  }

  @post('/bookings/{id}/complete')
  @authenticate('jwt')
  @authorize({allowedRoles: ['admin', 'trainer']})
  @response(204, {
    description: 'Complete booking and issue certificates',
  })
  async completeBooking(
    @param.path.string('id') id: string,
  ): Promise<void> {
    await this.bookingService.completeBooking(id);
  }

  @get('/bookings/{id}/certificates')
  @authenticate('jwt')
  @response(200, {
    description: 'Array of Booking has many Certificate',
    content: {
      'application/json': {
        schema: {type: 'array', items: getModelSchemaRef(Certificate)},
      },
    },
  })
  async findCertificates(
    @param.path.string('id') id: string,
    @param.query.object('filter') filter?: Filter<Certificate>,
  ): Promise<Certificate[]> {
    return this.bookingRepository.certificates(id).find(filter);
  }

  @del('/bookings/{id}')
  @authenticate('jwt')
  @authorize({allowedRoles: ['admin']})
  @response(204, {
    description: 'Booking DELETE success',
  })
  async deleteById(@param.path.string('id') id: string): Promise<void> {
    await this.bookingRepository.deleteById(id);
  }
}