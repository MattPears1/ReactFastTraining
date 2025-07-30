import {Entity, model, property} from '@loopback/repository';

@model()
export class ContactSubmission extends Entity {
  @property({
    type: 'number',
    id: true,
    generated: true,
  })
  id?: number;

  @property({
    type: 'string',
    required: true,
  })
  name: string;

  @property({
    type: 'string',
    required: true,
  })
  email: string;

  @property({
    type: 'string',
  })
  phone?: string;

  @property({
    type: 'string',
  })
  subject?: string;

  @property({
    type: 'string',
    required: true,
  })
  message: string;

  @property({
    type: 'string',
  })
  type?: string;

  @property({
    type: 'string',
    required: true,
  })
  status: string;


  constructor(data?: Partial<ContactSubmission>) {
    super(data);
  }
}

export interface ContactSubmissionRelations {
  // describe navigational properties here
}

export type ContactSubmissionWithRelations = ContactSubmission & ContactSubmissionRelations;