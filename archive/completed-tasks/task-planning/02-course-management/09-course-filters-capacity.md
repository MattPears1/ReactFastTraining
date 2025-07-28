# Course Filters and Capacity Management

## Overview
Implement filtering system for courses by date and type, with strict capacity management (max 12 attendees per session).please use ultra think to plan for this and you can createfiles withinthis folder if it helps like a CSV with tasks to keep track etc 

## Features

### 1. Filtering Options
- **By Date**: Date picker or date range
- **By Course Type**: Dropdown with all course types
- **By Availability**: Show only available, show all, show full
- **By Location**: Location A or Location B

### 2. Capacity Management
- **Hard limit**: 12 attendees maximum
- **Visual indicators**: Progress bars, color coding
- **Automatic closure**: Hide full sessions from booking
- **Waitlist**: None (as per requirements)

## Database Implementation

### Course Types Reference
```typescript
// backend-loopback4/src/constants/course-types.ts
export const COURSE_TYPES = {
  EFAW: {
    id: 'efaw',
    name: 'Emergency First Aid at Work',
    duration: '1 Day',
    price: 75,
    description: 'HSE approved emergency first aid training',
  },
  FAW: {
    id: 'faw',
    name: 'First Aid at Work',
    duration: '3 Days',
    price: 200,
    description: 'Comprehensive first aid qualification',
  },
  PAEDIATRIC: {
    id: 'paediatric',
    name: 'Paediatric First Aid',
    duration: '2 Days',
    price: 120,
    description: 'First aid for infants and children',
  },
  // ... other courses
} as const;

export type CourseTypeId = keyof typeof COURSE_TYPES;
```

### Capacity Tracking
```typescript
// backend-loopback4/src/services/capacity.service.ts
import { db } from '../config/database.config';
import { courseSessions, bookings } from '../db/schema';
import { eq, sql } from 'drizzle-orm';

export class CapacityService {
  static readonly MAX_CAPACITY = 12;

  static async checkAvailability(sessionId: string): Promise<{
    available: boolean;
    currentCount: number;
    remainingSpots: number;
  }> {
    // Get current booking count
    const [result] = await db
      .select({
        count: sql<number>`COUNT(*)`,
      })
      .from(bookings)
      .where(eq(bookings.sessionId, sessionId));

    const currentCount = result.count;
    const remainingSpots = this.MAX_CAPACITY - currentCount;

    return {
      available: remainingSpots > 0,
      currentCount,
      remainingSpots,
    };
  }

  static async getSessionsWithCapacity(filters: {
    startDate?: Date;
    endDate?: Date;
    courseType?: string;
    minAvailable?: number;
  }) {
    const query = db
      .select({
        session: courseSessions,
        bookingCount: sql<number>`COUNT(b.id)`,
        remainingSpots: sql<number>`${this.MAX_CAPACITY} - COUNT(b.id)`,
      })
      .from(courseSessions)
      .leftJoin(bookings, eq(bookings.sessionId, courseSessions.id))
      .groupBy(courseSessions.id);

    // Add filters
    const conditions = [];
    if (filters.startDate) {
      conditions.push(gte(courseSessions.sessionDate, filters.startDate));
    }
    if (filters.endDate) {
      conditions.push(lte(courseSessions.sessionDate, filters.endDate));
    }
    if (filters.courseType) {
      conditions.push(eq(courseSessions.courseType, filters.courseType));
    }

    if (conditions.length > 0) {
      query.where(and(...conditions));
    }

    // Filter by minimum available spots
    if (filters.minAvailable && filters.minAvailable > 0) {
      query.having(sql`COUNT(b.id) < ${this.MAX_CAPACITY - filters.minAvailable + 1}`);
    }

    return await query;
  }
}
```

## Frontend Implementation

