import { injectable } from '@loopback/core';
import { db } from '../db';
import { adminActivityLogs } from '../db/schema';

export interface ActivityLogData {
  adminId?: number;
  action: string;
  entityType: string;
  entityId?: string;
  oldValues?: any;
  newValues?: any;
  ipAddress?: string;
}

@injectable()
export class ActivityLogService {
  async log(data: ActivityLogData): Promise<void> {
    try {
      await db.insert(adminActivityLogs).values({
        adminId: data.adminId,
        action: data.action,
        entityType: data.entityType,
        entityId: data.entityId,
        oldValues: data.oldValues,
        newValues: data.newValues,
        ipAddress: data.ipAddress,
      });
    } catch (error) {
      console.error('Failed to log activity:', error);
      // Don't throw - logging failures shouldn't break the application
    }
  }

  async getRecentActivity(adminId?: number, limit: number = 50): Promise<any[]> {
    try {
      const query = db
        .select()
        .from(adminActivityLogs)
        .orderBy(adminActivityLogs.createdAt, 'desc')
        .limit(limit);

      if (adminId) {
        query.where({ adminId });
      }

      return await query;
    } catch (error) {
      console.error('Failed to get activity logs:', error);
      return [];
    }
  }
}