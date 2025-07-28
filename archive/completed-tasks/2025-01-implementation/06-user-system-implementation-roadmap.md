# User System Implementation Roadmap

## Overview
This roadmap provides detailed, step-by-step instructions for implementing the enhanced user system. Each step includes specific code changes, testing requirements, and rollback procedures.

## Pre-Implementation Checklist

- [ ] Full database backup completed
- [ ] Development environment tested
- [ ] Staging environment available
- [ ] All team members notified
- [ ] Current booking flow documented
- [ ] Rollback scripts prepared

---

## Week 1: Database & Schema Updates

### Day 1-2: Database Schema Enhancement

#### Step 1.1: Create Migration File
```bash
# Create new migration
touch backend-loopback4/src/db/migrations/001_enhance_users_table.sql
```

```sql
-- backend-loopback4/src/db/migrations/001_enhance_users_table.sql
BEGIN;

-- Add role field
ALTER TABLE users 
ADD COLUMN IF NOT EXISTS role VARCHAR(50) DEFAULT 'customer';

-- Add customer information fields
ALTER TABLE users ADD COLUMN IF NOT EXISTS phone VARCHAR(20);
ALTER TABLE users ADD COLUMN IF NOT EXISTS company_name VARCHAR(255);
ALTER TABLE users ADD COLUMN IF NOT EXISTS address_line_1 VARCHAR(255);
ALTER TABLE users ADD COLUMN IF NOT EXISTS address_line_2 VARCHAR(255);
ALTER TABLE users ADD COLUMN IF NOT EXISTS city VARCHAR(100);
ALTER TABLE users ADD COLUMN IF NOT EXISTS postcode VARCHAR(10);

-- Add emergency contact fields
ALTER TABLE users ADD COLUMN IF NOT EXISTS emergency_contact_name VARCHAR(100);
ALTER TABLE users ADD COLUMN IF NOT EXISTS emergency_contact_phone VARCHAR(20);

-- Add medical/dietary fields
ALTER TABLE users ADD COLUMN IF NOT EXISTS medical_notes TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS dietary_requirements TEXT;

-- Add preferences
ALTER TABLE users ADD COLUMN IF NOT EXISTS marketing_consent BOOLEAN DEFAULT false;

-- Add statistics fields
ALTER TABLE users ADD COLUMN IF NOT EXISTS total_bookings INTEGER DEFAULT 0;
ALTER TABLE users ADD COLUMN IF NOT EXISTS total_spent DECIMAL(10,2) DEFAULT 0.00;
ALTER TABLE users ADD COLUMN IF NOT EXISTS last_booking_date TIMESTAMP;
ALTER TABLE users ADD COLUMN IF NOT EXISTS customer_since DATE;

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);
CREATE INDEX IF NOT EXISTS idx_users_phone ON users(phone);
CREATE INDEX IF NOT EXISTS idx_users_company ON users(company_name);

-- Add comment
COMMENT ON TABLE users IS 'Unified user table for customers, admins, and instructors';

COMMIT;
```

#### Step 1.2: Update Drizzle Schema
```typescript
// backend-loopback4/src/db/schema/users.ts
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
  postcode: varchar('postcode', { length: 10 }),
  
  // Emergency Contact
  emergencyContactName: varchar('emergency_contact_name', { length: 100 }),
  emergencyContactPhone: varchar('emergency_contact_phone', { length: 20 }),
  
  // Medical/Dietary
  medicalNotes: text('medical_notes'),
  dietaryRequirements: text('dietary_requirements'),
  
  // Preferences
  marketingConsent: boolean('marketing_consent').default(false),
  
  // Statistics
  totalBookings: integer('total_bookings').default(0),
  totalSpent: decimal('total_spent', { precision: 10, scale: 2 }).default('0.00'),
  lastBookingDate: timestamp('last_booking_date'),
  customerSince: date('customer_since'),
  
  // Timestamps
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
}, (table) => {
  return {
    emailIdx: index('idx_users_email').on(table.email),
    roleIdx: index('idx_users_role').on(table.role),
    phoneIdx: index('idx_users_phone').on(table.phone),
    companyIdx: index('idx_users_company').on(table.companyName),
  };
});

// Type exports
export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;

// Role enum
export enum UserRole {
  CUSTOMER = 'customer',
  ADMIN = 'admin',
  INSTRUCTOR = 'instructor',
}
```

