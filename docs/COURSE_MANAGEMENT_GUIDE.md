# Course Management Implementation Guide

## Overview

This guide provides practical examples and implementation details for the React Fast Training course management system.

## Key Features

1. **Real-time Availability Calendar** - Shows course sessions with live capacity updates
2. **Course Filtering** - Filter by type, location, date, and availability
3. **Capacity Management** - Hard limit of 12 participants per session
4. **Admin Interface** - Create sessions and mark attendance
5. **WebSocket Updates** - Real-time synchronization across clients

## Component Architecture

```
src/
├── components/
│   ├── booking/
│   │   ├── AvailabilityCalendar.tsx    # Main calendar view
│   │   ├── MobileCalendar.tsx          # Mobile-optimized calendar
│   │   ├── CourseFilters.tsx           # Filter controls
│   │   ├── FilteredCourseList.tsx      # Filtered course listing
│   │   └── CapacityIndicator.tsx       # Visual capacity display
│   └── admin/
│       ├── AdminDashboard.tsx          # Admin overview
│       ├── CourseCreationForm.tsx      # Create new sessions
│       └── AttendanceMarking.tsx       # Mark attendance
├── services/
│   ├── api/
│   │   ├── client.ts                   # Base API client
│   │   └── admin.service.ts            # Admin API methods
│   └── websocket.service.ts            # WebSocket integration
└── hooks/
    └── useWebSocket.ts                 # WebSocket React hook
```

## Usage Examples

### 1. Display Available Courses

```tsx
import { FilteredCourseList } from '@components/booking/FilteredCourseList';

function BookingPage() {
  return (
    <div className="container mx-auto p-4">
      <h1>Book Your First Aid Course</h1>
      <FilteredCourseList />
    </div>
  );
}
```

### 2. Show Calendar View

```tsx
import { AvailabilityCalendar } from '@components/booking/AvailabilityCalendar';

function CalendarPage() {
  const handleDateSelect = (date: Date, sessions: any[]) => {
    // Handle date selection
    console.log('Selected date:', date, 'Available sessions:', sessions);
  };

  return (
    <AvailabilityCalendar 
      onDateSelect={handleDateSelect}
      className="max-w-4xl mx-auto"
    />
  );
}
```

### 3. Admin Dashboard

```tsx
import { AdminDashboard } from '@components/admin/AdminDashboard';
import { useAuth } from '@contexts/AuthContext';

function AdminPage() {
  const { user, isAuthenticated } = useAuth();

  if (!isAuthenticated || user?.role !== 'admin') {
    return <Navigate to="/login" />;
  }

  return <AdminDashboard />;
}
```

### 4. Real-time Updates with WebSocket

```tsx
import { useWebSocket } from '@hooks/useWebSocket';

function LiveCapacityDisplay({ sessionId }) {
  const [capacity, setCapacity] = useState({ booked: 0, available: 12 });

  const { isConnected } = useWebSocket({
    onCapacityUpdate: (data) => {
      if (data.sessionId === sessionId) {
        setCapacity({
          booked: data.booked,
          available: data.available
        });
      }
    }
  });

  return (
    <div>
      <p>Capacity: {capacity.booked}/12 booked</p>
      {!isConnected && <p>Real-time updates unavailable</p>}
    </div>
  );
}
```

## Business Rules

### Capacity Limits
- Maximum 12 participants per session (enforced at database level)
- Sessions show as "Full" when reaching capacity
- No waitlist functionality

### Locations
- Only two locations: Location A and Location B
- Single instructor (Lex) for all sessions

### Course Durations
- All courses are single-day only
- Half day: 3-4 hours
- Full day: 4-6 hours
- No multi-day courses

## Backend Services

### Course Session Capacity Service

Located at: `/backend-loopback4/src/services/course-session-capacity.service.ts`

Key methods:
- `getAvailableSessions()` - Get sessions with available spots
- `incrementBooking()` - Atomic booking with capacity check
- `decrementBooking()` - Handle cancellations

### WebSocket Service

Located at: `/backend-loopback4/src/services/websocket.service.ts`

Events emitted:
- `capacityUpdate` - When booking/cancellation occurs
- `sessionUpdate` - When session created/modified
- `attendanceUpdate` - When attendance marked

## Database Schema

### Key Tables

1. **course_sessions**
   - id (UUID)
   - courseId
   - startDate/endDate
   - startTime/endTime
   - currentParticipants (0-12)
   - maxParticipants (12)
   - status

2. **bookings**
   - id (UUID)
   - bookingReference (RFT-YYYY-NNNN)
   - sessionId
   - numberOfParticipants
   - status
   - participants (JSON)

3. **attendance**
   - id (UUID)
   - sessionId
   - bookingId
   - userId
   - status (PRESENT/ABSENT/LATE/PARTIAL)
   - markedBy
   - markedAt

## Testing

### Integration Tests
```bash
npm run test:integration
```

Key test files:
- `/src/__tests__/integration/booking-flow.test.tsx`
- `/src/__tests__/integration/websocket-updates.test.tsx`

### Manual Testing Checklist
1. ✓ Book a course (verify capacity updates)
2. ✓ Try booking full session (should fail)
3. ✓ Create admin session
4. ✓ Mark attendance
5. ✓ Test real-time updates across browsers
6. ✓ Test mobile responsiveness

## Deployment Considerations

1. **Environment Variables**
   ```env
   VITE_API_URL=https://api.reactfasttraining.co.uk
   VITE_WS_URL=wss://api.reactfasttraining.co.uk
   DATABASE_URL=postgresql://...
   JWT_SECRET=...
   ```

2. **Database Migrations**
   ```bash
   npm run migrate
   ```

3. **WebSocket Configuration**
   - Ensure WebSocket support on hosting platform
   - Configure CORS for production domain

4. **Performance**
   - Calendar view loads max 3 months of data
   - WebSocket fallback to polling (30s intervals)
   - Debounced capacity updates

## Troubleshooting

### Common Issues

1. **"Session is full" error**
   - Check currentParticipants < 12
   - Verify atomic booking transaction

2. **WebSocket not connecting**
   - Check CORS configuration
   - Verify WebSocket port is open
   - Falls back to polling automatically

3. **Attendance not saving**
   - Ensure session status is not CANCELLED
   - Verify booking belongs to session
   - Check admin authentication

## Future Enhancements

1. **Waitlist functionality** (currently not implemented)
2. **Email notifications** for capacity changes
3. **Automated certificate generation**
4. **Mobile app** for attendance marking
5. **Advanced reporting** dashboard