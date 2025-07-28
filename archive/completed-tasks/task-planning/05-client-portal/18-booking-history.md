# Booking History

**Status: COMPLETED** ✅

## Overview
Comprehensive booking history view showing all past and current bookings with filtering, search, and detailed information access.
please use ultra think to plan for this and you can createfiles withinthis folder if it helps like a CSV with tasks to keep track etc 
## Features

### 1. Booking List
- Chronological list of all bookings
- Status indicators (upcoming, completed, cancelled)
- Quick booking details
- Search by reference or course name
- Filter by status, date range, course type

### 2. Booking Details
- Full booking information
- Attendee list
- Payment history
- Special requirements
- Course completion status
- Certificate availability

### 3. Actions
- Download invoice
- View/download certificate (completed courses)
- Rebook similar course
- View feedback (if submitted)

## Database Queries

### Get Booking History
```typescript
// backend-loopback4/src/services/booking-history.service.ts
export class BookingHistoryService {
  static async getUserBookingHistory(
    userId: string,
    filters?: {
      status?: string;
      startDate?: Date;
      endDate?: Date;
      courseType?: string;
      searchTerm?: string;
    },
    pagination?: {
      limit: number;
      offset: number;
    }
  ) {
    let query = db
      .select({
        booking: bookings,
        session: courseSessions,
        attendeeCount: sql<number>`COUNT(DISTINCT ${bookingAttendees.id})`,
        payment: payments,
        refund: refunds,
        invoice: invoices,
        hasSpecialRequirements: sql<boolean>`EXISTS(
          SELECT 1 FROM ${specialRequirements} 
          WHERE ${specialRequirements.bookingId} = ${bookings.id}
        )`,
        certificateAvailable: sql<boolean>`
          CASE 
            WHEN ${courseSessions.status} = 'completed' 
            AND EXISTS(
              SELECT 1 FROM ${attendance} 
              WHERE ${attendance.bookingId} = ${bookings.id} 
              AND ${attendance.status} = 'present'
            ) THEN true 
            ELSE false 
          END
        `,
      })
      .from(bookings)
      .innerJoin(courseSessions, eq(bookings.sessionId, courseSessions.id))
      .leftJoin(bookingAttendees, eq(bookings.id, bookingAttendees.bookingId))
      .leftJoin(payments, eq(bookings.id, payments.bookingId))
      .leftJoin(refunds, eq(bookings.id, refunds.bookingId))
      .leftJoin(invoices, eq(bookings.id, invoices.bookingId))
      .where(eq(bookings.userId, userId))
      .groupBy(
        bookings.id,
        courseSessions.id,
        payments.id,
        refunds.id,
        invoices.id
      );

    // Apply filters
    const conditions = [eq(bookings.userId, userId)];

    if (filters?.status) {
      if (filters.status === 'upcoming') {
        conditions.push(
          and(
            eq(bookings.status, 'confirmed'),
            gte(courseSessions.sessionDate, new Date())
          )
        );
      } else if (filters.status === 'completed') {
        conditions.push(eq(courseSessions.status, 'completed'));
      } else {
        conditions.push(eq(bookings.status, filters.status));
      }
    }

    if (filters?.startDate) {
      conditions.push(gte(courseSessions.sessionDate, filters.startDate));
    }

    if (filters?.endDate) {
      conditions.push(lte(courseSessions.sessionDate, filters.endDate));
    }

    if (filters?.courseType) {
      conditions.push(eq(courseSessions.courseType, filters.courseType));
    }

    if (filters?.searchTerm) {
      conditions.push(
        or(
          ilike(bookings.bookingReference, `%${filters.searchTerm}%`),
          ilike(courseSessions.courseType, `%${filters.searchTerm}%`)
        )
      );
    }

    query = query.where(and(...conditions));

    // Order by session date descending
    query = query.orderBy(desc(courseSessions.sessionDate));

    // Apply pagination
    if (pagination) {
      query = query.limit(pagination.limit).offset(pagination.offset);
    }

    const results = await query;

    // Get total count for pagination
    const [{ count }] = await db
      .select({ count: sql<number>`COUNT(DISTINCT ${bookings.id})` })
      .from(bookings)
      .innerJoin(courseSessions, eq(bookings.sessionId, courseSessions.id))
      .where(and(...conditions));

    return {
      bookings: results,
      total: count,
      hasMore: pagination ? count > pagination.offset + pagination.limit : false,
    };
  }

  static async getBookingDetails(bookingId: string, userId: string) {
    const booking = await db
      .select({
        booking: bookings,
        session: courseSessions,
        payment: payments,
        refund: refunds,
        invoice: invoices,
      })
      .from(bookings)
      .innerJoin(courseSessions, eq(bookings.sessionId, courseSessions.id))
      .leftJoin(payments, eq(bookings.id, payments.bookingId))
      .leftJoin(refunds, eq(bookings.id, refunds.bookingId))
      .leftJoin(invoices, eq(bookings.id, invoices.bookingId))
      .where(
        and(
          eq(bookings.id, bookingId),
          eq(bookings.userId, userId)
        )
      );

    if (!booking.length) {
      return null;
    }

    // Get attendees
    const attendees = await db
      .select()
      .from(bookingAttendees)
      .where(eq(bookingAttendees.bookingId, bookingId));

    // Get special requirements
    const requirements = await db
      .select()
      .from(specialRequirements)
      .where(eq(specialRequirements.bookingId, bookingId));

    // Get attendance records
    const attendance = await db
      .select()
      .from(attendance)
      .where(eq(attendance.bookingId, bookingId));

    return {
      ...booking[0],
      attendees,
      requirements,
      attendance,
    };
  }
}
```

