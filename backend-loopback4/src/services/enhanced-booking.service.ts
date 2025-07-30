import { injectable, BindingScope } from '@loopback/core';
import { repository } from '@loopback/repository';
import { HttpErrors } from '@loopback/rest';
import { db } from '../config/database.config';
import { bookings, bookingAttendees, courseSessions, users } from '../db/schema';
import { eq, sql } from 'drizzle-orm';
import { userManagementService } from './user-management.service';
import {
  BookingRepository,
  CourseSessionRepository,
  CourseRepository,
  CertificateRepository,
} from '../repositories';
import { EmailService } from './email.service';
import { BookingStatus } from '../models';

export interface CreateBookingDataEnhanced {
  sessionId: string;
  type: string;
  contactDetails: {
    firstName: string;
    lastName: string;
    email: string;
    phone?: string;
    company?: string;
  };
  participants: Array<{
    firstName: string;
    lastName: string;
    email: string;
    dateOfBirth: Date;
    emergencyContact?: {
      name: string;
      phone: string;
      relationship: string;
    };
    medicalConditions?: string;
    dietaryRequirements?: string;
  }>;
  paymentMethod?: string;
  invoiceDetails?: any;
  specialRequirements?: string;
  confirmedTermsAndConditions: boolean;
}

@injectable({ scope: BindingScope.TRANSIENT })
export class EnhancedBookingService {
  constructor(
    @repository(BookingRepository)
    private bookingRepository: BookingRepository,
    @repository(CourseSessionRepository)
    private courseSessionRepository: CourseSessionRepository,
    @repository(CourseRepository)
    private courseRepository: CourseRepository,
    @repository(CertificateRepository)
    private certificateRepository: CertificateRepository,
    private emailService: EmailService,
  ) {}

