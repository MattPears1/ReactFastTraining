import {Entity, model, property, belongsTo} from '@loopback/repository';
import {User} from './user.model';

@model({
  settings: {
    strict: true,
    postgresql: {
      table: 'testimonials',
    },
  },
})
export class Testimonial extends Entity {
  @property({
    type: 'number',
    id: true,
    generated: true,
  })
  id?: number;

  @belongsTo(() => User, {keyTo: 'id', name: 'user'})
  userId?: number;

  @property({
    type: 'string',
    required: true,
    length: 100,
  })
  authorName: string;

  @property({
    type: 'string',
    required: true,
    length: 255,
    jsonSchema: {
      format: 'email',
    },
  })
  authorEmail: string;

  @property({
    type: 'string',
    length: 100,
  })
  authorLocation?: string;

  @property({
    type: 'string',
    required: true,
    length: 255,
  })
  courseTaken: string;

  @property({
    type: 'date',
  })
  courseDate?: Date;

  @property({
    type: 'string',
    required: true,
  })
  content: string;

  @property({
    type: 'number',
    required: true,
    jsonSchema: {
      minimum: 1,
      maximum: 5,
    },
  })
  rating: number;

  @property({
    type: 'string',
    length: 500,
  })
  photoUrl?: string;

  @property({
    type: 'string',
    default: 'not_given',
    jsonSchema: {
      enum: ['given', 'not_given'],
    },
  })
  photoConsent?: string;

  @property({
    type: 'string',
    default: 'pending',
    jsonSchema: {
      enum: ['pending', 'approved', 'rejected', 'featured'],
    },
  })
  status?: string;

  @property({
    type: 'string',
    length: 500,
  })
  rejectionReason?: string;

  @property({
    type: 'date',
  })
  approvedAt?: Date;

  @belongsTo(() => User, {keyTo: 'id', name: 'approver'})
  approvedBy?: number;

  @property({
    type: 'boolean',
    default: false,
  })
  showOnHomepage?: boolean;

  @property({
    type: 'boolean',
    default: true,
  })
  showFullName?: boolean;

  @property({
    type: 'number',
    default: 0,
  })
  displayOrder?: number;

  @property({
    type: 'boolean',
    default: false,
  })
  verifiedBooking?: boolean;

  @property({
    type: 'string',
    length: 50,
  })
  bookingReference?: string;

  @property({
    type: 'string',
    length: 100,
  })
  verificationToken?: string;

  @property({
    type: 'date',
  })
  verifiedAt?: Date;

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

  constructor(data?: Partial<Testimonial>) {
    super(data);
  }
}

export interface TestimonialRelations {
  user?: User;
  approver?: User;
}

export type TestimonialWithRelations = Testimonial & TestimonialRelations;