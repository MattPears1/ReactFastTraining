# Email Configuration & Routing

## Available Email Addresses

The following email addresses are set up and active for React Fast Training:

### 1. info@reactfasttraining.co.uk
**Purpose**: General Information & Support
- **Use For**:
  - General inquiries about the business
  - Help and troubleshooting requests
  - Website technical issues
  - Customer support questions
  - Non-course specific queries
  - Default contact email for forms

### 2. bookings@reactfasttraining.co.uk
**Purpose**: Booking Queries & Course Administration
- **Use For**:
  - Course booking inquiries
  - Booking modifications/cancellations
  - Payment questions
  - Course scheduling requests
  - Venue-related questions
  - Group booking inquiries

### 3. lex@reactfasttraining.co.uk
**Purpose**: Course Content & Instructor Communication
- **Use For**:
  - Questions about course content
  - Direct communication with the instructor
  - Course methodology inquiries
  - Training-specific questions
  - Professional instructor matters
  - Course development feedback

## Email Routing Guidelines

### Contact Forms
- **General Contact Form**: Routes to `info@reactfasttraining.co.uk`
- **Booking Inquiry Form**: Routes to `bookings@reactfasttraining.co.uk`
- **Course Content Questions**: Route to `lex@reactfasttraining.co.uk`

### Automatic Email Responses
- **Booking Confirmations**: Send from `bookings@reactfasttraining.co.uk`
- **General Notifications**: Send from `info@reactfasttraining.co.uk`
- **Course Reminders**: Send from `lex@reactfasttraining.co.uk`

### Priority Handling
1. **High Priority**: `lex@reactfasttraining.co.uk` - Direct instructor communication
2. **Medium Priority**: `bookings@reactfasttraining.co.uk` - Revenue-related inquiries
3. **Standard Priority**: `info@reactfasttraining.co.uk` - General support

## Implementation Status

### ✅ Configured
- Email addresses are set up and active
- Email routing documentation created

### 🔄 To Update
- Contact forms to use appropriate email addresses
- Footer/header contact information
- Backend email service configuration
- Automated email templates

## Files Requiring Updates

1. **Contact Forms**:
   - `src/components/ui/ContactForm.tsx`
   - `src/components/booking/BookingInquiryForm.tsx`
   - `src/pages/ContactPage.tsx`

2. **Layout Components**:
   - `src/components/layout/Footer.tsx`
   - `src/components/layout/Header.tsx`

3. **Backend Configuration**:
   - `backend-loopback4/src/services/email.service.ts`
   - Email templates and routing logic

4. **Environment Configuration**:
   - `.env.example` files
   - Email service configuration

## Contact Information Display

### Primary Contact (Footer/Header)
Use: `info@reactfasttraining.co.uk`

### Booking-Specific Pages
Use: `bookings@reactfasttraining.co.uk`

### Course Content Pages
Include: `lex@reactfasttraining.co.uk` for content questions

## Email Signatures

### Standard Signature
```
Best regards,
React Fast Training Team
info@reactfasttraining.co.uk
07447 485644
www.reactfasttraining.co.uk
```

### Booking Team Signature
```
Kind regards,
Booking Team
React Fast Training
bookings@reactfasttraining.co.uk
07447 485644
```

### Instructor Signature
```
Best regards,
Lex
Lead Instructor
React Fast Training
lex@reactfasttraining.co.uk
```

---

**Last Updated**: July 27, 2025
**Status**: Email addresses configured, implementation in progress