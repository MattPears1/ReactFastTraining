# Database Schema Design

## Overview

PostgreSQL database schema for React Fast Training administration system, managed with Knex.js migrations.

## Tables

### 1. users (Extended)
```sql
CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    first_name VARCHAR(100),
    last_name VARCHAR(100),
    phone VARCHAR(20),
    role VARCHAR(20) DEFAULT 'customer' CHECK (role IN ('customer', 'admin', 'instructor')),
    is_active BOOLEAN DEFAULT true,
    last_login TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_role ON users(role);
```

### 2. courses
```sql
CREATE TABLE courses (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    course_type VARCHAR(50) NOT NULL CHECK (course_type IN ('EFAW', 'FAW', 'Paediatric')),
    duration_hours DECIMAL(4,2) NOT NULL,
    price DECIMAL(10,2) NOT NULL,
    max_capacity INTEGER NOT NULL DEFAULT 12,
    certification_validity_years INTEGER DEFAULT 3,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_courses_type ON courses(course_type);
CREATE INDEX idx_courses_active ON courses(is_active);
```

### 3. venues
```sql
CREATE TABLE venues (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    address_line1 VARCHAR(255) NOT NULL,
    address_line2 VARCHAR(255),
    city VARCHAR(100) NOT NULL,
    postcode VARCHAR(10) NOT NULL,
    capacity INTEGER NOT NULL,
    facilities JSONB DEFAULT '{}',
    parking_info TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_venues_city ON venues(city);
CREATE INDEX idx_venues_active ON venues(is_active);
```

### 4. course_schedules
```sql
CREATE TABLE course_schedules (
    id SERIAL PRIMARY KEY,
    course_id INTEGER NOT NULL REFERENCES courses(id),
    venue_id INTEGER NOT NULL REFERENCES venues(id),
    instructor_id INTEGER REFERENCES users(id),
    start_datetime TIMESTAMP NOT NULL,
    end_datetime TIMESTAMP NOT NULL,
    status VARCHAR(20) DEFAULT 'draft' CHECK (status IN ('draft', 'published', 'full', 'cancelled')),
    current_capacity INTEGER DEFAULT 0,
    notes TEXT,
    created_by INTEGER REFERENCES users(id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_schedules_course ON course_schedules(course_id);
CREATE INDEX idx_schedules_venue ON course_schedules(venue_id);
CREATE INDEX idx_schedules_date ON course_schedules(start_datetime);
CREATE INDEX idx_schedules_status ON course_schedules(status);
```

### 5. bookings
```sql
CREATE TABLE bookings (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id),
    course_schedule_id INTEGER NOT NULL REFERENCES course_schedules(id),
    booking_reference VARCHAR(20) UNIQUE NOT NULL,
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'cancelled', 'completed', 'no_show')),
    payment_status VARCHAR(20) DEFAULT 'pending' CHECK (payment_status IN ('pending', 'paid', 'refunded', 'failed')),
    payment_amount DECIMAL(10,2) NOT NULL,
    discount_applied DECIMAL(10,2) DEFAULT 0,
    discount_code_id INTEGER REFERENCES discount_codes(id),
    notes TEXT,
    confirmation_sent BOOLEAN DEFAULT false,
    reminder_sent BOOLEAN DEFAULT false,
    certificate_issued BOOLEAN DEFAULT false,
    certificate_issued_date DATE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_bookings_user ON bookings(user_id);
CREATE INDEX idx_bookings_schedule ON bookings(course_schedule_id);
CREATE INDEX idx_bookings_reference ON bookings(booking_reference);
CREATE INDEX idx_bookings_status ON bookings(status);
CREATE INDEX idx_bookings_payment_status ON bookings(payment_status);
```

### 6. discount_codes
```sql
CREATE TABLE discount_codes (
    id SERIAL PRIMARY KEY,
    code VARCHAR(50) UNIQUE NOT NULL,
    description TEXT,
    discount_type VARCHAR(20) NOT NULL CHECK (discount_type IN ('percentage', 'fixed')),
    discount_value DECIMAL(10,2) NOT NULL,
    min_purchase_amount DECIMAL(10,2),
    valid_from DATE NOT NULL,
    valid_until DATE NOT NULL,
    usage_limit INTEGER,
    times_used INTEGER DEFAULT 0,
    course_type_restriction VARCHAR(50),
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_discounts_code ON discount_codes(code);
CREATE INDEX idx_discounts_active ON discount_codes(is_active);
CREATE INDEX idx_discounts_validity ON discount_codes(valid_from, valid_until);
```

