import {inject} from '@loopback/core';
import {DefaultCrudRepository, juggler} from '@loopback/repository';
import {Testimonial, TestimonialRelations} from '../models';
import {DbDataSource} from '../datasources';

export class TestimonialRepository extends DefaultCrudRepository<
  Testimonial,
  typeof Testimonial.prototype.id,
  TestimonialRelations
> {
  constructor(
    @inject('datasources.db') dataSource: DbDataSource,
  ) {
    super(Testimonial, dataSource);
  }
}