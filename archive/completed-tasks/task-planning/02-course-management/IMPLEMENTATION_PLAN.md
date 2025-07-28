# Course Management System Implementation Plan

## Architecture Analysis (--ultrathink)

### System Overview
The course management system is the core of React Fast Training's operations. It manages course scheduling, capacity tracking, and attendance for a single-instructor business with strict 12-person limits per session.

### Key Architectural Decisions

1. **Database Design**
   - Leverage existing LoopBack 4 Course and CourseSession models
   - Add new tables: attendance tracking
   - Use PostgreSQL transactions for atomic booking operations
   - Implement row-level locking to prevent overbooking

2. **Real-Time Architecture**
   - Primary: WebSocket for instant updates
   - Fallback: HTTP polling every 5 seconds
   - Event-driven updates for capacity changes
   - Optimistic UI updates with rollback on failure

3. **State Management**
   - React Context for global course data
   - Local component state for filters
   - WebSocket subscription management
   - Cache invalidation on updates

4. **Business Rules Engine**
   - Hard capacity limit: 12 attendees
   - Location constraints: A or B only
   - No waitlist functionality
   - Single instructor scheduling
   - Certificate eligibility tracking

### Integration Strategy

1. **Existing System Integration**
   - Use existing Course model from `/backend-loopback4/src/models/course.model.ts`
   - Extend CourseSession model for scheduling
   - Leverage existing authentication (from Worker 1)
   - Provide APIs for booking system (Worker 3)

2. **API Design**
   - RESTful endpoints for CRUD operations
   - WebSocket events for real-time updates
   - Batch operations for performance
   - Consistent error handling

3. **Frontend Architecture**
   - Component hierarchy: Page → Container → UI Components
   - Shared hooks for data fetching
   - Responsive design with mobile-first approach
   - Progressive enhancement

## Implementation Order

### Phase 1: Backend Foundation (Tasks 08-01 to 08-04)
1. Database migrations
2. Core services (CourseSession, Capacity)
3. API controllers
4. WebSocket setup

### Phase 2: Frontend Calendar (Tasks 08-05 to 08-07)
1. Calendar component with react-big-calendar
2. Real-time update integration
3. Mobile-responsive views

### Phase 3: Filtering System (Tasks 09-01 to 09-06)
1. Filter components
2. Capacity indicators
3. Course listing with filters
4. Mobile optimization

### Phase 4: Admin Tools (Tasks 10-01 to 10-07)
1. Course creation forms
2. Attendance tracking
3. Recurring sessions
4. Conflict detection

### Phase 5: Integration & Testing
1. Connect all components
2. End-to-end testing
3. Performance optimization
4. Documentation

## Technical Specifications

### Database Schema Extensions
```sql
-- Using existing course_sessions from LoopBack
-- Add attendance table
CREATE TABLE attendance (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id UUID NOT NULL,
  session_id UUID NOT NULL,
  user_id UUID NOT NULL,
  status VARCHAR(20) NOT NULL,
  notes TEXT,
  marked_by UUID,
  marked_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Add indexes for performance
CREATE INDEX idx_attendance_session ON attendance(session_id);
CREATE INDEX idx_attendance_user ON attendance(user_id);
CREATE INDEX idx_sessions_availability ON course_sessions(session_date, status)
  WHERE current_bookings < max_capacity;
```

### API Endpoints
- `GET /api/calendar/availability` - Get available sessions
- `GET /api/courses/sessions` - Get filtered sessions
- `POST /api/courses/sessions` - Create new session (admin)
- `PUT /api/courses/sessions/:id` - Update session (admin)
- `DELETE /api/courses/sessions/:id` - Cancel session (admin)
- `POST /api/courses/sessions/:id/attendance` - Mark attendance (admin)

### WebSocket Events
- `session-update` - Capacity changes
- `session-created` - New session available
- `session-cancelled` - Session cancelled
- `booking-confirmed` - Booking successful

### Performance Targets
- Calendar load: < 500ms
- Filter response: < 200ms
- Real-time update latency: < 100ms
- Mobile performance score: > 90

## Risk Mitigation

1. **Race Conditions**
   - Use database transactions
   - Implement optimistic locking
   - Queue booking requests

2. **WebSocket Failures**
   - Automatic reconnection
   - Polling fallback
   - Offline queue

3. **Capacity Violations**
   - Database constraints
   - Service-level validation
   - UI prevention

4. **Performance Issues**
   - Database indexing
   - Query optimization
   - Caching strategy

## Success Criteria

1. Zero overbooking incidents
2. Real-time updates work 99% of the time
3. Mobile users can book courses easily
4. Admin can manage sessions efficiently
5. All tests pass with > 90% coverage

## Notes for Other Workers

- Worker 1 (Auth): We'll use your auth context for admin features
- Worker 3 (Booking): Our APIs will provide session availability
- APIs will follow LoopBack 4 conventions
- WebSocket service will be modular for reuse