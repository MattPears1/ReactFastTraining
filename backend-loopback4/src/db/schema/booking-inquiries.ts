import { pgTable, text, timestamp, integer, boolean, jsonb } from 'drizzle-orm/pg-core';
import { createId } from '@paralleldrive/cuid2';

export const bookingInquiries = pgTable('booking_inquiries', {
  id: text('id').primaryKey().$defaultFn(() => createId()),
  inquiryReference: text('inquiry_reference').notNull().unique(),
  courseSessionId: text('course_session_id').notNull(),
  
  // Contact Information
  firstName: text('first_name').notNull(),
  lastName: text('last_name').notNull(),
  email: text('email').notNull(),
  phone: text('phone').notNull(),
  companyName: text('company_name'),
  
  // Inquiry Details
  numberOfPeople: integer('number_of_people').notNull().default(1),
  questions: text('questions'),
  preferredPaymentMethod: text('preferred_payment_method').notNull(),
  marketingConsent: boolean('marketing_consent').default(false),
  
  // Course Details (stored for reference)
  courseDetails: jsonb('course_details').notNull(),
  
  // Status and Expiry
  status: text('status').notNull().default('pending'), // pending, responded, converted, expired
  holdExpiresAt: timestamp('hold_expires_at').notNull(),
  
  // Tracking
  createdAt: timestamp('created_at').defaultNow().notNull(),
  respondedAt: timestamp('responded_at'),
  convertedAt: timestamp('converted_at'),
  bookingId: text('booking_id'), // Link to actual booking if converted
  
  // Response tracking
  instructorNotes: text('instructor_notes'),
  continuationUrl: text('continuation_url'),
});

export type BookingInquiry = typeof bookingInquiries.$inferSelect;
export type NewBookingInquiry = typeof bookingInquiries.$inferInsert;