### Day 3: Create User Management Service

#### Step 1.3: Create Service File
```typescript
// backend-loopback4/src/services/user-management.service.ts
import { db } from '../config/database.config';
import { users, bookings, User } from '../db/schema';
import { eq, sql, and, ilike, or, desc } from 'drizzle-orm';

export interface CreateCustomerData {
  email: string;
  name: string;
  phone?: string;
  company?: string;
}

export interface UpdateCustomerData {
  phone?: string;
  addressLine1?: string;
  addressLine2?: string;
  city?: string;
  postcode?: string;
  emergencyContactName?: string;
  emergencyContactPhone?: string;
  medicalNotes?: string;
  dietaryRequirements?: string;
  marketingConsent?: boolean;
}

export class UserManagementService {
  /**
   * Find or create a customer user
   * Customers don't need passwords - passwordHash is empty
   */
  async findOrCreateCustomer(data: CreateCustomerData): Promise<User> {
    const email = data.email.toLowerCase();
    
    // Check if user exists
    const [existingUser] = await db
      .select()
      .from(users)
      .where(eq(users.email, email));
    
    if (existingUser) {
      // Update with any new information provided
      const updates: Partial<User> = { updatedAt: new Date() };
      let hasUpdates = false;
      
      // Only update if field is empty and new data provided
      if (data.phone && !existingUser.phone) {
        updates.phone = data.phone;
        hasUpdates = true;
      }
      
      if (data.company && !existingUser.companyName) {
        updates.companyName = data.company;
        hasUpdates = true;
      }
      
      // Update if name has changed
      if (data.name && data.name !== existingUser.name) {
        updates.name = data.name;
        hasUpdates = true;
      }
      
      if (hasUpdates) {
        const [updatedUser] = await db
          .update(users)
          .set(updates)
          .where(eq(users.id, existingUser.id))
          .returning();
        
        return updatedUser;
      }
      
      return existingUser;
    }
    
    // Create new customer user
    const [newUser] = await db
      .insert(users)
      .values({
        email,
        name: data.name,
        phone: data.phone,
        companyName: data.company,
        role: 'customer',
        passwordHash: '', // No password for customers
        emailVerified: true, // Auto-verify customers
        customerSince: new Date(),
      })
      .returning();
    
    return newUser;
  }
  
  /**
   * Update user statistics after booking
   */
  async updateBookingStats(userId: string, bookingAmount: number): Promise<void> {
    await db
      .update(users)
      .set({
        totalBookings: sql`${users.totalBookings} + 1`,
        totalSpent: sql`${users.totalSpent} + ${bookingAmount}`,
        lastBookingDate: new Date(),
        updatedAt: new Date(),
      })
      .where(eq(users.id, userId));
  }
  
  /**
   * Update user statistics after refund
   */
  async updateRefundStats(userId: string, refundAmount: number): Promise<void> {
    await db
      .update(users)
      .set({
        totalSpent: sql`GREATEST(${users.totalSpent} - ${refundAmount}, 0)`,
        updatedAt: new Date(),
      })
      .where(eq(users.id, userId));
  }
  
  /**
   * Update customer profile
   */
  async updateCustomerProfile(
    userId: string, 
    data: UpdateCustomerData
  ): Promise<User | null> {
    const [updatedUser] = await db
      .update(users)
      .set({
        ...data,
        updatedAt: new Date(),
      })
      .where(and(
        eq(users.id, userId),
        eq(users.role, 'customer')
      ))
      .returning();
    
    return updatedUser || null;
  }
  
  /**
   * Search users
   */
  async searchUsers(params: {
    search?: string;
    role?: string;
    limit?: number;
    offset?: number;
  }) {
    const { search, role, limit = 50, offset = 0 } = params;
    const conditions = [];
    
    if (search) {
      conditions.push(
        or(
          ilike(users.email, `%${search}%`),
          ilike(users.name, `%${search}%`),
          ilike(users.phone, `%${search}%`),
          ilike(users.companyName, `%${search}%`)
        )
      );
    }
    
    if (role) {
      conditions.push(eq(users.role, role));
    }
    
    const results = await db
      .select()
      .from(users)
      .where(conditions.length > 0 ? and(...conditions) : undefined)
      .limit(limit)
      .offset(offset)
      .orderBy(desc(users.lastBookingDate));
    
    return results;
  }
  
  /**
   * Get user with booking history
   */
  async getUserWithHistory(userId: string) {
    const [user] = await db
      .select()
      .from(users)
      .where(eq(users.id, userId));
    
    if (!user) return null;
    
    const userBookings = await db
      .select()
      .from(bookings)
      .where(eq(bookings.userId, userId))
      .orderBy(desc(bookings.createdAt))
      .limit(20);
    
    return {
      ...user,
      bookings: userBookings,
    };
  }
}

// Export singleton instance
export const userManagementService = new UserManagementService();
```

