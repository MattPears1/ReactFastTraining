import {inject} from '@loopback/core';
import {DefaultCrudRepository} from '@loopback/repository';
import {PostgresDataSource} from '../datasources';
import {User, UserRelations} from '../models/user.model';

export class UserRepository extends DefaultCrudRepository<
  User,
  typeof User.prototype.id,
  UserRelations
> {
  constructor(
    @inject('datasources.postgres') dataSource: PostgresDataSource,
  ) {
    super(User, dataSource);
  }

  async findByEmail(email: string): Promise<User | null> {
    return this.findOne({where: {email}});
  }

  async findAdmins(): Promise<User[]> {
    return this.find({
      where: {
        role: {inq: ['admin', 'instructor']},
        isActive: true
      }
    });
  }
}