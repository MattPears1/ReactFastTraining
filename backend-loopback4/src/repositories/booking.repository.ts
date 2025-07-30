import {inject, Getter} from '@loopback/core';
import {DefaultCrudRepository, repository, BelongsToAccessor, HasManyRepositoryFactory} from '@loopback/repository';
import {PostgresDataSource} from '../datasources';
import {Booking, BookingRelations, CourseSession, Certificate, BookingStatus} from '../models';
import {CourseSessionRepository} from './course-session.repository';
import {CertificateRepository} from './certificate.repository';

export class BookingRepository extends DefaultCrudRepository<
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

  async generateBookingReference(): Promise<string> {
    const date = new Date();
    const year = date.getFullYear().toString().slice(-2);
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
    return `RFT${year}${month}${random}`;
  }

  async findByReference(bookingReference: string): Promise<Booking | null> {
    const bookings = await this.find({
      where: {bookingReference},
      limit: 1,
      include: ['session', 'certificates'],
    });
    return bookings[0] || null;
  }

  async findByEmail(email: string): Promise<Booking[]> {
    return this.find({
      where: {
        'contactDetails.email': email,
      },
      order: ['createdAt DESC'],
      include: ['session'],
    });
  }

  async findPendingBookings(): Promise<Booking[]> {
    const cutoffDate = new Date();
    cutoffDate.setHours(cutoffDate.getHours() - 24);
    
    return this.find({
      where: {
        status: BookingStatus.PENDING,
        createdAt: {lt: cutoffDate},
      },
    });
  }

  async findUpcomingBookingsForReminder(): Promise<Booking[]> {
    const reminderDate = new Date();
    reminderDate.setDate(reminderDate.getDate() + 2); // 2 days before
    
    return this.find({
      where: {
        status: {inq: [BookingStatus.CONFIRMED, BookingStatus.PAID]},
        reminderSentAt: null,
      },
      include: [{
        relation: 'session',
        scope: {
          where: {
            startDate: {
              gte: new Date(),
              lte: reminderDate,
            },
          },
        },
      }],
    });
  }

  async calculateTotalWithDiscount(
    sessionId: string,
    numberOfParticipants: number,
    discountPercentage: number = 0,
  ): Promise<{totalAmount: number; discountAmount: number; finalAmount: number}> {
    const session = await this.courseSessionRepositoryGetter().then(repo => 
      repo.findById(sessionId, {include: ['course']})
    );
    
    const totalAmount = session.pricePerPerson * numberOfParticipants;
    const discountAmount = totalAmount * discountPercentage;
    const finalAmount = totalAmount - discountAmount;
    
    return {totalAmount, discountAmount, finalAmount};
  }
}