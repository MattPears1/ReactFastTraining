# Course Creation and Management (Admin)

## Overview
Admin interface for creating, editing, and managing course sessions, including scheduling, capacity settings, and attendance tracking.please use ultra think to plan for this and you can createfiles withinthis folder if it helps like a CSV with tasks to keep track etc 

## Features

### 1. Course Session Management
- Create new course sessions
- Edit existing sessions
- Cancel sessions (with notification to attendees)
- Clone sessions for quick scheduling
- Bulk create recurring sessions

### 2. Scheduling Tools
- Calendar view for scheduling
- Conflict detection
- Template-based scheduling
- Seasonal planning

### 3. Attendance Tracking
- Mark attendance for each session
- Generate attendance reports
- Track no-shows
- Certificate eligibility

## Database Schema

### Attendance Table
```sql
CREATE TABLE attendance (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id UUID NOT NULL REFERENCES bookings(id),
  session_id UUID NOT NULL REFERENCES course_sessions(id),
  user_id UUID NOT NULL REFERENCES users(id),
  status VARCHAR(20) NOT NULL CHECK (status IN ('present', 'absent', 'late', 'partial')),
  notes TEXT,
  marked_by UUID REFERENCES users(id),
  marked_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_attendance_session ON attendance(session_id);
CREATE INDEX idx_attendance_user ON attendance(user_id);
```

## Backend Implementation

### Course Management Service
```typescript
// backend-loopback4/src/services/admin/course-management.service.ts
import { db } from '../../config/database.config';
import { courseSessions } from '../../db/schema/course-sessions';
import { EmailService } from '../email.service';

export class CourseManagementService {
  static async createSession(data: {
    courseType: string;
    sessionDate: Date;
    startTime: string;
    endTime: string;
    location: string;
    instructorNotes?: string;
  }) {
    // Check for conflicts
    const conflicts = await this.checkScheduleConflicts(
      data.sessionDate,
      data.startTime,
      data.endTime,
      data.location
    );

    if (conflicts.length > 0) {
      throw new Error(`Schedule conflict detected: ${conflicts[0].courseType} at ${conflicts[0].startTime}`);
    }

    const [session] = await db.insert(courseSessions).values({
      ...data,
      maxCapacity: 12,
      currentBookings: 0,
      status: 'scheduled',
    }).returning();

    return session;
  }

  static async createRecurringSessions(data: {
    courseType: string;
    startDate: Date;
    endDate: Date;
    daysOfWeek: number[]; // 0 = Sunday, 6 = Saturday
    startTime: string;
    endTime: string;
    location: string;
  }) {
    const sessions = [];
    const current = new Date(data.startDate);

    while (current <= data.endDate) {
      if (data.daysOfWeek.includes(current.getDay())) {
        sessions.push({
          courseType: data.courseType,
          sessionDate: new Date(current),
          startTime: data.startTime,
          endTime: data.endTime,
          location: data.location,
          maxCapacity: 12,
          currentBookings: 0,
          status: 'scheduled' as const,
        });
      }
      current.setDate(current.getDate() + 1);
    }

    if (sessions.length === 0) {
      throw new Error('No sessions match the specified criteria');
    }

    const created = await db.insert(courseSessions).values(sessions).returning();
    return created;
  }

  static async updateSession(
    sessionId: string,
    updates: Partial<CourseSession>
  ) {
    const [existing] = await db
      .select()
      .from(courseSessions)
      .where(eq(courseSessions.id, sessionId));

    if (!existing) {
      throw new Error('Session not found');
    }

    // If date/time changed and has bookings, notify attendees
    const hasTimeChange = 
      updates.sessionDate !== existing.sessionDate ||
      updates.startTime !== existing.startTime ||
      updates.endTime !== existing.endTime;

    if (hasTimeChange && existing.currentBookings > 0) {
      await this.notifyTimeChange(sessionId, existing, updates);
    }

    const [updated] = await db
      .update(courseSessions)
      .set({
        ...updates,
        updatedAt: new Date(),
      })
      .where(eq(courseSessions.id, sessionId))
      .returning();

    return updated;
  }

  static async cancelSession(sessionId: string, reason: string) {
    const [session] = await db
      .update(courseSessions)
      .set({
        status: 'cancelled',
        instructorNotes: reason,
        updatedAt: new Date(),
      })
      .where(eq(courseSessions.id, sessionId))
      .returning();

    if (session.currentBookings > 0) {
      await this.notifyCancellation(sessionId, reason);
      await this.processRefunds(sessionId);
    }

    return session;
  }

  private static async checkScheduleConflicts(
    date: Date,
    startTime: string,
    endTime: string,
    location: string
  ) {
    // Check if instructor has another session at same time
    const conflicts = await db
      .select()
      .from(courseSessions)
      .where(
        and(
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
            // New session completely overlaps existing
            and(
              gte(courseSessions.startTime, startTime),
              lte(courseSessions.endTime, endTime)
            )
          )
        )
      );

    return conflicts;
  }
}
```