### Day 4-5: Testing & Validation

#### Step 1.4: Create Test Suite
```typescript
// backend-loopback4/src/__tests__/services/user-management.service.test.ts
import { expect } from '@loopback/testlab';
import { userManagementService } from '../../services/user-management.service';
import { db } from '../../config/database.config';
import { users } from '../../db/schema';
import { eq } from 'drizzle-orm';

describe('UserManagementService', () => {
  beforeEach(async () => {
    // Clean test data
    await db.delete(users).where(eq(users.email, 'test@example.com'));
  });
  
  describe('findOrCreateCustomer', () => {
    it('creates new customer when email not found', async () => {
      const result = await userManagementService.findOrCreateCustomer({
        email: 'test@example.com',
        name: 'Test User',
        phone: '07123456789',
      });
      
      expect(result).to.have.property('id');
      expect(result.email).to.equal('test@example.com');
      expect(result.role).to.equal('customer');
      expect(result.passwordHash).to.equal('');
      expect(result.emailVerified).to.be.true();
    });
    
    it('returns existing user when email exists', async () => {
      // Create user first
      const firstCall = await userManagementService.findOrCreateCustomer({
        email: 'test@example.com',
        name: 'Test User',
      });
      
      // Try to create again
      const secondCall = await userManagementService.findOrCreateCustomer({
        email: 'test@example.com',
        name: 'Test User',
        phone: '07123456789',
      });
      
      expect(secondCall.id).to.equal(firstCall.id);
      expect(secondCall.phone).to.equal('07123456789'); // Should update
    });
    
    it('handles email case insensitivity', async () => {
      const user1 = await userManagementService.findOrCreateCustomer({
        email: 'Test@Example.com',
        name: 'Test User',
      });
      
      const user2 = await userManagementService.findOrCreateCustomer({
        email: 'test@example.com',
        name: 'Test User',
      });
      
      expect(user1.id).to.equal(user2.id);
    });
  });
  
  describe('updateBookingStats', () => {
    it('increments booking statistics correctly', async () => {
      const user = await userManagementService.findOrCreateCustomer({
        email: 'test@example.com',
        name: 'Test User',
      });
      
      await userManagementService.updateBookingStats(user.id, 75.00);
      
      const [updated] = await db
        .select()
        .from(users)
        .where(eq(users.id, user.id));
      
      expect(updated.totalBookings).to.equal(1);
      expect(Number(updated.totalSpent)).to.equal(75.00);
      expect(updated.lastBookingDate).to.be.not.null();
    });
  });
});
```

---

## Week 2: Service Integration

### Day 1-2: Update Booking Service

