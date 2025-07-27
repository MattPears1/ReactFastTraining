# Developer Task-Specific Prompts (200 words each)

## Template Structure
Each developer receives the UNIVERSAL_DEVELOPER_PROMPT.md plus one of these specific assignments.

---

## Developer 1: Authentication System
**Folder**: `1-authentication`

Your assignment is to implement the complete authentication system for React Fast Training. Navigate to the "1-authentication" folder where you'll find 6 markdown files detailing login, registration, password reset, session management, OAuth integration (Google only - NO Facebook), and admin authentication.

Priority focus areas:
1. Minimal data collection (name + email only)
2. Google OAuth integration using LoopBack 4
3. Secure session management without "remember me" features
4. Simple password reset via email
5. Admin panel access control

Remember: NO two-factor authentication, NO profile photos, NO medical information collection, NO stored payment methods. Keep user profiles absolutely minimal per CRITICAL_DO_NOT_DO.md restrictions.

Start with `1-user-registration.md` and work numerically through all files. The authentication system is foundational - other developers depend on your completion for testing their features. Ensure all endpoints follow LoopBack 4 REST conventions and integrate with the existing PostgreSQL database schema.

Test thoroughly using the frontend forms already created in `/src/components/auth/`. Your implementation should work seamlessly with the existing React components.

---

## Developer 2: Course Management System
**Folder**: `2-course-management`

Your assignment covers the complete course management system. Navigate to "2-course-management" folder containing specifications for course creation, scheduling, availability tracking, location management, instructor assignment, and course templates.

Key requirements:
1. Maximum 12 attendees per course (hard limit)
2. Simple Location A/B placeholder system (no complex venue management)
3. Course types: EFAW, FAW, FAW Requalification, Paediatric, etc.
4. Real-time availability checking
5. Integration with existing course models in LoopBack 4

Critical constraints from CRITICAL_DO_NOT_DO.md:
- NO waitlist functionality
- NO capacity over 12 attendees
- NO multiple instructor support (single instructor business)
- NO complex location management

Use the existing Course, CourseSession, and Location models in `/backend-loopback4/src/models/`. The frontend course display components are ready in `/src/pages/courses/` - ensure your API endpoints match their expectations.

Other developers need functioning course management for booking system integration. Prioritize core CRUD operations and availability checking first.

---

## Developer 3: Booking System
**Folder**: `3-booking-system`

Your assignment implements the complete booking system from course selection through payment confirmation. Navigate to "3-booking-system" folder for detailed specifications on booking flow, payment integration, confirmation emails, and booking management.

Core responsibilities:
1. Stripe-only payment integration (NO PayPal)
2. Simple booking flow without upgrades/downgrades
3. Email confirmations via SendGrid/Mailgun
4. Group bookings up to 12 people
5. No stored payment methods

Restrictions per CRITICAL_DO_NOT_DO.md:
- NO waitlists
- NO payment plans
- NO booking transfers
- NO corporate invoicing (initially)
- NO VAT handling (initially)
- Cancel and rebook only (no modifications)

Work with existing Booking model in `/backend-loopback4/src/models/booking.model.ts`. The frontend booking form is partially complete at `/src/components/booking/BookingForm.tsx`. Ensure smooth integration with the course management system (Developer 2's work).

Payment security is critical - follow PCI compliance guidelines and never store card details directly.

---

## Developer 4: Certificate System
**Folder**: `4-certificate-system`

Your assignment covers the certificate generation and management system. Navigate to "4-certificate-system" folder containing specifications for certificate generation, PDF creation, download portal, expiry tracking, and basic renewal notifications.

Key deliverables:
1. PDF certificate generation with unique IDs
2. Secure download portal (authenticated)
3. Certificate validity tracking (typically 3 years)
4. Basic expiry notifications (email only)
5. QR code for verification (optional enhancement)

Important constraints:
- NO digital signatures initially (physical signing on premises)
- NO certificate history in user profiles
- NO SMS notifications
- Email delivery only

Integrate with existing Certificate model at `/backend-loopback4/src/models/certificate.model.ts`. Frontend certificate display components need to be created. Use a reliable PDF generation library compatible with Node.js.

Certificates are legally required documentation - ensure accuracy, security, and reliable generation. Work closely with booking system (Developer 3) for post-course certificate triggers.

---

## Developer 5: Admin Dashboard
**Folder**: `5-admin-dashboard`

Your assignment is building the admin dashboard for course management, booking oversight, and basic reporting. Navigate to "5-admin-dashboard" folder for specifications on dashboard layout, course scheduling interface, booking management, and financial reporting.

Essential features:
1. Course schedule calendar view
2. Booking list with search/filter
3. Simple financial reports (no complex reconciliation)
4. Course attendance tracking
5. Basic metrics dashboard

Constraints from CRITICAL_DO_NOT_DO.md:
- NO drag-and-drop features initially
- NO complex financial tools
- Single admin user (Lex only)
- Keep it simple and functional

Build upon existing LoopBack 4 controllers. Create new admin-specific endpoints with proper authentication. Frontend admin routes should be under `/admin/*` with route protection.

This dashboard is Lex's primary interface for managing the business - prioritize usability and essential features over complex functionality. Mobile-responsive design is important as Lex may access from various devices.