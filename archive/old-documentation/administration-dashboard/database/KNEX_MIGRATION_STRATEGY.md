# Knex Migration Strategy

## Overview

This document outlines the database migration strategy using Knex.js for the React Fast Training administration system.

## Why Knex?

Knex.js is chosen for:
- **Version Control**: Track all database changes in Git
- **Team Collaboration**: Share schema changes easily
- **Rollback Capability**: Undo changes if needed
- **TypeScript Support**: Full type safety
- **Multiple Environment Support**: Dev, staging, production
- **Query Builder**: Clean, chainable API

## Setup Configuration

### 1. Install Dependencies
```bash
npm install knex pg
npm install -D @types/pg
```

### 2. Knex Configuration (knexfile.ts)
```typescript
import type { Knex } from "knex";
import dotenv from "dotenv";

dotenv.config();

const config: { [key: string]: Knex.Config } = {
  development: {
    client: "postgresql",
    connection: {
      host: process.env.DB_HOST || "localhost",
      port: Number(process.env.DB_PORT) || 5432,
      user: process.env.DB_USER || "postgres",
      password: process.env.DB_PASSWORD,
      database: process.env.DB_NAME || "reactfast_dev"
    },
    migrations: {
      directory: "./src/database/migrations",
      extension: "ts"
    },
    seeds: {
      directory: "./src/database/seeds",
      extension: "ts"
    }
  },
  
  test: {
    client: "postgresql",
    connection: {
      host: "localhost",
      port: 5432,
      user: "postgres",
      password: process.env.DB_PASSWORD,
      database: "reactfast_test"
    },
    migrations: {
      directory: "./src/database/migrations",
      extension: "ts"
    }
  },
  
  production: {
    client: "postgresql",
    connection: process.env.DATABASE_URL,
    migrations: {
      directory: "./dist/database/migrations",
      extension: "js"
    },
    pool: {
      min: 2,
      max: 10
    }
  }
};

export default config;
```

## Migration File Structure

### Naming Convention
```
YYYYMMDDHHMMSS_description.ts
Example: 20250127120000_create_users_table.ts
```

### Migration Template
```typescript
import { Knex } from "knex";

export async function up(knex: Knex): Promise<void> {
  // Create or modify schema
  return knex.schema.createTable('table_name', (table) => {
    table.increments('id').primary();
    // ... other columns
    table.timestamps(true, true); // created_at, updated_at
  });
}

export async function down(knex: Knex): Promise<void> {
  // Revert changes
  return knex.schema.dropTable('table_name');
}
```

## Migration Order

### Phase 1: Core Tables
```
1. 20250127120000_extend_users_table.ts
2. 20250127121000_create_courses_table.ts
3. 20250127122000_create_venues_table.ts
```

### Phase 2: Relationship Tables
```
4. 20250127123000_create_course_schedules_table.ts
5. 20250127124000_create_discount_codes_table.ts
6. 20250127125000_create_bookings_table.ts
```

### Phase 3: Supporting Tables
```
7. 20250127126000_create_payment_transactions_table.ts
8. 20250127127000_create_analytics_events_table.ts
9. 20250127128000_create_admin_activity_logs_table.ts
10. 20250127129000_create_email_logs_table.ts
```

## Example Migrations

### 1. Extend Users Table
```typescript
import { Knex } from "knex";

export async function up(knex: Knex): Promise<void> {
  return knex.schema.alterTable('users', (table) => {
    table.string('phone', 20);
    table.enum('role', ['customer', 'admin', 'instructor'])
      .defaultTo('customer');
    table.boolean('is_active').defaultTo(true);
    table.timestamp('last_login');
    
    // Add indexes
    table.index('email');
    table.index('role');
  });
}

export async function down(knex: Knex): Promise<void> {
  return knex.schema.alterTable('users', (table) => {
    table.dropColumn('phone');
    table.dropColumn('role');
    table.dropColumn('is_active');
    table.dropColumn('last_login');
    
    table.dropIndex('email');
    table.dropIndex('role');
  });
}
```

### 2. Create Bookings Table with Foreign Keys
```typescript
import { Knex } from "knex";

export async function up(knex: Knex): Promise<void> {
  return knex.schema.createTable('bookings', (table) => {
    table.increments('id').primary();
    
    // Foreign keys
    table.integer('user_id').unsigned().notNullable();
    table.foreign('user_id').references('users.id');
    
    table.integer('course_schedule_id').unsigned().notNullable();
    table.foreign('course_schedule_id').references('course_schedules.id');
    
    table.integer('discount_code_id').unsigned();
    table.foreign('discount_code_id').references('discount_codes.id');
    
    // Other columns
    table.string('booking_reference', 20).unique().notNullable();
    table.enum('status', ['pending', 'confirmed', 'cancelled', 'completed', 'no_show'])
      .defaultTo('pending');
    table.decimal('payment_amount', 10, 2).notNullable();
    
    // Timestamps
    table.timestamps(true, true);
    
    // Indexes
    table.index('user_id');
    table.index('course_schedule_id');
    table.index('booking_reference');
    table.index('status');
  });
}

export async function down(knex: Knex): Promise<void> {
  return knex.schema.dropTable('bookings');
}
```

