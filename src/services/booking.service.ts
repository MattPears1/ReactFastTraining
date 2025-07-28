import {
  CourseSchedule,
  BookingFormData,
  Booking,
  CourseTypeCode,
  VenueCode,
} from "@/types/booking.types";
import { generateMockSchedules } from "@/mocks/bookingData.generator";

interface GetAvailableCoursesParams {
  courseType?: CourseTypeCode;
  venue?: VenueCode;
  dateFrom?: Date;
  dateTo?: Date;
  showFullCourses?: boolean;
}

interface CreateBookingResponse {
  success: boolean;
  data?: {
    booking: Booking;
    confirmationCode: string;
  };
  error?: string;
}

interface ConfirmBookingWithPaymentData extends BookingFormData {
  paymentIntentId: string;
  totalAmount: number;
}

class BookingService {
  private mockSchedules: CourseSchedule[] = [];
  private apiUrl = "";

  constructor() {
    console.log('📚 [BOOKING] Initializing Booking Service...', {
      timestamp: new Date().toISOString()
    });
    
    try {
      this.mockSchedules = generateMockSchedules();
      console.log('✅ [BOOKING] Mock schedules generated:', {
        count: this.mockSchedules.length,
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      console.error('❌ [BOOKING] Failed to generate mock schedules:', error);
    }
    
    console.log('✅ [BOOKING] Booking Service initialized');
  }

  async getAvailableCourses(
    params: GetAvailableCoursesParams = {},
  ): Promise<CourseSchedule[]> {
    console.log('🔍 [BOOKING] Getting available courses...', {
      params: params,
      timestamp: new Date().toISOString()
    });

    try {
      // Try to fetch from the real API first
      const apiUrl = `${this.apiUrl}/api/courses/sessions/available`;
      console.log('🌐 [BOOKING] Fetching from API:', {
        url: apiUrl,
        timestamp: new Date().toISOString()
      });
      
      const response = await fetch(apiUrl);
      
      console.log('📡 [BOOKING] API response received:', {
        status: response.status,
        statusText: response.statusText,
        ok: response.ok,
        timestamp: new Date().toISOString()
      });

      if (response.ok) {
        const sessions = await response.json();
        console.log('✅ [BOOKING] Sessions fetched from API:', {
          count: sessions.length,
          timestamp: new Date().toISOString()
        });

        // Transform API response to match CourseSchedule interface
        const schedules: CourseSchedule[] = sessions.map((session: any) => ({
          id: session.id,
          courseType: session.courseType || "EFAW", // Default if not provided
          courseDetails: {
            courseId: session.courseId,
            title: session.courseName,
            description: session.courseDescription || "",
            duration: "6 hours",
            certificateValidity: "3 years",
            accreditation: "HSE",
          },
          courseName: session.courseName,
          startDate: session.startDatetime,
          endDate: session.endDatetime,
          startTime: new Date(session.startDatetime).toTimeString().slice(0, 5),
          endTime: new Date(session.endDatetime).toTimeString().slice(0, 5),
          venue: session.venueCode || "LEEDS_CITY",
          venueName: session.venueName || "Leeds City Centre",
          venueAddress: session.venueAddress || "",
          instructor: session.instructorId || 1,
          instructorName: session.instructorName || "Lex",
          instructorTitle: "Senior First Aid Trainer",
          maxParticipants: session.maxCapacity,
          availableSpots: session.availableSpots,
          pricePerPerson: parseFloat(session.price),
          groupDiscountAvailable: true,
          isFull: session.isFull || session.availableSpots === 0,
          status: session.status,
        }));

        // Apply client-side filters
        let filteredSchedules = schedules;

        if (params.courseType) {
          filteredSchedules = filteredSchedules.filter(
            (s) => s.courseType === params.courseType,
          );
        }

        if (params.venue) {
          filteredSchedules = filteredSchedules.filter(
            (s) => s.venue === params.venue,
          );
        }

        if (!params.showFullCourses) {
          filteredSchedules = filteredSchedules.filter(
            (s) => s.availableSpots > 0,
          );
        }

        return filteredSchedules;
      }
    } catch (error) {
      console.error('❌ [BOOKING] API fetch failed, falling back to mock data:', {
        error: error,
        message: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString()
      });
    }

    // Fallback to mock data if API fails
    console.log('📦 [BOOKING] Using mock schedules as fallback');
    let schedules = [...this.mockSchedules];
    console.log('📊 [BOOKING] Mock schedules loaded:', {
      totalCount: schedules.length,
      timestamp: new Date().toISOString()
    });

    // Filter by course type
    if (params.courseType) {
      schedules = schedules.filter((s) => s.courseType === params.courseType);
    }

    // Filter by venue
    if (params.venue) {
      schedules = schedules.filter((s) => s.venue === params.venue);
    }

    // Filter out full courses unless specified
    if (!params.showFullCourses) {
      schedules = schedules.filter((s) => s.availableSpots > 0);
    }

    // Sort by date
    schedules.sort(
      (a, b) =>
        new Date(a.startDate).getTime() - new Date(b.startDate).getTime(),
    );

    return schedules;
  }

  async getCourseSchedule(id: number): Promise<CourseSchedule | null> {
    console.log('📅 [BOOKING] Getting course schedule...', {
      scheduleId: id,
      timestamp: new Date().toISOString()
    });

    try {
      // Try to fetch from the real API first
      const apiUrl = `${this.apiUrl}/api/courses/sessions/${id}/availability`;
      console.log('🌐 [BOOKING] Fetching schedule from API:', {
        url: apiUrl,
        timestamp: new Date().toISOString()
      });
      
      const response = await fetch(apiUrl);
      
      console.log('📡 [BOOKING] Schedule API response:', {
        status: response.status,
        ok: response.ok,
        timestamp: new Date().toISOString()
      });

      if (response.ok) {
        const data = await response.json();
        console.log('✅ [BOOKING] Schedule fetched from API:', {
          sessionId: data.sessionId,
          availableSpots: data.availableSpots,
          timestamp: new Date().toISOString()
        });

        // Get additional session details if needed
        const sessionResponse = await fetch(
          `${this.apiUrl}/api/courses/sessions/${id}`,
        );
        const sessionData = sessionResponse.ok
          ? await sessionResponse.json()
          : {};

        // Transform API response to match CourseSchedule interface
        const schedule: CourseSchedule = {
          id: data.sessionId,
          courseType: sessionData.courseType || "EFAW",
          courseDetails: {
            courseId: sessionData.courseId || 1,
            title: sessionData.courseName || "Emergency First Aid at Work",
            description: sessionData.courseDescription || "",
            duration: "6 hours",
            certificateValidity: "3 years",
            accreditation: "HSE",
          },
          courseName: sessionData.courseName || "Emergency First Aid at Work",
          startDate: sessionData.startDatetime || new Date().toISOString(),
          endDate: sessionData.endDatetime || new Date().toISOString(),
          startTime: sessionData.startDatetime
            ? new Date(sessionData.startDatetime).toTimeString().slice(0, 5)
            : "09:00",
          endTime: sessionData.endDatetime
            ? new Date(sessionData.endDatetime).toTimeString().slice(0, 5)
            : "16:00",
          venue: sessionData.venueCode || "LEEDS_CITY",
          venueName: sessionData.venueName || "Leeds City Centre",
          venueAddress: sessionData.venueAddress || "",
          instructor: sessionData.instructorId || 1,
          instructorName: sessionData.instructorName || "Lex",
          instructorTitle: "Senior First Aid Trainer",
          maxParticipants: data.maxCapacity,
          availableSpots: data.availableSpots,
          pricePerPerson: data.price,
          groupDiscountAvailable: true,
          isFull: data.isFull,
          status: data.status,
        };

        return schedule;
      }
    } catch (error) {
      console.error(
        "Failed to fetch from API, falling back to mock data:",
        error,
      );
    }

    // Fallback to mock data
    await new Promise((resolve) => setTimeout(resolve, 200));
    const schedule = this.mockSchedules.find((s) => s.id === id) || null;

    console.log("Schedule found in mock data:", !!schedule);
    return schedule;
  }

  async createBooking(data: BookingFormData): Promise<CreateBookingResponse> {
    await new Promise((resolve) => setTimeout(resolve, 1000));

    // Find the course schedule
    const schedule = this.mockSchedules.find(
      (s) => s.id === data.courseScheduleId,
    );
    if (!schedule) {
      return {
        success: false,
        error: "Course schedule not found",
      };
    }

    // Check availability
    if (schedule.availableSpots < data.numberOfParticipants) {
      return {
        success: false,
        error: "Not enough spots available",
      };
    }

    // Generate confirmation code
    const confirmationCode = this.generateConfirmationCode();

    // Create booking object
    const booking: Booking = {
      id: Math.random().toString(36).substr(2, 9),
      bookingReference: confirmationCode,
      courseSchedule: schedule,
      primaryContact: {
        firstName: data.firstName,
        lastName: data.lastName,
        email: data.email,
        phone: data.phone,
        companyName: data.companyName,
      },
      participants: data.participantDetails || [
        {
          firstName: data.firstName,
          lastName: data.lastName,
          email: data.email,
        },
      ],
      totalAmount: schedule.pricePerPerson * data.numberOfParticipants,
      bookingStatus: "pending",
      paymentStatus: "pending",
      specialRequirements: data.specialRequirements,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    // Update available spots
    schedule.availableSpots -= data.numberOfParticipants;

    return {
      success: true,
      data: {
        booking,
        confirmationCode,
      },
    };
  }

  async getBookingByReference(reference: string): Promise<Booking | null> {
    await new Promise((resolve) => setTimeout(resolve, 300));
    // In a real implementation, this would fetch from the database
    return null;
  }

  async cancelBooking(bookingId: string): Promise<boolean> {
    await new Promise((resolve) => setTimeout(resolve, 500));
    // In a real implementation, this would update the booking status
    return true;
  }

  async confirmBookingWithPayment(
    data: ConfirmBookingWithPaymentData,
  ): Promise<CreateBookingResponse> {
    console.log("=== BOOKING SERVICE: Confirm Booking With Payment ===");
    console.log("Payment Intent ID:", data.paymentIntentId);
    console.log("Course Schedule ID:", data.courseScheduleId);
    console.log("Number of Participants:", data.numberOfParticipants);
    console.log("Total Amount:", data.totalAmount);

    // Find the course schedule
    const schedule = this.mockSchedules.find(
      (s) => s.id === data.courseScheduleId,
    );
    console.log("Schedule found:", !!schedule);

    if (!schedule) {
      console.error("Course schedule not found!");
      return {
        success: false,
        error: "Course schedule not found",
      };
    }

    // Check availability again
    console.log("Available spots:", schedule.availableSpots);
    console.log("Requested spots:", data.numberOfParticipants);

    if (schedule.availableSpots < data.numberOfParticipants) {
      console.error("Not enough spots available!");
      return {
        success: false,
        error: "Not enough spots available",
      };
    }

    // Generate confirmation code
    const confirmationCode = this.generateConfirmationCode();
    console.log("Generated confirmation code:", confirmationCode);

    try {
      // Send booking to backend API
      const bookingData = {
        id: confirmationCode,
        courseId: schedule.courseDetails.courseId,
        courseName: schedule.courseDetails.title,
        courseDate: schedule.startDate.split("T")[0],
        courseTime: schedule.startTime,
        courseVenue: schedule.venueName,
        coursePrice: schedule.pricePerPerson,
        customerName: `${data.firstName} ${data.lastName}`,
        customerEmail: data.email,
        customerPhone: data.phone,
        companyName: data.companyName || "",
        bookingDate: new Date().toISOString().split("T")[0],
        bookingReference: confirmationCode,
        status: "confirmed",
        paymentStatus: "paid",
        paymentMethod: "card",
        paymentIntentId: data.paymentIntentId,
        attendees: data.numberOfParticipants,
        totalAmount: data.totalAmount,
        notes: data.specialRequirements || "",
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      // Send to admin backend
      const response = await fetch("/api/admin/bookings", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(bookingData),
      });

      if (!response.ok) {
        console.error("Failed to save booking to admin system");
        // Continue anyway - don't fail the customer booking
      }

      // Create booking object with confirmed payment
      const booking: Booking = {
        id: confirmationCode,
        bookingReference: confirmationCode,
        courseSchedule: schedule,
        primaryContact: {
          firstName: data.firstName,
          lastName: data.lastName,
          email: data.email,
          phone: data.phone,
          companyName: data.companyName,
        },
        participants: data.participantDetails || [
          {
            firstName: data.firstName,
            lastName: data.lastName,
            email: data.email,
          },
        ],
        totalAmount: data.totalAmount,
        bookingStatus: "confirmed",
        paymentStatus: "paid",
        paymentIntentId: data.paymentIntentId,
        specialRequirements: data.specialRequirements,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      console.log("Created booking:", booking);

      // Update available spots
      schedule.availableSpots -= data.numberOfParticipants;
      console.log("Updated available spots to:", schedule.availableSpots);

      console.log("Booking confirmed successfully!");
      return {
        success: true,
        data: {
          booking,
          confirmationCode,
        },
      };
    } catch (error) {
      console.error("Error confirming booking:", error);
      // Still return success to customer if booking was created
      const booking: Booking = {
        id: confirmationCode,
        bookingReference: confirmationCode,
        courseSchedule: schedule,
        primaryContact: {
          firstName: data.firstName,
          lastName: data.lastName,
          email: data.email,
          phone: data.phone,
          companyName: data.companyName,
        },
        participants: data.participantDetails || [
          {
            firstName: data.firstName,
            lastName: data.lastName,
            email: data.email,
          },
        ],
        totalAmount: data.totalAmount,
        bookingStatus: "confirmed",
        paymentStatus: "paid",
        paymentIntentId: data.paymentIntentId,
        specialRequirements: data.specialRequirements,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      // Update available spots
      schedule.availableSpots -= data.numberOfParticipants;

      return {
        success: true,
        data: {
          booking,
          confirmationCode,
        },
      };
    }
  }

  private generateConfirmationCode(): string {
    const prefix = "RFT";
    const timestamp = Date.now().toString(36).toUpperCase();
    const random = Math.random().toString(36).substr(2, 4).toUpperCase();
    return `${prefix}-${timestamp}-${random}`;
  }
}

console.log('📚 [BOOKING] Creating singleton booking service instance...');
export const bookingService = new BookingService();
console.log('✅ [BOOKING] Booking service singleton created and exported');
