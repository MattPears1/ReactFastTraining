import {
  get,
  param,
  put,
  post,
  requestBody,
  HttpErrors,
  RestBindings,
  Request,
  Response,
} from '@loopback/rest';
import { authenticate } from '@loopback/authentication';
import { authorize } from '@loopback/authorization';
import { inject } from '@loopback/core';
import { userManagementService } from '../../services/user-management.service';
import { db } from '../../config/database.config';
import { users, bookings, payments, invoices, courseSessions, courses } from '../../db/schema';
import { eq, desc, sql, and } from 'drizzle-orm';

interface UpdateUserRequest {
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

interface UserNoteRequest {
  noteType: string;
  noteContent: string;
  isInternal?: boolean;
}

export class AdminUsersController {
  constructor() {}

  /**
   * List users with search and filters
   */
  @get('/api/admin/users')
  @authenticate('jwt')
  @authorize({ allowedRoles: ['admin'] })
  async listUsers(
    @param.query.string('search') search?: string,
    @param.query.string('role') role?: string,
    @param.query.string('customerType') customerType?: string,
    @param.query.boolean('hasBookings') hasBookings?: boolean,
    @param.query.number('limit') limit = 50,
    @param.query.number('offset') offset = 0,
  ) {
    try {
      const results = await userManagementService.searchUsers({
        search,
        role,
        customerType,
        hasBookings,
        limit,
        offset,
      });

      // Get total count for pagination
      const countResult = await userManagementService.searchUsers({
        search,
        role,
        customerType,
        hasBookings,
        limit: 10000, // High limit to get all results for count
        offset: 0,
      });

      return {
        data: results,
        total: countResult.length,
        limit,
        offset,
      };
    } catch (error) {
      console.error('Error listing users:', error);
      throw new HttpErrors.InternalServerError('Failed to retrieve users');
    }
  }

  /**
   * Get detailed user information
   */
  @get('/api/admin/users/{id}')
  @authenticate('jwt')
  @authorize({ allowedRoles: ['admin'] })
  async getUserDetails(@param.path.string('id') id: string) {
    try {
      const userDetails = await userManagementService.getUserWithDetails(id);
      
      if (!userDetails) {
        throw new HttpErrors.NotFound('User not found');
      }
      
      return userDetails;
    } catch (error) {
      if (error instanceof HttpErrors.HttpError) throw error;
      console.error('Error getting user details:', error);
      throw new HttpErrors.InternalServerError('Failed to retrieve user details');
    }
  }

  /**
   * Update user information
   */
  @put('/api/admin/users/{id}')
  @authenticate('jwt')
  @authorize({ allowedRoles: ['admin'] })
  async updateUser(
    @param.path.string('id') id: string,
    @requestBody() userData: UpdateUserRequest
  ) {
    try {
      const updated = await userManagementService.updateCustomerProfile(id, userData);
      
      if (!updated) {
        throw new HttpErrors.NotFound('User not found or not a customer');
      }
      
      return {
        success: true,
        user: updated,
      };
    } catch (error) {
      if (error instanceof HttpErrors.HttpError) throw error;
      console.error('Error updating user:', error);
      throw new HttpErrors.InternalServerError('Failed to update user');
    }
  }

  /**
   * Get user's booking history
   */
  @get('/api/admin/users/{id}/bookings')
  @authenticate('jwt')
  @authorize({ allowedRoles: ['admin'] })
  async getUserBookings(
    @param.path.string('id') userId: string,
    @param.query.number('limit') limit = 20,
    @param.query.number('offset') offset = 0,
  ) {
    try {
      // Verify user exists
      const user = await userManagementService.findById(userId);
      if (!user) {
        throw new HttpErrors.NotFound('User not found');
      }

      // Get bookings with session details
      const userBookings = await db
        .select({
          booking: bookings,
          session: courseSessions,
          // We'll need to join with courses too for course name
        })
        .from(bookings)
        .innerJoin(courseSessions, eq(bookings.sessionId, courseSessions.id))
        .where(eq(bookings.userId, userId))
        .orderBy(desc(bookings.createdAt))
        .limit(limit)
        .offset(offset);

      // Get total count
      const [countResult] = await db
        .select({ count: sql<number>`COUNT(*)` })
        .from(bookings)
        .where(eq(bookings.userId, userId));

      return {
        data: userBookings,
        total: countResult?.count || 0,
        limit,
        offset,
      };
    } catch (error) {
      if (error instanceof HttpErrors.HttpError) throw error;
      console.error('Error getting user bookings:', error);
      throw new HttpErrors.InternalServerError('Failed to retrieve user bookings');
    }
  }

