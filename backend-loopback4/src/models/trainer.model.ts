import {Entity, model, property, hasMany} from '@loopback/repository';
import {CourseSession} from './course-session.model';

export enum TrainerStatus {
  ACTIVE = 'ACTIVE',
  ON_LEAVE = 'ON_LEAVE',
  INACTIVE = 'INACTIVE',
}

@model({
  settings: {
    strict: true,
    postgresql: {
      table: 'trainers',
    },
  },
})
export class Trainer extends Entity {
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
  })
  firstName: string;

  @property({
    type: 'string',
    required: true,
  })
  lastName: string;

  @property({
    type: 'string',
    required: true,
    index: {
      unique: true,
    },
  })
  email: string;

  @property({
    type: 'string',
    required: true,
  })
  phone: string;

  @property({
    type: 'array',
    itemType: 'string',
    default: [],
  })
  qualifications: string[];

  @property({
    type: 'array',
    itemType: 'string',
    default: [],
  })
  specializations: string[];

  @property({
    type: 'string',
  })
  bio?: string;

  @property({
    type: 'string',
  })
  profileImage?: string;

  @property({
    type: 'string',
    required: true,
    default: TrainerStatus.ACTIVE,
    jsonSchema: {
      enum: Object.values(TrainerStatus),
    },
  })
  status: TrainerStatus;

  @property({
    type: 'array',
    itemType: 'string',
    default: [],
  })
  coverageAreas: string[]; // Yorkshire areas

  @property({
    type: 'boolean',
    default: true,
  })
  canTrainOnsite: boolean;

  @property({
    type: 'boolean',
    default: false,
  })
  isOwner: boolean;

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

  constructor(data?: Partial<Trainer>) {
    super(data);
  }
}