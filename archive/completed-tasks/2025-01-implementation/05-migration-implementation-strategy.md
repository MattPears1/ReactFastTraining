# Migration & Implementation Strategy

## Overview
This document outlines the step-by-step migration strategy to implement the new Users, Payment, and enhanced Booking systems while preserving all existing data and maintaining system availability.

## Implementation Phases

### Phase 1: Foundation (Week 1)
**Goal**: Set up core infrastructure without breaking existing functionality

#### 1.1 Database Preparation
```sql
-- Enable UUID extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create new tables without foreign key constraints first
CREATE TABLE users_new (...);
CREATE TABLE payments (...);
CREATE TABLE refunds (...);
CREATE TABLE payment_events (...);
CREATE TABLE user_activity_logs (...);
CREATE TABLE user_notes (...);
```

#### 1.2 Data Migration Scripts
```javascript
// Script 1: Extract unique users from bookings
async function extractUsers() {
  const uniqueEmails = await db.query(`
    SELECT DISTINCT 
      contactDetails->>'email' as email,
      contactDetails->>'firstName' as first_name,
      contactDetails->>'lastName' as last_name,
      contactDetails->>'phone' as phone,
      contactDetails->>'company' as company_name,
      MIN(createdAt) as created_at
    FROM bookings
    WHERE contactDetails->>'email' IS NOT NULL
    GROUP BY 
      contactDetails->>'email',
      contactDetails->>'firstName',
      contactDetails->>'lastName',
      contactDetails->>'phone',
      contactDetails->>'company'
  `);
  
  // Insert into users table
  for (const user of uniqueEmails) {
    await createOrUpdateUser(user);
  }
}

// Script 2: Link bookings to users
async function linkBookingsToUsers() {
  const bookings = await db.query('SELECT * FROM bookings');
  
  for (const booking of bookings) {
    const email = booking.contactDetails.email;
    const user = await findUserByEmail(email);
    
    if (user) {
      await db.query(
        'UPDATE bookings SET user_id = $1 WHERE id = $2',
        [user.id, booking.id]
      );
    }
  }
}
```

### Phase 2: Payment System (Week 2)
**Goal**: Implement payment tracking without disrupting current flow

#### 2.1 Create Payment Records for Existing Bookings
```javascript
async function migratePaymentHistory() {
  const paidBookings = await db.query(`
    SELECT * FROM bookings 
    WHERE status IN ('PAID', 'COMPLETED', 'ATTENDED')
  `);
  
  for (const booking of paidBookings) {
    await createPaymentRecord({
      booking_id: booking.id,
      user_id: booking.user_id,
      amount: booking.finalAmount,
      status: 'succeeded',
      payment_date: booking.paymentDate || booking.createdAt,
      payment_method: booking.paymentMethod || 'card',
      payment_reference: `MIGRATED-${booking.bookingReference}`
    });
  }
}
```

#### 2.2 Implement Stripe Webhook Handler
```javascript
// New webhook endpoint
app.post('/api/webhooks/stripe', async (req, res) => {
  const event = req.body;
  
  switch (event.type) {
    case 'payment_intent.succeeded':
      await handlePaymentSuccess(event);
      break;
    case 'charge.refunded':
      await handleRefund(event);
      break;
    // ... other events
  }
});
```

### Phase 3: User Statistics (Week 3)
**Goal**: Calculate and maintain user statistics

#### 3.1 Calculate Initial Statistics
```sql
-- Update user statistics from historical data
UPDATE users u
SET 
  total_bookings = stats.booking_count,
  total_spent = stats.total_amount,
  first_booking_date = stats.first_date,
  last_booking_date = stats.last_date,
  last_activity_date = stats.last_date
FROM (
  SELECT 
    user_id,
    COUNT(*) as booking_count,
    SUM(finalAmount) as total_amount,
    MIN(createdAt) as first_date,
    MAX(createdAt) as last_date
  FROM bookings
  WHERE user_id IS NOT NULL
  GROUP BY user_id
) stats
WHERE u.id = stats.user_id;
```

#### 3.2 Implement Real-time Updates
```javascript
// Booking created trigger
async function onBookingCreated(booking) {
  await updateUserStats(booking.user_id, {
    incrementBookings: 1,
    addToSpent: booking.finalAmount,
    updateLastBooking: booking.createdAt
  });
}

// Payment completed trigger
async function onPaymentCompleted(payment) {
  await logUserActivity(payment.user_id, 'payment_completed', payment.id);
}
```

### Phase 4: API Migration (Week 4)
**Goal**: Update APIs to use new data structure

