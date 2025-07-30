# Calendar View Management

**Completion Status: 90%** ✅

## Overview
Interactive calendar interface for visualizing and managing course sessions, bookings, and capacity at a glance.

**UPDATE (Jan 27, 2025)**: Session editing functionality has been unified with a comprehensive plan. See `/todays-tasks/06-session-edit-details-plan.md` for the complete implementation strategy that integrates calendar editing with the dashboard View Details functionality.

## Implementation Status
- ✅ Calendar component with react-big-calendar - COMPLETE
- ✅ Month/Week/Day/Agenda views - COMPLETE
- ✅ Drag-and-drop rescheduling - COMPLETE
- ✅ Visual capacity indicators - COMPLETE
- ✅ Session detail modals - COMPLETE
- ✅ Responsive design - COMPLETE
- ⏳ Conflict detection system - PENDING
- ⏳ Backend API integration - PENDING 

## Features

### 1. Calendar Views
- Month view with session summaries
- Week view with detailed time slots
- Day view for detailed scheduling
- Agenda/list view option

### 2. Visual Indicators
- Color coding by capacity (green/amber/red)
- Session type indicators
- Quick stats on hover
- Conflict detection

### 3. Interactive Features
- Click to view session details
- Drag-and-drop rescheduling
- Quick booking creation
- Bulk session creation

## Database Queries

