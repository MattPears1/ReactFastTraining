# Analytics Implementation Plan - Admin Portal

**Last Updated: 28th July 2025 - 00:00**

## 🎯 Analytics System Overview

This document outlines a comprehensive analytics system for the React Fast Training admin portal, focusing on course popularity, revenue tracking, and user journey insights while maintaining simplicity and privacy.

## 📊 Analytics Components

### 1. Course Analytics

#### Database Schema
```sql
-- Course analytics aggregation table
CREATE TABLE course_analytics (
  id SERIAL PRIMARY KEY,
  course_id INTEGER REFERENCES courses(id),
  date DATE NOT NULL,
  day_of_week INTEGER NOT NULL, -- 0=Sunday, 6=Saturday
  month INTEGER NOT NULL,
  year INTEGER NOT NULL,
  
  -- Metrics
  sessions_scheduled INTEGER DEFAULT 0,
  total_bookings INTEGER DEFAULT 0,
  completed_bookings INTEGER DEFAULT 0,
  cancelled_bookings INTEGER DEFAULT 0,
  no_show_bookings INTEGER DEFAULT 0,
  
  -- Financial
  revenue_generated DECIMAL(10,2) DEFAULT 0,
  refunds_processed DECIMAL(10,2) DEFAULT 0,
  net_revenue DECIMAL(10,2) DEFAULT 0,
  
  -- Capacity
  total_capacity INTEGER DEFAULT 0,
  seats_filled INTEGER DEFAULT 0,
  fill_rate DECIMAL(5,2) DEFAULT 0, -- percentage
  
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  
  -- Indexes for fast queries
  INDEX idx_course_date (course_id, date),
  INDEX idx_day_of_week (day_of_week),
  INDEX idx_month_year (month, year)
);

-- Popular times analysis view
CREATE VIEW course_popularity_by_time AS
SELECT 
  c.name as course_name,
  c.category,
  ca.day_of_week,
  CASE ca.day_of_week
    WHEN 0 THEN 'Sunday'
    WHEN 1 THEN 'Monday'
    WHEN 2 THEN 'Tuesday'
    WHEN 3 THEN 'Wednesday'
    WHEN 4 THEN 'Thursday'
    WHEN 5 THEN 'Friday'
    WHEN 6 THEN 'Saturday'
  END as day_name,
  COUNT(*) as session_count,
  SUM(ca.total_bookings) as total_bookings,
  AVG(ca.fill_rate) as avg_fill_rate,
  SUM(ca.net_revenue) as total_revenue
FROM course_analytics ca
JOIN courses c ON ca.course_id = c.id
WHERE ca.date >= CURRENT_DATE - INTERVAL '90 days'
GROUP BY c.name, c.category, ca.day_of_week
ORDER BY total_bookings DESC;

-- Monthly trends view
CREATE VIEW course_monthly_trends AS
SELECT 
  c.name as course_name,
  ca.month,
  ca.year,
  TO_CHAR(TO_DATE(ca.month::text, 'MM'), 'Month') as month_name,
  COUNT(DISTINCT ca.date) as days_with_sessions,
  SUM(ca.total_bookings) as total_bookings,
  SUM(ca.net_revenue) as total_revenue,
  AVG(ca.fill_rate) as avg_fill_rate
FROM course_analytics ca
JOIN courses c ON ca.course_id = c.id
GROUP BY c.name, ca.month, ca.year
ORDER BY ca.year DESC, ca.month DESC;
```

### 2. User Journey Analytics

