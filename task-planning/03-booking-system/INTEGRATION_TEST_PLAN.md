# Booking System Integration Test Plan

## Overview
This test plan ensures the complete booking system with payment tracking and invoice generation works flawlessly in production.

## Test Environment Setup

### Prerequisites
1. **Stripe Test Account**
   - Test API keys configured
   - Webhook endpoint configured
   - Test cards ready

2. **Database**
   - All migrations applied (001, 002, 003)
   - Test data seeded

3. **Email Service**
   - Test SMTP configured
   - Email templates ready

4. **Storage Service**
   - PDF storage configured
   - Access permissions set

## Test Scenarios

### 1. Complete Booking Flow (Happy Path)

#### Test Steps:
1. Navigate to booking page
2. Select course session
3. Enter 2 attendee details
4. Add special requirements (wheelchair access)
5. Accept terms and conditions
6. Enter test card: 4242 4242 4242 4242
7. Complete payment

#### Expected Results:
- ✓ Booking created with status 'pending'
- ✓ Payment intent created in Stripe
- ✓ Payment confirmed and recorded in payments table
- ✓ Booking status updated to 'confirmed'
- ✓ Payment log entries created
- ✓ Invoice generated with sequential number
- ✓ Invoice PDF created and stored
- ✓ Confirmation emails sent to all attendees
- ✓ Invoice email sent with PDF attachment
- ✓ Success page displays with confetti
- ✓ Special requirements saved with 'high' priority
- ✓ Instructor notified of wheelchair requirement

### 2. Payment Failure Scenarios

#### 2.1 Insufficient Funds
**Test Card**: 4000 0000 0000 9995
- ✓ Payment fails with clear error message
- ✓ Booking remains in 'pending' status
- ✓ No invoice generated
- ✓ User can retry payment

#### 2.2 Card Declined
**Test Card**: 4000 0000 0000 0002
- ✓ Payment declined message shown
- ✓ Payment log shows failure event
- ✓ Session spots not reduced

### 3. 3D Secure Authentication

#### Test Steps:
1. Use test card: 4000 0027 6000 3184
2. Complete 3D Secure challenge

#### Expected Results:
- ✓ 3D Secure modal appears
- ✓ Authentication completes successfully
- ✓ Payment processes after authentication
- ✓ Additional security logged

### 4. Concurrent Booking Test

#### Test Steps:
1. Open two browser windows
2. Select same course with 1 spot remaining
3. Attempt to book simultaneously

#### Expected Results:
- ✓ First booking succeeds
- ✓ Second booking fails with "No spots available"
- ✓ Database transaction prevents overbooking
- ✓ Session marked as 'full'

### 5. Special Requirements Flow

#### 5.1 Critical Requirements
**Test**: Select "Emergency Medication" requirement
- ✓ Requirement saved with 'critical' priority
- ✓ Instructor email sent immediately
- ✓ Email marked as high priority
- ✓ Dashboard shows critical alert

#### 5.2 Multiple Requirements
**Test**: Select dietary (vegan) + accessibility (hearing loop)
- ✓ All requirements saved correctly
- ✓ Admin dashboard groups by priority
- ✓ Export includes all requirements

### 6. Invoice Generation Tests

#### 6.1 Standard Invoice
- ✓ Invoice number format: INV-2025-01001
- ✓ PDF contains all booking details
- ✓ Correct pricing calculations
- ✓ Professional layout

#### 6.2 Multiple Attendees
- ✓ All attendee names listed
- ✓ Price breakdown shown
- ✓ Total calculation correct

### 7. Refund Process

#### Test Steps:
1. Complete a booking
2. Request refund within 48 hours
3. Admin approves refund
4. Process refund

#### Expected Results:
- ✓ Refund record created
- ✓ Approval workflow functions
- ✓ Stripe refund processed
- ✓ Invoice status updated
- ✓ Booking marked as 'refunded'
- ✓ Session spots released
- ✓ Refund confirmation email sent

