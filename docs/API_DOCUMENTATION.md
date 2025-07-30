# Course Management API Documentation

**Last updated: 2025-07-27**

## Overview

This document describes the API endpoints for the React Fast Training course management system. The API is built with LoopBack 4 and provides comprehensive functionality for course sessions, bookings, attendance tracking, payment processing, and real-time updates. The system supports 13 different course types across 8 Yorkshire locations with advanced features like group bookings and real-time availability.

## Base URL

```
Development: http://localhost:3000/api
Production: https://api.reactfasttraining.co.uk/api
```

## Authentication

Most endpoints require JWT authentication. Include the token in the Authorization header:

```
Authorization: Bearer <jwt_token>
```

## Course Sessions

### Get Available Sessions

Retrieves all available course sessions with filtering options.

```
GET /courses/sessions
```

**Query Parameters:**
- `courseType` (optional): Filter by course type (e.g., 'efaw', 'paediatric')
- `location` (optional): Filter by location ID ('location-a', 'location-b')
- `startDate` (optional): Filter sessions starting after this date
- `endDate` (optional): Filter sessions ending before this date
- `availability` (optional): 'available' | 'full' | 'all'

**Response:**
```json
[
  {
    "id": "session-uuid",
    "courseId": "efaw",
    "courseName": "Emergency First Aid at Work",
    "startDate": "2024-03-15T09:00:00Z",
    "endDate": "2024-03-15T17:00:00Z",
    "startTime": "09:00",
    "endTime": "17:00",
    "locationId": "location-a",
    "locationName": "Location A",
    "currentParticipants": 8,
    "maxParticipants": 12,
    "pricePerPerson": 75,
    "status": "SCHEDULED"
  }
]
```

### Get Session Capacity

Get real-time capacity information for sessions.

```
GET /courses/calendar/availability
```

**Query Parameters:**
- `startDate`: Start date for calendar view
- `endDate`: End date for calendar view

**Response:**
```json
[
  {
    "sessionId": "session-uuid",
    "date": "2024-03-15",
    "available": 4,
    "booked": 8,
    "maxCapacity": 12,
    "status": "available"
  }
]
```

## Bookings

### Create Booking

Create a new booking for a course session with support for group bookings.

```
POST /bookings
```

**Request Body:**
```json
{
  "sessionId": "session-uuid",
  "type": "GROUP", // or "INDIVIDUAL"
  "contactDetails": {
    "firstName": "John",
    "lastName": "Doe",
    "email": "john@example.com",
    "phone": "07123456789",
    "company": "Optional Company Name"
  },
  "participants": [
    {
      "firstName": "John",
      "lastName": "Doe",
      "email": "john@example.com",
      "dateOfBirth": "1990-01-01",
      "emergencyContact": {
        "name": "Jane Doe",
        "phone": "07987654321",
        "relationship": "Spouse"
      },
      "medicalConditions": "None",
      "dietaryRequirements": "Vegetarian"
    }
    // Additional participants for group bookings
  ],
  "specialRequirements": "Wheelchair access needed",
  "confirmedTermsAndConditions": true,
  "marketingOptIn": false
}
```

**Group Booking Discounts:**
- 5+ participants: 10% discount automatically applied
- Maximum 12 participants per session

**Response:**
```json
{
  "id": "booking-uuid",
  "bookingReference": "RFT-2024-0001",
  "status": "CONFIRMED",
  "totalAmount": 75,
  "confirmationSentAt": "2024-03-01T10:00:00Z"
}
```

**Constraints:**
- Maximum 12 participants per session (hard limit)
- Booking will fail if session is full
- Email confirmation sent automatically

### Get Booking Details

```
GET /bookings/{bookingId}
```

### Cancel Booking

```
DELETE /bookings/{bookingId}
```

**Request Body:**
```json
{
  "reason": "Unable to attend"
}
```

### Get Calendar Availability

Get calendar view data with course sessions grouped by date.

```
GET /courses/calendar
```

**Query Parameters:**
- `month` (required): Month in YYYY-MM format
- `courseType` (optional): Filter by course type
- `location` (optional): Filter by location ID

**Response:**
```json
{
  "dates": {
    "2024-03-15": [
      {
        "sessionId": "session-uuid",
        "courseType": "emergency-first-aid",
        "courseName": "Emergency First Aid at Work",
        "startTime": "09:00",
        "location": "Leeds",
        "availableSpots": 4,
        "status": "available"
      }
    ]
  },
  "summary": {
    "totalSessions": 15,
    "availableSessions": 12,
    "fullSessions": 3
  }
}
```

### Check Booking Availability

Real-time availability check before booking.

```
POST /bookings/check-availability
```

**Request Body:**
```json
{
  "sessionId": "session-uuid",
  "participantCount": 5
}
```

**Response:**
```json
{
  "available": true,
  "remainingSpots": 7,
  "groupDiscountApplies": true,
  "discountPercentage": 10,
  "originalPrice": 375,
  "discountedPrice": 337.50
}
```

## Admin Endpoints

All admin endpoints require authentication with admin role.

### Session Management

#### Create Session

```
POST /admin/sessions
```

**Request Body:**
```json
{
  "courseId": "efaw",
  "trainerId": "lex-trainer-id",
  "locationId": "location-a",
  "startDate": "2024-03-15T09:00:00Z",
  "endDate": "2024-03-15T17:00:00Z",
  "startTime": "09:00",
  "endTime": "17:00",
  "maxParticipants": 12,
  "pricePerPerson": 75,
  "notes": "Optional notes"
}
```

#### Create Recurring Sessions

