import { get, response } from '@loopback/rest';

export class TestAvailabilityController {
  constructor() {}

  @get('/api/courses/sessions/available')
  @response(200, {
    description: 'Test available sessions endpoint',
    content: {'application/json': {schema: {type: 'array'}}},
  })
  async getAvailableSessions(): Promise<any[]> {
    // Return test data for now
    return [
      {
        id: 1,
        courseId: 1,
        courseName: 'Emergency First Aid at Work',
        courseType: 'EFAW',
        courseDescription: 'HSE approved 1-day course',
        price: '75.00',
        startDatetime: new Date('2025-08-15T09:00:00').toISOString(),
        endDatetime: new Date('2025-08-15T16:00:00').toISOString(),
        venueId: 1,
        venueName: 'Leeds City Centre',
        venueCode: 'LEEDS_CITY',
        venueAddress: '123 Main Street, Leeds, LS1 1AA',
        instructorId: 1,
        instructorName: 'Lex',
        maxCapacity: 12,
        currentCapacity: 8,
        availableSpots: 4,
        status: 'published',
        isFull: false,
        percentageFull: 66.67,
      },
      {
        id: 2,
        courseId: 1,
        courseName: 'Emergency First Aid at Work',
        courseType: 'EFAW',
        courseDescription: 'HSE approved 1-day course',
        price: '75.00',
        startDatetime: new Date('2025-08-20T09:00:00').toISOString(),
        endDatetime: new Date('2025-08-20T16:00:00').toISOString(),
        venueId: 2,
        venueName: 'Sheffield Training Centre',
        venueCode: 'SHEFFIELD',
        venueAddress: '456 High Street, Sheffield, S1 2BB',
        instructorId: 1,
        instructorName: 'Lex',
        maxCapacity: 12,
        currentCapacity: 12,
        availableSpots: 0,
        status: 'published',
        isFull: true,
        percentageFull: 100,
      },
      {
        id: 3,
        courseId: 2,
        courseName: 'First Aid at Work',
        courseType: 'FAW',
        courseDescription: 'HSE approved 3-day course',
        price: '225.00',
        startDatetime: new Date('2025-08-25T09:00:00').toISOString(),
        endDatetime: new Date('2025-08-27T16:00:00').toISOString(),
        venueId: 1,
        venueName: 'Leeds City Centre',
        venueCode: 'LEEDS_CITY',
        venueAddress: '123 Main Street, Leeds, LS1 1AA',
        instructorId: 1,
        instructorName: 'Lex',
        maxCapacity: 12,
        currentCapacity: 10,
        availableSpots: 2,
        status: 'published',
        isFull: false,
        percentageFull: 83.33,
      },
    ];
  }
}