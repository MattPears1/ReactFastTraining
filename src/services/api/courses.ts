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

    try {
      const response = await api.get(`/course-sessions/available?${params.toString()}`);
      
      // Transform backend data to frontend format
      return response.data.map((session: any) => ({
        id: session.id,
        courseId: session.courseId,
        courseType: session.course?.name || session.course?.type || 'Unknown Course',
        sessionDate: session.startDate.split('T')[0], // Extract date part
        startTime: session.startTime,
        endTime: session.endTime,
        location: session.location?.name || session.location?.address || 'Unknown Location',
        price: session.pricePerPerson || 0,
        maxParticipants: session.maxParticipants,
        currentBookings: session.currentParticipants || 0,
        status: session.status?.toLowerCase() === 'cancelled' ? 'cancelled' : 
                session.currentParticipants >= session.maxParticipants ? 'full' : 'scheduled'
      }));
    } catch (error) {
      console.error('Failed to fetch sessions from API, using fallback data:', error);
      // Fallback to mock data if API fails
      return [
        {
          id: '1',
          courseId: 'course-1',
          courseType: 'Emergency First Aid at Work',
          sessionDate: '2025-02-15',
          startTime: '09:00',
          endTime: '17:00',
          location: 'Leeds Training Centre',
          price: 75,
          maxParticipants: 12,
          currentBookings: 8,
          status: 'scheduled'
        },
        {
          id: '2',
          courseId: 'course-2',
          courseType: 'First Aid at Work',
          sessionDate: '2025-02-20',
          startTime: '09:00',
          endTime: '17:00',
          location: 'Sheffield Training Centre',
          price: 200,
          maxParticipants: 12,
          currentBookings: 12,
          status: 'full'
        },
        {
          id: '3',
          courseId: 'course-3',
          courseType: 'Paediatric First Aid',
          sessionDate: '2025-02-25',
          startTime: '09:00',
          endTime: '15:00',
          location: 'York Training Centre',
          price: 85,
          maxParticipants: 10,
          currentBookings: 6,
          status: 'scheduled'
        }
      ];
    }
  },

  async getSession(sessionId: string): Promise<CourseSession> {
    const response = await api.get(`/course-sessions/${sessionId}`);
    
    // Transform backend data to frontend format
    const session = response.data;
    return {
      id: session.id,
      courseId: session.courseId,
      courseType: session.course?.name || session.course?.type || 'Unknown Course',
      sessionDate: session.startDate.split('T')[0],
      startTime: session.startTime,
      endTime: session.endTime,
      location: session.location?.name || session.location?.address || 'Unknown Location',
      price: session.pricePerPerson || 0,
      maxParticipants: session.maxParticipants,
      currentBookings: session.currentParticipants || 0,
      status: session.status?.toLowerCase() === 'cancelled' ? 'cancelled' : 
              session.currentParticipants >= session.maxParticipants ? 'full' : 'scheduled'
    };
  },

  async checkAvailability(sessionId: string, attendeeCount: number) {
    const response = await api.post('/api/bookings/validate-session', {
      sessionId,
      attendeeCount,
    });
    return response.data;
  },
};