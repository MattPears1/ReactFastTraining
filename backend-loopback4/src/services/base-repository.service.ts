import {
  DefaultCrudRepository,
  Entity,
  DataSource,
  Where,
  Count,
  Filter,
  FilterExcludingWhere,
  Options,
  AnyObject,
  Command,
  NamedParameters,
  PositionalParameters,
} from '@loopback/repository';
import {HttpErrors} from '@loopback/rest';
import {BaseService} from './base.service';

export interface QueryOptions<T> extends Options {
  includeDeleted?: boolean;
  transaction?: any;
}

export interface PaginationOptions {
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'ASC' | 'DESC';
}

export interface PaginatedResult<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  hasNext: boolean;
  hasPrevious: boolean;
}

export abstract class BaseRepositoryService<
  T extends Entity,
  ID,
  Relations extends object = {}
> extends BaseService {
  constructor(
    protected repository: DefaultCrudRepository<T, ID, Relations>,
    serviceName: string
  ) {
    super(serviceName);
  }

  /**
   * Find with enhanced error handling and soft delete support
   */
  async findWithOptions(
    filter?: Filter<T>,
    options?: QueryOptions<T>
  ): Promise<(T & Relations)[]> {
    return this.executeWithErrorHandling('findWithOptions', async () => {
      const enhancedFilter = this.enhanceFilterForSoftDelete(filter, options);
      return this.repository.find(enhancedFilter, options);
    });
  }

  /**
   * Find by ID with soft delete check
   */
  async findByIdSafe(
    id: ID,
    filter?: FilterExcludingWhere<T>,
    options?: QueryOptions<T>
  ): Promise<T & Relations> {
    return this.executeWithErrorHandling('findByIdSafe', async () => {
      const entity = await this.repository.findById(id, filter, options);
      
      if (this.isDeleted(entity) && !options?.includeDeleted) {
        throw new HttpErrors.NotFound(`Entity not found`);
      }
      
      return entity;
    });
  }

  /**
   * Paginated find with metadata
   */
  async findPaginated(
    filter?: Filter<T>,
    pagination?: PaginationOptions,
    options?: QueryOptions<T>
  ): Promise<PaginatedResult<T & Relations>> {
    return this.executeWithErrorHandling('findPaginated', async () => {
      const page = pagination?.page || 1;
      const limit = Math.min(pagination?.limit || 10, 100); // Max 100 items
      const offset = (page - 1) * limit;

      // Build enhanced filter
      const enhancedFilter: Filter<T> = {
        ...filter,
        limit,
        offset,
      };

      if (pagination?.sortBy) {
        enhancedFilter.order = [
          `${pagination.sortBy} ${pagination.sortOrder || 'ASC'}`,
        ];
      }

      // Get data and count in parallel
      const [data, countResult] = await Promise.all([
        this.findWithOptions(enhancedFilter, options),
        this.repository.count(
          enhancedFilter.where,
          options
        ),
      ]);

      const total = countResult.count;
      const totalPages = Math.ceil(total / limit);

      return {
        data,
        total,
        page,
        limit,
        totalPages,
        hasNext: page < totalPages,
        hasPrevious: page > 1,
      };
    });
  }

  /**
   * Create with validation and audit
   */
  async createWithValidation(
    data: Omit<T, 'id'>,
    userId?: string,
    options?: Options
  ): Promise<T> {
    return this.executeWithErrorHandling('createWithValidation', async () => {
      // Add audit fields
      const entityData = {
        ...data,
        createdAt: new Date(),
        createdBy: userId,
        updatedAt: new Date(),
        updatedBy: userId,
      } as any;

      const created = await this.repository.create(entityData, options);
      
      await this.logOperation('create', userId || 'system', {
        entityId: (created as any).id,
        data: entityData,
      });
      
      return created;
    });
  }

  /**
   * Update with optimistic locking
   */
  async updateWithLocking(
    id: ID,
    data: Partial<T>,
    expectedVersion?: number,
    userId?: string,
    options?: Options
  ): Promise<void> {
    return this.executeWithErrorHandling('updateWithLocking', async () => {
      const entity = await this.findByIdSafe(id, undefined, options);
      
      // Check version for optimistic locking
      if (expectedVersion !== undefined && (entity as any).version !== expectedVersion) {
        throw new HttpErrors.Conflict(
          'Entity has been modified by another process'
        );
      }

      // Update with new version
      const updateData = {
        ...data,
        updatedAt: new Date(),
        updatedBy: userId,
        version: ((entity as any).version || 0) + 1,
      } as any;

      await this.repository.updateById(id, updateData, options);
      
      await this.logOperation('update', userId || 'system', {
        entityId: id,
        changes: data,
      });
    });
  }

  /**
   * Soft delete implementation
   */
  async softDelete(
    id: ID,
    userId?: string,
    options?: Options
  ): Promise<void> {
    return this.executeWithErrorHandling('softDelete', async () => {
      await this.updateWithLocking(
        id,
        {
          deletedAt: new Date(),
          deletedBy: userId,
        } as any,
        undefined,
        userId,
        options
      );
      
      await this.logOperation('softDelete', userId || 'system', {
        entityId: id,
      });
    });
  }

  /**
   * Bulk operations with transaction
   */
  async bulkCreate(
    dataArray: Omit<T, 'id'>[],
    userId?: string,
    options?: Options
  ): Promise<T[]> {
    return this.executeWithErrorHandling('bulkCreate', async () => {
      const transaction = await this.repository.dataSource.beginTransaction();
      
      try {
        const created: T[] = [];
        
        for (const data of dataArray) {
          const entity = await this.createWithValidation(
            data,
            userId,
            { ...options, transaction }
          );
          created.push(entity);
        }
        
        await transaction.commit();
        return created;
      } catch (error) {
        await transaction.rollback();
        throw error;
      }
    });
  }

  /**
   * Execute raw SQL with parameter binding
   */
  async executeQuery<R = any>(
    sql: string,
    params?: NamedParameters | PositionalParameters,
    options?: Options
  ): Promise<R[]> {
    return this.executeWithErrorHandling('executeQuery', async () => {
      const command = new Command(sql, params);
      return this.repository.execute(command, options);
    });
  }

  /**
   * Count with filters
   */
  async countWithFilters(
    where?: Where<T>,
    options?: Options
  ): Promise<Count> {
    return this.executeWithErrorHandling('countWithFilters', async () => {
      const enhancedWhere = this.enhanceWhereForSoftDelete(where, options);
      return this.repository.count(enhancedWhere, options);
    });
  }

  /**
   * Check if entity exists
   */
  async exists(
    id: ID,
    options?: QueryOptions<T>
  ): Promise<boolean> {
    try {
      await this.findByIdSafe(id, undefined, options);
      return true;
    } catch (error) {
      if (error instanceof HttpErrors.NotFound) {
        return false;
      }
      throw error;
    }
  }

  /**
   * Find one with conditions
   */
  async findOneWithConditions(
    where: Where<T>,
    options?: QueryOptions<T>
  ): Promise<(T & Relations) | null> {
    return this.executeWithErrorHandling('findOneWithConditions', async () => {
      const filter: Filter<T> = {
        where: this.enhanceWhereForSoftDelete(where, options),
        limit: 1,
      };
      
      const results = await this.repository.find(filter, options);
      return results[0] || null;
    });
  }

  /**
   * Helper to check if entity is soft deleted
   */
  protected isDeleted(entity: T): boolean {
    return !!(entity as any).deletedAt;
  }

  /**
   * Enhance filter to exclude soft deleted records
   */
  protected enhanceFilterForSoftDelete(
    filter?: Filter<T>,
    options?: QueryOptions<T>
  ): Filter<T> {
    if (options?.includeDeleted) {
      return filter || {};
    }

    return {
      ...filter,
      where: this.enhanceWhereForSoftDelete(filter?.where, options),
    };
  }

  /**
   * Enhance where clause for soft delete
   */
  protected enhanceWhereForSoftDelete(
    where?: Where<T>,
    options?: QueryOptions<T>
  ): Where<T> {
    if (options?.includeDeleted) {
      return where || {};
    }

    return {
      and: [
        where || {},
        { deletedAt: null } as any,
      ],
    } as Where<T>;
  }

  /**
   * Get repository stats
   */
  async getStats(): Promise<{
    total: number;
    active: number;
    deleted: number;
    createdToday: number;
    updatedToday: number;
  }> {
    return this.executeWithErrorHandling('getStats', async () => {
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const [total, deleted, createdToday, updatedToday] = await Promise.all([
        this.repository.count({}, { includeDeleted: true } as any),
        this.repository.count({ deletedAt: { neq: null } } as any),
        this.repository.count({ createdAt: { gte: today } } as any),
        this.repository.count({ 
          updatedAt: { gte: today },
          createdAt: { lt: today },
        } as any),
      ]);

      return {
        total: total.count,
        active: total.count - deleted.count,
        deleted: deleted.count,
        createdToday: createdToday.count,
        updatedToday: updatedToday.count,
      };
    });
  }
}