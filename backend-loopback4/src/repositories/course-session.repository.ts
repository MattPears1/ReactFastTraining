import {inject} from '@loopback/core';
import {DefaultCrudRepository, juggler} from '@loopback/repository';
import {CourseSession, CourseSessionRelations} from '../models';
import {DbDataSource} from '../datasources';

export class CourseSessionRepository extends DefaultCrudRepository<
  CourseSession,
  typeof CourseSession.prototype.id,
  CourseSessionRelations
> {
  constructor(
    @inject('datasources.db') dataSource: DbDataSource,
  ) {
    super(CourseSession, dataSource);
  }
}