#### Step 2.1: Modify Booking Service
```typescript
// backend-loopback4/src/services/booking.service.ts
import { userManagementService } from './user-management.service';
import { db } from '../config/database.config';
import { bookings, bookingAttendees, courseSessions } from '../db/schema';

export class BookingService {
  // ... existing code ...
  
  async createBooking(data: CreateBookingData): Promise<any> {
    return db.transaction(async (tx) => {
      // Step 1: Find or create user from contact details
      const user = await userManagementService.findOrCreateCustomer({
        email: data.contactDetails.email,
        name: `${data.contactDetails.firstName} ${data.contactDetails.lastName}`,
        phone: data.contactDetails.phone,
        company: data.contactDetails.company,
      });
      
      // Step 2: Validate session (existing logic)
      const session = await tx
        .select()
        .from(courseSessions)
        .where(eq(courseSessions.id, data.sessionId))
        .limit(1);
      
      if (!session[0]) {
        throw new Error('Session not found');
      }
      
      // Step 3: Calculate pricing (existing logic)
      const pricing = await this.calculatePricing(
        data.sessionId,
        data.participants.length
      );
      
      // Step 4: Generate booking reference
      const bookingReference = await this.generateBookingReference();
      
      // Step 5: Create booking with userId
      const [newBooking] = await tx
        .insert(bookings)
        .values({
          bookingReference,
          userId: user.id, // Link to user!
          sessionId: data.sessionId,
          numberOfAttendees: data.participants.length,
          totalAmount: pricing.totalAmount,
          specialRequirements: data.specialRequirements,
          termsAccepted: data.confirmedTermsAndConditions,
          termsAcceptedAt: data.confirmedTermsAndConditions ? new Date() : null,
          status: 'pending',
        })
        .returning();
      
      // Step 6: Create attendee records
      for (const participant of data.participants) {
        await tx.insert(bookingAttendees).values({
          bookingId: newBooking.id,
          name: `${participant.firstName} ${participant.lastName}`,
          email: participant.email,
          isPrimary: participant.email === data.contactDetails.email,
        });
      }
      
      // Step 7: Update user stats will happen after payment
      // Don't update stats here as booking might not complete
      
      return {
        ...newBooking,
        user, // Include user in response
        attendees: data.participants,
      };
    });
  }
  
  // Add method to handle post-payment updates
  async confirmBookingPayment(bookingId: string): Promise<void> {
    const [booking] = await db
      .select()
      .from(bookings)
      .where(eq(bookings.id, bookingId));
    
    if (!booking) return;
    
    // Update booking status
    await db
      .update(bookings)
      .set({ 
        status: 'confirmed',
        updatedAt: new Date() 
      })
      .where(eq(bookings.id, bookingId));
    
    // Update user statistics
    await userManagementService.updateBookingStats(
      booking.userId,
      Number(booking.totalAmount)
    );
  }
}
```

### Day 3: Create Admin User Controller

#### Step 2.2: Create Admin Controller
```typescript
// backend-loopback4/src/controllers/admin/users.controller.ts
import {
  get,
  param,
  put,
  requestBody,
  HttpErrors,
} from '@loopback/rest';
import { authenticate } from '@loopback/authentication';
import { authorize } from '@loopback/authorization';
import { userManagementService } from '../../services/user-management.service';

export class AdminUsersController {
  @get('/api/admin/users')
  @authenticate('jwt')
  @authorize({ allowedRoles: ['admin'] })
  async listUsers(
    @param.query.string('search') search?: string,
    @param.query.string('role') role?: string,
    @param.query.number('limit') limit = 50,
    @param.query.number('offset') offset = 0,
  ) {
    return userManagementService.searchUsers({
      search,
      role,
      limit,
      offset,
    });
  }
  
  @get('/api/admin/users/:id')
  @authenticate('jwt')
  @authorize({ allowedRoles: ['admin'] })
  async getUserDetails(@param.path.string('id') id: string) {
    const userWithHistory = await userManagementService.getUserWithHistory(id);
    
    if (!userWithHistory) {
      throw new HttpErrors.NotFound('User not found');
    }
    
    return userWithHistory;
  }
  
  @put('/api/admin/users/:id')
  @authenticate('jwt')
  @authorize({ allowedRoles: ['admin'] })
  async updateUser(
    @param.path.string('id') id: string,
    @requestBody() userData: {
      phone?: string;
      addressLine1?: string;
      addressLine2?: string;
      city?: string;
      postcode?: string;
      emergencyContactName?: string;
      emergencyContactPhone?: string;
      medicalNotes?: string;
      dietaryRequirements?: string;
    }
  ) {
    const updated = await userManagementService.updateCustomerProfile(id, userData);
    
    if (!updated) {
      throw new HttpErrors.NotFound('User not found');
    }
    
    return updated;
  }
  
  @get('/api/admin/users/:id/bookings')
  @authenticate('jwt')
  @authorize({ allowedRoles: ['admin'] })
  async getUserBookings(
    @param.path.string('id') userId: string,
    @param.query.number('limit') limit = 20,
    @param.query.number('offset') offset = 0,
  ) {
    const bookings = await db
      .select({
        booking: bookings,
        session: courseSessions,
      })
      .from(bookings)
      .innerJoin(courseSessions, eq(bookings.sessionId, courseSessions.id))
      .where(eq(bookings.userId, userId))
      .orderBy(desc(bookings.createdAt))
      .limit(limit)
      .offset(offset);
    
    return bookings;
  }
  
  @get('/api/admin/users/:id/payments')
  @authenticate('jwt')
  @authorize({ allowedRoles: ['admin'] })
  async getUserPayments(
    @param.path.string('id') userId: string,
    @param.query.number('limit') limit = 20,
    @param.query.number('offset') offset = 0,
  ) {
    const userPayments = await db
      .select({
        payment: payments,
        booking: bookings,
      })
      .from(payments)
      .innerJoin(bookings, eq(payments.bookingId, bookings.id))
      .where(eq(bookings.userId, userId))
      .orderBy(desc(payments.createdAt))
      .limit(limit)
      .offset(offset);
    
    return userPayments;
  }
}
```

