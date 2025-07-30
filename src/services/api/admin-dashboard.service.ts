import apiClient from "./client";

// Types
export interface DashboardStats {
  today: {
    count: number;
    revenue: number;
  };
  week: {
    count: number;
    revenue: number;
    attendees: number;
  };
  month: {
    count: number;
    revenue: number;
    attendees: number;
  };
  upcomingSessions: SessionSummary[];
  pendingRefunds: {
    count: number;
    totalAmount: number;
  };
  recentActivity: ActivityLog[];
  chartData: {
    dailyStats: DailyStats[];
    coursePopularity: CourseStats[];
  };
}

export interface SessionSummary {
  session: any;
  bookingsCount: number;
  attendeesCount: number;
  remainingSpots: number;
}

export interface ActivityLog {
  type: "new_booking" | "cancellation" | "update";
  booking: any;
  user: any;
  timestamp: Date;
}

export interface DailyStats {
  date: string;
  bookings: number;
  revenue: number;
  attendees: number;
}

export interface CourseStats {
  courseType: string;
  bookings: number;
  attendees: number;
  revenue: number;
}

export interface AdminBooking {
  id: string;
  bookingReference: string;
  userName: string;
  userEmail: string;
  courseType: string;
  sessionDate: Date;
  attendeeCount: number;
  status: string;
  totalAmount: number;
  paymentStatus: string;
  hasRefund: boolean;
  createdAt: Date;
}

export interface BookingListResponse {
  bookings: AdminBooking[];
  total: number;
  page: number;
  totalPages: number;
}

export interface CalendarEvent {
  id: string;
  title: string;
  start: string;
  end: string;
  location: string;
  instructor: string;
  capacity: {
    max: number;
    booked: number;
    available: number;
    percentFull: number;
    status: "available" | "filling" | "nearly-full" | "full";
  };
  stats: {
    bookings: number;
    revenue: number;
    waitlist: number;
    hasSpecialRequirements: boolean;
  };
  color: string;
  editable: boolean;
}

export interface SessionBooking {
  id: string;
  bookingReference: string;
  userName: string;
  userEmail: string;
  attendeeCount: number;
  totalAmount: number;
  paymentStatus: string;
  hasSpecialRequirements: boolean;
}

export interface SessionDetails {
  session: any;
  bookings: SessionBooking[];
  totalRevenue: number;
  specialRequirements: any[];
}

export interface ClientListItem {
  user: {
    id: string;
    name: string;
    email: string;
    createdAt: Date;
  };
  stats: {
    bookingCount: number;
    totalSpend: number;
    lastBookingDate: Date | null;
    completedCourses: number;
    upcomingBookings: number;
  };
}

export interface ClientListResponse {
  clients: ClientListItem[];
  total: number;
}

export interface ClientDetails {
  client: any;
  stats: {
    totalBookings: number;
    totalSpent: number;
    totalAttendees: number;
    completedCourses: number;
    cancelledBookings: number;
  };
  recentBookings: any[];
  specialRequirements: any[];
  communications: any[];
  notes: any[];
}

