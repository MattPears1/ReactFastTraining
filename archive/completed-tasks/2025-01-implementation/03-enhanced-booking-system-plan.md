# Enhanced Booking System Implementation Plan

## Overview
The enhanced Booking system will integrate deeply with the Users system, creating a comprehensive customer relationship management solution. Each booking will be linked to a user profile, enabling lifetime customer tracking, personalized service, and advanced analytics.

## Database Schema Modifications

### 1. Enhanced Bookings Table
```sql
-- Modify existing bookings table to add user relationship
ALTER TABLE bookings ADD COLUMN user_id UUID REFERENCES users(id);
ALTER TABLE bookings ADD COLUMN created_by_user_id UUID REFERENCES users(id);
ALTER TABLE bookings ADD COLUMN source VARCHAR(50) DEFAULT 'website'; -- website, phone, email, walk-in
ALTER TABLE bookings ADD COLUMN referral_source VARCHAR(100); -- google, facebook, word-of-mouth, etc.
ALTER TABLE bookings ADD COLUMN booking_notes TEXT; -- Internal notes

-- Add indexes for performance
CREATE INDEX idx_bookings_user_id ON bookings(user_id);
CREATE INDEX idx_bookings_created_by ON bookings(created_by_user_id);
CREATE INDEX idx_bookings_source ON bookings(source);
```

### 2. Booking Communications Table
```sql
CREATE TABLE booking_communications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  booking_id UUID REFERENCES bookings(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id),
  
  -- Communication Details
  type VARCHAR(50) NOT NULL, -- confirmation, reminder, follow_up, certificate, cancellation
  channel VARCHAR(50) NOT NULL, -- email, sms, phone
  status VARCHAR(50) NOT NULL, -- pending, sent, delivered, failed, opened, clicked
  
  -- Content
  subject VARCHAR(255),
  content TEXT,
  template_used VARCHAR(100),
  
  -- Tracking
  sent_at TIMESTAMP,
  delivered_at TIMESTAMP,
  opened_at TIMESTAMP,
  clicked_at TIMESTAMP,
  failed_reason TEXT,
  
  -- Metadata
  created_by UUID REFERENCES users(id),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  
  INDEX idx_booking_comms (booking_id),
  INDEX idx_user_comms (user_id),
  INDEX idx_type_status (type, status)
);
```

### 3. Booking Groups Table (for corporate bookings)
```sql
CREATE TABLE booking_groups (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  group_reference VARCHAR(100) UNIQUE NOT NULL,
  
  -- Group Information
  company_id UUID REFERENCES users(id), -- Company user profile
  organizer_id UUID REFERENCES users(id), -- Person organizing
  
  -- Details
  group_name VARCHAR(255),
  total_participants INTEGER,
  
  -- Status
  status VARCHAR(50) DEFAULT 'active',
  
  -- Timestamps
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Link bookings to groups
ALTER TABLE bookings ADD COLUMN group_id UUID REFERENCES booking_groups(id);
```

### 4. Waiting Lists Table
```sql
CREATE TABLE waiting_lists (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  session_id UUID REFERENCES course_sessions(id),
  user_id UUID REFERENCES users(id),
  
  -- Priority
  position INTEGER NOT NULL,
  priority VARCHAR(50) DEFAULT 'normal', -- high, normal, low
  
  -- Contact Preferences
  preferred_contact_method VARCHAR(50),
  alternative_dates JSONB, -- Array of alternative dates
  
  -- Status
  status VARCHAR(50) DEFAULT 'waiting', -- waiting, offered, expired, booked
  offered_at TIMESTAMP,
  offer_expires_at TIMESTAMP,
  
  -- Notes
  notes TEXT,
  
  -- Timestamps
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  
  INDEX idx_session_position (session_id, position),
  INDEX idx_user_waiting (user_id),
  UNIQUE(session_id, user_id)
);
```

## Enhanced Booking Flow

### 1. New Booking with User Creation/Matching
```
1. Customer provides email during booking
2. System checks if user exists by email
3. If exists:
   - Link booking to existing user
   - Update user's last activity
   - Increment booking count
4. If new:
   - Create user profile from booking data
   - Link booking to new user
5. Process payment
6. Send confirmation
7. Update user statistics
```

### 2. Group Booking Flow
```
1. Corporate contact initiates group booking
2. Create/match company user profile
3. Create booking group
4. Add individual participants
5. Link each participant to user profiles
6. Track group payment
7. Send group confirmation
8. Individual participant communications
```

## Key Features

### 1. Customer History View
```javascript
// For any customer email, show:
- All previous bookings
- Attendance history
- Payment history
- Certificates earned
- Communication history
- Notes from staff
- Preferences and requirements
```

