import { pgTable, uuid, varchar, integer, decimal, boolean, timestamp, text, index } from 'drizzle-orm/pg-core';
import { users } from './users';
import { courseSessions } from './sessions';

// Bookings table - main booking record
export const bookings = pgTable('bookings', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').notNull().references(() => users.id),
  sessionId: uuid('session_id').notNull().references(() => courseSessions.id),
  bookingReference: varchar('booking_reference', { length: 10 }).unique().notNull(),
  numberOfAttendees: integer('number_of_attendees').notNull(),
  totalAmount: decimal('total_amount', { precision: 10, scale: 2 }).notNull(),
  specialRequirements: text('special_requirements'),
  termsAccepted: boolean('terms_accepted').notNull().default(false),
  termsAcceptedAt: timestamp('terms_accepted_at'),
  status: varchar('status', { length: 20 }).default('pending').notNull(),
  paymentIntentId: varchar('payment_intent_id', { length: 255 }),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
}, (table) => {
  return {
    userIdx: index('idx_bookings_user').on(table.userId),
    sessionIdx: index('idx_bookings_session').on(table.sessionId),
    referenceIdx: index('idx_bookings_reference').on(table.bookingReference),
  };
});

// Booking attendees - separate table for each attendee
export const bookingAttendees = pgTable('booking_attendees', {
  id: uuid('id').primaryKey().defaultRandom(),
  bookingId: uuid('booking_id').notNull().references(() => bookings.id, { onDelete: 'cascade' }),
  name: varchar('name', { length: 255 }).notNull(),
  email: varchar('email', { length: 255 }).notNull(),
  isPrimary: boolean('is_primary').default(false),
  createdAt: timestamp('created_at').defaultNow(),
});

// Special requirements table
export const specialRequirements = pgTable('special_requirements', {
  id: uuid('id').primaryKey().defaultRandom(),
  bookingId: uuid('booking_id').notNull().references(() => bookings.id, { onDelete: 'cascade' }),
  category: varchar('category', { length: 50 }).notNull(),
  requirementType: varchar('requirement_type', { length: 100 }).notNull(),
  details: text('details').notNull(),
  priority: varchar('priority', { length: 20 }).default('standard').notNull(),
  instructorNotified: boolean('instructor_notified').default(false),
  createdAt: timestamp('created_at').defaultNow(),
});

// Requirement templates for predefined options
export const requirementTemplates = pgTable('requirement_templates', {
  id: uuid('id').primaryKey().defaultRandom(),
  category: varchar('category', { length: 50 }).notNull(),
  requirementType: varchar('requirement_type', { length: 100 }).notNull(),
  displayName: varchar('display_name', { length: 255 }).notNull(),
  description: text('description'),
  requiresDetails: boolean('requires_details').default(false),
  sortOrder: integer('sort_order').default(0),
  isActive: boolean('is_active').default(true),
});

// Type exports
export type Booking = typeof bookings.$inferSelect;
export type NewBooking = typeof bookings.$inferInsert;
export type BookingAttendee = typeof bookingAttendees.$inferSelect;
export type NewBookingAttendee = typeof bookingAttendees.$inferInsert;
export type SpecialRequirement = typeof specialRequirements.$inferSelect;
export type NewSpecialRequirement = typeof specialRequirements.$inferInsert;
export type RequirementTemplate = typeof requirementTemplates.$inferSelect;
export type NewRequirementTemplate = typeof requirementTemplates.$inferInsert;

// Enum types
export enum BookingStatus {
  PENDING = 'pending',
  CONFIRMED = 'confirmed',
  CANCELLED = 'cancelled',
  REFUNDED = 'refunded',
}

export enum RequirementPriority {
  CRITICAL = 'critical',
  HIGH = 'high',
  STANDARD = 'standard',
}

export enum RequirementCategory {
  ACCESSIBILITY = 'accessibility',
  DIETARY = 'dietary',
  MEDICAL = 'medical',
  OTHER = 'other',
}