# Booking Validation & Overbooking Prevention System Plan

## Overview
This plan addresses critical booking system requirements:
1. Prevent overbooking when courses reach capacity
2. Validate payment amounts match course prices
3. Detect duplicate bookings (same email in same session)
4. Alert administrators of suspicious booking patterns
5. Real-time capacity updates across the system

## Key Requirements

### 1. Overbooking Prevention
- **Real-time capacity checking** before allowing bookings
- **Atomic operations** to prevent race conditions
- **Automatic status update** to "FULL" when capacity reached
- **UI updates** to show "FULL" status to users
- **Waitlist functionality** (future enhancement)

### 2. Payment Validation
- **Amount verification** against course price
- **Currency validation** (GBP only)
- **Discount/promo code validation** if applicable
- **Prevent zero or negative amounts**
- **Match booking total with payment intent**

### 3. Duplicate Booking Detection
- **Same email + same session** = potential duplicate
- **Admin notification** for investigation
- **Soft block** with override capability
- **Track booking patterns** per email

### 4. Database Integrity
- **Constraints** to enforce capacity limits
- **Triggers** for automatic status updates
- **Transaction isolation** for concurrent bookings
- **Audit trail** for all booking attempts

## Technical Implementation

### Database Changes

#### 1. Add Capacity Constraints
```sql
-- Add check constraint to course_schedules
ALTER TABLE course_schedules 
ADD CONSTRAINT check_capacity_not_exceeded 
CHECK (current_capacity <= max_capacity);

-- Add unique constraint for duplicate prevention
CREATE UNIQUE INDEX idx_unique_booking_per_session_email 
ON bookings(course_schedule_id, user_email) 
WHERE status NOT IN ('cancelled', 'refunded');
```

#### 2. Create Booking Validation Function
```sql
CREATE OR REPLACE FUNCTION validate_booking_capacity()
RETURNS TRIGGER AS $$
BEGIN
  -- Check if session is full
  IF (SELECT current_capacity >= max_capacity 
      FROM course_schedules 
      WHERE id = NEW.course_schedule_id) THEN
    RAISE EXCEPTION 'Course session is full';
  END IF;
  
  -- Update current capacity
  UPDATE course_schedules 
  SET current_capacity = current_capacity + NEW.number_of_participants,
      status = CASE 
        WHEN current_capacity + NEW.number_of_participants >= max_capacity 
        THEN 'full' 
        ELSE status 
      END
  WHERE id = NEW.course_schedule_id;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;
```

#### 3. Admin Alerts Table
```sql
CREATE TABLE admin_alerts (
  id SERIAL PRIMARY KEY,
  alert_type VARCHAR(50) NOT NULL,
  severity VARCHAR(20) NOT NULL,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  metadata JSONB,
  status VARCHAR(20) DEFAULT 'unread',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  acknowledged_at TIMESTAMP,
  acknowledged_by INTEGER REFERENCES users(id)
);
```

### Service Layer Changes

#### 1. Enhanced Booking Validation Service
```typescript
class BookingValidationService {
  async validateBooking(bookingData: CreateBookingData): Promise<ValidationResult> {
    const validations = await Promise.all([
      this.checkCapacity(bookingData.courseScheduleId, bookingData.numberOfParticipants),
      this.validatePaymentAmount(bookingData.courseScheduleId, bookingData.totalAmount),
      this.checkDuplicateBooking(bookingData.courseScheduleId, bookingData.email),
      this.validateSessionStatus(bookingData.courseScheduleId)
    ]);
    
    return this.consolidateResults(validations);
  }
  
  async checkCapacity(sessionId: string, participants: number): Promise<boolean> {
    // Use SELECT FOR UPDATE to lock the row
    const session = await db.query(`
      SELECT current_capacity, max_capacity, status 
      FROM course_schedules 
      WHERE id = $1 
      FOR UPDATE
    `, [sessionId]);
    
    const availableSpots = session.max_capacity - session.current_capacity;
    return availableSpots >= participants;
  }
}
```

