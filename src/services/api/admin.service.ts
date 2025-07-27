import apiClient from './client';

export interface CreateSessionData {
  courseId: string;
  trainerId: string;
  locationId: string;
  startDate: Date;
  endDate: Date;
  startTime: string;
  endTime: string;
  maxParticipants?: number;
  pricePerPerson: number;
  notes?: string;
}

export interface RecurringSessionData extends CreateSessionData {
  recurrenceEndDate: Date;
  daysOfWeek: number[];
}

export interface AttendanceRecord {
  bookingId: string;
  userId: string;
  status: 'PRESENT' | 'ABSENT' | 'LATE' | 'PARTIAL';
  notes?: string;
}

export interface SessionAttendance {
  attendanceId: string;
  bookingId: string;
  userId: string;
  userName: string;
  userEmail: string;
  status: string;
  notes?: string;
  markedBy?: string;
  markedAt?: string;
}

export interface AttendanceStats {
  courseType: string;
  totalSessions: number;
  totalAttendees: number;
  presentCount: number;
  absentCount: number;
  lateCount: number;
  partialCount: number;
  attendanceRate: number;
}

export const adminApi = {
  // ========== Session Management ==========
  
  /**
   * Create a new course session
   */
  async createSession(data: CreateSessionData): Promise<any> {
    const response = await apiClient.post('/admin/sessions', data);
    return response.data;
  },

  /**
   * Create recurring sessions
   */
  async createRecurringSessions(data: RecurringSessionData): Promise<any[]> {
    const response = await apiClient.post('/admin/sessions/recurring', data);
    return response.data;
  },

  /**
   * Update a session
   */
  async updateSession(sessionId: string, updates: any): Promise<any> {
    const response = await apiClient.put(`/admin/sessions/${sessionId}`, updates);
    return response.data;
  },

  /**
   * Cancel a session
   */
  async cancelSession(sessionId: string, reason: string): Promise<any> {
    const response = await apiClient.delete(`/admin/sessions/${sessionId}`, {
      data: { reason },
    });
    return response.data;
  },

  /**
   * Clone a session to a new date
   */
  async cloneSession(sessionId: string, newDate: Date): Promise<any> {
    const response = await apiClient.post(`/admin/sessions/${sessionId}/clone`, {
      newDate: newDate.toISOString(),
    });
    return response.data;
  },

  // ========== Attendance Management ==========

  /**
   * Mark attendance for a session
   */
  async markAttendance(
    sessionId: string,
    attendance: AttendanceRecord[],
    markedBy: string
  ): Promise<any[]> {
    const response = await apiClient.post(`/admin/sessions/${sessionId}/attendance`, {
      attendance,
      markedBy,
    });
    return response.data;
  },

  /**
   * Get attendance for a session
   */
  async getSessionAttendance(sessionId: string): Promise<SessionAttendance[]> {
    const response = await apiClient.get(`/admin/sessions/${sessionId}/attendance`);
    return response.data;
  },

  /**
   * Generate attendance report
   */
  async generateAttendanceReport(params: {
    startDate: Date;
    endDate: Date;
    courseType?: string;
    trainerId?: string;
  }): Promise<AttendanceStats[]> {
    const queryParams = new URLSearchParams({
      startDate: params.startDate.toISOString(),
      endDate: params.endDate.toISOString(),
    });

    if (params.courseType) {
      queryParams.append('courseType', params.courseType);
    }
    if (params.trainerId) {
      queryParams.append('trainerId', params.trainerId);
    }

    const response = await apiClient.get(`/admin/attendance/report?${queryParams}`);
    return response.data;
  },

  /**
   * Export attendance as CSV
   */
  async exportAttendanceCSV(sessionId: string): Promise<string> {
    const response = await apiClient.get(`/admin/sessions/${sessionId}/attendance/export`, {
      responseType: 'text',
    });
    return response.data;
  },

  // ========== Helper Functions ==========

  /**
   * Get list of trainers for dropdown
   */
  async getTrainers(): Promise<Array<{id: string; name: string}>> {
    // For now, return single trainer as per requirements
    return [
      { id: 'lex-trainer-id', name: 'Lex' }
    ];
  },

  /**
   * Get list of locations for dropdown
   */
  async getLocations(): Promise<Array<{id: string; name: string}>> {
    // Simplified locations as per requirements
    return [
      { id: 'location-a', name: 'Location A' },
      { id: 'location-b', name: 'Location B' }
    ];
  },

  /**
   * Get list of courses for dropdown
   */
  async getCourses(): Promise<Array<{id: string; name: string; duration: string}>> {
    const response = await apiClient.get('/courses');
    return response.data;
  },

  // ========== Statistics ==========

  /**
   * Get session statistics
   */
  async getSessionStats(): Promise<{
    total: number;
    upcoming: number;
    completed: number;
    cancelled: number;
  }> {
    const response = await apiClient.get('/admin/stats/sessions');
    return response.data;
  },

  /**
   * Get booking statistics
   */
  async getBookingStats(): Promise<{
    total: number;
    confirmed: number;
    pending: number;
    cancelled: number;
    averageAttendance: number;
  }> {
    const response = await apiClient.get('/admin/stats/bookings');
    return response.data;
  },
};