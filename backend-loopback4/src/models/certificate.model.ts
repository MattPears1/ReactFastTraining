import {Entity, model, property, belongsTo} from '@loopback/repository';
import {Booking} from './booking.model';
import {Course} from './course.model';

export enum CertificateStatus {
  PENDING = 'PENDING',
  ISSUED = 'ISSUED',
  EXPIRED = 'EXPIRED',
  REVOKED = 'REVOKED',
}

@model({
  settings: {
    strict: true,
    postgresql: {
      table: 'certificates',
    },
  },
})
export class Certificate extends Entity {
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
  certificateNumber: string;

  @belongsTo(() => Booking)
  bookingId: string;

  @belongsTo(() => Course)
  courseId: string;

  @property({
    type: 'object',
    required: true,
  })
  participantDetails: {
    firstName: string;
    lastName: string;
    dateOfBirth: Date;
  };

  @property({
    type: 'string',
    required: true,
  })
  courseName: string;

  @property({
    type: 'date',
    required: true,
  })
  completionDate: Date;

  @property({
    type: 'date',
    required: true,
  })
  issueDate: Date;

  @property({
    type: 'date',
    required: true,
  })
  expiryDate: Date;

  @property({
    type: 'string',
    required: true,
  })
  certificationBody: string;

  @property({
    type: 'string',
    required: true,
  })
  trainerName: string;

  @property({
    type: 'string',
    required: true,
    default: CertificateStatus.PENDING,
    jsonSchema: {
      enum: Object.values(CertificateStatus),
    },
  })
  status: CertificateStatus;

  @property({
    type: 'string',
  })
  pdfUrl?: string;

  @property({
    type: 'string',
  })
  verificationUrl?: string;

  @property({
    type: 'object',
  })
  metadata?: {
    qrCode?: string;
    assessmentScore?: number;
    additionalNotes?: string;
  };

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

  constructor(data?: Partial<Certificate>) {
    super(data);
  }
}