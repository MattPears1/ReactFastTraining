# Booking Management System

## Overview

Comprehensive booking management system for administrators to view, manage, and create course bookings with dedicated views for past, current, and future bookings. Includes schedule creation with draft/publish workflow.

## System Architecture

### Core Components
1. **Past Bookings** - Historical records and reporting
2. **Current Bookings** - Active and upcoming bookings
3. **Future Scheduling** - Course schedule creation
4. **Booking Operations** - Manual booking, modifications, cancellations
5. **Attendee Management** - Student rosters and communications

## Data Models

### Booking Model
```typescript
interface Booking {
  id: number;
  bookingReference: string;
  userId: number;
  courseScheduleId: number;
  
  // User details (denormalized for quick access)
  user: {
    id: number;
    name: string;
    email: string;
    phone: string;
  };
  
  // Course details (denormalized)
  course: {
    id: number;
    name: string;
    type: string;
    duration: number;
  };
  
  // Schedule details
  schedule: {
    id: number;
    startDate: Date;
    endDate: Date;
    venue: VenueInfo;
    instructor: InstructorInfo;
  };
  
  // Booking status
  status: 'pending' | 'confirmed' | 'cancelled' | 'completed' | 'no_show';
  
  // Payment information
  payment: {
    status: 'pending' | 'paid' | 'refunded' | 'failed';
    amount: number;
    discountApplied: number;
    method: string;
    transactionId?: string;
  };
  
  // Communication tracking
  confirmationSent: boolean;
  reminderSent: boolean;
  certificateIssued: boolean;
  certificateIssuedDate?: Date;
  
  // Additional info
  notes?: string;
  specialRequirements?: string;
  createdAt: Date;
  updatedAt: Date;
}
```

### Course Schedule Model
```typescript
interface CourseSchedule {
  id: number;
  courseId: number;
  venueId: number;
  instructorId?: number;
  
  // Timing
  startDateTime: Date;
  endDateTime: Date;
  registrationDeadline: Date;
  
  // Status
  status: 'draft' | 'published' | 'full' | 'cancelled';
  
  // Capacity
  maxCapacity: number;
  currentCapacity: number;
  waitlistCount: number;
  
  // Settings
  allowWaitlist: boolean;
  autoConfirmBookings: boolean;
  sendReminders: boolean;
  reminderDays: number[];
  
  // Pricing overrides
  priceOverride?: number;
  specialOffers?: SpecialOffer[];
  
  // Additional info
  notes?: string;
  internalNotes?: string;
  createdBy: number;
  publishedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}
```

## User Interface Views

### 1. Past Bookings View

#### Features
- Historical booking records
- Advanced filtering and search
- Export capabilities
- Certificate reissue
- Analytics integration

#### Interface Design
```typescript
interface PastBookingsView {
  // Filters
  filters: {
    dateRange: { start: Date; end: Date };
    courseType?: string[];
    instructor?: number[];
    venue?: number[];
    status?: string[];
    paymentStatus?: string[];
    search?: string; // Name, email, reference
  };
  
  // Display options
  view: 'table' | 'cards' | 'timeline';
  columns: string[]; // Customizable columns
  
  // Grouping
  groupBy?: 'date' | 'course' | 'instructor' | 'venue';
  
  // Actions
  bulkActions: ['export', 'email', 'certificate'];
}
```

#### Key Functionalities
```typescript
// Search past attendees
GET /api/admin/bookings/past
Query: {
  startDate: string;
  endDate: string;
  search?: string;
  courseType?: string;
  page?: number;
  limit?: number;
}

// Export functionality
POST /api/admin/bookings/export
Body: {
  format: 'csv' | 'excel' | 'pdf';
  filters: PastBookingFilters;
  columns: string[];
}

// Reissue certificate
POST /api/admin/bookings/:id/certificate/reissue
```

### 2. Current Bookings View

#### Features
- Real-time booking status
- Quick actions (confirm, cancel, modify)
- Attendee communication
- Payment tracking
- Check-in functionality

#### Interface Components
```typescript
interface CurrentBookingsView {
  // Time filters
  timeFilter: 'today' | 'thisWeek' | 'nextWeek' | 'custom';
  
  // Status board view
  statusColumns: {
    pending: Booking[];
    confirmed: Booking[];
    waitlist: Booking[];
  };
  
  // Calendar view
  calendarView: {
    date: Date;
    view: 'day' | 'week' | 'month';
    schedules: ScheduleWithBookings[];
  };
  
  // Quick stats
  stats: {
    todaysClasses: number;
    weeklyBookings: number;
    pendingPayments: number;
    availableSpots: number;
  };
}
```

#### Management Actions
```typescript
// Quick booking confirmation
POST /api/admin/bookings/:id/confirm
Body: {
  sendEmail: boolean;
  paymentReceived: boolean;
}

// Move to waitlist
POST /api/admin/bookings/:id/waitlist

// Cancel booking
POST /api/admin/bookings/:id/cancel
Body: {
  reason: string;
  refundAmount?: number;
  sendNotification: boolean;
}

// Check-in attendee
POST /api/admin/bookings/:id/checkin
Body: {
  checkedInAt: Date;
  notes?: string;
}
```

