# Heroku PostgreSQL Database Setup

**Status: 100% Complete**

## Overview
Set up a PostgreSQL database on Heroku (Essentials-0 tier) for the React Fast Training booking system.please use ultra think to plan for this and you can createfiles withinthis folder if it helps like a CSV with tasks to keep track etc 

## Requirements
- Heroku CLI installed
- Heroku account with payment method (for Essentials-0 tier)
- Existing Heroku app (react-fast-training)

## Implementation Steps

### 1. Add PostgreSQL to Heroku App
```bash
heroku addons:create heroku-postgresql:essential-0 --app react-fast-training
```

### 2. Get Database Credentials
```bash
heroku config:get DATABASE_URL --app react-fast-training
```

### 3. Install Required Packages
```json
// Backend dependencies
{
  "pg": "^8.11.3",
  "drizzle-orm": "^0.29.3",
  "drizzle-kit": "^0.20.9",
  "@types/pg": "^8.10.9"
}
```

### 4. Database Configuration
```typescript
// backend-loopback4/src/config/database.config.ts
import { drizzle } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false // Required for Heroku
  }
});

export const db = drizzle(pool);
```

### 5. Environment Variables
```env
# .env.local
DATABASE_URL=postgres://username:password@host:port/database
NODE_ENV=production
```

### 6. Database Schema Structure
```
react_fast_training_db/
├── users/
│   ├── id (UUID, primary key)
│   ├── email (unique, not null)
│   ├── name (not null)
│   ├── password_hash (not null)
│   ├── email_verified (boolean, default false)
│   ├── verification_token (nullable)
│   ├── reset_token (nullable)
│   ├── reset_token_expires (timestamp, nullable)
│   ├── failed_login_attempts (integer, default 0)
│   ├── account_locked_until (timestamp, nullable)
│   ├── created_at (timestamp)
│   └── updated_at (timestamp)
├── sessions/
│   ├── id (UUID, primary key)
│   ├── user_id (foreign key)
│   ├── token (unique, not null)
│   ├── expires_at (timestamp)
│   └── created_at (timestamp)
├── courses/
├── bookings/
├── payments/
└── audit_logs/
```

## Security Considerations
- Use connection pooling
- Enable SSL for database connections
- Rotate database credentials regularly
- Implement proper backup strategy
- Monitor database performance

## Testing
```bash
# Test connection
heroku pg:psql --app react-fast-training

# Run migrations
npm run db:migrate

# Check database info
heroku pg:info --app react-fast-training
```

## Monitoring
- Set up database alerts for connection limits
- Monitor query performance
- Track storage usage (10GB limit on Essentials-0)
- Set up automated backups

## Rollback Plan
```bash
# List backups
heroku pg:backups --app react-fast-training

# Restore from backup
heroku pg:backups:restore b001 DATABASE_URL --app react-fast-training
```

## Completion Notes
- Created database configuration file at `/backend-loopback4/src/config/database.config.ts`
- Set up Drizzle ORM with PostgreSQL connection pooling
- Configured for both local development and Heroku deployment
- Created migration file for auth tables at `/backend-loopback4/src/migrations/001-create-auth-tables.sql`
- Updated `.env.example` with required environment variables