#### Visitor Tracking Table
```sql
-- Simple visitor tracking (GDPR compliant - no personal data)
CREATE TABLE visitor_analytics (
  id SERIAL PRIMARY KEY,
  session_id UUID NOT NULL, -- Anonymous session identifier
  date DATE NOT NULL,
  hour INTEGER NOT NULL, -- 0-23
  
  -- Journey stages
  visited_homepage BOOLEAN DEFAULT false,
  visited_courses_page BOOLEAN DEFAULT false,
  visited_booking_page BOOLEAN DEFAULT false,
  started_booking BOOLEAN DEFAULT false,
  completed_booking BOOLEAN DEFAULT false,
  cancelled_booking BOOLEAN DEFAULT false,
  
  -- Additional metrics
  pages_viewed INTEGER DEFAULT 0,
  time_on_site_seconds INTEGER DEFAULT 0,
  device_type VARCHAR(20), -- mobile, tablet, desktop
  referrer_source VARCHAR(100), -- google, direct, facebook, etc
  
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  
  INDEX idx_date_hour (date, hour),
  INDEX idx_session (session_id)
);

-- Conversion funnel view
CREATE VIEW booking_funnel AS
SELECT 
  date,
  COUNT(DISTINCT session_id) as total_visitors,
  COUNT(DISTINCT CASE WHEN visited_homepage THEN session_id END) as homepage_visitors,
  COUNT(DISTINCT CASE WHEN visited_courses_page THEN session_id END) as courses_page_visitors,
  COUNT(DISTINCT CASE WHEN visited_booking_page THEN session_id END) as booking_page_visitors,
  COUNT(DISTINCT CASE WHEN started_booking THEN session_id END) as started_bookings,
  COUNT(DISTINCT CASE WHEN completed_booking THEN session_id END) as completed_bookings,
  COUNT(DISTINCT CASE WHEN cancelled_booking THEN session_id END) as cancelled_bookings,
  
  -- Conversion rates
  ROUND(100.0 * COUNT(DISTINCT CASE WHEN visited_booking_page THEN session_id END) / 
    NULLIF(COUNT(DISTINCT session_id), 0), 2) as visitor_to_booking_page_rate,
  ROUND(100.0 * COUNT(DISTINCT CASE WHEN completed_booking THEN session_id END) / 
    NULLIF(COUNT(DISTINCT CASE WHEN visited_booking_page THEN session_id END), 0), 2) as booking_page_conversion_rate,
  ROUND(100.0 * COUNT(DISTINCT CASE WHEN completed_booking THEN session_id END) / 
    NULLIF(COUNT(DISTINCT session_id), 0), 2) as overall_conversion_rate
FROM visitor_analytics
WHERE date >= CURRENT_DATE - INTERVAL '30 days'
GROUP BY date
ORDER BY date DESC;
```

### 3. Enhanced Error Logging

```sql
-- Application error logging
CREATE TABLE error_logs (
  id SERIAL PRIMARY KEY,
  error_level VARCHAR(20) NOT NULL, -- ERROR, WARNING, INFO
  error_type VARCHAR(100) NOT NULL,
  error_message TEXT NOT NULL,
  error_stack TEXT,
  
  -- Context
  user_email VARCHAR(255),
  ip_address VARCHAR(45),
  user_agent TEXT,
  request_url TEXT,
  request_method VARCHAR(10),
  
  -- Categorization
  category VARCHAR(50), -- booking, payment, auth, system
  resolved BOOLEAN DEFAULT false,
  resolved_at TIMESTAMP,
  resolved_by VARCHAR(255),
  
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  
  INDEX idx_error_level (error_level),
  INDEX idx_created_at (created_at),
  INDEX idx_category (category)
);

-- Error summary view
CREATE VIEW error_summary AS
SELECT 
  DATE(created_at) as date,
  error_level,
  category,
  COUNT(*) as error_count,
  COUNT(DISTINCT user_email) as affected_users
FROM error_logs
WHERE created_at >= CURRENT_DATE - INTERVAL '7 days'
GROUP BY DATE(created_at), error_level, category
ORDER BY date DESC, error_count DESC;
```

## 📍 Simplified Location Setup

### Update Venues to 3 Locations Only
```sql
-- Migration to simplify venues
UPDATE venues SET is_active = false WHERE id > 3;

UPDATE venues SET 
  name = 'Location 1 - Sheffield',
  address_line1 = 'Sheffield City Centre',
  city = 'Sheffield',
  postcode = 'S1 2HE'
WHERE id = 1;

UPDATE venues SET 
  name = 'Location 2 - Sheffield',
  address_line1 = 'Sheffield Business District',
  city = 'Sheffield',
  postcode = 'S3 7HS'
WHERE id = 2;

UPDATE venues SET 
  name = 'Location 3 - Yorkshire',
  address_line1 = 'To Be Confirmed',
  city = 'Yorkshire',
  postcode = 'TBD'
WHERE id = 3;
```

## 🖥️ Admin Portal UI Components

### 1. Analytics Dashboard Page
```typescript
// /src/admin/features/analytics/AnalyticsDashboard.tsx
interface AnalyticsDashboard {
  sections: {
    coursePopularity: CoursePopularityWidget;
    revenueByCoursue: RevenueChartWidget;
    dayOfWeekAnalysis: DayOfWeekHeatmap;
    monthlyTrends: MonthlyTrendsChart;
    bookingFunnel: ConversionFunnelWidget;
    errorMonitoring: ErrorSummaryWidget;
  };
}
```

### 2. Course Popularity Widget
```typescript
interface CoursePopularityWidget {
  timeRange: '7days' | '30days' | '90days';
  metrics: {
    courseName: string;
    totalBookings: number;
    revenue: number;
    fillRate: number;
    trend: 'up' | 'down' | 'stable';
  }[];
  sortBy: 'bookings' | 'revenue' | 'fillRate';
}
```