  /**
   * Get user's payment history
   */
  @get('/api/admin/users/{id}/payments')
  @authenticate('jwt')
  @authorize({ allowedRoles: ['admin'] })
  async getUserPayments(
    @param.path.string('id') userId: string,
    @param.query.number('limit') limit = 20,
    @param.query.number('offset') offset = 0,
  ) {
    try {
      // Verify user exists
      const user = await userManagementService.findById(userId);
      if (!user) {
        throw new HttpErrors.NotFound('User not found');
      }

      // Get payments through bookings
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

      // Get total count
      const [countResult] = await db
        .select({ count: sql<number>`COUNT(*)` })
        .from(payments)
        .innerJoin(bookings, eq(payments.bookingId, bookings.id))
        .where(eq(bookings.userId, userId));

      return {
        data: userPayments,
        total: countResult?.count || 0,
        limit,
        offset,
      };
    } catch (error) {
      if (error instanceof HttpErrors.HttpError) throw error;
      console.error('Error getting user payments:', error);
      throw new HttpErrors.InternalServerError('Failed to retrieve user payments');
    }
  }

  /**
   * Get user's certificates
   */
  @get('/api/admin/users/{id}/certificates')
  @authenticate('jwt')
  @authorize({ allowedRoles: ['admin'] })
  async getUserCertificates(
    @param.path.string('id') userId: string,
    @param.query.number('limit') limit = 20,
    @param.query.number('offset') offset = 0,
  ) {
    try {
      // For now, return empty array as certificates table relationship needs to be established
      return {
        data: [],
        total: 0,
        limit,
        offset,
      };
    } catch (error) {
      if (error instanceof HttpErrors.HttpError) throw error;
      console.error('Error getting user certificates:', error);
      throw new HttpErrors.InternalServerError('Failed to retrieve user certificates');
    }
  }

  /**
   * Get user statistics summary
   */
  @get('/api/admin/users/{id}/stats')
  @authenticate('jwt')
  @authorize({ allowedRoles: ['admin'] })
  async getUserStats(@param.path.string('id') userId: string) {
    try {
      const user = await userManagementService.findById(userId);
      if (!user) {
        throw new HttpErrors.NotFound('User not found');
      }

      // Get additional statistics
      const [bookingStats] = await db
        .select({
          totalBookings: sql<number>`COUNT(*)`,
          confirmedBookings: sql<number>`COUNT(*) FILTER (WHERE status = 'confirmed')`,
          cancelledBookings: sql<number>`COUNT(*) FILTER (WHERE status = 'cancelled')`,
          upcomingBookings: sql<number>`COUNT(*) FILTER (WHERE status = 'confirmed' AND created_at > NOW())`,
          totalParticipants: sql<number>`COALESCE(SUM(number_of_attendees), 0)`,
        })
        .from(bookings)
        .where(eq(bookings.userId, userId));

      const [paymentStats] = await db
        .select({
          totalPaid: sql<string>`COALESCE(SUM(amount) FILTER (WHERE status = 'succeeded'), 0)`,
          totalRefunded: sql<string>`COALESCE(SUM(amount) FILTER (WHERE status = 'refunded'), 0)`,
          paymentMethods: sql<string[]>`ARRAY_AGG(DISTINCT payment_method_type)`,
        })
        .from(payments)
        .innerJoin(bookings, eq(payments.bookingId, bookings.id))
        .where(eq(bookings.userId, userId));

      return {
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
          customerSince: user.customerSince,
          lastActivityDate: user.lastActivityDate,
        },
        bookings: {
          total: user.totalBookings,
          confirmed: bookingStats?.confirmedBookings || 0,
          cancelled: bookingStats?.cancelledBookings || 0,
          upcoming: bookingStats?.upcomingBookings || 0,
          totalParticipants: Number(bookingStats?.totalParticipants || 0),
        },
        financials: {
          totalSpent: user.totalSpent,
          totalPaid: Number(paymentStats?.totalPaid || 0),
          totalRefunded: Number(paymentStats?.totalRefunded || 0),
          netRevenue: Number(user.totalSpent) - Number(paymentStats?.totalRefunded || 0),
        },
        engagement: {
          marketingConsent: user.marketingConsent,
          newsletterSubscribed: user.newsletterSubscribed,
          preferredContactMethod: user.preferredContactMethod,
          lastBookingDate: user.lastBookingDate,
        },
      };
    } catch (error) {
      if (error instanceof HttpErrors.HttpError) throw error;
      console.error('Error getting user stats:', error);
      throw new HttpErrors.InternalServerError('Failed to retrieve user statistics');
    }
  }

