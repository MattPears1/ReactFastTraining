import { pgTable, integer, varchar, text, timestamp, jsonb } from 'drizzle-orm/pg-core';
import { users } from './users';

export const adminAlerts = pgTable('admin_alerts', {
  id: integer('id').primaryKey(),
  alertType: varchar('alert_type', { length: 50 }).notNull(),
  severity: varchar('severity', { length: 20 }).notNull(),
  title: varchar('title', { length: 255 }).notNull(),
  description: text('description'),
  metadata: jsonb('metadata').default({}),
  status: varchar('status', { length: 20 }).default('unread'),
  createdAt: timestamp('created_at').defaultNow(),
  acknowledgedAt: timestamp('acknowledged_at'),
  acknowledgedBy: integer('acknowledged_by').references(() => users.id),
  resolvedAt: timestamp('resolved_at'),
  resolvedBy: integer('resolved_by').references(() => users.id),
  notes: text('notes'),
});