import { pgTable, integer, uuid, varchar, timestamp, decimal, text } from 'drizzle-orm/pg-core';
import { courses } from './courses';
import { users } from './users';

// Course schedules table - represents specific scheduled instances of courses
export const courseSchedules = pgTable('course_schedules', {
  id: integer('id').primaryKey().generatedAlwaysAsIdentity(),
  courseId: integer('course_id').notNull(),
  startDatetime: timestamp('start_datetime').notNull(),
  endDatetime: timestamp('end_datetime').notNull(),
  venueId: integer('venue_id'),
  instructorId: integer('instructor_id'),
  maxCapacity: integer('max_capacity').notNull().default(12),
  currentCapacity: integer('current_capacity').notNull().default(0),
  price: decimal('price', { precision: 10, scale: 2 }).notNull(),
  status: varchar('status', { length: 20 }).notNull().default('published'), // published, full, cancelled
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
});

// Venues table
export const venues = pgTable('venues', {
  id: integer('id').primaryKey().generatedAlwaysAsIdentity(),
  name: varchar('name', { length: 255 }).notNull(),
  code: varchar('code', { length: 50 }).notNull(),
  address: text('address').notNull(),
  city: varchar('city', { length: 100 }),
  postcode: varchar('postcode', { length: 20 }),
  createdAt: timestamp('created_at').defaultNow(),
});

export type CourseSchedule = typeof courseSchedules.$inferSelect;
export type NewCourseSchedule = typeof courseSchedules.$inferInsert;
export type Venue = typeof venues.$inferSelect;
export type NewVenue = typeof venues.$inferInsert;