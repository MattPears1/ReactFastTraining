# Payment History System Implementation Plan

## Overview
The Payment History system will track all financial transactions related to bookings, including payments, refunds, partial payments, and payment failures. While Stripe handles the actual payment processing, we need comprehensive local tracking for reporting, reconciliation, and customer service.

## Database Schema

### 1. Payments Table
```sql
CREATE TABLE payments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  
  -- Relationships
  booking_id UUID REFERENCES bookings(id),
  user_id UUID REFERENCES users(id),
  
  -- Payment Details
  payment_reference VARCHAR(100) UNIQUE NOT NULL, -- Internal reference
  stripe_payment_intent_id VARCHAR(255), -- Stripe's payment intent ID
  stripe_charge_id VARCHAR(255), -- Stripe's charge ID
  stripe_customer_id VARCHAR(255), -- Stripe's customer ID
  
  -- Amount Information
  amount DECIMAL(10,2) NOT NULL, -- Original amount
  currency VARCHAR(3) DEFAULT 'GBP',
  stripe_fee DECIMAL(10,2), -- Stripe's processing fee
  net_amount DECIMAL(10,2), -- Amount after fees
  
  -- Payment Method
  payment_method VARCHAR(50) NOT NULL, -- card, bank_transfer, cash, invoice
  card_last_four VARCHAR(4), -- Last 4 digits of card
  card_brand VARCHAR(50), -- visa, mastercard, amex, etc.
  
  -- Status
  status VARCHAR(50) NOT NULL, -- pending, processing, succeeded, failed, refunded, partially_refunded
  failure_reason TEXT,
  
  -- Invoice Information
  invoice_number VARCHAR(100),
  invoice_issued_date DATE,
  invoice_due_date DATE,
  
  -- Metadata
  description TEXT,
  payment_date TIMESTAMP,
  processed_by UUID REFERENCES users(id), -- Admin who processed manual payment
  
  -- Timestamps
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  
  -- Indexes
  INDEX idx_booking (booking_id),
  INDEX idx_user (user_id),
  INDEX idx_status (status),
  INDEX idx_payment_date (payment_date),
  INDEX idx_stripe_ids (stripe_payment_intent_id, stripe_charge_id)
);
```

### 2. Refunds Table
```sql
CREATE TABLE refunds (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  
  -- Relationships
  payment_id UUID REFERENCES payments(id),
  booking_id UUID REFERENCES bookings(id),
  user_id UUID REFERENCES users(id),
  
  -- Refund Details
  refund_reference VARCHAR(100) UNIQUE NOT NULL,
  stripe_refund_id VARCHAR(255), -- Stripe's refund ID
  
  -- Amount Information
  refund_amount DECIMAL(10,2) NOT NULL,
  refund_fee DECIMAL(10,2) DEFAULT 0, -- Any fees for refunding
  net_refund_amount DECIMAL(10,2),
  
  -- Refund Information
  reason VARCHAR(50) NOT NULL, -- customer_request, duplicate, fraudulent, course_cancelled
  reason_details TEXT,
  status VARCHAR(50) NOT NULL, -- pending, processing, succeeded, failed
  
  -- Processing Information
  requested_by UUID REFERENCES users(id),
  approved_by UUID REFERENCES users(id),
  processed_at TIMESTAMP,
  
  -- Timestamps
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  
  -- Indexes
  INDEX idx_payment (payment_id),
  INDEX idx_booking (booking_id),
  INDEX idx_user (user_id),
  INDEX idx_status (status)
);
```

### 3. Payment Methods Table (for saved cards)
```sql
CREATE TABLE payment_methods (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id),
  
  -- Stripe Information
  stripe_payment_method_id VARCHAR(255) UNIQUE,
  
  -- Card Details (for display only)
  card_brand VARCHAR(50),
  card_last_four VARCHAR(4),
  card_exp_month INTEGER,
  card_exp_year INTEGER,
  
  -- Status
  is_default BOOLEAN DEFAULT false,
  is_active BOOLEAN DEFAULT true,
  
  -- Timestamps
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  last_used_at TIMESTAMP,
  
  INDEX idx_user (user_id),
  INDEX idx_active (is_active)
);
```

### 4. Payment Reconciliation Table
```sql
CREATE TABLE payment_reconciliations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  
  -- Period Information
  reconciliation_date DATE NOT NULL,
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  
  -- Totals
  total_payments_count INTEGER,
  total_payments_amount DECIMAL(10,2),
  total_refunds_count INTEGER,
  total_refunds_amount DECIMAL(10,2),
  total_fees DECIMAL(10,2),
  net_amount DECIMAL(10,2),
  
  -- Stripe Reconciliation
  stripe_payout_id VARCHAR(255),
  stripe_payout_amount DECIMAL(10,2),
  stripe_payout_date DATE,
  
  -- Status
  status VARCHAR(50), -- pending, reconciled, discrepancy
  discrepancy_notes TEXT,
  
  -- Audit
  reconciled_by UUID REFERENCES users(id),
  reconciled_at TIMESTAMP,
  
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  
  INDEX idx_date (reconciliation_date),
  INDEX idx_status (status)
);
```

