# API Endpoints Specification

## Overview

Complete API specification for the React Fast Training administration dashboard using LoopBack 4 REST API conventions.

## Base Configuration

### API Base URL
```
Development: http://localhost:3000/api/admin
Production: https://api.reactfasttraining.co.uk/api/admin
```

### Authentication
All endpoints require JWT Bearer token authentication unless specified otherwise.

```
Authorization: Bearer <jwt_token>
```

### Common Headers
```
Content-Type: application/json
Accept: application/json
X-CSRF-Token: <csrf_token>
```

### Response Format
```typescript
interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
    details?: any;
  };
  meta?: {
    page?: number;
    pageSize?: number;
    total?: number;
    totalPages?: number;
  };
}
```

## Authentication Endpoints

### Login
```
POST /auth/login
Public: Yes

Request:
{
  "email": "admin@reactfasttraining.co.uk",
  "password": "securePassword123!",
  "captcha": "..." // Required after 3 failed attempts
}

Response:
{
  "success": true,
  "data": {
    "accessToken": "eyJhbGciOiJIUzI1NiIs...",
    "user": {
      "id": 1,
      "email": "admin@reactfasttraining.co.uk",
      "name": "Admin User",
      "role": "admin"
    },
    "expiresIn": 900
  }
}

Errors:
- 401: Invalid credentials
- 429: Too many attempts
- 403: Account locked
```

### Logout
```
POST /auth/logout

Response:
{
  "success": true,
  "data": {
    "message": "Logged out successfully"
  }
}
```

### Refresh Token
```
POST /auth/refresh

Response:
{
  "success": true,
  "data": {
    "accessToken": "eyJhbGciOiJIUzI1NiIs...",
    "expiresIn": 900
  }
}
```

### Current User
```
GET /auth/me

Response:
{
  "success": true,
  "data": {
    "id": 1,
    "email": "admin@reactfasttraining.co.uk",
    "name": "Admin User",
    "role": "admin",
    "lastLogin": "2025-01-27T10:30:00Z",
    "permissions": ["courses.manage", "bookings.manage", "users.view"]
  }
}
```

## Dashboard Analytics Endpoints

### Dashboard Overview
```
GET /dashboard/overview
Query: ?period=month&compareWith=lastMonth

Response:
{
  "success": true,
  "data": {
    "revenue": {
      "current": 15750.00,
      "previous": 14200.00,
      "change": 10.92,
      "trend": "up"
    },
    "bookings": {
      "current": 210,
      "previous": 189,
      "change": 11.11,
      "trend": "up"
    },
    "users": {
      "total": 1542,
      "new": 87,
      "active": 423
    },
    "courses": {
      "upcoming": 12,
      "inProgress": 3,
      "completed": 156
    }
  }
}
```

### Revenue Analytics
```
GET /analytics/revenue
Query: ?startDate=2025-01-01&endDate=2025-01-31&groupBy=day

Response:
{
  "success": true,
  "data": {
    "total": 15750.00,
    "breakdown": [
      {
        "date": "2025-01-01",
        "revenue": 450.00,
        "bookings": 6,
        "avgBookingValue": 75.00
      }
      // ... more days
    ],
    "byCourse": [
      {
        "courseType": "EFAW",
        "revenue": 9000.00,
        "percentage": 57.14
      }
      // ... more courses
    ]
  }
}
```

### Booking Analytics
```
GET /analytics/bookings
Query: ?period=week&status=all

Response:
{
  "success": true,
  "data": {
    "summary": {
      "total": 45,
      "confirmed": 38,
      "pending": 5,
      "cancelled": 2
    },
    "occupancyRate": 79.2,
    "conversionRate": 4.8,
    "popularCourses": [
      {
        "courseId": 1,
        "courseName": "Emergency First Aid at Work",
        "bookings": 28,
        "revenue": 2100.00
      }
    ]
  }
}
```

### User Analytics
```
GET /analytics/users
Query: ?segment=new&period=month

Response:
{
  "success": true,
  "data": {
    "newUsers": 87,
    "activeUsers": {
      "daily": 45,
      "weekly": 156,
      "monthly": 423
    },
    "retention": {
      "day1": 78.5,
      "day7": 45.2,
      "day30": 32.1
    },
    "demographics": {
      "byLocation": [
        {
          "city": "Leeds",
          "count": 234,
          "percentage": 15.2
        }
      ],
      "byAge": [
        {
          "range": "25-34",
          "count": 412,
          "percentage": 26.7
        }
      ]
    }
  }
}
```

## Course Management Endpoints

### List Courses
```
GET /courses
Query: ?page=1&limit=20&type=EFAW&status=active&sortBy=name&sortOrder=asc

Response:
{
  "success": true,
  "data": [
    {
      "id": 1,
      "name": "Emergency First Aid at Work",
      "courseType": "EFAW",
      "duration": 6,
      "price": 75.00,
      "maxCapacity": 12,
      "isActive": true,
      "upcomingSchedules": 3
    }
  ],
  "meta": {
    "page": 1,
    "pageSize": 20,
    "total": 45,
    "totalPages": 3
  }
}
```

