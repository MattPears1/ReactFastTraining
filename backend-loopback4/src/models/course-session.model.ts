import {Entity, model, property, belongsTo, hasMany} from '@loopback/repository';
import {Course} from './course.model';
import {Trainer} from './trainer.model';
import {Location} from './location.model';
import {Booking} from './booking.model';

export enum SessionStatus {
  SCHEDULED = 'SCHEDULED',
  CONFIRMED = 'CONFIRMED',
  IN_PROGRESS = 'IN_PROGRESS',
  COMPLETED = 'COMPLETED',
  CANCELLED = 'CANCELLED',
}

@model({
  settings: {
    strict: true,
    postgresql: {
      table: 'course_sessions',
    },
  },
})
export class CourseSession extends Entity {
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

  @belongsTo(() => Course)
  courseId: string;

  @belongsTo(() => Trainer)
  trainerId: string;

  @belongsTo(() => Location)
  locationId: string;

  @property({
    type: 'date',
    required: true,
  })
  startDate: Date;

  @property({
    type: 'date',
    required: true,
  })
  endDate: Date;

  @property({
    type: 'string',
    required: true,
    default: '09:00',
  })
  startTime: string;

  @property({
    type: 'string',
    required: true,
    default: '17:00',
  })
  endTime: string;

  @property({
    type: 'number',
    required: true,
  })
  maxParticipants: number;

  @property({
    type: 'number',
    default: 0,
  })
  currentParticipants: number;

  @property({
    type: 'number',
    required: true,
  })
  pricePerPerson: number;

  @property({
    type: 'string',
    required: true,
    default: SessionStatus.SCHEDULED,
    jsonSchema: {
      enum: Object.values(SessionStatus),
    },
  })
  status: SessionStatus;

  @property({
    type: 'boolean',
    default: false,
  })
  isOnsite: boolean;

  @property({
    type: 'string',
  })
  onsiteClientName?: string;

  @property({
    type: 'object',
  })
  onsiteDetails?: {
    contactName?: string;
    contactPhone?: string;
    contactEmail?: string;
    specialRequirements?: string;
  };

  @property({
    type: 'string',
  })
  notes?: string;

  @property({
    type: 'date',
    defaultFn: 'now',
  })
  createdAt?: Date;

  @property({
    type: 'date',
    defaultFn: 'now',
  })
  updatedAt?: Date;

  @hasMany(() => Booking)
  bookings: Booking[];

  constructor(data?: Partial<CourseSession>) {
    super(data);
  }
}