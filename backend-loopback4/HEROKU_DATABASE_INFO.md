# React Fast Training - Heroku Database Information

## Database Details

**Created**: July 27, 2025 at 14:17 UTC
**Addon Name**: postgresql-pointy-92221
**Plan**: Essential-0 (max $5/month)
**PostgreSQL Version**: 17.4
**Status**: Available ✅

## Connection Information

```
DATABASE_URL: postgres://u6lviobf1i4us8:pab6a3d6a7104744074a9624ba13442ba3fe73fdb8ec42e758de4f11646f02ee2@cd7f19r8oktbkp.cluster-czrs8kj4isg7.us-east-1.rds.amazonaws.com:5432/de9e8o6jhtn98o
```

### Parsed Connection Details:
- **Host**: cd7f19r8oktbkp.cluster-czrs8kj4isg7.us-east-1.rds.amazonaws.com
- **Port**: 5432
- **Database**: de9e8o6jhtn98o
- **Username**: u6lviobf1i4us8
- **Password**: pab6a3d6a7104744074a9624ba13442ba3fe73fdb8ec42e758de4f11646f02ee2

## Database Limits
- **Storage**: 1 GB
- **Connections**: 20 concurrent
- **Tables**: 4000 maximum
- **Rows**: No limit (within storage)

## Instructions for Database Agent

### 1. Initial Setup Tasks

The database needs the following tables created (via Knex migrations):

1. **users** - Admin and customer users
   - id (UUID primary key)
   - email (unique)
   - password_hash
   - name
   - role (admin/customer)
   - created_at, updated_at

2. **courses** - First aid courses
   - id (UUID primary key)
   - name
   - description
   - price
   - duration_hours
   - max_participants
   - created_at, updated_at

3. **course_sessions** - Scheduled course sessions
   - id (UUID primary key)
   - course_id (foreign key)
   - session_date
   - start_time
   - end_time
   - location
   - trainer_id
   - max_participants
   - current_bookings
   - status
   - created_at, updated_at

4. **bookings** - Customer bookings
   - id (UUID primary key)
   - user_id (foreign key)
   - session_id (foreign key)
   - booking_reference
   - number_of_attendees
   - total_amount
   - payment_intent_id
   - status
   - created_at, updated_at

5. **payments** - Payment records
   - id (UUID primary key)
   - booking_id (foreign key)
   - stripe_payment_intent_id
   - amount
   - currency
   - status
   - created_at, updated_at

6. **certificates** - Course completion certificates
   - id (UUID primary key)
   - booking_id (foreign key)
   - certificate_number
   - issue_date
   - expiry_date
   - pdf_url
   - created_at, updated_at

7. **audit_logs** - Admin activity tracking
   - id (UUID primary key)
   - user_id (foreign key)
   - action
   - entity_type
   - entity_id
   - details (JSONB)
   - ip_address
   - user_agent
   - created_at

8. **booking_inquiries** - Pre-booking inquiries
   - id (UUID primary key)
   - course_type
   - preferred_dates
   - number_of_people
   - company_name
   - contact_name
   - email
   - phone
   - message
   - status
   - created_at, updated_at

9. **password_resets** - Password reset tokens
   - id (UUID primary key)
   - user_id (foreign key)
   - token
   - expires_at
   - used_at
   - created_at

10. **email_logs** - Email sending history
    - id (UUID primary key)
    - recipient
    - subject
    - template
    - status
    - sent_at
    - error_message
    - created_at

### 2. Initial Data Seeding

Create the admin user:
```sql
INSERT INTO users (email, password_hash, name, role)
VALUES ('lex@reactfasttraining.co.uk', '$2a$12$...', 'Lex', 'admin');
```
Password: LexOnly321! (needs to be hashed with bcrypt)

### 3. Database Migrations

The project uses Knex.js for migrations. Files are located at:
`/backend-loopback4/src/database/migrations/`

To run migrations on Heroku:
```bash
heroku run npm run migrate:latest --app react-fast-training
```

### 4. Important Notes

- This is a production database - handle with care
- Always backup before major changes
- Use transactions for data integrity
- Enable SSL for all connections
- Monitor usage to stay within limits

### 5. Environment Variables to Set

On Heroku, set these config vars:
```bash
heroku config:set JWT_SECRET="<generate-strong-secret>" --app react-fast-training
heroku config:set JWT_REFRESH_SECRET="<generate-different-secret>" --app react-fast-training
heroku config:set FRONTEND_URL="https://reactfasttraining.co.uk" --app react-fast-training
```

### 6. Monitoring Commands

```bash
# Check database status
heroku pg:info --app react-fast-training

# Run psql console
heroku pg:psql --app react-fast-training

# Create backup
heroku pg:backups:capture --app react-fast-training

# List backups
heroku pg:backups --app react-fast-training
```

## Security Notes

⚠️ **NEVER** commit this file with real credentials to version control
⚠️ **ALWAYS** use environment variables for database connections
⚠️ **ROTATE** credentials if they are ever exposed