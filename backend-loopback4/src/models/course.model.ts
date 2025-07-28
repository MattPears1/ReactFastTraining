import {Entity, model, property, hasMany} from '@loopback/repository';
import {CourseSession} from './course-session.model';
import {Booking} from './booking.model';

export enum CourseType {
  EFAW = 'EFAW', // Emergency First Aid at Work (Full day - 6 hours)
  FAW = 'FAW', // First Aid at Work (Full day - 6 hours)
  FAW_REQUALIFICATION = 'FAW_REQUALIFICATION', // Requalification (Full day - 5 hours)
  PAEDIATRIC = 'PAEDIATRIC', // Paediatric First Aid (Full day - 6 hours)
  EPFA = 'EPFA', // Emergency Paediatric First Aid (1 Day)
  AFA = 'AFA', // Activity First Aid (1 Day)
  CPR_AED = 'CPR_AED', // CPR and AED (3 Hours)
  ASR = 'ASR', // Annual Skills Refresher (3 Hours)
  O2 = 'O2', // Oxygen Therapy (3 Hours)
  BESPOKE = 'BESPOKE', // Custom courses (Half or Full day)
}

export enum CertificationBody {
  OFQUAL = 'OFQUAL',
  HSE = 'HSE',
  QCF = 'QCF',
}

@model({
  settings: {
    strict: true,
    postgresql: {
      table: 'courses',
    },
  },
})
export class Course extends Entity {
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

  @property({
    type: 'string',
    required: true,
    jsonSchema: {
      enum: Object.values(CourseType),
    },
  })
  type: CourseType;

  @property({
    type: 'string',
    required: true,
  })
  name: string;

  @property({
    type: 'string',
    required: true,
  })
  description: string;

  @property({
    type: 'number',
    required: true,
    jsonSchema: {
      minimum: 0.5,
      maximum: 1,
    },
  })
  durationDays: number;

  @property({
    type: 'number',
    required: true,
    jsonSchema: {
      minimum: 0,
    },
  })
  pricePerPerson: number;

  @property({
    type: 'number',
    required: true,
    jsonSchema: {
      minimum: 4,
      maximum: 16,
    },
  })
  maxParticipants: number;

  @property({
    type: 'number',
    required: true,
    default: 4,
    jsonSchema: {
      minimum: 4,
    },
  })
  minParticipants: number;

  @property({
    type: 'number',
    required: true,
    default: 16,
    jsonSchema: {
      minimum: 16,
    },
  })
  minimumAge: number;

  @property({
    type: 'boolean',
    required: true,
    default: true,
  })
  requiresEnglishLevel2: boolean;

  @property({
    type: 'string',
    required: true,
    jsonSchema: {
      enum: Object.values(CertificationBody),
    },
  })
  certificationBody: CertificationBody;

  @property({
    type: 'number',
    required: true,
    default: 3,
    jsonSchema: {
      minimum: 1,
      maximum: 3,
    },
  })
  certificateValidityYears: number;

  @property({
    type: 'array',
    itemType: 'string',
    default: [],
  })
  learningOutcomes: string[];

  @property({
    type: 'array',
    itemType: 'string',
    default: [],
  })
  prerequisites: string[];

  @property({
    type: 'object',
    default: {},
  })
  groupDiscounts: {
    [key: string]: number; // e.g., {"10": 0.1, "15": 0.15}
  };

  @property({
    type: 'boolean',
    default: true,
  })
  availableOnsite: boolean;

  @property({
    type: 'boolean',
    default: true,
  })
  active: boolean;

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

  @hasMany(() => CourseSession)
  sessions: CourseSession[];

  @hasMany(() => Booking, {through: {model: () => CourseSession}})
  bookings: Booking[];

  constructor(data?: Partial<Course>) {
    super(data);
  }
}