### Day 4-5: Data Migration

#### Step 2.3: Create Migration Script
```typescript
// backend-loopback4/src/scripts/migrate-bookings-to-users.ts
import { db } from '../config/database.config';
import { bookings, users } from '../db/schema';
import { isNull, eq, sql } from 'drizzle-orm';
import { userManagementService } from '../services/user-management.service';

async function migrateBookingsToUsers() {
  console.log('Starting booking to user migration...');
  
  // Get count of bookings without userId
  const [{ count }] = await db
    .select({ count: sql`COUNT(*)` })
    .from(bookings)
    .where(isNull(bookings.userId));
  
  console.log(`Found ${count} bookings without users`);
  
  // Process in batches
  const batchSize = 100;
  let processed = 0;
  
  while (processed < count) {
    // Get batch of unmapped bookings
    const unmappedBookings = await db
      .select()
      .from(bookings)
      .where(isNull(bookings.userId))
      .limit(batchSize);
    
    for (const booking of unmappedBookings) {
      try {
        // Extract contact details from old format
        const contactDetails = booking.contactDetails as any;
        if (!contactDetails?.email) {
          console.warn(`Booking ${booking.bookingReference} has no email, skipping`);
          continue;
        }
        
        // Find or create user
        const user = await userManagementService.findOrCreateCustomer({
          email: contactDetails.email,
          name: `${contactDetails.firstName || ''} ${contactDetails.lastName || ''}`.trim(),
          phone: contactDetails.phone,
          company: contactDetails.company,
        });
        
        // Link booking to user
        await db
          .update(bookings)
          .set({ 
            userId: user.id,
            updatedAt: new Date()
          })
          .where(eq(bookings.id, booking.id));
        
        console.log(`Linked booking ${booking.bookingReference} to user ${user.email}`);
      } catch (error) {
        console.error(`Error processing booking ${booking.bookingReference}:`, error);
      }
    }
    
    processed += unmappedBookings.length;
    console.log(`Processed ${processed}/${count} bookings`);
  }
  
  console.log('Migration complete. Recalculating user statistics...');
  
  // Recalculate all user statistics
  await recalculateUserStatistics();
  
  console.log('User statistics updated. Migration finished!');
}

async function recalculateUserStatistics() {
  // Get all users with bookings
  const usersWithBookings = await db
    .select({
      userId: bookings.userId,
      totalBookings: sql`COUNT(*)`,
      totalSpent: sql`SUM(${bookings.totalAmount})`,
      firstBooking: sql`MIN(${bookings.createdAt})`,
      lastBooking: sql`MAX(${bookings.createdAt})`,
    })
    .from(bookings)
    .where(sql`${bookings.userId} IS NOT NULL`)
    .groupBy(bookings.userId);
  
  // Update each user
  for (const stats of usersWithBookings) {
    await db
      .update(users)
      .set({
        totalBookings: Number(stats.totalBookings),
        totalSpent: stats.totalSpent || '0',
        customerSince: stats.firstBooking,
        lastBookingDate: stats.lastBooking,
        updatedAt: new Date(),
      })
      .where(eq(users.id, stats.userId!));
  }
  
  console.log(`Updated statistics for ${usersWithBookings.length} users`);
}

// Run migration if called directly
if (require.main === module) {
  migrateBookingsToUsers()
    .then(() => {
      console.log('Migration completed successfully');
      process.exit(0);
    })
    .catch((error) => {
      console.error('Migration failed:', error);
      process.exit(1);
    });
}

export { migrateBookingsToUsers, recalculateUserStatistics };
```

