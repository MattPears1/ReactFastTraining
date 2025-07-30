# Course Management System

## Overview

Complete course management system allowing administrators to create, edit, delete, and manage all aspects of first aid training courses including pricing, discounts, and course details.

## Core Features

### 1. Course CRUD Operations
- Create new courses
- Edit existing courses
- Archive/delete courses
- Duplicate courses
- Bulk operations

### 2. Course Attributes Management
- Course name and description
- Duration and scheduling
- Pricing and discounts
- Capacity limits
- Certification details
- Prerequisites

### 3. Discount System
- Percentage-based discounts
- Fixed amount discounts
- Time-limited offers
- Course-specific discounts
- Bulk booking discounts
- Promo codes

## Course Data Model

### Course Entity
```typescript
interface Course {
  id: number;
  name: string;
  description: string;
  courseType: 'EFAW' | 'FAW' | 'Paediatric';
  durationHours: number;
  price: number;
  maxCapacity: number;
  minCapacity: number;
  certificationValidityYears: number;
  prerequisites: string[];
  learningOutcomes: string[];
  includedMaterials: string[];
  isActive: boolean;
  tags: string[];
  images: CourseImage[];
  createdAt: Date;
  updatedAt: Date;
}
```

### Discount Model
```typescript
interface Discount {
  id: number;
  code: string;
  description: string;
  discountType: 'percentage' | 'fixed';
  discountValue: number;
  minPurchaseAmount?: number;
  maxDiscountAmount?: number;
  validFrom: Date;
  validUntil: Date;
  usageLimit?: number;
  timesUsed: number;
  courseTypeRestriction?: string;
  specificCourseIds?: number[];
  customerRestrictions?: {
    newCustomersOnly?: boolean;
    existingCustomersOnly?: boolean;
    specificCustomerIds?: number[];
  };
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}
```

## User Interface Design

### 1. Course List View
```typescript
interface CourseListView {
  // Filters
  filters: {
    courseType: string[];
    status: 'active' | 'inactive' | 'all';
    priceRange: { min: number; max: number };
    search: string;
  };
  
  // Sorting
  sortBy: 'name' | 'price' | 'type' | 'updatedAt';
  sortOrder: 'asc' | 'desc';
  
  // Pagination
  page: number;
  pageSize: number;
  totalItems: number;
  
  // Bulk actions
  selectedCourses: number[];
  bulkActions: ['activate', 'deactivate', 'delete', 'export'];
}
```

### 2. Course Form
```typescript
interface CourseFormData {
  // Basic Information
  name: string;
  courseType: string;
  description: string;
  
  // Duration & Schedule
  durationHours: number;
  durationMinutes: number;
  breakDuration: number;
  
  // Pricing
  basePrice: number;
  earlyBirdDiscount?: {
    amount: number;
    daysBeforeCourse: number;
  };
  groupDiscount?: {
    minParticipants: number;
    discountPercentage: number;
  };
  
  // Capacity
  minCapacity: number;
  maxCapacity: number;
  waitlistEnabled: boolean;
  
  // Content
  learningOutcomes: string[];
  prerequisites: string[];
  includedMaterials: string[];
  additionalInfo: string;
  
  // Certification
  certificationValidityYears: number;
  certificateTemplate: string;
  
  // Media
  featuredImage: File | string;
  galleryImages: (File | string)[];
  
  // SEO
  metaTitle: string;
  metaDescription: string;
  slug: string;
}
```

## API Endpoints

### Course Management
```typescript
// List courses with filters
GET    /api/admin/courses
Query: {
  page?: number;
  limit?: number;
  type?: string;
  status?: string;
  search?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

// Get single course
GET    /api/admin/courses/:id

// Create new course
POST   /api/admin/courses
Body: CourseFormData

// Update course
PUT    /api/admin/courses/:id
Body: Partial<CourseFormData>

// Delete course
DELETE /api/admin/courses/:id

// Duplicate course
POST   /api/admin/courses/:id/duplicate

// Bulk operations
POST   /api/admin/courses/bulk
Body: {
  action: 'activate' | 'deactivate' | 'delete';
  courseIds: number[];
}
```

### Discount Management
```typescript
// List discounts
GET    /api/admin/discounts

// Create discount
POST   /api/admin/discounts

// Update discount
PUT    /api/admin/discounts/:id

// Delete discount
DELETE /api/admin/discounts/:id

// Validate discount code
POST   /api/admin/discounts/validate
Body: {
  code: string;
  courseId: number;
  amount: number;
}
```

## Frontend Components

