import { pgTable, uuid, varchar, integer, decimal, boolean, timestamp, text, date, time } from 'drizzle-orm/pg-core';

// Courses table
export const courses = pgTable('courses', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: varchar('name', { length: 255 }).notNull(),
  courseType: varchar('course_type', { length: 100 }).notNull(),
  description: text('description'),
  duration: varchar('duration', { length: 50 }).notNull(), // e.g., "6 hours", "3 days"
  price: decimal('price', { precision: 10, scale: 2 }).notNull(),
  minimumAge: integer('minimum_age').default(16),
  certificationBody: varchar('certification_body', { length: 100 }), // e.g., "HSE", "Ofqual"
  certificateValidityYears: integer('certificate_validity_years').default(3),
  isActive: boolean('is_active').default(true),
  stripeProductId: varchar('stripe_product_id', { length: 255 }),
  stripePriceId: varchar('stripe_price_id', { length: 255 }),
  stripeProductSyncedAt: timestamp('stripe_product_synced_at'),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
});

// Course sessions table - individual scheduled sessions
export const courseSessions = pgTable('course_sessions', {
  id: uuid('id').primaryKey().defaultRandom(),
  courseId: uuid('course_id').notNull().references(() => courses.id),
  sessionDate: date('session_date').notNull(),
  startTime: time('start_time').notNull(),
  endTime: time('end_time').notNull(),
  location: varchar('location', { length: 255 }).notNull(),
  trainerId: uuid('trainer_id'), // References trainers table if needed
  maxParticipants: integer('max_participants').default(12),
  currentBookings: integer('current_bookings').default(0),
  status: varchar('status', { length: 20 }).default('scheduled').notNull(), // scheduled, full, cancelled
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
});

// Type exports
export type Course = typeof courses.$inferSelect;
export type NewCourse = typeof courses.$inferInsert;
export type CourseSession = typeof courseSessions.$inferSelect;
export type NewCourseSession = typeof courseSessions.$inferInsert;

// Enum types
export enum CourseType {
  EFAW = 'Emergency First Aid at Work',
  FAW = 'First Aid at Work',
  PAEDIATRIC = 'Paediatric First Aid',
}

export enum SessionStatus {
  SCHEDULED = 'scheduled',
  FULL = 'full',
  CANCELLED = 'cancelled',
}