---

## Week 3: Admin UI Integration

### Day 1-2: Update Admin Types

#### Step 3.1: Create User Types
```typescript
// src/types/user.ts
export interface User {
  id: string;
  email: string;
  name: string;
  role: 'customer' | 'admin' | 'instructor';
  phone?: string;
  companyName?: string;
  addressLine1?: string;
  addressLine2?: string;
  city?: string;
  postcode?: string;
  emergencyContactName?: string;
  emergencyContactPhone?: string;
  medicalNotes?: string;
  dietaryRequirements?: string;
  marketingConsent: boolean;
  totalBookings: number;
  totalSpent: number;
  lastBookingDate?: string;
  customerSince?: string;
  createdAt: string;
  updatedAt: string;
}

export interface UserWithHistory extends User {
  bookings: Array<{
    id: string;
    bookingReference: string;
    sessionId: string;
    numberOfAttendees: number;
    totalAmount: number;
    status: string;
    createdAt: string;
  }>;
}
```

### Day 3-4: Create Users Page Component

#### Step 3.2: Create Users Page
```tsx
// src/admin/features/users/UsersPage.tsx
import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Search, Users, Phone, Building, Calendar, PoundSterling } from 'lucide-react';
import { format } from 'date-fns';
import { AdminCard } from '../../components/ui/AdminCard';
import { AdminBadge } from '../../components/ui/AdminBadge';
import { LoadingSpinner } from '../../components/common/LoadingSpinner';
import { adminApi } from '../../utils/api';
import type { User } from '../../../types/user';

export const UsersPage: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState<string>('all');
  
  const { data: users, isLoading } = useQuery({
    queryKey: ['admin-users', searchTerm, roleFilter],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (searchTerm) params.append('search', searchTerm);
      if (roleFilter !== 'all') params.append('role', roleFilter);
      
      const response = await adminApi.get(`/api/admin/users?${params}`);
      return response.json() as Promise<User[]>;
    },
  });
  
  const getRoleBadgeVariant = (role: string) => {
    switch (role) {
      case 'admin': return 'error';
      case 'instructor': return 'warning';
      default: return 'success';
    }
  };
  
  if (isLoading) {
    return (
      <div className="admin-loading-container">
        <LoadingSpinner size="lg" />
      </div>
    );
  }
  
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="admin-page-header">
        <h1 className="admin-page-title">User Management</h1>
        <p className="admin-page-subtitle">
          Manage customers, administrators, and instructors
        </p>
      </div>
      
      {/* Filters */}
      <AdminCard>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="md:col-span-2">
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search by name, email, phone, or company..."
              className="admin-input"
            />
          </div>
          <div>
            <select
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value)}
              className="admin-select"
            >
              <option value="all">All Roles</option>
              <option value="customer">Customers</option>
              <option value="admin">Administrators</option>
              <option value="instructor">Instructors</option>
            </select>
          </div>
        </div>
      </AdminCard>
      
      {/* Users Table */}
      <AdminCard>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  User
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Contact
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Role
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Activity
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Lifetime Value
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {users?.map((user) => (
                <tr key={user.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div>
                      <div className="text-sm font-medium text-gray-900">
                        {user.name}
                      </div>
                      <div className="text-sm text-gray-500">
                        {user.email}
                      </div>
                      {user.companyName && (
                        <div className="text-sm text-gray-500 flex items-center mt-1">
                          <Building className="w-3 h-3 mr-1" />
                          {user.companyName}
                        </div>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {user.phone && (
                      <div className="text-sm text-gray-900 flex items-center">
                        <Phone className="w-3 h-3 mr-1" />
                        {user.phone}
                      </div>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <AdminBadge variant={getRoleBadgeVariant(user.role)}>
                      {user.role}
                    </AdminBadge>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm">
                      <div className="text-gray-900">
                        {user.totalBookings} bookings
                      </div>
                      {user.lastBookingDate && (
                        <div className="text-gray-500">
                          Last: {format(new Date(user.lastBookingDate), 'dd MMM yyyy')}
                        </div>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm">
                      <div className="font-medium text-gray-900">
                        £{user.totalSpent}
                      </div>
                      {user.customerSince && (
                        <div className="text-gray-500">
                          Since {format(new Date(user.customerSince), 'MMM yyyy')}
                        </div>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <a
                      href={`/admin/users/${user.id}`}
                      className="text-blue-600 hover:text-blue-900"
                    >
                      View Details
                    </a>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </AdminCard>
    </div>
  );
};
```

