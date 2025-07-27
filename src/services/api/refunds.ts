import axios from 'axios';

interface RefundRequestData {
  bookingId: string;
  reason: string;
}

interface RefundApprovalData {
  notes?: string;
}

interface RefundRejectionData {
  reason: string;
}

interface RefundResponse {
  success: boolean;
  refundId?: string;
  status?: string;
  message?: string;
}

interface RefundListResponse {
  refunds: Array<{
    id: string;
    bookingReference: string;
    customerName: string;
    customerEmail: string;
    amount: string;
    reason: string;
    status: string;
    requestedAt: string;
    approvedAt?: string;
    processedAt?: string;
    approvedBy?: string;
    notes?: string;
    stripeRefundId?: string;
  }>;
  total: number;
  limit: number;
  offset: number;
}

interface RefundStats {
  total: number;
  pending: number;
  approved: number;
  processed: number;
  rejected: number;
  failed: number;
  totalAmount: number;
  pendingAmount: number;
}

class RefundApi {
  private api = axios.create({
    baseURL: import.meta.env.VITE_API_URL || 'http://localhost:3000',
    headers: {
      'Content-Type': 'application/json',
    },
  });

  constructor() {
    // Add auth token to requests
    this.api.interceptors.request.use((config) => {
      const token = localStorage.getItem('authToken');
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
      return config;
    });
  }

  // Customer endpoints
  async requestRefund(data: RefundRequestData): Promise<RefundResponse> {
    const response = await this.api.post('/api/refunds/request', data);
    return response.data;
  }

  async getMyRefunds() {
    const response = await this.api.get('/api/refunds/my-refunds');
    return response.data;
  }

  async getRefund(refundId: string) {
    const response = await this.api.get(`/api/refunds/${refundId}`);
    return response.data;
  }

  // Admin endpoints
  async listRefunds(status?: string, limit = 50, offset = 0): Promise<RefundListResponse> {
    const params = new URLSearchParams();
    if (status) params.append('status', status);
    params.append('limit', limit.toString());
    params.append('offset', offset.toString());

    const response = await this.api.get(`/api/admin/refunds?${params}`);
    return response.data;
  }

  async getRefundStats(): Promise<RefundStats> {
    const response = await this.api.get('/api/admin/refunds/stats');
    return response.data;
  }

  async getRefundDetails(refundId: string) {
    const response = await this.api.get(`/api/admin/refunds/${refundId}`);
    return response.data;
  }

  async approveRefund(refundId: string, data: RefundApprovalData): Promise<RefundResponse> {
    const response = await this.api.patch(`/api/admin/refunds/${refundId}/approve`, data);
    return response.data;
  }

  async rejectRefund(refundId: string, data: RefundRejectionData): Promise<RefundResponse> {
    const response = await this.api.patch(`/api/admin/refunds/${refundId}/reject`, data);
    return response.data;
  }
}

export const refundApi = new RefundApi();