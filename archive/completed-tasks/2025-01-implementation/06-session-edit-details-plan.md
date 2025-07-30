# Session Edit/Details Page Implementation Plan

## Overview
This plan outlines the implementation of a unified session editing and details view that integrates with both the dashboard "View details" links and the calendar view editing functionality. The goal is to provide a comprehensive interface for viewing and editing course session information.

## Current Issues to Resolve

### 1. Routing Loop Fix
**Problem**: Clicking "View details" from the dashboard causes an infinite redirect loop
**Solution**: 
- Add proper route definition: `/admin/schedule/:id`
- Create ScheduleDetailsPage component
- Update routing in AdminApp.tsx

### 2. Integration Points
The session edit page needs to integrate with:
- Dashboard upcoming schedules widget (View details link)
- Calendar view modal (Edit Session button)
- Schedule list page (View/Edit actions)

## Page Architecture

### Route Structure
```
/admin/schedule          - List view of all sessions
/admin/schedule/:id      - Details/Edit view for specific session
/admin/schedule/:id/edit - Redirect to :id (same page handles both)
```

### Component Structure
```
ScheduleDetailsPage
├── SessionInfoSection      - Basic session information
├── CapacityManagement      - Manage bookings and capacity
├── AttendeesList          - View/manage attendees
├── FinancialSummary       - Revenue and payment tracking
├── SessionActions         - Edit, Cancel, Email attendees
└── ActivityLog            - Track changes to the session
```

## Core Features

### 1. Session Information Display
- **Course Details**: Name, type, description
- **Schedule**: Date, start/end times, duration
- **Location**: Venue name, address, directions link
- **Instructor**: Name, qualifications, contact
- **Status**: Scheduled, In Progress, Completed, Cancelled

### 2. Capacity Management
```typescript
interface CapacityInfo {
  maxCapacity: number;
  currentBookings: number;
  confirmedAttendees: number;
  waitlistCount: number;
  availableSpots: number;
  capacityPercentage: number;
}
```

**Features**:
- Visual capacity indicator (progress bar)
- Quick add booking button
- Waitlist management
- Capacity adjustment with validation

### 3. Attendee Management
**Display**:
- List of all bookings with attendee details
- Booking status (confirmed, pending, cancelled)
- Payment status
- Special requirements/notes
- Contact information

**Actions**:
- View booking details
- Cancel individual bookings
- Move from waitlist to confirmed
- Send individual emails
- Export attendee list

### 4. Edit Functionality

#### Editable Fields
```typescript
interface EditableSessionFields {
  // Schedule
  date: Date;
  startTime: string;
  endTime: string;
  
  // Details
  maxCapacity: number;
  location: string;
  instructor: string;
  price: number;
  
  // Settings
  allowWaitlist: boolean;
  autoConfirmBookings: boolean;
  requiresPaymentUpfront: boolean;
  
  // Content
  description: string;
  specialInstructions: string;
  cancellationPolicy: string;
}
```

#### Validation Rules
1. **Date/Time Validation**:
   - Cannot edit past sessions
   - Must be within business hours (8 AM - 6 PM)
   - Minimum 24 hours notice for changes
   - Check for instructor/venue conflicts

2. **Capacity Validation**:
   - Cannot reduce below current bookings
   - Must maintain minimum capacity (e.g., 6)
   - Maximum capacity based on venue

3. **Notification Requirements**:
   - Any schedule change triggers attendee notifications
   - Price changes require confirmation
   - Cancellation requires reason and notification

### 5. Session Actions

#### Primary Actions
1. **Save Changes**
   - Validate all fields
   - Check for conflicts
   - Update database
   - Send notifications if needed
   - Log changes

2. **Cancel Session**
   - Require cancellation reason
   - Option to suggest alternative sessions
   - Process refunds automatically
   - Send cancellation emails
   - Update booking statuses

3. **Duplicate Session**
   - Copy session details
   - Select new date/time
   - Maintain settings and content
   - Create as new draft

4. **Email Attendees**
   - Pre-populated recipient list
   - Template selection
   - Custom message option
   - Track email status

#### Secondary Actions
- Print attendee list
- Generate sign-in sheet
- Export session data
- View session history
- Generate certificates

### 6. Integration Features

#### Calendar Integration
- Changes reflect immediately in calendar view
- Drag-drop from calendar opens edit mode
- Conflict checking across calendar

#### Booking System Integration
- Real-time booking count updates
- Automatic waitlist processing
- Payment reconciliation

#### Communication Integration
- Email history for session
- SMS notification options
- Automated reminders

## User Interface Design

