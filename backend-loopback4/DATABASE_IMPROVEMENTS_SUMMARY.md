# Database Improvements Summary

## Overview
This document summarizes the database improvements made to the React Fast Training project on 2025-01-28.

## New Tables Added

### 1. **corporate_clients**
- Manages B2B clients with special billing and discount arrangements
- Tracks VAT numbers, purchase orders, credit terms
- Links to primary contact user
- Supports corporate discount percentages

### 2. **renewal_reminders**
- Automated certificate renewal tracking
- Creates reminders at 30, 60, and 90 days before expiry
- Tracks email engagement (sent, opened, clicked)
- Links renewals to new bookings

### 3. **course_categories**
- Organizes courses into logical groups
- Pre-populated with: Workplace, Paediatric, Requalification, Specialist
- Includes icons and colors for UI display
- Improves course browsing experience

### 4. **instructor_availability**
- Tracks recurring weekly availability
- Supports specific date overrides
- Handles blocked dates for holidays
- Enables better scheduling automation

### 5. **instructor_qualifications**
- Stores instructor certifications
- Tracks expiry dates for compliance
- Verification workflow support
- Document storage references

### 6. **instructor_specializations**
- Maps instructors to courses they can teach
- Tracks experience and performance metrics
- Supports primary/secondary specializations

### 7. **blackout_dates**
- System-wide or instructor-specific holidays
- Prevents scheduling on blocked dates
- Improves availability accuracy

## Enhanced Existing Tables

### **bookings** table additions:
- `corporate_client_id` - Links to corporate clients
- `purchase_order_number` - For B2B transactions
- `invoice_number` - Financial tracking
- `invoice_sent_at` - Invoice management
- `invoice_due_date` - Payment terms tracking

### **courses** table additions:
- `category_id` - Links to course categories
- `min_capacity` - Minimum attendees required
- `early_bird_discount_days` - Days before course for discount
- `early_bird_discount_percentage` - Early booking incentive
- `group_discount_threshold` - Minimum for group discount
- `group_discount_percentage` - Bulk booking discount

### **venues** table additions:
- Contact information (name, phone, email)
- `directions` - How to find the venue
- `public_transport_info` - Accessibility information
- `accessibility_info` - Disability access details
- Facilities (catering, wifi, projector, whiteboard, AC)
- GPS coordinates (lat, lng)
- `google_maps_url` - Direct map link

### **users** table additions:
- Emergency contact details (name, phone, relationship)
- `date_of_birth` - Age verification
- `dietary_requirements` - Catering needs
- `medical_conditions` - Safety information (encrypted)

## Performance Optimizations

### New Indexes:
1. **Composite indexes** for common query patterns:
   - `idx_bookings_user_status` - User's bookings by status
   - `idx_certificates_user_expiry` - User's certificates by expiry
   - `idx_course_schedules_date_status` - Schedule queries

2. **Partial indexes** for active records:
   - `idx_users_active_customers` - Active customers only
   - `idx_courses_active` - Active courses only

3. **Specialized indexes**:
   - Corporate bookings
   - Certificate expiry dates
   - Renewal reminder dates

## Data Integrity Improvements

### Check Constraints:
- Course capacity validation (max >= min)
- Positive payment amounts
- Valid time ranges for schedules
- Credit terms limits (0-90 days)
- Discount percentage limits (0-100%)

### Unique Constraints:
- Stripe customer IDs
- Certificate-reminder type combinations
- Instructor-course specializations

## Automated Processes

### Triggers:
1. **Renewal Reminder Creation**
   - Automatically creates 4 reminders when certificate issued
   - 90, 60, 30 days before expiry + expiry date

2. **Updated Timestamp Management**
   - All new tables have automatic updated_at triggers

### Helper Functions:
1. **is_instructor_available()**
   - Checks instructor availability for scheduling
   - Considers recurring availability, specific dates, and blackouts

## Migration Files Created

1. `008_corporate_and_renewals.sql` - Main improvements migration
2. `009_instructor_availability.sql` - Instructor scheduling enhancements

## Implementation Notes

### To apply these migrations:
```bash
# From the backend-loopback4 directory
npx knex migrate:latest

# Or manually apply SQL files
psql $DATABASE_URL < src/db/migrations/008_corporate_and_renewals.sql
psql $DATABASE_URL < src/db/migrations/009_instructor_availability.sql
```

### Benefits:
1. **B2B Support** - Full corporate client management
2. **Automated Reminders** - Reduces manual follow-up work
3. **Better Scheduling** - Instructor availability tracking
4. **Improved Performance** - Strategic indexes for common queries
5. **Data Quality** - Constraints ensure data integrity
6. **Enhanced UX** - Course categories and venue details

### Future Considerations:
1. Consider table partitioning for bookings/payments as data grows
2. Add full-text search indexes for user/course searching
3. Implement read replicas for reporting queries
4. Consider archiving old booking data after 3-5 years