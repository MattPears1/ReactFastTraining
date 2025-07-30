import {inject} from '@loopback/core';
import {
  get,
  param,
  response,
  RestBindings,
  Response,
} from '@loopback/rest';
import {CourseSessionCapacityService} from '../services/course-session-capacity.service';

export class CalendarController {
  constructor(
    @inject('services.CourseSessionCapacityService')
    private capacityService: CourseSessionCapacityService,
  ) {}

  @get('/api/calendar/availability', {
    responses: {
      '200': {
        description: 'Get available course sessions for calendar display',
        content: {
          'application/json': {
            schema: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  id: {type: 'string'},
                  title: {type: 'string'},
                  date: {type: 'string', format: 'date'},
                  start: {type: 'string'},
                  end: {type: 'string'},
                  location: {type: 'string'},
                  availableSpots: {type: 'number'},
                  maxCapacity: {type: 'number'},
                  color: {type: 'string'},
                  extendedProps: {
                    type: 'object',
                    properties: {
                      currentBookings: {type: 'number'},
                      percentFull: {type: 'number'},
                      status: {type: 'string'},
                    },
                  },
                },
              },
            },
          },
        },
      },
    },
  })
  async getAvailability(
    @param.query.string('startDate') startDate: string,
    @param.query.string('endDate') endDate: string,
    @param.query.string('courseType') courseType?: string,
    @param.query.string('location') location?: string,
  ): Promise<any[]> {
    const start = new Date(startDate);
    const end = new Date(endDate);

    if (isNaN(start.getTime()) || isNaN(end.getTime())) {
      throw new Error('Invalid date format');
    }

    return this.capacityService.getCalendarSessions(start, end);
  }

  @get('/api/calendar/sessions', {
    responses: {
      '200': {
        description: 'Get filtered course sessions with capacity information',
        content: {
          'application/json': {
            schema: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  sessionId: {type: 'string'},
                  courseType: {type: 'string'},
                  sessionDate: {type: 'string', format: 'date'},
                  startTime: {type: 'string'},
                  endTime: {type: 'string'},
                  location: {type: 'string'},
                  currentBookings: {type: 'number'},
                  maxCapacity: {type: 'number'},
                  availableSpots: {type: 'number'},
                  status: {
                    type: 'string',
                    enum: ['AVAILABLE', 'ALMOST_FULL', 'FULL'],
                  },
                },
              },
            },
          },
        },
      },
    },
  })
  async getFilteredSessions(
    @param.query.dateTime('startDate') startDate?: Date,
    @param.query.dateTime('endDate') endDate?: Date,
    @param.query.string('courseType') courseType?: string,
    @param.query.string('location') location?: string,
    @param.query.boolean('showOnlyAvailable') showOnlyAvailable?: boolean,
  ): Promise<any[]> {
    return this.capacityService.getAvailableSessions({
      startDate,
      endDate,
      courseType,
      location,
      showOnlyAvailable,
    });
  }

  @get('/api/calendar/sessions/{sessionId}/availability', {
    responses: {
      '200': {
        description: 'Check availability for a specific session',
        content: {
          'application/json': {
            schema: {
              type: 'object',
              properties: {
                available: {type: 'boolean'},
                currentCount: {type: 'number'},
                remainingSpots: {type: 'number'},
              },
            },
          },
        },
      },
    },
  })
  async checkSessionAvailability(
    @param.path.string('sessionId') sessionId: string,
  ): Promise<{available: boolean; currentCount: number; remainingSpots: number}> {
    return this.capacityService.checkAvailability(sessionId);
  }

  @get('/api/calendar/course-types', {
    responses: {
      '200': {
        description: 'Get list of available course types',
        content: {
          'application/json': {
            schema: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  id: {type: 'string'},
                  name: {type: 'string'},
                  duration: {type: 'string'},
                  color: {type: 'string'},
                },
              },
            },
          },
        },
      },
    },
  })
  async getCourseTypes(): Promise<any[]> {
    // Return the course types with their associated colors
    return [
      {id: 'efaw', name: 'Emergency First Aid at Work', duration: 'Full Day (6 hours)', color: '#0EA5E9'},
      {id: 'faw', name: 'First Aid at Work', duration: 'Full Day (6 hours)', color: '#10B981'},
      {id: 'paediatric', name: 'Paediatric First Aid', duration: 'Full Day (6 hours)', color: '#F97316'},
      {id: 'cpr-aed', name: 'CPR and AED', duration: 'Half Day (3 hours)', color: '#8B5CF6'},
      {id: 'mental-health', name: 'Mental Health First Aid', duration: 'Full Day (6 hours)', color: '#EC4899'},
      {id: 'refresher', name: 'Annual Skills Refresher', duration: 'Half Day (3 hours)', color: '#6366F1'},
    ];
  }

  @get('/api/calendar/locations', {
    responses: {
      '200': {
        description: 'Get available locations',
        content: {
          'application/json': {
            schema: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  id: {type: 'string'},
                  name: {type: 'string'},
                },
              },
            },
          },
        },
      },
    },
  })
  async getLocations(): Promise<any[]> {
    // Return simplified locations as per requirements
    return [
      {id: 'location-a', name: 'Location A'},
      {id: 'location-b', name: 'Location B'},
    ];
  }
}