### Attendance Service
```typescript
// backend-loopback4/src/services/admin/attendance.service.ts
export class AttendanceService {
  static async markAttendance(
    sessionId: string,
    attendanceRecords: Array<{
      bookingId: string;
      userId: string;
      status: 'present' | 'absent' | 'late' | 'partial';
      notes?: string;
    }>,
    markedBy: string
  ) {
    // Validate all bookings belong to this session
    const validBookings = await this.validateBookings(sessionId, attendanceRecords.map(r => r.bookingId));
    
    if (!validBookings) {
      throw new Error('Invalid booking IDs provided');
    }

    // Insert attendance records
    const records = attendanceRecords.map(record => ({
      ...record,
      sessionId,
      markedBy,
      markedAt: new Date(),
    }));

    await db.insert(attendance).values(records);

    // Update session status if completed
    await db
      .update(courseSessions)
      .set({
        status: 'completed',
        updatedAt: new Date(),
      })
      .where(eq(courseSessions.id, sessionId));

    // Check certificate eligibility
    await this.checkCertificateEligibility(sessionId);

    return records;
  }

  static async getSessionAttendance(sessionId: string) {
    const records = await db
      .select({
        attendance: attendance,
        user: users,
        booking: bookings,
      })
      .from(attendance)
      .innerJoin(users, eq(attendance.userId, users.id))
      .innerJoin(bookings, eq(attendance.bookingId, bookings.id))
      .where(eq(attendance.sessionId, sessionId));

    return records;
  }

  static async generateAttendanceReport(filters: {
    startDate: Date;
    endDate: Date;
    courseType?: string;
  }) {
    const stats = await db
      .select({
        courseType: courseSessions.courseType,
        totalSessions: sql<number>`COUNT(DISTINCT ${courseSessions.id})`,
        totalAttendees: sql<number>`COUNT(DISTINCT ${attendance.userId})`,
        presentCount: sql<number>`COUNT(CASE WHEN ${attendance.status} = 'present' THEN 1 END)`,
        absentCount: sql<number>`COUNT(CASE WHEN ${attendance.status} = 'absent' THEN 1 END)`,
        lateCount: sql<number>`COUNT(CASE WHEN ${attendance.status} = 'late' THEN 1 END)`,
      })
      .from(courseSessions)
      .leftJoin(attendance, eq(courseSessions.id, attendance.sessionId))
      .where(
        and(
          gte(courseSessions.sessionDate, filters.startDate),
          lte(courseSessions.sessionDate, filters.endDate),
          filters.courseType ? eq(courseSessions.courseType, filters.courseType) : undefined
        )
      )
      .groupBy(courseSessions.courseType);

    return stats;
  }
}
```

## Frontend Implementation

