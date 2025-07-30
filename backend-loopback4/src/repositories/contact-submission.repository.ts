import {inject} from '@loopback/core';
import {DefaultCrudRepository, juggler} from '@loopback/repository';
import {ContactSubmission, ContactSubmissionRelations} from '../models';
import {DbDataSource} from '../datasources';

export class ContactSubmissionRepository extends DefaultCrudRepository<
  ContactSubmission,
  typeof ContactSubmission.prototype.id,
  ContactSubmissionRelations
> {
  constructor(
    @inject('datasources.db') dataSource: DbDataSource,
  ) {
    super(ContactSubmission, dataSource);
  }
}