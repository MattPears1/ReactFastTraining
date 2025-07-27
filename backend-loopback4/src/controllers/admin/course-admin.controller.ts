import {
  post,
  put,
  del,
  get,
  param,
  requestBody,
  response,
  HttpErrors,
} from '@loopback/rest';
import {inject} from '@loopback/core';
import {repository} from '@loopback/repository';
import {authenticate} from '@loopback/authentication';
import {authorize} from '@loopback/authorization';
import {CourseSession, Attendance, SessionStatus, BookingStatus} from '../../models';
import {
  CourseSessionRepository,
  BookingRepository,
} from '../../repositories';
import {
  CourseManagementService,
  CreateSessionData,
  RecurringSessionData,
} from '../../services/admin/course-management.service';
import {
  AttendanceService,
  AttendanceRecord,
} from '../../services/admin/attendance.service';

@authenticate('jwt')
@authorize({allowedRoles: ['admin']})
export class CourseAdminController {
  constructor(
    @inject('services.CourseManagementService')
    private courseManagementService: CourseManagementService,
    @inject('services.AttendanceService')
    private attendanceService: AttendanceService,
    @repository(CourseSessionRepository)
    private courseSessionRepository: CourseSessionRepository,
    @repository(BookingRepository)
    private bookingRepository: BookingRepository,
  ) {}

  // ========== Session Management ==========

  @post('/api/admin/sessions')
  @response(200, {
    description: 'Create a new course session',
    content: {'application/json': {schema: {'x-ts-type': CourseSession}}},
  })
  async createSession(
    @requestBody({
      content: {
        'application/json': {
          schema: {
            type: 'object',
            required: ['courseId', 'trainerId', 'locationId', 'startDate', 'endDate', 'startTime', 'endTime', 'pricePerPerson'],
            properties: {
              courseId: {type: 'string'},
              trainerId: {type: 'string'},
              locationId: {type: 'string'},
              startDate: {type: 'string', format: 'date-time'},
              endDate: {type: 'string', format: 'date-time'},
              startTime: {type: 'string', pattern: '^[0-2][0-9]:[0-5][0-9]$'},
              endTime: {type: 'string', pattern: '^[0-2][0-9]:[0-5][0-9]$'},
              maxParticipants: {type: 'number', minimum: 1, maximum: 12},
              pricePerPerson: {type: 'number', minimum: 0},
              notes: {type: 'string'},
            },
          },
        },
      },
    })
    sessionData: CreateSessionData,
  ): Promise<CourseSession> {
    return this.courseManagementService.createSession(sessionData);
  }

  @post('/api/admin/sessions/recurring')
  @response(200, {
    description: 'Create recurring course sessions',
    content: {
      'application/json': {
        schema: {
          type: 'array',
          items: {'x-ts-type': CourseSession},
        },
      },
    },
  })
  async createRecurringSessions(
    @requestBody({
      content: {
        'application/json': {
          schema: {
            type: 'object',
            required: ['courseId', 'trainerId', 'locationId', 'startDate', 'endDate', 'startTime', 'endTime', 'pricePerPerson', 'recurrenceEndDate', 'daysOfWeek'],
            properties: {
              courseId: {type: 'string'},
              trainerId: {type: 'string'},
              locationId: {type: 'string'},
              startDate: {type: 'string', format: 'date-time'},
              endDate: {type: 'string', format: 'date-time'},
              startTime: {type: 'string'},
              endTime: {type: 'string'},
              maxParticipants: {type: 'number'},
              pricePerPerson: {type: 'number'},
              notes: {type: 'string'},
              recurrenceEndDate: {type: 'string', format: 'date-time'},
              daysOfWeek: {
                type: 'array',
                items: {type: 'number', minimum: 0, maximum: 6},
              },
            },
          },
        },
      },
    })
    recurringData: RecurringSessionData,
  ): Promise<CourseSession[]> {
    return this.courseManagementService.createRecurringSessions(recurringData);
  }

