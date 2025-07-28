# Real-Time Availability Calendar

## Overview
Implement a visual calendar showing course availability with real-time updates as bookings are made. Maximum 12 attendees per course session.please use ultra think to plan for this and you can createfiles withinthis folder if it helps like a CSV with tasks to keep track etc 

## Features

1. **Visual Calendar View**
   - Month view with course indicators
   - Week view for detailed scheduling
   - Day view showing all sessions
   - Color coding by course type

2. **Real-Time Updates**
   - Live availability count
   - Instant booking updates
   - Prevent overbooking
   - Show remaining spots

3. **Filtering Options**
   - By course type
   - By date range
   - By availability status
   - By location (A or B)

## Database Schema

### Course Sessions Table
```sql
CREATE TABLE course_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  course_type VARCHAR(100) NOT NULL,
  session_date DATE NOT NULL,
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  location VARCHAR(50) NOT NULL CHECK (location IN ('Location A', 'Location B')),
  max_capacity INTEGER DEFAULT 12,
  current_bookings INTEGER DEFAULT 0,
  instructor_notes TEXT,
  status VARCHAR(20) DEFAULT 'scheduled' CHECK (status IN ('scheduled', 'cancelled', 'completed')),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_sessions_date ON course_sessions(session_date);
CREATE INDEX idx_sessions_type ON course_sessions(course_type);
CREATE INDEX idx_sessions_status ON course_sessions(status);
```

### Drizzle Schema
```typescript
// backend-loopback4/src/db/schema/course-sessions.ts
import { pgTable, uuid, varchar, date, time, integer, text, timestamp } from 'drizzle-orm/pg-core';

export const courseSessions = pgTable('course_sessions', {
  id: uuid('id').primaryKey().defaultRandom(),
  courseType: varchar('course_type', { length: 100 }).notNull(),
  sessionDate: date('session_date').notNull(),
  startTime: time('start_time').notNull(),
  endTime: time('end_time').notNull(),
  location: varchar('location', { length: 50 }).notNull(),
  maxCapacity: integer('max_capacity').default(12),
  currentBookings: integer('current_bookings').default(0),
  instructorNotes: text('instructor_notes'),
  status: varchar('status', { length: 20 }).default('scheduled'),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
});

export type CourseSession = typeof courseSessions.$inferSelect;
export type NewCourseSession = typeof courseSessions.$inferInsert;
```

## Backend Implementation

### Course Session Service
```typescript
// backend-loopback4/src/services/course-session.service.ts
import { db } from '../config/database.config';
import { courseSessions } from '../db/schema/course-sessions';
import { and, gte, lte, eq, lt, sql } from 'drizzle-orm';
import { WebSocketService } from './websocket.service';

export class CourseSessionService {
  static async getAvailableSessions(filters: {
    startDate: Date;
    endDate: Date;
    courseType?: string;
    location?: string;
  }) {
    const conditions = [
      gte(courseSessions.sessionDate, filters.startDate.toISOString()),
      lte(courseSessions.sessionDate, filters.endDate.toISOString()),
      eq(courseSessions.status, 'scheduled'),
      sql`${courseSessions.currentBookings} < ${courseSessions.maxCapacity}`,
    ];

    if (filters.courseType) {
      conditions.push(eq(courseSessions.courseType, filters.courseType));
    }
    if (filters.location) {
      conditions.push(eq(courseSessions.location, filters.location));
    }

    const sessions = await db
      .select({
        id: courseSessions.id,
        courseType: courseSessions.courseType,
        sessionDate: courseSessions.sessionDate,
        startTime: courseSessions.startTime,
        endTime: courseSessions.endTime,
        location: courseSessions.location,
        availableSpots: sql<number>`${courseSessions.maxCapacity} - ${courseSessions.currentBookings}`,
        maxCapacity: courseSessions.maxCapacity,
        currentBookings: courseSessions.currentBookings,
      })
      .from(courseSessions)
      .where(and(...conditions))
      .orderBy(courseSessions.sessionDate, courseSessions.startTime);

    return sessions;
  }

  static async incrementBooking(sessionId: string): Promise<boolean> {
    // Use transaction to prevent race conditions
    return await db.transaction(async (tx) => {
      // Lock the row for update
      const [session] = await tx
        .select()
        .from(courseSessions)
        .where(eq(courseSessions.id, sessionId))
        .for('update');

      if (!session || session.currentBookings >= session.maxCapacity) {
        return false;
      }

      await tx
        .update(courseSessions)
        .set({ 
          currentBookings: sql`${courseSessions.currentBookings} + 1`,
          updatedAt: new Date()
        })
        .where(eq(courseSessions.id, sessionId));

      // Broadcast update via WebSocket
      WebSocketService.broadcast('session-update', {
        sessionId,
        currentBookings: session.currentBookings + 1,
        availableSpots: session.maxCapacity - (session.currentBookings + 1),
      });

      return true;
    });
  }

  static async decrementBooking(sessionId: string): Promise<boolean> {
    const [session] = await db
      .update(courseSessions)
      .set({ 
        currentBookings: sql`GREATEST(${courseSessions.currentBookings} - 1, 0)`,
        updatedAt: new Date()
      })
      .where(eq(courseSessions.id, sessionId))
      .returning();

    if (session) {
      // Broadcast update
      WebSocketService.broadcast('session-update', {
        sessionId,
        currentBookings: session.currentBookings,
        availableSpots: session.maxCapacity - session.currentBookings,
      });
    }

    return !!session;
  }
}
```

