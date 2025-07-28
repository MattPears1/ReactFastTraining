# Course System Architecture Plan - React Fast Training

## Course Catalog Structure

### Course Categories
Based on typical first aid training offerings:

1. **Workplace First Aid**
   - Emergency First Aid at Work (1 day)
   - First Aid at Work (3 days)
   - First Aid at Work Requalification (2 days)
   - Annual Refresher Training

2. **Specialist First Aid**
   - Paediatric First Aid (2 days)
   - Outdoor First Aid
   - Sports First Aid
   - Mental Health First Aid

3. **Medical Skills**
   - CPR & AED Training
   - Basic Life Support
   - Anaphylaxis & Auto-injector Training
   - Oxygen Therapy

4. **Health & Safety**
   - Risk Assessment
   - Fire Safety Awareness
   - Manual Handling
   - Health & Safety in the Workplace

### Course Data Model

```typescript
interface Course {
  id: string;
  title: string;
  slug: string; // URL-friendly version
  category: CourseCategory;
  duration: {
    days: number;
    hours: number;
  };
  price: {
    perPerson: number;
    groupRates: GroupRate[];
    onsiteMinimum: number; // Minimum participants for onsite
  };
  certification: {
    awarding Body: string; // e.g., "First Aid Awards", "Ofqual"
    validityPeriod: number; // months
    level: string; // e.g., "Level 3"
  };
  description: {
    short: string; // For cards
    full: string; // For detail page
  };
  learningOutcomes: string[];
  whoShouldAttend: string[];
  prerequisites: string[];
  whatToExpect: string[];
  includes: string[]; // e.g., "Course materials", "Certificate"
  maxParticipants: number;
  locations: Location[]; // Where available
  upcomingDates: CourseDate[];
  featured: boolean;
  popular: boolean;
  tags: string[];
}

interface GroupRate {
  minParticipants: number;
  maxParticipants: number;
  pricePerPerson: number;
}

interface CourseDate {
  id: string;
  courseId: string;
  startDate: Date;
  endDate: Date;
  location: Location;
  availableSeats: number;
  totalSeats: number;
  status: 'available' | 'limited' | 'full' | 'cancelled';
  instructor?: Instructor;
}
```

## Course Pages Structure

### 1. Course Catalog Page (`/courses`)
- Hero section: "Professional First Aid Training Across Yorkshire"
- Filter sidebar:
  - By category
  - By duration
  - By location
  - By price range
  - By certification type
- Course grid/list view toggle
- Featured courses section
- Upcoming courses calendar widget

### 2. Individual Course Page (`/courses/[slug]`)
- Course hero with key info
- Sticky booking widget
- Tab sections:
  - Overview
  - Learning outcomes
  - Who should attend
  - What's included
  - Certification details
  - Upcoming dates
- Instructor profiles
- Related courses
- FAQs specific to course

### 3. Booking Flow
```
1. Select Course → 2. Choose Date/Location → 3. Participant Details → 4. Payment → 5. Confirmation
```

## Booking System Features

### Core Functionality
- **Individual Bookings**: Single person booking for scheduled courses
- **Group Bookings**: Multiple participants with bulk discount
- **Onsite Training Requests**: Custom date/location requests
- **Corporate Accounts**: Recurring bookings, invoicing, employee management

### Booking Process
1. **Course Selection**
   - View availability calendar
   - See location options
   - Check group rates

2. **Participant Information**
   - Name, email, phone
   - Dietary requirements
   - Accessibility needs
   - Previous training history

3. **Payment Options**
   - Online payment (Stripe)
   - Invoice for corporate
   - Deposit option for groups
   - Cancellation insurance

4. **Post-Booking**
   - Confirmation email
   - Calendar invite
   - Pre-course information pack
   - Reminder emails

### Admin Features
- Course management dashboard
- Booking management
- Attendee tracking
- Certificate generation
- Financial reporting
- Instructor assignment

## Course Content Management

### Dynamic Content Areas
- Course descriptions
- Learning outcomes
- Prerequisites
- Upcoming dates
- Pricing updates
- Instructor assignments

### Static Content
- Certification information
- Accreditation details
- General course structure
- Legal requirements

## Integration Points

### External Systems
- **Payment Gateway**: Stripe for online payments
- **Email Service**: SendGrid for automated emails
- **Calendar**: Google Calendar integration
- **CRM**: Potential HubSpot/Salesforce integration
- **Accounting**: Xero/QuickBooks export

### Internal Systems
- User accounts
- Certificate management
- Reporting dashboard
- Email automation
- Inventory tracking (materials)

## SEO & Marketing

### Course Landing Pages
- Optimized URLs: `/courses/emergency-first-aid-at-work-yorkshire`
- Local keywords: "first aid training Leeds", "CPR course Sheffield"
- Schema markup for courses
- Rich snippets for Google

### Content Strategy
- Course-specific blog posts
- Success stories
- Industry-specific guides
- Seasonal campaigns

## Mobile Considerations

### Key Mobile Features
- Quick course search
- Easy date selection
- Simplified booking form
- Mobile-friendly payment
- Digital certificates

### Offline Capability
- Course catalog browsing
- Saved courses
- Contact information
- Basic company info

## Performance Targets

### Page Load Times
- Course catalog: < 2s
- Individual course: < 1.5s
- Booking flow: < 1s per step

### Conversion Optimization
- Clear CTAs
- Trust indicators
- Social proof
- Urgency indicators ("Only 3 seats left")

## Future Enhancements

### Phase 1 (Launch)
- Basic course catalog
- Simple booking system
- Email confirmations
- Basic reporting

### Phase 2 (3-6 months)
- Advanced filtering
- Wishlist/save courses
- Reviews and ratings
- Automated reminders

### Phase 3 (6-12 months)
- Mobile app
- Virtual training options
- Advanced analytics
- AI-powered recommendations

## Technical Implementation Notes

### Frontend Components Needed
- CourseCard
- CourseFilter
- CourseCalendar
- BookingWizard
- PriceCalculator
- SeatAvailability
- InstructorProfile

### API Endpoints
- GET /api/courses
- GET /api/courses/:slug
- GET /api/courses/:id/availability
- POST /api/bookings
- GET /api/bookings/:id
- POST /api/bookings/:id/payment

### Database Tables
- courses
- course_dates
- bookings
- booking_participants
- instructors
- locations
- certificates
- payments

## Questions for Client

1. **Course List**: Full list of courses offered
2. **Pricing Structure**: Specific pricing for each course
3. **Locations**: Where do you offer training? Just onsite or specific venues?
4. **Instructors**: How many instructors? Need profiles?
5. **Existing Bookings**: Any current system to migrate from?
6. **Payment Terms**: Deposit requirements? Cancellation policy?
7. **Group Sizes**: Min/max for each course type?
8. **Custom Courses**: Do you offer bespoke training packages?
9. **Certification**: Physical or digital certificates?
10. **Compliance**: Any specific regulatory requirements?