### 8. Webhook Processing

#### Test Scenarios:
1. **Payment Success Webhook**
   - ✓ Webhook received and stored
   - ✓ Payment status updated
   - ✓ Duplicate webhooks ignored

2. **Payment Failed Webhook**
   - ✓ Failure recorded
   - ✓ User notified

3. **Refund Completed Webhook**
   - ✓ Refund status updated
   - ✓ Notifications sent

### 9. Email Delivery Tests

#### Test All Email Types:
1. **Booking Confirmation**
   - ✓ Primary attendee receives full details
   - ✓ Additional attendees receive simplified version
   - ✓ PDF attachment included
   - ✓ ICS calendar file attached

2. **Invoice Email**
   - ✓ Invoice PDF attached
   - ✓ Payment details correct
   - ✓ Links to manage booking work

3. **Critical Requirements Alert**
   - ✓ Instructor receives immediately
   - ✓ High priority marking
   - ✓ All requirements listed

### 10. Edge Cases

#### 10.1 Maximum Attendees (12)
- ✓ Form handles 12 attendee inputs
- ✓ Validation works for all
- ✓ Email sent to all 12

#### 10.2 Network Interruption
- ✓ Payment status preserved
- ✓ Can resume from last step
- ✓ No duplicate charges

#### 10.3 Session Cancellation
- ✓ Bookings can be cancelled
- ✓ Refunds processed
- ✓ Attendees notified

### 11. Mobile Testing

#### Devices to Test:
- iPhone 12/13/14 (Safari)
- Samsung Galaxy (Chrome)
- iPad (Safari)

#### Test Points:
- ✓ Responsive design works
- ✓ Touch targets adequate (44px)
- ✓ Payment form usable
- ✓ PDF downloads work
- ✓ Calendar files download

### 12. Performance Tests

#### Load Testing:
1. **Concurrent Users**: 50 simultaneous bookings
2. **Response Times**: < 2 seconds
3. **Payment Processing**: < 5 seconds
4. **PDF Generation**: < 3 seconds

### 13. Security Tests

#### Test Points:
- ✓ SQL injection attempts blocked
- ✓ XSS attempts sanitized
- ✓ CSRF tokens validated
- ✓ Payment details never logged
- ✓ User can only access own bookings
- ✓ Admin routes protected

### 14. Accessibility Compliance

#### WCAG 2.1 AA Tests:
- ✓ Keyboard navigation works
- ✓ Screen reader compatible
- ✓ Color contrast passes
- ✓ Form labels proper
- ✓ Error messages clear
- ✓ Focus indicators visible

## Monitoring Checklist

### Post-Deployment Monitoring:
1. **Payment Success Rate**
   - Target: > 95%
   - Alert if < 90%

2. **Invoice Generation Time**
   - Target: < 3 seconds
   - Alert if > 5 seconds

3. **Email Delivery Rate**
   - Target: > 98%
   - Monitor bounces

4. **Webhook Processing**
   - Target: < 1 second
   - Alert on failures

5. **Database Performance**
   - Query time < 100ms
   - Connection pool healthy

## Rollback Plan

### If Critical Issues Found:
1. Disable new bookings
2. Revert to previous version
3. Process pending bookings manually
4. Communicate with affected users
5. Fix issues in staging
6. Re-deploy with fixes

## Sign-off Criteria

### System is Production-Ready When:
- [ ] All test scenarios pass
- [ ] Performance benchmarks met
- [ ] Security scan clean
- [ ] Accessibility audit passed
- [ ] Error rate < 0.1%
- [ ] Documentation complete
- [ ] Support team trained
- [ ] Monitoring configured
- [ ] Backup procedures tested
- [ ] Legal compliance verified

---

**Test Plan Created**: July 26, 2025
**Target Go-Live**: [To be scheduled]
**Test Lead**: QA Team
**Business Sign-off Required**: Yes