### Course Creation Form
```typescript
// src/components/admin/CourseCreationForm.tsx
import React from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import DatePicker from 'react-datepicker';
import { COURSE_TYPES } from '@/constants/courses';

const courseSchema = z.object({
  courseType: z.string().min(1, 'Course type is required'),
  sessionDate: z.date(),
  startTime: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, 'Invalid time format'),
  endTime: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, 'Invalid time format'),
  location: z.enum(['Location A', 'Location B']),
  instructorNotes: z.string().optional(),
  isRecurring: z.boolean(),
  recurrence: z.object({
    endDate: z.date().optional(),
    daysOfWeek: z.array(z.number()).optional(),
  }).optional(),
});

export const CourseCreationForm: React.FC = () => {
  const { register, control, handleSubmit, watch, formState: { errors } } = useForm({
    resolver: zodResolver(courseSchema),
    defaultValues: {
      isRecurring: false,
      recurrence: {
        daysOfWeek: [],
      },
    },
  });

  const isRecurring = watch('isRecurring');

  const onSubmit = async (data: any) => {
    try {
      if (data.isRecurring) {
        await adminApi.createRecurringSessions(data);
      } else {
        await adminApi.createSession(data);
      }
      // Success handling
    } catch (error) {
      // Error handling
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      {/* Course Type */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Course Type
        </label>
        <select
          {...register('courseType')}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg"
        >
          <option value="">Select a course</option>
          {Object.values(COURSE_TYPES).map(course => (
            <option key={course.id} value={course.name}>
              {course.name} ({course.duration})
            </option>
          ))}
        </select>
        {errors.courseType && (
          <p className="text-red-600 text-sm mt-1">{errors.courseType.message}</p>
        )}
      </div>

      {/* Date Selection */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Session Date
        </label>
        <Controller
          control={control}
          name="sessionDate"
          render={({ field }) => (
            <DatePicker
              selected={field.value}
              onChange={field.onChange}
              minDate={new Date()}
              dateFormat="dd/MM/yyyy"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg"
            />
          )}
        />
      </div>

      {/* Time Selection */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Start Time
          </label>
          <input
            type="time"
            {...register('startTime')}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            End Time
          </label>
          <input
            type="time"
            {...register('endTime')}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg"
          />
        </div>
      </div>

      {/* Location */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Location
        </label>
        <div className="space-y-2">
          <label className="flex items-center">
            <input
              type="radio"
              {...register('location')}
              value="Location A"
              className="mr-2"
            />
            Location A
          </label>
          <label className="flex items-center">
            <input
              type="radio"
              {...register('location')}
              value="Location B"
              className="mr-2"
            />
            Location B
          </label>
        </div>
      </div>

      {/* Recurring Sessions */}
      <div className="border-t pt-4">
        <label className="flex items-center">
          <input
            type="checkbox"
            {...register('isRecurring')}
            className="mr-2"
          />
          Create recurring sessions
        </label>

        {isRecurring && (
          <div className="mt-4 pl-6 space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Repeat until
              </label>
              <Controller
                control={control}
                name="recurrence.endDate"
                render={({ field }) => (
                  <DatePicker
                    selected={field.value}
                    onChange={field.onChange}
                    minDate={new Date()}
                    dateFormat="dd/MM/yyyy"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                  />
                )}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Repeat on days
              </label>
              <div className="flex gap-2">
                {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day, index) => (
                  <label key={day} className="flex items-center">
                    <input
                      type="checkbox"
                      value={index}
                      {...register(`recurrence.daysOfWeek.${index}`)}
                      className="sr-only"
                    />
                    <span className="px-3 py-1 border rounded cursor-pointer hover:bg-gray-50">
                      {day}
                    </span>
                  </label>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Instructor Notes */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Instructor Notes (Optional)
        </label>
        <textarea
          {...register('instructorNotes')}
          rows={3}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg"
          placeholder="Any special notes for this session..."
        />
      </div>

      <button
        type="submit"
        className="w-full bg-primary-600 text-white py-2 rounded-lg hover:bg-primary-700"
      >
        Create Session
      </button>
    </form>
  );
};
```

