# CRITICAL DO NOT DO - Project Restrictions

## ⛔ ABSOLUTELY FORBIDDEN FEATURES

### 1. PWA & Service Workers
- **NO** Progressive Web App support
- **NO** Service Workers of any kind
- **NO** Caching mechanisms for:
  - JavaScript files
  - CSS files
  - Any static assets
  - API responses
  - User data
- **NO** Offline functionality
- **NO** Background sync
- **NO** Push notifications via service workers

### 2. Fake/Placeholder Content
- **NO** Testimonials (fake or real)
- **NO** Fake user data
- **NO** Placeholder statistics (e.g., "hundreds of users")
- **NO** Mock reviews
- **NO** Demo content that implies real usage
- **NO** Sample customer logos without permission
- **NO** Fictional case studies

### 3. Frontend Features
- **NO** Comments sections on any pages
- **NO** Multi-language support (i18n)

### 4. Backend Infrastructure
- **NO** Server-side caching (Redis, Memcached)
- **NO** CDN integration (CloudFlare, AWS CloudFront, etc.)
- **NO** File uploads to cloud services (S3, Google Cloud Storage)
- **NO** Third-party cloud storage services
- **NO** Any caching mechanisms that could serve outdated content

### 5. Business Representation
- **NO** References to multiple instructors or staff - This is a SINGLE instructor business
- **NO** Scalable solutions language - This is a solo trainer, not a scalable business
- **NO** Enterprise features or bank-level security claims
- **NO** Team or staff pages
- **NO** Multiple trainer profiles
- **NO** Language suggesting growth or scaling capabilities
- **ALWAYS** Use "instructor" (singular) not "instructors" (plural)

### 6. Founder Information
- **ONLY** use the first name "Lex" when referring to the founder
- **NO** Last names or surnames
- **ALLOWED**: Years of experience claims (e.g., "20+ years")
- **ALLOWED**: Royal Navy and policing background mentions
- **ALLOWED**: Medical and emergency services background references
- **NO** Specific qualifications or certifications attributed to Lex
- **NO** Made-up biographical information
- **NO** Detailed professional history or career timelines

## 🚫 BOOKING SYSTEM RESTRICTIONS

### 7. Authentication & User Management
- **NO** Facebook login (Google OAuth only)
- **NO** Two-factor authentication
- **NO** Remember me functionality (low priority)
- **NO** Medical information collection
- **NO** Company affiliation fields
- **NO** Training history tracking
- **NO** Certificate history in profiles
- **NO** Notification preferences
- **NO** Payment methods stored on file
- **NO** Profile photo uploads
- **ONLY** Store: name and email (absolute minimum)

### 8. Booking Features
- **NO** Waitlist functionality
- **NO** Corporate booking packages
- **NO** Early bird discounts
- **NO** Last-minute booking surcharges
- **NO** QR code booking confirmations
- **NO** Group payment splitting
- **NO** Corporate invoicing
- **NO** VAT handling (initially)
- **NO** Payment plans
- **NO** Transfer booking to colleagues
- **NO** Upgrade/downgrade (must cancel and rebook)

### 9. Payment System
- **NO** PayPal integration
- **NO** Multiple payment methods (Stripe only)
- **NO** Cash payment options
- **NO** Payment reminders
- **NO** Financial reconciliation tools
- **NO** Discount codes and promotions
- **NO** Loyalty points system

### 10. Communication
- **NO** SMS/Text messaging
- **NO** Mobile push notifications
- **NO** Certificate ready alerts
- **NO** Renewal reminders (initially)
- **NO** Waitlist notifications
- **NO** Personalization tokens
- **NO** Communication scheduling
- **NO** Delivery tracking
- **ONLY** Email communication allowed

### 11. Course Management
- **NO** Multiple locations (use Location A/B placeholders)
- **NO** Capacity over 12 attendees per course
- **NO** Digital signatures (implement later - sign on premises)
- **NO** Drag-and-drop admin features (initially)
- **NO** Course durations longer than 1 day
- **NO** 2-day, 3-day, or multi-day courses
- **ONLY** Allowed durations: "3 Hours", "5 Hours", or "1 Day"
- **NEVER** Mention "2 Days", "3 Days", "multi-day", or "half day"
- **MAXIMUM** duration is 1 Day (which is approximately 5 hours of training)

## 🗄️ DATABASE RESTRICTIONS

### 12. Customer Data Management
- **NO** Leads management table or system - we do not track potential customers
- **NO** Marketing tracking or targeting features
- **NO** Customer segmentation or profiling for marketing
- **NO** Sales pipeline or conversion tracking
- **NO** CRM marketing features
- **ONLY** Store basic customer information (name, email, phone)
- **ONLY** Track actual training history and certificates earned
- **ALLOWED**: Customer training records for certificate management
- **Remember**: Customers either need the course or they don't - it's their choice

### 13. Scheduling & Availability
- **NO** Trainer availability tracking tables
- **NO** Automated availability checking systems
- **NO** Conflict detection for trainer schedules
- **NO** Calendar integration for availability
- **REASON**: The instructor manually adds sessions through the admin scheduling system
- **ALLOWED**: Manual session creation by the instructor only

### 14. Course Booking Features
- **NO** Waiting list functionality or tables
- **NO** "Notify me when available" features
- **NO** Overbooking with waitlist management
- **REASON**: If a course is full, it simply doesn't show as available
- **REASON**: Customers should look for alternative dates themselves
- **ALLOWED**: Only show available courses with open spaces