### 3. Future Booking Creation

#### Schedule Creator Interface
```typescript
interface ScheduleCreator {
  // Step 1: Course Selection
  course: {
    courseId: number;
    customPrice?: number;
  };
  
  // Step 2: Venue & Instructor
  venue: {
    venueId: number;
    room?: string;
    setupNotes?: string;
  };
  instructor: {
    instructorId?: number;
    backupInstructorId?: number;
  };
  
  // Step 3: Date & Time
  scheduling: {
    mode: 'single' | 'recurring';
    startDate: Date;
    startTime: string;
    endTime: string;
    
    // For recurring
    recurrence?: {
      pattern: 'daily' | 'weekly' | 'monthly';
      interval: number;
      daysOfWeek?: number[];
      endAfter: 'date' | 'occurrences';
      endDate?: Date;
      occurrences?: number;
    };
  };
  
  // Step 4: Settings
  settings: {
    registrationOpens: Date;
    registrationCloses: Date;
    maxCapacity?: number; // Override course default
    allowWaitlist: boolean;
    autoConfirm: boolean;
    
    // Reminders
    sendReminders: boolean;
    reminderSchedule: number[]; // Days before
    
    // Special offers
    earlyBirdDiscount?: {
      percentage: number;
      validUntil: Date;
    };
  };
  
  // Step 5: Review & Publish
  status: 'draft' | 'published';
  publishImmediately: boolean;
  notifySubscribers: boolean;
}
```

#### Batch Schedule Creation
```typescript
// Create multiple schedules
POST /api/admin/schedules/batch
Body: {
  template: ScheduleTemplate;
  dates: Date[];
  variations?: ScheduleVariation[];
}

// Preview recurring schedules
POST /api/admin/schedules/preview-recurring
Body: RecurrencePattern
Response: {
  dates: Date[];
  conflicts: ConflictInfo[];
}
```

### 4. Booking Management Features

#### Manual Booking Creation
```typescript
interface ManualBooking {
  // Customer selection
  customer: {
    mode: 'existing' | 'new';
    userId?: number;
    
    // For new customer
    newCustomer?: {
      firstName: string;
      lastName: string;
      email: string;
      phone: string;
    };
  };
  
  // Course selection
  courseScheduleId: number;
  numberOfAttendees: number;
  
  // Payment
  payment: {
    method: 'card' | 'bank' | 'cash' | 'invoice';
    status: 'pending' | 'paid';
    amount: number;
    discountCode?: string;
    customDiscount?: number;
    notes?: string;
  };
  
  // Options
  sendConfirmation: boolean;
  addToMailingList: boolean;
  specialRequirements?: string;
}

// Create manual booking
POST /api/admin/bookings/manual
Body: ManualBooking
```

#### Attendee Management
```typescript
interface AttendeeRoster {
  scheduleId: number;
  attendees: AttendeeInfo[];
  
  // Bulk actions
  actions: {
    sendEmail: (attendeeIds: number[], template: string) => Promise<void>;
    printCertificates: (attendeeIds: number[]) => Promise<Blob>;
    exportContacts: (format: 'csv' | 'vcard') => Promise<Blob>;
    markAttendance: (attendeeIds: number[], present: boolean) => Promise<void>;
  };
  
  // Communication
  communications: {
    sendReminder: () => Promise<void>;
    sendUpdate: (message: string) => Promise<void>;
    sendCancellation: (reason: string) => Promise<void>;
  };
}
```

## Advanced Features

### 1. Conflict Detection
```typescript
class ScheduleConflictDetector {
  async checkConflicts(
    schedule: ProposedSchedule
  ): Promise<ConflictResult> {
    const conflicts: Conflict[] = [];
    
    // Venue conflicts
    const venueConflicts = await this.checkVenueAvailability(
      schedule.venueId,
      schedule.startDateTime,
      schedule.endDateTime
    );
    
    // Instructor conflicts
    if (schedule.instructorId) {
      const instructorConflicts = await this.checkInstructorAvailability(
        schedule.instructorId,
        schedule.startDateTime,
        schedule.endDateTime
      );
      conflicts.push(...instructorConflicts);
    }
    
    // Resource conflicts (equipment, materials)
    const resourceConflicts = await this.checkResourceAvailability(
      schedule.courseId,
      schedule.startDateTime
    );
    
    return {
      hasConflicts: conflicts.length > 0,
      conflicts,
      suggestions: this.generateAlternatives(schedule, conflicts)
    };
  }
}
```

