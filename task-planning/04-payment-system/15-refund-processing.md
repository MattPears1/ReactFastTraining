# Refund Processing System

## Overview
Implement refund processing through admin dashboard with full refund policy initially (can be adjusted later). Integration with Stripe for automated refunds.please use ultra think to plan for this and you can createfiles withinthis folder if it helps like a CSV with tasks to keep track etc 

## Refund Policy

### Current Policy (Simple)
- **Full Refund**: Available for all cancellations
- **Processing Time**: 5-10 business days
- **Admin Approval**: Required for all refunds
- **Automatic Approval**: Not implemented initially

### Future Policy Options
- Tiered refunds based on cancellation timing
- Partial refunds for late cancellations
- Transfer fees for date changes
- No-show policy

## Database Schema

### Refunds Table
```sql
CREATE TABLE refunds (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id UUID NOT NULL REFERENCES bookings(id),
  payment_id UUID NOT NULL REFERENCES payments(id),
  stripe_refund_id VARCHAR(255) UNIQUE,
  amount DECIMAL(10, 2) NOT NULL,
  reason VARCHAR(255),
  status VARCHAR(50) DEFAULT 'pending',
  requested_by UUID REFERENCES users(id),
  requested_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  approved_by UUID REFERENCES users(id),
  approved_at TIMESTAMP,
  processed_at TIMESTAMP,
  notes TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_refunds_booking ON refunds(booking_id);
CREATE INDEX idx_refunds_status ON refunds(status);
```

## Backend Implementation

### Refund Service
```typescript
// backend-loopback4/src/services/refund.service.ts
import { db } from '../config/database.config';
import { refunds, bookings, payments } from '../db/schema';
import { StripeService } from './stripe.service';
import { EmailService } from './email.service';

export class RefundService {
  static async requestRefund(data: {
    bookingId: string;
    reason: string;
    requestedBy: string;
  }) {
    // Verify booking exists and belongs to user
    const booking = await BookingService.getBookingWithDetails(data.bookingId);
    if (!booking || booking.userId !== data.requestedBy) {
      throw new Error('Booking not found');
    }

    // Check if already refunded
    const existingRefund = await this.getRefundByBooking(data.bookingId);
    if (existingRefund && ['approved', 'processed'].includes(existingRefund.status)) {
      throw new Error('This booking has already been refunded');
    }

    // Get payment details
    const payment = await this.getPaymentForBooking(data.bookingId);
    if (!payment || payment.status !== 'succeeded') {
      throw new Error('No successful payment found for this booking');
    }

    // Create refund request
    const [refund] = await db.insert(refunds).values({
      bookingId: data.bookingId,
      paymentId: payment.id,
      amount: payment.amount,
      reason: data.reason,
      requestedBy: data.requestedBy,
      status: 'pending',
    }).returning();

    // Cancel the booking
    await BookingService.cancelBooking(data.bookingId, 'Refund requested');

    // Notify admin
    await this.notifyAdminOfRefundRequest(booking, refund);

    return refund;
  }

  static async approveRefund(
    refundId: string,
    approvedBy: string,
    notes?: string
  ) {
    const refund = await this.getRefund(refundId);
    if (!refund) {
      throw new Error('Refund not found');
    }

    if (refund.status !== 'pending') {
      throw new Error('Refund is not in pending status');
    }

    // Update refund status
    await db
      .update(refunds)
      .set({
        status: 'approved',
        approvedBy,
        approvedAt: new Date(),
        notes,
      })
      .where(eq(refunds.id, refundId));

    // Process refund immediately
    await this.processRefund(refundId);
  }

  static async processRefund(refundId: string) {
    const refund = await this.getRefundWithDetails(refundId);
    if (!refund) {
      throw new Error('Refund not found');
    }

    try {
      // Create Stripe refund
      const stripeRefund = await StripeService.createRefund({
        paymentIntentId: refund.payment.stripePaymentIntentId,
        amount: refund.amount,
        reason: 'requested_by_customer',
        metadata: {
          bookingId: refund.bookingId,
          refundId: refund.id,
        },
      });

      // Update refund record
      await db
        .update(refunds)
        .set({
          stripeRefundId: stripeRefund.id,
          status: 'processed',
          processedAt: new Date(),
        })
        .where(eq(refunds.id, refundId));

      // Send confirmation emails
      await this.sendRefundConfirmations(refund);

      return stripeRefund;
    } catch (error) {
      // Update status to failed
      await db
        .update(refunds)
        .set({
          status: 'failed',
          notes: `Processing failed: ${error.message}`,
        })
        .where(eq(refunds.id, refundId));

      throw error;
    }
  }

  static async getRefundsByStatus(status?: string) {
    const query = db
      .select({
        refund: refunds,
        booking: bookings,
        requestedByUser: users,
      })
      .from(refunds)
      .innerJoin(bookings, eq(refunds.bookingId, bookings.id))
      .innerJoin(users, eq(refunds.requestedBy, users.id));

    if (status) {
      query.where(eq(refunds.status, status));
    }

    return await query.orderBy(desc(refunds.requestedAt));
  }

  private static async sendRefundConfirmations(refund: RefundWithDetails) {
    // Email to customer
    await EmailService.sendRefundProcessedEmail(
      refund.booking.user,
      refund.booking,
      refund.amount
    );

    // Email to admin
    await EmailService.sendRefundProcessedAdminEmail(refund);
  }
}
```

