import React from 'react';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { vi } from 'vitest';
import { BookingPage } from '@pages/BookingPage';
import { AvailabilityCalendar } from '@components/booking/AvailabilityCalendar';
import { FilteredCourseList } from '@components/booking/FilteredCourseList';
import apiClient from '@services/api/client';
import { adminApi } from '@services/api/admin.service';

// Mock API modules
vi.mock('@services/api/client');
vi.mock('@services/api/admin.service');

// Mock WebSocket
vi.mock('@hooks/useWebSocket', () => ({
  useWebSocket: () => ({
    isConnected: true,
    emit: vi.fn(),
    on: vi.fn(),
    off: vi.fn(),
  }),
}));

const createWrapper = () => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
    },
  });

  return ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        {children}
      </BrowserRouter>
    </QueryClientProvider>
  );
};

describe('Booking Flow Integration', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Session Availability', () => {
    it('should display available sessions with correct capacity', async () => {
      const mockSessions = [
        {
          id: 'session-1',
          courseId: 'course-1',
          courseName: 'Emergency First Aid at Work',
          startDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
          endDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
          startTime: '09:00',
          endTime: '17:00',
          currentParticipants: 8,
          maxParticipants: 12,
          status: 'SCHEDULED',
          locationId: 'location-a',
          locationName: 'Location A',
          pricePerPerson: 75,
        },
        {
          id: 'session-2',
          courseId: 'course-2',
          courseName: 'Paediatric First Aid',
          startDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString(),
          endDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString(),
          startTime: '09:00',
          endTime: '13:00',
          currentParticipants: 12,
          maxParticipants: 12,
          status: 'SCHEDULED',
          locationId: 'location-b',
          locationName: 'Location B',
          pricePerPerson: 50,
        },
      ];

      vi.mocked(apiClient.get).mockResolvedValue({ data: mockSessions });

      render(<FilteredCourseList />, { wrapper: createWrapper() });

      await waitFor(() => {
        expect(screen.getByText('Emergency First Aid at Work')).toBeInTheDocument();
        expect(screen.getByText('8/12 booked')).toBeInTheDocument();
        expect(screen.getByText('Paediatric First Aid')).toBeInTheDocument();
        expect(screen.getByText('Fully Booked')).toBeInTheDocument();
      });
    });

    it('should enforce 12-person capacity limit', async () => {
      const fullSession = {
        id: 'session-full',
        courseId: 'course-1',
        courseName: 'Emergency First Aid at Work',
        startDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
        currentParticipants: 12,
        maxParticipants: 12,
        status: 'SCHEDULED',
      };

      vi.mocked(apiClient.get).mockResolvedValue({ data: [fullSession] });

      render(<FilteredCourseList />, { wrapper: createWrapper() });

      await waitFor(() => {
        const bookButton = screen.queryByRole('button', { name: /book now/i });
        expect(bookButton).not.toBeInTheDocument();
        expect(screen.getByText('Fully Booked')).toBeInTheDocument();
      });
    });
  });

  describe('Course Filtering', () => {
    it('should filter sessions by course type', async () => {
      const mockSessions = [
        {
          id: 'session-1',
          courseId: 'efaw',
          courseName: 'Emergency First Aid at Work',
          startDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
          currentParticipants: 5,
          maxParticipants: 12,
        },
        {
          id: 'session-2',
          courseId: 'paediatric',
          courseName: 'Paediatric First Aid',
          startDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
          currentParticipants: 3,
          maxParticipants: 12,
        },
      ];

      vi.mocked(apiClient.get).mockResolvedValue({ data: mockSessions });

      render(<FilteredCourseList />, { wrapper: createWrapper() });

      await waitFor(() => {
        expect(screen.getByText('Emergency First Aid at Work')).toBeInTheDocument();
        expect(screen.getByText('Paediatric First Aid')).toBeInTheDocument();
      });

      // Filter by EFAW
      const filterSelect = screen.getByLabelText(/course type/i);
      fireEvent.change(filterSelect, { target: { value: 'efaw' } });

      await waitFor(() => {
        expect(screen.getByText('Emergency First Aid at Work')).toBeInTheDocument();
        expect(screen.queryByText('Paediatric First Aid')).not.toBeInTheDocument();
      });
    });

    it('should filter sessions by location', async () => {
      const mockSessions = [
        {
          id: 'session-1',
          locationId: 'location-a',
          locationName: 'Location A',
          courseName: 'Emergency First Aid at Work',
          startDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
        },
        {
          id: 'session-2',
          locationId: 'location-b',
          locationName: 'Location B',
          courseName: 'Paediatric First Aid',
          startDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
        },
      ];

      vi.mocked(apiClient.get).mockResolvedValue({ data: mockSessions });

      render(<FilteredCourseList />, { wrapper: createWrapper() });

      await waitFor(() => {
        expect(screen.getByText('Location A')).toBeInTheDocument();
        expect(screen.getByText('Location B')).toBeInTheDocument();
      });

      // Filter by Location A
      const locationFilter = screen.getByLabelText(/location/i);
      fireEvent.change(locationFilter, { target: { value: 'location-a' } });

      await waitFor(() => {
        expect(screen.getByText('Location A')).toBeInTheDocument();
        expect(screen.queryByText('Location B')).not.toBeInTheDocument();
      });
    });
  });

  describe('Admin Course Creation', () => {
    it('should create a new course session', async () => {
      const mockCourses = [
        { id: 'efaw', name: 'Emergency First Aid at Work', duration: 'Full Day (6 hours)' },
      ];
      const mockTrainers = [{ id: 'lex-trainer-id', name: 'Lex' }];
      const mockLocations = [
        { id: 'location-a', name: 'Location A' },
        { id: 'location-b', name: 'Location B' },
      ];

      vi.mocked(adminApi.getCourses).mockResolvedValue(mockCourses);
      vi.mocked(adminApi.getTrainers).mockResolvedValue(mockTrainers);
      vi.mocked(adminApi.getLocations).mockResolvedValue(mockLocations);
      vi.mocked(adminApi.createSession).mockResolvedValue({ id: 'new-session-id' });

      const { container } = render(<CourseCreationForm />, { wrapper: createWrapper() });

      await waitFor(() => {
        expect(screen.getByText('Emergency First Aid at Work (Full Day (6 hours))')).toBeInTheDocument();
      });

      // Fill form
      fireEvent.change(screen.getByLabelText(/course type/i), { target: { value: 'efaw' } });
      fireEvent.change(screen.getByLabelText(/trainer/i), { target: { value: 'lex-trainer-id' } });
      fireEvent.change(screen.getByLabelText(/location/i), { target: { value: 'location-a' } });
      fireEvent.change(screen.getByLabelText(/max participants/i), { target: { value: '12' } });
      fireEvent.change(screen.getByLabelText(/price per person/i), { target: { value: '75' } });

      // Submit
      fireEvent.click(screen.getByRole('button', { name: /create session/i }));

      await waitFor(() => {
        expect(adminApi.createSession).toHaveBeenCalledWith(
          expect.objectContaining({
            courseId: 'efaw',
            trainerId: 'lex-trainer-id',
            locationId: 'location-a',
            maxParticipants: 12,
            pricePerPerson: 75,
          })
        );
        expect(screen.getByText(/session.*created successfully/i)).toBeInTheDocument();
      });
    });

    it('should enforce maximum 12 participants limit', async () => {
      render(<CourseCreationForm />, { wrapper: createWrapper() });

      const maxParticipantsInput = screen.getByLabelText(/max participants/i);
      
      // Try to set more than 12
      fireEvent.change(maxParticipantsInput, { target: { value: '15' } });
      
      // Check that the max attribute is set correctly
      expect(maxParticipantsInput).toHaveAttribute('max', '12');
    });
  });

  describe('Attendance Marking', () => {
    it('should mark attendance for a session', async () => {
      const mockAttendance = [
        {
          attendanceId: 'att-1',
          bookingId: 'booking-1',
          userId: 'user-1',
          userName: 'John Doe',
          userEmail: 'john@example.com',
          status: 'PENDING',
        },
        {
          attendanceId: 'att-2',
          bookingId: 'booking-2',
          userId: 'user-2',
          userName: 'Jane Smith',
          userEmail: 'jane@example.com',
          status: 'PENDING',
        },
      ];

      vi.mocked(adminApi.getSessionAttendance).mockResolvedValue(mockAttendance);
      vi.mocked(adminApi.markAttendance).mockResolvedValue([]);

      render(
        <AttendanceMarking
          sessionId="session-1"
          sessionDate={new Date()}
          courseName="Emergency First Aid at Work"
        />,
        { wrapper: createWrapper() }
      );

      await waitFor(() => {
        expect(screen.getByText('John Doe')).toBeInTheDocument();
        expect(screen.getByText('Jane Smith')).toBeInTheDocument();
      });

      // Mark John as present
      const johnPresentButton = screen.getAllByRole('button', { name: /present/i })[0];
      fireEvent.click(johnPresentButton);

      // Mark Jane as absent
      const janeAbsentButton = screen.getAllByRole('button', { name: /absent/i })[1];
      fireEvent.click(janeAbsentButton);

      // Save attendance
      fireEvent.click(screen.getByRole('button', { name: /save attendance/i }));

      await waitFor(() => {
        expect(adminApi.markAttendance).toHaveBeenCalledWith(
          'session-1',
          expect.arrayContaining([
            expect.objectContaining({ bookingId: 'booking-1', status: 'PRESENT' }),
            expect.objectContaining({ bookingId: 'booking-2', status: 'ABSENT' }),
          ]),
          'Admin'
        );
        expect(screen.getByText(/attendance saved successfully/i)).toBeInTheDocument();
      });
    });
  });

  describe('Real-time Updates', () => {
    it('should update capacity in real-time when bookings change', async () => {
      const mockSession = {
        id: 'session-1',
        courseName: 'Emergency First Aid at Work',
        currentParticipants: 8,
        maxParticipants: 12,
      };

      vi.mocked(apiClient.get).mockResolvedValue({ data: [mockSession] });

      const { rerender } = render(<FilteredCourseList />, { wrapper: createWrapper() });

      await waitFor(() => {
        expect(screen.getByText('8/12 booked')).toBeInTheDocument();
      });

      // Simulate WebSocket update
      mockSession.currentParticipants = 10;
      vi.mocked(apiClient.get).mockResolvedValue({ data: [mockSession] });

      rerender(<FilteredCourseList />);

      await waitFor(() => {
        expect(screen.getByText('10/12 booked')).toBeInTheDocument();
      });
    });
  });
});