### 7. payment_transactions
```sql
CREATE TABLE payment_transactions (
    id SERIAL PRIMARY KEY,
    booking_id INTEGER NOT NULL REFERENCES bookings(id),
    amount DECIMAL(10,2) NOT NULL,
    currency VARCHAR(3) DEFAULT 'GBP',
    payment_method VARCHAR(50) NOT NULL,
    stripe_payment_intent_id VARCHAR(255),
    stripe_charge_id VARCHAR(255),
    status VARCHAR(20) NOT NULL CHECK (status IN ('pending', 'succeeded', 'failed', 'refunded')),
    failure_reason TEXT,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_payments_booking ON payment_transactions(booking_id);
CREATE INDEX idx_payments_stripe_intent ON payment_transactions(stripe_payment_intent_id);
CREATE INDEX idx_payments_status ON payment_transactions(status);
```

### 8. analytics_events
```sql
CREATE TABLE analytics_events (
    id SERIAL PRIMARY KEY,
    event_type VARCHAR(50) NOT NULL,
    user_id INTEGER REFERENCES users(id),
    session_id VARCHAR(100),
    page_url TEXT,
    referrer_url TEXT,
    event_data JSONB DEFAULT '{}',
    ip_address INET,
    user_agent TEXT,
    device_type VARCHAR(20),
    browser VARCHAR(50),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_analytics_type ON analytics_events(event_type);
CREATE INDEX idx_analytics_user ON analytics_events(user_id);
CREATE INDEX idx_analytics_session ON analytics_events(session_id);
CREATE INDEX idx_analytics_created ON analytics_events(created_at);
CREATE INDEX idx_analytics_page ON analytics_events(page_url);
```

### 9. admin_activity_logs
```sql
CREATE TABLE admin_activity_logs (
    id SERIAL PRIMARY KEY,
    admin_id INTEGER NOT NULL REFERENCES users(id),
    action VARCHAR(100) NOT NULL,
    entity_type VARCHAR(50),
    entity_id INTEGER,
    old_values JSONB,
    new_values JSONB,
    ip_address INET,
    user_agent TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_activity_admin ON admin_activity_logs(admin_id);
CREATE INDEX idx_activity_action ON admin_activity_logs(action);
CREATE INDEX idx_activity_entity ON admin_activity_logs(entity_type, entity_id);
CREATE INDEX idx_activity_created ON admin_activity_logs(created_at);
```

### 10. email_logs
```sql
CREATE TABLE email_logs (
    id SERIAL PRIMARY KEY,
    recipient_email VARCHAR(255) NOT NULL,
    email_type VARCHAR(50) NOT NULL,
    subject VARCHAR(255),
    booking_id INTEGER REFERENCES bookings(id),
    status VARCHAR(20) DEFAULT 'sent' CHECK (status IN ('sent', 'failed', 'bounced')),
    error_message TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_email_recipient ON email_logs(recipient_email);
CREATE INDEX idx_email_type ON email_logs(email_type);
CREATE INDEX idx_email_booking ON email_logs(booking_id);
CREATE INDEX idx_email_created ON email_logs(created_at);
```

## Relationships

### Primary Relationships
1. **Users → Bookings**: One-to-Many
2. **Course Schedules → Bookings**: One-to-Many
3. **Courses → Course Schedules**: One-to-Many
4. **Venues → Course Schedules**: One-to-Many
5. **Bookings → Payment Transactions**: One-to-Many
6. **Discount Codes → Bookings**: One-to-Many

### Key Business Rules
1. A booking cannot exceed the course schedule's max capacity
2. Course schedules cannot overlap at the same venue
3. Discount codes must be valid at the time of booking
4. Payment must be confirmed before booking is confirmed
5. Certificates can only be issued after course completion

## Indexes Strategy

### Performance Indexes
- Foreign key columns for JOIN operations
- Status fields for filtering
- Date/timestamp fields for range queries
- Email and reference fields for lookups

### Composite Indexes (if needed)
```sql
-- For finding available schedules
CREATE INDEX idx_schedules_available ON course_schedules(start_datetime, status) 
WHERE status IN ('published', 'full');

-- For revenue reports
CREATE INDEX idx_bookings_revenue ON bookings(created_at, payment_status, payment_amount)
WHERE payment_status = 'paid';
```

## Data Integrity Constraints

### Check Constraints
- Course duration must be positive
- Prices must be non-negative
- Capacities must be positive
- Dates must be logical (end after start)
- Discount values within reasonable ranges

### Unique Constraints
- User emails
- Booking references
- Discount codes
- Course schedule time/venue combinations

## Migration Notes

1. **Incremental Approach**: Each table in separate migration file
2. **Rollback Safety**: All migrations must have down() methods
3. **Data Seeding**: Separate seed files for test data
4. **Version Control**: Timestamp-based migration naming
5. **Testing**: Run migrations on test database first