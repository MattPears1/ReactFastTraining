import {inject, Getter} from '@loopback/core';
import {DefaultCrudRepository, repository, BelongsToAccessor} from '@loopback/repository';
import {PostgresDataSource} from '../datasources';
import {Attendance, AttendanceRelations, Booking, CourseSession} from '../models';
import {BookingRepository} from './booking.repository';
import {CourseSessionRepository} from './course-session.repository';

export class AttendanceRepository extends DefaultCrudRepository<
  Attendance,
  typeof Attendance.prototype.id,
  AttendanceRelations
> {
  public readonly booking: BelongsToAccessor<Booking, typeof Attendance.prototype.id>;
  public readonly session: BelongsToAccessor<CourseSession, typeof Attendance.prototype.id>;

  constructor(
    @inject('datasources.postgres') dataSource: PostgresDataSource,
    @repository.getter('BookingRepository')
    protected bookingRepositoryGetter: Getter<BookingRepository>,
    @repository.getter('CourseSessionRepository')
    protected courseSessionRepositoryGetter: Getter<CourseSessionRepository>,
  ) {
    super(Attendance, dataSource);
    
    this.booking = this.createBelongsToAccessorFor('booking', bookingRepositoryGetter);
    this.session = this.createBelongsToAccessorFor('session', courseSessionRepositoryGetter);
    
    this.registerInclusionResolver('booking', this.booking.inclusionResolver);
    this.registerInclusionResolver('session', this.session.inclusionResolver);
  }
}