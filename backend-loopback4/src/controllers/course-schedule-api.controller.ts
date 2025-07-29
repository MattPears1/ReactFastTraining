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
import {CourseSession} from '../models';
import {CourseSessionRepository, BookingRepository, CourseRepository} from '../repositories';

export class CourseSessionApiController {
  constructor(
    @repository(CourseSessionRepository)
    public courseSessionRepository: CourseSessionRepository,
    @repository(BookingRepository)
    public bookingRepository: BookingRepository,
    @repository(CourseRepository)
    public courseRepository: CourseRepository,
  ) {}

  @get('/api/course-sessions', {
    responses: {
      '200': {
        description: 'Array of CourseSession model instances with availability',
        content: {
          'application/json': {
            schema: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  id: {type: 'number'},
                  courseId: {type: 'number'},
                  courseName: {type: 'string'},
                  courseType: {type: 'string'},
                  startDate: {type: 'string'},
                  endDate: {type: 'string'},
                  startTime: {type: 'string'},
                  endTime: {type: 'string'},
                  location: {type: 'string'},
                  maxParticipants: {type: 'number'},
                  currentBookings: {type: 'number'},
                  availableSpots: {type: 'number'},
                  price: {type: 'number'},
                  status: {type: 'string'},
                  instructor: {type: 'string'},
                },
              },
            },
          },
        },
      },
    },
  })
  async find(
    @param.filter(CourseSession) filter?: Filter<CourseSession>,
  ): Promise<any[]> {
    try {
      // Get all course sessions with course details
      const sessions = await this.courseSessionRepository.find({
        ...filter,
        include: [{relation: 'course'}],
        order: ['startDate ASC'],
      });

      // Get booking counts for each session
      const sessionsWithAvailability = await Promise.all(
        sessions.map(async (session) => {
          const bookingCount = await this.bookingRepository.count({
            sessionId: session.id,
            status: {inq: ['CONFIRMED', 'PENDING']},
          });

          const currentBookings = bookingCount.count;
          const maxParticipants = session.maxParticipants || 0;
          const availableSpots = Math.max(0, maxParticipants - currentBookings);

          return {
            id: session.id,
            courseId: session.courseId,
            courseName: session.course?.name || 'Unknown Course',
            courseType: session.course?.type || 'UNKNOWN',
            startDate: session.startDate,
            endDate: session.endDate,
            startTime: session.startTime,
            endTime: session.endTime,
            maxParticipants: maxParticipants,
            currentBookings: currentBookings,
            availableSpots: availableSpots,
            price: session.pricePerPerson || session.course?.pricePerPerson || 0,
            status: session.status,
            instructor: 'Lex Richardson',
            isAvailable: availableSpots > 0,
            isFull: currentBookings >= maxParticipants,
          };
        }),
      );

      return sessionsWithAvailability;
    } catch (error) {
      console.error('Error fetching course sessions:', error);
      throw new Error(`Failed to fetch course sessions: ${error.message}`);
    }
  }

  @get('/api/course-sessions/{id}', {
    responses: {
      '200': {
        description: 'CourseSession model instance with availability',
        content: {
          'application/json': {
            schema: {
              type: 'object',
              properties: {
                id: {type: 'number'},
                courseId: {type: 'number'},
                courseName: {type: 'string'},
                courseType: {type: 'string'},
                startDate: {type: 'string'},
                endDate: {type: 'string'},
                startTime: {type: 'string'},
                endTime: {type: 'string'},
                location: {type: 'string'},
                maxParticipants: {type: 'number'},
                currentBookings: {type: 'number'},
                availableSpots: {type: 'number'},
                price: {type: 'number'},
                status: {type: 'string'},
                instructor: {type: 'string'},
              },
            },
          },
        },
      },
    },
  })
  async findById(
    @param.path.string('id') id: string,
  ): Promise<any> {
    try {
      const session = await this.courseSessionRepository.findById(id, {
        include: [{relation: 'course'}],
      });

      const bookingCount = await this.bookingRepository.count({
        sessionId: id,
        status: {inq: ['CONFIRMED', 'PENDING']},
      });

      const currentBookings = bookingCount.count;
      const maxParticipants = session.maxParticipants || 0;
      const availableSpots = Math.max(0, maxParticipants - currentBookings);

      return {
        id: session.id,
        courseId: session.courseId,
        courseName: session.course?.name || 'Unknown Course',
        courseType: session.course?.type || 'UNKNOWN',
        startDate: session.startDate,
        endDate: session.endDate,
        startTime: session.startTime,
        endTime: session.endTime,
        maxParticipants: maxParticipants,
        currentBookings: currentBookings,
        availableSpots: availableSpots,
        price: session.pricePerPerson || session.course?.pricePerPerson || 0,
        status: session.status,
        instructor: 'Lex Richardson',
        isAvailable: availableSpots > 0,
        isFull: currentBookings >= maxParticipants,
      };
    } catch (error) {
      console.error('Error fetching course session:', error);
      throw new Error(`Failed to fetch course session: ${error.message}`);
    }
  }

  @get('/api/course-sessions/available', {
    responses: {
      '200': {
        description: 'Array of available CourseSession model instances',
        content: {
          'application/json': {
            schema: {
              type: 'array',
              items: {type: 'object'},
            },
          },
        },
      },
    },
  })
  async findAvailable(
    @param.query.string('courseType') courseType?: string,
    @param.query.string('location') location?: string,
    @param.query.string('startDate') startDate?: string,
    @param.query.string('endDate') endDate?: string,
  ): Promise<any[]> {
    try {
      let whereClause: any = {
        status: 'SCHEDULED',
        startDate: {gte: new Date()}, // Only future courses
      };

      // Add filters
      if (startDate) {
        whereClause.startDate = {gte: new Date(startDate)};
      }
      if (endDate) {
        whereClause.startDate = {lte: new Date(endDate)};
      }

      const sessions = await this.courseSessionRepository.find({
        where: whereClause,
        include: [{relation: 'course'}],
        order: ['startDate ASC'],
      });

      // Filter out fully booked courses
      const availableSessions = await Promise.all(
        sessions.map(async (session) => {
          const bookingCount = await this.bookingRepository.count({
            sessionId: session.id,
            status: {inq: ['CONFIRMED', 'PENDING']},
          });

          const currentBookings = bookingCount.count;
          const maxParticipants = session.maxParticipants || 0;
          const availableSpots = Math.max(0, maxParticipants - currentBookings);

          if (availableSpots > 0) {
            return {
              id: session.id,
              courseId: session.courseId,
              courseName: session.course?.name || 'Unknown Course',
              courseType: session.course?.type || 'UNKNOWN',
              startDate: session.startDate,
              endDate: session.endDate,
              startTime: session.startTime,
              endTime: session.endTime,
              maxParticipants: maxParticipants,
              currentBookings: currentBookings,
              availableSpots: availableSpots,
              price: session.pricePerPerson || session.course?.pricePerPerson || 0,
              status: session.status,
              instructor: 'Lex Richardson',
              isAvailable: true,
              isFull: false,
            };
          }
          return null;
        }),
      );

      return availableSessions.filter(session => session !== null);
    } catch (error) {
      console.error('Error fetching available course sessions:', error);
      throw new Error(`Failed to fetch available course sessions: ${error.message}`);
    }
  }

  @get('/api/courses', {
    responses: {
      '200': {
        description: 'Array of Course model instances',
        content: {
          'application/json': {
            schema: {
              type: 'array',
              items: {type: 'object'},
            },
          },
        },
      },
    },
  })
  async findCourses(): Promise<any[]> {
    try {
      const courses = await this.courseRepository.find({
        where: {status: 'active'},
        order: ['name ASC'],
      });

      return courses.map(course => ({
        id: course.id,
        name: course.name,
        type: course.type,
        duration: course.duration,
        price: course.price,
        description: course.description,
        status: course.status,
      }));
    } catch (error) {
      console.error('Error fetching courses:', error);
      throw new Error(`Failed to fetch courses: ${error.message}`);
    }
  }
}