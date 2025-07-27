import { api } from '../api.service';

export interface CourseSession {
  id: string;
  courseId: string;
  courseType: string;
  sessionDate: string;
  startTime: string;
  endTime: string;
  location: string;
  price: number;
  maxParticipants: number;
  currentBookings: number;
  status: 'scheduled' | 'full' | 'cancelled';
}

export interface SessionFilters {
  courseType?: string;
  month?: number;
  year?: number;
  location?: string;
}

export const courseApi = {
  async getAvailableSessions(filters: SessionFilters): Promise<CourseSession[]> {
    const params = new URLSearchParams();
    if (filters.courseType) params.append('courseType', filters.courseType);
    if (filters.month !== undefined) params.append('month', filters.month.toString());
    if (filters.year) params.append('year', filters.year.toString());
    if (filters.location) params.append('location', filters.location);

    const response = await api.get(`/api/course-sessions/available?${params.toString()}`);
    return response.data;
  },

  async getSession(sessionId: string): Promise<CourseSession> {
    const response = await api.get(`/api/course-sessions/${sessionId}`);
    return response.data;
  },

  async checkAvailability(sessionId: string, attendeeCount: number) {
    const response = await api.post('/api/bookings/validate-session', {
      sessionId,
      attendeeCount,
    });
    return response.data;
  },
};