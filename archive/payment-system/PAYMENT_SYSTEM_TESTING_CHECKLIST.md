# Payment System Testing Checklist

## Overview
This checklist ensures the complete payment system implementation is functioning correctly and ready for production use.

## Prerequisites
- [ ] Stripe account configured with test keys
- [ ] PostgreSQL database running with migrations applied
- [ ] Email service configured (SendGrid/Mailgun)
- [ ] Test customer accounts created
- [ ] Admin account with appropriate permissions

## 1. Payment Processing Flow

### 1.1 Successful Payment
- [ ] Navigate to course booking page
- [ ] Select course and enter attendee details
- [ ] Proceed to payment checkout
- [ ] Enter test card: 4242 4242 4242 4242 (any future expiry, any CVC)
- [ ] Verify payment processes successfully
- [ ] Check payment status shows "succeeded"
- [ ] Verify booking status updates to "confirmed"
- [ ] Check payment record created in database
- [ ] Verify Stripe payment intent exists in Stripe dashboard

### 1.2 Failed Payment
- [ ] Use test card: 4000 0000 0000 0002 (declined card)
- [ ] Verify payment fails with appropriate error message
- [ ] Check payment status shows "failed"
- [ ] Verify booking remains in "pending" status
- [ ] Confirm retry payment option is available
- [ ] Check payment_logs table records the failure

### 1.3 3D Secure Authentication
- [ ] Use test card: 4000 0025 0000 3155 (requires authentication)
- [ ] Verify 3DS authentication popup appears
- [ ] Complete authentication successfully
- [ ] Check payment completes after authentication
- [ ] Test authentication failure scenario
- [ ] Verify appropriate error handling

### 1.4 Webhook Processing
- [ ] Trigger payment.intent.succeeded webhook from Stripe CLI
- [ ] Verify webhook signature validation works
- [ ] Check webhook event stored in webhook_events table
- [ ] Confirm payment status updates correctly
- [ ] Test webhook retry on failure
- [ ] Verify idempotency (duplicate webhook handling)

## 2. Invoice Generation

### 2.1 Automatic Invoice Creation
- [ ] Complete a successful payment
- [ ] Verify invoice generated automatically
- [ ] Check sequential invoice number (INV-YYYY-00001)
- [ ] Confirm invoice PDF created in storage
- [ ] Verify invoice record in database
- [ ] Check invoice contains correct:
  - [ ] Customer details
  - [ ] Course information
  - [ ] Payment amount
  - [ ] Company details
  - [ ] Tax information (if applicable)

### 2.2 Invoice Access
- [ ] Login as customer
- [ ] Navigate to account dashboard
- [ ] View invoice list
- [ ] Click to preview invoice details
- [ ] Download invoice PDF
- [ ] Verify PDF opens correctly
- [ ] Check invoice formatting and content

### 2.3 Invoice Resend
- [ ] Request invoice resend from customer portal
- [ ] Verify email sent successfully
- [ ] Check email contains invoice PDF attachment
- [ ] Confirm resend tracked in database

## 3. Refund System

### 3.1 Customer Refund Request
- [ ] Login as customer with completed booking
- [ ] Navigate to bookings page
- [ ] Click "Request Refund" button
- [ ] Select refund reason
- [ ] Add optional details
- [ ] Submit refund request
- [ ] Verify confirmation message
- [ ] Check refund record created with "pending" status
- [ ] Confirm booking status updated to "refund_requested"

### 3.2 Admin Refund Management
- [ ] Login as admin
- [ ] Navigate to refund dashboard
- [ ] View pending refund requests
- [ ] Check refund statistics display correctly
- [ ] Review refund request details
- [ ] Test approve refund:
  - [ ] Click approve button
  - [ ] Enter admin notes
  - [ ] Confirm approval
  - [ ] Verify Stripe refund processed
  - [ ] Check refund status updated to "approved"
  - [ ] Confirm booking status updated to "refunded"
- [ ] Test reject refund:
  - [ ] Click reject button
  - [ ] Enter rejection reason
  - [ ] Verify refund status updated to "rejected"
  - [ ] Check booking remains active

### 3.3 Refund Processing
- [ ] Verify refund amount correct
- [ ] Check Stripe dashboard shows refund
- [ ] Confirm refund_logs table updated
- [ ] Test partial refund functionality
- [ ] Verify refund cannot exceed original payment

## 4. Email Notifications

### 4.1 Payment Confirmation Email
- [ ] Complete successful payment
- [ ] Check email sent to customer
- [ ] Verify email contains:
  - [ ] Booking reference
  - [ ] Course details
  - [ ] Payment amount
  - [ ] Next steps
  - [ ] Receipt link (if configured)
- [ ] Test email formatting (HTML and text)

### 4.2 Refund Request Email
- [ ] Submit refund request
- [ ] Verify customer receives confirmation email
- [ ] Check email contains:
  - [ ] Request details
  - [ ] Expected timeline
  - [ ] Contact information
