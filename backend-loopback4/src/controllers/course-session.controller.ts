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
} from '@loopback/rest';
import {inject} from '@loopback/core';
import {authenticate} from '@loopback/authentication';
import {authorize} from '@loopback/authorization';
import {CourseSession, Booking} from '../models';
import {CourseSessionRepository} from '../repositories';
import {ScheduleService} from '../services';

export class CourseSessionController {
  constructor(
    @repository(CourseSessionRepository)
    public courseSessionRepository: CourseSessionRepository,
    @inject('services.ScheduleService')
    private scheduleService: ScheduleService,
  ) {}

  @post('/course-sessions')
  @authenticate('jwt')
  @authorize({allowedRoles: ['admin']})
  @response(200, {
    description: 'CourseSession model instance',
    content: {'application/json': {schema: getModelSchemaRef(CourseSession)}},
  })
  async create(
    @requestBody({
      content: {
        'application/json': {
          schema: getModelSchemaRef(CourseSession, {
            title: 'NewCourseSession',
            exclude: ['id', 'createdAt', 'updatedAt', 'currentParticipants'],
          }),
        },
      },
    })
    courseSession: Omit<CourseSession, 'id'>,
  ): Promise<CourseSession> {
    // Validate trainer and location availability
    const trainerAvailability = await this.scheduleService.getTrainerAvailability(
      courseSession.trainerId,
      new Date(courseSession.startDate),
      new Date(courseSession.endDate),
    );
    
    if (!trainerAvailability.available) {
      throw new Error('Trainer is not available for the selected dates');
    }
    
    const locationAvailable = await this.scheduleService.getLocationAvailability(
      courseSession.locationId,
      new Date(courseSession.startDate),
      new Date(courseSession.endDate),
    );
    
    if (!locationAvailable) {
      throw new Error('Location is not available for the selected dates');
    }
    
    return this.courseSessionRepository.create(courseSession);
  }

  @get('/course-sessions/count')
  @response(200, {
    description: 'CourseSession model count',
    content: {'application/json': {schema: CountSchema}},
  })
  async count(
    @param.where(CourseSession) where?: Where<CourseSession>,
  ): Promise<Count> {
    return this.courseSessionRepository.count(where);
  }

  @get('/course-sessions')
  @response(200, {
    description: 'Array of CourseSession model instances',
    content: {
      'application/json': {
        schema: {
          type: 'array',
          items: getModelSchemaRef(CourseSession, {includeRelations: true}),
        },
      },
    },
  })
  async find(
    @param.filter(CourseSession) filter?: Filter<CourseSession>,
  ): Promise<CourseSession[]> {
    // Always include relations for the frontend
    const enhancedFilter = {
      ...filter,
      include: filter?.include || ['course', 'trainer', 'location']
    };
    return this.courseSessionRepository.find(enhancedFilter);
  }

  @get('/course-sessions/upcoming')
  @response(200, {
    description: 'Array of upcoming CourseSession model instances',
    content: {
      'application/json': {
        schema: {
          type: 'array',
          items: getModelSchemaRef(CourseSession, {includeRelations: true}),
        },
      },
    },
  })
  async findUpcoming(
    @param.query.number('limit') limit?: number,
  ): Promise<CourseSession[]> {
    return this.courseSessionRepository.findUpcomingSessions(limit);
  }

  @get('/course-sessions/available')
  @response(200, {
    description: 'Array of available CourseSession model instances',
    content: {
      'application/json': {
        schema: {
          type: 'array',
          items: getModelSchemaRef(CourseSession, {includeRelations: true}),
        },
      },
    },
  })
  async findAvailable(): Promise<CourseSession[]> {
    return this.courseSessionRepository.findSessionsWithAvailability();
  }

  @get('/course-sessions/{id}')
  @response(200, {
    description: 'CourseSession model instance',
    content: {
      'application/json': {
        schema: getModelSchemaRef(CourseSession, {includeRelations: true}),
      },
    },
  })
  async findById(
    @param.path.string('id') id: string,
    @param.filter(CourseSession, {exclude: 'where'}) filter?: FilterExcludingWhere<CourseSession>,
  ): Promise<CourseSession> {
    // Always include relations for the frontend
    const enhancedFilter = {
      ...filter,
      include: filter?.include || ['course', 'trainer', 'location']
    };
    return this.courseSessionRepository.findById(id, enhancedFilter);
  }