### Calendar API Controller
```typescript
// backend-loopback4/src/controllers/calendar.controller.ts
import { get, param } from '@loopback/rest';
import { CourseSessionService } from '../services/course-session.service';

export class CalendarController {
  @get('/api/calendar/availability')
  async getAvailability(
    @param.query.string('startDate') startDate: string,
    @param.query.string('endDate') endDate: string,
    @param.query.string('courseType') courseType?: string,
    @param.query.string('location') location?: string,
  ) {
    const sessions = await CourseSessionService.getAvailableSessions({
      startDate: new Date(startDate),
      endDate: new Date(endDate),
      courseType,
      location,
    });

    // Format for calendar display
    const calendarEvents = sessions.map(session => ({
      id: session.id,
      title: session.courseType,
      date: session.sessionDate,
      start: `${session.sessionDate}T${session.startTime}`,
      end: `${session.sessionDate}T${session.endTime}`,
      location: session.location,
      availableSpots: session.availableSpots,
      maxCapacity: session.maxCapacity,
      color: this.getCourseColor(session.courseType),
      extendedProps: {
        currentBookings: session.currentBookings,
        percentFull: Math.round((session.currentBookings / session.maxCapacity) * 100),
      },
    }));

    return calendarEvents;
  }

  private getCourseColor(courseType: string): string {
    const colors: Record<string, string> = {
      'Emergency First Aid at Work': '#0EA5E9',
      'First Aid at Work': '#10B981',
      'Paediatric First Aid': '#F97316',
      'CPR and AED': '#8B5CF6',
      // Add more course colors
    };
    return colors[courseType] || '#6B7280';
  }
}
```

## Frontend Implementation

### Calendar Component
```typescript
// src/components/booking/AvailabilityCalendar.tsx
import React, { useState, useEffect } from 'react';
import { Calendar, momentLocalizer } from 'react-big-calendar';
import moment from 'moment';
import { useWebSocket } from '@/hooks/useWebSocket';
import { calendarApi } from '@/services/api/calendar';
import 'react-big-calendar/lib/css/react-big-calendar.css';

const localizer = momentLocalizer(moment);

interface CalendarEvent {
  id: string;
  title: string;
  start: Date;
  end: Date;
  availableSpots: number;
  maxCapacity: number;
  location: string;
  color: string;
}

export const AvailabilityCalendar: React.FC = () => {
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [view, setView] = useState<'month' | 'week' | 'day'>('month');
  const [date, setDate] = useState(new Date());
  const [filters, setFilters] = useState({
    courseType: '',
    location: '',
  });

  // WebSocket for real-time updates
  const { subscribe, unsubscribe } = useWebSocket();

  useEffect(() => {
    loadEvents();
  }, [date, view, filters]);

  useEffect(() => {
    // Subscribe to real-time updates
    const handleUpdate = (data: any) => {
      if (data.type === 'session-update') {
        updateEventAvailability(data.sessionId, data.availableSpots);
      }
    };

    subscribe('session-update', handleUpdate);
    return () => unsubscribe('session-update', handleUpdate);
  }, []);

  const loadEvents = async () => {
    const startDate = moment(date).startOf(view).toDate();
    const endDate = moment(date).endOf(view).toDate();

    const sessions = await calendarApi.getAvailability({
      startDate,
      endDate,
      ...filters,
    });

    setEvents(sessions.map(s => ({
      ...s,
      start: new Date(s.start),
      end: new Date(s.end),
    })));
  };

  const updateEventAvailability = (sessionId: string, availableSpots: number) => {
    setEvents(prev => prev.map(event => 
      event.id === sessionId 
        ? { ...event, availableSpots }
        : event
    ));
  };

  const eventStyleGetter = (event: CalendarEvent) => {
    const isFull = event.availableSpots === 0;
    const isAlmostFull = event.availableSpots <= 3 && event.availableSpots > 0;

    return {
      style: {
        backgroundColor: isFull ? '#DC2626' : event.color,
        opacity: isFull ? 0.7 : 1,
        border: isAlmostFull ? '2px solid #F59E0B' : 'none',
      },
    };
  };

  const EventComponent = ({ event }: { event: CalendarEvent }) => (
    <div className="p-1">
      <div className="font-semibold text-xs">{event.title}</div>
      <div className="text-xs">
        {event.availableSpots > 0 ? (
          <span className="text-green-200">
            {event.availableSpots} spots
          </span>
        ) : (
          <span className="text-red-200">FULL</span>
        )}
      </div>
    </div>
  );

  return (
    <div className="bg-white rounded-lg shadow p-6">
      {/* Filter Controls */}
      <div className="mb-4 flex gap-4">
        <select
          value={filters.courseType}
          onChange={(e) => setFilters({ ...filters, courseType: e.target.value })}
          className="px-3 py-2 border rounded-lg"
        >
          <option value="">All Courses</option>
          <option value="Emergency First Aid at Work">EFAW</option>
          <option value="First Aid at Work">FAW</option>
          <option value="Paediatric First Aid">Paediatric</option>
        </select>

        <select
          value={filters.location}
          onChange={(e) => setFilters({ ...filters, location: e.target.value })}
          className="px-3 py-2 border rounded-lg"
        >
          <option value="">All Locations</option>
          <option value="Location A">Location A</option>
          <option value="Location B">Location B</option>
        </select>
      </div>

      {/* Calendar */}
      <div style={{ height: 600 }}>
        <Calendar
          localizer={localizer}
          events={events}
          view={view}
          onView={setView}
          date={date}
          onNavigate={setDate}
          eventPropGetter={eventStyleGetter}
          components={{
            event: EventComponent,
          }}
          popup
          tooltipAccessor={(event) => 
            `${event.title} - ${event.location}\n` +
            `${event.availableSpots} of ${event.maxCapacity} spots available`
          }
        />
      </div>

      {/* Legend */}
      <div className="mt-4 flex items-center gap-6 text-sm">
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 bg-green-500 rounded"></div>
          <span>Available</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 bg-yellow-500 rounded"></div>
          <span>Almost Full</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 bg-red-500 rounded"></div>
          <span>Full</span>
        </div>
      </div>
    </div>
  );
};
```

