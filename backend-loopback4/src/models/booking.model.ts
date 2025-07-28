import {Entity, model, property, belongsTo, hasMany} from '@loopback/repository';
import {CourseSession} from './course-session.model';
import {Certificate} from './certificate.model';

export enum BookingStatus {
  PENDING = 'PENDING',
  CONFIRMED = 'CONFIRMED',
  PAID = 'PAID',
  ATTENDED = 'ATTENDED',
  COMPLETED = 'COMPLETED',
  CANCELLED = 'CANCELLED',
  NO_SHOW = 'NO_SHOW',
}

export enum BookingType {
  INDIVIDUAL = 'INDIVIDUAL',
  GROUP = 'GROUP',
  CORPORATE = 'CORPORATE',
}

export enum PaymentMethod {
  CARD = 'CARD',
  BANK_TRANSFER = 'BANK_TRANSFER',
  INVOICE = 'INVOICE',
}

@model({
  settings: {
    strict: true,
    postgresql: {
      table: 'bookings',
    },
  },
})
export class Booking extends Entity {
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
    index: {
      unique: true,
    },
  })
  bookingReference: string;

  @belongsTo(() => CourseSession)
  sessionId: string;

  @property({
    type: 'string',
    required: true,
    jsonSchema: {
      enum: Object.values(BookingType),
    },
  })
  type: BookingType;

  @property({
    type: 'object',
    required: true,
  })
  contactDetails: {
    firstName: string;
    lastName: string;
    email: string;
    phone: string;
    company?: string;
  };

  @property({
    type: 'array',
    itemType: 'object',
    required: true,
  })
  participants: Array<{
    firstName: string;
    lastName: string;
    email: string;
    certificateName?: string;
    dateOfBirth: Date;
    emergencyContact?: {
      name: string;
      phone: string;
      relationship: string;
    };
    medicalConditions?: string;
    dietaryRequirements?: string;
  }>;

  @property({
    type: 'number',
    required: true,
  })
  numberOfParticipants: number;

  @property({
    type: 'number',
    required: true,
  })
  totalAmount: number;

  @property({
    type: 'number',
    default: 0,
  })
  discountAmount: number;

  @property({
    type: 'string',
  })
  discountReason?: string;

  @property({
    type: 'number',
    required: true,
  })
  finalAmount: number;

  @property({
    type: 'string',
    required: true,
    default: BookingStatus.PENDING,
    jsonSchema: {
      enum: Object.values(BookingStatus),
    },
  })
  status: BookingStatus;

  @property({
    type: 'string',
    jsonSchema: {
      enum: Object.values(PaymentMethod),
    },
  })
  paymentMethod?: PaymentMethod;

  @property({
    type: 'date',
  })
  paymentDate?: Date;

  @property({
    type: 'string',
  })
  paymentReference?: string;

  @property({
    type: 'object',
  })
  invoiceDetails?: {
    companyName?: string;
    addressLine1?: string;
    addressLine2?: string;
    city?: string;
    postcode?: string;
    vatNumber?: string;
  };

  @property({
    type: 'string',
  })
  specialRequirements?: string;

  @property({
    type: 'boolean',
    default: false,
  })
  confirmedTermsAndConditions: boolean;

  @property({
    type: 'date',
  })
  confirmationSentAt?: Date;

  @property({
    type: 'date',
  })
  reminderSentAt?: Date;

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

  @hasMany(() => Certificate)
  certificates: Certificate[];

  constructor(data?: Partial<Booking>) {
    super(data);
  }
}