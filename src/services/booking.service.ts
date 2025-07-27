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

interface ConfirmBookingWithPaymentData extends BookingFormData {
  paymentIntentId: string;
  totalAmount: number;
}

class BookingService {
  private mockSchedules: CourseSchedule[] = [];
  
  constructor() {
    this.mockSchedules = generateMockSchedules();
  }
  
  async getAvailableCourses(params: GetAvailableCoursesParams = {}): Promise<CourseSchedule[]> {
    console.log('=== BOOKING SERVICE: Get Available Courses ===');
    console.log('Parameters:', params);
    
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 300));
    
    let schedules = [...this.mockSchedules];
    console.log('Total mock schedules:', schedules.length);
    
    // Filter by course type
    if (params.courseType) {
      schedules = schedules.filter(s => s.courseType === params.courseType);
      console.log(`After course type filter (${params.courseType}):`, schedules.length);
    }
    
    // Filter by venue
    if (params.venue) {
      schedules = schedules.filter(s => s.venue === params.venue);
      console.log(`After venue filter (${params.venue}):`, schedules.length);
    }
    
    // Filter by date range
    if (params.dateFrom) {
      schedules = schedules.filter(s => new Date(s.startDate) >= params.dateFrom!);
      console.log(`After dateFrom filter:`, schedules.length);
    }
    
    if (params.dateTo) {
      schedules = schedules.filter(s => new Date(s.startDate) <= params.dateTo!);
      console.log(`After dateTo filter:`, schedules.length);
    }
    
    // Filter out full courses unless specified
    if (!params.showFullCourses) {
      schedules = schedules.filter(s => s.availableSpots > 0);
      console.log('After availability filter:', schedules.length);
    }
    
    // Sort by date
    schedules.sort((a, b) => new Date(a.startDate).getTime() - new Date(b.startDate).getTime());
    
    console.log('Final schedules returned:', schedules.length);
    return schedules;
  }
  
  async getCourseSchedule(id: number): Promise<CourseSchedule | null> {
    console.log('=== BOOKING SERVICE: Get Course Schedule ===');
    console.log('Schedule ID:', id);
    
    await new Promise(resolve => setTimeout(resolve, 200));
    const schedule = this.mockSchedules.find(s => s.id === id) || null;
    
    console.log('Schedule found:', !!schedule);
    if (schedule) {
      console.log('Schedule details:', schedule);
    }
    
    return schedule;
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
  
  async confirmBookingWithPayment(data: ConfirmBookingWithPaymentData): Promise<CreateBookingResponse> {
    console.log('=== BOOKING SERVICE: Confirm Booking With Payment ===');
    console.log('Payment Intent ID:', data.paymentIntentId);
    console.log('Course Schedule ID:', data.courseScheduleId);
    console.log('Number of Participants:', data.numberOfParticipants);
    console.log('Total Amount:', data.totalAmount);
    
    // Find the course schedule
    const schedule = this.mockSchedules.find(s => s.id === data.courseScheduleId);
    console.log('Schedule found:', !!schedule);
    
    if (!schedule) {
      console.error('Course schedule not found!');
      return {
        success: false,
        error: 'Course schedule not found'
      };
    }
    
    // Check availability again
    console.log('Available spots:', schedule.availableSpots);
    console.log('Requested spots:', data.numberOfParticipants);
    
    if (schedule.availableSpots < data.numberOfParticipants) {
      console.error('Not enough spots available!');
      return {
        success: false,
        error: 'Not enough spots available'
      };
    }
    
    // Generate confirmation code
    const confirmationCode = this.generateConfirmationCode();
    console.log('Generated confirmation code:', confirmationCode);
    
    try {
      // Send booking to backend API
      const bookingData = {
        id: confirmationCode,
        courseId: schedule.courseDetails.courseId,
        courseName: schedule.courseDetails.title,
        courseDate: schedule.startDate.split('T')[0],
        courseTime: schedule.startTime,
        courseVenue: schedule.venueName,
        coursePrice: schedule.pricePerPerson,
        customerName: `${data.firstName} ${data.lastName}`,
        customerEmail: data.email,
        customerPhone: data.phone,
        companyName: data.companyName || '',
        bookingDate: new Date().toISOString().split('T')[0],
        bookingReference: confirmationCode,
        status: 'confirmed',
        paymentStatus: 'paid',
        paymentMethod: 'card',
        paymentIntentId: data.paymentIntentId,
        attendees: data.numberOfParticipants,
        totalAmount: data.totalAmount,
        notes: data.specialRequirements || '',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      // Send to admin backend
      const response = await fetch('/api/admin/bookings', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(bookingData),
      });

      if (!response.ok) {
        console.error('Failed to save booking to admin system');
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
          companyName: data.companyName
        },
        participants: data.participantDetails || [{
          firstName: data.firstName,
          lastName: data.lastName,
          email: data.email
        }],
        totalAmount: data.totalAmount,
        bookingStatus: 'confirmed',
        paymentStatus: 'paid',
        paymentIntentId: data.paymentIntentId,
        specialRequirements: data.specialRequirements,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      
      console.log('Created booking:', booking);
      
      // Update available spots
      schedule.availableSpots -= data.numberOfParticipants;
      console.log('Updated available spots to:', schedule.availableSpots);
      
      console.log('Booking confirmed successfully!');
      return {
        success: true,
        data: {
          booking,
          confirmationCode
        }
      };
    } catch (error) {
      console.error('Error confirming booking:', error);
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
          companyName: data.companyName
        },
        participants: data.participantDetails || [{
          firstName: data.firstName,
          lastName: data.lastName,
          email: data.email
        }],
        totalAmount: data.totalAmount,
        bookingStatus: 'confirmed',
        paymentStatus: 'paid',
        paymentIntentId: data.paymentIntentId,
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
  }
  
  private generateConfirmationCode(): string {
    const prefix = 'RFT';
    const timestamp = Date.now().toString(36).toUpperCase();
    const random = Math.random().toString(36).substr(2, 4).toUpperCase();
    return `${prefix}-${timestamp}-${random}`;
  }
}

export const bookingService = new BookingService();