### Calendar Data Service
```typescript
// backend-loopback4/src/services/calendar-management.service.ts
export class CalendarManagementService {
  static async getCalendarSessions(
    startDate: Date,
    endDate: Date,
    filters?: {
      courseType?: string;
      location?: string;
      instructor?: string;
    }
  ) {
    const sessions = await db
      .select({
        session: courseSessions,
        bookingCount: sql<number>`COUNT(DISTINCT ${bookings.id})`,
        attendeeCount: sql<number>`COUNT(DISTINCT ${bookingAttendees.id})`,
        revenue: sql<number>`COALESCE(SUM(${bookings.totalAmount}), 0)`,
        hasSpecialRequirements: sql<boolean>`
          EXISTS(
            SELECT 1 FROM ${specialRequirements} sr
            JOIN ${bookings} b ON sr.bookingId = b.id
            WHERE b.sessionId = ${courseSessions.id}
          )
        `,
        waitlistCount: sql<number>`
          COUNT(DISTINCT CASE 
            WHEN ${bookings.status} = 'waitlist' 
            THEN ${bookings.id} 
          END)
        `,
      })
      .from(courseSessions)
      .leftJoin(bookings, eq(courseSessions.id, bookings.sessionId))
      .leftJoin(bookingAttendees, eq(bookings.id, bookingAttendees.bookingId))
      .where(
        and(
          gte(courseSessions.sessionDate, startDate),
          lte(courseSessions.sessionDate, endDate),
          filters?.courseType ? eq(courseSessions.courseType, filters.courseType) : sql`true`,
          filters?.location ? eq(courseSessions.location, filters.location) : sql`true`
        )
      )
      .groupBy(courseSessions.id);

    return this.formatCalendarEvents(sessions);
  }

  static formatCalendarEvents(sessions: any[]) {
    return sessions.map(({ session, bookingCount, attendeeCount, revenue, hasSpecialRequirements, waitlistCount }) => {
      const percentFull = (attendeeCount / session.maxCapacity) * 100;
      
      return {
        id: session.id,
        title: session.courseType,
        start: `${session.sessionDate}T${session.startTime}`,
        end: `${session.sessionDate}T${session.endTime}`,
        location: session.location,
        instructor: session.instructor,
        capacity: {
          max: session.maxCapacity,
          booked: attendeeCount,
          available: Math.max(0, session.maxCapacity - attendeeCount),
          percentFull,
          status: this.getCapacityStatus(percentFull),
        },
        stats: {
          bookings: bookingCount,
          revenue,
          waitlist: waitlistCount,
          hasSpecialRequirements,
        },
        color: this.getEventColor(percentFull, session.status),
        editable: session.status === 'scheduled',
      };
    });
  }

  static getCapacityStatus(percentFull: number): 'available' | 'filling' | 'nearly-full' | 'full' {
    if (percentFull >= 100) return 'full';
    if (percentFull >= 75) return 'nearly-full';
    if (percentFull >= 50) return 'filling';
    return 'available';
  }

  static getEventColor(percentFull: number, status: string): string {
    if (status === 'cancelled') return '#6B7280'; // Gray
    if (status === 'completed') return '#8B5CF6'; // Purple
    
    if (percentFull >= 100) return '#EF4444'; // Red
    if (percentFull >= 75) return '#F59E0B'; // Amber
    if (percentFull >= 50) return '#3B82F6'; // Blue
    return '#10B981'; // Green
  }

  static async rescheduleSession(
    sessionId: string,
    newDate: Date,
    newStartTime: string,
    newEndTime: string
  ) {
    // Check for conflicts
    const conflicts = await this.checkScheduleConflicts(
      sessionId,
      newDate,
      newStartTime,
      newEndTime
    );

    if (conflicts.length > 0) {
      throw new Error('Schedule conflict detected');
    }

    // Update session
    await db
      .update(courseSessions)
      .set({
        sessionDate: newDate,
        startTime: newStartTime,
        endTime: newEndTime,
        updatedAt: new Date(),
      })
      .where(eq(courseSessions.id, sessionId));

    // Notify affected bookings
    const affectedBookings = await db
      .select({
        booking: bookings,
        user: users,
      })
      .from(bookings)
      .innerJoin(users, eq(bookings.userId, users.id))
      .where(
        and(
          eq(bookings.sessionId, sessionId),
          eq(bookings.status, 'confirmed')
        )
      );

    // Send reschedule notifications
    for (const { booking, user } of affectedBookings) {
      await EmailService.sendRescheduleNotification({
        booking,
        user,
        newDate,
        newStartTime,
        newEndTime,
      });
    }

    return { success: true, notified: affectedBookings.length };
  }

  static async checkScheduleConflicts(
    excludeSessionId: string,
    date: Date,
    startTime: string,
    endTime: string
  ) {
    return await db
      .select()
      .from(courseSessions)
      .where(
        and(
          ne(courseSessions.id, excludeSessionId),
          eq(courseSessions.sessionDate, date),
          eq(courseSessions.status, 'scheduled'),
          or(
            // New session starts during existing session
            and(
              lte(courseSessions.startTime, startTime),
              gt(courseSessions.endTime, startTime)
            ),
            // New session ends during existing session
            and(
              lt(courseSessions.startTime, endTime),
              gte(courseSessions.endTime, endTime)
            ),
            // New session encompasses existing session
            and(
              gte(courseSessions.startTime, startTime),
              lte(courseSessions.endTime, endTime)
            )
          )
        )
      );
  }
}
```

## Frontend Implementation

