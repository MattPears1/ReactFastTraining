import {injectable, BindingScope} from '@loopback/core';
import {repository} from '@loopback/repository';
import {
  BookingRepository,
  CourseSessionRepository,
  CourseRepository,
  CertificateRepository,
} from '../repositories';
import {Booking, BookingStatus, Certificate, CertificateStatus} from '../models';
import {EmailService} from './email.service';
import {HttpErrors} from '@loopback/rest';

export interface CreateBookingData {
  sessionId: string;
  type: string;
  contactDetails: any;
  participants: any[];
  paymentMethod?: string;
  invoiceDetails?: any;
  specialRequirements?: string;
  confirmedTermsAndConditions: boolean;
}

@injectable({scope: BindingScope.TRANSIENT})
export class BookingService {
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

  async createBooking(data: CreateBookingData): Promise<Booking> {
    // Validate session availability
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
    
    // Validate participant ages
    const course = await session.course;
    for (const participant of data.participants) {
      const age = this.calculateAge(new Date(participant.dateOfBirth));
      if (age < course.minimumAge) {
        throw new HttpErrors.BadRequest(
          `Participant ${participant.firstName} ${participant.lastName} does not meet minimum age requirement of ${course.minimumAge}`
        );
      }
    }
    
    // Calculate pricing with group discount
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
    
    // Generate booking reference
    const bookingReference = await this.bookingRepository.generateBookingReference();
    
    // Create booking
    const booking = await this.bookingRepository.create({
      bookingReference,
      sessionId: data.sessionId,
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
      specialRequirements: data.specialRequirements,
      confirmedTermsAndConditions: data.confirmedTermsAndConditions,
    });
    
    // Update session participant count
    await this.courseSessionRepository.updateParticipantCount(data.sessionId);
    await this.courseSessionRepository.checkSessionStatus(data.sessionId);
    
    // Send confirmation email
    try {
      await this.emailService.sendBookingConfirmation(booking, session);
    } catch (error) {
      console.error('Failed to send confirmation email:', error);
    }
    
    return booking;
  }

  async confirmBooking(bookingId: string, paymentReference?: string): Promise<Booking> {
    const booking = await this.bookingRepository.findById(bookingId);
    
    if (booking.status !== BookingStatus.PENDING) {
      throw new HttpErrors.BadRequest('Booking is not in pending status');
    }
    
    await this.bookingRepository.updateById(bookingId, {
      status: BookingStatus.CONFIRMED,
      paymentDate: new Date(),
      paymentReference,
    });
    
    return this.bookingRepository.findById(bookingId);
  }

  async markAsPaid(bookingId: string, paymentReference: string): Promise<Booking> {
    const booking = await this.bookingRepository.findById(bookingId);
    
    if (booking.status === BookingStatus.PAID) {
      throw new HttpErrors.BadRequest('Booking is already paid');
    }
    
    await this.bookingRepository.updateById(bookingId, {
      status: BookingStatus.PAID,
      paymentDate: new Date(),
      paymentReference,
    });
    
    return this.bookingRepository.findById(bookingId);
  }

  async cancelBooking(bookingId: string, reason?: string): Promise<Booking> {
    const booking = await this.bookingRepository.findById(bookingId, {
      include: ['session'],
    });
    
    if (booking.status === BookingStatus.COMPLETED) {
      throw new HttpErrors.BadRequest('Cannot cancel completed booking');
    }
    
    // Check cancellation policy (e.g., 48 hours before start)
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

  async completeBooking(bookingId: string): Promise<void> {
    const booking = await this.bookingRepository.findById(bookingId, {
      include: ['session'],
    });
    
    if (booking.status !== BookingStatus.ATTENDED) {
      throw new HttpErrors.BadRequest('Booking must be marked as attended first');
    }
    
    const session = await booking.session;
    const course = await this.courseRepository.findById(session.courseId);
    const trainer = await this.courseSessionRepository.trainer(session.id);
    
    // Create certificates for all participants
    for (const participant of booking.participants) {
      const certificateNumber = await this.certificateRepository.generateCertificateNumber(course.type);
      
      const certificate = await this.certificateRepository.create({
        certificateNumber,
        bookingId: booking.id,
        courseId: course.id,
        participantDetails: {
          firstName: participant.firstName,
          lastName: participant.lastName,
          dateOfBirth: participant.dateOfBirth,
        },
        courseName: course.name,
        completionDate: session.endDate,
        issueDate: new Date(),
        expiryDate: this.calculateExpiryDate(new Date(), course.certificateValidityYears),
        certificationBody: course.certificationBody,
        trainerName: `${trainer.firstName} ${trainer.lastName}`,
        status: CertificateStatus.PENDING,
      });
      
      // Generate and send certificate
      try {
        await this.generateAndSendCertificate(certificate, participant.email);
      } catch (error) {
        console.error('Failed to generate certificate:', error);
      }
    }
    
    // Update booking status
    await this.bookingRepository.updateById(bookingId, {
      status: BookingStatus.COMPLETED,
    });
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

  private calculateExpiryDate(issueDate: Date, validityYears: number): Date {
    const expiryDate = new Date(issueDate);
    expiryDate.setFullYear(expiryDate.getFullYear() + validityYears);
    return expiryDate;
  }

  private async generateAndSendCertificate(certificate: Certificate, recipientEmail: string): Promise<void> {
    // TODO: Implement PDF generation
    // For now, just update status and send email
    await this.certificateRepository.updateById(certificate.id, {
      status: CertificateStatus.ISSUED,
      verificationUrl: `https://reactfasttraining.co.uk/verify/${certificate.certificateNumber}`,
    });
    
    await this.emailService.sendCertificate(certificate, recipientEmail);
  }
}