#### 4.1 Backward Compatible APIs
```javascript
// Old endpoint continues to work
app.get('/api/admin/bookings', async (req, res) => {
  const bookings = await getBookingsWithUsers(); // Enhanced query
  
  // Transform to include user data while maintaining old structure
  const enhanced = bookings.map(booking => ({
    ...booking,
    // Old fields still present
    customerName: `${booking.contactDetails.firstName} ${booking.contactDetails.lastName}`,
    customerEmail: booking.contactDetails.email,
    // New user data available
    user: booking.user ? {
      id: booking.user.id,
      totalBookings: booking.user.total_bookings,
      totalSpent: booking.user.total_spent
    } : null
  }));
  
  res.json(enhanced);
});
```

#### 4.2 New Endpoints
```javascript
// New user-centric endpoints
app.get('/api/admin/users', getUserList);
app.get('/api/admin/users/:id', getUserDetails);
app.get('/api/admin/users/:id/bookings', getUserBookings);
app.get('/api/admin/users/:id/payments', getUserPayments);
```

### Phase 5: UI Updates (Week 5)
**Goal**: Update admin interface to use new features

#### 5.1 Progressive Enhancement
1. Add user lookup to booking form
2. Show user history in booking details
3. Add user management page
4. Implement payment history view
5. Add communication tracking

### Phase 6: Cleanup & Optimization (Week 6)
**Goal**: Remove old code and optimize performance

#### 6.1 Database Cleanup
```sql
-- Add missing indexes
CREATE INDEX idx_bookings_user_id ON bookings(user_id);
CREATE INDEX idx_payments_user_id ON payments(user_id);
CREATE INDEX idx_users_email ON users(email);

-- Clean up duplicate data
DELETE FROM users 
WHERE id NOT IN (
  SELECT MIN(id) 
  FROM users 
  GROUP BY LOWER(email)
);
```

## Rollback Strategy

### Database Rollback
```sql
-- Keep backup tables during migration
CREATE TABLE bookings_backup AS SELECT * FROM bookings;
CREATE TABLE users_backup AS SELECT * FROM users;

-- Rollback script if needed
DROP TABLE IF EXISTS users CASCADE;
ALTER TABLE users_backup RENAME TO users;
```

### Code Rollback
- Use feature flags for new functionality
- Keep old code paths during transition
- Git tags for each phase completion

## Testing Strategy

### 1. Unit Tests
```javascript
describe('User Migration', () => {
  test('creates user from booking data', async () => {
    const booking = createTestBooking();
    const user = await extractUserFromBooking(booking);
    expect(user.email).toBe(booking.contactDetails.email);
  });
  
  test('handles duplicate emails', async () => {
    // Test deduplication logic
  });
});
```

### 2. Integration Tests
- Test payment webhook handling
- Test user statistics calculation
- Test booking-user linking
- Test API backwards compatibility

### 3. Performance Tests
- Load test with migrated data
- Query performance benchmarks
- API response time checks

## Monitoring During Migration

### 1. Migration Progress Dashboard
```sql
-- Monitor migration status
SELECT 
  'Total Bookings' as metric,
  COUNT(*) as count
FROM bookings
UNION ALL
SELECT 
  'Bookings with Users' as metric,
  COUNT(*) as count
FROM bookings
WHERE user_id IS NOT NULL
UNION ALL
SELECT 
  'Total Users Created' as metric,
  COUNT(*) as count
FROM users;
```

### 2. Error Tracking
- Log all migration errors
- Monitor for data inconsistencies
- Track failed webhook events
- Alert on anomalies

## Go-Live Checklist

### Pre-Migration
- [ ] Full database backup
- [ ] Test migration scripts on staging
- [ ] Review rollback procedures
- [ ] Notify team of maintenance window

### During Migration
- [ ] Run migration scripts in order
- [ ] Verify data integrity at each step
- [ ] Test critical user flows
- [ ] Monitor error logs

### Post-Migration
- [ ] Verify all bookings have users
- [ ] Check payment records created
- [ ] Test new API endpoints
- [ ] Update documentation
- [ ] Remove feature flags
- [ ] Archive backup tables

## Success Metrics

### Technical Metrics
- 100% of bookings linked to users
- All historical payments recorded
- Zero data loss
- API response times maintained

### Business Metrics
- Customer lookup time reduced by 80%
- Support ticket resolution improved
- Repeat booking rate visible
- Revenue per customer trackable

## Timeline Summary

| Week | Phase | Key Deliverables |
|------|-------|-----------------|
| 1 | Foundation | Database schema, User extraction |
| 2 | Payments | Payment history, Stripe integration |
| 3 | Statistics | User metrics, Activity tracking |
| 4 | APIs | New endpoints, Backwards compatibility |
| 5 | UI | Admin interface updates |
| 6 | Cleanup | Optimization, Documentation |

## Risk Mitigation

### High Risk Areas
1. **Email duplicates**: Implement careful deduplication
2. **Payment data**: Maintain audit trail
3. **Performance**: Add indexes before go-live
4. **User confusion**: Clear communication plan

### Contingency Plans
1. Phased rollout by user role
2. Parallel run of old and new systems
3. Quick rollback procedures
4. 24/7 monitoring during transition