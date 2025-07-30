export interface BookingHistoryItem {
  booking: {
    id: string;
    bookingReference: string;
    status: "confirmed" | "pending" | "cancelled";
    createdAt: string;
    userId: string;
  };
  session: {
    id: string;
    courseType: string;
    sessionDate: string;
    startTime: string;
    endTime: string;
    location: string;
    status: "scheduled" | "in-progress" | "completed" | "cancelled";
  };
  attendeeCount: number;
  payment?: {
    id: string;
    amount: number;
    status: "pending" | "completed" | "failed";
    createdAt: string;
  };
  refund?: {
    id: string;
    amount: number;
    status: "pending" | "processed" | "rejected";
    processedAt?: string;
  };
  invoice?: {
    id: string;
    invoiceNumber: string;
    issueDate: string;
  };
  hasSpecialRequirements: boolean;
  certificateAvailable: boolean;
}

export interface BookingFilters {
  status?: string;
  startDate?: Date | null;
  endDate?: Date | null;
  courseType?: string;
  searchTerm?: string;
}

export interface BookingDetails extends BookingHistoryItem {
  attendees: BookingAttendee[];
  requirements: SpecialRequirement[];
  attendance: AttendanceRecord[];
}

export interface BookingAttendee {
  id: string;
  name: string;
  email: string;
  phone?: string;
  isPrimary: boolean;
}

export interface AttendanceRecord {
  id: string;
  userId: string;
  bookingId: string;
  status: "present" | "absent";
  markedAt: string;
}

export interface SpecialRequirement {
  id: string;
  bookingId: string;
  category: "medical" | "dietary" | "accessibility" | "other";
  requirementType: string;
  details?: string;
}

export interface PaginationInfo {
  limit: number;
  offset: number;
  total: number;
  hasMore: boolean;
}

export interface BookingHistoryResponse {
  bookings: BookingHistoryItem[];
  pagination: PaginationInfo;
}
