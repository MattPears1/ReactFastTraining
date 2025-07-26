import {inject, Getter} from '@loopback/core';
import {DefaultCrudRepository, repository, BelongsToAccessor, HasManyRepositoryFactory} from '@loopback/repository';
import {PostgresDataSource} from '../datasources';
import {CourseSession, CourseSessionRelations, Course, Trainer, Location, Booking, SessionStatus} from '../models';
import {CourseRepository} from './course.repository';
import {TrainerRepository} from './trainer.repository';
import {LocationRepository} from './location.repository';
import {BookingRepository} from './booking.repository';

export class CourseSessionRepository extends DefaultCrudRepository<
  CourseSession,
  typeof CourseSession.prototype.id,
  CourseSessionRelations
> {
  public readonly course: BelongsToAccessor<Course, typeof CourseSession.prototype.id>;
  public readonly trainer: BelongsToAccessor<Trainer, typeof CourseSession.prototype.id>;
  public readonly location: BelongsToAccessor<Location, typeof CourseSession.prototype.id>;
  public readonly bookings: HasManyRepositoryFactory<Booking, typeof CourseSession.prototype.id>;

  constructor(
    @inject('datasources.postgres') dataSource: PostgresDataSource,
    @repository.getter('CourseRepository')
    protected courseRepositoryGetter: Getter<CourseRepository>,
    @repository.getter('TrainerRepository')
    protected trainerRepositoryGetter: Getter<TrainerRepository>,
    @repository.getter('LocationRepository')
    protected locationRepositoryGetter: Getter<LocationRepository>,
    @repository.getter('BookingRepository')
    protected bookingRepositoryGetter: Getter<BookingRepository>,
  ) {
    super(CourseSession, dataSource);
    this.course = this.createBelongsToAccessorFor('course', courseRepositoryGetter);
    this.trainer = this.createBelongsToAccessorFor('trainer', trainerRepositoryGetter);
    this.location = this.createBelongsToAccessorFor('location', locationRepositoryGetter);
    this.bookings = this.createHasManyRepositoryFactoryFor('bookings', bookingRepositoryGetter);
    
    this.registerInclusionResolver('course', this.course.inclusionResolver);
    this.registerInclusionResolver('trainer', this.trainer.inclusionResolver);
    this.registerInclusionResolver('location', this.location.inclusionResolver);
    this.registerInclusionResolver('bookings', this.bookings.inclusionResolver);
  }

  async findUpcomingSessions(limit?: number): Promise<CourseSession[]> {
    return this.find({
      where: {
        startDate: {gte: new Date()},
        status: {inq: [SessionStatus.SCHEDULED, SessionStatus.CONFIRMED]},
      },
      order: ['startDate ASC'],
      limit,
      include: ['course', 'trainer', 'location'],
    });
  }

  async findSessionsWithAvailability(): Promise<CourseSession[]> {
    const upcomingSessions = await this.findUpcomingSessions();
    return upcomingSessions.filter(session => 
      session.currentParticipants < session.maxParticipants
    );
  }

  async updateParticipantCount(sessionId: string): Promise<void> {
    const bookings = await this.bookings(sessionId).find({
      where: {
        status: {inq: ['CONFIRMED', 'PAID', 'ATTENDED', 'COMPLETED']},
      },
    });
    
    const totalParticipants = bookings.reduce((sum, booking) => 
      sum + booking.numberOfParticipants, 0
    );
    
    await this.updateById(sessionId, {
      currentParticipants: totalParticipants,
    });
  }

  async checkSessionStatus(sessionId: string): Promise<void> {
    const session = await this.findById(sessionId);
    const course = await this.course(sessionId);
    
    if (session.currentParticipants >= course.minParticipants && 
        session.status === SessionStatus.SCHEDULED) {
      await this.updateById(sessionId, {
        status: SessionStatus.CONFIRMED,
      });
    }
  }
}