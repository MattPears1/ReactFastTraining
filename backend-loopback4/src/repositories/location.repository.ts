import {inject, Getter} from '@loopback/core';
import {DefaultCrudRepository, repository, HasManyRepositoryFactory} from '@loopback/repository';
import {PostgresDataSource} from '../datasources';
import {Location, LocationRelations, CourseSession, YorkshireArea} from '../models';
import {CourseSessionRepository} from './course-session.repository';

export class LocationRepository extends DefaultCrudRepository<
  Location,
  typeof Location.prototype.id,
  LocationRelations
> {
  public readonly sessions: HasManyRepositoryFactory<CourseSession, typeof Location.prototype.id>;

  constructor(
    @inject('datasources.postgres') dataSource: PostgresDataSource,
    @repository.getter('CourseSessionRepository')
    protected courseSessionRepositoryGetter: Getter<CourseSessionRepository>,
  ) {
    super(Location, dataSource);
    this.sessions = this.createHasManyRepositoryFactoryFor('sessions', courseSessionRepositoryGetter);
    this.registerInclusionResolver('sessions', this.sessions.inclusionResolver);
  }

  async findActiveLocations(): Promise<Location[]> {
    return this.find({
      where: {active: true},
      order: ['area ASC', 'name ASC'],
    });
  }

  async findByArea(area: YorkshireArea): Promise<Location[]> {
    return this.find({
      where: {area, active: true},
    });
  }

  async findTrainingCenters(): Promise<Location[]> {
    return this.find({
      where: {
        type: 'TRAINING_CENTER',
        active: true,
      },
    });
  }

  async checkAvailability(locationId: string, startDate: Date, endDate: Date): Promise<boolean> {
    const conflictingSessions = await this.sessions(locationId).find({
      where: {
        and: [
          {status: {neq: 'CANCELLED'}},
          {
            or: [
              {
                and: [
                  {startDate: {lte: startDate}},
                  {endDate: {gte: startDate}},
                ],
              },
              {
                and: [
                  {startDate: {lte: endDate}},
                  {endDate: {gte: endDate}},
                ],
              },
              {
                and: [
                  {startDate: {gte: startDate}},
                  {endDate: {lte: endDate}},
                ],
              },
            ],
          },
        ],
      },
    });

    return conflictingSessions.length === 0;
  }
}