### Day 5: Testing & Deployment

#### Step 3.3: End-to-End Testing Checklist
```markdown
## E2E Testing Checklist

### Database Changes
- [ ] Run migration script on test database
- [ ] Verify all columns added successfully
- [ ] Check indexes created
- [ ] Test rollback procedure

### Booking Flow
- [ ] Create new booking as new customer
- [ ] Create booking as existing customer
- [ ] Verify user created/linked correctly
- [ ] Check user statistics updated after payment

### Admin Interface
- [ ] Access users list page
- [ ] Search users by email
- [ ] Filter by role
- [ ] View user details
- [ ] Check booking history displayed
- [ ] Verify payment history

### Data Migration
- [ ] Run migration script on sample data
- [ ] Verify all bookings linked to users
- [ ] Check user statistics calculated correctly
- [ ] Ensure no data loss

### Performance
- [ ] Test search with 10,000+ users
- [ ] Verify page load times < 2s
- [ ] Check database query performance
- [ ] Monitor API response times
```

---

## Week 4: Monitoring & Optimization

### Monitoring Setup
```typescript
// backend-loopback4/src/scripts/monitor-user-system.ts
export async function getUserSystemHealth() {
  const metrics = await db.transaction(async (tx) => {
    const [userStats] = await tx
      .select({
        totalUsers: sql`COUNT(*)`,
        customersCount: sql`COUNT(*) FILTER (WHERE role = 'customer')`,
        adminsCount: sql`COUNT(*) FILTER (WHERE role = 'admin')`,
        instructorsCount: sql`COUNT(*) FILTER (WHERE role = 'instructor')`,
        usersWithBookings: sql`COUNT(*) FILTER (WHERE total_bookings > 0)`,
        averageBookings: sql`AVG(total_bookings)`,
        averageSpent: sql`AVG(total_spent)`,
      })
      .from(users);
    
    const [bookingStats] = await tx
      .select({
        bookingsWithoutUser: sql`COUNT(*) FILTER (WHERE user_id IS NULL)`,
        totalBookings: sql`COUNT(*)`,
      })
      .from(bookings);
    
    return {
      users: userStats,
      bookings: bookingStats,
      migrationProgress: {
        completed: bookingStats.totalBookings - bookingStats.bookingsWithoutUser,
        total: bookingStats.totalBookings,
        percentage: ((bookingStats.totalBookings - bookingStats.bookingsWithoutUser) / bookingStats.totalBookings * 100).toFixed(2),
      },
    };
  });
  
  return metrics;
}
```

## Rollback Procedures

### Database Rollback
```sql
-- Remove added columns (if needed)
BEGIN;
ALTER TABLE users DROP COLUMN IF EXISTS role;
ALTER TABLE users DROP COLUMN IF EXISTS phone;
-- ... other columns
COMMIT;
```

### Code Rollback
- Git revert to pre-implementation commit
- Restore old booking service
- Remove new controllers
- Redeploy previous version

## Success Metrics

1. **Technical Success**
   - 100% of bookings linked to users
   - API response times < 200ms
   - Zero data loss
   - All tests passing

2. **Business Success**
   - Customer lookup time reduced by 80%
   - Support ticket resolution improved by 50%
   - Repeat booking identification enabled
   - Customer lifetime value trackable

## Post-Implementation Tasks

1. **Documentation**
   - Update API documentation
   - Create user guide for admin staff
   - Document new database schema

2. **Training**
   - Train admin staff on new user search
   - Show how to view customer history
   - Explain user statistics

3. **Future Enhancements**
   - Customer portal development
   - Marketing segmentation
   - Loyalty program
   - Mobile app integration