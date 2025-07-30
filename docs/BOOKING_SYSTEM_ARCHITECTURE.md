# Booking System Architecture Documentation

**Last updated: 2025-07-27**

## Overview

The React Fast Training booking system is a comprehensive, enterprise-grade solution designed to handle first aid course bookings with advanced features including real-time availability, group discounts, and multi-step booking flows.

## System Architecture

### Frontend Architecture

#### Component Structure
```
src/components/booking/
├── shared/                 # Reusable components
│   ├── CourseCard.tsx     # Course display with availability
│   ├── PricingSummary.tsx # Dynamic pricing calculations
│   ├── BookingSteps.tsx   # Progress indicator
│   └── BookingSkeleton.tsx # Loading states
├── steps/                  # Multi-step wizard
│   ├── CourseSelectionStep.tsx
│   ├── AttendeeInformationStep.tsx
│   ├── ReviewTermsStep.tsx
│   └── PaymentStep.tsx
├── CalendarView.tsx        # Monthly calendar display
├── CourseAvailabilityEnhanced.tsx # Main booking interface
└── BookingConfirmation.tsx # Success page
```

#### Key Features

1. **Dual View Modes**
   - Calendar View: Visual monthly calendar with course dots
   - List View: Detailed course information with filtering

2. **Advanced Filtering**
   - Course Type (13 different types)
   - Location (8 Yorkshire locations)
   - Date Range
   - Search by keywords

3. **Group Booking Support**
   - Dynamic participant management
   - Automatic 10% discount for 5+ attendees
   - Individual attendee information collection

4. **Real-time Updates**
   - WebSocket connection for live availability
   - Instant capacity updates
   - Booking intent broadcasting

### Backend Architecture (LoopBack 4)

#### Core Models
```typescript
// Course Session Model
interface CourseSession {
  id: string;
  courseId: string;
  startDate: Date;
  endDate: Date;
  location: string;
  currentCapacity: number;
  maxCapacity: number; // Hard limit: 12
  status: 'SCHEDULED' | 'FULL' | 'CANCELLED';
}

// Booking Model
interface Booking {
  id: string;
  bookingReference: string; // Format: RFT-YYYY-NNNN
  sessionId: string;
  userId: string;
  participants: Participant[];
  totalAmount: number;
  status: BookingStatus;
  specialRequirements?: string;
}
```

#### Service Layer Architecture

1. **Booking Service**
   - Distributed locking for concurrent booking prevention
   - Transaction management with Saga pattern
   - Automatic email notifications
   - Payment processing integration

2. **Availability Service**
   - Real-time capacity calculations
   - WebSocket broadcasting
   - Calendar data aggregation
   - Filtering and search

3. **Email Service**
   - Professional HTML templates
   - Booking confirmations
   - Reminder notifications
   - Course change alerts

## Data Flow

### Booking Process Flow
```
1. Course Selection
   ├── Load available sessions
   ├── Apply filters
   └── Real-time availability check

2. Attendee Information
   ├── Collect participant details
   ├── Validate age requirements
   └── Special requirements

3. Terms & Conditions
   ├── Display terms
   ├── Collect consent
   └── Waiver agreements

4. Payment Processing
   ├── Calculate total (with discounts)
   ├── Stripe checkout
   ├── Payment confirmation
   └── Booking creation

5. Confirmation
   ├── Generate booking reference
   ├── Send email confirmation
   ├── Create calendar event
   └── Display success page
```

## Configuration Management

### Centralized Course Data
All course information is maintained in `/src/constants/courses.ts`:

```typescript
export const COURSES = {
  'emergency-first-aid': {
    id: 'emergency-first-aid',
    title: 'Emergency First Aid at Work',
    duration: '1 day (6 hours)',
    price: 75,
    description: '...',
    outcomes: [...],
    // ... other properties
  },
  // ... 12 more course types
};
```

### Location Configuration
```typescript
export const LOCATIONS = {
  'leeds': { id: 'leeds', name: 'Leeds', address: '...' },
  'sheffield': { id: 'sheffield', name: 'Sheffield', address: '...' },
  'bradford': { id: 'bradford', name: 'Bradford', address: '...' },
  // ... 5 more locations
};
```

## Security Features

### Authentication & Authorization
- JWT-based authentication
- Multi-factor authentication support
- Role-based access control (User, Admin, Trainer)
- Session management with refresh tokens

### Data Protection
- Field-level encryption for PII
- GDPR compliance measures
- Secure payment processing via Stripe
- Input validation with Zod schemas

### Concurrent Booking Prevention
```typescript
// Distributed locking mechanism
async acquireBookingLock(sessionId: string): Promise<Lock> {
  return await this.lockService.acquire(
    `booking:session:${sessionId}`,
    { ttl: 30000 } // 30 second timeout
  );
}
```

## Performance Optimizations

### Frontend Optimizations
- Lazy loading of components
- Code splitting by route
- Image optimization
- Debounced search inputs
- Virtual scrolling for large lists

### Backend Optimizations
- Database query optimization with indexes
- Connection pooling
- Prepared statements
- Caching strategy (Redis-ready)
- Batch operations

### Database Indexes
```sql
-- Performance-critical indexes
CREATE INDEX idx_sessions_date_course ON course_sessions(start_date, course_id);
CREATE INDEX idx_sessions_availability ON course_sessions(status, current_capacity);
CREATE INDEX idx_bookings_user ON bookings(user_id, created_at);
CREATE INDEX idx_bookings_session ON bookings(session_id, status);
```

## Monitoring & Observability

### Health Checks
```typescript
GET /api/health
{
  "status": "healthy",
  "uptime": 123456,
  "database": "connected",
  "services": {
    "email": "operational",
    "payment": "operational",
    "websocket": "operational"
  }
}
```

### Metrics Collection
- Booking conversion rates
- Average booking value
- Session utilization rates
- API response times
- Error rates by endpoint

## Deployment Architecture

### Infrastructure Requirements
- Node.js 18+
- PostgreSQL 14+
- Redis (optional, for caching)
- Email service (SendGrid/Mailgun)
- Stripe account

### Environment Variables
```bash
# Database
DATABASE_URL=postgresql://...

# Authentication
JWT_SECRET=...
JWT_EXPIRES_IN=7d

# Email
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=...
SMTP_PASS=...

# Payment
STRIPE_SECRET_KEY=...
STRIPE_WEBHOOK_SECRET=...

# WebSocket
WS_PORT=3001
```

## Testing Strategy

### Unit Tests
- Component logic testing
- Service layer testing
- Validation testing
- Utility function testing

### Integration Tests
- API endpoint testing
- Database operations
- Email delivery
- Payment processing

### E2E Tests
- Complete booking flow
- Calendar navigation
- Filter functionality
- Payment scenarios

## Future Enhancements

### Planned Features
1. **Mobile App**: Native iOS/Android apps
2. **AI Chatbot**: Course recommendations
3. **Dynamic Pricing**: Demand-based pricing
4. **Waiting Lists**: Automatic enrollment
5. **Corporate Portal**: Bulk booking management

### Scalability Roadmap
1. **Microservices Migration**: Separate booking, payment, and notification services
2. **Global CDN**: Static asset delivery
3. **Multi-region Deployment**: Reduced latency
4. **Event Streaming**: Kafka/RabbitMQ integration
5. **GraphQL API**: Flexible data fetching

## Conclusion

The React Fast Training booking system represents a comprehensive, production-ready solution that balances user experience with technical excellence. The architecture supports future growth while maintaining code quality and performance standards.