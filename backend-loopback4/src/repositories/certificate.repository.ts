import {inject, Getter} from '@loopback/core';
import {DefaultCrudRepository, repository, BelongsToAccessor} from '@loopback/repository';
import {PostgresDataSource} from '../datasources';
import {Certificate, CertificateRelations, Booking, Course, CertificateStatus} from '../models';
import {BookingRepository} from './booking.repository';
import {CourseRepository} from './course.repository';

export class CertificateRepository extends DefaultCrudRepository<
  Certificate,
  typeof Certificate.prototype.id,
  CertificateRelations
> {
  public readonly booking: BelongsToAccessor<Booking, typeof Certificate.prototype.id>;
  public readonly course: BelongsToAccessor<Course, typeof Certificate.prototype.id>;

  constructor(
    @inject('datasources.postgres') dataSource: PostgresDataSource,
    @repository.getter('BookingRepository')
    protected bookingRepositoryGetter: Getter<BookingRepository>,
    @repository.getter('CourseRepository')
    protected courseRepositoryGetter: Getter<CourseRepository>,
  ) {
    super(Certificate, dataSource);
    this.booking = this.createBelongsToAccessorFor('booking', bookingRepositoryGetter);
    this.course = this.createBelongsToAccessorFor('course', courseRepositoryGetter);
    
    this.registerInclusionResolver('booking', this.booking.inclusionResolver);
    this.registerInclusionResolver('course', this.course.inclusionResolver);
  }

  async generateCertificateNumber(courseType: string): Promise<string> {
    const date = new Date();
    const year = date.getFullYear();
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const typePrefix = courseType.slice(0, 3).toUpperCase();
    const random = Math.floor(Math.random() * 100000).toString().padStart(5, '0');
    return `RFT-${typePrefix}-${year}${month}-${random}`;
  }

  async findByCertificateNumber(certificateNumber: string): Promise<Certificate | null> {
    const certificates = await this.find({
      where: {certificateNumber},
      limit: 1,
      include: ['booking', 'course'],
    });
    return certificates[0] || null;
  }

  async findByParticipant(firstName: string, lastName: string): Promise<Certificate[]> {
    return this.find({
      where: {
        and: [
          {'participantDetails.firstName': firstName},
          {'participantDetails.lastName': lastName},
        ],
      },
      order: ['issueDate DESC'],
    });
  }

  async findExpiringCertificates(daysAhead: number = 90): Promise<Certificate[]> {
    const expiryDate = new Date();
    expiryDate.setDate(expiryDate.getDate() + daysAhead);
    
    return this.find({
      where: {
        status: CertificateStatus.ISSUED,
        expiryDate: {
          gte: new Date(),
          lte: expiryDate,
        },
      },
      include: ['booking'],
    });
  }

  async checkAndUpdateExpiredCertificates(): Promise<void> {
    const expiredCerts = await this.find({
      where: {
        status: CertificateStatus.ISSUED,
        expiryDate: {lt: new Date()},
      },
    });
    
    for (const cert of expiredCerts) {
      await this.updateById(cert.id, {
        status: CertificateStatus.EXPIRED,
      });
    }
  }
}