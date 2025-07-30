import { injectable, BindingScope } from '@loopback/core';
import { db } from '../config/database.config';
import { users, bookings, payments, User } from '../db/schema';
import { eq, sql, and, ilike, or, desc, isNull } from 'drizzle-orm';

export interface CreateCustomerData {
  email: string;
  name: string;
  phone?: string;
  company?: string;
}

export interface UpdateCustomerData {
  name?: string;
  phone?: string;
  addressLine1?: string;
  addressLine2?: string;
  city?: string;
  county?: string;
  postcode?: string;
  country?: string;
  emergencyContactName?: string;
  emergencyContactPhone?: string;
  emergencyContactRelationship?: string;
  medicalNotes?: string;
  dietaryRequirements?: string;
  hasMedicalConditions?: boolean;
  marketingConsent?: boolean;
  smsConsent?: boolean;
  newsletterSubscribed?: boolean;
  preferredContactMethod?: string;
}

export interface UserSearchParams {
  search?: string;
  role?: string;
  customerType?: string;
  hasBookings?: boolean;
  limit?: number;
  offset?: number;
}

export interface UserWithStats extends User {
  bookingCount?: number;
  lastBookingReference?: string;
  upcomingBookings?: number;
}

@injectable({ scope: BindingScope.SINGLETON })
export class UserManagementService {
  /**
   * Find or create a customer user
   * Customers don't need passwords - passwordHash is empty string
   */
  async findOrCreateCustomer(data: CreateCustomerData): Promise<User> {
    const email = data.email.toLowerCase().trim();
    
    // Check if user exists
    const [existingUser] = await db
      .select()
      .from(users)
      .where(eq(users.email, email));
    
    if (existingUser) {
      // Update with any new information provided
      const updates: Partial<User> = { 
        updatedAt: new Date(),
        lastActivityDate: new Date() 
      };
      let hasUpdates = false;
      
      // Only update if field is empty and new data provided
      if (data.phone && !existingUser.phone) {
        updates.phone = data.phone;
        hasUpdates = true;
      }
      
      if (data.company && !existingUser.companyName) {
        updates.companyName = data.company;
        updates.customerType = 'corporate';
        hasUpdates = true;
      }
      
      // Update if name has changed (but only if provided)
      if (data.name && data.name.trim() && data.name !== existingUser.name) {
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
      
      // Update last activity even if no other changes
      await db
        .update(users)
        .set({ lastActivityDate: new Date() })
        .where(eq(users.id, existingUser.id));
      
      return existingUser;
    }
    
    // Create new customer user
    const [newUser] = await db
      .insert(users)
      .values({
        email,
        name: data.name.trim(),
        phone: data.phone,
        companyName: data.company,
        role: 'customer',
        passwordHash: '', // No password for customers
        emailVerified: true, // Auto-verify customers
        customerSince: new Date(),
        customerType: data.company ? 'corporate' : 'individual',
        lastActivityDate: new Date(),
      })
      .returning();
    
    console.log(`Created new customer user: ${newUser.email}`);
    return newUser;
  }
  
  /**
   * Update user statistics after successful booking
   */
  async updateBookingStats(userId: string, bookingAmount: number): Promise<void> {
    const now = new Date();
    
    // Get current user to check if this is their first booking
    const [user] = await db
      .select()
      .from(users)
      .where(eq(users.id, userId));
    
    if (!user) return;
    
    const updates: any = {
      totalBookings: sql`${users.totalBookings} + 1`,
      totalSpent: sql`${users.totalSpent} + ${bookingAmount}`,
      lastBookingDate: now,
      lastActivityDate: now,
      updatedAt: now,
    };
    
    // Set first booking date if this is their first booking
    if (!user.firstBookingDate) {
      updates.firstBookingDate = now;
    }
    
    await db
      .update(users)
      .set(updates)
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
        totalBookings: sql`GREATEST(${users.totalBookings} - 1, 0)`,
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
        lastActivityDate: new Date(),
      })
      .where(and(
        eq(users.id, userId),
        eq(users.role, 'customer')
      ))
      .returning();
    
