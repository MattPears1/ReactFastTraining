export interface CreatePaymentData {
  bookingId: number;
  userId: number;
  amount: number;
  currency?: string;
  paymentMethod: string;
  description?: string;
  stripePaymentIntentId?: string;
  stripeCustomerId?: string;
}

export interface CreateRefundData {
  paymentId?: string;
  bookingId: number;
  userId: number;
  amount: number;
  reason: string;
  reasonDetails?: string;
  requestedBy: number;
}

export interface PaymentSearchParams {
  reference?: string;
  customerEmail?: string;
  status?: string;
  fromDate?: Date;
  toDate?: Date;
  minAmount?: number;
  maxAmount?: number;
  paymentMethod?: string;
  page?: number;
  limit?: number;
}

export interface PaymentSummary {
  totalPayments: number;
  totalAmount: number;
  totalRefunds: number;
  refundAmount: number;
  netAmount: number;
  pendingPayments: number;
  failedPayments: number;
}

export interface ReconciliationResult {
  matched: number;
  unmatched: number;
  discrepancies: Array<{
    paymentId: string;
    issue: string;
    localAmount: number;
    stripeAmount: number;
  }>;
}

export interface PaymentEvent {
  paymentId: string;
  eventType: string;
  eventData: any;
  stripeEventId?: string;
  processedAt?: Date;
}