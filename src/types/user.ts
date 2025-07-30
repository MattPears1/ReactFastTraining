export interface User {
  id: string;
  email: string;
  name: string;
  role: "customer" | "admin" | "instructor";
  emailVerified: boolean;

  // Customer Information
  phone?: string;
  companyName?: string;
  addressLine1?: string;
  addressLine2?: string;
  city?: string;
  county?: string;
  postcode?: string;
  country?: string;
  customerType?: "individual" | "corporate";

  // Emergency Contact
  emergencyContactName?: string;
  emergencyContactPhone?: string;
  emergencyContactRelationship?: string;

  // Medical/Dietary
  medicalNotes?: string;
  dietaryRequirements?: string;
  hasMedicalConditions?: boolean;

  // Preferences
  marketingConsent: boolean;
  smsConsent: boolean;
  newsletterSubscribed: boolean;
  preferredContactMethod?: string;

  // Statistics
  totalBookings: number;
  totalSpent: number | string;
  lastBookingDate?: string;
  firstBookingDate?: string;
  customerSince?: string;
  lastActivityDate?: string;

  // Timestamps
  createdAt: string;
  updatedAt: string;
}

export interface UserWithDetails extends User {
  recentBookings: Array<{
    id: string;
    bookingReference: string;
    sessionId: string;
    numberOfAttendees: number;
    totalAmount: string;
    status: string;
    createdAt: string;
  }>;
  paymentSummary: {
    totalPaid: number;
    totalRefunded: number;
    lastPaymentDate?: string;
  };
  upcomingBookingsCount: number;
}

export interface UserSearchParams {
  search?: string;
  role?: string;
  customerType?: string;
  hasBookings?: boolean;
  limit?: number;
  offset?: number;
}

export interface UserListResponse {
  data: User[];
  total: number;
  limit: number;
  offset: number;
}

export interface UserStatsResponse {
  user: {
    id: string;
    email: string;
    name: string;
    role: string;
    customerSince?: string;
    lastActivityDate?: string;
  };
  bookings: {
    total: number;
    confirmed: number;
    cancelled: number;
    upcoming: number;
    totalParticipants: number;
  };
  financials: {
    totalSpent: number | string;
    totalPaid: number;
    totalRefunded: number;
    netRevenue: number;
  };
  engagement: {
    marketingConsent: boolean;
    newsletterSubscribed: boolean;
    preferredContactMethod?: string;
    lastBookingDate?: string;
  };
}