### Stripe Refund Integration
```typescript
// backend-loopback4/src/services/stripe.service.ts (addition)
export class StripeService {
  static async createRefund(data: {
    paymentIntentId: string;
    amount?: number; // In pounds, if not provided, full refund
    reason?: 'duplicate' | 'fraudulent' | 'requested_by_customer';
    metadata?: Record<string, string>;
  }) {
    try {
      const refundData: Stripe.RefundCreateParams = {
        payment_intent: data.paymentIntentId,
        reason: data.reason || 'requested_by_customer',
        metadata: data.metadata,
      };

      // If amount specified, convert to pence
      if (data.amount) {
        refundData.amount = Math.round(data.amount * 100);
      }

      const refund = await this.stripe.refunds.create(refundData);
      return refund;
    } catch (error) {
      console.error('Stripe refund creation failed:', error);
      throw new Error('Refund processing failed');
    }
  }

  static async getRefund(refundId: string) {
    return await this.stripe.refunds.retrieve(refundId);
  }
}
```

## Frontend Implementation

### Client Refund Request
```typescript
// src/components/booking/RefundRequestModal.tsx
import React, { useState } from 'react';
import { X } from 'lucide-react';

interface RefundRequestModalProps {
  booking: BookingDetails;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export const RefundRequestModal: React.FC<RefundRequestModalProps> = ({
  booking,
  isOpen,
  onClose,
  onSuccess,
}) => {
  const [reason, setReason] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!reason.trim()) {
      setError('Please provide a reason for the refund');
      return;
    }

    setSubmitting(true);
    setError('');

    try {
      await bookingApi.requestRefund(booking.id, reason);
      onSuccess();
      onClose();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to submit refund request');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-md w-full p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold">Request Refund</h2>
          <button
            onClick={onClose}
            className="p-1 hover:bg-gray-100 rounded"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="mb-4 p-4 bg-gray-50 rounded-lg">
          <h3 className="font-medium mb-2">Booking Details</h3>
          <div className="text-sm space-y-1">
            <p><strong>Reference:</strong> {booking.bookingReference}</p>
            <p><strong>Course:</strong> {booking.courseDetails.courseType}</p>
            <p><strong>Date:</strong> {format(new Date(booking.courseDetails.sessionDate), 'dd/MM/yyyy')}</p>
            <p><strong>Amount Paid:</strong> £{booking.totalAmount}</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Reason for Refund
            </label>
            <select
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg"
              required
            >
              <option value="">Select a reason</option>
              <option value="Unable to attend">Unable to attend</option>
              <option value="Course cancelled">Course cancelled</option>
              <option value="Medical reasons">Medical reasons</option>
              <option value="Work commitment">Work commitment</option>
              <option value="Other">Other</option>
            </select>
          </div>

          {reason === 'Other' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Please specify
              </label>
              <textarea
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                placeholder="Please provide more details..."
                required
              />
            </div>
          )}

          {error && (
            <div className="bg-red-50 border border-red-300 text-red-800 rounded-lg p-3 text-sm">
              {error}
            </div>
          )}

          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <p className="text-sm text-blue-800">
              <strong>Refund Policy:</strong> Full refunds are currently available for all 
              cancellations. Refunds typically process within 5-10 business days.
            </p>
          </div>

          <div className="flex gap-3">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50"
            >
              {submitting ? 'Submitting...' : 'Request Refund'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
```