  @put('/api/admin/sessions/{id}')
  @response(200, {
    description: 'Update a course session',
    content: {'application/json': {schema: {'x-ts-type': CourseSession}}},
  })
  async updateSession(
    @param.path.string('id') id: string,
    @requestBody({
      content: {
        'application/json': {
          schema: {
            type: 'object',
            properties: {
              startDate: {type: 'string', format: 'date-time'},
              endDate: {type: 'string', format: 'date-time'},
              startTime: {type: 'string'},
              endTime: {type: 'string'},
              maxParticipants: {type: 'number'},
              pricePerPerson: {type: 'number'},
              notes: {type: 'string'},
              status: {type: 'string'},
            },
          },
        },
      },
    })
    updates: Partial<CourseSession>,
  ): Promise<CourseSession> {
    return this.courseManagementService.updateSession(id, updates);
  }

  @del('/api/admin/sessions/{id}')
  @response(200, {
    description: 'Cancel a course session',
    content: {'application/json': {schema: {'x-ts-type': CourseSession}}},
  })
  async cancelSession(
    @param.path.string('id') id: string,
    @requestBody({
      content: {
        'application/json': {
          schema: {
            type: 'object',
            required: ['reason'],
            properties: {
              reason: {type: 'string'},
            },
          },
        },
      },
    })
    body: {reason: string},
  ): Promise<CourseSession> {
    return this.courseManagementService.cancelSession(id, body.reason);
  }

  @post('/api/admin/sessions/{id}/clone')
  @response(200, {
    description: 'Clone an existing session',
    content: {'application/json': {schema: {'x-ts-type': CourseSession}}},
  })
  async cloneSession(
    @param.path.string('id') id: string,
    @requestBody({
      content: {
        'application/json': {
          schema: {
            type: 'object',
            required: ['newDate'],
            properties: {
              newDate: {type: 'string', format: 'date-time'},
            },
          },
        },
      },
    })
    body: {newDate: Date},
  ): Promise<CourseSession> {
    return this.courseManagementService.cloneSession(id, new Date(body.newDate));
  }

  // ========== Attendance Management ==========

  @post('/api/admin/sessions/{sessionId}/attendance')
  @response(200, {
    description: 'Mark attendance for a session',
    content: {
      'application/json': {
        schema: {
          type: 'array',
          items: {'x-ts-type': Attendance},
        },
      },
    },
  })
  async markAttendance(
    @param.path.string('sessionId') sessionId: string,
    @requestBody({
      content: {
        'application/json': {
          schema: {
            type: 'object',
            required: ['attendance', 'markedBy'],
            properties: {
              attendance: {
                type: 'array',
                items: {
                  type: 'object',
                  required: ['bookingId', 'userId', 'status'],
                  properties: {
                    bookingId: {type: 'string'},
                    userId: {type: 'string'},
                    status: {
                      type: 'string',
                      enum: ['PRESENT', 'ABSENT', 'LATE', 'PARTIAL'],
                    },
                    notes: {type: 'string'},
                  },
                },
              },
              markedBy: {type: 'string'},
            },
          },
        },
      },
    })
    body: {attendance: AttendanceRecord[]; markedBy: string},
  ): Promise<Attendance[]> {
    return this.attendanceService.markAttendance(
      sessionId,
      body.attendance,
      body.markedBy,
    );
  }

