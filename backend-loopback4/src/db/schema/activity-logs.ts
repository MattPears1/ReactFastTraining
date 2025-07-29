import { pgTable, integer, varchar, text, timestamp, jsonb } from 'drizzle-orm/pg-core';
import { users } from './users';

export const adminActivityLogs = pgTable('admin_activity_logs', {
  id: integer('id').primaryKey(),
  adminId: integer('admin_id').references(() => users.id),
  action: varchar('action', { length: 100 }).notNull(),
  entityType: varchar('entity_type', { length: 50 }).notNull(),
  entityId: varchar('entity_id', { length: 100 }),
  oldValues: jsonb('old_values'),
  newValues: jsonb('new_values'),
  ipAddress: varchar('ip_address', { length: 45 }),
  createdAt: timestamp('created_at').defaultNow(),
});