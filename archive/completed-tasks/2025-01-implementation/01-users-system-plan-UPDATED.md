# Users System Implementation Plan - UPDATED

## Current State Analysis

After thorough analysis using ultrathink mode, I've discovered the system is in a transitional state:

### Database Layer ✅ (Modern)
- User table exists with authentication fields
- Bookings table has userId foreign key 
- Payments linked to bookings
- Invoices linked to users
- Using Drizzle ORM with PostgreSQL

### Application Layer ⚠️ (Legacy)
- BookingService still embeds contactDetails in bookings
- No automatic user creation during booking
- Auth system only for admin/instructor roles
- Customer data scattered, not centralized

### The Gap
The database is ready for a user-centric architecture, but the application code hasn't been updated to utilize it. This creates an opportunity for a clean migration path.

## Revised Implementation Strategy

### Phase 1: Enhance User Model
The current user table is authentication-focused. We need to expand it for customer management while maintaining backward compatibility.

```sql
-- Add customer-specific fields to existing users table
ALTER TABLE users ADD COLUMN IF NOT EXISTS role VARCHAR(50) DEFAULT 'customer';
ALTER TABLE users ADD COLUMN IF NOT EXISTS phone VARCHAR(20);
ALTER TABLE users ADD COLUMN IF NOT EXISTS company_name VARCHAR(255);
ALTER TABLE users ADD COLUMN IF NOT EXISTS address_line_1 VARCHAR(255);
ALTER TABLE users ADD COLUMN IF NOT EXISTS address_line_2 VARCHAR(255);
ALTER TABLE users ADD COLUMN IF NOT EXISTS city VARCHAR(100);
ALTER TABLE users ADD COLUMN IF NOT EXISTS postcode VARCHAR(10);
ALTER TABLE users ADD COLUMN IF NOT EXISTS emergency_contact_name VARCHAR(100);
ALTER TABLE users ADD COLUMN IF NOT EXISTS emergency_contact_phone VARCHAR(20);
ALTER TABLE users ADD COLUMN IF NOT EXISTS medical_notes TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS dietary_requirements TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS marketing_consent BOOLEAN DEFAULT false;
ALTER TABLE users ADD COLUMN IF NOT EXISTS total_bookings INTEGER DEFAULT 0;
ALTER TABLE users ADD COLUMN IF NOT EXISTS total_spent DECIMAL(10,2) DEFAULT 0.00;
ALTER TABLE users ADD COLUMN IF NOT EXISTS last_booking_date TIMESTAMP;
ALTER TABLE users ADD COLUMN IF NOT EXISTS customer_since DATE;

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);
CREATE INDEX IF NOT EXISTS idx_users_phone ON users(phone);
CREATE INDEX IF NOT EXISTS idx_users_company ON users(company_name);
```

### Phase 2: Update Drizzle Schema

```typescript
// backend-loopback4/src/db/schema/users.ts
import { pgTable, uuid, varchar, boolean, timestamp, integer, decimal, text, date, index } from 'drizzle-orm/pg-core';

export const users = pgTable('users', {
  // Existing fields
  id: uuid('id').primaryKey().defaultRandom(),
  email: varchar('email', { length: 255 }).unique().notNull(),
  name: varchar('name', { length: 255 }).notNull(),
  passwordHash: varchar('password_hash', { length: 255 }).notNull(),
  
  // Role & Status
  role: varchar('role', { length: 50 }).default('customer').notNull(),
  
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
  
  // Existing auth fields...
  emailVerified: boolean('email_verified').default(false),
  // ... rest of existing fields
}, (table) => {
  return {
    emailIdx: index('idx_users_email').on(table.email),
    roleIdx: index('idx_users_role').on(table.role),
    phoneIdx: index('idx_users_phone').on(table.phone),
    companyIdx: index('idx_users_company').on(table.companyName),
  };
});
```

### Phase 3: Smart User Service

Create a new UserManagementService that handles customer creation intelligently:

```typescript
// backend-loopback4/src/services/user-management.service.ts
export class UserManagementService {
  
  /**
   * Find or create a user based on email
   * Customers don't need passwords
   */
  async findOrCreateCustomer(data: {
    email: string;
    name: string;
    phone?: string;
    company?: string;
  }): Promise<User> {
    // Check if user exists
    const existingUser = await db
      .select()
      .from(users)
      .where(eq(users.email, data.email.toLowerCase()))
      .limit(1);
    
    if (existingUser.length > 0) {
      // Update with any new information
      const user = existingUser[0];
      const updates: any = {};
      
      if (data.phone && !user.phone) updates.phone = data.phone;
      if (data.company && !user.companyName) updates.companyName = data.company;
      
      if (Object.keys(updates).length > 0) {
        await db
          .update(users)
          .set(updates)
          .where(eq(users.id, user.id));
      }
      
      return user;
    }
    
    // Create new customer user
    const [newUser] = await db
      .insert(users)
      .values({
        email: data.email.toLowerCase(),
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
  async updateBookingStats(userId: string, bookingAmount: number) {
    await db
      .update(users)
      .set({
        totalBookings: sql`${users.totalBookings} + 1`,
        totalSpent: sql`${users.totalSpent} + ${bookingAmount}`,
        lastBookingDate: new Date(),
      })
      .where(eq(users.id, userId));
  }
}
```

### Phase 4: Enhanced Booking Flow

Update the booking creation to use the new user-centric approach:

```typescript
// backend-loopback4/src/services/booking.service.ts
export class BookingService {
  constructor(
    private userManagementService: UserManagementService,
    // ... other dependencies
  ) {}
  
  async createBooking(data: CreateBookingData): Promise<Booking> {
    // Step 1: Find or create user
    const user = await this.userManagementService.findOrCreateCustomer({
      email: data.contactDetails.email,
      name: `${data.contactDetails.firstName} ${data.contactDetails.lastName}`,
      phone: data.contactDetails.phone,
      company: data.contactDetails.company,
    });
    
    // Step 2: Create booking linked to user
    const booking = await db.transaction(async (tx) => {
      // Generate booking reference
      const bookingReference = await this.generateBookingReference();
      
      // Create booking
      const [newBooking] = await tx
        .insert(bookings)
        .values({
          userId: user.id,
          sessionId: data.sessionId,
          bookingReference,
          numberOfAttendees: data.participants.length,
          totalAmount: pricing.totalAmount,
          // ... other fields
        })
        .returning();
      
      // Create attendee records
      for (const participant of data.participants) {
        await tx.insert(bookingAttendees).values({
          bookingId: newBooking.id,
          name: `${participant.firstName} ${participant.lastName}`,
          email: participant.email,
          isPrimary: participant.email === data.contactDetails.email,
        });
      }
      
      // Update user statistics
      await this.userManagementService.updateBookingStats(
        user.id, 
        pricing.finalAmount
      );
      
      return newBooking;
    });
    
    return booking;
  }
}
```

### Phase 5: Admin UI Integration

The admin UI needs new endpoints to leverage user data:

```typescript
// backend-loopback4/src/controllers/admin/users.controller.ts
export class AdminUsersController {
  
  @get('/api/admin/users')
  @authenticate('jwt')
  @authorize({allowedRoles: ['admin']})
  async listUsers(
    @param.query.string('search') search?: string,
    @param.query.string('role') role?: string,
    @param.query.number('limit') limit = 50,
    @param.query.number('offset') offset = 0,
  ) {
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
  
  @get('/api/admin/users/:id')
  @authenticate('jwt')
  @authorize({allowedRoles: ['admin']})
  async getUserDetails(@param.path.string('id') id: string) {
    const user = await db
      .select()
      .from(users)
      .where(eq(users.id, id))
      .limit(1);
    
    if (!user[0]) throw new HttpErrors.NotFound('User not found');
    
    // Get related data
    const [bookings, payments] = await Promise.all([
      db
        .select()
        .from(bookings)
        .where(eq(bookings.userId, id))
        .orderBy(desc(bookings.createdAt))
        .limit(10),
      
      db
        .select()
        .from(payments)
        .innerJoin(bookings, eq(payments.bookingId, bookings.id))
        .where(eq(bookings.userId, id))
        .orderBy(desc(payments.createdAt))
        .limit(10),
    ]);
    
    return {
      user: user[0],
      recentBookings: bookings,
      recentPayments: payments,
    };
  }
}
```

## Migration Strategy

### Step 1: Database Migration (Safe)
1. Run ALTER TABLE commands to add new columns
2. These are all nullable/have defaults, so no risk
3. Add indexes for performance

### Step 2: Create Parallel Services (No Breaking Changes)
1. Create UserManagementService
2. Keep existing BookingService working
3. Add new enhanced endpoints alongside old ones

### Step 3: Gradual Migration
1. Update booking creation to create users
2. Run batch job to create users from existing bookings
3. Update admin UI to show user data
4. Keep old endpoints working during transition

### Step 4: Data Backfill Script
```typescript
async function migrateExistingBookings() {
  // Get all bookings without userId
  const unmappedBookings = await db
    .select()
    .from(bookings)
    .where(isNull(bookings.userId));
  
  for (const booking of unmappedBookings) {
    // Extract email from old contactDetails JSON
    const email = booking.contactDetails?.email;
    if (!email) continue;
    
    // Find or create user
    const user = await userManagementService.findOrCreateCustomer({
      email,
      name: `${booking.contactDetails.firstName} ${booking.contactDetails.lastName}`,
      phone: booking.contactDetails.phone,
      company: booking.contactDetails.company,
    });
    
    // Link booking to user
    await db
      .update(bookings)
      .set({ userId: user.id })
      .where(eq(bookings.id, booking.id));
  }
  
  // Update all user statistics
  await recalculateAllUserStats();
}
```

## Benefits of This Approach

1. **No Breaking Changes**: Old code continues to work
2. **Gradual Migration**: Can be done in phases
3. **Data Integrity**: No data loss, only enrichment
4. **Performance**: Proper indexes from the start
5. **Future-Proof**: Sets up for customer portal, mobile app, etc.

## Implementation Timeline

- **Week 1**: Database changes and schema updates
- **Week 2**: UserManagementService and enhanced booking flow
- **Week 3**: Admin API endpoints and data migration
- **Week 4**: Admin UI updates and testing
- **Week 5**: Full rollout and monitoring

## Key Differences from Original Plan

1. **Working with Existing Structure**: Not creating new tables, enhancing existing ones
2. **Drizzle ORM**: Using the existing ORM instead of LoopBack repositories
3. **Gradual Approach**: Parallel systems during transition
4. **Customer-First**: No forced registration, seamless experience
5. **Admin Authentication**: Keeping existing auth for admin/instructors only