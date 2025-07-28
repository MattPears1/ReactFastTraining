export type CourseTypeCode =
  | "EFAW"
  | "FAW"
  | "PAEDIATRIC"
  | "EMERGENCY_PAEDIATRIC"
  | "FAW_REQUALIFICATION"
  | "EFAW_REQUALIFICATION"
  | "PAEDIATRIC_REQUALIFICATION"
  | "EMERGENCY_PAEDIATRIC_REQUALIFICATION"
  | "ACTIVITY_FIRST_AID"
  | "ACTIVITY_FIRST_AID_REQUALIFICATION"
  | "CPR_AED"
  | "ANNUAL_SKILLS_REFRESHER"
  | "OXYGEN_THERAPY";

export type VenueCode =
  | "SHEFFIELD"
  | "LEEDS"
  | "BARNSLEY"
  | "DONCASTER"
  | "ROTHERHAM";

export type BookingStatus = "pending" | "confirmed" | "cancelled" | "completed";
export type PaymentStatus = "pending" | "paid" | "refunded" | "partial_refund";

export interface CourseSchedule {
  id: number;
  courseType: CourseTypeCode;
  courseName: string;
  startDate: string;
  endDate: string;
  venue: VenueCode;
  venueName: string;
  venueAddress: string;
  availableSpots: number;
  maxParticipants: number;
  pricePerPerson: number;
  instructorName: string;
}

export interface BookingFormData {
  courseSessionId: number;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  companyName?: string;
  numberOfParticipants: number;
  participantDetails?: ParticipantDetail[];
  specialRequirements?: string;
  agreedToTerms: boolean;
}

export interface ParticipantDetail {
  firstName: string;
  lastName: string;
  email?: string;
  dietaryRequirements?: string;
  medicalConditions?: string;
}

export interface Booking {
  id: string;
  bookingReference: string;
  courseSchedule: CourseSchedule;
  primaryContact: {
    firstName: string;
    lastName: string;
    email: string;
    phone: string;
    companyName?: string;
  };
  participants: ParticipantDetail[];
  totalAmount: number;
  bookingStatus: BookingStatus;
  paymentStatus: PaymentStatus;
  paymentIntentId?: string;
  specialRequirements?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CourseTypeConfig {
  code: CourseTypeCode;
  name: string;
  duration: string;
  price: number;
  certificateValidity: string;
  color: {
    border: string;
    background: string;
    dot: string;
  };
  category: "workplace" | "paediatric" | "specialist";
  description: string;
}

export interface VenueConfig {
  code: VenueCode;
  name: string;
  address: string;
  city: string;
  postcode?: string;
  facilities?: string[];
  parkingInfo?: string;
  publicTransport?: string;
}