  @patch('/course-sessions/{id}')
  @authenticate('jwt')
  @authorize({allowedRoles: ['admin']})
  @response(204, {
    description: 'CourseSession PATCH success',
  })
  async updateById(
    @param.path.string('id') id: string,
    @requestBody({
      content: {
        'application/json': {
          schema: getModelSchemaRef(CourseSession, {partial: true}),
        },
      },
    })
    courseSession: CourseSession,
  ): Promise<void> {
    await this.courseSessionRepository.updateById(id, {...courseSession, updatedAt: new Date()});
  }

  @post('/course-sessions/{id}/cancel')
  @authenticate('jwt')
  @authorize({allowedRoles: ['admin']})
  @response(204, {
    description: 'Cancel course session',
  })
  async cancelSession(
    @param.path.string('id') id: string,
  ): Promise<void> {
    await this.courseSessionRepository.updateById(id, {
      status: 'CANCELLED',
      updatedAt: new Date(),
    });
  }

  @get('/course-sessions/{id}/bookings')
  @authenticate('jwt')
  @authorize({allowedRoles: ['admin', 'trainer']})
  @response(200, {
    description: 'Array of CourseSession has many Booking',
    content: {
      'application/json': {
        schema: {type: 'array', items: getModelSchemaRef(Booking)},
      },
    },
  })
  async findBookings(
    @param.path.string('id') id: string,
    @param.query.object('filter') filter?: Filter<Booking>,
  ): Promise<Booking[]> {
    return this.courseSessionRepository.bookings(id).find(filter);
  }

  @get('/course-sessions/{id}/availability')
  @response(200, {
    description: 'Check session availability',
    content: {
      'application/json': {
        schema: {
          type: 'object',
          properties: {
            sessionId: {type: 'string'},
            totalSpots: {type: 'number'},
            bookedSpots: {type: 'number'},
            availableSpots: {type: 'number'},
            percentageFull: {type: 'number'},
            isAvailable: {type: 'boolean'},
          },
        },
      },
    },
  })
  async checkAvailability(
    @param.path.string('id') id: string,
  ): Promise<object> {
    const session = await this.courseSessionRepository.findById(id);
    const availableSpots = session.maxParticipants - session.currentParticipants;
    const percentageFull = (session.currentParticipants / session.maxParticipants) * 100;
    
    return {
      sessionId: id,
      totalSpots: session.maxParticipants,
      bookedSpots: session.currentParticipants,
      availableSpots,
      percentageFull,
      isAvailable: availableSpots > 0,
    };
  }

  @post('/course-sessions/suggest-dates')
  @authenticate('jwt')
  @authorize({allowedRoles: ['admin']})
  @response(200, {
    description: 'Suggest alternative dates for course session',
    content: {
      'application/json': {
        schema: {
          type: 'array',
          items: {type: 'string', format: 'date'},
        },
      },
    },
  })
  async suggestDates(
    @requestBody({
      content: {
        'application/json': {
          schema: {
            type: 'object',
            required: ['courseId', 'trainerId', 'locationId', 'preferredStartDate', 'durationDays'],
            properties: {
              courseId: {type: 'string'},
              trainerId: {type: 'string'},
              locationId: {type: 'string'},
              preferredStartDate: {type: 'string', format: 'date'},
              durationDays: {type: 'number'},
            },
          },
        },
      },
    })
    data: {
      courseId: string;
      trainerId: string;
      locationId: string;
      preferredStartDate: string;
      durationDays: number;
    },
  ): Promise<Date[]> {
    return this.scheduleService.suggestAlternativeDates(
      data.courseId,
      data.trainerId,
      data.locationId,
      new Date(data.preferredStartDate),
      data.durationDays,
    );
  }

  @del('/course-sessions/{id}')
  @authenticate('jwt')
  @authorize({allowedRoles: ['admin']})
  @response(204, {
    description: 'CourseSession DELETE success',
  })
  async deleteById(@param.path.string('id') id: string): Promise<void> {
    await this.courseSessionRepository.deleteById(id);
  }
}