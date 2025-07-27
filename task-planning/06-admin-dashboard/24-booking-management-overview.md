# Booking Management Overview

**Completion Status: 85%** ✅

## Overview
Comprehensive admin dashboard for managing all bookings, viewing real-time statistics, and monitoring business operations.please use ultra think to plan for this and you can createfiles withinthis folder if it helps like a CSV with tasks to keep track etc

## Implementation Status
- ✅ Dashboard page with statistics cards - COMPLETE
- ✅ Booking management table with filters - COMPLETE  
- ✅ Calendar view with capacity indicators - COMPLETE
- ✅ Reports page with charts - COMPLETE
- ✅ Client management system - COMPLETE
- ✅ Email templates system - COMPLETE
- ✅ Settings configuration - COMPLETE
- ⏳ Real-time updates with WebSocket - PENDING
- ⏳ Backend API integration - PENDING
- ⏳ Comprehensive testing - PENDING 

## Features

### 1. Dashboard Metrics
- Total bookings (today/week/month)
- Revenue statistics
- Upcoming sessions count
- Pending refund requests
- Attendance completion rate
- Available spots remaining

### 2. Booking List View
- Filterable/searchable table
- Quick status updates
- Bulk actions
- Export functionality
- Real-time updates

### 3. Calendar View
- Month/week/day views
- Drag-and-drop rescheduling
- Session capacity indicators
- Quick booking creation

## Database Queries

### Dashboard Statistics
```typescript
// backend-loopback4/src/services/admin-dashboard.service.ts
export class AdminDashboardService {
  static async getDashboardStats(dateRange?: { start: Date; end: Date }) {
    const now = new Date();
    const startOfDay = new Date(now.setHours(0, 0, 0, 0));
    const startOfWeek = new Date(now.setDate(now.getDate() - now.getDay()));
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    // Today's bookings
    const [todayBookings] = await db
      .select({ count: sql<number>`COUNT(*)`, revenue: sql<number>`SUM(${bookings.totalAmount})` })
      .from(bookings)
      .where(
        and(
          gte(bookings.createdAt, startOfDay),
          eq(bookings.status, 'confirmed')
        )
      );

    // This week's stats
    const [weekStats] = await db
      .select({ 
        count: sql<number>`COUNT(*)`, 
        revenue: sql<number>`SUM(${bookings.totalAmount})`,
        attendees: sql<number>`COUNT(DISTINCT ${bookingAttendees.id})`
      })
      .from(bookings)
      .leftJoin(bookingAttendees, eq(bookings.id, bookingAttendees.bookingId))
      .where(
        and(
          gte(bookings.createdAt, startOfWeek),
          eq(bookings.status, 'confirmed')
        )
      );

    // Upcoming sessions
    const upcomingSessions = await db
      .select({
        session: courseSessions,
        bookingsCount: sql<number>`COUNT(DISTINCT ${bookings.id})`,
        attendeesCount: sql<number>`COUNT(DISTINCT ${bookingAttendees.id})`,
        remainingSpots: sql<number>`${courseSessions.maxCapacity} - COUNT(DISTINCT ${bookingAttendees.id})`
      })
      .from(courseSessions)
      .leftJoin(bookings, eq(courseSessions.id, bookings.sessionId))
      .leftJoin(bookingAttendees, eq(bookings.id, bookingAttendees.bookingId))
      .where(
        and(
          gte(courseSessions.sessionDate, new Date()),
          eq(courseSessions.status, 'scheduled')
        )
      )
      .groupBy(courseSessions.id)
      .orderBy(courseSessions.sessionDate, courseSessions.startTime)
      .limit(10);

    // Pending refunds
    const [pendingRefunds] = await db
      .select({ 
        count: sql<number>`COUNT(*)`,
        totalAmount: sql<number>`SUM(${refunds.amount})`
      })
      .from(refunds)
      .where(eq(refunds.status, 'pending'));

    // Recent activity
    const recentActivity = await db
      .select({
        type: sql<string>`
          CASE 
            WHEN ${bookings.createdAt} = ${bookings.updatedAt} THEN 'new_booking'
            WHEN ${bookings.status} = 'cancelled' THEN 'cancellation'
            ELSE 'update'
          END
        `,
        booking: bookings,
        user: users,
        timestamp: bookings.updatedAt
      })
      .from(bookings)
      .innerJoin(users, eq(bookings.userId, users.id))
      .orderBy(desc(bookings.updatedAt))
      .limit(20);

    return {
      today: todayBookings,
      week: weekStats,
      upcomingSessions,
      pendingRefunds,
      recentActivity,
      chartData: await this.getChartData(dateRange)
    };
  }

  static async getChartData(dateRange?: { start: Date; end: Date }) {
    const days = 30; // Last 30 days
    const endDate = dateRange?.end || new Date();
    const startDate = dateRange?.start || new Date(endDate.getTime() - days * 24 * 60 * 60 * 1000);

    // Daily bookings and revenue
    const dailyStats = await db
      .select({
        date: sql<string>`DATE(${bookings.createdAt})`,
        bookings: sql<number>`COUNT(*)`,
        revenue: sql<number>`SUM(${bookings.totalAmount})`,
        attendees: sql<number>`COUNT(DISTINCT ${bookingAttendees.id})`
      })
      .from(bookings)
      .leftJoin(bookingAttendees, eq(bookings.id, bookingAttendees.bookingId))
      .where(
        and(
          gte(bookings.createdAt, startDate),
          lte(bookings.createdAt, endDate),
          eq(bookings.status, 'confirmed')
        )
      )
      .groupBy(sql`DATE(${bookings.createdAt})`)
      .orderBy(sql`DATE(${bookings.createdAt})`);

    // Course popularity
    const coursePopularity = await db
      .select({
        courseType: courseSessions.courseType,
        bookings: sql<number>`COUNT(DISTINCT ${bookings.id})`,
        attendees: sql<number>`COUNT(DISTINCT ${bookingAttendees.id})`,
        revenue: sql<number>`SUM(${bookings.totalAmount})`
      })
      .from(bookings)
      .innerJoin(courseSessions, eq(bookings.sessionId, courseSessions.id))
      .leftJoin(bookingAttendees, eq(bookings.id, bookingAttendees.bookingId))
      .where(
        and(
          gte(bookings.createdAt, startDate),
          lte(bookings.createdAt, endDate),
          eq(bookings.status, 'confirmed')
        )
      )
      .groupBy(courseSessions.courseType);

    return {
      dailyStats,
      coursePopularity
    };
  }
}
```

