import {Entity, model, property} from '@loopback/repository';

@model()
export class Testimonial extends Entity {
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
  courseName: string;

  @property({
    type: 'string',
    required: true,
  })
  text: string;

  @property({
    type: 'number',
    required: true,
  })
  rating: number;

  @property({
    type: 'date',
    required: true,
  })
  date: string;

  @property({
    type: 'boolean',
    default: false,
  })
  isFeatured?: boolean;

  @property({
    type: 'string',
    required: true,
  })
  status: string;


  constructor(data?: Partial<Testimonial>) {
    super(data);
  }
}

export interface TestimonialRelations {
  // describe navigational properties here
}

export type TestimonialWithRelations = Testimonial & TestimonialRelations;