### Course Filter Component
```typescript
// src/components/booking/CourseFilters.tsx
import React, { useState } from 'react';
import { DatePicker } from '@/components/ui/DatePicker';
import { COURSE_TYPES } from '@/constants/courses';

interface FilterState {
  dateFrom: Date | null;
  dateTo: Date | null;
  courseType: string;
  showOnlyAvailable: boolean;
  location: string;
}

interface CourseFiltersProps {
  onFiltersChange: (filters: FilterState) => void;
}

export const CourseFilters: React.FC<CourseFiltersProps> = ({ onFiltersChange }) => {
  const [filters, setFilters] = useState<FilterState>({
    dateFrom: null,
    dateTo: null,
    courseType: '',
    showOnlyAvailable: true,
    location: '',
  });

  const updateFilter = (key: keyof FilterState, value: any) => {
    const newFilters = { ...filters, [key]: value };
    setFilters(newFilters);
    onFiltersChange(newFilters);
  };

  const clearFilters = () => {
    const clearedFilters: FilterState = {
      dateFrom: null,
      dateTo: null,
      courseType: '',
      showOnlyAvailable: true,
      location: '',
    };
    setFilters(clearedFilters);
    onFiltersChange(clearedFilters);
  };

  return (
    <div className="bg-white rounded-lg shadow p-4 space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">Filter Courses</h3>
        <button
          onClick={clearFilters}
          className="text-sm text-primary-600 hover:underline"
        >
          Clear all
        </button>
      </div>

      {/* Date Range */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            From Date
          </label>
          <DatePicker
            selected={filters.dateFrom}
            onChange={(date) => updateFilter('dateFrom', date)}
            minDate={new Date()}
            placeholderText="Select start date"
            className="w-full"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            To Date
          </label>
          <DatePicker
            selected={filters.dateTo}
            onChange={(date) => updateFilter('dateTo', date)}
            minDate={filters.dateFrom || new Date()}
            placeholderText="Select end date"
            className="w-full"
          />
        </div>
      </div>

      {/* Course Type */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Course Type
        </label>
        <select
          value={filters.courseType}
          onChange={(e) => updateFilter('courseType', e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg"
        >
          <option value="">All Courses</option>
          {Object.values(COURSE_TYPES).map(course => (
            <option key={course.id} value={course.name}>
              {course.name}
            </option>
          ))}
        </select>
      </div>

      {/* Location */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Location
        </label>
        <select
          value={filters.location}
          onChange={(e) => updateFilter('location', e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg"
        >
          <option value="">All Locations</option>
          <option value="Location A">Location A</option>
          <option value="Location B">Location B</option>
        </select>
      </div>

      {/* Availability Toggle */}
      <div className="flex items-center">
        <input
          type="checkbox"
          id="showOnlyAvailable"
          checked={filters.showOnlyAvailable}
          onChange={(e) => updateFilter('showOnlyAvailable', e.target.checked)}
          className="h-4 w-4 text-primary-600 rounded"
        />
        <label htmlFor="showOnlyAvailable" className="ml-2 text-sm text-gray-700">
          Show only available courses
        </label>
      </div>
    </div>
  );
};
```

### Capacity Display Component
```typescript
// src/components/booking/CapacityIndicator.tsx
import React from 'react';
import { Users } from 'lucide-react';

interface CapacityIndicatorProps {
  current: number;
  max: number;
  showNumbers?: boolean;
  size?: 'sm' | 'md' | 'lg';
}

export const CapacityIndicator: React.FC<CapacityIndicatorProps> = ({
  current,
  max = 12,
  showNumbers = true,
  size = 'md',
}) => {
  const percentage = (current / max) * 100;
  const remaining = max - current;
  const isFull = remaining === 0;
  const isAlmostFull = remaining <= 3 && remaining > 0;

  const getColor = () => {
    if (isFull) return 'bg-red-500';
    if (isAlmostFull) return 'bg-yellow-500';
    if (percentage >= 50) return 'bg-blue-500';
    return 'bg-green-500';
  };

  const getTextColor = () => {
    if (isFull) return 'text-red-600';
    if (isAlmostFull) return 'text-yellow-600';
    return 'text-gray-700';
  };

  const sizeClasses = {
    sm: 'h-2',
    md: 'h-3',
    lg: 'h-4',
  };

  return (
    <div className="space-y-2">
      {/* Progress Bar */}
      <div className={`w-full bg-gray-200 rounded-full overflow-hidden ${sizeClasses[size]}`}>
        <div
          className={`h-full transition-all duration-300 ${getColor()}`}
          style={{ width: `${percentage}%` }}
        />
      </div>

      {/* Text Info */}
      {showNumbers && (
        <div className={`flex items-center justify-between text-sm ${getTextColor()}`}>
          <span className="flex items-center gap-1">
            <Users className="w-4 h-4" />
            {current}/{max} booked
          </span>
          <span className="font-medium">
            {isFull ? (
              'FULLY BOOKED'
            ) : isAlmostFull ? (
              `Only ${remaining} spots left!`
            ) : (
              `${remaining} spots available`
            )}
          </span>
        </div>
      )}
    </div>
  );
};
```

