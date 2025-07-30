import {Entity, model, property, belongsTo} from '@loopback/repository';
import {Booking} from './booking.model';
import {CourseSession} from './course-session.model';

export enum AttendanceStatus {
  PRESENT = 'PRESENT',
  ABSENT = 'ABSENT',
  LATE = 'LATE',
  PARTIAL = 'PARTIAL',
}

@model({
  settings: {
    strict: true,
    postgresql: {
      table: 'attendance',
    },
  },
})
export class Attendance extends Entity {
  @property({
    type: 'string',
    id: true,
    generated: true,
    postgresql: {
      dataType: 'uuid',
      defaultFn: 'uuid_generate_v4',
    },
  })
  id: string;

  @belongsTo(() => Booking)
  bookingId: string;

  @belongsTo(() => CourseSession)
  sessionId: string;

  @property({
    type: 'string',
    required: true,
  })
  userId: string;

  @property({
    type: 'string',
    required: true,
    jsonSchema: {
      enum: Object.values(AttendanceStatus),
    },
  })
  status: AttendanceStatus;

  @property({
    type: 'string',
  })
  notes?: string;

  @property({
    type: 'string',
  })
  markedBy?: string;

  @property({
    type: 'date',
  })
  markedAt?: Date;

  @property({
    type: 'date',
    defaultFn: 'now',
  })
  createdAt?: Date;

  constructor(data?: Partial<Attendance>) {
    super(data);
  }
}