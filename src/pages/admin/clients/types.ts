export interface Client {
  id: string;
  name: string;
  email: string;
  phone?: string;
  address?: string;
  createdAt: string;
  stats: {
    bookingCount: number;
    totalSpend: number;
    lastBookingDate?: string;
    completedCourses: number;
    upcomingBookings: number;
  };
  specialRequirements?: string[];
}

export interface FilterState {
  search: string;
  hasBookings: string;
  dateFrom: string;
  dateTo: string;
  minSpend: string;
}

export interface SortState {
  field: "name" | "created" | "lastBooking" | "totalSpend" | "bookingCount";
  direction: "asc" | "desc";
}