### 1. Course List Component
```typescript
const CourseList: React.FC = () => {
  // Features:
  // - Sortable table
  // - Inline quick edit
  // - Status toggle
  // - Quick preview
  // - Bulk selection
  // - Export functionality
};
```

### 2. Course Form Component
```typescript
const CourseForm: React.FC<CourseFormProps> = ({ course, onSubmit }) => {
  // Sections:
  // 1. Basic Information
  // 2. Pricing & Discounts
  // 3. Schedule & Duration
  // 4. Course Content
  // 5. Media Gallery
  // 6. SEO Settings
  
  // Features:
  // - Auto-save draft
  // - Form validation
  // - Rich text editor
  // - Image upload with preview
  // - Discount calculator preview
};
```

### 3. Discount Manager Component
```typescript
const DiscountManager: React.FC = () => {
  // Features:
  // - Create discount codes
  // - Set validity periods
  // - Usage tracking
  // - Performance analytics
  // - Quick enable/disable
};
```

## Business Logic

### 1. Price Calculation
```typescript
class PriceCalculator {
  calculateFinalPrice(
    basePrice: number,
    discounts: Discount[],
    participants: number,
    bookingDate: Date,
    courseDate: Date
  ): PriceBreakdown {
    let price = basePrice;
    const appliedDiscounts: AppliedDiscount[] = [];
    
    // Early bird discount
    const daysUntilCourse = differenceInDays(courseDate, bookingDate);
    if (daysUntilCourse >= 14) {
      const earlyBirdAmount = basePrice * 0.1;
      price -= earlyBirdAmount;
      appliedDiscounts.push({
        type: 'early_bird',
        amount: earlyBirdAmount,
        description: '10% Early Bird Discount'
      });
    }
    
    // Group discount
    if (participants >= 3) {
      const groupDiscountAmount = basePrice * 0.15 * participants;
      price = (basePrice * participants) - groupDiscountAmount;
      appliedDiscounts.push({
        type: 'group',
        amount: groupDiscountAmount,
        description: '15% Group Discount'
      });
    }
    
    // Promo code discounts
    discounts.forEach(discount => {
      if (this.isDiscountValid(discount, courseDate)) {
        const discountAmount = this.calculateDiscountAmount(
          discount,
          price
        );
        price -= discountAmount;
        appliedDiscounts.push({
          type: 'promo',
          amount: discountAmount,
          description: discount.description,
          code: discount.code
        });
      }
    });
    
    return {
      basePrice,
      finalPrice: Math.max(price, 0),
      totalDiscount: basePrice - price,
      appliedDiscounts
    };
  }
}
```

### 2. Capacity Management
```typescript
class CapacityManager {
  async checkAvailability(
    courseId: number,
    requestedSpots: number
  ): Promise<AvailabilityResult> {
    const course = await this.courseRepository.findById(courseId);
    const bookings = await this.bookingRepository.count({
      where: {
        courseScheduleId: courseId,
        status: { inq: ['confirmed', 'pending'] }
      }
    });
    
    const availableSpots = course.maxCapacity - bookings;
    const canBook = availableSpots >= requestedSpots;
    
    return {
      canBook,
      availableSpots,
      totalCapacity: course.maxCapacity,
      currentBookings: bookings,
      waitlistAvailable: course.waitlistEnabled && !canBook
    };
  }
}
```

### 3. Validation Rules
```typescript
const courseValidationSchema = z.object({
  name: z.string()
    .min(5, 'Course name must be at least 5 characters')
    .max(100, 'Course name must not exceed 100 characters'),
    
  courseType: z.enum(['EFAW', 'FAW', 'Paediatric']),
  
  description: z.string()
    .min(50, 'Description must be at least 50 characters')
    .max(2000, 'Description must not exceed 2000 characters'),
    
  durationHours: z.number()
    .min(1, 'Duration must be at least 1 hour')
    .max(40, 'Duration cannot exceed 40 hours'),
    
  price: z.number()
    .min(0, 'Price cannot be negative')
    .max(10000, 'Price seems too high'),
    
  maxCapacity: z.number()
    .min(1, 'Capacity must be at least 1')
    .max(100, 'Capacity cannot exceed 100'),
    
  minCapacity: z.number()
    .min(1, 'Minimum capacity must be at least 1'),
    
  certificationValidityYears: z.number()
    .min(1, 'Certification must be valid for at least 1 year')
    .max(5, 'Certification validity cannot exceed 5 years')
}).refine(data => data.minCapacity <= data.maxCapacity, {
  message: 'Minimum capacity cannot exceed maximum capacity',
  path: ['minCapacity']
});
```