  /**
   * Recalculate user statistics (admin maintenance)
   */
  @post('/api/admin/users/{id}/recalculate-stats')
  @authenticate('jwt')
  @authorize({ allowedRoles: ['admin'] })
  async recalculateUserStats(@param.path.string('id') userId: string) {
    try {
      await userManagementService.recalculateUserStats(userId);
      
      const updatedUser = await userManagementService.findById(userId);
      
      return {
        success: true,
        message: 'User statistics recalculated successfully',
        user: updatedUser,
      };
    } catch (error) {
      console.error('Error recalculating user stats:', error);
      throw new HttpErrors.InternalServerError('Failed to recalculate user statistics');
    }
  }

  /**
   * Export users data
   */
  @get('/api/admin/users/export')
  @authenticate('jwt')
  @authorize({ allowedRoles: ['admin'] })
  async exportUsers(
    @param.query.string('format') format: 'csv' | 'json' = 'csv',
    @param.query.string('role') role?: string,
    @inject(RestBindings.Http.RESPONSE) response: Response,
  ) {
    try {
      const allUsers = await userManagementService.searchUsers({
        role,
        limit: 10000, // Get all users
      });

      if (format === 'json') {
        response.setHeader('Content-Type', 'application/json');
        response.setHeader('Content-Disposition', 'attachment; filename="users.json"');
        return allUsers;
      } else {
        // CSV format
        const csv = this.convertToCSV(allUsers);
        response.setHeader('Content-Type', 'text/csv');
        response.setHeader('Content-Disposition', 'attachment; filename="users.csv"');
        response.send(csv);
      }
    } catch (error) {
      console.error('Error exporting users:', error);
      throw new HttpErrors.InternalServerError('Failed to export users');
    }
  }

  /**
   * Convert users array to CSV format
   */
  private convertToCSV(users: any[]): string {
    if (users.length === 0) return '';

    // Define headers
    const headers = [
      'ID',
      'Email',
      'Name',
      'Role',
      'Phone',
      'Company',
      'City',
      'Postcode',
      'Total Bookings',
      'Total Spent',
      'Customer Since',
      'Last Activity',
      'Marketing Consent',
    ];

    // Convert to CSV rows
    const rows = users.map(user => [
      user.id,
      user.email,
      user.name,
      user.role,
      user.phone || '',
      user.companyName || '',
      user.city || '',
      user.postcode || '',
      user.totalBookings,
      user.totalSpent,
      user.customerSince || '',
      user.lastActivityDate || '',
      user.marketingConsent ? 'Yes' : 'No',
    ]);

    // Combine headers and rows
    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.map(cell => `"${cell}"`).join(',')),
    ].join('\n');

    return csvContent;
  }
}