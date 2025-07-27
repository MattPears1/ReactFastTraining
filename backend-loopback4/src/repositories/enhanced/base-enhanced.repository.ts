import {
  DefaultCrudRepository,
  DataSource,
  Entity,
  juggler,
  Where,
  Count,
  Filter,
} from '@loopback/repository';

export interface QueryOptions<T> {
  where?: Where<T>;
  limit?: number;
  offset?: number;
  order?: string[];
  include?: string[];
  fields?: Partial<Record<keyof T, boolean>>;
}

export interface PaginatedResult<T> {
  data: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

export abstract class BaseEnhancedRepository<
  T extends Entity,
  ID,
  Relations extends object = {}
> extends DefaultCrudRepository<T, ID, Relations> {
  
  constructor(
    entityClass: typeof Entity & {prototype: T},
    dataSource: DataSource,
  ) {
    super(entityClass, dataSource);
  }

  async findPaginated(
    page: number = 1,
    pageSize: number = 20,
    filter?: Filter<T>
  ): Promise<PaginatedResult<T>> {
    const offset = (page - 1) * pageSize;
    
    // Get total count
    const countResult = await this.count(filter?.where);
    const total = countResult.count;
    
    // Get paginated data
    const data = await this.find({
      ...filter,
      limit: pageSize,
      skip: offset,
    });

    return {
      data,
      total,
      page,
      pageSize,
      totalPages: Math.ceil(total / pageSize),
    };
  }

  async findOneOrFail(filter?: Filter<T>): Promise<T> {
    const result = await this.findOne(filter);
    if (!result) {
      throw new Error(`Entity not found`);
    }
    return result;
  }

  async exists(where: Where<T>): Promise<boolean> {
    const count = await this.count(where);
    return count.count > 0;
  }

  async batchCreate(entities: Partial<T>[]): Promise<T[]> {
    if (entities.length === 0) return [];
    
    const results: T[] = [];
    const batchSize = 100;
    
    for (let i = 0; i < entities.length; i += batchSize) {
      const batch = entities.slice(i, i + batchSize);
      const created = await Promise.all(
        batch.map(entity => this.create(entity))
      );
      results.push(...created);
    }
    
    return results;
  }

  async batchUpdate(
    where: Where<T>,
    data: Partial<T>,
    options?: {batchSize?: number}
  ): Promise<Count> {
    const batchSize = options?.batchSize || 100;
    const entities = await this.find({where});
    let updatedCount = 0;
    
    for (let i = 0; i < entities.length; i += batchSize) {
      const batch = entities.slice(i, i + batchSize);
      await Promise.all(
        batch.map(entity => 
          this.updateById(entity.getId(), data)
        )
      );
      updatedCount += batch.length;
    }
    
    return {count: updatedCount};
  }

  async transaction<R>(
    fn: (tx: juggler.Transaction) => Promise<R>
  ): Promise<R> {
    const tx = await this.dataSource.beginTransaction();
    
    try {
      const result = await fn(tx);
      await tx.commit();
      return result;
    } catch (error) {
      await tx.rollback();
      throw error;
    }
  }

  async softDelete(id: ID): Promise<void> {
    await this.updateById(id, {
      deletedAt: new Date(),
      isDeleted: true,
    } as Partial<T>);
  }

  async restore(id: ID): Promise<void> {
    await this.updateById(id, {
      deletedAt: null,
      isDeleted: false,
    } as Partial<T>);
  }

  async findWithoutDeleted(filter?: Filter<T>): Promise<T[]> {
    const enhancedFilter: Filter<T> = {
      ...filter,
      where: {
        ...filter?.where,
        isDeleted: {neq: true},
      },
    };
    return this.find(enhancedFilter);
  }

  protected async executeRawQuery<R>(
    query: string,
    params?: any[]
  ): Promise<R[]> {
    const dataSource = this.dataSource as juggler.DataSource;
    return new Promise((resolve, reject) => {
      dataSource.connector?.execute(query, params, (err: Error, result: R[]) => {
        if (err) reject(err);
        else resolve(result);
      });
    });
  }

  protected buildPaginationLinks(
    baseUrl: string,
    page: number,
    totalPages: number
  ): {
    first: string;
    last: string;
    prev?: string;
    next?: string;
  } {
    const links = {
      first: `${baseUrl}?page=1`,
      last: `${baseUrl}?page=${totalPages}`,
    };
    
    if (page > 1) {
      links.prev = `${baseUrl}?page=${page - 1}`;
    }
    
    if (page < totalPages) {
      links.next = `${baseUrl}?page=${page + 1}`;
    }
    
    return links;
  }
}