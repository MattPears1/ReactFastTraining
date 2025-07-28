import { AxiosInstance } from "axios";
import axios from "./axios-init";
import { format } from "date-fns";

// Comprehensive types for schedule details
export interface Trainer {
  id: string;
  name: string;
  email: string;
  phone?: string;
  qualification: string;
  specializations?: string[];
}

export interface Location {
  id: string;
  name: string;
  address: string;
  city: string;
  postcode: string;
  capacity: number;
  facilities?: string[];
  directions?: string;
}

export interface Course {
  id: string;
  name: string;
  description: string;
  duration: number;
  maxParticipants: number;
  price: number;
  category: string;
}

export interface BookingDetails {
  id: string;
  userId: string;
  userName: string;
  userEmail: string;
  userPhone?: string;
  bookingDate: string;
  status: "pending" | "confirmed" | "cancelled" | "completed";
  paymentStatus: "pending" | "paid" | "refunded" | "failed";
  paymentAmount: number;
  specialRequirements?: string;
  attendanceStatus?: "present" | "absent" | "late";
  certificateIssued?: boolean;
}

export interface SessionDetails {
  id: string;
  courseId: string;
  trainerId: string;
  locationId: string;
  startDate: string;
  endDate: string;
  startTime: string;
  endTime: string;
  maxParticipants: number;
  currentParticipants: number;
  pricePerPerson: number;
  status: "SCHEDULED" | "CONFIRMED" | "IN_PROGRESS" | "COMPLETED" | "CANCELLED";
  isOnsite: boolean;
  onsiteClientName?: string;
  onsiteDetails?: {
    contactName?: string;
    contactPhone?: string;
    contactEmail?: string;
    specialRequirements?: string;
  };
  notes?: string;
  createdAt: string;
  updatedAt: string;
  // Relations
  course?: Course;
  trainer?: Trainer;
  location?: Location;
  bookings?: BookingDetails[];
}

export interface UpdateSessionData {
  startDate?: string;
  endDate?: string;
  startTime?: string;
  endTime?: string;
  maxParticipants?: number;
  pricePerPerson?: number;
  trainerId?: string;
  locationId?: string;
  status?:
    | "SCHEDULED"
    | "CONFIRMED"
    | "IN_PROGRESS"
    | "COMPLETED"
    | "CANCELLED";
  notes?: string;
  isOnsite?: boolean;
  onsiteClientName?: string;
  onsiteDetails?: {
    contactName?: string;
    contactPhone?: string;
    contactEmail?: string;
    specialRequirements?: string;
  };
}

export interface SessionConflict {
  type: "trainer" | "location" | "time";
  conflictingSession: {
    id: string;
    courseName: string;
    date: string;
    time: string;
  };
  message: string;
}

export interface EmailAttendeesData {
  subject: string;
  message: string;
  includeCalendarInvite?: boolean;
  sendToWaitlist?: boolean;
}

export interface SessionActivity {
  id: string;
  sessionId: string;
  action: string;
  performedBy: string;
  performedAt: string;
  details: any;
}

export interface SessionSummary {
  totalRevenue: number;
  confirmedRevenue: number;
  pendingRevenue: number;
  occupancyRate: number;
  attendanceRate?: number;
  waitlistCount: number;
  cancellationCount: number;
}

class AdminScheduleService {
  private api: AxiosInstance;

  constructor() {
    const baseURL = import.meta.env.PROD
      ? ""
      : import.meta.env.VITE_API_URL || "http://localhost:3000";

    this.api = axios.create({
      baseURL,
      withCredentials: true,
      timeout: 10000,
    });

    // Add auth token to requests
    this.api.interceptors.request.use((config) => {
      const token = localStorage.getItem("adminAccessToken");
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
      return config;
    });

    // Handle 401 errors
    this.api.interceptors.response.use(
      (response) => response,
      (error) => {
        if (error.response?.status === 401) {
          localStorage.removeItem("adminAccessToken");
          window.location.href = "/admin/login";
        }
        return Promise.reject(error);
      },
    );
  }

  // Fetch comprehensive session details with all relations
  async getSessionDetails(sessionId: string): Promise<SessionDetails> {
    const response = await this.api.get(`/course-sessions/${sessionId}`, {
      params: {
        filter: JSON.stringify({
          include: ["course", "trainer", "location"],
        }),
      },
    });

    // Fetch bookings separately with user details
    const bookingsResponse = await this.api.get(
      `/course-sessions/${sessionId}/bookings`,
      {
        params: {
          filter: JSON.stringify({
            include: ["user"],
          }),
        },
      },
    );

    // Map the response to match our interface
    const session = response.data;
    const bookings = bookingsResponse.data || [];

    return {
      id: session.id,
      courseId: session.courseId,
      trainerId: session.trainerId,
      locationId: session.locationId,
      startDate: session.startDate,
      endDate: session.endDate,
      startTime: session.startTime,
      endTime: session.endTime,
      maxParticipants: session.maxParticipants,
      currentParticipants: session.currentParticipants,
      pricePerPerson: session.pricePerPerson,
      status: session.status,
      isOnsite: session.isOnsite || false,
      onsiteClientName: session.onsiteClientName,
      onsiteDetails: session.onsiteDetails,
      notes: session.notes,
      createdAt: session.createdAt,
      updatedAt: session.updatedAt,
      course: session.course,
      trainer: session.trainer,
      location: session.location,
      bookings: bookings.map((booking: any) => ({
        id: booking.id,
        userId: booking.userId,
        userName: booking.user?.name || booking.userName || "Unknown",
        userEmail: booking.user?.email || booking.userEmail || "",
        userPhone: booking.user?.phone || booking.userPhone,
        bookingDate: booking.createdAt || booking.bookingDate,
        status: booking.status || "pending",
        paymentStatus: booking.paymentStatus || "pending",
        paymentAmount: booking.amount || session.pricePerPerson,
        specialRequirements: booking.specialRequirements,
        attendanceStatus: booking.attendanceStatus,
        certificateIssued: booking.certificateIssued || false,
      })),
    };
  }

