import { apiService } from "../api.service";
import type {
  BookingHistoryResponse,
  BookingFilters,
  BookingDetails,
} from "@/types/client";

interface GetBookingHistoryParams extends BookingFilters {
  limit?: number;
  offset?: number;
}

class BookingHistoryService {
  private basePath = "/client/bookings";

  async getBookingHistory(
    params?: GetBookingHistoryParams,
  ): Promise<BookingHistoryResponse> {
    const response = await apiService.get(this.basePath, { params });
    return response.data;
  }

  async getBookingDetails(bookingId: string): Promise<BookingDetails> {
    const response = await apiService.get(`${this.basePath}/${bookingId}`);
    return response.data;
  }

  async downloadCertificate(bookingId: string): Promise<void> {
    const response = await apiService.get(
      `${this.basePath}/${bookingId}/certificate`,
      { responseType: "blob" },
    );

    const url = window.URL.createObjectURL(new Blob([response.data]));
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", `certificate-${bookingId}.pdf`);
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.URL.revokeObjectURL(url);
  }

  async downloadInvoice(invoiceId: string): Promise<void> {
    const response = await apiService.get(
      `/client/invoices/${invoiceId}/download`,
      { responseType: "blob" },
    );

    const url = window.URL.createObjectURL(new Blob([response.data]));
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", `invoice-${invoiceId}.pdf`);
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.URL.revokeObjectURL(url);
  }

  async exportBookingHistory(filters?: BookingFilters): Promise<string> {
    const response = await apiService.get(`${this.basePath}/export`, {
      params: filters,
      responseType: "text",
    });
    return response.data;
  }

  async rescheduleBooking(
    bookingId: string,
    newSessionId: string,
  ): Promise<void> {
    await apiService.put(`${this.basePath}/${bookingId}/reschedule`, {
      sessionId: newSessionId,
    });
  }

  async cancelBooking(bookingId: string, reason?: string): Promise<void> {
    await apiService.put(`${this.basePath}/${bookingId}/cancel`, {
      reason,
    });
  }

  async rebookCourse(bookingId: string): Promise<{ redirectUrl: string }> {
    const response = await apiService.post(
      `${this.basePath}/${bookingId}/rebook`,
    );
    return response.data;
  }
}

export const bookingHistoryService = new BookingHistoryService();