### Calendar View Page
```typescript
// src/pages/admin/CalendarViewPage.tsx
import React, { useState, useEffect, useCallback } from 'react';
import { Calendar as BigCalendar, Views, DragAndDropCalendar } from '@/components/admin/DragDropCalendar';
import { SessionDetailModal } from '@/components/admin/SessionDetailModal';
import { CreateSessionModal } from '@/components/admin/CreateSessionModal';
import { CalendarToolbar } from '@/components/admin/CalendarToolbar';
import { Filter, Plus } from 'lucide-react';

export const CalendarViewPage: React.FC = () => {
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [view, setView] = useState(Views.MONTH);
  const [date, setDate] = useState(new Date());
  const [selectedEvent, setSelectedEvent] = useState<CalendarEvent | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [filters, setFilters] = useState({
    courseType: '',
    location: '',
  });
  const [showFilters, setShowFilters] = useState(false);

  useEffect(() => {
    loadCalendarData();
  }, [date, view, filters]);

  const loadCalendarData = async () => {
    const { start, end } = getDateRange(date, view);
    const sessions = await adminApi.getCalendarSessions(start, end, filters);
    setEvents(sessions);
  };

  const handleEventDrop = async ({ event, start, end }: any) => {
    try {
      const newDate = new Date(start);
      const startTime = format(start, 'HH:mm');
      const endTime = format(end, 'HH:mm');

      await adminApi.rescheduleSession(
        event.id,
        newDate,
        startTime,
        endTime
      );

      // Update local state
      setEvents(events.map(e => 
        e.id === event.id
          ? { ...e, start, end }
          : e
      ));

      toast.success('Session rescheduled successfully');
    } catch (error) {
      toast.error('Failed to reschedule session');
      loadCalendarData(); // Reload to reset
    }
  };

  const handleSelectSlot = ({ start, end }: any) => {
    setShowCreateModal(true);
    // Pass slot info to modal
  };

  const eventStyleGetter = (event: CalendarEvent) => {
    return {
      style: {
        backgroundColor: event.color,
        borderRadius: '8px',
        opacity: 0.9,
        color: 'white',
        border: '0px',
        display: 'block',
        fontSize: '12px',
      },
    };
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
                Calendar View
              </h1>
              <p className="mt-2 text-gray-600 dark:text-gray-400">
                View and manage all course sessions
              </p>
            </div>
            
            <div className="flex items-center gap-3">
              <button
                onClick={() => setShowFilters(!showFilters)}
                className="px-4 py-2 border rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 flex items-center gap-2"
              >
                <Filter className="w-4 h-4" />
                Filters
              </button>
              
              <button
                onClick={() => setShowCreateModal(true)}
                className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 flex items-center gap-2"
              >
                <Plus className="w-4 h-4" />
                New Session
              </button>
            </div>
          </div>
        </div>

        {/* Filters */}
        {showFilters && (
          <div className="mb-6 p-4 bg-white dark:bg-gray-800 rounded-lg shadow">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <select
                value={filters.courseType}
                onChange={(e) => setFilters({ ...filters, courseType: e.target.value })}
                className="px-4 py-2 border rounded-lg"
              >
                <option value="">All Course Types</option>
                <option value="Emergency First Aid at Work">EFAW</option>
                <option value="First Aid at Work">FAW</option>
                <option value="Paediatric First Aid">Paediatric</option>
              </select>
              
              <select
                value={filters.location}
                onChange={(e) => setFilters({ ...filters, location: e.target.value })}
                className="px-4 py-2 border rounded-lg"
              >
                <option value="">All Locations</option>
                <option value="Location A">Location A</option>
                <option value="Location B">Location B</option>
                <option value="Client Site">Client Site</option>
              </select>
            </div>
          </div>
        )}

        {/* Calendar Legend */}
        <div className="mb-4 flex flex-wrap items-center gap-4 text-sm">
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded bg-green-500"></div>
            <span>Available</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded bg-blue-500"></div>
            <span>Filling Up</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded bg-amber-500"></div>
            <span>Nearly Full</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded bg-red-500"></div>
            <span>Full</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded bg-purple-500"></div>
            <span>Completed</span>
          </div>
        </div>

        {/* Calendar */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <DragAndDropCalendar
            localizer={localizer}
            events={events}
            view={view}
            date={date}
            onView={setView}
            onNavigate={setDate}
            onEventDrop={handleEventDrop}
            onSelectSlot={handleSelectSlot}
            onSelectEvent={setSelectedEvent}
            eventPropGetter={eventStyleGetter}
            style={{ height: 600 }}
            components={{
              toolbar: CalendarToolbar,
              event: CalendarEventComponent,
            }}
            views={['month', 'week', 'day', 'agenda']}
            step={30}
            showMultiDayTimes
            defaultDate={new Date()}
          />
        </div>
      </div>

      {/* Session Detail Modal */}
      {selectedEvent && (
        <SessionDetailModal
          session={selectedEvent}
          isOpen={!!selectedEvent}
          onClose={() => setSelectedEvent(null)}
          onUpdate={loadCalendarData}
        />
      )}

      {/* Create Session Modal */}
      <CreateSessionModal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onSuccess={loadCalendarData}
      />
    </div>
  );
};
```