### Get Course Details
```
GET /courses/:id

Response:
{
  "success": true,
  "data": {
    "id": 1,
    "name": "Emergency First Aid at Work",
    "description": "Comprehensive one-day course...",
    "courseType": "EFAW",
    "durationHours": 6,
    "price": 75.00,
    "maxCapacity": 12,
    "minCapacity": 4,
    "certificationValidityYears": 3,
    "prerequisites": [],
    "learningOutcomes": [
      "Understand the role of a first aider",
      "Assess an emergency situation safely"
    ],
    "includedMaterials": [
      "Course handbook",
      "First aid kit",
      "Certificate"
    ],
    "isActive": true,
    "statistics": {
      "totalBookings": 156,
      "averageRating": 4.8,
      "completionRate": 98.5
    }
  }
}
```

### Create Course
```
POST /courses

Request:
{
  "name": "Paediatric First Aid",
  "courseType": "Paediatric",
  "description": "Essential first aid for those caring for children",
  "durationHours": 6,
  "price": 85.00,
  "maxCapacity": 10,
  "minCapacity": 3,
  "certificationValidityYears": 3,
  "learningOutcomes": ["..."],
  "prerequisites": ["..."],
  "includedMaterials": ["..."]
}

Response:
{
  "success": true,
  "data": {
    "id": 4,
    // ... full course object
  }
}
```

### Update Course
```
PUT /courses/:id

Request:
{
  "price": 80.00,
  "maxCapacity": 15
}

Response:
{
  "success": true,
  "data": {
    // ... updated course object
  }
}
```

### Delete Course
```
DELETE /courses/:id

Response:
{
  "success": true,
  "data": {
    "message": "Course archived successfully"
  }
}

Note: Courses are soft-deleted/archived, not permanently deleted
```

## Booking Management Endpoints

### List Bookings
```
GET /bookings
Query: ?status=confirmed&period=upcoming&page=1&limit=50

Response:
{
  "success": true,
  "data": [
    {
      "id": 123,
      "bookingReference": "RFT-2025-0123",
      "user": {
        "id": 45,
        "name": "John Smith",
        "email": "john.smith@email.com"
      },
      "course": {
        "id": 1,
        "name": "Emergency First Aid at Work",
        "date": "2025-02-15T09:00:00Z"
      },
      "status": "confirmed",
      "paymentStatus": "paid",
      "amount": 75.00
    }
  ],
  "meta": {
    "page": 1,
    "pageSize": 50,
    "total": 234
  }
}
```

### Get Booking Details
```
GET /bookings/:id

Response:
{
  "success": true,
  "data": {
    "id": 123,
    "bookingReference": "RFT-2025-0123",
    "user": {
      "id": 45,
      "name": "John Smith",
      "email": "john.smith@email.com",
      "phone": "07123456789"
    },
    "courseSchedule": {
      "id": 78,
      "course": {
        "id": 1,
        "name": "Emergency First Aid at Work"
      },
      "startDateTime": "2025-02-15T09:00:00Z",
      "endDateTime": "2025-02-15T15:00:00Z",
      "venue": {
        "name": "Leeds Training Centre",
        "address": "123 Main St, Leeds"
      }
    },
    "status": "confirmed",
    "payment": {
      "status": "paid",
      "amount": 75.00,
      "method": "card",
      "transactionId": "pi_1234567890"
    },
    "communications": {
      "confirmationSent": true,
      "reminderSent": false,
      "certificateIssued": false
    },
    "createdAt": "2025-01-15T14:30:00Z"
  }
}
```

### Create Manual Booking
```
POST /bookings/manual

Request:
{
  "userId": 45, // or create new user
  "courseScheduleId": 78,
  "paymentMethod": "cash",
  "paymentStatus": "paid",
  "amount": 75.00,
  "sendConfirmation": true,
  "notes": "Paid in person"
}

Response:
{
  "success": true,
  "data": {
    "id": 456,
    "bookingReference": "RFT-2025-0456",
    // ... full booking object
  }
}
```

### Cancel Booking
```
POST /bookings/:id/cancel

Request:
{
  "reason": "Customer request",
  "refundAmount": 75.00,
  "sendNotification": true
}

Response:
{
  "success": true,
  "data": {
    "message": "Booking cancelled successfully",
    "refundStatus": "processing"
  }
}
```

## Schedule Management Endpoints

### Create Course Schedule
```
POST /schedules

Request:
{
  "courseId": 1,
  "venueId": 2,
  "instructorId": 3,
  "startDateTime": "2025-03-01T09:00:00Z",
  "endDateTime": "2025-03-01T15:00:00Z",
  "maxCapacity": 12,
  "status": "draft",
  "registrationOpens": "2025-02-01T00:00:00Z",
  "registrationCloses": "2025-02-28T23:59:59Z"
}

Response:
{
  "success": true,
  "data": {
    "id": 89,
    // ... full schedule object
  }
}
```

