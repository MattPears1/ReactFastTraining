# Instructions for Database Agent

## Project Overview
React Fast Training is a first aid training company website that needs a complete database setup on Heroku PostgreSQL.

## Current Status
- ✅ Heroku PostgreSQL Essential-0 database created
- ✅ DATABASE_URL available and configured
- ✅ JWT secrets generated and set
- ❌ Database schema not yet created
- ❌ Admin user not yet seeded

## Required Actions

### 1. Connect to Production Database
Use the DATABASE_URL from Heroku (stored in HEROKU_DATABASE_INFO.md). The database is empty and needs initialization.

### 2. Run Database Migrations
The project uses Knex.js for migrations. Execute:
```bash
cd /mnt/f/2025/Lex_site_v1/backend-loopback4
heroku run npm run migrate:latest --app react-fast-training
```

### 3. Fix Migration Issues
There's a syntax error in the migration file:
- File: `/backend-loopback4/src/database/migrations/20250127120000_extend_users_table.ts`
- Issue: `await` used outside async function
- Fix: Wrap the migration code in proper async functions

### 4. Seed Admin User
After migrations, create the admin user:
- Email: lex@reactfasttraining.co.uk
- Password: LexOnly321! (must be hashed with bcrypt, 12 rounds)
- Role: admin

### 5. Verify Database Setup
Run these checks:
```bash
# Check tables created
heroku pg:psql --app react-fast-training -c "\dt"

# Verify admin user
heroku pg:psql --app react-fast-training -c "SELECT email, role FROM users WHERE role='admin'"
```

### 6. Create Initial Course Data (Optional)
Add sample courses:
- Emergency First Aid at Work (EFAW) - £75
- First Aid at Work (FAW) - £95
- Paediatric First Aid - £85

### 7. Set Up Automatic Backups
```bash
heroku pg:backups:schedule --at '02:00 Europe/London' --app react-fast-training
```

## Database Schema Summary

The database needs these core tables:
1. **users** - Admin and customer accounts
2. **courses** - First aid course catalog
3. **course_sessions** - Scheduled training sessions
4. **bookings** - Customer bookings
5. **payments** - Payment records (Stripe integration)
6. **certificates** - Course completion certificates
7. **audit_logs** - Admin activity tracking
8. **booking_inquiries** - Pre-booking inquiries
9. **password_resets** - Password reset tokens
10. **email_logs** - Email sending history

## Important Notes
- This is PRODUCTION data - be careful!
- Always use transactions for data integrity
- The database URL contains credentials - keep secure
- SSL is required for all connections
- Monitor usage to stay within 1GB limit

## Connection Details
All connection information is in `HEROKU_DATABASE_INFO.md`. Never commit this file to version control with real credentials.

## Success Criteria
✅ All migrations run successfully
✅ Admin user can log in with provided credentials
✅ Database tables match the schema requirements
✅ Automatic backups configured
✅ No sensitive data in version control