## Advanced Features

### 1. Course Templates
```typescript
interface CourseTemplate {
  id: string;
  name: string;
  category: string;
  defaultValues: Partial<CourseFormData>;
  description: string;
}

// Predefined templates
const templates: CourseTemplate[] = [
  {
    id: 'efaw-standard',
    name: 'Standard EFAW Course',
    category: 'EFAW',
    defaultValues: {
      courseType: 'EFAW',
      durationHours: 6,
      certificationValidityYears: 3,
      maxCapacity: 12,
      minCapacity: 4,
      price: 75
    }
  }
];
```

### 2. Bulk Import/Export
```typescript
interface BulkImportResult {
  success: number;
  failed: number;
  errors: ImportError[];
  warnings: ImportWarning[];
}

class CourseImporter {
  async importFromCSV(file: File): Promise<BulkImportResult> {
    const data = await this.parseCSV(file);
    const validated = await this.validateData(data);
    return await this.processBulkImport(validated);
  }
  
  async exportToExcel(filters: CourseFilters): Promise<Blob> {
    const courses = await this.getCourses(filters);
    return this.generateExcelFile(courses);
  }
}
```

### 3. Version History
```typescript
interface CourseVersion {
  id: number;
  courseId: number;
  version: number;
  changes: {
    field: string;
    oldValue: any;
    newValue: any;
  }[];
  changedBy: number;
  changedAt: Date;
  changeReason?: string;
}

// Track all changes
class CourseAuditLogger {
  async logChange(
    courseId: number,
    changes: any,
    userId: number
  ): Promise<void> {
    await this.auditRepository.create({
      entityType: 'course',
      entityId: courseId,
      action: 'update',
      changes,
      userId,
      timestamp: new Date()
    });
  }
}
```

## Performance Considerations

### 1. Caching Strategy
```typescript
class CourseCache {
  private readonly CACHE_TTL = 3600; // 1 hour
  
  async getCourse(id: number): Promise<Course> {
    const cacheKey = `course:${id}`;
    const cached = await redis.get(cacheKey);
    
    if (cached) {
      return JSON.parse(cached);
    }
    
    const course = await this.courseRepository.findById(id);
    await redis.setex(
      cacheKey,
      this.CACHE_TTL,
      JSON.stringify(course)
    );
    
    return course;
  }
  
  async invalidateCache(id: number): Promise<void> {
    await redis.del([
      `course:${id}`,
      'courses:list',
      'courses:active'
    ]);
  }
}
```

### 2. Image Optimization
```typescript
class CourseImageProcessor {
  async processUpload(file: File): Promise<ProcessedImage> {
    // Generate multiple sizes
    const sizes = {
      thumbnail: { width: 150, height: 150 },
      medium: { width: 600, height: 400 },
      large: { width: 1200, height: 800 }
    };
    
    const processed = await Promise.all(
      Object.entries(sizes).map(([size, dimensions]) =>
        this.resizeImage(file, dimensions)
      )
    );
    
    return {
      original: await this.uploadToStorage(file),
      ...processed
    };
  }
}
```

## Security & Permissions

### 1. Role-Based Access
```typescript
const coursePermissions = {
  admin: ['create', 'read', 'update', 'delete', 'publish'],
  instructor: ['read', 'update:own'],
  staff: ['read']
};
```

### 2. Input Sanitization
```typescript
class CourseSanitizer {
  sanitizeCourseData(data: any): CourseFormData {
    return {
      name: this.sanitizeString(data.name),
      description: this.sanitizeHTML(data.description),
      price: this.sanitizeNumber(data.price),
      // ... other fields
    };
  }
  
  private sanitizeHTML(html: string): string {
    return DOMPurify.sanitize(html, {
      ALLOWED_TAGS: ['p', 'br', 'strong', 'em', 'ul', 'ol', 'li'],
      ALLOWED_ATTR: []
    });
  }
}
```

## Implementation Checklist

### Phase 1: Basic CRUD
- [ ] Course list view
- [ ] Create course form
- [ ] Edit course functionality
- [ ] Delete with confirmation
- [ ] Basic validation

### Phase 2: Advanced Features
- [ ] Discount system
- [ ] Bulk operations
- [ ] Import/export
- [ ] Course templates
- [ ] Version history

### Phase 3: Optimization
- [ ] Caching implementation
- [ ] Image optimization
- [ ] Performance monitoring
- [ ] Search functionality
- [ ] Advanced filters