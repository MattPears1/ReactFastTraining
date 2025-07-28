# System Architecture & Data Flow

## Overview
This document outlines the complete data architecture and flow between the Users, Bookings, Payments, and related systems for React Fast Training.

## Entity Relationship Diagram

```
┌─────────────────┐
│     USERS       │
│─────────────────│
│ id (PK)         │
│ email (unique)  │
│ first_name      │
│ last_name       │
│ role            │
│ company_name    │
│ total_bookings  │
│ total_spent     │
└────────┬────────┘
         │
         │ 1:N
         │
┌────────▼────────┐     ┌──────────────────┐
│    BOOKINGS     │     │  COURSE_SESSIONS │
│─────────────────│     │──────────────────│
│ id (PK)         │◄────│ id (PK)          │
│ user_id (FK)    │ N:1 │ course_id (FK)   │
│ session_id (FK) │     │ trainer_id (FK)  │
│ booking_ref     │     │ location_id (FK) │
│ status          │     │ date             │
│ total_amount    │     │ capacity         │
└────┬──────┬─────┘     └──────────────────┘
     │      │
     │ 1:N  │ 1:N
     │      │
┌────▼───┐  └────┐      ┌──────────────────┐
│PAYMENTS│       │      │   CERTIFICATES   │
│────────│       │      │──────────────────│
│id (PK) │       └─────►│ id (PK)          │
│booking │              │ booking_id (FK)  │
│user_id │              │ user_id (FK)     │
│amount  │              │ issued_date      │
│status  │              │ expiry_date      │
└───┬────┘              └──────────────────┘
    │
    │ 1:N
    │
┌───▼────┐
│REFUNDS │
│────────│
│id (PK) │
│payment │
│amount  │
└────────┘
```

## Core Data Relationships

### 1. User-Centric Architecture
```
USER (1) ─────► BOOKINGS (N)
     │
     ├─────────► PAYMENTS (N)
     │
     ├─────────► CERTIFICATES (N)
     │
     ├─────────► ACTIVITY_LOGS (N)
     │
     └─────────► USER_NOTES (N)
```

### 2. Booking Flow Relationships
```
BOOKING ◄──── USER (customer)
   │
   ├──────► COURSE_SESSION
   │
   ├──────► PAYMENTS (1:N for partials)
   │
   ├──────► CERTIFICATES (1:N for groups)
   │
   └──────► COMMUNICATIONS (1:N)
```

### 3. Payment Flow Relationships
```
PAYMENT ◄──── BOOKING
   │
   ├──────► USER
   │
   ├──────► REFUNDS (1:N for partials)
   │
   └──────► PAYMENT_EVENTS (1:N)
```

## Data Flow Scenarios

### 1. New Customer Booking Flow
```
1. Customer fills booking form
   └─► Check if email exists in USERS
       ├─► NO: Create new USER record
       └─► YES: Link to existing USER
   
2. Create BOOKING record
   └─► Link to USER
   └─► Link to COURSE_SESSION
   └─► Set status = 'PENDING'
   
3. Process payment via Stripe
   └─► Create PAYMENT record
   └─► Link to BOOKING and USER
   
4. On successful payment
   └─► Update PAYMENT status = 'SUCCEEDED'
   └─► Update BOOKING status = 'PAID'
   └─► Update USER totals
   └─► Create COMMUNICATION record
   └─► Send confirmation email
```

### 2. Returning Customer Flow
```
1. Customer provides email
   └─► Lookup USER by email
   └─► Display booking history
   └─► Pre-fill form data
   
2. Customer selects new course
   └─► Create new BOOKING
   └─► Suggest saved payment method
   
3. Complete booking
   └─► Update USER statistics
   └─► Check for loyalty benefits
```

### 3. Group Booking Flow
```
1. Corporate contact initiates
   └─► Create/find company USER
   └─► Create BOOKING_GROUP
   
2. Add participants
   └─► Create/find USER for each
   └─► Create individual BOOKINGS
   └─► Link to BOOKING_GROUP
   
3. Process group payment
   └─► Single PAYMENT record
   └─► Link to all BOOKINGS
```

