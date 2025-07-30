# Database Setup Guide - React Fast Training

## Overview

This guide covers the database setup for React Fast Training, including:
- Production database configuration
- Running migrations
- Seeding initial data
- Troubleshooting common issues

## Prerequisites

- PostgreSQL 12+ (production uses PostgreSQL on Heroku)
- Node.js 18+
- npm or yarn
- Access to production DATABASE_URL

## Environment Configuration

### Required Environment Variables

```bash
# Production Database (Heroku PostgreSQL)
DATABASE_URL=postgres://username:password@host:port/database

# Alternative individual variables (if not using DATABASE_URL)
DB_HOST=your-host
DB_PORT=5432
DB_USER=your-user
DB_PASSWORD=your-password
DB_NAME=your-database

# Application Environment
NODE_ENV=production  # Set for production

# Admin Setup (for initial seed)
ADMIN_PASSWORD=YourSecurePassword  # Change this!
```

### SSL Configuration

Production database connections require SSL. This is automatically configured when:
- `NODE_ENV=production` is set
- `DATABASE_URL` is provided

## Quick Start

### 1. Test Database Connection

```bash
# Test the connection
npm run db:test

# Or use the detailed test script
npx ts-node src/scripts/test-db-connection.ts
```

### 2. Run Full Setup (Recommended)

```bash
# This runs migrations + seeds + verification
npm run db:setup
```

### 3. Individual Commands

```bash
# Run migrations only
npm run db:migrate

# Run seeds only
npm run db:seed

# Verify database state
npm run db:verify

# Rollback migrations (careful!)
npm run db:rollback

# Reset database (drops everything!)
npm run db:reset
```

## Production Deployment

### Initial Setup

1. **Set environment variables**
   ```bash
   export NODE_ENV=production
   export DATABASE_URL=your-heroku-database-url
   export ADMIN_PASSWORD=SecurePasswordHere
   ```

2. **Run the setup**
   ```bash
   npm run db:setup
   ```

3. **Verify the setup**
   ```bash
   npm run db:verify
   ```

### Heroku Deployment

For Heroku deployments, add these scripts to your `package.json`:

```json
{
  "scripts": {
    "heroku-postbuild": "npm run db:migrate",
    "heroku-release": "npm run db:migrate"
  }
}
```

## Database Schema

### Core Tables

1. **users** - System users and administrators
2. **courses** - Available training courses
3. **venues** - Training locations
4. **course_schedules** - Scheduled course sessions
5. **bookings** - Customer bookings
6. **payment_transactions** - Payment records
7. **certificates** - Issued certificates
8. **trainers** - Course instructors
9. **settings** - System configuration

### Migration Files

All migrations are in `src/database/migrations/` and run in order:

```
20250127120000_extend_users_table.ts
20250127121000_create_courses_table.ts
20250127122000_create_venues_table.ts
... (additional migrations)
```

## Seed Data

### Development Seeds

Located in `src/database/seeds/`:
- `01_admin_user.ts` - Creates admin user
- `02_courses.ts` - Sample courses
- `03_venues.ts` - Sample venues
- `04_settings.ts` - Default settings
- `05_certificate_templates.ts` - Certificate templates

### Production Seed

- `00_production_setup.ts` - Minimal production data

To run production seed only:
```bash
FORCE_PRODUCTION_SEED=true npm run db:seed 00_production_setup
```

## Connection Pooling

Production configuration includes:
- **Min connections**: 5
- **Max connections**: 20
- **Idle timeout**: 60 seconds
- **Connection timeout**: 30 seconds
- **Statement timeout**: 60 seconds

## Troubleshooting

### Common Issues

1. **Connection Refused**
   - Check DATABASE_URL is correct
   - Verify PostgreSQL is running
   - Check firewall/security groups

2. **SSL Required Error**
   - Ensure NODE_ENV=production
   - SSL is automatically configured for Heroku

3. **Permission Denied**
   - Check database user permissions
   - Ensure user can create tables/extensions

4. **Timeout Errors**
   - Database may be starting up
   - Network latency issues
   - Increase timeout in config

### Debug Mode

Enable debug output:
```bash
DATABASE_DEBUG=true npm run db:setup
```

### Manual Connection Test

```bash
# Using psql
psql $DATABASE_URL

# Test query
SELECT version();
```

## Backup and Restore

### Create Backup

```bash
# Full backup
pg_dump $DATABASE_URL > backup.sql

# Schema only
pg_dump --schema-only $DATABASE_URL > schema.sql

# Data only
pg_dump --data-only $DATABASE_URL > data.sql
```

### Restore Backup

```bash
# Restore full backup
psql $DATABASE_URL < backup.sql

# Restore with clean
psql $DATABASE_URL < backup.sql --clean
```

## Security Considerations

1. **Never commit** production DATABASE_URL to git
2. **Use strong passwords** for admin accounts
3. **Rotate credentials** regularly
4. **Limit IP access** in production
5. **Enable SSL** for all connections
6. **Monitor** failed connection attempts

## Monitoring

### Health Checks

The API includes database health endpoints:
- `/api/health` - Basic health check
- `/api/health/db` - Database connectivity check

### Connection Metrics

Monitor these metrics in production:
- Active connections
- Connection pool usage
- Query response times
- Failed connections
- Long-running queries

## Support

For database issues:
1. Check this documentation first
2. Run the test script for diagnostics
3. Check Heroku PostgreSQL logs
4. Contact support with error details

---

Last updated: January 2025