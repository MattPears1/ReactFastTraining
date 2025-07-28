# Users System Implementation Plan

## Overview
The Users system will serve as the central customer management system for React Fast Training, tracking all customers, administrators, and instructors. Email will be the primary unique identifier, allowing us to track booking history, payment history, and customer interactions over time.

## Database Schema

### 1. Enhanced Users Table
```sql
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email VARCHAR(255) UNIQUE NOT NULL,
  
  -- Personal Information
  first_name VARCHAR(100),
  last_name VARCHAR(100),
  phone VARCHAR(20),
  mobile VARCHAR(20),
  date_of_birth DATE,
  
  -- Address Information
  address_line_1 VARCHAR(255),
  address_line_2 VARCHAR(255),
  city VARCHAR(100),
  county VARCHAR(100),
  postcode VARCHAR(10),
  country VARCHAR(100) DEFAULT 'UK',
  
  -- Company Information (for corporate customers)
  company_name VARCHAR(255),
  company_role VARCHAR(100),
  company_department VARCHAR(100),
  vat_number VARCHAR(50),
  
  -- User Type & Status
  role VARCHAR(50) DEFAULT 'customer', -- customer, admin, instructor
  status VARCHAR(50) DEFAULT 'active', -- active, inactive, suspended
  customer_type VARCHAR(50) DEFAULT 'individual', -- individual, corporate
  
  -- Activity Tracking
  first_booking_date TIMESTAMP,
  last_booking_date TIMESTAMP,
  total_bookings INTEGER DEFAULT 0,
  total_spent DECIMAL(10,2) DEFAULT 0.00,
  last_activity_date TIMESTAMP,
  
  -- Communication Preferences
  marketing_consent BOOLEAN DEFAULT false,
  sms_consent BOOLEAN DEFAULT false,
  newsletter_subscribed BOOLEAN DEFAULT true,
  preferred_contact_method VARCHAR(50) DEFAULT 'email', -- email, phone, sms
  
  -- Emergency Contact (for safety)
  emergency_contact_name VARCHAR(100),
  emergency_contact_phone VARCHAR(20),
  emergency_contact_relationship VARCHAR(50),
  
  -- Medical Information (optional)
  has_medical_conditions BOOLEAN DEFAULT false,
  medical_notes TEXT,
  dietary_requirements TEXT,
  
  -- Authentication (only for admin/instructor)
  password_hash VARCHAR(255), -- NULL for customers
  last_login TIMESTAMP,
  failed_login_attempts INTEGER DEFAULT 0,
  account_locked_until TIMESTAMP,
  
  -- System Fields
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  created_by UUID REFERENCES users(id),
  notes TEXT,
  
  -- Indexes
  INDEX idx_email (email),
  INDEX idx_role (role),
  INDEX idx_status (status),
  INDEX idx_company_name (company_name),
  INDEX idx_last_activity (last_activity_date)
);
```

### 2. User Activity Log Table
```sql
CREATE TABLE user_activity_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  activity_type VARCHAR(100) NOT NULL, -- booking_created, payment_made, certificate_issued, etc.
  activity_description TEXT,
  related_entity_type VARCHAR(50), -- booking, payment, certificate
  related_entity_id UUID,
  ip_address VARCHAR(45),
  user_agent TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  
  INDEX idx_user_activity (user_id, created_at),
  INDEX idx_activity_type (activity_type)
);
```

### 3. User Notes Table (for admin use)
```sql
CREATE TABLE user_notes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  note_type VARCHAR(50), -- general, complaint, compliment, medical, special_requirement
  note_content TEXT NOT NULL,
  is_internal BOOLEAN DEFAULT true, -- internal notes not visible to customer
  created_by UUID REFERENCES users(id),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  
  INDEX idx_user_notes (user_id, created_at)
);
```

## User Roles & Permissions

### Customer Role
- Can view their own booking history
- Can update their personal information
- Can download certificates
- Can view payment history
- No login required (access via booking reference + email)

### Administrator Role
- Full access to all customer data
- Can create/edit/delete bookings
- Can process refunds
- Can generate reports
- Can manage other users
- Can view all activity logs
- Requires login authentication

### Instructor Role
- Can view attendee lists for their sessions
- Can mark attendance
- Can add session notes
- Can view limited customer information
- Cannot process payments or refunds
- Requires login authentication

## Key Features

### 1. Customer Profile Management
- Automatic profile creation on first booking
- Profile enrichment with each booking
- Merge duplicate profiles by email
- Track customer lifetime value
- Monitor booking patterns

### 2. Activity Tracking
- Log all customer interactions
- Track booking history
- Monitor payment history
- Record certificate downloads
- Track email communications

### 3. Search & Filtering
- Search by name, email, phone
- Filter by role, status, activity
- Sort by last activity, total bookings, total spent
- Advanced search with multiple criteria

### 4. Customer Insights
- Total bookings count
- Total amount spent
- Average booking value
- Preferred courses
- Booking frequency
- Certificate expiry tracking

## Integration Points

### With Booking System
- Link bookings to user profiles
- Update user stats on booking
- Track booking patterns
- Handle group bookings

### With Payment System
- Link payments to user profiles
- Track payment methods
- Monitor payment issues
- Calculate lifetime value

### With Certificate System
- Link certificates to users
- Track expiry dates
- Send renewal reminders
- Monitor compliance

## Data Migration Strategy

### For Existing Bookings
1. Extract unique emails from booking.contactDetails
2. Create user profiles for each unique email
3. Link existing bookings to user profiles
4. Calculate historical stats
5. Preserve all existing data

### Deduplication Process
1. Identify duplicate emails
2. Merge profiles keeping most recent data
3. Combine booking histories
4. Sum financial totals
5. Log merge operations

## API Endpoints

### User Management
- `GET /api/admin/users` - List all users with filters
- `GET /api/admin/users/:id` - Get user details
- `POST /api/admin/users` - Create new user
- `PUT /api/admin/users/:id` - Update user
- `GET /api/admin/users/:id/bookings` - Get user bookings
- `GET /api/admin/users/:id/payments` - Get user payments
- `GET /api/admin/users/:id/certificates` - Get user certificates
- `GET /api/admin/users/:id/activity` - Get user activity log
- `POST /api/admin/users/:id/notes` - Add user note

### Customer Portal (no auth required)
- `POST /api/customer/lookup` - Lookup by email + booking ref
- `GET /api/customer/bookings` - Get customer bookings
- `GET /api/customer/certificates` - Get customer certificates
- `PUT /api/customer/profile` - Update customer profile

## Implementation Priority

### Phase 1 (Immediate)
1. Create users table
2. Migrate existing booking data
3. Link bookings to users
4. Basic admin UI for user management

### Phase 2 (Next Sprint)
1. Activity logging system
2. User notes functionality
3. Advanced search/filtering
4. Customer portal access

### Phase 3 (Future)
1. Automated insights/reporting
2. Marketing segmentation
3. Loyalty program integration
4. Mobile app user profiles

## Security Considerations
- Email validation on all inputs
- Rate limiting on lookups
- Audit trail for all changes
- GDPR compliance for data storage
- Secure password hashing for admin/instructor
- Session management for authenticated users
- PII encryption at rest