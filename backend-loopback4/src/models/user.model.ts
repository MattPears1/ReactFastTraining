import {Entity, model, property} from '@loopback/repository';

@model({
  settings: {
    postgresql: {
      table: 'users'
    }
  }
})
export class User extends Entity {
  @property({
    type: 'number',
    id: true,
    generated: true,
  })
  id: number;

  @property({
    type: 'string',
    required: true,
    index: {
      unique: true
    }
  })
  email: string;

  @property({
    type: 'string',
    required: true,
    jsonSchema: {
      hidden: true
    }
  })
  passwordHash: string;

  @property({
    type: 'string',
  })
  firstName?: string;

  @property({
    type: 'string',
  })
  lastName?: string;

  @property({
    type: 'string',
  })
  phone?: string;

  @property({
    type: 'string',
    default: 'customer',
    jsonSchema: {
      enum: ['customer', 'admin', 'instructor']
    }
  })
  role: string;

  @property({
    type: 'boolean',
    default: true,
  })
  isActive: boolean;

  @property({
    type: 'date',
  })
  lastLogin?: Date;

  @property({
    type: 'string',
    hidden: true,
  })
  passwordResetToken?: string;

  @property({
    type: 'date',
    hidden: true,
  })
  passwordResetExpiry?: Date;

  @property({
    type: 'date',
    defaultFn: 'now',
  })
  createdAt: Date;

  @property({
    type: 'date',
    defaultFn: 'now',
  })
  updatedAt: Date;

  constructor(data?: Partial<User>) {
    super(data);
  }
}

export interface UserRelations {
  // describe navigational properties here
}

export type UserWithRelations = User & UserRelations;