# Booking System - Allowed Features TODO

**Last updated: 2025-07-27**

## ✅ Phase 1: Core Authentication & Database
- [x] Set up Heroku PostgreSQL database (Essentials-0 tier)
- [x] Create user table with bcrypt password hashing
- [x] Implement account signup with email verification
- [x] Google OAuth login integration
- [x] Session management (JWT with refresh tokens)
- [x] Account lockout after 5 failed attempts
- [x] Password reset functionality
- [x] Minimal user profiles (name, email only)

## ✅ Phase 2: Course Management
- [x] Real-time availability calendar
- [x] Filter by date and course type
- [x] Yorkshire locations (Leeds, Sheffield, Bradford, etc.)
- [x] Course capacity indicators (max 12 attendees)
- [x] Course creation and editing (admin)
- [x] Attendance tracking

## ✅ Phase 3: Booking Process
- [x] Multi-step booking wizard
- [x] Session selection with visual calendar
- [x] Multiple attendee booking (10% discount for 5+ attendees)
- [x] Special requirements/accessibility needs field
- [x] Terms acceptance and waivers
- [x] Email booking confirmations
- [x] Add to calendar functionality (.ics files)

## ✅ Phase 4: Payment Integration
- [x] Stripe integration (embedded checkout)
- [x] Automated invoice generation
- [x] Refund processing (admin dashboard)
- [ ] Referral rewards system (planned)

## ✅ Phase 5: Client Portal
- [x] Upcoming courses dashboard
- [x] Booking history
- [x] Cancel booking with full refund
- [x] Reschedule options (with rules)
- [x] Download booking confirmations
- [x] Edit booking (add more attendees)
- [x] Change attendee details
- [x] Pre-course material access
- [x] Post-course certificate downloads
- [x] Course feedback submission

## ✅ Phase 6: Admin Dashboard
- [x] Full client database view
- [x] Edit any client details
- [x] View client history
- [x] Add internal notes
- [x] Export client data
- [x] Communication history
- [x] Course schedule management
- [x] Manual booking creation
- [x] Process refunds
- [x] Drag-drop calendar rescheduling
- [x] Certificate generation
- [x] Mark course completion

## ✅ Phase 7: Communication System
- [x] Booking confirmation emails
- [x] Course change notifications
- [x] Payment confirmations
- [x] Course material update emails
- [x] Bulk email to course attendees
- [x] Email templates library
- [x] Welcome verification emails

## 📝 Notes
- Email only communication (no SMS)
- Single instructor business
- Maximum 12 attendees per course
- Stripe payment only
- Simple refund policy (full refund)
- No complex features initially