  /**
   * Create a booking with automatic user management
   */
  async createBookingWithUser(data: CreateBookingDataEnhanced): Promise<any> {
    // Start a transaction
    return db.transaction(async (tx) => {
      // Step 1: Find or create user from contact details
      const user = await userManagementService.findOrCreateCustomer({
        email: data.contactDetails.email,
        name: `${data.contactDetails.firstName} ${data.contactDetails.lastName}`,
        phone: data.contactDetails.phone,
        company: data.contactDetails.company,
      });

      console.log(`Creating booking for user: ${user.email} (${user.id})`);

      // Step 2: Validate session (using existing repository for now)
      const session = await this.courseSessionRepository.findById(data.sessionId, {
        include: ['course'],
      });
      
      if (!session) {
        throw new HttpErrors.NotFound('Session not found');
      }
      
      const availableSpots = session.maxParticipants - session.currentParticipants;
      if (data.participants.length > availableSpots) {
        throw new HttpErrors.BadRequest(
          `Only ${availableSpots} spots available for this session`
        );
      }

      // Step 3: Validate participants and calculate pricing
      const course = await session.course;
      for (const participant of data.participants) {
        const age = this.calculateAge(new Date(participant.dateOfBirth));
        if (age < course.minimumAge) {
          throw new HttpErrors.BadRequest(
            `Participant ${participant.firstName} ${participant.lastName} does not meet minimum age requirement of ${course.minimumAge}`
          );
        }
      }

      // Calculate pricing
      const numberOfParticipants = data.participants.length;
      const discountPercentage = await this.courseRepository.calculateGroupDiscount(
        course.id,
        numberOfParticipants
      );
      
      const pricing = await this.bookingRepository.calculateTotalWithDiscount(
        data.sessionId,
        numberOfParticipants,
        discountPercentage
      );

      // Step 4: Generate booking reference
      const bookingReference = await this.generateBookingReference();

      // Step 5: Create booking using Drizzle with userId
      const [newBooking] = await tx
        .insert(bookings)
        .values({
          bookingReference,
          userId: user.id, // Link to user!
          sessionId: data.sessionId,
          numberOfAttendees: numberOfParticipants,
          totalAmount: pricing.finalAmount.toString(),
          specialRequirements: data.specialRequirements,
          termsAccepted: data.confirmedTermsAndConditions,
          termsAcceptedAt: data.confirmedTermsAndConditions ? new Date() : null,
          status: 'pending',
          createdAt: new Date(),
          updatedAt: new Date(),
        })
        .returning();

      // Step 6: Create attendee records
      const attendeeRecords = [];
      for (const participant of data.participants) {
        const [attendee] = await tx
          .insert(bookingAttendees)
          .values({
            bookingId: newBooking.id,
            name: `${participant.firstName} ${participant.lastName}`,
            email: participant.email,
            isPrimary: participant.email === data.contactDetails.email,
          })
          .returning();
        attendeeRecords.push(attendee);
      }

      // Step 7: Update session participant count
      await this.courseSessionRepository.updateParticipantCount(data.sessionId);
      await this.courseSessionRepository.checkSessionStatus(data.sessionId);

      // Step 8: Store additional contact details in booking (for backward compatibility)
      // We'll create the traditional booking record too
      const traditionalBooking = await this.bookingRepository.create({
        ...newBooking,
        type: data.type,
        contactDetails: data.contactDetails,
        participants: data.participants,
        numberOfParticipants,
        totalAmount: pricing.totalAmount,
        discountAmount: pricing.discountAmount,
        discountReason: discountPercentage > 0 ? `Group discount (${numberOfParticipants} participants)` : undefined,
        finalAmount: pricing.finalAmount,
        status: BookingStatus.PENDING,
        paymentMethod: data.paymentMethod,
        invoiceDetails: data.invoiceDetails,
      });

      // Step 9: Send confirmation email
      try {
        await this.emailService.sendBookingConfirmation(traditionalBooking, session);
      } catch (error) {
        console.error('Failed to send confirmation email:', error);
      }

      // Return enhanced booking with user info
      return {
        ...traditionalBooking,
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          phone: user.phone,
          companyName: user.companyName,
          totalBookings: user.totalBookings,
          totalSpent: user.totalSpent,
        },
        attendees: attendeeRecords,
      };
    });
  }

  /**
   * Confirm booking and update user statistics
   */
  async confirmBookingWithUser(bookingId: string, paymentReference?: string): Promise<any> {
    const booking = await this.bookingRepository.findById(bookingId);
    
    if (booking.status !== BookingStatus.PENDING) {
      throw new HttpErrors.BadRequest('Booking is not in pending status');
    }

    // Get the booking from our database to find userId
    const [dbBooking] = await db
      .select()
      .from(bookings)
      .where(eq(bookings.bookingReference, booking.bookingReference));

    if (dbBooking && dbBooking.userId) {
      // Update user statistics after successful payment
      await userManagementService.updateBookingStats(
        dbBooking.userId,
        Number(booking.finalAmount)
      );
    }

    // Update booking status
    await this.bookingRepository.updateById(bookingId, {
      status: BookingStatus.CONFIRMED,
      paymentDate: new Date(),
      paymentReference,
    });

    return this.bookingRepository.findById(bookingId);
  }

  /**
   * Cancel booking and update user statistics
   */
  async cancelBookingWithUser(bookingId: string, reason?: string): Promise<any> {
    const booking = await this.bookingRepository.findById(bookingId, {
      include: ['session'],
    });
    
    if (booking.status === BookingStatus.COMPLETED) {
      throw new HttpErrors.BadRequest('Cannot cancel completed booking');
    }

    // Get the booking from our database to find userId
    const [dbBooking] = await db
      .select()
      .from(bookings)
      .where(eq(bookings.bookingReference, booking.bookingReference));

    if (dbBooking && dbBooking.userId && booking.status === BookingStatus.PAID) {
      // Update user statistics for refund
      await userManagementService.updateRefundStats(
        dbBooking.userId,
        Number(booking.finalAmount)
      );
    }

    // Check cancellation policy
    const session = await booking.session;
    const hoursUntilStart = (new Date(session.startDate).getTime() - Date.now()) / (1000 * 60 * 60);
    
    if (hoursUntilStart < 48 && booking.status === BookingStatus.PAID) {
      throw new HttpErrors.BadRequest('Cannot cancel within 48 hours of course start');
    }

    await this.bookingRepository.updateById(bookingId, {
      status: BookingStatus.CANCELLED,
    });

    // Update session participant count
    await this.courseSessionRepository.updateParticipantCount(booking.sessionId);

    return this.bookingRepository.findById(bookingId);
  }

  /**
   * Generate a unique booking reference
   */
  private async generateBookingReference(): Promise<string> {
    const prefix = 'RFT';
    const date = new Date();
    const year = date.getFullYear().toString().slice(-2);
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    
    let isUnique = false;
    let reference = '';
    
    while (!isUnique) {
      const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
      reference = `${prefix}${year}${month}${random}`;
      
      const existing = await db
        .select()
        .from(bookings)
        .where(eq(bookings.bookingReference, reference));
      
      isUnique = existing.length === 0;
    }
    
    return reference;
  }

  private calculateAge(dateOfBirth: Date): number {
    const today = new Date();
    const birthDate = new Date(dateOfBirth);
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    
    return age;
  }
}

// Export singleton instance for convenience
export const enhancedBookingService = new EnhancedBookingService(
  null as any, // Will be injected by LoopBack
  null as any,
  null as any,
  null as any,
  null as any
);