// Admin Dashboard API Service
export const adminDashboardApi = {
  // Dashboard Statistics
  async getDashboardStats(dateRange?: {
    start: Date;
    end: Date;
  }): Promise<DashboardStats> {
    const params = dateRange
      ? {
          startDate: dateRange.start.toISOString(),
          endDate: dateRange.end.toISOString(),
        }
      : undefined;

    const response = await apiClient.get("/admin/dashboard/stats", { params });
    return response.data;
  },

  // Booking Management
  async getBookingList(filters: {
    search?: string;
    status?: string;
    dateFrom?: Date;
    dateTo?: Date;
    courseType?: string;
    page?: number;
    limit?: number;
  }): Promise<BookingListResponse> {
    const params: any = {
      page: filters.page || 1,
      limit: filters.limit || 25,
    };

    if (filters.search) params.search = filters.search;
    if (filters.status) params.status = filters.status;
    if (filters.dateFrom) params.dateFrom = filters.dateFrom.toISOString();
    if (filters.dateTo) params.dateTo = filters.dateTo.toISOString();
    if (filters.courseType) params.courseType = filters.courseType;

    const response = await apiClient.get("/admin/bookings", { params });
    return response.data;
  },

  async bulkCancelBookings(bookingIds: string[]): Promise<any> {
    const response = await apiClient.post("/admin/bookings/bulk-cancel", {
      bookingIds,
    });
    return response.data;
  },

  async exportBookings(filters: any): Promise<Blob> {
    const response = await apiClient.get("/admin/bookings/export", {
      params: filters,
      responseType: "blob",
    });
    return response.data;
  },

  // Calendar Management
  async getCalendarSessions(
    startDate: Date,
    endDate: Date,
    filters?: { courseType?: string; location?: string },
  ): Promise<CalendarEvent[]> {
    const params: any = {
      startDate: startDate.toISOString(),
      endDate: endDate.toISOString(),
    };

    if (filters?.courseType) params.courseType = filters.courseType;
    if (filters?.location) params.location = filters.location;

    const response = await apiClient.get("/admin/calendar/sessions", {
      params,
    });
    return response.data;
  },

  async getSessionDetails(sessionId: string): Promise<SessionDetails> {
    const response = await apiClient.get(
      `/admin/sessions/${sessionId}/details`,
    );
    return response.data;
  },

  async rescheduleSession(
    sessionId: string,
    newDate: Date,
    startTime: string,
    endTime: string,
  ): Promise<any> {
    const response = await apiClient.put(
      `/admin/sessions/${sessionId}/reschedule`,
      {
        newDate: newDate.toISOString(),
        startTime,
        endTime,
      },
    );
    return response.data;
  },

  async cancelSession(sessionId: string): Promise<any> {
    const response = await apiClient.delete(`/admin/sessions/${sessionId}`);
    return response.data;
  },

  async createSession(data: {
    courseType: string;
    sessionDate: Date;
    startTime: string;
    endTime: string;
    maxCapacity: number;
    location: string;
    price: number;
    notes?: string;
  }): Promise<any> {
    const response = await apiClient.post("/admin/sessions", {
      ...data,
      sessionDate: data.sessionDate.toISOString(),
    });
    return response.data;
  },

  async updateSession(sessionId: string, updates: any): Promise<any> {
    const response = await apiClient.put(
      `/admin/sessions/${sessionId}`,
      updates,
    );
    return response.data;
  },

  // Client Management
  async getClientList(
    filters: {
      search?: string;
      hasBookings?: boolean;
      dateFrom?: Date;
      dateTo?: Date;
      minSpend?: number;
    },
    sort?: {
      field: "name" | "created" | "lastBooking" | "totalSpend" | "bookingCount";
      direction: "asc" | "desc";
    },
    pagination?: {
      limit: number;
      offset: number;
    },
  ): Promise<ClientListResponse> {
    const params: any = {};

    if (filters.search) params.search = filters.search;
    if (filters.hasBookings !== undefined)
      params.hasBookings = filters.hasBookings;
    if (filters.dateFrom) params.dateFrom = filters.dateFrom.toISOString();
    if (filters.dateTo) params.dateTo = filters.dateTo.toISOString();
    if (filters.minSpend) params.minSpend = filters.minSpend;

    if (sort) {
      params.sortField = sort.field;
      params.sortDirection = sort.direction;
    }

    if (pagination) {
      params.limit = pagination.limit;
      params.offset = pagination.offset;
    }

    const response = await apiClient.get("/admin/clients", { params });
    return response.data;
  },

  async getClientDetails(clientId: string): Promise<ClientDetails> {
    const response = await apiClient.get(`/admin/clients/${clientId}`);
    return response.data;
  },

  async addClientNote(clientId: string, note: string): Promise<any> {
    const response = await apiClient.post(`/admin/clients/${clientId}/notes`, {
      note,
    });
    return response.data;
  },

  async exportClientData(clientId: string): Promise<Blob> {
    const response = await apiClient.get(`/admin/clients/${clientId}/export`, {
      responseType: "blob",
    });
    return response.data;
  },

  async exportAllClients(filters?: any): Promise<Blob> {
    const response = await apiClient.get("/admin/clients/export-all", {
      params: filters,
      responseType: "blob",
    });
    return response.data;
  },

  async mergeClients(
    primaryClientId: string,
    secondaryClientId: string,
  ): Promise<any> {
    const response = await apiClient.post("/admin/clients/merge", {
      primaryClientId,
      secondaryClientId,
    });
    return response.data;
  },

  // Email Management
  async sendBulkEmail(
    clientIds: string[],
    emailData: {
      subject: string;
      message: string;
      template?: string;
    },
  ): Promise<any> {
    const response = await apiClient.post("/admin/emails/bulk", {
      clientIds,
      ...emailData,
    });
    return response.data;
  },

  async sendIndividualEmail(
    clientId: string,
    emailData: {
      subject: string;
      message: string;
      template?: string;
    },
  ): Promise<any> {
    const response = await apiClient.post(
      `/admin/clients/${clientId}/email`,
      emailData,
    );
    return response.data;
  },

  // Audit Trail
  async getAuditLog(filters?: {
    adminId?: string;
    action?: string;
    dateFrom?: Date;
    dateTo?: Date;
    page?: number;
    limit?: number;
  }): Promise<any> {
    const params: any = {
      page: filters?.page || 1,
      limit: filters?.limit || 50,
    };

    if (filters?.adminId) params.adminId = filters.adminId;
    if (filters?.action) params.action = filters.action;
    if (filters?.dateFrom) params.dateFrom = filters.dateFrom.toISOString();
    if (filters?.dateTo) params.dateTo = filters.dateTo.toISOString();

    const response = await apiClient.get("/admin/audit-log", { params });
    return response.data;
  },
};

// Export as default for backward compatibility
export default adminDashboardApi;