  // Update session with validation
  async updateSession(
    sessionId: string,
    data: UpdateSessionData,
  ): Promise<SessionDetails> {
    // Check for conflicts if date/time/trainer/location changed
    if (data.startDate || data.endDate || data.trainerId || data.locationId) {
      const conflicts = await this.checkConflicts(sessionId, data);
      if (conflicts.length > 0) {
        throw new Error(
          `Conflicts detected: ${conflicts.map((c) => c.message).join(", ")}`,
        );
      }
    }

    const response = await this.api.patch(
      `/course-sessions/${sessionId}`,
      data,
    );

    // Fetch updated details
    return this.getSessionDetails(sessionId);
  }

  // Check for scheduling conflicts
  async checkConflicts(
    sessionId: string,
    data: UpdateSessionData,
  ): Promise<SessionConflict[]> {
    const conflicts: SessionConflict[] = [];

    // This would typically be an API endpoint, but for now we'll simulate
    // In a real implementation, the backend would check for:
    // 1. Trainer availability
    // 2. Location availability
    // 3. Time conflicts with other sessions

    return conflicts;
  }

  // Cancel session with reason and notifications
  async cancelSession(
    sessionId: string,
    reason: string,
    notifyAttendees: boolean = true,
  ): Promise<void> {
    await this.api.post(`/course-sessions/${sessionId}/cancel`, {
      reason,
      notifyAttendees,
    });
  }

  // Duplicate session to new date
  async duplicateSession(
    sessionId: string,
    newDate: string,
    newTime?: string,
  ): Promise<SessionDetails> {
    const original = await this.getSessionDetails(sessionId);

    const response = await this.api.post("/course-sessions", {
      courseId: original.courseId,
      trainerId: original.trainerId,
      locationId: original.locationId,
      startDate: newDate,
      endDate: newDate, // Assuming single day for now
      startTime: newTime || original.startTime,
      endTime: original.endTime,
      maxParticipants: original.maxParticipants,
      pricePerPerson: original.pricePerPerson,
      isOnsite: original.isOnsite,
      onsiteClientName: original.onsiteClientName,
      onsiteDetails: original.onsiteDetails,
      notes: `Duplicated from session ${sessionId}`,
    });

    return response.data;
  }

  // Email attendees
  async emailAttendees(
    sessionId: string,
    data: EmailAttendeesData,
  ): Promise<{ sent: number; failed: number }> {
    const response = await this.api.post(
      `/course-sessions/${sessionId}/email-attendees`,
      data,
    );
    return response.data;
  }

  // Get session activity log
  async getSessionActivity(sessionId: string): Promise<SessionActivity[]> {
    const response = await this.api.get(
      `/course-sessions/${sessionId}/activity`,
    );
    return response.data;
  }

  // Get financial summary
  async getSessionSummary(sessionId: string): Promise<SessionSummary> {
    const session = await this.getSessionDetails(sessionId);
    const bookings = session.bookings || [];

    const summary: SessionSummary = {
      totalRevenue: bookings.reduce(
        (sum, b) => sum + (b.paymentAmount || 0),
        0,
      ),
      confirmedRevenue: bookings
        .filter((b) => b.status === "confirmed" && b.paymentStatus === "paid")
        .reduce((sum, b) => sum + b.paymentAmount, 0),
      pendingRevenue: bookings
        .filter((b) => b.paymentStatus === "pending")
        .reduce((sum, b) => sum + b.paymentAmount, 0),
      occupancyRate:
        (session.currentParticipants / session.maxParticipants) * 100,
      attendanceRate:
        session.status === "COMPLETED"
          ? (bookings.filter((b) => b.attendanceStatus === "present").length /
              bookings.length) *
            100
          : undefined,
      waitlistCount: 0, // Would come from backend
      cancellationCount: bookings.filter((b) => b.status === "cancelled")
        .length,
    };

    return summary;
  }

  // Export attendee list
  async exportAttendeeList(
    sessionId: string,
    format: "csv" | "pdf" = "csv",
  ): Promise<Blob> {
    const response = await this.api.get(
      `/course-sessions/${sessionId}/export-attendees`,
      {
        params: { format },
        responseType: "blob",
      },
    );
    return response.data;
  }

  // Generate sign-in sheet
  async generateSignInSheet(sessionId: string): Promise<Blob> {
    const response = await this.api.get(
      `/course-sessions/${sessionId}/sign-in-sheet`,
      {
        responseType: "blob",
      },
    );
    return response.data;
  }

  // Manage individual booking
  async updateBooking(
    bookingId: string,
    data: Partial<BookingDetails>,
  ): Promise<BookingDetails> {
    const response = await this.api.patch(`/bookings/${bookingId}`, data);
    return response.data;
  }

  // Move from waitlist to confirmed
  async confirmWaitlistBooking(bookingId: string): Promise<BookingDetails> {
    const response = await this.api.post(
      `/bookings/${bookingId}/confirm-from-waitlist`,
    );
    return response.data;
  }

  // Add new booking to session
  async addBookingToSession(
    sessionId: string,
    bookingData: {
      userName: string;
      userEmail: string;
      userPhone?: string;
      specialRequirements?: string;
    },
  ): Promise<BookingDetails> {
    const response = await this.api.post(
      `/course-sessions/${sessionId}/add-booking`,
      bookingData,
    );
    return response.data;
  }
}

export const adminScheduleService = new AdminScheduleService();
