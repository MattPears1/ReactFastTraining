// Response types with OpenAPI specifications
export interface PaymentIntentResponse {
  clientSecret: string;
  paymentIntentId: string;
  amount: number;
  currency: string;
  bookingReference: string;
  status: string;
  requiresAction?: boolean;
  actionUrl?: string;
}

export interface PaymentConfirmationResponse {
  success: boolean;
  status: string;
  bookingReference?: string;
  receiptUrl?: string;
  invoiceId?: string;
  error?: string;
  requiresAction?: boolean;
  actionUrl?: string;
}

export interface PaymentDetailsResponse {
  id: string;
  amount: string;
  currency: string;
  status: string;
  paymentMethod?: {
    type: string;
    brand?: string;
    last4?: string;
  };
  receiptUrl?: string;
  refundable: boolean;
  refundedAmount?: string;
  createdAt: string;
  updatedAt: string;
  booking: {
    id: string;
    reference: string;
    status: string;
    courseType: string;
    sessionDate: string;
  };
  riskAssessment?: {
    level?: string;
    score?: number;
  };
}

export interface PaymentListResponse {
  payments: PaymentSummary[];
  pagination: PaginationInfo;
  statistics?: PaymentStatistics;
}

export interface PaymentSummary {
  id: string;
  amount: string;
  currency: string;
  status: string;
  bookingReference: string;
  courseType: string;
  sessionDate?: string;
  customerName?: string;
  customerEmail?: string;
  paymentMethod?: {
    type: string;
    brand?: string;
    last4?: string;
  };
  riskAssessment?: {
    level?: string;
    score?: number;
  };
  receiptUrl?: string;
  createdAt: string;
  stripePaymentIntentId?: string;
}

export interface PaginationInfo {
  total: number;
  limit: number;
  offset: number;
  hasMore: boolean;
}

export interface PaymentStatistics {
  totalRevenue: number;
  totalPayments: number;
  successfulPayments: number;
  failedPayments: number;
  pendingPayments: number;
  averagePaymentAmount: number;
  successRate: string;
}