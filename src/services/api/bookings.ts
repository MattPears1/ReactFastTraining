import { apiService } from '../api.service';

export interface CreateBookingRequest {
  sessionId: string;
  attendees: Array<{ name: string; email: string; certificateName?: string; isPrimary?: boolean }>;
  specialRequirements?: string;
  termsAccepted: boolean;
}

export interface CreateBookingResponse {
  bookingId: string;
  bookingReference: string;
  clientSecret: string;
  amount: string;
}

export interface ConfirmBookingRequest {
  bookingId: string;
  paymentIntentId: string;
}

export interface BookingDetails {
  id: string;
  bookingReference: string;
  sessionId: string;
  userId: string;
  numberOfAttendees: number;
  totalAmount: string;
  status: string;
  courseDetails: {
    courseType: string;
    sessionDate: string;
    startTime: string;
    endTime: string;
    location: string;
    price: number;
  };
  attendees: Array<{
    name: string;
    email: string;
    isPrimary: boolean;
  }>;
  specialRequirements?: string;
}

export const bookingApi = {
  async createBooking(data: CreateBookingRequest): Promise<CreateBookingResponse> {
    const response = await apiService.post('/api/bookings/create', data);
    return response.data;
  },

  async confirmBooking(data: ConfirmBookingRequest): Promise<{ success: boolean }> {
    const response = await apiService.post('/api/bookings/confirm', data);
    return response.data;
  },

  async getBooking(bookingId: string): Promise<BookingDetails> {
    const response = await apiService.get(`/api/bookings/${bookingId}`);
    return response.data;
  },

  async getBookingByReference(reference: string): Promise<BookingDetails> {
    const response = await apiService.get(`/api/bookings/reference/${reference}`);
    return response.data;
  },

  async downloadPDF(bookingId: string): Promise<Blob> {
    const response = await apiService.get(`/api/bookings/${bookingId}/download-pdf`, {
      responseType: 'blob',
    });
    return response.data;
  },

  async downloadICS(bookingId: string): Promise<Blob> {
    const response = await apiService.get(`/api/bookings/${bookingId}/download-ics`, {
      responseType: 'blob',
    });
    return response.data;
  },

  async cancelBooking(bookingId: string): Promise<{ success: boolean }> {
    const response = await apiService.post(`/api/bookings/${bookingId}/cancel`);
    return response.data;
  },

  async getUserBookings(): Promise<BookingDetails[]> {
    const response = await apiService.get('/api/bookings/user/current');
    return response.data;
  },
};