## Frontend Implementation

### Admin Dashboard Page
```typescript
// src/pages/admin/DashboardPage.tsx
import React, { useState, useEffect } from 'react';
import { Calendar, Users, PoundSterling, AlertCircle, TrendingUp } from 'lucide-react';
import { DashboardStats } from '@/components/admin/DashboardStats';
import { RevenueChart } from '@/components/admin/RevenueChart';
import { UpcomingSessionsList } from '@/components/admin/UpcomingSessionsList';
import { RecentActivityFeed } from '@/components/admin/RecentActivityFeed';
import { QuickActions } from '@/components/admin/QuickActions';

export const AdminDashboardPage: React.FC = () => {
  const [stats, setStats] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [dateRange, setDateRange] = useState({
    start: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
    end: new Date()
  });

  useEffect(() => {
    loadDashboardData();
    const interval = setInterval(loadDashboardData, 30000); // Refresh every 30 seconds
    return () => clearInterval(interval);
  }, [dateRange]);

  const loadDashboardData = async () => {
    try {
      const data = await adminApi.getDashboardStats(dateRange);
      setStats(data);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <DashboardSkeleton />;
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            Admin Dashboard
          </h1>
          <p className="mt-2 text-gray-600 dark:text-gray-400">
            Welcome back! Here's what's happening with your business today.
          </p>
        </div>

        {/* Quick Actions */}
        <QuickActions />

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <StatCard
            title="Today's Bookings"
            value={stats.today.count}
            change={`£${stats.today.revenue.toFixed(2)}`}
            icon={Calendar}
            color="blue"
          />
          <StatCard
            title="This Week"
            value={stats.week.count}
            change={`${stats.week.attendees} attendees`}
            icon={Users}
            color="green"
          />
          <StatCard
            title="Weekly Revenue"
            value={`£${stats.week.revenue.toFixed(2)}`}
            change="+12% from last week"
            icon={PoundSterling}
            color="purple"
          />
          <StatCard
            title="Pending Refunds"
            value={stats.pendingRefunds.count}
            change={`£${stats.pendingRefunds.totalAmount.toFixed(2)}`}
            icon={AlertCircle}
            color="red"
            alert={stats.pendingRefunds.count > 0}
          />
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Revenue Chart - 2 columns */}
          <div className="lg:col-span-2">
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
              <h2 className="text-lg font-semibold mb-4">Revenue Overview</h2>
              <RevenueChart data={stats.chartData} />
            </div>
          </div>

          {/* Upcoming Sessions - 1 column */}
          <div>
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
              <h2 className="text-lg font-semibold mb-4">Upcoming Sessions</h2>
              <UpcomingSessionsList sessions={stats.upcomingSessions} />
            </div>
          </div>
        </div>

        {/* Recent Activity */}
        <div className="mt-8">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
            <h2 className="text-lg font-semibold mb-4">Recent Activity</h2>
            <RecentActivityFeed activities={stats.recentActivity} />
          </div>
        </div>
      </div>
    </div>
  );
};
```