### 2. Smart Booking Management
- Automatic user profile creation
- Duplicate booking prevention
- Rebooking suggestions
- Loyalty tracking
- Automated follow-ups

### 3. Advanced Search & Filtering
- Find bookings by customer name/email
- Filter by course, date, status
- Search across multiple bookings
- Group booking management
- Export booking data

### 4. Communication Tracking
- Track all emails sent
- Monitor open/click rates
- Schedule automated reminders
- Personalized communications
- Communication history per booking

## Integration Enhancements

### User Profile Integration
```javascript
// When viewing a booking:
{
  booking: {
    id: "...",
    bookingReference: "REF123",
    // ... booking details
  },
  user: {
    id: "...",
    email: "customer@email.com",
    totalBookings: 5,
    lastBookingDate: "2024-01-15",
    totalSpent: 375.00,
    certificatesEarned: 4,
    upcomingBookings: 1
  },
  previousBookings: [...],
  notes: [...]
}
```

### Payment Integration
- Link all payments to user profiles
- Track payment methods per user
- Payment history in user view
- Automatic payment reconciliation

### Certificate Integration
- Certificates linked to both booking and user
- Expiry tracking per user
- Renewal reminders
- Compliance reporting

## API Endpoint Enhancements

### Booking Management
- `GET /api/admin/bookings` - Enhanced with user data
- `GET /api/admin/bookings/:id/user` - Get user for booking
- `GET /api/admin/bookings/:id/communications` - Communication history
- `POST /api/admin/bookings/:id/send-email` - Send communication
- `GET /api/admin/bookings/groups` - List booking groups
- `POST /api/admin/bookings/groups` - Create booking group

### Waiting List Management
- `GET /api/admin/sessions/:id/waiting-list` - Get waiting list
- `POST /api/admin/waiting-lists` - Add to waiting list
- `PUT /api/admin/waiting-lists/:id/offer` - Offer spot
- `DELETE /api/admin/waiting-lists/:id` - Remove from list

### Customer Portal
- `GET /api/customer/bookings` - Get all bookings for email
- `GET /api/customer/upcoming` - Upcoming bookings
- `GET /api/customer/history` - Booking history
- `PUT /api/customer/bookings/:id/cancel` - Cancel booking

## Reporting Enhancements

### Customer Analytics
- Booking frequency reports
- Customer lifetime value
- Retention analysis
- Popular courses by customer segment
- Geographic analysis

### Operational Reports
- Capacity utilization
- Waiting list analysis
- Cancellation patterns
- No-show tracking
- Revenue by source

## Implementation Priority

### Phase 1 (Immediate)
1. Add user_id to bookings table
2. Create user profiles for existing bookings
3. Update booking creation to link users
4. Basic customer history view

### Phase 2 (Next Sprint)
1. Communication tracking
2. Waiting list functionality
3. Group booking support
4. Enhanced search/filtering

### Phase 3 (Future)
1. Advanced analytics
2. Automated marketing
3. Loyalty program
4. Mobile app integration

## Data Migration Strategy

### Linking Existing Bookings to Users
```sql
-- 1. Create users from unique emails in bookings
INSERT INTO users (email, first_name, last_name, phone, created_at)
SELECT DISTINCT 
  contactDetails->>'email' as email,
  contactDetails->>'firstName' as first_name,
  contactDetails->>'lastName' as last_name,
  contactDetails->>'phone' as phone,
  MIN(created_at) as created_at
FROM bookings
GROUP BY 
  contactDetails->>'email',
  contactDetails->>'firstName',
  contactDetails->>'lastName',
  contactDetails->>'phone';

-- 2. Update bookings with user_id
UPDATE bookings b
SET user_id = u.id
FROM users u
WHERE b.contactDetails->>'email' = u.email;

-- 3. Update user statistics
UPDATE users u
SET 
  total_bookings = stats.count,
  total_spent = stats.total,
  first_booking_date = stats.first_date,
  last_booking_date = stats.last_date
FROM (
  SELECT 
    user_id,
    COUNT(*) as count,
    SUM(finalAmount) as total,
    MIN(created_at) as first_date,
    MAX(created_at) as last_date
  FROM bookings
  WHERE user_id IS NOT NULL
  GROUP BY user_id
) stats
WHERE u.id = stats.user_id;
```

## Benefits of Integration

### For Staff
- Complete customer view
- Faster booking process
- Better customer service
- Reduced duplicate data
- Automated workflows

### For Customers
- Personalized experience
- Easy rebooking
- Booking history access
- Certificate management
- Better communications

### For Business
- Customer insights
- Improved retention
- Targeted marketing
- Revenue optimization
- Operational efficiency