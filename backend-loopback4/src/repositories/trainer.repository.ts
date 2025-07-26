import {inject, Getter} from '@loopback/core';
import {DefaultCrudRepository, repository, HasManyRepositoryFactory} from '@loopback/repository';
import {PostgresDataSource} from '../datasources';
import {Trainer, TrainerRelations, CourseSession, TrainerStatus} from '../models';
import {CourseSessionRepository} from './course-session.repository';

export class TrainerRepository extends DefaultCrudRepository<
  Trainer,
  typeof Trainer.prototype.id,
  TrainerRelations
> {
  public readonly sessions: HasManyRepositoryFactory<CourseSession, typeof Trainer.prototype.id>;

  constructor(
    @inject('datasources.postgres') dataSource: PostgresDataSource,
    @repository.getter('CourseSessionRepository')
    protected courseSessionRepositoryGetter: Getter<CourseSessionRepository>,
  ) {
    super(Trainer, dataSource);
    this.sessions = this.createHasManyRepositoryFactoryFor('sessions', courseSessionRepositoryGetter);
    this.registerInclusionResolver('sessions', this.sessions.inclusionResolver);
  }

  async findActiveTrainers(): Promise<Trainer[]> {
    return this.find({
      where: {status: TrainerStatus.ACTIVE},
    });
  }

  async findByEmail(email: string): Promise<Trainer | null> {
    const trainers = await this.find({
      where: {email},
      limit: 1,
    });
    return trainers[0] || null;
  }

  async findAvailableTrainers(startDate: Date, endDate: Date): Promise<Trainer[]> {
    const activeTrainers = await this.findActiveTrainers();
    const availableTrainers: Trainer[] = [];

    for (const trainer of activeTrainers) {
      const conflictingSessions = await this.sessions(trainer.id).find({
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

      if (conflictingSessions.length === 0) {
        availableTrainers.push(trainer);
      }
    }

    return availableTrainers;
  }
}