### 3. Day of Week Heatmap
```typescript
interface DayOfWeekHeatmap {
  data: {
    course: string;
    dayData: {
      day: string;
      bookings: number;
      intensity: 0-1; // For color scaling
    }[];
  }[];
}
```

### 4. Booking Funnel Visualization
```typescript
interface BookingFunnel {
  stages: [
    { name: 'Site Visitors', count: number },
    { name: 'Viewed Courses', count: number },
    { name: 'Started Booking', count: number },
    { name: 'Completed Booking', count: number }
  ];
  conversionRates: {
    visitorToBooking: number;
    bookingToComplete: number;
    overallConversion: number;
  };
}
```

## 🔐 Privacy & GDPR Compliance

### Data Collection Principles
1. **No Personal Identifiers** - Use anonymous session IDs only
2. **No IP Logging** - Hash IPs for security logs only
3. **Automatic Cleanup** - Delete visitor data after 90 days
4. **Opt-out Mechanism** - Respect Do Not Track headers
5. **Transparent Tracking** - Cookie banner notification

### Implementation
```typescript
// Visitor tracking service
class VisitorTrackingService {
  generateSessionId(): string {
    // Use crypto.randomUUID() for anonymous sessions
    return crypto.randomUUID();
  }
  
  trackPageView(page: string) {
    // Only track if user hasn't opted out
    if (this.hasOptedOut()) return;
    
    // Send minimal data
    this.send({
      sessionId: this.getSessionId(),
      page,
      timestamp: new Date(),
      // No user agent, IP, or personal data
    });
  }
}
```

## 📈 API Endpoints

### Analytics Endpoints
```typescript
// Course popularity
GET /api/admin/analytics/courses/popularity
  ?timeRange=30days
  &sortBy=bookings

// Revenue by course
GET /api/admin/analytics/revenue/by-course
  ?startDate=2025-01-01
  &endDate=2025-01-31

// Day of week analysis
GET /api/admin/analytics/popularity/day-of-week
  ?courseId=1

// Monthly trends
GET /api/admin/analytics/trends/monthly
  ?year=2025

// Booking funnel
GET /api/admin/analytics/funnel
  ?dateRange=last30days

// Error summary
GET /api/admin/analytics/errors/summary
  ?severity=ERROR
  &category=booking
```

## 🛠️ Implementation Timeline

### Week 1: Database & Backend
- [x] Create analytics database tables
- [x] Implement data aggregation jobs
- [x] Build API endpoints
- [x] Set up error logging

### Week 2: Frontend Components
- [ ] Create analytics dashboard layout
- [ ] Build course popularity widgets
- [ ] Implement revenue charts
- [ ] Add day/month analysis views

### Week 3: Visitor Tracking
- [ ] Implement session tracking
- [ ] Build booking funnel tracking
- [ ] Create conversion reports
- [ ] Add GDPR compliance features

### Week 4: Polish & Testing
- [ ] Performance optimization
- [ ] Error handling
- [ ] Documentation
- [ ] Admin training

## 📊 Sample Queries

### Most Popular Courses This Month
```sql
SELECT 
  c.name,
  COUNT(DISTINCT cs.id) as sessions_held,
  SUM(b.number_of_participants) as total_attendees,
  SUM(b.final_amount) as total_revenue
FROM courses c
JOIN course_schedules cs ON c.id = cs.course_id
JOIN bookings b ON cs.id = b.session_id
WHERE cs.start_datetime >= DATE_TRUNC('month', CURRENT_DATE)
  AND b.status IN ('PAID', 'ATTENDED', 'COMPLETED')
GROUP BY c.id, c.name
ORDER BY total_attendees DESC
LIMIT 10;
```

### Best Days for Each Course
```sql
SELECT 
  course_name,
  day_name,
  avg_fill_rate,
  total_bookings
FROM course_popularity_by_time
WHERE avg_fill_rate = (
  SELECT MAX(avg_fill_rate)
  FROM course_popularity_by_time cpt2
  WHERE cpt2.course_name = course_popularity_by_time.course_name
)
ORDER BY course_name;
```

## 🚀 Quick Implementation Wins

1. **Start with course popularity** - Easy to implement, high value
2. **Add simple visitor counter** - Low effort, useful metric
3. **Revenue by course chart** - Critical business metric
4. **Basic error logging** - Improves reliability
5. **Booking funnel** - Identifies conversion issues

---

This analytics system provides comprehensive insights while respecting privacy and keeping implementation simple. No exports needed - everything viewable directly in the admin portal.