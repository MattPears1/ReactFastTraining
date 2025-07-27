# Client Portal Architecture Plan

## Overview
The React Fast Training Client Portal is a comprehensive dashboard where customers manage their first aid training journey. It provides access to upcoming courses, booking history, certificates, and account management.

## Core Features

### 1. Dashboard (Upcoming Courses)
- **Next Course Highlight**: Prominent display with countdown
- **Upcoming Courses List**: All future bookings with quick actions
- **User Statistics**: Courses completed, certificates earned
- **Pre-Course Materials**: Downloadable resources
- **Mobile Optimization**: Swipeable views

### 2. Booking History
- **Comprehensive History**: All past and upcoming bookings
- **Advanced Filtering**: By status, date, course type
- **Detailed Views**: Full booking information with tabs
- **Certificate Management**: Download completed course certificates
- **Invoice Access**: Download payment invoices
- **Data Export**: CSV export functionality

## Technical Architecture

### Folder Structure
```
src/
├── pages/
│   └── client/
│       ├── DashboardPage.tsx
│       ├── BookingHistoryPage.tsx
│       └── index.ts
├── components/
│   └── client/
│       ├── dashboard/
│       ├── booking-history/
│       └── shared/
├── services/
│   └── client/
├── hooks/
│   └── client/
├── types/
│   └── client/
└── contexts/
    └── ClientPortalContext.tsx
```

### Route Structure
```
/client                    → Redirect to /client/dashboard
/client/dashboard          → DashboardPage
/client/bookings           → BookingHistoryPage
/client/bookings/:id       → BookingHistoryPage with modal
```

### Component Hierarchy
```
ClientPortalLayout (wrapper)
├── Navigation (Dashboard | Bookings | Settings)
├── Page Content
└── Footer
```

### State Management
- React Context for portal-wide state
- Local state for component-specific data
- React Query for API data caching

### API Integration Points

#### Dashboard APIs
- `GET /api/client/dashboard` - Overview data
- `GET /api/client/upcoming-courses` - Future bookings
- `GET /api/client/stats` - User statistics
- `GET /api/client/materials/:bookingId` - Course materials

#### Booking History APIs
- `GET /api/client/bookings` - Paginated history
- `GET /api/client/bookings/:id` - Booking details
- `GET /api/client/certificates/:bookingId` - Certificate PDF
- `GET /api/client/invoices/:bookingId` - Invoice PDF
- `GET /api/client/bookings/export` - CSV export

## Implementation Phases

### Phase 1: Foundation (Day 1)
1. Set up client portal routes
2. Create ClientPortalLayout
3. Implement authentication guard
4. Define TypeScript types

### Phase 2: Dashboard (Day 2-3)
1. Build DashboardPage structure
2. Implement NextCourseCard with countdown
3. Create DashboardStats component
4. Build CourseList with cards
5. Add mobile responsive design

### Phase 3: Booking History (Day 4-5)
1. Create BookingHistoryPage
2. Implement filters and search
3. Build BookingDetailModal
4. Add certificate downloads
5. Implement CSV export

### Phase 4: Polish & Testing (Day 6)
1. Add loading states
2. Implement error handling
3. Add animations
4. Write tests
5. Performance optimization

## Design Decisions

### Mobile-First Approach
- Design for 320px minimum width
- Progressive enhancement for larger screens
- Touch-friendly interactions
- Swipeable navigation on mobile

### Performance Strategy
- Lazy load modal components
- Implement virtual scrolling for long lists
- Cache API responses
- Optimize bundle size

### Accessibility Requirements
- WCAG 2.1 AA compliance
- Keyboard navigation
- Screen reader support
- High contrast mode support

### Security Measures
- JWT token validation
- User ownership verification
- Secure file downloads
- Rate limiting on exports

## UI/UX Guidelines

### Visual Hierarchy
1. Next course (most prominent)
2. Action buttons (high visibility)
3. Supporting information
4. Navigation elements

### Color Coding
- Blue: Upcoming courses
- Green: Completed/Certificates
- Orange: Requires attention
- Red: Cancelled/Urgent

### Loading States
- Skeleton screens matching layout
- Progressive data loading
- Meaningful loading messages

### Empty States
- Helpful illustrations
- Clear call-to-action
- Link to course catalog

## Testing Strategy

### Unit Tests
- Component rendering
- User interactions
- Data transformations
- Error scenarios

### Integration Tests
- API integration
- Authentication flow
- File downloads
- Data export

### E2E Tests
- Complete user journeys
- Mobile interactions
- Performance metrics

## Success Metrics
- Page load time < 2s
- Time to first meaningful paint < 1s
- Zero accessibility violations
- 100% mobile responsive
- User task completion rate > 95%