### 4. Certificate Generation Flow
```
1. Course completion
   └─► Mark attendance in BOOKINGS
   
2. Generate certificates
   └─► Create CERTIFICATE records
   └─► Link to USER and BOOKING
   └─► Set expiry date
   
3. Send certificates
   └─► Create COMMUNICATION record
   └─► Update USER activity
```

### 5. Refund Processing Flow
```
1. Admin initiates refund
   └─► Create REFUND record
   └─► Link to PAYMENT
   
2. Process via Stripe
   └─► Update REFUND status
   └─► Create PAYMENT_EVENT
   
3. Update related records
   └─► Update PAYMENT status
   └─► Update BOOKING if cancelled
   └─► Update USER totals
   └─► Send notification
```

## Key Integrity Rules

### 1. User Integrity
- Email must be unique
- Cannot delete USER with bookings
- Role changes require audit log
- Customer users don't need passwords

### 2. Booking Integrity
- Must have valid USER
- Must have valid SESSION
- Cannot exceed session capacity
- Status transitions must be valid

### 3. Payment Integrity
- Must link to valid BOOKING
- Must link to valid USER
- Refunds cannot exceed payment
- All changes logged in events

### 4. Data Consistency
- User totals updated automatically
- Session availability real-time
- Payment status synced with Stripe
- Certificate expiry tracked

## API Data Flow

### 1. Customer Portal API
```
GET /api/customer/lookup
└─► Query USERS by email
    └─► Return user profile
    
GET /api/customer/bookings
└─► Query BOOKINGS by user_id
    └─► Include PAYMENTS status
    └─► Include CERTIFICATES
```

### 2. Admin API
```
GET /api/admin/users/:id
└─► Get USER with statistics
    └─► Include recent BOOKINGS
    └─► Include PAYMENT history
    └─► Include NOTES
    
POST /api/admin/bookings
└─► Create/match USER
    └─► Create BOOKING
    └─► Initialize PAYMENT
    └─► Update availability
```

### 3. Webhook Processing
```
POST /api/webhooks/stripe
└─► Parse Stripe event
    └─► Update PAYMENT status
    └─► Update BOOKING status
    └─► Log PAYMENT_EVENT
    └─► Trigger side effects
```

## Performance Considerations

### 1. Indexes Required
```sql
-- User lookups
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_role ON users(role);

-- Booking queries
CREATE INDEX idx_bookings_user ON bookings(user_id);
CREATE INDEX idx_bookings_session ON bookings(session_id);
CREATE INDEX idx_bookings_status ON bookings(status);

-- Payment lookups
CREATE INDEX idx_payments_booking ON payments(booking_id);
CREATE INDEX idx_payments_user ON payments(user_id);
CREATE INDEX idx_payments_stripe ON payments(stripe_payment_intent_id);
```

### 2. Caching Strategy
- Cache user profiles (5 min)
- Cache session availability (1 min)
- Cache payment methods (10 min)
- Invalidate on updates

### 3. Query Optimization
- Use database views for complex joins
- Implement pagination for lists
- Lazy load related data
- Batch update operations

## Security & Compliance

### 1. Data Access Control
```
Customer Role:
└─► Own USER profile (read/update)
└─► Own BOOKINGS (read only)
└─► Own CERTIFICATES (read only)

Admin Role:
└─► All USERS (full access)
└─► All BOOKINGS (full access)
└─► All PAYMENTS (full access)

Instructor Role:
└─► Session BOOKINGS (read only)
└─► Limited USER info (read only)
```

### 2. PII Protection
- Encrypt sensitive fields at rest
- Mask payment details
- Audit all access
- GDPR compliance tools

### 3. Data Retention
- Active data: Indefinite
- Payment data: 7 years
- Certificates: 3 years after expiry
- Activity logs: 2 years

## Monitoring & Alerts

### 1. Data Quality Checks
- Duplicate user detection
- Orphaned booking detection
- Payment reconciliation
- Certificate expiry warnings

### 2. System Health
- Database connection pool
- API response times
- Webhook processing delays
- Payment success rates

### 3. Business Metrics
- Daily booking counts
- Payment success rates
- User growth rate
- Certificate renewal rate