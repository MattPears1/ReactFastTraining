# Booking System Component Library

**Last updated: 2025-07-27**

## Overview

The React Fast Training booking system features a comprehensive library of reusable components designed for consistency, performance, and accessibility. All components are built with TypeScript and Tailwind CSS.

## Core Components

### CourseCard
**Location:** `/src/components/booking/shared/CourseCard.tsx`

Displays course information in a card format with availability status.

```tsx
interface CourseCardProps {
  course: Course;
  session: CourseSession;
  onSelect: () => void;
  isSelected?: boolean;
}

// Usage
<CourseCard
  course={courseData}
  session={sessionData}
  onSelect={() => handleCourseSelect(session.id)}
  isSelected={selectedSessionId === session.id}
/>
```

**Features:**
- Visual availability indicator
- Responsive design
- Hover states
- Accessibility compliant

### PricingSummary
**Location:** `/src/components/booking/shared/PricingSummary.tsx`

Calculates and displays pricing information with automatic group discounts.

```tsx
interface PricingSummaryProps {
  basePrice: number;
  participantCount: number;
  showBreakdown?: boolean;
}

// Usage
<PricingSummary
  basePrice={75}
  participantCount={6}
  showBreakdown={true}
/>
```

**Features:**
- Automatic 10% discount for 5+ participants
- Price breakdown display
- Currency formatting
- Animated transitions

### BookingSteps
**Location:** `/src/components/booking/shared/BookingSteps.tsx`

Visual progress indicator for multi-step booking process.

```tsx
interface BookingStepsProps {
  currentStep: number;
  totalSteps: number;
  steps: StepInfo[];
}

// Usage
<BookingSteps
  currentStep={2}
  totalSteps={4}
  steps={[
    { label: 'Course Selection', completed: true },
    { label: 'Attendee Information', active: true },
    { label: 'Review & Terms', completed: false },
    { label: 'Payment', completed: false }
  ]}
/>
```

### CalendarView
**Location:** `/src/components/booking/CalendarView.tsx`

Interactive monthly calendar displaying course availability.

```tsx
interface CalendarViewProps {
  sessions: CourseSession[];
  selectedDate?: Date;
  onDateSelect: (date: Date) => void;
  onMonthChange: (direction: 'prev' | 'next') => void;
}

// Usage
<CalendarView
  sessions={availableSessions}
  selectedDate={selectedDate}
  onDateSelect={handleDateSelect}
  onMonthChange={handleMonthChange}
/>
```

**Features:**
- Monthly navigation
- Course dots on available dates
- Today indicator
- Mobile responsive
- Keyboard navigation

### CourseAvailabilityEnhanced
**Location:** `/src/components/booking/CourseAvailabilityEnhanced.tsx`

Main booking interface with dual view modes and filtering.

```tsx
interface CourseAvailabilityProps {
  onSessionSelect: (session: CourseSession) => void;
  initialViewMode?: 'calendar' | 'list';
}

// Usage
<CourseAvailabilityEnhanced
  onSessionSelect={handleSessionSelect}
  initialViewMode="calendar"
/>
```

**Features:**
- Calendar/List view toggle
- Advanced filtering
- Real-time availability
- Search functionality
- Mobile optimized

## Form Components

### BookingFormEnhanced
**Location:** `/src/components/booking/BookingFormEnhanced.tsx`

Comprehensive booking form with Zod validation.

```tsx
interface BookingFormProps {
  session: CourseSession;
  onSubmit: (data: BookingFormData) => void;
  onCancel: () => void;
}

// Validation Schema
const bookingSchema = z.object({
  contactDetails: z.object({
    firstName: z.string().min(2),
    lastName: z.string().min(2),
    email: z.string().email(),
    phone: z.string().regex(/^07\d{9}$/),
    company: z.string().optional()
  }),
  participants: z.array(participantSchema).min(1).max(12),
  specialRequirements: z.string().optional(),
  termsAccepted: z.boolean().refine(val => val === true)
});
```

### SpecialRequirementsForm
**Location:** `/src/components/booking/SpecialRequirementsForm.tsx`

Accessible form for capturing special requirements and dietary needs.

```tsx
interface SpecialRequirementsProps {
  value: SpecialRequirements;
  onChange: (requirements: SpecialRequirements) => void;
}

// Usage
<SpecialRequirementsForm
  value={requirements}
  onChange={setRequirements}
/>
```

## Multi-Step Wizard Components

### CourseSelectionStep
**Location:** `/src/components/booking/steps/CourseSelectionStep.tsx`

First step of booking wizard for course selection.

### AttendeeInformationStep
**Location:** `/src/components/booking/steps/AttendeeInformationStep.tsx`

Collects participant information with dynamic form fields.

### ReviewTermsStep
**Location:** `/src/components/booking/steps/ReviewTermsStep.tsx`

Displays terms and conditions with consent collection.

### PaymentStep
**Location:** `/src/components/booking/steps/PaymentStep.tsx`

Stripe payment integration with enhanced security.

## Utility Components

### BookingSkeleton
**Location:** `/src/components/booking/shared/BookingSkeleton.tsx`

Loading states for async operations.

```tsx
// Usage
{isLoading ? (
  <BookingSkeleton type="calendar" />
) : (
  <CalendarView {...props} />
)}
```

**Types:**
- `calendar` - Calendar view skeleton
- `list` - List view skeleton
- `form` - Form skeleton
- `card` - Card skeleton

### CapacityIndicator
**Location:** `/src/components/booking/CapacityIndicator.tsx`

Visual representation of course capacity.

```tsx
interface CapacityIndicatorProps {
  current: number;
  max: number;
  showText?: boolean;
}

// Usage
<CapacityIndicator
  current={8}
  max={12}
  showText={true}
/>
```

