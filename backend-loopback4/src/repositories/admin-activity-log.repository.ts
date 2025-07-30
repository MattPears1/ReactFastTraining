import {inject} from '@loopback/core';
import {DefaultCrudRepository} from '@loopback/repository';
import {PostgresDataSource} from '../datasources';
import {AdminActivityLog, AdminActivityLogRelations} from '../models/admin-activity-log.model';

export class AdminActivityLogRepository extends DefaultCrudRepository<
  AdminActivityLog,
  typeof AdminActivityLog.prototype.id,
  AdminActivityLogRelations
> {
  constructor(
    @inject('datasources.postgres') dataSource: PostgresDataSource,
  ) {
    super(AdminActivityLog, dataSource);
  }

  async getRecentActivity(adminId?: number, limit: number = 50): Promise<AdminActivityLog[]> {
    const filter: any = {
      order: ['createdAt DESC'],
      limit
    };

    if (adminId) {
      filter.where = {adminId};
    }

    return this.find(filter);
  }

  async getActivityByEntity(entityType: string, entityId: number): Promise<AdminActivityLog[]> {
    return this.find({
      where: {
        entityType,
        entityId
      },
      order: ['createdAt DESC']
    });
  }
}