### Booking Management Table
```typescript
// src/components/admin/BookingManagementTable.tsx
import React, { useState, useMemo } from 'react';
import { Search, Filter, Download, MoreVertical } from 'lucide-react';
import { useTable, useSortBy, useFilters, usePagination } from 'react-table';
import { Menu } from '@headlessui/react';

export const BookingManagementTable: React.FC<{
  bookings: AdminBooking[];
  onUpdate: () => void;
}> = ({ bookings, onUpdate }) => {
  const [selectedBookings, setSelectedBookings] = useState<string[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');

  const columns = useMemo(
    () => [
      {
        Header: (
          <input
            type="checkbox"
            onChange={(e) => {
              if (e.target.checked) {
                setSelectedBookings(bookings.map(b => b.id));
              } else {
                setSelectedBookings([]);
              }
            }}
          />
        ),
        accessor: 'select',
        Cell: ({ row }) => (
          <input
            type="checkbox"
            checked={selectedBookings.includes(row.original.id)}
            onChange={(e) => {
              if (e.target.checked) {
                setSelectedBookings([...selectedBookings, row.original.id]);
              } else {
                setSelectedBookings(selectedBookings.filter(id => id !== row.original.id));
              }
            }}
          />
        ),
      },
      {
        Header: 'Reference',
        accessor: 'bookingReference',
        Cell: ({ value }) => (
          <span className="font-mono text-sm">{value}</span>
        ),
      },
      {
        Header: 'Client',
        accessor: 'userName',
        Cell: ({ row }) => (
          <div>
            <p className="font-medium">{row.original.userName}</p>
            <p className="text-sm text-gray-500">{row.original.userEmail}</p>
          </div>
        ),
      },
      {
        Header: 'Course',
        accessor: 'courseType',
        Cell: ({ row }) => (
          <div>
            <p className="font-medium">{row.original.courseType}</p>
            <p className="text-sm text-gray-500">
              {format(new Date(row.original.sessionDate), 'dd MMM yyyy')}
            </p>
          </div>
        ),
      },
      {
        Header: 'Attendees',
        accessor: 'attendeeCount',
        Cell: ({ value }) => (
          <span className="text-center">{value}</span>
        ),
      },
      {
        Header: 'Status',
        accessor: 'status',
        Cell: ({ value }) => {
          const statusColors = {
            confirmed: 'bg-green-100 text-green-800',
            pending: 'bg-yellow-100 text-yellow-800',
            cancelled: 'bg-red-100 text-red-800',
          };
          return (
            <span className={`px-3 py-1 rounded-full text-xs font-medium ${statusColors[value]}`}>
              {value}
            </span>
          );
        },
      },
      {
        Header: 'Amount',
        accessor: 'totalAmount',
        Cell: ({ value }) => `£${value.toFixed(2)}`,
      },
      {
        Header: 'Actions',
        Cell: ({ row }) => (
          <Menu as="div" className="relative">
            <Menu.Button className="p-1 hover:bg-gray-100 rounded">
              <MoreVertical className="w-5 h-5" />
            </Menu.Button>
            <Menu.Items className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg py-1 z-10">
              <Menu.Item>
                {({ active }) => (
                  <button
                    onClick={() => viewBookingDetails(row.original.id)}
                    className={`block w-full text-left px-4 py-2 text-sm ${active ? 'bg-gray-100' : ''}`}
                  >
                    View Details
                  </button>
                )}
              </Menu.Item>
              <Menu.Item>
                {({ active }) => (
                  <button
                    onClick={() => editBooking(row.original.id)}
                    className={`block w-full text-left px-4 py-2 text-sm ${active ? 'bg-gray-100' : ''}`}
                  >
                    Edit Booking
                  </button>
                )}
              </Menu.Item>
              <Menu.Item>
                {({ active }) => (
                  <button
                    onClick={() => cancelBooking(row.original.id)}
                    className={`block w-full text-left px-4 py-2 text-sm text-red-600 ${active ? 'bg-gray-100' : ''}`}
                  >
                    Cancel Booking
                  </button>
                )}
              </Menu.Item>
            </Menu.Items>
          </Menu>
        ),
      },
    ],
    [selectedBookings, bookings]
  );

  const filteredData = useMemo(() => {
    return bookings.filter(booking => {
      const matchesSearch = searchTerm === '' || 
        booking.bookingReference.toLowerCase().includes(searchTerm.toLowerCase()) ||
        booking.userName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        booking.userEmail.toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchesStatus = filterStatus === 'all' || booking.status === filterStatus;
      
      return matchesSearch && matchesStatus;
    });
  }, [bookings, searchTerm, filterStatus]);

  const tableInstance = useTable(
    {
      columns,
      data: filteredData,
    },
    useFilters,
    useSortBy,
    usePagination
  );

  const handleBulkAction = async (action: string) => {
    if (selectedBookings.length === 0) return;

    switch (action) {
      case 'email':
        // Open bulk email modal
        break;
      case 'export':
        await exportBookings(selectedBookings);
        break;
      case 'cancel':
        if (confirm(`Cancel ${selectedBookings.length} bookings?`)) {
          await adminApi.bulkCancelBookings(selectedBookings);
          onUpdate();
        }
        break;
    }
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow">
      {/* Table Header */}
      <div className="p-6 border-b">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div className="flex-1 max-w-md">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search bookings..."
                className="w-full pl-10 pr-4 py-2 border rounded-lg"
              />
            </div>
          </div>

          <div className="flex items-center gap-3">
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="px-4 py-2 border rounded-lg"
            >
              <option value="all">All Status</option>
              <option value="confirmed">Confirmed</option>
              <option value="pending">Pending</option>
              <option value="cancelled">Cancelled</option>
            </select>

            {selectedBookings.length > 0 && (
              <div className="flex items-center gap-2">
                <span className="text-sm text-gray-500">
                  {selectedBookings.length} selected
                </span>
                <button
                  onClick={() => handleBulkAction('email')}
                  className="px-3 py-1 text-sm border rounded hover:bg-gray-50"
                >
                  Email
                </button>
                <button
                  onClick={() => handleBulkAction('export')}
                  className="px-3 py-1 text-sm border rounded hover:bg-gray-50"
                >
                  Export
                </button>
              </div>
            )}

            <button
              onClick={() => exportAllBookings()}
              className="p-2 border rounded-lg hover:bg-gray-50"
              title="Export all"
            >
              <Download className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-gray-50 dark:bg-gray-700">
            {tableInstance.headerGroups.map(headerGroup => (
              <tr key={headerGroup.id}>
                {headerGroup.headers.map(column => (
                  <th
                    key={column.id}
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                    {...column.getSortByToggleProps()}
                  >
                    {column.render('Header')}
                    {column.isSorted && (
                      <span>{column.isSortedDesc ? ' ↓' : ' ↑'}</span>
                    )}
                  </th>
                ))}
              </tr>
            ))}
          </thead>
          <tbody className="divide-y divide-gray-200">
            {tableInstance.rows.map(row => {
              tableInstance.prepareRow(row);
              return (
                <tr key={row.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                  {row.cells.map(cell => (
                    <td key={cell.column.id} className="px-6 py-4 whitespace-nowrap">
                      {cell.render('Cell')}
                    </td>
                  ))}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      <div className="p-4 border-t flex items-center justify-between">
        <div className="text-sm text-gray-700">
          Showing {tableInstance.state.pageIndex * tableInstance.state.pageSize + 1} to{' '}
          {Math.min(
            (tableInstance.state.pageIndex + 1) * tableInstance.state.pageSize,
            filteredData.length
          )}{' '}
          of {filteredData.length} results
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => tableInstance.previousPage()}
            disabled={!tableInstance.canPreviousPage}
            className="px-3 py-1 border rounded disabled:opacity-50"
          >
            Previous
          </button>
          <button
            onClick={() => tableInstance.nextPage()}
            disabled={!tableInstance.canNextPage}
            className="px-3 py-1 border rounded disabled:opacity-50"
          >
            Next
          </button>
        </div>
      </div>
    </div>
  );
};
```

