# Database Setup Guide

## Prerequisites

1. PostgreSQL 13+ installed and running
2. Node.js 18+ and npm installed
3. Database user with CREATE DATABASE privileges

## Initial Setup

### 1. Create Database

```bash
# Connect to PostgreSQL
psql -U postgres

# Create database
CREATE DATABASE lex_business;

# Create test database (optional)
CREATE DATABASE lex_business_test;

# Exit
\q
```

### 2. Environment Configuration

Create a `.env` file in the backend directory:

```env
# Database Configuration
DB_HOST=localhost
DB_PORT=5432
DB_NAME=lex_business
DB_USER=postgres
DB_PASSWORD=your_password

# Test Database (optional)
DB_NAME_TEST=lex_business_test

# Other configurations
NODE_ENV=development
JWT_SECRET=your-secret-key
```

### 3. Install Dependencies

```bash
cd backend
npm install
```

## Running Migrations

### Development Setup

```bash
# Run all migrations
npx sequelize-cli db:migrate

# Run seeders (demo data)
npx sequelize-cli db:seed:all

# Or use the setup script
npm run setup:db
```

### Production Setup

```bash
# Run migrations only (no seeders)
NODE_ENV=production npx sequelize-cli db:migrate
```

## Migration Commands

### Create a New Migration

```bash
npx sequelize-cli migration:generate --name add-new-feature
```

### Run Pending Migrations

```bash
npx sequelize-cli db:migrate
```

### Rollback Migrations

```bash
# Rollback last migration
npx sequelize-cli db:migrate:undo

# Rollback all migrations
npx sequelize-cli db:migrate:undo:all

# Rollback to specific migration
npx sequelize-cli db:migrate:undo:all --to 20250126000001-create-initial-tables.js
```

## Seeder Commands

### Create a New Seeder

```bash
npx sequelize-cli seed:generate --name demo-data
```

### Run Seeders

```bash
# Run all seeders
npx sequelize-cli db:seed:all

# Run specific seeder
npx sequelize-cli db:seed --seed 20250126000001-demo-users.js
```

### Undo Seeders

```bash
# Undo last seeder
npx sequelize-cli db:seed:undo

# Undo all seeders
npx sequelize-cli db:seed:undo:all

# Undo specific seeder
npx sequelize-cli db:seed:undo --seed 20250126000001-demo-users.js
```

## Database Management

### Reset Database (Development Only)

```bash
# Drop, create, migrate, and seed
npm run db:reset
```

### Backup Database

```bash
# Create backup
pg_dump -U postgres lex_business > backup_$(date +%Y%m%d_%H%M%S).sql

# Restore backup
psql -U postgres lex_business < backup_20250126_120000.sql
```

## Demo Data

The seeders create the following demo data:

### Users
- **Admin**: admin@lexbusiness.com / password123
- **User**: john.doe@example.com / password123
- **User**: jane.smith@example.com / password123
- **Moderator**: moderator@lexbusiness.com / password123

### Products
- Electronics (Headphones, Smart Watch)
- Clothing (T-Shirts)
- Books (Web Development)
- Home & Garden (Plants)

### Services
- Business Consultation
- Website Development
- Logo Design
- Social Media Management
- SEO Optimization

### Subscription Plans
- Basic ($29.99/month)
- Professional ($79.99/month)
- Enterprise ($299.99/month)
- Annual Professional (20% discount)

### Coupons
- WELCOME20: 20% off for new customers
- SAVE10: $10 off purchases over $100
- ELECTRONICS15: 15% off electronics
- FREESHIP: Free shipping over $50
- VIP50: 50% off for VIP members

## Troubleshooting

### Connection Issues

```bash
# Check PostgreSQL is running
systemctl status postgresql

# Test connection
psql -U postgres -d lex_business -c "SELECT 1"
```

### Migration Errors

1. Check database exists and is accessible
2. Verify credentials in .env file
3. Check for pending migrations: `npx sequelize-cli db:migrate:status`
4. Review migration files for syntax errors

### Performance Issues

1. Run ANALYZE on tables: `ANALYZE;`
2. Check slow queries: Enable `logging` in database config
3. Review indexes: `\di` in psql
4. Monitor connections: `SELECT count(*) FROM pg_stat_activity;`

## Best Practices

1. **Always test migrations** in development before production
2. **Backup database** before running migrations in production
3. **Use transactions** in migrations for atomic changes
4. **Version control** all migration files
5. **Document** significant schema changes
6. **Monitor** database performance after migrations

## Additional Scripts

Add these to your package.json scripts:

```json
{
  "scripts": {
    "db:migrate": "sequelize-cli db:migrate",
    "db:migrate:undo": "sequelize-cli db:migrate:undo",
    "db:seed": "sequelize-cli db:seed:all",
    "db:seed:undo": "sequelize-cli db:seed:undo:all",
    "db:reset": "sequelize-cli db:drop && sequelize-cli db:create && sequelize-cli db:migrate && sequelize-cli db:seed:all",
    "db:setup": "ts-node src/scripts/setup-database.ts"
  }
}
```