## Frontend Implementation

### Booking History Page
```typescript
// src/pages/client/BookingHistoryPage.tsx
import React, { useState, useEffect, useCallback } from 'react';
import { Search, Filter, Download } from 'lucide-react';
import { BookingFilters } from '@/components/client/BookingFilters';
import { BookingHistoryList } from '@/components/client/BookingHistoryList';
import { BookingDetailModal } from '@/components/client/BookingDetailModal';
import { useDebounce } from '@/hooks/useDebounce';

export const BookingHistoryPage: React.FC = () => {
  const [bookings, setBookings] = useState<BookingHistoryItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filters, setFilters] = useState({
    status: '',
    startDate: null,
    endDate: null,
    courseType: '',
  });
  const [pagination, setPagination] = useState({
    limit: 10,
    offset: 0,
    total: 0,
  });
  const [selectedBooking, setSelectedBooking] = useState<string | null>(null);
  const [showFilters, setShowFilters] = useState(false);

  const debouncedSearch = useDebounce(searchTerm, 300);

  useEffect(() => {
    loadBookings();
  }, [debouncedSearch, filters, pagination.offset]);

  const loadBookings = async () => {
    setLoading(true);
    try {
      const response = await clientApi.getBookingHistory({
        ...filters,
        searchTerm: debouncedSearch,
        limit: pagination.limit,
        offset: pagination.offset,
      });
      
      setBookings(response.bookings);
      setPagination(prev => ({ ...prev, total: response.total }));
    } finally {
      setLoading(false);
    }
  };

  const handleExportHistory = async () => {
    const csv = await clientApi.exportBookingHistory(filters);
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `booking-history-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
              Booking History
            </h1>
            <p className="mt-2 text-gray-600 dark:text-gray-400">
              View and manage all your past and upcoming bookings
            </p>
          </div>
          
          <button
            onClick={handleExportHistory}
            className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700"
          >
            <Download className="w-4 h-4" />
            Export CSV
          </button>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="mb-6 space-y-4">
        <div className="flex gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search by booking reference or course name..."
              className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800"
            />
          </div>
          
          <button
            onClick={() => setShowFilters(!showFilters)}
            className="flex items-center gap-2 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700"
          >
            <Filter className="w-4 h-4" />
            Filters
          </button>
        </div>

        {showFilters && (
          <BookingFilters
            filters={filters}
            onChange={setFilters}
            onReset={() => setFilters({
              status: '',
              startDate: null,
              endDate: null,
              courseType: '',
            })}
          />
        )}
      </div>

      {/* Booking List */}
      <BookingHistoryList
        bookings={bookings}
        loading={loading}
        onSelectBooking={setSelectedBooking}
        pagination={pagination}
        onPageChange={(newOffset) => 
          setPagination(prev => ({ ...prev, offset: newOffset }))
        }
      />

      {/* Booking Detail Modal */}
      {selectedBooking && (
        <BookingDetailModal
          bookingId={selectedBooking}
          isOpen={!!selectedBooking}
          onClose={() => setSelectedBooking(null)}
          onUpdate={loadBookings}
        />
      )}
    </div>
  );
};
```

### Booking History List Component
```typescript
// src/components/client/BookingHistoryList.tsx
import React from 'react';
import { Calendar, MapPin, Users, FileText, Award, XCircle } from 'lucide-react';
import { format } from 'date-fns';

