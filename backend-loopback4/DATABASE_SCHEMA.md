# React Fast Training Database Schema

## Overview
This document describes the complete database schema for the React Fast Training admin portal and application. The database is PostgreSQL hosted on Heroku.

## Core Tables

### 1. users
- **Purpose**: Stores all users (admin, customers, instructors)
- **Key Fields**:
  - id (PK)
  - email (unique)
  - password_hash
  - first_name, last_name
  - phone
  - role (customer/admin/instructor)
  - is_active
  - last_login
  - created_at, updated_at

### 2. courses
- **Purpose**: Course catalog
- **Key Fields**:
  - id (PK)
  - name
  - description
  - course_type (EFAW/FAW/Paediatric)
  - duration_hours
  - price
  - max_capacity
  - certification_validity_years
  - is_active
  - created_by_id (FK), updated_by_id (FK)

### 3. venues
- **Purpose**: Training locations
- **Key Fields**:
  - id (PK)
  - name
  - address_line1, address_line2
  - city, postcode
  - capacity
  - facilities (JSON)
  - parking_info
  - is_active

### 4. course_schedules
- **Purpose**: Scheduled training sessions
- **Key Fields**:
  - id (PK)
  - course_id (FK)
  - venue_id (FK)
  - instructor_id (FK)
  - trainer_id (FK)
  - start_datetime, end_datetime
  - status (scheduled/confirmed/in_progress/completed/cancelled)
  - current_capacity
  - created_by_id (FK), updated_by_id (FK)

### 5. bookings
- **Purpose**: Customer bookings
- **Key Fields**:
  - id (PK)
  - user_id (FK)
  - course_schedule_id (FK)
  - discount_code_id (FK)
  - booking_reference (unique)
  - status (pending/confirmed/cancelled/completed/no_show)
  - payment_status (pending/paid/refunded/failed)
  - payment_amount
  - discount_applied
  - confirmation_sent, reminder_sent
  - certificate_issued
  - created_by_id (FK), updated_by_id (FK)

### 6. payment_transactions
- **Purpose**: Payment records (Stripe integration)
- **Key Fields**:
  - id (PK)
  - booking_id (FK)
  - stripe_payment_intent_id
  - amount
  - currency
  - status
  - payment_method
  - created_at

## Admin Portal Tables

### 7. admin_activity_logs (audit_logs)
- **Purpose**: Track all admin actions
- **Key Fields**:
  - id (PK)
  - user_id (FK)
  - action
  - entity_type, entity_id
  - changes (JSON)
  - ip_address
  - user_agent
  - created_at

### 8. admin_sessions
- **Purpose**: Admin login sessions
- **Key Fields**:
  - id (PK)
  - user_id (FK)
  - session_token (unique)
  - ip_address
  - user_agent
  - expires_at
  - last_activity
  - is_active
  - failed_attempts
  - device_fingerprint

### 9. password_resets
- **Purpose**: Password reset tokens
- **Key Fields**:
  - id (PK)
  - user_id (FK)
  - token (unique)
  - expires_at
  - used
  - used_at
  - ip_address

### 10. email_logs
- **Purpose**: Track all emails sent
- **Key Fields**:
  - id (PK)
  - recipient_email
  - subject
  - template_name
  - status
  - sent_at
  - error_message

### 11. refunds
- **Purpose**: Refund requests and processing
- **Key Fields**:
  - id (PK)
  - booking_id (FK)
  - user_id (FK)
  - processed_by_id (FK)
  - refund_reference (unique)
  - amount
  - status (pending/approved/rejected/processing/completed/failed)
  - reason
  - stripe_refund_id
  - processing_fee
  - net_refund
  - requested_at, approved_at, processed_at, completed_at

### 12. special_requirements
- **Purpose**: Accessibility/dietary needs
- **Key Fields**:
  - id (PK)
  - booking_id (FK)
  - user_id (FK)
  - requirement_type (dietary/accessibility/medical/language/learning/other)
  - details
  - severity (low/medium/high)
  - requires_action
  - action_completed
  - handled_by_id (FK)
  - is_confidential
  - share_with_trainer

### 13. booking_inquiries
- **Purpose**: Pre-booking questions (already exists as SQL migration)
- **Key Fields**:
  - id (PK)
  - inquiry_reference (unique)
  - course_session_id (FK)
  - first_name, last_name, email, phone
  - number_of_people
  - questions
  - status
  - hold_expires_at

