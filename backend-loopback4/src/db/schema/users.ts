import { pgTable, uuid, varchar, boolean, timestamp, integer, decimal, text, date, index } from 'drizzle-orm/pg-core';

export const users = pgTable('users', {
  // Core fields
  id: uuid('id').primaryKey().defaultRandom(),
  email: varchar('email', { length: 255 }).unique().notNull(),
  name: varchar('name', { length: 255 }).notNull(),
  passwordHash: varchar('password_hash', { length: 255 }).notNull(),
  
  // Role & Authentication
  role: varchar('role', { length: 50 }).default('customer').notNull(),
  emailVerified: boolean('email_verified').default(false),
  verificationToken: varchar('verification_token', { length: 255 }),
  verificationTokenExpires: timestamp('verification_token_expires'),
  resetToken: varchar('reset_token', { length: 255 }),
  resetTokenExpires: timestamp('reset_token_expires'),
  failedLoginAttempts: integer('failed_login_attempts').default(0),
  accountLockedUntil: timestamp('account_locked_until'),
  googleId: varchar('google_id', { length: 255 }).unique(),
  
  // Customer Information
  phone: varchar('phone', { length: 20 }),
  companyName: varchar('company_name', { length: 255 }),
  addressLine1: varchar('address_line_1', { length: 255 }),
  addressLine2: varchar('address_line_2', { length: 255 }),
  city: varchar('city', { length: 100 }),
  county: varchar('county', { length: 100 }),
  postcode: varchar('postcode', { length: 10 }),
  country: varchar('country', { length: 100 }).default('UK'),
  customerType: varchar('customer_type', { length: 50 }).default('individual'),
  
  // Emergency Contact
  emergencyContactName: varchar('emergency_contact_name', { length: 100 }),
  emergencyContactPhone: varchar('emergency_contact_phone', { length: 20 }),
  emergencyContactRelationship: varchar('emergency_contact_relationship', { length: 50 }),
  
  // Medical/Dietary
  medicalNotes: text('medical_notes'),
  dietaryRequirements: text('dietary_requirements'),
  hasMedicalConditions: boolean('has_medical_conditions').default(false),
  
  // Preferences
  marketingConsent: boolean('marketing_consent').default(false),
  smsConsent: boolean('sms_consent').default(false),
  newsletterSubscribed: boolean('newsletter_subscribed').default(true),
  preferredContactMethod: varchar('preferred_contact_method', { length: 50 }).default('email'),
  
  // Statistics
  totalBookings: integer('total_bookings').default(0),
  totalSpent: decimal('total_spent', { precision: 10, scale: 2 }).default('0.00'),
  lastBookingDate: timestamp('last_booking_date'),
  firstBookingDate: timestamp('first_booking_date'),
  customerSince: date('customer_since'),
  lastActivityDate: timestamp('last_activity_date'),
  
  // Timestamps
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
}, (table) => {
  return {
    emailIdx: index('idx_users_email').on(table.email),
    roleIdx: index('idx_users_role').on(table.role),
    phoneIdx: index('idx_users_phone').on(table.phone),
    companyIdx: index('idx_users_company').on(table.companyName),
    lastActivityIdx: index('idx_users_last_activity').on(table.lastActivityDate),
  };
});

export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;

// Role enum
export enum UserRole {
  CUSTOMER = 'customer',
  ADMIN = 'admin',
  INSTRUCTOR = 'instructor',
}