interface BookingHistoryListProps {
  bookings: BookingHistoryItem[];
  loading: boolean;
  onSelectBooking: (bookingId: string) => void;
  pagination: {
    limit: number;
    offset: number;
    total: number;
  };
  onPageChange: (offset: number) => void;
}

export const BookingHistoryList: React.FC<BookingHistoryListProps> = ({
  bookings,
  loading,
  onSelectBooking,
  pagination,
  onPageChange,
}) => {
  const getStatusBadge = (booking: BookingHistoryItem) => {
    const now = new Date();
    const sessionDate = new Date(booking.session.sessionDate);
    
    if (booking.booking.status === 'cancelled') {
      return {
        label: 'Cancelled',
        className: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400',
        icon: XCircle,
      };
    }
    
    if (booking.refund && booking.refund.status === 'processed') {
      return {
        label: 'Refunded',
        className: 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-400',
        icon: XCircle,
      };
    }
    
    if (booking.session.status === 'completed') {
      return {
        label: 'Completed',
        className: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400',
        icon: Award,
      };
    }
    
    if (sessionDate > now) {
      return {
        label: 'Upcoming',
        className: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400',
        icon: Calendar,
      };
    }
    
    return {
      label: 'Past',
      className: 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-400',
      icon: Calendar,
    };
  };

  if (loading && bookings.length === 0) {
    return <BookingHistorySkeleton />;
  }

  if (!loading && bookings.length === 0) {
    return (
      <div className="text-center py-12">
        <FileText className="w-12 h-12 text-gray-400 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-gray-900 dark:text-white">
          No bookings found
        </h3>
        <p className="mt-2 text-gray-600 dark:text-gray-400">
          Adjust your filters or search term to see results
        </p>
      </div>
    );
  }

  const totalPages = Math.ceil(pagination.total / pagination.limit);
  const currentPage = Math.floor(pagination.offset / pagination.limit) + 1;

  return (
    <div className="space-y-4">
      {bookings.map((booking) => {
        const status = getStatusBadge(booking);
        const StatusIcon = status.icon;
        
        return (
          <div
            key={booking.booking.id}
            onClick={() => onSelectBooking(booking.booking.id)}
            className="bg-white dark:bg-gray-800 rounded-lg shadow hover:shadow-lg transition-shadow cursor-pointer p-6"
          >
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-2">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                    {booking.session.courseType}
                  </h3>
                  <span className={`px-3 py-1 rounded-full text-xs font-medium flex items-center gap-1 ${status.className}`}>
                    <StatusIcon className="w-3 h-3" />
                    {status.label}
                  </span>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm text-gray-600 dark:text-gray-400">
                  <div className="flex items-center gap-2">
                    <Calendar className="w-4 h-4" />
                    <span>{format(new Date(booking.session.sessionDate), 'dd MMM yyyy')}</span>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <MapPin className="w-4 h-4" />
                    <span>{booking.session.location}</span>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <Users className="w-4 h-4" />
                    <span>{booking.attendeeCount} attendee{booking.attendeeCount !== 1 ? 's' : ''}</span>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <FileText className="w-4 h-4" />
                    <span className="font-mono">{booking.booking.bookingReference}</span>
                  </div>
                </div>

                <div className="mt-3 flex items-center gap-4">
                  {booking.payment && (
                    <span className="text-sm text-gray-500">
                      Paid: £{booking.payment.amount}
                    </span>
                  )}
                  
                  {booking.certificateAvailable && (
                    <span className="text-sm text-green-600 dark:text-green-400 flex items-center gap-1">
                      <Award className="w-4 h-4" />
                      Certificate Available
                    </span>
                  )}
                  
                  {booking.hasSpecialRequirements && (
                    <span className="text-sm text-yellow-600 dark:text-yellow-400">
                      Special Requirements
                    </span>
                  )}
                </div>
              </div>

              <div className="ml-4 text-gray-400">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </div>
            </div>
          </div>
        );
      })}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between pt-4">
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Showing {pagination.offset + 1} to {Math.min(pagination.offset + pagination.limit, pagination.total)} of {pagination.total} bookings
          </p>
          
          <div className="flex gap-2">
            <button
              onClick={() => onPageChange(Math.max(0, pagination.offset - pagination.limit))}
              disabled={currentPage === 1}
              className="px-3 py-1 border rounded-lg disabled:opacity-50"
            >
              Previous
            </button>
            
            <span className="px-3 py-1">
              Page {currentPage} of {totalPages}
            </span>
            
            <button
              onClick={() => onPageChange(pagination.offset + pagination.limit)}
              disabled={currentPage === totalPages}
              className="px-3 py-1 border rounded-lg disabled:opacity-50"
            >
              Next
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
```

### Booking Detail Modal
```typescript
// src/components/client/BookingDetailModal.tsx
import React, { useState, useEffect } from 'react';
import { X, Download, Calendar, MapPin, Users, CreditCard, FileText, Award } from 'lucide-react';
import { format } from 'date-fns';

interface BookingDetailModalProps {
  bookingId: string;
  isOpen: boolean;
  onClose: () => void;
  onUpdate: () => void;
}

export const BookingDetailModal: React.FC<BookingDetailModalProps> = ({
  bookingId,
  isOpen,
  onClose,
  onUpdate,
}) => {
  const [booking, setBooking] = useState<BookingDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'details' | 'attendees' | 'payment'>('details');

  useEffect(() => {
    if (isOpen && bookingId) {
      loadBookingDetails();
    }
  }, [bookingId, isOpen]);

  const loadBookingDetails = async () => {
    setLoading(true);
    try {
      const data = await clientApi.getBookingDetails(bookingId);
      setBooking(data);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  const canDownloadCertificate = booking?.session.status === 'completed' && 
    booking.attendance.some(a => a.status === 'present');

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-lg max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b">
          <div>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
              Booking Details
            </h2>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
              Reference: {booking?.booking.bookingReference}
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {loading ? (
          <div className="flex-1 flex items-center justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
          </div>
        ) : booking ? (
          <>
            {/* Tabs */}
            <div className="flex border-b">
              <button
                onClick={() => setActiveTab('details')}
                className={`px-6 py-3 font-medium ${
                  activeTab === 'details'
                    ? 'text-primary-600 border-b-2 border-primary-600'
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                Course Details
              </button>
              <button
                onClick={() => setActiveTab('attendees')}
                className={`px-6 py-3 font-medium ${
                  activeTab === 'attendees'
                    ? 'text-primary-600 border-b-2 border-primary-600'
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                Attendees ({booking.attendees.length})
              </button>
              <button
                onClick={() => setActiveTab('payment')}
                className={`px-6 py-3 font-medium ${
                  activeTab === 'payment'
                    ? 'text-primary-600 border-b-2 border-primary-600'
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                Payment & Invoice
              </button>
            </div>

            {/* Tab Content */}
            <div className="flex-1 overflow-y-auto p-6">
              {activeTab === 'details' && (
                <div className="space-y-6">
                  {/* Course Information */}
                  <div>
                    <h3 className="text-lg font-semibold mb-4">Course Information</h3>
                    <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-4 space-y-3">
                      <div className="flex items-center gap-3">
                        <Calendar className="w-5 h-5 text-gray-500" />
                        <div>
                          <p className="font-medium">{booking.session.courseType}</p>
                          <p className="text-sm text-gray-600 dark:text-gray-400">
                            {format(new Date(booking.session.sessionDate), 'EEEE, d MMMM yyyy')}
                          </p>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-3">
                        <MapPin className="w-5 h-5 text-gray-500" />
                        <div>
                          <p className="font-medium">{booking.session.location}</p>
                          <p className="text-sm text-gray-600 dark:text-gray-400">
                            {booking.session.startTime} - {booking.session.endTime}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Special Requirements */}
                  {booking.requirements.length > 0 && (
                    <div>
                      <h3 className="text-lg font-semibold mb-4">Special Requirements</h3>
                      <div className="bg-yellow-50 dark:bg-yellow-900/20 rounded-lg p-4">
                        <ul className="space-y-2">
                          {booking.requirements.map((req, index) => (
                            <li key={index} className="text-sm">
                              <strong>{req.category}:</strong> {req.requirementType}
                              {req.details && <p className="text-gray-600 dark:text-gray-400 ml-4">{req.details}</p>}
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  )}

                  {/* Actions */}
                  <div className="flex flex-wrap gap-3">
                    {booking.invoice && (
                      <button
                        onClick={() => downloadInvoice(booking.invoice.id)}
                        className="flex items-center gap-2 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700"
                      >
                        <FileText className="w-4 h-4" />
                        Download Invoice
                      </button>
                    )}
                    
                    {canDownloadCertificate && (
                      <button
                        onClick={() => downloadCertificate(booking.booking.id)}
                        className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
                      >
                        <Award className="w-4 h-4" />
                        Download Certificate
                      </button>
                    )}
                    
                    <button
                      onClick={() => addToCalendar(booking)}
                      className="flex items-center gap-2 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700"
                    >
                      <Calendar className="w-4 h-4" />
                      Add to Calendar
                    </button>
                  </div>
                </div>
              )}

              {activeTab === 'attendees' && (
                <div>
                  <h3 className="text-lg font-semibold mb-4">Attendee List</h3>
                  <div className="space-y-3">
                    {booking.attendees.map((attendee, index) => (
                      <div
                        key={attendee.id}
                        className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg"
                      >
                        <div>
                          <p className="font-medium">
                            {attendee.name}
                            {attendee.isPrimary && (
                              <span className="ml-2 text-xs bg-primary-100 text-primary-700 px-2 py-0.5 rounded-full">
                                Primary Contact
                              </span>
                            )}
                          </p>
                          <p className="text-sm text-gray-600 dark:text-gray-400">{attendee.email}</p>
                        </div>
                        
                        {booking.attendance.find(a => a.userId === attendee.id) && (
                          <div className="text-sm">
                            {booking.attendance.find(a => a.userId === attendee.id)?.status === 'present' ? (
                              <span className="text-green-600 dark:text-green-400">✓ Attended</span>
                            ) : (
                              <span className="text-red-600 dark:text-red-400">✗ Absent</span>
                            )}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {activeTab === 'payment' && (
                <div className="space-y-6">
                  {/* Payment Information */}
                  {booking.payment && (
                    <div>
                      <h3 className="text-lg font-semibold mb-4">Payment Information</h3>
                      <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-4 space-y-2">
                        <div className="flex justify-between">
                          <span className="text-gray-600 dark:text-gray-400">Amount Paid:</span>
                          <span className="font-medium">£{booking.payment.amount}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600 dark:text-gray-400">Payment Date:</span>
                          <span>{format(new Date(booking.payment.createdAt), 'dd/MM/yyyy')}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600 dark:text-gray-400">Status:</span>
                          <span className="text-green-600 dark:text-green-400">✓ Paid</span>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Refund Information */}
                  {booking.refund && (
                    <div>
                      <h3 className="text-lg font-semibold mb-4">Refund Information</h3>
                      <div className="bg-red-50 dark:bg-red-900/20 rounded-lg p-4 space-y-2">
                        <div className="flex justify-between">
                          <span className="text-gray-600 dark:text-gray-400">Refund Amount:</span>
                          <span className="font-medium">£{booking.refund.amount}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600 dark:text-gray-400">Status:</span>
                          <span className="capitalize">{booking.refund.status}</span>
                        </div>
                        {booking.refund.processedAt && (
                          <div className="flex justify-between">
                            <span className="text-gray-600 dark:text-gray-400">Processed:</span>
                            <span>{format(new Date(booking.refund.processedAt), 'dd/MM/yyyy')}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Invoice */}
                  {booking.invoice && (
                    <div>
                      <h3 className="text-lg font-semibold mb-4">Invoice</h3>
                      <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                        <div>
                          <p className="font-medium">{booking.invoice.invoiceNumber}</p>
                          <p className="text-sm text-gray-600 dark:text-gray-400">
                            Issued: {format(new Date(booking.invoice.issueDate), 'dd/MM/yyyy')}
                          </p>
                        </div>
                        <button
                          onClick={() => downloadInvoice(booking.invoice.id)}
                          className="p-2 text-primary-600 hover:bg-primary-50 rounded-lg"
                        >
                          <Download className="w-5 h-5" />
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="p-6 border-t bg-gray-50 dark:bg-gray-700/50">
              <div className="flex justify-between items-center">
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Booked on: {format(new Date(booking.booking.createdAt), 'dd/MM/yyyy HH:mm')}
                </p>
                <button
                  onClick={onClose}
                  className="px-4 py-2 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600"
                >
                  Close
                </button>
              </div>
            </div>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center">
            <p className="text-gray-500">Failed to load booking details</p>
          </div>
        )}
      </div>
    </div>
  );
};
```

### Certificate Download Component
```typescript
// src/components/client/CertificateDownload.tsx
import React, { useState } from 'react';
import { Award, Download, Eye } from 'lucide-react';

interface CertificateDownloadProps {
  bookingId: string;
  courseName: string;
  completionDate: Date;
}

export const CertificateDownload: React.FC<CertificateDownloadProps> = ({
  bookingId,
  courseName,
  completionDate,
}) => {
  const [downloading, setDownloading] = useState(false);
  const [previewing, setPreviewing] = useState(false);

  const handleDownload = async () => {
    setDownloading(true);
    try {
      const response = await clientApi.downloadCertificate(bookingId);
      const blob = new Blob([response.data], { type: 'application/pdf' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `certificate-${bookingId}.pdf`;
      a.click();
    } finally {
      setDownloading(false);
    }
  };

  const handlePreview = async () => {
    setPreviewing(true);
    try {
      const response = await clientApi.downloadCertificate(bookingId);
      const blob = new Blob([response.data], { type: 'application/pdf' });
      const url = window.URL.createObjectURL(blob);
      window.open(url, '_blank');
    } finally {
      setPreviewing(false);
    }
  };

  return (
    <div className="bg-gradient-to-r from-green-50 to-green-100 dark:from-green-900/20 dark:to-green-800/20 rounded-lg p-6">
      <div className="flex items-center gap-4">
        <div className="p-3 bg-green-200 dark:bg-green-800 rounded-full">
          <Award className="w-8 h-8 text-green-700 dark:text-green-300" />
        </div>
        
        <div className="flex-1">
          <h4 className="font-semibold text-gray-900 dark:text-white">
            Certificate Available
          </h4>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            {courseName} - Completed {format(completionDate, 'dd MMMM yyyy')}
          </p>
        </div>

        <div className="flex gap-2">
          <button
            onClick={handlePreview}
            disabled={previewing}
            className="p-2 text-green-700 dark:text-green-400 hover:bg-green-200 dark:hover:bg-green-800 rounded-lg transition-colors"
            title="Preview"
          >
            <Eye className="w-5 h-5" />
          </button>
          
          <button
            onClick={handleDownload}
            disabled={downloading}
            className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50"
          >
            <Download className="w-4 h-4" />
            {downloading ? 'Downloading...' : 'Download'}
          </button>
        </div>
      </div>
    </div>
  );
};
```

## Testing

1. Test booking history pagination
2. Test search functionality
3. Test filter combinations
4. Test booking detail loading
5. Test certificate download eligibility
6. Test invoice downloads
7. Test CSV export functionality
8. Test mobile responsive tabs