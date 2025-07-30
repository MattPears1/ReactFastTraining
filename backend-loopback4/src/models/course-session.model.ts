import {Entity, model, property} from '@loopback/repository';

@model()
export class CourseSession extends Entity {
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
  courseId: string;

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
  })
  startTime?: string;

  @property({
    type: 'string',
  })
  endTime?: string;

  @property({
    type: 'number',
    required: true,
  })
  maxParticipants: number;

  @property({
    type: 'number',
    required: true,
  })
  currentParticipants: number;

  @property({
    type: 'string',
  })
  venue?: string;

  @property({
    type: 'string',
  })
  instructor?: string;

  @property({
    type: 'string',
    required: true,
  })
  status: string;


  constructor(data?: Partial<CourseSession>) {
    super(data);
  }
}

export interface CourseSessionRelations {
  // describe navigational properties here
}

export type CourseSessionWithRelations = CourseSession & CourseSessionRelations;