### Publish Schedule
```
POST /schedules/:id/publish

Request:
{
  "notifySubscribers": true
}

Response:
{
  "success": true,
  "data": {
    "message": "Schedule published successfully",
    "notificationsSent": 45
  }
}
```

### Get Schedule Attendees
```
GET /schedules/:id/attendees

Response:
{
  "success": true,
  "data": {
    "schedule": {
      "id": 89,
      "courseName": "Emergency First Aid at Work",
      "date": "2025-03-01",
      "capacity": {
        "max": 12,
        "current": 8,
        "available": 4
      }
    },
    "attendees": [
      {
        "bookingId": 123,
        "name": "John Smith",
        "email": "john.smith@email.com",
        "phone": "07123456789",
        "status": "confirmed",
        "checkedIn": false
      }
    ]
  }
}
```

## Discount Management Endpoints

### List Discounts
```
GET /discounts
Query: ?active=true

Response:
{
  "success": true,
  "data": [
    {
      "id": 1,
      "code": "EARLY2025",
      "description": "Early bird discount",
      "discountType": "percentage",
      "discountValue": 10,
      "validFrom": "2025-01-01",
      "validUntil": "2025-03-31",
      "usageLimit": 100,
      "timesUsed": 23,
      "isActive": true
    }
  ]
}
```

### Create Discount
```
POST /discounts

Request:
{
  "code": "SPRING25",
  "description": "Spring 2025 promotion",
  "discountType": "percentage",
  "discountValue": 15,
  "validFrom": "2025-03-01",
  "validUntil": "2025-05-31",
  "usageLimit": 50,
  "courseTypeRestriction": "EFAW"
}

Response:
{
  "success": true,
  "data": {
    "id": 5,
    // ... full discount object
  }
}
```

## Export Endpoints

### Export Bookings
```
POST /export/bookings

Request:
{
  "format": "excel",
  "filters": {
    "startDate": "2025-01-01",
    "endDate": "2025-01-31",
    "status": ["confirmed", "completed"]
  },
  "columns": ["bookingReference", "customerName", "courseName", "date", "amount"]
}

Response:
{
  "success": true,
  "data": {
    "downloadUrl": "/api/admin/download/export-123456",
    "expiresAt": "2025-01-27T12:00:00Z"
  }
}
```

### Export Analytics Report
```
POST /export/analytics

Request:
{
  "reportType": "monthly-summary",
  "period": "2025-01",
  "format": "pdf",
  "includeCharts": true
}

Response:
{
  "success": true,
  "data": {
    "downloadUrl": "/api/admin/download/report-789012",
    "expiresAt": "2025-01-27T12:00:00Z"
  }
}
```

## Venue Management Endpoints

### List Venues
```
GET /venues

Response:
{
  "success": true,
  "data": [
    {
      "id": 1,
      "name": "Leeds Training Centre",
      "address": "123 Main Street, Leeds, LS1 1AA",
      "capacity": 15,
      "facilities": ["parking", "wheelchair_access", "refreshments"],
      "isActive": true
    }
  ]
}
```

## Activity Log Endpoints

### Get Activity Logs
```
GET /activity-logs
Query: ?userId=1&action=course.update&startDate=2025-01-01

Response:
{
  "success": true,
  "data": [
    {
      "id": 456,
      "userId": 1,
      "userName": "Admin User",
      "action": "course.update",
      "entityType": "course",
      "entityId": 3,
      "changes": {
        "price": {
          "old": 75.00,
          "new": 80.00
        }
      },
      "timestamp": "2025-01-27T10:45:00Z",
      "ipAddress": "192.168.1.100"
    }
  ]
}
```

## Error Responses

### Standard Error Format
```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Validation failed",
    "details": {
      "fields": {
        "email": "Invalid email format",
        "price": "Price must be positive"
      }
    }
  }
}
```

### Common Error Codes
- `AUTHENTICATION_REQUIRED`: 401 - No valid token
- `PERMISSION_DENIED`: 403 - Insufficient permissions
- `NOT_FOUND`: 404 - Resource not found
- `VALIDATION_ERROR`: 400 - Input validation failed
- `CONFLICT`: 409 - Resource conflict (e.g., duplicate)
- `RATE_LIMITED`: 429 - Too many requests
- `SERVER_ERROR`: 500 - Internal server error

## Rate Limiting

### Limits
- Authentication endpoints: 5 requests per 15 minutes
- General API: 100 requests per minute
- Export endpoints: 10 requests per hour

### Headers
```
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 95
X-RateLimit-Reset: 1706353200
```

## WebSocket Events

### Connection
```javascript
const socket = io('wss://api.reactfasttraining.co.uk', {
  auth: {
    token: 'Bearer <jwt_token>'
  }
});
```

### Events
```javascript
// New booking
socket.on('booking:new', (data) => {
  // { bookingId, courseName, customerName, amount }
});

// Booking status change
socket.on('booking:statusChange', (data) => {
  // { bookingId, oldStatus, newStatus }
});

// Schedule update
socket.on('schedule:update', (data) => {
  // { scheduleId, changes }
});

// Analytics update
socket.on('analytics:update', (data) => {
  // { metric, value, change }
});
```