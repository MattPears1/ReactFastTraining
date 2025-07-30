import axios from "axios";

interface InvoiceListResponse {
  invoices: Array<{
    id: string;
    invoiceNumber: string;
    bookingReference: string;
    amount: string;
    status: string;
    issueDate: string;
    pdfUrl?: string;
    sentAt?: string;
  }>;
  total: number;
  limit: number;
  offset: number;
}

interface InvoiceDetails {
  id: string;
  invoiceNumber: string;
  issueDate: string;
  dueDate?: string;
  subtotal: string;
  taxAmount: string;
  totalAmount: string;
  status: string;
  pdfUrl?: string;
  booking: {
    reference: string;
    courseType: string;
    sessionDate: string;
    numberOfAttendees: number;
  };
  customer: {
    name: string;
    email: string;
  };
  attendees?: Array<{
    name: string;
    email: string;
  }>;
}

interface GenerateInvoiceResponse {
  success: boolean;
  invoice: {
    id: string;
    invoiceNumber: string;
    amount: string;
    status: string;
    issueDate: string;
    pdfUrl?: string;
  };
}

interface ResendInvoiceResponse {
  success: boolean;
  message: string;
}

class InvoiceApi {
  private api = axios.create({
    baseURL: import.meta.env.VITE_API_URL || "http://localhost:3000",
    headers: {
      "Content-Type": "application/json",
    },
  });

  constructor() {
    // Add auth token to requests
    this.api.interceptors.request.use((config) => {
      const token = localStorage.getItem("authToken");
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
      return config;
    });
  }

  // Customer endpoints
  async getUserInvoices(limit = 10, offset = 0): Promise<InvoiceListResponse> {
    const response = await this.api.get("/api/invoices", {
      params: { limit, offset },
    });
    return response.data;
  }

  async getInvoice(invoiceId: string): Promise<InvoiceDetails> {
    const response = await this.api.get(`/api/invoices/${invoiceId}`);
    return response.data;
  }

  async downloadInvoice(invoiceId: string): Promise<Blob> {
    const response = await this.api.get(`/api/invoices/${invoiceId}/download`, {
      responseType: "blob",
    });
    return response.data;
  }

  async resendInvoice(invoiceId: string): Promise<ResendInvoiceResponse> {
    const response = await this.api.post(`/api/invoices/${invoiceId}/resend`);
    return response.data;
  }

  async generateInvoice(bookingId: string): Promise<GenerateInvoiceResponse> {
    const response = await this.api.post(`/api/invoices/generate/${bookingId}`);
    return response.data;
  }

  async getInvoiceByNumber(invoiceNumber: string): Promise<{
    id: string;
    invoiceNumber: string;
    amount: string;
    status: string;
    issueDate: string;
    pdfUrl?: string;
  }> {
    const response = await this.api.get(
      `/api/invoices/number/${invoiceNumber}`,
    );
    return response.data;
  }

  // Admin endpoints
  async getAllInvoices(filters?: {
    status?: string;
    startDate?: string;
    endDate?: string;
    limit?: number;
    offset?: number;
  }): Promise<InvoiceListResponse> {
    const params = new URLSearchParams();
    if (filters?.status) params.append("status", filters.status);
    if (filters?.startDate) params.append("startDate", filters.startDate);
    if (filters?.endDate) params.append("endDate", filters.endDate);
    if (filters?.limit) params.append("limit", filters.limit.toString());
    if (filters?.offset) params.append("offset", filters.offset.toString());

    const response = await this.api.get(`/api/admin/invoices?${params}`);
    return response.data;
  }

  async getInvoiceStats(): Promise<{
    total: number;
    totalAmount: number;
    thisMonth: number;
    thisMonthAmount: number;
  }> {
    const response = await this.api.get("/api/admin/invoices/stats");
    return response.data;
  }

  async voidInvoice(
    invoiceId: string,
    reason: string,
  ): Promise<{
    success: boolean;
    message: string;
  }> {
    const response = await this.api.patch(
      `/api/admin/invoices/${invoiceId}/void`,
      {
        reason,
      },
    );
    return response.data;
  }

  async regenerateInvoice(bookingId: string): Promise<GenerateInvoiceResponse> {
    const response = await this.api.post(
      `/api/admin/invoices/${bookingId}/regenerate`,
    );
    return response.data;
  }
}

export const invoiceApi = new InvoiceApi();
