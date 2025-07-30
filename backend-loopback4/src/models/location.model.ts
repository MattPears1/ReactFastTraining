import {Entity, model, property, hasMany} from '@loopback/repository';
import {CourseSession} from './course-session.model';

export enum LocationType {
  TRAINING_CENTER = 'TRAINING_CENTER',
  CLIENT_SITE = 'CLIENT_SITE',
  PUBLIC_VENUE = 'PUBLIC_VENUE',
}

export enum YorkshireArea {
  LEEDS = 'LEEDS',
  BRADFORD = 'BRADFORD',
  SHEFFIELD = 'SHEFFIELD',
  HULL = 'HULL',
  YORK = 'YORK',
  WAKEFIELD = 'WAKEFIELD',
  HARROGATE = 'HARROGATE',
  DONCASTER = 'DONCASTER',
  ROTHERHAM = 'ROTHERHAM',
  BARNSLEY = 'BARNSLEY',
  HUDDERSFIELD = 'HUDDERSFIELD',
  HALIFAX = 'HALIFAX',
  SCARBOROUGH = 'SCARBOROUGH',
  KEIGHLEY = 'KEIGHLEY',
}

@model({
  settings: {
    strict: true,
    postgresql: {
      table: 'locations',
    },
  },
})
export class Location extends Entity {
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
  name: string;

  @property({
    type: 'string',
    required: true,
    jsonSchema: {
      enum: Object.values(LocationType),
    },
  })
  type: LocationType;

  @property({
    type: 'string',
    required: true,
  })
  addressLine1: string;

  @property({
    type: 'string',
  })
  addressLine2?: string;

  @property({
    type: 'string',
    required: true,
  })
  city: string;

  @property({
    type: 'string',
    required: true,
    jsonSchema: {
      enum: Object.values(YorkshireArea),
    },
  })
  area: YorkshireArea;

  @property({
    type: 'string',
    required: true,
    jsonSchema: {
      pattern: '^[A-Z]{1,2}[0-9][A-Z0-9]? ?[0-9][A-Z]{2}$',
    },
  })
  postcode: string;

  @property({
    type: 'string',
  })
  parkingInfo?: string;

  @property({
    type: 'string',
  })
  publicTransportInfo?: string;

  @property({
    type: 'array',
    itemType: 'string',
    default: [],
  })
  facilities: string[]; // e.g., ['Wheelchair accessible', 'Free parking', 'Refreshments available']

  @property({
    type: 'number',
  })
  maxCapacity?: number;

  @property({
    type: 'object',
  })
  contactDetails?: {
    name?: string;
    phone?: string;
    email?: string;
  };

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

  constructor(data?: Partial<Location>) {
    super(data);
  }
}