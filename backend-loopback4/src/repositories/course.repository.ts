import {inject, Getter} from '@loopback/core';
import {DefaultCrudRepository, repository, HasManyRepositoryFactory} from '@loopback/repository';
import {PostgresDataSource} from '../datasources';
import {Course, CourseRelations, CourseSession, Booking} from '../models';
import {CourseSessionRepository} from './course-session.repository';
import {BookingRepository} from './booking.repository';

export class CourseRepository extends DefaultCrudRepository<
  Course,
  typeof Course.prototype.id,
  CourseRelations
> {
  public readonly sessions: HasManyRepositoryFactory<CourseSession, typeof Course.prototype.id>;
  public readonly bookings: HasManyRepositoryFactory<Booking, typeof Course.prototype.id>;

  constructor(
    @inject('datasources.postgres') dataSource: PostgresDataSource,
    @repository.getter('CourseSessionRepository')
    protected courseSessionRepositoryGetter: Getter<CourseSessionRepository>,
    @repository.getter('BookingRepository')
    protected bookingRepositoryGetter: Getter<BookingRepository>,
  ) {
    super(Course, dataSource);
    this.sessions = this.createHasManyRepositoryFactoryFor('sessions', courseSessionRepositoryGetter);
    this.bookings = this.createHasManyThroughRepositoryFactoryFor(
      'bookings',
      bookingRepositoryGetter,
      courseSessionRepositoryGetter,
    );
    this.registerInclusionResolver('sessions', this.sessions.inclusionResolver);
    this.registerInclusionResolver('bookings', this.bookings.inclusionResolver);
  }

  async findActiveCourses(): Promise<Course[]> {
    return this.find({
      where: {active: true},
      order: ['type ASC', 'name ASC'],
    });
  }

  async findByType(type: string): Promise<Course[]> {
    return this.find({
      where: {type, active: true},
    });
  }

  async calculateGroupDiscount(courseId: string, groupSize: number): Promise<number> {
    const course = await this.findById(courseId);
    if (!course.groupDiscounts) return 0;

    const discountKeys = Object.keys(course.groupDiscounts)
      .map(k => parseInt(k))
      .sort((a, b) => b - a);

    for (const minSize of discountKeys) {
      if (groupSize >= minSize) {
        return course.groupDiscounts[minSize.toString()];
      }
    }
    return 0;
  }
}