## CLI Commands

### Run Migrations
```bash
# Latest migrations
npx knex migrate:latest

# Specific environment
npx knex migrate:latest --env production

# Rollback last batch
npx knex migrate:rollback

# Rollback all
npx knex migrate:rollback --all

# Migration status
npx knex migrate:status
```

### Create New Migration
```bash
npx knex migrate:make migration_name
```

### Seed Database
```bash
# Run all seeds
npx knex seed:run

# Specific seed file
npx knex seed:run --specific=01_users.ts
```

## Best Practices

### 1. Migration Guidelines
- **One Change Per Migration**: Keep migrations focused
- **Always Include Down Method**: Enable rollbacks
- **Test Migrations**: Run up and down in development
- **No Data Manipulation in Schema Migrations**: Use seed files
- **Avoid Nullable Foreign Keys**: Unless business logic requires

### 2. Performance Considerations
```typescript
// Good: Add index for frequently queried columns
table.index(['status', 'created_at']);

// Good: Use partial indexes where applicable
knex.raw(`
  CREATE INDEX idx_active_schedules 
  ON course_schedules(start_datetime) 
  WHERE status = 'published'
`);
```

### 3. Data Types Best Practices
```typescript
// Money: Use decimal, not float
table.decimal('price', 10, 2);

// UUIDs: If needed
table.uuid('id').primary().defaultTo(knex.raw('uuid_generate_v4()'));

// Enums: Define explicitly
table.enum('status', ['draft', 'published', 'cancelled']);

// JSON data
table.jsonb('metadata').defaultTo('{}');
```

### 4. Foreign Key Constraints
```typescript
// Cascade deletes when appropriate
table.foreign('user_id')
  .references('users.id')
  .onDelete('CASCADE');

// Restrict deletion for critical relationships
table.foreign('course_id')
  .references('courses.id')
  .onDelete('RESTRICT');
```

## Seed Data Strategy

### Development Seeds
```typescript
// src/database/seeds/01_users.ts
export async function seed(knex: Knex): Promise<void> {
  // Clear existing data
  await knex('users').del();
  
  // Insert seed data
  await knex('users').insert([
    {
      email: 'admin@reactfasttraining.co.uk',
      password_hash: await bcrypt.hash('admin123', 10),
      first_name: 'Admin',
      last_name: 'User',
      role: 'admin'
    },
    // Test users...
  ]);
}
```

## Integration with LoopBack 4

### Database Connection
```typescript
// src/datasources/postgres.datasource.ts
import {inject, lifeCycleObserver, LifeCycleObserver} from '@loopback/core';
import {juggler} from '@loopback/repository';

const config = {
  name: 'postgres',
  connector: 'postgresql',
  url: process.env.DATABASE_URL,
  host: process.env.DB_HOST,
  port: process.env.DB_PORT,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME
};

@lifeCycleObserver('datasource')
export class PostgresDataSource extends juggler.DataSource
  implements LifeCycleObserver {
  static dataSourceName = 'postgres';
  static readonly defaultConfig = config;

  constructor(
    @inject('datasources.config.postgres', {optional: true})
    dsConfig: object = config,
  ) {
    super(dsConfig);
  }
}
```

## Deployment Process

### 1. Pre-deployment
```bash
# Check migration status
npx knex migrate:status --env production

# Dry run (if implemented)
npx knex migrate:latest --env production --dry-run
```

### 2. Deployment
```bash
# Run migrations
npx knex migrate:latest --env production

# Verify
npx knex migrate:status --env production
```

### 3. Rollback Plan
```bash
# If issues arise
npx knex migrate:rollback --env production

# Check specific migration
npx knex migrate:list --env production
```

## Monitoring & Maintenance

### 1. Migration Logs
- Log all migration runs
- Track execution time
- Monitor for failures

### 2. Database Health Checks
```typescript
// Health check endpoint
async function checkDatabase(): Promise<boolean> {
  try {
    await knex.raw('SELECT 1');
    return true;
  } catch (error) {
    console.error('Database health check failed:', error);
    return false;
  }
}
```

### 3. Backup Strategy
- Before major migrations
- Automated daily backups
- Test restore procedures

## Troubleshooting

### Common Issues

1. **Migration Lock**: 
```bash
# If migrations hang
DELETE FROM knex_migrations_lock WHERE is_locked = 1;
```

2. **Failed Migration**:
```bash
# Check migration table
SELECT * FROM knex_migrations ORDER BY batch DESC;

# Manual fix if needed
DELETE FROM knex_migrations WHERE name = 'failed_migration.js';
```

3. **Connection Issues**:
- Verify database credentials
- Check network connectivity
- Ensure database server is running