  @get('/api/admin/sessions/{sessionId}/attendance')
  @response(200, {
    description: 'Get attendance for a session',
    content: {
      'application/json': {
        schema: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              attendanceId: {type: 'string'},
              bookingId: {type: 'string'},
              userId: {type: 'string'},
              userName: {type: 'string'},
              userEmail: {type: 'string'},
              status: {type: 'string'},
              notes: {type: 'string'},
              markedBy: {type: 'string'},
              markedAt: {type: 'string', format: 'date-time'},
            },
          },
        },
      },
    },
  })
  async getSessionAttendance(
    @param.path.string('sessionId') sessionId: string,
  ): Promise<any[]> {
    return this.attendanceService.getSessionAttendance(sessionId);
  }

  @get('/api/admin/attendance/report')
  @response(200, {
    description: 'Generate attendance report',
    content: {
      'application/json': {
        schema: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              courseType: {type: 'string'},
              totalSessions: {type: 'number'},
              totalAttendees: {type: 'number'},
              presentCount: {type: 'number'},
              absentCount: {type: 'number'},
              lateCount: {type: 'number'},
              partialCount: {type: 'number'},
              attendanceRate: {type: 'number'},
            },
          },
        },
      },
    },
  })
  async generateAttendanceReport(
    @param.query.dateTime('startDate') startDate: Date,
    @param.query.dateTime('endDate') endDate: Date,
    @param.query.string('courseType') courseType?: string,
    @param.query.string('trainerId') trainerId?: string,
  ): Promise<any[]> {
    return this.attendanceService.generateAttendanceReport({
      startDate,
      endDate,
      courseType,
      trainerId,
    });
  }

  // ========== Statistics ==========

  @get('/api/admin/stats/sessions')
  @response(200, {
    description: 'Get session statistics',
    content: {
      'application/json': {
        schema: {
          type: 'object',
          properties: {
            total: {type: 'number'},
            upcoming: {type: 'number'},
            completed: {type: 'number'},
            cancelled: {type: 'number'},
          },
        },
      },
    },
  })
  async getSessionStats(): Promise<any> {
    const now = new Date();
    
    const [total, upcoming, completed, cancelled] = await Promise.all([
      this.courseSessionRepository.count(),
      this.courseSessionRepository.count({
        startDate: {gte: now},
        status: {neq: SessionStatus.CANCELLED},
      }),
      this.courseSessionRepository.count({
        status: SessionStatus.COMPLETED,
      }),
      this.courseSessionRepository.count({
        status: SessionStatus.CANCELLED,
      }),
    ]);

    return { total, upcoming, completed, cancelled };
  }

  @get('/api/admin/stats/bookings')
  @response(200, {
    description: 'Get booking statistics',
    content: {
      'application/json': {
        schema: {
          type: 'object',
          properties: {
            total: {type: 'number'},
            confirmed: {type: 'number'},
            pending: {type: 'number'},
            cancelled: {type: 'number'},
            averageAttendance: {type: 'number'},
          },
        },
      },
    },
  })
  async getBookingStats(): Promise<any> {
    const [total, confirmed, pending, cancelled] = await Promise.all([
      this.bookingRepository.count(),
      this.bookingRepository.count({status: BookingStatus.CONFIRMED}),
      this.bookingRepository.count({status: BookingStatus.PENDING}),
      this.bookingRepository.count({status: BookingStatus.CANCELLED}),
    ]);

    // Calculate average attendance
    const attendanceStats = await this.attendanceService.generateAttendanceReport({
      startDate: new Date(new Date().setFullYear(new Date().getFullYear() - 1)),
      endDate: new Date(),
    });

    let totalAttendanceRate = 0;
    if (attendanceStats.length > 0) {
      totalAttendanceRate = attendanceStats.reduce((sum, stat) => sum + stat.attendanceRate, 0) / attendanceStats.length;
    }

    return {
      total,
      confirmed,
      pending,
      cancelled,
      averageAttendance: Math.round(totalAttendanceRate),
    };
  }

  @get('/api/admin/sessions/{sessionId}/attendance/export')
  @response(200, {
    description: 'Export attendance as CSV',
    content: {
      'text/csv': {
        schema: {type: 'string'},
      },
    },
  })
  async exportAttendanceCSV(
    @param.path.string('sessionId') sessionId: string,
  ): Promise<string> {
    const csv = await this.attendanceService.exportAttendanceCSV(sessionId);
    
    // Response headers should be set in the response decorator
    // The actual headers will be handled by the framework based on the content type
    
    return csv;
  }
}