### Calendar View Component
```typescript
// src/components/admin/BookingCalendarView.tsx
import React, { useState } from 'react';
import { Calendar as BigCalendar, dateFnsLocalizer } from 'react-big-calendar';
import format from 'date-fns/format';
import parse from 'date-fns/parse';
import startOfWeek from 'date-fns/startOfWeek';
import getDay from 'date-fns/getDay';
import 'react-big-calendar/lib/css/react-big-calendar.css';

const locales = {
  'en-GB': require('date-fns/locale/en-GB'),
};

const localizer = dateFnsLocalizer({
  format,
  parse,
  startOfWeek,
  getDay,
  locales,
});

export const BookingCalendarView: React.FC<{
  sessions: CalendarSession[];
  onSessionClick: (session: CalendarSession) => void;
  onSlotClick: (slotInfo: any) => void;
}> = ({ sessions, onSessionClick, onSlotClick }) => {
  const [view, setView] = useState<'month' | 'week' | 'day'>('month');
  const [date, setDate] = useState(new Date());

  const events = sessions.map(session => ({
    id: session.id,
    title: `${session.courseType} (${session.bookedCount}/${session.maxCapacity})`,
    start: new Date(`${session.sessionDate}T${session.startTime}`),
    end: new Date(`${session.sessionDate}T${session.endTime}`),
    resource: session,
  }));

  const eventStyleGetter = (event: any) => {
    const session = event.resource;
    const percentFull = (session.bookedCount / session.maxCapacity) * 100;
    
    let backgroundColor = '#10B981'; // Green
    if (percentFull >= 100) {
      backgroundColor = '#EF4444'; // Red - Full
    } else if (percentFull >= 75) {
      backgroundColor = '#F59E0B'; // Amber - Nearly full
    }

    return {
      style: {
        backgroundColor,
        borderRadius: '5px',
        opacity: 0.8,
        color: 'white',
        border: '0px',
        display: 'block',
      },
    };
  };

  return (
    <div className="h-[600px]">
      <BigCalendar
        localizer={localizer}
        events={events}
        startAccessor="start"
        endAccessor="end"
        style={{ height: '100%' }}
        view={view}
        onView={setView}
        date={date}
        onNavigate={setDate}
        onSelectEvent={(event) => onSessionClick(event.resource)}
        onSelectSlot={onSlotClick}
        selectable
        eventPropGetter={eventStyleGetter}
        views={['month', 'week', 'day']}
        components={{
          event: ({ event }) => (
            <div className="p-1">
              <div className="font-semibold text-xs">{event.resource.courseType}</div>
              <div className="text-xs">
                {event.resource.bookedCount}/{event.resource.maxCapacity}
              </div>
            </div>
          ),
        }}
      />
    </div>
  );
};
```

