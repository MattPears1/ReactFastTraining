import apiClient from './client';

export interface CalendarEvent {
  id: string;
  title: string;
  date: string;
  start: string;
  end: string;
  location: string;
  availableSpots: number;
  maxCapacity: number;
  color: string;
  extendedProps: {
    currentBookings: number;
    percentFull: number;
    status: string;
  };
}

export interface SessionAvailability {
  sessionId: string;
  courseType: string;
  sessionDate: string;
  startTime: string;
  endTime: string;
  location: string;
  currentBookings: number;
  maxCapacity: number;
  availableSpots: number;
  status: 'AVAILABLE' | 'ALMOST_FULL' | 'FULL';
}

export interface SessionFilters {
  startDate?: Date;
  endDate?: Date;
  courseType?: string;
  location?: string;
  showOnlyAvailable?: boolean;
}

export interface CourseType {
  id: string;
  name: string;
  duration: string;
  color: string;
}

export interface Location {
  id: string;
  name: string;
}

export const calendarApi = {
  /**
   * Get calendar events for date range
   */
  async getAvailability(params: {
    startDate: Date;
    endDate: Date;
    courseType?: string;
    location?: string;
  }): Promise<CalendarEvent[]> {
    const queryParams = new URLSearchParams({
      startDate: params.startDate.toISOString(),
      endDate: params.endDate.toISOString(),
    });

    if (params.courseType) {
      queryParams.append('courseType', params.courseType);
    }
    if (params.location) {
      queryParams.append('location', params.location);
    }

    const response = await apiClient.get(`/calendar/availability?${queryParams}`);
    return response.data;
  },

  /**
   * Get filtered sessions with capacity information
   */
  async getFilteredSessions(filters: SessionFilters): Promise<SessionAvailability[]> {
    const params: any = {};
    
    if (filters.startDate) params.startDate = filters.startDate.toISOString();
    if (filters.endDate) params.endDate = filters.endDate.toISOString();
    if (filters.courseType) params.courseType = filters.courseType;
    if (filters.location) params.location = filters.location;
    if (filters.showOnlyAvailable !== undefined) params.showOnlyAvailable = filters.showOnlyAvailable;

    const response = await apiClient.get('/calendar/sessions', { params });
    return response.data;
  },

  /**
   * Check availability for a specific session
   */
  async checkSessionAvailability(sessionId: string): Promise<{
    available: boolean;
    currentCount: number;
    remainingSpots: number;
  }> {
    const response = await apiClient.get(`/calendar/sessions/${sessionId}/availability`);
    return response.data;
  },

  /**
   * Get available course types
   */
  async getCourseTypes(): Promise<CourseType[]> {
    const response = await apiClient.get('/calendar/course-types');
    return response.data;
  },

  /**
   * Get available locations
   */
  async getLocations(): Promise<Location[]> {
    const response = await apiClient.get('/calendar/locations');
    return response.data;
  },
};