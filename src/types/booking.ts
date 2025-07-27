export interface Booking {
  id: string;
  // Course details
  courseId: number;
  courseName: string;
  courseDate: string;
  courseTime: string;
  courseVenue: string;
  coursePrice: number;
  
  // Customer details
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  companyName?: string;
  
  // Booking details
  bookingDate: string;
  bookingReference: string;
  status: 'pending' | 'confirmed' | 'cancelled' | 'completed';
  paymentStatus: 'pending' | 'paid' | 'refunded';
  paymentMethod: 'card' | 'bank_transfer' | 'cash';
  paymentIntentId?: string;
  
  // Additional info
  notes?: string;
  attendees: number;
  totalAmount: number;
  
  // Timestamps
  createdAt: string;
  updatedAt: string;
}

export interface CourseSchedule {
  id: string;
  courseId: number;
  courseName: string;
  date: string;
  time: string;
  venue: string;
  instructor: string;
  maxCapacity: number;
  currentCapacity: number;
  price: number;
  status: 'scheduled' | 'in_progress' | 'completed' | 'cancelled';
  bookings?: Booking[];
}

export interface BookingFilters {
  search?: string;
  status?: string;
  courseId?: number;
  dateFrom?: string;
  dateTo?: string;
  paymentStatus?: string;
}