    return updatedUser || null;
  }
  
  /**
   * Search users with filters
   */
  async searchUsers(params: UserSearchParams): Promise<UserWithStats[]> {
    const { 
      search, 
      role, 
      customerType,
      hasBookings,
      limit = 50, 
      offset = 0 
    } = params;
    
    const conditions = [];
    
    // Search across multiple fields
    if (search) {
      const searchTerm = `%${search}%`;
      conditions.push(
        or(
          ilike(users.email, searchTerm),
          ilike(users.name, searchTerm),
          ilike(users.phone, searchTerm),
          ilike(users.companyName, searchTerm),
          ilike(users.city, searchTerm),
          ilike(users.postcode, searchTerm)
        )
      );
    }
    
    // Filter by role
    if (role) {
      conditions.push(eq(users.role, role));
    }
    
    // Filter by customer type
    if (customerType) {
      conditions.push(eq(users.customerType, customerType));
    }
    
    // Filter by booking status
    if (hasBookings !== undefined) {
      if (hasBookings) {
        conditions.push(sql`${users.totalBookings} > 0`);
      } else {
        conditions.push(sql`${users.totalBookings} = 0`);
      }
    }
    
    const whereClause = conditions.length > 0 ? and(...conditions) : undefined;
    
    const results = await db
      .select()
      .from(users)
      .where(whereClause)
      .orderBy(
        desc(users.lastActivityDate),
        desc(users.totalBookings),
        desc(users.totalSpent)
      )
      .limit(limit)
      .offset(offset);
    
    return results;
  }
  
  /**
   * Get user with full details including recent bookings
   */
  async getUserWithDetails(userId: string): Promise<any> {
    const [user] = await db
      .select()
      .from(users)
      .where(eq(users.id, userId));
    
    if (!user) return null;
    
    // Get recent bookings
    const recentBookings = await db
      .select({
        id: bookings.id,
        bookingReference: bookings.bookingReference,
        sessionId: bookings.sessionId,
        numberOfAttendees: bookings.numberOfAttendees,
        totalAmount: bookings.totalAmount,
        status: bookings.status,
        createdAt: bookings.createdAt,
      })
      .from(bookings)
      .where(eq(bookings.userId, userId))
      .orderBy(desc(bookings.createdAt))
      .limit(10);
    
    // Get payment summary
    const [paymentSummary] = await db
      .select({
        totalPaid: sql<string>`COALESCE(SUM(CASE WHEN ${payments.status} = 'succeeded' THEN ${payments.amount} ELSE 0 END), 0)`,
        totalRefunded: sql<string>`COALESCE(SUM(CASE WHEN ${payments.status} = 'refunded' THEN ${payments.amount} ELSE 0 END), 0)`,
        lastPaymentDate: sql<Date>`MAX(${payments.createdAt})`,
      })
      .from(payments)
      .innerJoin(bookings, eq(payments.bookingId, bookings.id))
      .where(eq(bookings.userId, userId));
    
    // Count upcoming bookings
    const [upcomingCount] = await db
      .select({
        count: sql<number>`COUNT(*)`,
      })
      .from(bookings)
      .where(and(
        eq(bookings.userId, userId),
        eq(bookings.status, 'confirmed'),
        sql`${bookings.createdAt} > NOW()` // This would need to be adjusted based on session dates
      ));
    
    return {
      ...user,
      recentBookings,
      paymentSummary: {
        totalPaid: Number(paymentSummary?.totalPaid || 0),
        totalRefunded: Number(paymentSummary?.totalRefunded || 0),
        lastPaymentDate: paymentSummary?.lastPaymentDate,
      },
      upcomingBookingsCount: upcomingCount?.count || 0,
    };
  }
  
  /**
   * Get user by email (case-insensitive)
   */
  async findByEmail(email: string): Promise<User | null> {
    const [user] = await db
      .select()
      .from(users)
      .where(eq(users.email, email.toLowerCase().trim()));
    
    return user || null;
  }
  
  /**
   * Get user by ID
   */
  async findById(userId: string): Promise<User | null> {
    const [user] = await db
      .select()
      .from(users)
      .where(eq(users.id, userId));
    
    return user || null;
  }
  
  /**
   * Recalculate user statistics (for maintenance/correction)
   */
  async recalculateUserStats(userId: string): Promise<void> {
    const [stats] = await db
      .select({
        totalBookings: sql<number>`COUNT(*)`,
        totalSpent: sql<string>`COALESCE(SUM(${bookings.totalAmount}), 0)`,
        firstBooking: sql<Date>`MIN(${bookings.createdAt})`,
        lastBooking: sql<Date>`MAX(${bookings.createdAt})`,
      })
      .from(bookings)
      .where(and(
        eq(bookings.userId, userId),
        sql`${bookings.status} IN ('confirmed', 'completed', 'attended')`
      ));
    
    if (stats) {
      await db
        .update(users)
        .set({
          totalBookings: stats.totalBookings || 0,
          totalSpent: stats.totalSpent || '0',
          firstBookingDate: stats.firstBooking,
          lastBookingDate: stats.lastBooking,
          updatedAt: new Date(),
        })
        .where(eq(users.id, userId));
    }
  }
  
  /**
   * Batch update last activity for multiple users
   */
  async updateLastActivity(userIds: string[]): Promise<void> {
    if (userIds.length === 0) return;
    
    await db
      .update(users)
      .set({
        lastActivityDate: new Date(),
        updatedAt: new Date(),
      })
      .where(sql`${users.id} = ANY(${userIds})`);
  }
}

// Export singleton instance
export const userManagementService = new UserManagementService();