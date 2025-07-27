import { CourseSchedule, BookingFormData, Booking, CourseTypeCode, VenueCode } from '@/types/booking.types';
import { generateMockSchedules } from '@/mocks/bookingData.generator';

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

class BookingService {
  private mockSchedules: CourseSchedule[] = [];
  
  constructor() {
    this.mockSchedules = generateMockSchedules();
  }
  
  async getAvailableCourses(params: GetAvailableCoursesParams = {}): Promise<CourseSchedule[]> {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 300));
    
    let schedules = [...this.mockSchedules];
    
    // Filter by course type
    if (params.courseType) {
      schedules = schedules.filter(s => s.courseType === params.courseType);
    }
    
    // Filter by venue
    if (params.venue) {
      schedules = schedules.filter(s => s.venue === params.venue);
    }
    
    // Filter by date range
    if (params.dateFrom) {
      schedules = schedules.filter(s => new Date(s.startDate) >= params.dateFrom!);
    }
    
    if (params.dateTo) {
      schedules = schedules.filter(s => new Date(s.startDate) <= params.dateTo!);
    }
    
    // Filter out full courses unless specified
    if (!params.showFullCourses) {
      schedules = schedules.filter(s => s.availableSpots > 0);
    }
    
    // Sort by date
    schedules.sort((a, b) => new Date(a.startDate).getTime() - new Date(b.startDate).getTime());
    
    return schedules;
  }
  
  async getCourseSchedule(id: number): Promise<CourseSchedule | null> {
    await new Promise(resolve => setTimeout(resolve, 200));
    return this.mockSchedules.find(s => s.id === id) || null;
  }
  
  async createBooking(data: BookingFormData): Promise<CreateBookingResponse> {
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Find the course schedule
    const schedule = this.mockSchedules.find(s => s.id === data.courseScheduleId);
    if (!schedule) {
      return {
        success: false,
        error: 'Course schedule not found'
      };
    }
    
    // Check availability
    if (schedule.availableSpots < data.numberOfParticipants) {
      return {
        success: false,
        error: 'Not enough spots available'
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
        companyName: data.companyName
      },
      participants: data.participantDetails || [{
        firstName: data.firstName,
        lastName: data.lastName,
        email: data.email
      }],
      totalAmount: schedule.pricePerPerson * data.numberOfParticipants,
      bookingStatus: 'pending',
      paymentStatus: 'pending',
      specialRequirements: data.specialRequirements,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    
    // Update available spots
    schedule.availableSpots -= data.numberOfParticipants;
    
    return {
      success: true,
      data: {
        booking,
        confirmationCode
      }
    };
  }
  
  async getBookingByReference(reference: string): Promise<Booking | null> {
    await new Promise(resolve => setTimeout(resolve, 300));
    // In a real implementation, this would fetch from the database
    return null;
  }
  
  async cancelBooking(bookingId: string): Promise<boolean> {
    await new Promise(resolve => setTimeout(resolve, 500));
    // In a real implementation, this would update the booking status
    return true;
  }
  
  private generateConfirmationCode(): string {
    const prefix = 'RFT';
    const timestamp = Date.now().toString(36).toUpperCase();
    const random = Math.random().toString(36).substr(2, 4).toUpperCase();
    return `${prefix}-${timestamp}-${random}`;
  }
}

export const bookingService = new BookingService();