### Attendance Marking Interface
```typescript
// src/components/admin/AttendanceMarking.tsx
import React, { useState, useEffect } from 'react';
import { Check, X, Clock, Minus } from 'lucide-react';

interface AttendeeRecord {
  bookingId: string;
  userId: string;
  name: string;
  email: string;
  status: 'present' | 'absent' | 'late' | 'partial' | null;
  notes: string;
}

export const AttendanceMarking: React.FC<{ sessionId: string }> = ({ sessionId }) => {
  const [attendees, setAttendees] = useState<AttendeeRecord[]>([]);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    loadAttendees();
  }, [sessionId]);

  const loadAttendees = async () => {
    const data = await adminApi.getSessionAttendees(sessionId);
    setAttendees(data.map(a => ({
      ...a,
      status: null,
      notes: '',
    })));
  };

  const updateStatus = (bookingId: string, status: AttendeeRecord['status']) => {
    setAttendees(prev => prev.map(a => 
      a.bookingId === bookingId ? { ...a, status } : a
    ));
  };

  const updateNotes = (bookingId: string, notes: string) => {
    setAttendees(prev => prev.map(a => 
      a.bookingId === bookingId ? { ...a, notes } : a
    ));
  };

  const saveAttendance = async () => {
    setSaving(true);
    try {
      const records = attendees
        .filter(a => a.status !== null)
        .map(a => ({
          bookingId: a.bookingId,
          userId: a.userId,
          status: a.status!,
          notes: a.notes || undefined,
        }));

      await adminApi.markAttendance(sessionId, records);
      // Success notification
    } finally {
      setSaving(false);
    }
  };

  const statusButtons = [
    { status: 'present' as const, icon: Check, label: 'Present', color: 'green' },
    { status: 'absent' as const, icon: X, label: 'Absent', color: 'red' },
    { status: 'late' as const, icon: Clock, label: 'Late', color: 'yellow' },
    { status: 'partial' as const, icon: Minus, label: 'Partial', color: 'orange' },
  ];

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold">Mark Attendance</h3>
        <button
          onClick={saveAttendance}
          disabled={saving || attendees.every(a => a.status === null)}
          className="px-4 py-2 bg-primary-600 text-white rounded-lg 
                     hover:bg-primary-700 disabled:opacity-50"
        >
          {saving ? 'Saving...' : 'Save Attendance'}
        </button>
      </div>

      <div className="space-y-3">
        {attendees.map(attendee => (
          <div key={attendee.bookingId} className="bg-white rounded-lg border p-4">
            <div className="flex items-start justify-between">
              <div>
                <h4 className="font-medium">{attendee.name}</h4>
                <p className="text-sm text-gray-600">{attendee.email}</p>
              </div>

              <div className="flex gap-1">
                {statusButtons.map(({ status, icon: Icon, label, color }) => (
                  <button
                    key={status}
                    onClick={() => updateStatus(attendee.bookingId, status)}
                    className={`p-2 rounded-lg transition-all ${
                      attendee.status === status
                        ? `bg-${color}-100 text-${color}-700 ring-2 ring-${color}-500`
                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                    }`}
                    title={label}
                  >
                    <Icon className="w-5 h-5" />
                  </button>
                ))}
              </div>
            </div>

            {attendee.status && (
              <div className="mt-3">
                <input
                  type="text"
                  placeholder="Add notes (optional)"
                  value={attendee.notes}
                  onChange={(e) => updateNotes(attendee.bookingId, e.target.value)}
                  className="w-full px-3 py-1 text-sm border border-gray-300 rounded"
                />
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};
```

## Testing

1. Test session creation with conflict detection
2. Test recurring session generation
3. Test session updates with attendee notifications
4. Test cancellation and refund process
5. Test attendance marking workflow
6. Test certificate eligibility checks