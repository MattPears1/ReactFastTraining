import {inject, Getter} from '@loopback/core';
import {repository, BelongsToAccessor, HasManyRepositoryFactory, juggler} from '@loopback/repository';
import {PostgresDataSource} from '../../datasources';
import {Booking, BookingRelations, CourseSession, Certificate, BookingStatus} from '../../models';
import {CourseSessionRepository} from '../course-session.repository';
import {CertificateRepository} from '../certificate.repository';
import {BaseEnhancedRepository} from './base-enhanced.repository';
import {HttpErrors} from '@loopback/rest';

export interface BookingStatistics {
  totalRevenue: number;
  totalBookings: number;
  averageBookingValue: number;
  mostPopularCourse: {
    courseId: string;
    courseName: string;
    bookingCount: number;
  };
  bookingsByStatus: Record<string, number>;
  attendanceRate: number;
}

export interface SessionAvailability {
  sessionId: string;
  totalCapacity: number;
  bookedCount: number;
  availableSpots: number;
  isAvailable: boolean;
}

export class BookingEnhancedRepository extends BaseEnhancedRepository<
  Booking,
  typeof Booking.prototype.id,
  BookingRelations
> {
  public readonly session: BelongsToAccessor<CourseSession, typeof Booking.prototype.id>;
  public readonly certificates: HasManyRepositoryFactory<Certificate, typeof Booking.prototype.id>;

  constructor(
    @inject('datasources.postgres') dataSource: PostgresDataSource,
    @repository.getter('CourseSessionRepository')
    protected courseSessionRepositoryGetter: Getter<CourseSessionRepository>,
    @repository.getter('CertificateRepository')
    protected certificateRepositoryGetter: Getter<CertificateRepository>,
  ) {
    super(Booking, dataSource);
    this.session = this.createBelongsToAccessorFor('session', courseSessionRepositoryGetter);
    this.certificates = this.createHasManyRepositoryFactoryFor('certificates', certificateRepositoryGetter);
    
    this.registerInclusionResolver('session', this.session.inclusionResolver);
    this.registerInclusionResolver('certificates', this.certificates.inclusionResolver);
  }

  async generateUniqueBookingReference(): Promise<string> {
    let reference: string;
    let exists = true;
    let attempts = 0;
    const maxAttempts = 10;

    while (exists && attempts < maxAttempts) {
      const date = new Date();
      const year = date.getFullYear().toString().slice(-2);
      const month = (date.getMonth() + 1).toString().padStart(2, '0');
      const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
      reference = `RFT${year}${month}${random}`;
      
      exists = await this.exists({bookingReference: reference});
      attempts++;
    }

    if (exists) {
      throw new HttpErrors.InternalServerError('Failed to generate unique booking reference');
    }

    return reference!;
  }

  async checkSessionAvailability(
    sessionId: string,
    requestedSpots: number
  ): Promise<SessionAvailability> {
    const session = await this.courseSessionRepositoryGetter().then(repo =>
      repo.findById(sessionId)
    );

    const confirmedBookings = await this.find({
      where: {
        sessionId,
        status: {inq: [BookingStatus.CONFIRMED, BookingStatus.PAID]},
      },
    });

    const bookedCount = confirmedBookings.reduce(
      (total, booking) => total + booking.numberOfParticipants,
      0
    );

    const availableSpots = session.maxParticipants - bookedCount;
    const isAvailable = availableSpots >= requestedSpots;

    return {
      sessionId,
      totalCapacity: session.maxParticipants,
      bookedCount,
      availableSpots,
      isAvailable,
    };
  }

  async createBookingWithLock(
    bookingData: Partial<Booking>,
    sessionId: string
  ): Promise<Booking> {
    return this.transaction(async (tx) => {
      // Lock the session row to prevent concurrent bookings
      const lockQuery = `
        SELECT * FROM course_sessions 
        WHERE id = $1 
        FOR UPDATE
      `;
      await this.executeRawQuery(lockQuery, [sessionId]);

      // Check availability within transaction
      const availability = await this.checkSessionAvailability(
        sessionId,
        bookingData.numberOfParticipants || 1
      );

      if (!availability.isAvailable) {
        throw new HttpErrors.BadRequest(
          `Not enough spots available. Only ${availability.availableSpots} spots remaining.`
        );
      }

      // Create the booking
      const booking = await this.create(bookingData);
      return booking;
    });
  }

  async getBookingStatistics(
    startDate?: Date,
    endDate?: Date
  ): Promise<BookingStatistics> {
    let dateFilter = '';
    const params: any[] = [];

    if (startDate && endDate) {
      dateFilter = 'AND b.created_at BETWEEN $1 AND $2';
      params.push(startDate, endDate);
    }

    const statsQuery = `
      SELECT 
        COUNT(DISTINCT b.id) as total_bookings,
        COALESCE(SUM(b.total_amount), 0) as total_revenue,
        COALESCE(AVG(b.total_amount), 0) as average_booking_value,
        COUNT(DISTINCT CASE WHEN b.status = 'confirmed' THEN b.id END) as confirmed_count,
        COUNT(DISTINCT CASE WHEN b.status = 'paid' THEN b.id END) as paid_count,
        COUNT(DISTINCT CASE WHEN b.status = 'cancelled' THEN b.id END) as cancelled_count,
        COUNT(DISTINCT CASE WHEN b.status = 'pending' THEN b.id END) as pending_count,
        COUNT(DISTINCT CASE WHEN a.attended = true THEN a.id END) * 100.0 / 
          NULLIF(COUNT(DISTINCT a.id), 0) as attendance_rate
      FROM bookings b
      LEFT JOIN attendances a ON b.id = a.booking_id
      WHERE 1=1 ${dateFilter}
    `;

    const popularCourseQuery = `
      SELECT 
        c.id as course_id,
        c.name as course_name,
        COUNT(DISTINCT b.id) as booking_count
      FROM bookings b
      JOIN course_sessions cs ON b.session_id = cs.id
      JOIN courses c ON cs.course_id = c.id
      WHERE b.status IN ('confirmed', 'paid') ${dateFilter}
      GROUP BY c.id, c.name
      ORDER BY booking_count DESC
      LIMIT 1
    `;

    const [stats] = await this.executeRawQuery<any>(statsQuery, params);
    const [popularCourse] = await this.executeRawQuery<any>(popularCourseQuery, params);

    return {
      totalRevenue: parseFloat(stats.total_revenue) || 0,
      totalBookings: parseInt(stats.total_bookings) || 0,
      averageBookingValue: parseFloat(stats.average_booking_value) || 0,
      mostPopularCourse: popularCourse || {
        courseId: '',
        courseName: 'N/A',
        bookingCount: 0,
      },
      bookingsByStatus: {
        confirmed: parseInt(stats.confirmed_count) || 0,
        paid: parseInt(stats.paid_count) || 0,
        cancelled: parseInt(stats.cancelled_count) || 0,
        pending: parseInt(stats.pending_count) || 0,
      },
      attendanceRate: parseFloat(stats.attendance_rate) || 0,
    };
  }

  async getUpcomingBookingsWithReminders(): Promise<Booking[]> {
    const query = `
      SELECT b.* 
      FROM bookings b
      JOIN course_sessions cs ON b.session_id = cs.id
      WHERE b.status IN ('confirmed', 'paid')
      AND cs.start_date > NOW()
      AND cs.start_date <= NOW() + INTERVAL '48 hours'
      AND (b.reminder_sent_at IS NULL OR b.reminder_sent_at < NOW() - INTERVAL '24 hours')
      ORDER BY cs.start_date
    `;

    const bookings = await this.executeRawQuery<Booking>(query);
    return bookings;
  }

  async bulkUpdateReminderStatus(bookingIds: string[]): Promise<void> {
    if (bookingIds.length === 0) return;

    const placeholders = bookingIds.map((_, i) => `$${i + 1}`).join(',');
    const query = `
      UPDATE bookings 
      SET reminder_sent_at = NOW(), updated_at = NOW()
      WHERE id IN (${placeholders})
    `;

    await this.executeRawQuery(query, bookingIds);
  }

  async getBookingsByDateRange(
    startDate: Date,
    endDate: Date,
    options?: {
      status?: BookingStatus[];
      courseId?: string;
      includeCancelled?: boolean;
    }
  ): Promise<Booking[]> {
    const whereClause: any = {
      createdAt: {
        between: [startDate, endDate],
      },
    };

    if (options?.status && options.status.length > 0) {
      whereClause.status = {inq: options.status};
    }

    if (!options?.includeCancelled) {
      whereClause.status = whereClause.status || {};
      whereClause.status.nin = [BookingStatus.CANCELLED];
    }

    const filter: any = {
      where: whereClause,
      include: [
        {
          relation: 'session',
          scope: {
            include: ['course'],
            where: options?.courseId ? {courseId: options.courseId} : undefined,
          },
        },
      ],
      order: ['createdAt DESC'],
    };

    return this.find(filter);
  }

  async cleanupExpiredPendingBookings(): Promise<number> {
    const expirationTime = new Date();
    expirationTime.setHours(expirationTime.getHours() - 24); // 24 hour expiration

    const expiredBookings = await this.find({
      where: {
        status: BookingStatus.PENDING,
        createdAt: {lt: expirationTime},
      },
    });

    let cleanedCount = 0;
    for (const booking of expiredBookings) {
      await this.updateById(booking.id, {
        status: BookingStatus.EXPIRED,
        updatedAt: new Date(),
      });
      cleanedCount++;
    }

    return cleanedCount;
  }

  async getAttendeeList(sessionId: string): Promise<any[]> {
    const query = `
      SELECT 
        b.booking_reference,
        b.contact_details->>'name' as primary_contact,
        b.contact_details->>'email' as primary_email,
        b.contact_details->>'phone' as primary_phone,
        b.number_of_participants,
        b.additional_attendees,
        b.special_requirements,
        b.status,
        b.created_at
      FROM bookings b
      WHERE b.session_id = $1
      AND b.status IN ('confirmed', 'paid')
      ORDER BY b.created_at
    `;

    const attendees = await this.executeRawQuery(query, [sessionId]);
    
    // Flatten additional attendees
    const flattenedAttendees: any[] = [];
    
    attendees.forEach((booking: any) => {
      // Add primary contact
      flattenedAttendees.push({
        bookingReference: booking.booking_reference,
        name: booking.primary_contact,
        email: booking.primary_email,
        phone: booking.primary_phone,
        isPrimaryContact: true,
        specialRequirements: booking.special_requirements,
      });

      // Add additional attendees if any
      if (booking.additional_attendees && Array.isArray(booking.additional_attendees)) {
        booking.additional_attendees.forEach((attendee: any) => {
          flattenedAttendees.push({
            bookingReference: booking.booking_reference,
            name: attendee.name,
            email: attendee.email || booking.primary_email,
            phone: attendee.phone || booking.primary_phone,
            isPrimaryContact: false,
            specialRequirements: attendee.specialRequirements || booking.special_requirements,
          });
        });
      }
    });

    return flattenedAttendees;
  }
}