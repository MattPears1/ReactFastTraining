import { Database } from '../db/database';
import { and, eq, gt, gte, lt, lte, like, inArray, isNull, isNotNull, desc, asc, sql } from 'drizzle-orm';
import { PgTable } from 'drizzle-orm/pg-core';

export interface QueryOptions {
  limit?: number;
  offset?: number;
  orderBy?: { column: string; direction: 'asc' | 'desc' }[];
  where?: Record<string, any>;
}

export interface PaginatedResult<T> {
  data: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

export abstract class BaseRepository<T> {
  constructor(
    protected readonly db: Database,
    protected readonly table: PgTable
  ) {}

  async findById(id: string): Promise<T | null> {
    const [result] = await this.db
      .select()
      .from(this.table)
      .where(eq(this.table.id, id))
      .limit(1);
    
    return result as T || null;
  }

  async findOne(conditions: Record<string, any>): Promise<T | null> {
    const whereClause = this.buildWhereClause(conditions);
    const [result] = await this.db
      .select()
      .from(this.table)
      .where(whereClause)
      .limit(1);
    
    return result as T || null;
  }

  async findMany(options: QueryOptions = {}): Promise<T[]> {
    let query = this.db.select().from(this.table);

    if (options.where) {
      query = query.where(this.buildWhereClause(options.where));
    }

    if (options.orderBy) {
      options.orderBy.forEach(({ column, direction }) => {
        const col = this.table[column];
        query = query.orderBy(direction === 'asc' ? asc(col) : desc(col));
      });
    }

    if (options.limit) {
      query = query.limit(options.limit);
    }

    if (options.offset) {
      query = query.offset(options.offset);
    }

    const results = await query;
    return results as T[];
  }

  async findPaginated(
    page: number = 1,
    pageSize: number = 20,
    options: Omit<QueryOptions, 'limit' | 'offset'> = {}
  ): Promise<PaginatedResult<T>> {
    const offset = (page - 1) * pageSize;
    
    // Get total count
    const countQuery = this.db
      .select({ count: sql<number>`cast(count(*) as int)` })
      .from(this.table);
    
    if (options.where) {
      countQuery.where(this.buildWhereClause(options.where));
    }
    
    const [{ count }] = await countQuery;
    
    // Get paginated data
    const data = await this.findMany({
      ...options,
      limit: pageSize,
      offset
    });

    return {
      data,
      total: count,
      page,
      pageSize,
      totalPages: Math.ceil(count / pageSize)
    };
  }

  async create(data: Partial<T>): Promise<T> {
    const [result] = await this.db
      .insert(this.table)
      .values(data)
      .returning();
    
    return result as T;
  }

  async createMany(data: Partial<T>[]): Promise<T[]> {
    if (data.length === 0) return [];
    
    const results = await this.db
      .insert(this.table)
      .values(data)
      .returning();
    
    return results as T[];
  }

  async update(id: string, data: Partial<T>): Promise<T | null> {
    const [result] = await this.db
      .update(this.table)
      .set({
        ...data,
        updatedAt: new Date()
      })
      .where(eq(this.table.id, id))
      .returning();
    
    return result as T || null;
  }

  async updateMany(
    conditions: Record<string, any>,
    data: Partial<T>
  ): Promise<number> {
    const whereClause = this.buildWhereClause(conditions);
    const result = await this.db
      .update(this.table)
      .set({
        ...data,
        updatedAt: new Date()
      })
      .where(whereClause);
    
    return result.rowCount || 0;
  }

  async delete(id: string): Promise<boolean> {
    const result = await this.db
      .delete(this.table)
      .where(eq(this.table.id, id));
    
    return (result.rowCount || 0) > 0;
  }

  async deleteMany(conditions: Record<string, any>): Promise<number> {
    const whereClause = this.buildWhereClause(conditions);
    const result = await this.db
      .delete(this.table)
      .where(whereClause);
    
    return result.rowCount || 0;
  }

  async exists(conditions: Record<string, any>): Promise<boolean> {
    const result = await this.findOne(conditions);
    return result !== null;
  }

  async count(conditions?: Record<string, any>): Promise<number> {
    const query = this.db
      .select({ count: sql<number>`cast(count(*) as int)` })
      .from(this.table);
    
    if (conditions) {
      query.where(this.buildWhereClause(conditions));
    }
    
    const [{ count }] = await query;
    return count;
  }

  protected buildWhereClause(conditions: Record<string, any>): any {
    const clauses = Object.entries(conditions).map(([key, value]) => {
      const column = this.table[key];
      
      if (value === null) {
        return isNull(column);
      }
      
      if (value === 'NOT_NULL') {
        return isNotNull(column);
      }
      
      if (typeof value === 'object' && value !== null) {
        if ('$gt' in value) return gt(column, value.$gt);
        if ('$gte' in value) return gte(column, value.$gte);
        if ('$lt' in value) return lt(column, value.$lt);
        if ('$lte' in value) return lte(column, value.$lte);
        if ('$like' in value) return like(column, value.$like);
        if ('$in' in value) return inArray(column, value.$in);
      }
      
      return eq(column, value);
    });

    return clauses.length === 1 ? clauses[0] : and(...clauses);
  }

  async transaction<R>(
    callback: (tx: Database) => Promise<R>
  ): Promise<R> {
    return await this.db.transaction(callback);
  }
}