### Calendar Event Component
```typescript
// src/components/admin/CalendarEventComponent.tsx
import React from 'react';
import { Users, AlertCircle, PoundSterling } from 'lucide-react';

interface CalendarEventComponentProps {
  event: CalendarEvent;
}

export const CalendarEventComponent: React.FC<CalendarEventComponentProps> = ({ event }) => {
  const { capacity, stats } = event;
  const isNearlyFull = capacity.percentFull >= 75;
  const isFull = capacity.percentFull >= 100;

  return (
    <div className="p-2 h-full">
      <div className="font-semibold text-xs mb-1 truncate">{event.title}</div>
      
      <div className="flex items-center justify-between text-xs">
        <div className="flex items-center gap-1">
          <Users className="w-3 h-3" />
          <span className={isFull ? 'font-bold' : ''}>
            {capacity.booked}/{capacity.max}
          </span>
        </div>
        
        {stats.hasSpecialRequirements && (
          <AlertCircle className="w-3 h-3 text-yellow-300" />
        )}
      </div>

      {/* Show revenue on week/day view */}
      {event.view !== 'month' && (
        <div className="flex items-center gap-1 text-xs mt-1">
          <PoundSterling className="w-3 h-3" />
          <span>{stats.revenue}</span>
        </div>
      )}

      {/* Waitlist indicator */}
      {stats.waitlist > 0 && (
        <div className="text-xs mt-1 opacity-75">
          +{stats.waitlist} waiting
        </div>
      )}
    </div>
  );
};
```