### 5. Payment Events Log
```sql
CREATE TABLE payment_events (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  
  -- Relationships
  payment_id UUID REFERENCES payments(id),
  refund_id UUID REFERENCES refunds(id),
  
  -- Event Information
  event_type VARCHAR(100) NOT NULL, -- payment_created, payment_succeeded, payment_failed, refund_initiated, etc.
  event_source VARCHAR(50), -- stripe_webhook, admin_action, system
  event_data JSONB, -- Store complete event data
  
  -- Audit
  created_by UUID REFERENCES users(id),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  
  INDEX idx_payment (payment_id),
  INDEX idx_refund (refund_id),
  INDEX idx_event_type (event_type),
  INDEX idx_created_at (created_at)
);
```

## Payment Processing Flow

### 1. Payment Creation
```
1. Customer initiates booking
2. Create payment record (status: pending)
3. Create Stripe payment intent
4. Update payment with Stripe IDs
5. Customer completes payment
6. Stripe webhook confirms payment
7. Update payment status to succeeded
8. Update booking status to paid
9. Send confirmation email
10. Log payment event
```

### 2. Refund Processing
```
1. Admin initiates refund
2. Create refund record (status: pending)
3. Initiate Stripe refund
4. Update refund with Stripe ID
5. Stripe webhook confirms refund
6. Update refund status to succeeded
7. Update payment status to refunded/partially_refunded
8. Update booking status if full refund
9. Send refund notification email
10. Log refund event
```

## Key Features

### 1. Payment Tracking
- Track all payment attempts
- Record successful and failed payments
- Store payment method details (securely)
- Link payments to bookings and users
- Calculate net amounts after fees

### 2. Refund Management
- Process full or partial refunds
- Track refund reasons
- Require approval for refunds
- Automatic booking status updates
- Refund history per customer

### 3. Financial Reporting
- Daily payment summaries
- Monthly reconciliation reports
- Outstanding payments report
- Refund analysis
- Fee tracking
- Revenue by course type

### 4. Payment Search & Filtering
- Search by reference, amount, customer
- Filter by status, date range, method
- Export payment data
- Bulk operations support

## Integration Points

### With Stripe
- Webhook endpoints for real-time updates
- Payment intent creation
- Refund processing
- Customer management
- Payment method storage

### With Booking System
- Link payments to bookings
- Update booking status on payment
- Handle group booking payments
- Support partial payments

### With User System
- Track payment history per user
- Calculate lifetime value
- Payment method management
- Credit tracking

## Stripe Webhook Events to Handle

```javascript
// Critical events
'payment_intent.succeeded'
'payment_intent.payment_failed'
'charge.succeeded'
'charge.failed'
'charge.refunded'
'refund.created'
'refund.updated'

// Customer events
'customer.created'
'customer.updated'
'payment_method.attached'
'payment_method.detached'

// Dispute events
'charge.dispute.created'
'charge.dispute.updated'
```

## API Endpoints

### Payment Management
- `GET /api/admin/payments` - List payments with filters
- `GET /api/admin/payments/:id` - Get payment details
- `POST /api/admin/payments/manual` - Record manual payment
- `GET /api/admin/payments/reconcile` - Reconciliation data

### Refund Management
- `POST /api/admin/refunds` - Create refund
- `GET /api/admin/refunds` - List refunds
- `GET /api/admin/refunds/:id` - Get refund details
- `PUT /api/admin/refunds/:id/approve` - Approve refund

### Reporting
- `GET /api/admin/payments/summary` - Payment summary
- `GET /api/admin/payments/export` - Export payments
- `GET /api/admin/reports/revenue` - Revenue reports
- `GET /api/admin/reports/reconciliation` - Reconciliation report

### Stripe Webhooks
- `POST /api/webhooks/stripe` - Handle Stripe events

## Implementation Priority

### Phase 1 (Immediate)
1. Create payment tables
2. Stripe webhook handler
3. Basic payment recording
4. Link to existing bookings

### Phase 2 (Next Sprint)
1. Refund processing
2. Payment search/filtering
3. Basic reporting
4. Reconciliation tools

### Phase 3 (Future)
1. Advanced analytics
2. Automated reconciliation
3. Payment reminders
4. Subscription handling

## Security Considerations

### PCI Compliance
- Never store full card numbers
- Use Stripe for all card processing
- Implement proper access controls
- Audit all payment operations

### Data Protection
- Encrypt sensitive payment data
- Implement audit logging
- Role-based access control
- Regular security reviews

### Fraud Prevention
- Monitor failed payments
- Flag suspicious patterns
- Implement velocity checks
- Review high-value refunds

## Error Handling

### Payment Failures
- Log all failure reasons
- Notify admin of failures
- Provide clear error messages
- Implement retry logic

### Webhook Failures
- Implement idempotency
- Queue failed webhooks
- Alert on webhook issues
- Manual reconciliation tools