### MobileFilterSheet
**Location:** `/src/components/booking/MobileFilterSheet.tsx`

Mobile-optimized filter interface using bottom sheet pattern.

```tsx
interface MobileFilterSheetProps {
  isOpen: boolean;
  onClose: () => void;
  filters: FilterOptions;
  onApply: (filters: FilterOptions) => void;
}
```

## Enhancement Components

### BookingConfirmation
**Location:** `/src/components/booking/BookingConfirmation.tsx`

Success page with booking details and next steps.

```tsx
interface BookingConfirmationProps {
  booking: BookingDetails;
  onDownloadConfirmation: () => void;
  onAddToCalendar: () => void;
}
```

### BookingTestimonial
**Location:** `/src/components/booking/shared/BookingTestimonial.tsx`

Displays customer testimonials during booking process.

### BookingFAQ
**Location:** `/src/components/booking/shared/BookingFAQ.tsx`

Frequently asked questions component with accordion.

## Styling Guidelines

### Color Scheme
```scss
// Primary - Trust Blue
$primary-500: rgb(14, 165, 233);
$primary-600: rgb(2, 132, 199);
$primary-700: rgb(3, 105, 161);

// Secondary - Healing Green
$secondary-500: rgb(16, 185, 129);

// Accent - Energy Orange
$accent-500: rgb(249, 115, 22);

// Status Colors
$success: rgb(34, 197, 94);
$warning: rgb(245, 158, 11);
$error: rgb(239, 68, 68);
```

### Component Classes
```tsx
// Base button styles
const buttonClasses = "px-4 py-2 rounded-lg font-medium transition-colors";

// Primary button
const primaryButton = `${buttonClasses} bg-primary-600 text-white hover:bg-primary-700`;

// Secondary button
const secondaryButton = `${buttonClasses} bg-gray-200 text-gray-800 hover:bg-gray-300`;

// Disabled state
const disabledButton = `${buttonClasses} bg-gray-100 text-gray-400 cursor-not-allowed`;
```

## Accessibility Standards

### ARIA Labels
All interactive components include appropriate ARIA labels:

```tsx
<button
  aria-label="Select Emergency First Aid course on March 15"
  aria-pressed={isSelected}
  role="button"
>
  Select Course
</button>
```

### Keyboard Navigation
- Tab navigation through all interactive elements
- Enter/Space to activate buttons
- Arrow keys for calendar navigation
- Escape to close modals

### Focus Management
```tsx
// Focus trap in modals
import { FocusTrap } from '@headlessui/react';

<FocusTrap active={isOpen}>
  <Modal>
    {/* Modal content */}
  </Modal>
</FocusTrap>
```

## Performance Considerations

### Code Splitting
```tsx
// Lazy load heavy components
const BookingWizard = lazy(() => import('./BookingWizard'));

// Usage with Suspense
<Suspense fallback={<BookingSkeleton type="form" />}>
  <BookingWizard />
</Suspense>
```

### Memoization
```tsx
// Memoize expensive calculations
const discountedPrice = useMemo(() => {
  return calculateGroupDiscount(basePrice, participantCount);
}, [basePrice, participantCount]);

// Memoize components
const MemoizedCourseCard = memo(CourseCard);
```

### Virtual Scrolling
For long lists, implement virtual scrolling:

```tsx
import { VirtualList } from '@tanstack/react-virtual';

// Usage for large course lists
<VirtualList
  items={courses}
  renderItem={({ item }) => <CourseCard course={item} />}
/>
```

## Testing Guidelines

### Component Testing
```tsx
import { render, screen, fireEvent } from '@testing-library/react';

describe('CourseCard', () => {
  it('displays course information correctly', () => {
    render(<CourseCard {...props} />);
    expect(screen.getByText('Emergency First Aid')).toBeInTheDocument();
  });

  it('handles selection correctly', () => {
    const onSelect = jest.fn();
    render(<CourseCard {...props} onSelect={onSelect} />);
    fireEvent.click(screen.getByRole('button'));
    expect(onSelect).toHaveBeenCalled();
  });
});
```

### Accessibility Testing
```tsx
import { axe } from '@axe-core/react';

it('has no accessibility violations', async () => {
  const { container } = render(<CourseCard {...props} />);
  const results = await axe(container);
  expect(results).toHaveNoViolations();
});
```

## Usage Examples

### Complete Booking Flow
```tsx
import { CourseAvailabilityEnhanced } from '@/components/booking';
import { BookingWizard } from '@/components/booking';

function BookingPage() {
  const [selectedSession, setSelectedSession] = useState(null);
  const [showWizard, setShowWizard] = useState(false);

  const handleSessionSelect = (session) => {
    setSelectedSession(session);
    setShowWizard(true);
  };

  return (
    <>
      {!showWizard ? (
        <CourseAvailabilityEnhanced
          onSessionSelect={handleSessionSelect}
        />
      ) : (
        <BookingWizard
          session={selectedSession}
          onComplete={handleBookingComplete}
          onCancel={() => setShowWizard(false)}
        />
      )}
    </>
  );
}
```

## Best Practices

1. **Always use TypeScript** for type safety
2. **Follow accessibility guidelines** for all components
3. **Implement proper error boundaries** for error handling
4. **Use semantic HTML** elements
5. **Test components thoroughly** including edge cases
6. **Document props** with JSDoc comments
7. **Optimize for mobile first**
8. **Use consistent naming conventions**
9. **Implement proper loading states**
10. **Handle errors gracefully** with user-friendly messages

## Contributing

When adding new components:
1. Place in appropriate directory
2. Include TypeScript interfaces
3. Add comprehensive tests
4. Document in this guide
5. Ensure accessibility compliance
6. Add usage examples
7. Update component index