```
POST /admin/sessions/recurring
```

**Request Body:**
```json
{
  "courseId": "efaw",
  "trainerId": "lex-trainer-id",
  "locationId": "location-a",
  "startDate": "2024-03-15T09:00:00Z",
  "endDate": "2024-03-15T17:00:00Z",
  "startTime": "09:00",
  "endTime": "17:00",
  "maxParticipants": 12,
  "pricePerPerson": 75,
  "recurrenceEndDate": "2024-06-15T00:00:00Z",
  "daysOfWeek": [1, 3, 5]
}
```

**Note:** `daysOfWeek` uses 0=Sunday, 6=Saturday

#### Update Session

```
PUT /admin/sessions/{sessionId}
```

**Request Body:**
```json
{
  "startTime": "10:00",
  "maxParticipants": 10,
  "notes": "Time changed"
}
```

#### Cancel Session

```
DELETE /admin/sessions/{sessionId}
```

**Request Body:**
```json
{
  "reason": "Trainer unavailable"
}
```

### Attendance Management

#### Mark Attendance

```
POST /admin/sessions/{sessionId}/attendance
```

**Request Body:**
```json
{
  "attendance": [
    {
      "bookingId": "booking-uuid-1",
      "userId": "user-uuid-1",
      "status": "PRESENT",
      "notes": "Arrived 5 minutes late"
    },
    {
      "bookingId": "booking-uuid-2",
      "userId": "user-uuid-2",
      "status": "ABSENT"
    }
  ],
  "markedBy": "Admin Name"
}
```

**Status Values:** `PRESENT`, `ABSENT`, `LATE`, `PARTIAL`

#### Get Session Attendance

```
GET /admin/sessions/{sessionId}/attendance
```

**Response:**
```json
[
  {
    "attendanceId": "attendance-uuid",
    "bookingId": "booking-uuid",
    "userId": "user-uuid",
    "userName": "John Doe",
    "userEmail": "john@example.com",
    "status": "PRESENT",
    "notes": "Arrived on time",
    "markedBy": "Admin Name",
    "markedAt": "2024-03-15T17:30:00Z"
  }
]
```

#### Export Attendance CSV

```
GET /admin/sessions/{sessionId}/attendance/export
```

Returns attendance data as CSV file.

### Statistics

#### Session Statistics

```
GET /admin/stats/sessions
```

**Response:**
```json
{
  "total": 150,
  "upcoming": 45,
  "completed": 100,
  "cancelled": 5
}
```

#### Booking Statistics

```
GET /admin/stats/bookings
```

**Response:**
```json
{
  "total": 1200,
  "confirmed": 1100,
  "pending": 50,
  "cancelled": 50,
  "averageAttendance": 92
}
```

## WebSocket Events

Connect to WebSocket for real-time updates:

```javascript
const socket = io('ws://localhost:3000', {
  transports: ['websocket', 'polling']
});
```

### Events

#### Subscribe to Updates

```javascript
socket.emit('subscribeToUpdates');
```

#### Capacity Update

Received when session capacity changes:

```javascript
socket.on('capacityUpdate', (data) => {
  // data: { sessionId, booked, available }
});
```

#### Session Update

Received when session is created/updated/cancelled:

```javascript
socket.on('sessionUpdate', (data) => {
  // data: { type: 'created' | 'updated' | 'cancelled', session }
});
```

#### Attendance Update

Received when attendance is marked:

```javascript
socket.on('attendanceUpdate', (data) => {
  // data: { sessionId, attendance: [...] }
});
```

## Error Responses

All endpoints return standard error responses:

```json
{
  "error": {
    "statusCode": 400,
    "name": "BadRequestError",
    "message": "Session is already full"
  }
}
```

Common status codes:
- `400`: Bad Request (validation errors, business rule violations)
- `401`: Unauthorized (missing or invalid token)
- `403`: Forbidden (insufficient permissions)
- `404`: Not Found
- `409`: Conflict (e.g., scheduling conflicts)
- `500`: Internal Server Error

## Rate Limiting

- Public endpoints: 100 requests per minute per IP
- Authenticated endpoints: 1000 requests per minute per user
- WebSocket connections: 1 per user

## Best Practices

1. **Capacity Management**: Always check session availability before attempting bookings
2. **Error Handling**: Implement proper error handling for all API calls
3. **WebSocket Fallback**: Implement polling as fallback when WebSocket is unavailable
4. **Batch Operations**: Use bulk endpoints when available (e.g., marking multiple attendance records)
5. **Caching**: Cache course and location data as they change infrequently

## Enhanced Endpoints (July 2025)

### Calendar Integration
```
GET /courses/calendar/ics/{sessionId}
```
Generate .ics file for calendar integration

### Bulk Operations
```
POST /admin/bookings/bulk-email
```
Send emails to multiple booking participants

### Analytics
```
GET /admin/analytics/booking-trends
GET /admin/analytics/revenue-summary
GET /admin/analytics/course-popularity
```

### Export Functions
```
GET /admin/export/bookings?format=csv&dateRange=...
GET /admin/export/attendees?sessionId=...
GET /admin/export/financial-report?month=...
```

## Migration Notes

If migrating from the legacy Express backend:
1. Update all endpoint URLs to include `/api` prefix
2. Change authentication to use JWT instead of session cookies
3. Update booking reference format from `EFAW-YYYY-NNNN` to `RFT-YYYY-NNNN`
4. Capacity is now hard-limited to 12 participants per session
5. Group discounts (10% for 5+) are automatically applied
6. All 13 course types are now supported
7. 8 Yorkshire locations are configured