#### 2. Real-time Capacity Updates
```typescript
class CapacityUpdateService {
  async updateCapacity(sessionId: string): Promise<void> {
    const result = await db.transaction(async (trx) => {
      // Count confirmed bookings
      const bookingCount = await trx.query(`
        SELECT COALESCE(SUM(number_of_participants), 0) as total
        FROM bookings 
        WHERE course_schedule_id = $1 
        AND status IN ('confirmed', 'pending')
      `, [sessionId]);
      
      // Update capacity and status
      await trx.query(`
        UPDATE course_schedules 
        SET current_capacity = $1,
            status = CASE 
              WHEN $1 >= max_capacity THEN 'full'
              WHEN status = 'full' AND $1 < max_capacity THEN 'published'
              ELSE status
            END
        WHERE id = $2
      `, [bookingCount.total, sessionId]);
      
      return bookingCount.total;
    });
    
    // Emit websocket event for real-time updates
    this.websocket.emit('capacity-updated', { sessionId, capacity: result });
  }
}
```

#### 3. Duplicate Detection Service
```typescript
class DuplicateDetectionService {
  async checkForDuplicate(sessionId: string, email: string): Promise<DuplicateCheckResult> {
    // Check for existing booking with same email
    const existing = await db.query(`
      SELECT id, status, created_at 
      FROM bookings 
      WHERE course_schedule_id = $1 
      AND LOWER(contact_details->>'email') = LOWER($2)
      AND status NOT IN ('cancelled', 'refunded')
    `, [sessionId, email]);
    
    if (existing.length > 0) {
      // Create admin alert
      await this.createAdminAlert({
        type: 'duplicate_booking_attempt',
        severity: 'medium',
        title: 'Potential Duplicate Booking',
        description: `Email ${email} attempted to book session ${sessionId} multiple times`,
        metadata: {
          sessionId,
          email,
          existingBookingId: existing[0].id,
          attemptTime: new Date()
        }
      });
      
      return {
        isDuplicate: true,
        existingBookingId: existing[0].id,
        message: 'A booking already exists for this email in this session'
      };
    }
    
    return { isDuplicate: false };
  }
}
```

### API Endpoint Enhancements

#### 1. Booking Creation with Validation
```typescript
@post('/api/bookings')
async createBooking(booking: CreateBookingRequest): Promise<BookingResponse> {
  // Start transaction
  return await db.transaction(async (trx) => {
    // 1. Validate booking
    const validation = await this.validationService.validateBooking(booking);
    if (!validation.isValid) {
      throw new ValidationError(validation.errors);
    }
    
    // 2. Lock session row for update
    const session = await trx.query(
      'SELECT * FROM course_schedules WHERE id = $1 FOR UPDATE',
      [booking.courseScheduleId]
    );
    
    // 3. Double-check capacity
    if (session.current_capacity + booking.numberOfParticipants > session.max_capacity) {
      throw new Error('Course is now full');
    }
    
    // 4. Create booking
    const newBooking = await this.bookingService.create(booking, trx);
    
    // 5. Update capacity
    await this.capacityService.updateCapacity(booking.courseScheduleId, trx);
    
    // 6. Check for alerts
    await this.alertService.checkBookingPatterns(booking);
    
    return newBooking;
  });
}
```

#### 2. Capacity Check Endpoint
```typescript
@get('/api/courses/sessions/{id}/availability')
async checkAvailability(@param.path.string('id') sessionId: string): Promise<AvailabilityResponse> {
  const session = await db.query(`
    SELECT 
      cs.*,
      c.price,
      (cs.max_capacity - cs.current_capacity) as available_spots
    FROM course_schedules cs
    JOIN courses c ON cs.course_id = c.id
    WHERE cs.id = $1
  `, [sessionId]);
  
  return {
    sessionId,
    available: session.available_spots > 0,
    availableSpots: session.available_spots,
    status: session.status,
    price: session.price,
    isFull: session.current_capacity >= session.max_capacity
  };
}
```

### Frontend Updates

#### 1. Real-time Capacity Display
```typescript
// CourseSessionCard.tsx
const CourseSessionCard: React.FC<{ session: CourseSession }> = ({ session }) => {
  const { data: availability, isLoading } = useQuery({
    queryKey: ['availability', session.id],
    queryFn: () => checkSessionAvailability(session.id),
    refetchInterval: 30000 // Refresh every 30 seconds
  });
  
  const isFull = availability?.availableSpots === 0;
  
  return (
    <div className={cn("course-card", isFull && "opacity-75")}>
      <div className="capacity-indicator">
        {isFull ? (
          <span className="text-red-600 font-bold">FULL</span>
        ) : (
          <span className="text-green-600">
            {availability?.availableSpots} spots available
          </span>
        )}
      </div>
      
      <button 
        disabled={isFull}
        className={cn("book-button", isFull && "cursor-not-allowed")}
      >
        {isFull ? "Course Full" : "Book Now"}
      </button>
    </div>
  );
};
```