### Layout Structure
```
┌─────────────────────────────────────────────────────────┐
│  [← Back] Session: Emergency First Aid - Leeds          │
│                                     [Save] [Cancel] [···]│
├─────────────────────────────────────────────────────────┤
│                                                         │
│  ┌─────────────────────┬────────────────────────────┐  │
│  │ Session Information  │ Capacity & Bookings       │  │
│  │                     │ ████████░░ 8/12            │  │
│  │ Date: 30 Jul 2025   │                           │  │
│  │ Time: 09:00-17:00   │ [Manage Bookings]         │  │
│  │ Venue: Leeds Central│                           │  │
│  │ Instructor: Lex R.  │ Revenue: £600             │  │
│  └─────────────────────┴────────────────────────────┘  │
│                                                         │
│  ┌─────────────────────────────────────────────────┐  │
│  │ Attendees (8)                     [Email All ↓] │  │
│  ├─────────────────────────────────────────────────┤  │
│  │ • John Smith - john@email.com - Confirmed ✓    │  │
│  │ • Jane Doe - jane@email.com - Confirmed ✓      │  │
│  │ • ... (show all)                               │  │
│  └─────────────────────────────────────────────────┘  │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

### Edit Mode
- Inline editing for simple fields
- Modal for complex edits (schedule changes)
- Real-time validation feedback
- Unsaved changes warning

### Mobile Responsive Design
- Stack sections vertically on mobile
- Touch-friendly action buttons
- Swipe actions for attendee list
- Simplified navigation

## API Endpoints

### Session Details
```typescript
GET /api/admin/sessions/:id
Response: {
  session: SessionDetails,
  bookings: BookingDetails[],
  waitlist: WaitlistEntry[],
  history: ChangeLog[],
  conflicts: ConflictInfo[]
}
```

### Update Session
```typescript
PUT /api/admin/sessions/:id
Body: EditableSessionFields
Response: {
  success: boolean,
  session: SessionDetails,
  notifications: NotificationsSent[]
}
```

### Session Actions
```typescript
POST /api/admin/sessions/:id/cancel
POST /api/admin/sessions/:id/duplicate
POST /api/admin/sessions/:id/email-attendees
GET /api/admin/sessions/:id/export
```

## Implementation Phases

### Phase 1: Core Functionality (Immediate)
1. Fix routing issue
2. Create ScheduleDetailsPage component
3. Implement read-only view
4. Add basic navigation

### Phase 2: Edit Capabilities (Next Sprint)
1. Add inline editing
2. Implement validation
3. Add conflict checking
4. Create notification system

### Phase 3: Advanced Features (Future)
1. Bulk operations
2. Advanced analytics
3. Automated scheduling
4. Mobile app integration

## Security Considerations

### Permission Levels
- **View**: See session details and attendees
- **Edit**: Modify session details
- **Cancel**: Cancel sessions and process refunds
- **Admin**: All actions plus bulk operations

### Audit Trail
Track all changes:
- Who made the change
- When it was made
- What was changed (before/after)
- Reason for change (if provided)

### Data Protection
- PII handling for attendee information
- Secure export functionality
- Email masking options
- GDPR compliance for data access

## Performance Optimizations

### Caching Strategy
- Cache session details for 5 minutes
- Real-time updates for bookings
- Lazy load attendee details
- Prefetch common actions

### Loading States
- Skeleton screens for initial load
- Optimistic updates for edits
- Progressive enhancement
- Offline capability planning

## Testing Requirements

### Unit Tests
- Validation logic
- Permission checks
- Date/time calculations
- Capacity management

### Integration Tests
- API endpoint testing
- Notification sending
- Conflict detection
- Database transactions

### E2E Tests
- Complete edit workflow
- Cancellation process
- Attendee management
- Mobile responsiveness

## Success Metrics

### Technical Metrics
- Page load time < 2 seconds
- Save operation < 1 second
- Zero data loss on edits
- 99.9% uptime

### Business Metrics
- Reduced time to manage sessions
- Fewer scheduling conflicts
- Improved attendee communication
- Increased operational efficiency

## Migration Strategy

### From Current System
1. Update routing configuration
2. Redirect old URLs to new structure
3. Maintain backwards compatibility
4. Gradual feature rollout

### Data Migration
- No data structure changes needed
- Existing session data compatible
- Add new fields with defaults
- Preserve historical data

## Future Enhancements

### Planned Features
1. **AI-Powered Scheduling**: Suggest optimal times
2. **Automated Waitlist**: Smart attendee upgrades
3. **Dynamic Pricing**: Demand-based pricing
4. **Resource Management**: Equipment and room tracking
5. **Instructor Portal**: Self-service session management

### Integration Opportunities
- Calendar sync (Google, Outlook)
- Video conferencing for hybrid sessions
- Payment processing improvements
- Customer portal access
- Mobile app deep linking

## Dependencies

### Technical Dependencies
- React Router for navigation
- React Query for data fetching
- Zod for validation
- Date-fns for date handling
- Tailwind for styling

### System Dependencies
- Backend API availability
- Email service functionality
- Database performance
- Authentication system

## Risks and Mitigation

### Identified Risks
1. **Data Loss**: Mitigate with autosave and confirmation dialogs
2. **Conflicting Edits**: Implement optimistic locking
3. **Performance**: Add pagination and lazy loading
4. **User Errors**: Comprehensive validation and undo functionality

## Documentation Requirements

### Developer Documentation
- API endpoint specifications
- Component prop definitions
- State management guide
- Testing procedures

### User Documentation
- How to edit sessions
- Understanding notifications
- Troubleshooting guide
- Best practices

## Conclusion

This comprehensive plan provides a roadmap for implementing a robust session editing and details page that addresses the immediate routing issue while laying the foundation for a feature-rich session management system. The phased approach allows for quick wins while building towards a complete solution.