### Course List with Filters
```typescript
// src/components/booking/FilteredCourseList.tsx
import React, { useState, useEffect } from 'react';
import { CourseFilters } from './CourseFilters';
import { CapacityIndicator } from './CapacityIndicator';
import { courseApi } from '@/services/api/courses';
import { format } from 'date-fns';

export const FilteredCourseList: React.FC = () => {
  const [sessions, setSessions] = useState<CourseSession[]>([]);
  const [loading, setLoading] = useState(false);
  const [filters, setFilters] = useState({});

  useEffect(() => {
    loadSessions();
  }, [filters]);

  const loadSessions = async () => {
    setLoading(true);
    try {
      const data = await courseApi.getFilteredSessions(filters);
      setSessions(data);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
      {/* Filters Sidebar */}
      <div className="lg:col-span-1">
        <CourseFilters onFiltersChange={setFilters} />
      </div>

      {/* Course List */}
      <div className="lg:col-span-3">
        {loading ? (
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 
                            border-primary-600 mx-auto"></div>
          </div>
        ) : sessions.length === 0 ? (
          <div className="text-center py-8 bg-gray-50 rounded-lg">
            <p className="text-gray-600">No courses found matching your criteria.</p>
            <button
              onClick={() => setFilters({})}
              className="mt-4 text-primary-600 hover:underline"
            >
              Clear filters
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            {sessions.map(session => (
              <div
                key={session.id}
                className={`bg-white rounded-lg shadow p-6 border-2 transition-all ${
                  session.remainingSpots === 0
                    ? 'border-red-200 opacity-75'
                    : 'border-transparent hover:border-primary-200'
                }`}
              >
                <div className="flex flex-col md:flex-row md:items-center md:justify-between">
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold text-gray-900">
                      {session.courseType}
                    </h3>
                    <div className="mt-2 space-y-1 text-sm text-gray-600">
                      <p>📅 {format(new Date(session.sessionDate), 'EEEE, MMMM d, yyyy')}</p>
                      <p>⏰ {session.startTime} - {session.endTime}</p>
                      <p>📍 {session.location}</p>
                    </div>
                  </div>

                  <div className="mt-4 md:mt-0 md:ml-6 md:w-64">
                    <CapacityIndicator
                      current={session.currentBookings}
                      max={12}
                      size="md"
                    />
                    {session.remainingSpots > 0 && (
                      <button className="mt-3 w-full bg-primary-600 text-white py-2 
                                       rounded-lg hover:bg-primary-700 transition-colors">
                        Book Now
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
```

### Mobile-Optimized Filter
```typescript
// src/components/booking/MobileFilterSheet.tsx
import React, { useState } from 'react';
import { Filter } from 'lucide-react';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';

export const MobileFilterSheet: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="md:hidden fixed bottom-4 right-4 bg-primary-600 text-white 
                   p-3 rounded-full shadow-lg z-10"
      >
        <Filter className="w-6 h-6" />
      </button>

      <Sheet open={open} onOpenChange={setOpen}>
        <SheetContent side="bottom" className="h-[80vh]">
          <SheetHeader>
            <SheetTitle>Filter Courses</SheetTitle>
          </SheetHeader>
          <div className="mt-4 overflow-y-auto">
            {children}
          </div>
        </SheetContent>
      </Sheet>
    </>
  );
};
```

## API Endpoints

### Get Filtered Sessions
```typescript
// GET /api/courses/sessions
interface SessionFilters {
  startDate?: string;
  endDate?: string;
  courseType?: string;
  location?: string;
  minAvailable?: number;
  showFull?: boolean;
}

interface SessionResponse {
  id: string;
  courseType: string;
  sessionDate: string;
  startTime: string;
  endTime: string;
  location: string;
  currentBookings: number;
  remainingSpots: number;
  price: number;
}
```

## Performance Considerations

1. **Query Optimization**
   - Use database indexes on filtered columns
   - Aggregate booking counts in single query
   - Cache filter results for 1 minute

2. **UI Performance**
   - Debounce filter changes
   - Virtual scrolling for large lists
   - Progressive loading

3. **Real-Time Updates**
   - Update capacity counts via WebSocket
   - Optimistic UI updates
   - Handle race conditions

## Testing

1. Test filter combinations work correctly
2. Test capacity limits are enforced
3. Test real-time capacity updates
4. Test mobile filter experience
5. Test performance with many sessions
6. Test edge cases (all full, none available)