#### 2. Booking Form Validation
```typescript
// BookingForm.tsx
const handleSubmit = async (data: BookingFormData) => {
  try {
    // Pre-validate availability
    const availability = await checkSessionAvailability(data.sessionId);
    if (!availability.available) {
      toast.error("This course is now full. Please select another session.");
      return;
    }
    
    // Validate payment amount
    if (data.totalAmount !== availability.price * data.numberOfParticipants) {
      toast.error("Payment amount does not match course price");
      return;
    }
    
    // Submit booking
    await createBooking(data);
  } catch (error) {
    if (error.code === 'DUPLICATE_BOOKING') {
      toast.warning("You already have a booking for this session");
    }
  }
};
```

### Admin Dashboard Enhancements

#### 1. Alerts Dashboard
```typescript
// AdminAlertsPage.tsx
const AdminAlertsPage: React.FC = () => {
  const { data: alerts } = useQuery({
    queryKey: ['admin-alerts'],
    queryFn: getAdminAlerts,
    refetchInterval: 60000 // Check every minute
  });
  
  return (
    <div className="alerts-dashboard">
      {alerts?.map(alert => (
        <AlertCard
          key={alert.id}
          alert={alert}
          onAcknowledge={acknowledgeAlert}
          onInvestigate={investigateBooking}
        />
      ))}
    </div>
  );
};
```

#### 2. Capacity Management
```typescript
// SessionCapacityManager.tsx
const SessionCapacityManager: React.FC<{ sessionId: string }> = ({ sessionId }) => {
  const { data: capacity, refetch } = useQuery({
    queryKey: ['session-capacity', sessionId],
    queryFn: () => getSessionCapacity(sessionId),
    refetchInterval: 10000 // Real-time updates
  });
  
  const handleManualUpdate = async () => {
    await recalculateCapacity(sessionId);
    refetch();
  };
  
  return (
    <div className="capacity-manager">
      <ProgressBar 
        value={capacity.current} 
        max={capacity.max}
        showWarning={capacity.current >= capacity.max * 0.8}
      />
      <button onClick={handleManualUpdate}>
        Recalculate Capacity
      </button>
    </div>
  );
};
```

## Implementation Priority

### Phase 1 - Critical (Immediate)
1. Database constraints for capacity
2. Booking validation service
3. Payment amount validation
4. Real-time capacity updates

### Phase 2 - Important (Next Sprint)
1. Duplicate detection system
2. Admin alerts
3. Frontend capacity indicators
4. Websocket updates

### Phase 3 - Enhancement (Future)
1. Waitlist functionality
2. Booking pattern analysis
3. Fraud detection
4. Capacity forecasting

## Performance Optimizations

### 1. Database Optimizations
- Use `SELECT FOR UPDATE` for capacity checks
- Create materialized view for availability
- Implement connection pooling
- Add appropriate indexes

### 2. Caching Strategy
- Cache course prices (TTL: 1 hour)
- Cache session capacity (TTL: 30 seconds)
- Use Redis for distributed locks
- Implement query result caching

### 3. Real-time Updates
- WebSocket for capacity changes
- Server-sent events for availability
- Optimistic UI updates
- Debounced API calls

## Security Considerations

### 1. Race Condition Prevention
- Database-level locking
- Atomic operations
- Transaction isolation
- Idempotency keys

### 2. Validation Layers
- Frontend validation
- API validation
- Database constraints
- Business logic checks

### 3. Audit Trail
- Log all booking attempts
- Track validation failures
- Monitor suspicious patterns
- Alert on anomalies

## Success Metrics

1. **Zero overbookings** - No sessions exceed capacity
2. **Payment accuracy** - 100% match between bookings and payments
3. **Duplicate detection** - Catch 95%+ of duplicate attempts
4. **Performance** - Booking validation < 200ms
5. **User experience** - Clear feedback on availability