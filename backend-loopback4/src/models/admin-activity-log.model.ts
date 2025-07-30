import {Entity, model, property} from '@loopback/repository';

@model({
  settings: {
    postgresql: {
      table: 'admin_activity_logs'
    }
  }
})
export class AdminActivityLog extends Entity {
  @property({
    type: 'number',
    id: true,
    generated: true,
  })
  id: number;

  @property({
    type: 'number',
    required: true,
  })
  adminId: number;

  @property({
    type: 'string',
    required: true,
  })
  action: string;

  @property({
    type: 'string',
  })
  entityType?: string;

  @property({
    type: 'number',
  })
  entityId?: number;

  @property({
    type: 'object',
    postgresql: {
      dataType: 'jsonb'
    }
  })
  oldValues?: object;

  @property({
    type: 'object',
    postgresql: {
      dataType: 'jsonb'
    }
  })
  newValues?: object;

  @property({
    type: 'string',
  })
  ipAddress?: string;

  @property({
    type: 'string',
  })
  userAgent?: string;

  @property({
    type: 'date',
    defaultFn: 'now',
  })
  createdAt: Date;

  constructor(data?: Partial<AdminActivityLog>) {
    super(data);
  }
}

export interface AdminActivityLogRelations {
  // describe navigational properties here
}

export type AdminActivityLogWithRelations = AdminActivityLog & AdminActivityLogRelations;