### Session Detail Modal
```typescript
// src/components/admin/SessionDetailModal.tsx
import React, { useState, useEffect } from 'react';
import { X, Users, MapPin, Clock, Edit, Trash, Mail } from 'lucide-react';
import { format } from 'date-fns';

export const SessionDetailModal: React.FC<{
  session: CalendarEvent;
  isOpen: boolean;
  onClose: () => void;
  onUpdate: () => void;
}> = ({ session, isOpen, onClose, onUpdate }) => {
  const [bookings, setBookings] = useState<SessionBooking[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'details' | 'bookings' | 'actions'>('details');

  useEffect(() => {
    if (isOpen && session) {
      loadSessionDetails();
    }
  }, [session, isOpen]);

  const loadSessionDetails = async () => {
    setLoading(true);
    try {
      const details = await adminApi.getSessionDetails(session.id);
      setBookings(details.bookings);
    } finally {
      setLoading(false);
    }
  };

  const handleCancelSession = async () => {
    if (!confirm('Cancel this session? All bookings will be notified.')) return;
    
    try {
      await adminApi.cancelSession(session.id);
      toast.success('Session cancelled');
      onUpdate();
      onClose();
    } catch (error) {
      toast.error('Failed to cancel session');
    }
  };

  const handleEmailAttendees = async () => {
    // Open email modal with pre-filled attendees
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-lg max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b">
          <div>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
              {session.title}
            </h2>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
              {format(new Date(session.start), 'EEEE, d MMMM yyyy')}
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b">
          <button
            onClick={() => setActiveTab('details')}
            className={`px-6 py-3 font-medium ${
              activeTab === 'details'
                ? 'text-primary-600 border-b-2 border-primary-600'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            Session Details
          </button>
          <button
            onClick={() => setActiveTab('bookings')}
            className={`px-6 py-3 font-medium ${
              activeTab === 'bookings'
                ? 'text-primary-600 border-b-2 border-primary-600'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            Bookings ({session.stats.bookings})
          </button>
          <button
            onClick={() => setActiveTab('actions')}
            className={`px-6 py-3 font-medium ${
              activeTab === 'actions'
                ? 'text-primary-600 border-b-2 border-primary-600'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            Actions
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {activeTab === 'details' && (
            <div className="space-y-6">
              {/* Session Info */}
              <div className="grid grid-cols-2 gap-6">
                <div>
                  <h3 className="text-sm font-medium text-gray-500 mb-1">Time</h3>
                  <div className="flex items-center gap-2">
                    <Clock className="w-5 h-5 text-gray-400" />
                    <span>{format(new Date(session.start), 'HH:mm')} - {format(new Date(session.end), 'HH:mm')}</span>
                  </div>
                </div>
                
                <div>
                  <h3 className="text-sm font-medium text-gray-500 mb-1">Location</h3>
                  <div className="flex items-center gap-2">
                    <MapPin className="w-5 h-5 text-gray-400" />
                    <span>{session.location}</span>
                  </div>
                </div>
              </div>

              {/* Capacity */}
              <div>
                <h3 className="text-sm font-medium text-gray-500 mb-3">Capacity</h3>
                <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-2">
                    <span>Total Capacity</span>
                    <span className="font-semibold">{session.capacity.max}</span>
                  </div>
                  <div className="flex items-center justify-between mb-2">
                    <span>Booked</span>
                    <span className="font-semibold">{session.capacity.booked}</span>
                  </div>
                  <div className="flex items-center justify-between mb-4">
                    <span>Available</span>
                    <span className="font-semibold text-green-600">{session.capacity.available}</span>
                  </div>
                  
                  {/* Progress bar */}
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className={`h-2 rounded-full transition-all ${
                        session.capacity.percentFull >= 100 ? 'bg-red-500' :
                        session.capacity.percentFull >= 75 ? 'bg-amber-500' :
                        session.capacity.percentFull >= 50 ? 'bg-blue-500' :
                        'bg-green-500'
                      }`}
                      style={{ width: `${Math.min(100, session.capacity.percentFull)}%` }}
                    />
                  </div>
                  <p className="text-sm text-gray-600 mt-2">
                    {session.capacity.percentFull.toFixed(0)}% full
                  </p>
                </div>
              </div>

              {/* Financial Summary */}
              <div>
                <h3 className="text-sm font-medium text-gray-500 mb-3">Financial Summary</h3>
                <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-4">
                  <div className="flex items-center justify-between">
                    <span>Total Revenue</span>
                    <span className="font-semibold text-lg">£{session.stats.revenue.toFixed(2)}</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'bookings' && (
            <div>
              {loading ? (
                <div className="flex justify-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
                </div>
              ) : (
                <div className="space-y-3">
                  {bookings.map((booking) => (
                    <div
                      key={booking.id}
                      className="p-4 border rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700/50"
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-medium">{booking.userName}</p>
                          <p className="text-sm text-gray-600">{booking.userEmail}</p>
                          <p className="text-sm text-gray-500 mt-1">
                            {booking.attendeeCount} attendee{booking.attendeeCount !== 1 ? 's' : ''} • 
                            Ref: {booking.bookingReference}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="font-semibold">£{booking.totalAmount.toFixed(2)}</p>
                          <p className="text-sm text-gray-500">{booking.paymentStatus}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {activeTab === 'actions' && (
            <div className="space-y-4">
              <button
                onClick={() => navigate(`/admin/schedule/${session.id}`)}
                className="w-full flex items-center gap-3 px-4 py-3 border rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700"
              >
                <Edit className="w-5 h-5" />
                <div className="text-left">
                  <p className="font-medium">Edit Session</p>
                  <p className="text-sm text-gray-600">Change time, location, or capacity</p>
                </div>
              </button>

              <button
                onClick={handleEmailAttendees}
                className="w-full flex items-center gap-3 px-4 py-3 border rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700"
              >
                <Mail className="w-5 h-5" />
                <div className="text-left">
                  <p className="font-medium">Email Attendees</p>
                  <p className="text-sm text-gray-600">Send message to all confirmed bookings</p>
                </div>
              </button>

              <button
                onClick={handleCancelSession}
                className="w-full flex items-center gap-3 px-4 py-3 border border-red-300 text-red-600 rounded-lg hover:bg-red-50"
              >
                <Trash className="w-5 h-5" />
                <div className="text-left">
                  <p className="font-medium">Cancel Session</p>
                  <p className="text-sm">Notify all attendees and process refunds</p>
                </div>
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
```

### Drag and Drop Calendar Wrapper
```typescript
// src/components/admin/DragDropCalendar.tsx
import React from 'react';
import { Calendar, Views } from 'react-big-calendar';
import withDragAndDrop from 'react-big-calendar/lib/addons/dragAndDrop';
import 'react-big-calendar/lib/addons/dragAndDrop/styles.css';

const DragAndDropCalendar = withDragAndDrop(Calendar);

export { DragAndDropCalendar, Views };

export const CalendarWithDragDrop: React.FC<any> = (props) => {
  const handleEventDrop = async ({ event, start, end }) => {
    // Validate the drop
    const duration = end.getTime() - start.getTime();
    const originalDuration = event.end.getTime() - event.start.getTime();
    
    if (duration !== originalDuration) {
      toast.error('Cannot change session duration');
      return;
    }

    // Check business hours
    const startHour = start.getHours();
    const endHour = end.getHours();
    
    if (startHour < 8 || endHour > 18) {
      toast.error('Sessions must be between 8:00 AM and 6:00 PM');
      return;
    }

    // Call parent handler
    if (props.onEventDrop) {
      props.onEventDrop({ event, start, end });
    }
  };

  return (
    <DragAndDropCalendar
      {...props}
      onEventDrop={handleEventDrop}
      resizable={false} // Don't allow resizing
      draggableAccessor={() => true}
    />
  );
};
```

## Mobile Calendar View

```typescript
// src/components/admin/MobileCalendarView.tsx
import React from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

export const MobileCalendarView: React.FC = () => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [view, setView] = useState<'day' | 'week'>('day');

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow">
      {/* Mobile Header */}
      <div className="p-4 border-b">
        <div className="flex items-center justify-between mb-4">
          <button
            onClick={() => navigateDate(-1)}
            className="p-2 hover:bg-gray-100 rounded"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          
          <div className="text-center">
            <h3 className="font-semibold">
              {format(currentDate, 'MMMM yyyy')}
            </h3>
            <p className="text-sm text-gray-600">
              {format(currentDate, 'EEEE, d')}
            </p>
          </div>
          
          <button
            onClick={() => navigateDate(1)}
            className="p-2 hover:bg-gray-100 rounded"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>

        {/* View Toggle */}
        <div className="flex gap-2">
          <button
            onClick={() => setView('day')}
            className={`flex-1 py-2 rounded ${
              view === 'day' ? 'bg-primary-600 text-white' : 'bg-gray-100'
            }`}
          >
            Day
          </button>
          <button
            onClick={() => setView('week')}
            className={`flex-1 py-2 rounded ${
              view === 'week' ? 'bg-primary-600 text-white' : 'bg-gray-100'
            }`}
          >
            Week
          </button>
        </div>
      </div>

      {/* Session List */}
      <div className="p-4 space-y-3">
        {sessions.map(session => (
          <MobileSessionCard key={session.id} session={session} />
        ))}
      </div>
    </div>
  );
};
```

## Testing

1. Test calendar view rendering
2. Test drag-and-drop functionality
3. Test conflict detection
4. Test reschedule notifications
5. Test mobile calendar view
6. Test filter functionality
7. Test real-time updates
8. Test performance with many sessions