### 14. reports
- **Purpose**: Generated reports metadata
- **Key Fields**:
  - id (PK)
  - generated_by_id (FK)
  - report_type
  - report_name
  - parameters (JSON)
  - format (pdf/csv/excel/json)
  - status
  - start_date, end_date
  - file_url
  - is_scheduled
  - schedule_frequency

## Supporting Tables

### 15. certificates
- **Purpose**: Course completion certificates
- **Key Fields**:
  - id (PK)
  - booking_id (FK)
  - user_id (FK)
  - course_id (FK)
  - certificate_number (unique)
  - issue_date
  - expiry_date
  - pdf_url
  - status (active/expired/revoked)
  - created_by_id (FK), updated_by_id (FK)

### 16. trainers
- **Purpose**: Instructor information
- **Key Fields**:
  - id (PK)
  - user_id (FK, unique)
  - trainer_code (unique)
  - qualification_number
  - qualification_expiry
  - specializations (JSON)
  - bio
  - hourly_rate
  - is_active
  - is_available
  - can_travel
  - max_travel_miles
  - created_by_id (FK), updated_by_id (FK)

### 17. course_materials
- **Purpose**: Downloadable resources
- **Key Fields**:
  - id (PK)
  - course_id (FK)
  - title
  - description
  - material_type (pdf/video/presentation/document/link/quiz/assessment)
  - file_url
  - is_public
  - requires_completion
  - display_order
  - version
  - updated_by_id (FK)
  - created_by_id (FK), updated_by_id (FK)

### 18. attendance_records
- **Purpose**: Track who attended sessions
- **Key Fields**:
  - id (PK)
  - booking_id (FK)
  - course_session_id (FK)
  - user_id (FK)
  - marked_by_id (FK)
  - status (present/absent/late/partial/excused)
  - check_in_time, check_out_time
  - certificate_eligible
  - participation_score
  - passed_assessment
  - trainer_feedback

### 19. notifications
- **Purpose**: System notifications
- **Key Fields**:
  - id (PK)
  - user_id (FK)
  - type (booking_confirmed/reminder/cancelled/certificate_ready/etc)
  - title, message
  - priority (low/medium/high/urgent)
  - send_email, send_sms, show_in_app
  - status (pending/sent/delivered/failed/read)
  - booking_id (FK), course_id (FK)
  - action_url
  - expires_at
  - created_by_id (FK), updated_by_id (FK)

### 20. settings
- **Purpose**: System configuration
- **Key Fields**:
  - id (PK)
  - key (unique)
  - value
  - value_type (string/number/boolean/json/date)
  - category
  - display_name
  - description
  - is_public
  - is_editable
  - requires_restart
  - validation_rules (JSON)
  - default_value
  - updated_by_id (FK)

### 21. discount_codes
- **Purpose**: Promotional codes
- **Key Fields**:
  - id (PK)
  - code (unique)
  - discount_type
  - discount_value
  - is_active
  - valid_from, valid_until
  - usage_limit, usage_count

### 22. analytics_events
- **Purpose**: Track user actions
- **Key Fields**:
  - id (PK)
  - event_type
  - user_id (FK)
  - event_data (JSON)
  - created_at

## Indexes

All tables include appropriate indexes on:
- Primary keys
- Foreign keys
- Commonly queried fields (email, status, dates)
- Unique constraints where applicable

## Audit Fields

Most tables include:
- created_at, updated_at timestamps
- created_by_id, updated_by_id for audit trail

## Seed Data

1. **Admin User**:
   - Email: lex@reactfasttraining.co.uk
   - Password: LexOnly321! (bcrypt hashed)
   - Role: admin

2. **Courses**:
   - Emergency First Aid at Work (EFAW) - £75
   - First Aid at Work (FAW) - £95
   - Paediatric First Aid - £85

3. **Venues**:
   - Leeds City Centre Training Venue
   - Sheffield Business Park
   - Bradford Community Centre
   - York Conference Centre
   - Client On-Site Training

4. **System Settings**:
   - Business configuration
   - Booking rules
   - Email settings
   - Payment configuration
   - Certificate settings

## Migration Files

All migrations are located in: `/backend-loopback4/src/database/migrations/`

Run migrations with: `npm run migrate:latest`
Run seeds with: `npm run seed:run`
Full setup: `npm run setup:database`

## Production Notes

- Database: Heroku PostgreSQL Essential-0
- SSL: Required for all connections
- Backups: Automated daily at 02:00 Europe/London
- Size limit: 1GB
- Connection pooling: min 2, max 10