### WebSocket Hook
```typescript
// src/hooks/useWebSocket.ts
import { useEffect, useRef } from 'react';

export const useWebSocket = () => {
  const ws = useRef<WebSocket | null>(null);
  const listeners = useRef<Map<string, Set<Function>>>(new Map());

  useEffect(() => {
    // Connect to WebSocket
    ws.current = new WebSocket(import.meta.env.VITE_WS_URL);

    ws.current.onmessage = (event) => {
      const data = JSON.parse(event.data);
      const handlers = listeners.current.get(data.type);
      if (handlers) {
        handlers.forEach(handler => handler(data));
      }
    };

    return () => {
      ws.current?.close();
    };
  }, []);

  const subscribe = (event: string, handler: Function) => {
    if (!listeners.current.has(event)) {
      listeners.current.set(event, new Set());
    }
    listeners.current.get(event)!.add(handler);
  };

  const unsubscribe = (event: string, handler: Function) => {
    listeners.current.get(event)?.delete(handler);
  };

  return { subscribe, unsubscribe };
};
```

### Mobile-Friendly Calendar View
```typescript
// src/components/booking/MobileCalendar.tsx
import React from 'react';
import { format } from 'date-fns';

export const MobileCalendar: React.FC<{ events: CalendarEvent[] }> = ({ events }) => {
  const groupedEvents = events.reduce((acc, event) => {
    const date = format(event.start, 'yyyy-MM-dd');
    if (!acc[date]) acc[date] = [];
    acc[date].push(event);
    return acc;
  }, {} as Record<string, CalendarEvent[]>);

  return (
    <div className="space-y-4">
      {Object.entries(groupedEvents).map(([date, dayEvents]) => (
        <div key={date} className="bg-white rounded-lg shadow p-4">
          <h3 className="font-semibold text-lg mb-3">
            {format(new Date(date), 'EEEE, MMMM d')}
          </h3>
          <div className="space-y-2">
            {dayEvents.map(event => (
              <div
                key={event.id}
                className={`p-3 rounded-lg border ${
                  event.availableSpots === 0 
                    ? 'bg-red-50 border-red-300' 
                    : 'bg-green-50 border-green-300'
                }`}
              >
                <div className="font-medium">{event.title}</div>
                <div className="text-sm text-gray-600">
                  {format(event.start, 'h:mm a')} - {format(event.end, 'h:mm a')}
                </div>
                <div className="text-sm mt-1">
                  {event.availableSpots > 0 ? (
                    <span className="text-green-700">
                      {event.availableSpots} spots available
                    </span>
                  ) : (
                    <span className="text-red-700 font-semibold">FULLY BOOKED</span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
};
```

## Performance Optimization

1. **Database Indexing**
   - Index on date for fast date range queries
   - Index on course type for filtering
   - Composite index for common queries

2. **Caching Strategy**
   - Cache available sessions for 5 minutes
   - Invalidate cache on booking changes
   - Use Redis for session data

3. **Real-Time Updates**
   - Use WebSockets for instant updates
   - Batch updates to prevent flooding
   - Fallback to polling if WebSocket fails

## Testing

1. Test calendar displays correct availability
2. Test real-time updates when bookings made
3. Test filtering by course type and location
4. Test mobile responsive design
5. Test performance with many sessions
6. Test race conditions on simultaneous bookings