### Admin Refund Dashboard
```typescript
// src/components/admin/RefundDashboard.tsx
import React, { useState, useEffect } from 'react';
import { DollarSign, Clock, Check, X, AlertCircle } from 'lucide-react';

export const RefundDashboard: React.FC = () => {
  const [refunds, setRefunds] = useState<RefundRequest[]>([]);
  const [filter, setFilter] = useState<'all' | 'pending' | 'processed'>('pending');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadRefunds();
  }, [filter]);

  const loadRefunds = async () => {
    setLoading(true);
    try {
      const data = await adminApi.getRefunds(filter === 'all' ? undefined : filter);
      setRefunds(data);
    } finally {
      setLoading(false);
    }
  };

  const stats = {
    pending: refunds.filter(r => r.status === 'pending').length,
    totalPending: refunds
      .filter(r => r.status === 'pending')
      .reduce((sum, r) => sum + r.amount, 0),
    processed: refunds.filter(r => r.status === 'processed').length,
  };

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Pending Refunds</p>
              <p className="text-2xl font-bold text-gray-900">{stats.pending}</p>
            </div>
            <Clock className="w-8 h-8 text-yellow-500" />
          </div>
        </div>
        
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Total Pending Amount</p>
              <p className="text-2xl font-bold text-gray-900">£{stats.totalPending}</p>
            </div>
            <DollarSign className="w-8 h-8 text-red-500" />
          </div>
        </div>
        
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Processed This Month</p>
              <p className="text-2xl font-bold text-gray-900">{stats.processed}</p>
            </div>
            <Check className="w-8 h-8 text-green-500" />
          </div>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="bg-white rounded-lg shadow">
        <div className="border-b">
          <nav className="flex -mb-px">
            {(['pending', 'all', 'processed'] as const).map(tab => (
              <button
                key={tab}
                onClick={() => setFilter(tab)}
                className={`px-6 py-3 text-sm font-medium border-b-2 ${
                  filter === tab
                    ? 'border-primary-500 text-primary-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
              >
                {tab.charAt(0).toUpperCase() + tab.slice(1)}
              </button>
            ))}
          </nav>
        </div>

        {/* Refund List */}
        <div className="p-6">
          {loading ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600 mx-auto"></div>
            </div>
          ) : refunds.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              No {filter === 'all' ? '' : filter} refunds found
            </div>
          ) : (
            <div className="space-y-4">
              {refunds.map(refund => (
                <RefundCard 
                  key={refund.id} 
                  refund={refund} 
                  onAction={loadRefunds}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

const RefundCard: React.FC<{
  refund: RefundRequest;
  onAction: () => void;
}> = ({ refund, onAction }) => {
  const [processing, setProcessing] = useState(false);
  const [showNotes, setShowNotes] = useState(false);
  const [notes, setNotes] = useState('');

  const handleApprove = async () => {
    setProcessing(true);
    try {
      await adminApi.approveRefund(refund.id, notes);
      onAction();
    } finally {
      setProcessing(false);
    }
  };

  const handleReject = async () => {
    setProcessing(true);
    try {
      await adminApi.rejectRefund(refund.id, notes);
      onAction();
    } finally {
      setProcessing(false);
    }
  };

  const statusColors = {
    pending: 'bg-yellow-100 text-yellow-800',
    approved: 'bg-blue-100 text-blue-800',
    processed: 'bg-green-100 text-green-800',
    failed: 'bg-red-100 text-red-800',
  };

  return (
    <div className="border rounded-lg p-4">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <div className="flex items-center gap-3 mb-2">
            <h4 className="font-semibold">{refund.booking.bookingReference}</h4>
            <span className={`px-2 py-1 rounded-full text-xs font-medium ${statusColors[refund.status]}`}>
              {refund.status}
            </span>
          </div>
          
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm text-gray-600">
            <div>
              <p className="font-medium">Customer</p>
              <p>{refund.requestedByUser.name}</p>
            </div>
            <div>
              <p className="font-medium">Amount</p>
              <p className="text-lg font-semibold text-gray-900">£{refund.amount}</p>
            </div>
            <div>
              <p className="font-medium">Reason</p>
              <p>{refund.reason}</p>
            </div>
            <div>
              <p className="font-medium">Requested</p>
              <p>{format(new Date(refund.requestedAt), 'dd/MM/yyyy HH:mm')}</p>
            </div>
          </div>

          {refund.notes && (
            <div className="mt-3 p-3 bg-gray-50 rounded text-sm">
              <p className="font-medium text-gray-700">Notes:</p>
              <p className="text-gray-600">{refund.notes}</p>
            </div>
          )}
        </div>

        {refund.status === 'pending' && (
          <div className="ml-4 space-y-2">
            <button
              onClick={() => setShowNotes(!showNotes)}
              className="px-3 py-1 text-sm border border-gray-300 rounded hover:bg-gray-50"
            >
              Add Notes
            </button>
          </div>
        )}
      </div>

      {showNotes && (
        <div className="mt-4 space-y-3">
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Add internal notes (optional)..."
            rows={2}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
          />
          <div className="flex gap-2">
            <button
              onClick={handleApprove}
              disabled={processing}
              className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50"
            >
              <Check className="w-4 h-4 inline mr-1" />
              Approve Refund
            </button>
            <button
              onClick={handleReject}
              disabled={processing}
              className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50"
            >
              <X className="w-4 h-4 inline mr-1" />
              Reject
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
```

### Refund Status Display
```typescript
// src/components/booking/RefundStatus.tsx
import React from 'react';
import { Clock, CheckCircle, XCircle, AlertCircle } from 'lucide-react';

interface RefundStatusProps {
  refund: RefundDetails;
}

export const RefundStatus: React.FC<RefundStatusProps> = ({ refund }) => {
  const statusConfig = {
    pending: {
      icon: Clock,
      color: 'text-yellow-600',
      bgColor: 'bg-yellow-50',
      title: 'Refund Pending',
      message: 'Your refund request is being reviewed.',
    },
    approved: {
      icon: AlertCircle,
      color: 'text-blue-600',
      bgColor: 'bg-blue-50',
      title: 'Refund Approved',
      message: 'Your refund has been approved and will be processed shortly.',
    },
    processed: {
      icon: CheckCircle,
      color: 'text-green-600',
      bgColor: 'bg-green-50',
      title: 'Refund Processed',
      message: `£${refund.amount} has been refunded to your original payment method.`,
    },
    failed: {
      icon: XCircle,
      color: 'text-red-600',
      bgColor: 'bg-red-50',
      title: 'Refund Failed',
      message: 'There was an issue processing your refund. Please contact support.',
    },
  };

  const config = statusConfig[refund.status];
  const Icon = config.icon;

  return (
    <div className={`${config.bgColor} rounded-lg p-4`}>
      <div className="flex items-start gap-3">
        <Icon className={`w-6 h-6 ${config.color} flex-shrink-0`} />
        <div className="flex-1">
          <h4 className={`font-semibold ${config.color}`}>{config.title}</h4>
          <p className="text-sm text-gray-700 mt-1">{config.message}</p>
          
          <div className="mt-3 space-y-1 text-sm text-gray-600">
            <p>
              <strong>Requested:</strong>{' '}
              {format(new Date(refund.requestedAt), 'dd/MM/yyyy HH:mm')}
            </p>
            {refund.processedAt && (
              <p>
                <strong>Processed:</strong>{' '}
                {format(new Date(refund.processedAt), 'dd/MM/yyyy HH:mm')}
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
```

## Email Templates

### Refund Confirmation Email
```html
Subject: Refund Processed - £{amount} | React Fast Training

<body>
  <h2>Refund Confirmation</h2>
  <p>Hi {customerName},</p>
  
  <p>Your refund has been successfully processed.</p>
  
  <div class="refund-details">
    <h3>Refund Details:</h3>
    <ul>
      <li>Booking Reference: {bookingReference}</li>
      <li>Refund Amount: £{amount}</li>
      <li>Processing Date: {date}</li>
    </ul>
  </div>
  
  <div class="info-box">
    <p><strong>When will I receive my refund?</strong></p>
    <p>Refunds typically appear in your account within 5-10 business days, 
       depending on your bank or card issuer.</p>
  </div>
  
  <p>If you have any questions about your refund, please don't hesitate to contact us.</p>
</body>
```

## Testing

1. Test refund request flow
2. Test admin approval process
3. Test Stripe refund integration
4. Test email notifications
5. Test duplicate refund prevention
6. Test partial refund scenarios
7. Test refund status tracking
8. Test webhook handling for refund events