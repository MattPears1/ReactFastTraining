# Analytics Dashboard Design

## Overview

Comprehensive analytics dashboard providing real-time insights into bookings, revenue, user activity, and page visits for React Fast Training administrators.

## Dashboard Layout

### Header Section
- Welcome message with admin name
- Last login timestamp
- Quick actions dropdown
- Refresh data button

### Key Metrics Cards (Top Row)
1. **Total Revenue** - Current month with comparison to last month
2. **Active Bookings** - Upcoming courses with capacity
3. **New Users** - This month with growth percentage
4. **Page Views** - Today's count with trend

### Main Dashboard Sections

## 1. Financial Analytics

### Revenue Overview
```typescript
interface RevenueMetrics {
  currentMonth: number;
  lastMonth: number;
  yearToDate: number;
  growthPercentage: number;
  topCoursesByRevenue: CourseRevenue[];
  revenueByMonth: MonthlyRevenue[];
  projectedMonthEnd: number;
}
```

### Visual Components
- **Revenue Chart**: Line graph showing 12-month trend
- **Course Revenue Breakdown**: Pie chart by course type
- **Payment Status**: Donut chart (paid, pending, refunded)
- **Daily Revenue**: Bar chart for current month

### Key Metrics
- Average booking value
- Payment success rate
- Refund rate
- Outstanding payments

## 2. Booking Analytics

### Booking Metrics
```typescript
interface BookingMetrics {
  totalBookings: {
    today: number;
    thisWeek: number;
    thisMonth: number;
    total: number;
  };
  bookingsByStatus: {
    confirmed: number;
    pending: number;
    cancelled: number;
    completed: number;
  };
  occupancyRate: number;
  popularCourses: CoursePopularity[];
  bookingTrends: WeeklyTrend[];
}
```

### Visual Components
- **Booking Timeline**: Calendar heatmap
- **Course Occupancy**: Horizontal bar chart
- **Booking Status**: Stacked bar chart
- **Conversion Funnel**: Visits → Inquiries → Bookings

### Key Insights
- Peak booking times
- Course fill rates
- Cancellation patterns
- Lead time analysis

## 3. User Analytics

### User Metrics
```typescript
interface UserMetrics {
  totalUsers: number;
  newUsersToday: number;
  activeUsers: {
    daily: number;
    weekly: number;
    monthly: number;
  };
  usersByLocation: LocationData[];
  repeatCustomers: number;
  customerLifetimeValue: number;
}
```

### Visual Components
- **User Growth**: Area chart over time
- **Geographic Distribution**: Map visualization
- **User Engagement**: Cohort retention table
- **Customer Journey**: Sankey diagram

### Demographics
- Age distribution
- Location breakdown
- Course preferences
- Booking frequency

## 4. Page Analytics

### Traffic Metrics
```typescript
interface TrafficMetrics {
  pageViews: {
    today: number;
    yesterday: number;
    thisWeek: number;
    thisMonth: number;
  };
  uniqueVisitors: number;
  avgSessionDuration: string;
  bounceRate: number;
  topPages: PageStats[];
  trafficSources: TrafficSource[];
  deviceBreakdown: DeviceStats;
}
```

### Visual Components
- **Traffic Timeline**: Real-time line graph
- **Top Pages**: Table with visit counts
- **Device Types**: Pie chart (mobile/tablet/desktop)
- **Traffic Sources**: Stacked area chart

### Behavior Insights
- User flow through site
- Exit pages
- Search queries
- Form abandonment rates

## API Endpoints

### Dashboard Data Endpoints
```typescript
// Main dashboard overview
GET /api/admin/dashboard/overview
Response: {
  revenue: RevenueMetrics;
  bookings: BookingMetrics;
  users: UserMetrics;
  traffic: TrafficMetrics;
  alerts: DashboardAlert[];
}

// Detailed analytics endpoints
GET /api/admin/analytics/revenue?period=month&year=2025
GET /api/admin/analytics/bookings?startDate=&endDate=
GET /api/admin/analytics/users?segment=new
GET /api/admin/analytics/traffic?page=/courses
```

### Real-time Updates
```typescript
// WebSocket connection for live data
WS /api/admin/dashboard/live
Events:
- new_booking
- payment_received
- user_registration
- page_view
```

## Frontend Components

### 1. Metric Card Component
```typescript
interface MetricCardProps {
  title: string;
  value: string | number;
  change: number;
  changeType: 'increase' | 'decrease';
  icon: React.ReactNode;
  sparkline?: number[];
  onClick?: () => void;
}
```

### 2. Chart Components
```typescript
// Revenue Chart
interface RevenueChartProps {
  data: MonthlyRevenue[];
  period: 'week' | 'month' | 'year';
  onPeriodChange: (period: string) => void;
}

// Booking Calendar
interface BookingCalendarProps {
  bookings: BookingData[];
  onDateSelect: (date: Date) => void;
  view: 'month' | 'week' | 'day';
}
```