- [ ] Confirm admin notification sent

### 4.3 Refund Processed Email
- [ ] Process refund approval
- [ ] Check customer receives refund confirmation
- [ ] Verify email contains:
  - [ ] Refund amount
  - [ ] Processing timeline
  - [ ] Transaction reference

## 5. Security & Compliance

### 5.1 PCI DSS Compliance
- [ ] Verify no card details stored in database
- [ ] Check Stripe Elements used for card input
- [ ] Confirm HTTPS enforced on payment pages
- [ ] Test Content Security Policy headers
- [ ] Verify sensitive data not logged

### 5.2 Input Validation
- [ ] Test SQL injection attempts on all forms
- [ ] Verify XSS protection on user inputs
- [ ] Check CSRF tokens on all POST requests
- [ ] Test rate limiting on payment endpoints
- [ ] Verify amount validation (negative amounts, etc)

### 5.3 Access Control
- [ ] Test customer can only view own invoices
- [ ] Verify customer cannot access admin endpoints
- [ ] Check admin authentication required for refund approval
- [ ] Test API endpoints require authentication
- [ ] Verify proper error messages (no info leakage)

## 6. Performance & Error Handling

### 6.1 Performance Testing
- [ ] Test payment processing time < 5 seconds
- [ ] Verify invoice generation < 3 seconds
- [ ] Check page load times acceptable
- [ ] Test concurrent payment processing
- [ ] Monitor database query performance

### 6.2 Error Scenarios
- [ ] Test network timeout during payment
- [ ] Verify handling of Stripe API errors
- [ ] Check database connection failures
- [ ] Test email service failures
- [ ] Verify graceful degradation
- [ ] Check error logging works correctly

### 6.3 Edge Cases
- [ ] Test £0 amount payments (if applicable)
- [ ] Verify handling of expired cards
- [ ] Check insufficient funds scenario
- [ ] Test international cards
- [ ] Verify currency handling (GBP only)
- [ ] Test maximum attendee limits

## 7. Integration Testing

### 7.1 Booking Flow Integration
- [ ] Complete end-to-end booking with payment
- [ ] Verify all status updates cascade correctly
- [ ] Check session capacity updates
- [ ] Test booking cancellation flow
- [ ] Verify attendee records created

### 7.2 User Account Integration
- [ ] Check payment history in user dashboard
- [ ] Verify invoice access from account page
- [ ] Test refund request from booking history
- [ ] Confirm email preferences honored

### 7.3 Admin Dashboard Integration
- [ ] Verify payment reports accurate
- [ ] Check refund statistics update real-time
- [ ] Test invoice management features
- [ ] Confirm audit trail complete

## 8. Production Readiness

### 8.1 Configuration
- [ ] Stripe production keys configured
- [ ] Webhook endpoint URL updated
- [ ] Email templates reviewed and approved
- [ ] Environment variables set correctly
- [ ] Database indexes optimized

### 8.2 Monitoring
- [ ] Payment failure alerts configured
- [ ] Webhook failure monitoring setup
- [ ] Database backup schedule confirmed
- [ ] Error logging to production system
- [ ] Performance monitoring enabled

### 8.3 Documentation
- [ ] Admin guide for refund processing
- [ ] Customer FAQ for payments
- [ ] Troubleshooting guide created
- [ ] API documentation updated
- [ ] Runbook for common issues

## 9. Legal & Business Requirements

### 9.1 Compliance
- [ ] Refund policy clearly displayed
- [ ] Terms of service updated
- [ ] GDPR compliance verified
- [ ] Financial record retention policy
- [ ] Audit trail requirements met

### 9.2 Business Rules
- [ ] Refund window enforcement (7 days)
- [ ] Cancellation policy implemented
- [ ] No-show handling defined
- [ ] Group booking rules tested
- [ ] Discount codes (if applicable)

## 10. Post-Launch Verification

### 10.1 First Day
- [ ] Monitor first real payments
- [ ] Check webhook processing
- [ ] Verify email delivery
- [ ] Review error logs
- [ ] Confirm no payment failures

### 10.2 First Week
- [ ] Analyze payment success rate
- [ ] Review refund requests
- [ ] Check invoice generation
- [ ] Monitor system performance
- [ ] Gather user feedback

### 10.3 First Month
- [ ] Complete financial reconciliation
- [ ] Review refund patterns
- [ ] Optimize based on metrics
- [ ] Update documentation
- [ ] Plan improvements

---

## Sign-off

**Development Team:**
- Developer: _________________ Date: _________
- Code Reviewer: ______________ Date: _________

**Business Approval:**
- Product Owner: ______________ Date: _________
- Finance Team: _______________ Date: _________

**Go-Live Approval:**
- Technical Lead: _____________ Date: _________
- Business Owner: _____________ Date: _________

---

## Notes
- Use Stripe test cards: https://stripe.com/docs/testing
- Keep test data separate from production
- Document any issues found during testing
- Ensure all stakeholders review before launch