## Mobile Responsive Admin View

```typescript
// src/components/admin/MobileAdminDashboard.tsx
import React from 'react';
import { Menu, X, Home, Calendar, Users, PoundSterling } from 'lucide-react';

export const MobileAdminDashboard: React.FC = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Mobile Header */}
      <div className="bg-white shadow-sm fixed top-0 left-0 right-0 z-40">
        <div className="flex items-center justify-between p-4">
          <button
            onClick={() => setSidebarOpen(true)}
            className="p-2 hover:bg-gray-100 rounded-lg"
          >
            <Menu className="w-6 h-6" />
          </button>
          <h1 className="font-semibold">Admin Dashboard</h1>
          <div className="w-10" /> {/* Spacer */}
        </div>
      </div>

      {/* Mobile Sidebar */}
      <div className={`fixed inset-0 z-50 ${sidebarOpen ? 'block' : 'hidden'}`}>
        <div className="absolute inset-0 bg-black opacity-50" onClick={() => setSidebarOpen(false)} />
        <div className="absolute left-0 top-0 bottom-0 w-64 bg-white">
          <div className="p-4">
            <button
              onClick={() => setSidebarOpen(false)}
              className="p-2 hover:bg-gray-100 rounded-lg mb-4"
            >
              <X className="w-6 h-6" />
            </button>
            <nav className="space-y-2">
              <NavItem icon={Home} label="Dashboard" href="/admin" />
              <NavItem icon={Calendar} label="Bookings" href="/admin/bookings" />
              <NavItem icon={Users} label="Clients" href="/admin/clients" />
              <NavItem icon={PoundSterling} label="Finance" href="/admin/finance" />
            </nav>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="pt-16 px-4 pb-4">
        {/* Quick Stats */}
        <div className="grid grid-cols-2 gap-4 mb-6">
          <QuickStatCard
            title="Today"
            value="3"
            subtitle="bookings"
            color="blue"
          />
          <QuickStatCard
            title="Revenue"
            value="£225"
            subtitle="today"
            color="green"
          />
        </div>

        {/* Recent Bookings */}
        <div className="bg-white rounded-lg shadow p-4">
          <h2 className="font-semibold mb-3">Recent Bookings</h2>
          <div className="space-y-3">
            {recentBookings.map(booking => (
              <MobileBookingCard key={booking.id} booking={booking} />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
```

## Testing

1. Test real-time statistics updates
2. Test bulk actions on bookings
3. Test calendar drag-and-drop
4. Test export functionality
5. Test search and filtering
6. Test mobile responsive layout
7. Test performance with large datasets
8. Test concurrent admin sessions