### 2. Automated Workflows
```typescript
interface BookingWorkflows {
  // Reminder automation
  reminderWorkflow: {
    enabled: boolean;
    schedule: number[]; // Days before course
    template: 'standard' | 'custom';
    includeCalendarInvite: boolean;
  };
  
  // Waitlist management
  waitlistWorkflow: {
    autoPromote: boolean;
    notificationDelay: number; // Hours
    expiryTime: number; // Hours to respond
  };
  
  // Follow-up automation
  followUpWorkflow: {
    enabled: boolean;
    delay: number; // Days after course
    template: string;
    includeSurvey: boolean;
    includeCertificate: boolean;
  };
}
```

### 3. Reporting & Analytics
```typescript
interface BookingReports {
  // Utilization report
  utilizationReport: {
    period: DateRange;
    metrics: {
      averageOccupancy: number;
      peakTimes: TimeSlot[];
      underutilizedSlots: ScheduleInfo[];
      revenueBySlot: RevenueData[];
    };
  };
  
  // Attendance tracking
  attendanceReport: {
    showRates: boolean;
    noShowAnalysis: {
      rate: number;
      patterns: Pattern[];
      estimatedRevenueLoss: number;
    };
  };
  
  // Instructor performance
  instructorReport: {
    instructorId: number;
    metrics: {
      classesTraught: number;
      averageRating: number;
      attendanceRate: number;
      revenue: number;
    };
  };
}
```

## Communication Templates

### Email Templates
```typescript
interface EmailTemplates {
  // Booking confirmation
  bookingConfirmation: {
    subject: string;
    body: string;
    attachments: ['calendar', 'directions', 'courseInfo'];
  };
  
  // Reminders
  reminderTemplates: {
    '7days': EmailTemplate;
    '24hours': EmailTemplate;
    '2hours': EmailTemplate;
  };
  
  // Changes & cancellations
  scheduleChange: EmailTemplate;
  cancellation: EmailTemplate;
  waitlistPromotion: EmailTemplate;
}
```

### SMS Templates
```typescript
interface SMSTemplates {
  reminder: string; // 160 chars max
  confirmation: string;
  lastMinuteUpdate: string;
}
```

## Calendar Integration

### Calendar Views
```typescript
interface CalendarIntegration {
  // Views
  views: {
    monthly: MonthlyCalendar;
    weekly: WeeklyCalendar;
    daily: DailyAgenda;
    resource: ResourceCalendar; // By venue/instructor
  };
  
  // Features
  features: {
    dragAndDrop: boolean;
    quickCreate: boolean;
    conflictHighlighting: boolean;
    capacityIndicators: boolean;
  };
  
  // Export options
  export: {
    format: 'ical' | 'google' | 'outlook';
    range: 'selected' | 'month' | 'all';
  };
}
```

## Performance Optimization

### 1. Data Loading
```typescript
// Lazy loading for large datasets
const usePaginatedBookings = (filters: BookingFilters) => {
  const {
    data,
    fetchNextPage,
    hasNextPage,
    isLoading
  } = useInfiniteQuery({
    queryKey: ['bookings', filters],
    queryFn: ({ pageParam = 1 }) => 
      fetchBookings({ ...filters, page: pageParam }),
    getNextPageParam: (lastPage) => lastPage.nextPage
  });
  
  return { data, loadMore: fetchNextPage, hasMore: hasNextPage };
};
```

### 2. Real-time Updates
```typescript
// WebSocket for live updates
const useBookingUpdates = (scheduleId: number) => {
  useEffect(() => {
    const socket = io('/bookings');
    
    socket.on(`schedule:${scheduleId}:update`, (data) => {
      // Update local state
      queryClient.invalidateQueries(['schedule', scheduleId]);
    });
    
    return () => socket.disconnect();
  }, [scheduleId]);
};
```

## Security & Permissions

### Permission Levels
```typescript
const bookingPermissions = {
  admin: {
    view: ['all'],
    create: ['manual', 'bulk', 'import'],
    modify: ['all'],
    delete: ['all'],
    export: ['all']
  },
  instructor: {
    view: ['own-classes'],
    create: [],
    modify: ['attendance'],
    delete: [],
    export: ['own-roster']
  },
  staff: {
    view: ['all'],
    create: ['manual'],
    modify: ['limited'],
    delete: [],
    export: ['filtered']
  }
};
```

## Implementation Roadmap

### Phase 1: Core Views (Week 1)
- [ ] Past bookings table with filters
- [ ] Current bookings dashboard
- [ ] Basic schedule creation
- [ ] Simple booking search

### Phase 2: Management Features (Week 2)
- [ ] Manual booking creation
- [ ] Booking modifications
- [ ] Attendee management
- [ ] Email communications

### Phase 3: Advanced Features (Week 3)
- [ ] Recurring schedules
- [ ] Conflict detection
- [ ] Automated workflows
- [ ] Calendar integration

### Phase 4: Analytics & Polish (Week 4)
- [ ] Reporting dashboards
- [ ] Export functionality
- [ ] Performance optimization
- [ ] Mobile responsiveness