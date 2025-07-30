export interface Attendee {
  id: number;
  name: string;
  email: string;
  phone?: string;
  paymentStatus: string;
  bookingStatus: string;
  bookingId: number;
}

export interface SessionFormData {
  courseId: string;
  venueId: string;
  date: string;
  startTime: string;
  endTime: string;
  maxCapacity: number;
  notes: string;
}

export interface Course {
  id: string;
  name: string;
  price: number;
  duration: string;
}

export interface Venue {
  id: string;
  name: string;
  address: string;
  capacity: number;
}

export interface SessionDetail {
  id: string;
  course_id: string;
  venue_id: string;
  courseName: string;
  venueName: string;
  date: string;
  startTime: string;
  endTime: string;
  maxParticipants: number;
  currentBookings: number;
  status: string;
  notes?: string;
  revenue: number;
  instructor?: string;
  bookings: Booking[];
}

export interface Booking {
  id: number;
  userName: string;
  userEmail: string;
  userPhone?: string;
  payment_status: string;
  payment_amount: number;
  booking_status: string;
}

export interface CancellationReason {
  id: number;
  reason: string;
  requires_details: boolean;
}