### 3. Data Table Component
```typescript
interface AnalyticsTableProps {
  data: any[];
  columns: ColumnDefinition[];
  sortable: boolean;
  filterable: boolean;
  exportable: boolean;
  pagination: PaginationConfig;
}
```

## Data Processing

### 1. Aggregation Queries
```sql
-- Revenue by month
SELECT 
  DATE_TRUNC('month', created_at) as month,
  SUM(payment_amount) as revenue,
  COUNT(*) as booking_count,
  AVG(payment_amount) as avg_booking_value
FROM bookings
WHERE payment_status = 'paid'
GROUP BY DATE_TRUNC('month', created_at)
ORDER BY month DESC;

-- Course popularity
SELECT 
  c.name,
  c.course_type,
  COUNT(b.id) as booking_count,
  SUM(b.payment_amount) as total_revenue,
  AVG(cs.current_capacity::float / c.max_capacity) as avg_occupancy
FROM courses c
JOIN course_schedules cs ON c.id = cs.course_id
JOIN bookings b ON cs.id = b.course_schedule_id
WHERE b.status != 'cancelled'
GROUP BY c.id, c.name, c.course_type
ORDER BY booking_count DESC;
```

### 2. Real-time Calculations
```typescript
// Calculate conversion rate
function calculateConversionRate(
  pageViews: number,
  bookings: number
): number {
  return (bookings / pageViews) * 100;
}

// Project month-end revenue
function projectMonthEndRevenue(
  currentRevenue: number,
  daysElapsed: number,
  totalDays: number
): number {
  const dailyAverage = currentRevenue / daysElapsed;
  return dailyAverage * totalDays;
}
```

### 3. Caching Strategy
```typescript
// Cache configuration
const cacheConfig = {
  overview: 5 * 60 * 1000, // 5 minutes
  revenue: 15 * 60 * 1000, // 15 minutes
  userStats: 30 * 60 * 1000, // 30 minutes
  traffic: 1 * 60 * 1000, // 1 minute (near real-time)
};

// Cache implementation
class DashboardCache {
  async getOrFetch(key: string, fetcher: () => Promise<any>) {
    const cached = await redis.get(key);
    if (cached) return JSON.parse(cached);
    
    const data = await fetcher();
    await redis.setex(
      key, 
      cacheConfig[key] || 300, 
      JSON.stringify(data)
    );
    
    return data;
  }
}
```

## Performance Optimization

### 1. Data Loading Strategy
- Lazy load detailed charts
- Progressive data loading
- Virtualized lists for large datasets
- Debounced real-time updates

### 2. Query Optimization
```typescript
// Batch multiple queries
async function getDashboardData(filters: DashboardFilters) {
  const [revenue, bookings, users, traffic] = await Promise.all([
    getRevenueMetrics(filters),
    getBookingMetrics(filters),
    getUserMetrics(filters),
    getTrafficMetrics(filters)
  ]);
  
  return { revenue, bookings, users, traffic };
}
```

### 3. Frontend Optimization
- Memoized calculations
- Virtualized data tables
- Lazy-loaded chart libraries
- Optimistic UI updates

## Export & Reporting

### 1. Export Formats
- PDF reports with charts
- Excel spreadsheets with raw data
- CSV for data analysis
- Scheduled email reports

### 2. Report Templates
```typescript
interface ReportTemplate {
  name: string;
  schedule: 'daily' | 'weekly' | 'monthly';
  metrics: string[];
  recipients: string[];
  format: 'pdf' | 'excel' | 'csv';
}
```

## Alert System

### 1. Alert Types
```typescript
interface DashboardAlert {
  id: string;
  type: 'info' | 'warning' | 'error' | 'success';
  title: string;
  message: string;
  metric?: string;
  threshold?: number;
  currentValue?: number;
  timestamp: Date;
  actionUrl?: string;
}
```

### 2. Alert Conditions
- Low course capacity (< 20%)
- High cancellation rate (> 15%)
- Payment failures spike
- Unusual traffic patterns
- Server performance issues

## Mobile Responsiveness

### 1. Mobile Layout
- Stacked metric cards
- Swipeable charts
- Collapsible sections
- Touch-friendly controls

### 2. Progressive Enhancement
- Core metrics first
- Charts load on demand
- Simplified visualizations
- Reduced data points

## Security Considerations

### 1. Data Access Control
- Admin-only access
- Activity logging
- IP whitelisting option
- Session monitoring

### 2. Data Privacy
- No PII in analytics
- Anonymized user data
- GDPR compliance
- Secure data transmission

## Implementation Timeline

### Phase 1 (Week 1)
- Basic metric cards
- Revenue overview
- Simple charts

### Phase 2 (Week 2)
- Booking analytics
- User metrics
- Advanced charts

### Phase 3 (Week 3)
- Traffic analytics
- Real-time updates
- Export functionality

### Phase 4 (Week 4)
- Alert system
- Report scheduling
- Performance optimization