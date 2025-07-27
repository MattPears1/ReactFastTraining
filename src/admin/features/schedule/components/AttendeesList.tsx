import React, { useState, useMemo } from 'react';
import { 
  Users, 
  Mail, 
  Phone, 
  Search, 
  Filter, 
  Download,
  MoreVertical,
  CheckCircle,
  XCircle,
  Clock,
  AlertCircle,
  DollarSign,
  FileText,
  Send,
  UserX,
  ChevronDown,
  ChevronUp,
  Calendar,
  X
} from 'lucide-react';
import { format } from 'date-fns';
import { AdminCard } from '../../../components/ui/AdminCard';
import { AdminBadge } from '../../../components/ui/AdminBadge';
import { Button } from '../../../../components/ui/Button';
import { BookingDetails, BulkAction } from '../../../types/schedule.types';

interface AttendeesListProps {
  bookings: BookingDetails[];
  onViewBooking: (bookingId: string) => void;
  onUpdateBooking: (bookingId: string, data: Partial<BookingDetails>) => Promise<void>;
  onCancelBooking: (bookingId: string) => Promise<void>;
  onEmailAttendees: (bookingIds: string[]) => void;
  onExportList: () => void;
  onBulkAction?: (action: BulkAction) => Promise<void>;
}

type FilterStatus = 'all' | 'confirmed' | 'pending' | 'cancelled';
type SortField = 'name' | 'date' | 'status' | 'payment';

export const AttendeesList: React.FC<AttendeesListProps> = ({
  bookings,
  onViewBooking,
  onUpdateBooking: _onUpdateBooking,
  onCancelBooking,
  onEmailAttendees,
  onExportList,
  onBulkAction: _onBulkAction
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<FilterStatus>('all');
  const [selectedBookings, setSelectedBookings] = useState<string[]>([]);
  const [expandedBooking, setExpandedBooking] = useState<string | null>(null); // eslint-disable-line @typescript-eslint/no-unused-vars
  const [sortField, setSortField] = useState<SortField>('date');
  const [sortAscending, setSortAscending] = useState(false);
  const [showActions, setShowActions] = useState<string | null>(null);
  const [showMobileFilters, setShowMobileFilters] = useState(false);

  // Filter and sort bookings
  const filteredAndSortedBookings = useMemo(() => {
    const filtered = bookings.filter(booking => {
      // Search filter
      if (searchTerm) {
        const search = searchTerm.toLowerCase();
        const matchesSearch = 
          booking.userName.toLowerCase().includes(search) ||
          booking.userEmail.toLowerCase().includes(search) ||
          booking.userPhone?.toLowerCase().includes(search);
        if (!matchesSearch) return false;
      }

      // Status filter
      if (filterStatus !== 'all' && booking.status !== filterStatus) {
        return false;
      }

      return true;
    });

    // Sort
    filtered.sort((a, b) => {
      let comparison = 0;
      switch (sortField) {
        case 'name':
          comparison = a.userName.localeCompare(b.userName);
          break;
        case 'date':
          comparison = new Date(a.bookingDate).getTime() - new Date(b.bookingDate).getTime();
          break;
        case 'status':
          comparison = a.status.localeCompare(b.status);
          break;
        case 'payment':
          comparison = a.paymentStatus.localeCompare(b.paymentStatus);
          break;
      }
      return sortAscending ? comparison : -comparison;
    });

    return filtered;
  }, [bookings, searchTerm, filterStatus, sortField, sortAscending]);

  const handleSelectAll = () => {
    if (selectedBookings.length === filteredAndSortedBookings.length) {
      setSelectedBookings([]);
    } else {
      setSelectedBookings(filteredAndSortedBookings.map(b => b.id));
    }
  };

  const handleSelectBooking = (bookingId: string) => {
    setSelectedBookings(prev =>
      prev.includes(bookingId)
        ? prev.filter(id => id !== bookingId)
        : [...prev, bookingId]
    );
  };

  const getStatusIcon = (status: BookingDetails['status']) => {
    switch (status) {
      case 'confirmed':
        return <CheckCircle className="h-4 w-4 text-green-600" />;
      case 'pending':
        return <Clock className="h-4 w-4 text-yellow-600" />;
      case 'cancelled':
        return <XCircle className="h-4 w-4 text-red-600" />;
      case 'completed':
        return <CheckCircle className="h-4 w-4 text-blue-600" />;
    }
  };

  const getPaymentStatusVariant = (status: BookingDetails['paymentStatus']): 'success' | 'warning' | 'danger' | 'neutral' => {
    switch (status) {
      case 'paid':
        return 'success';
      case 'pending':
        return 'warning';
      case 'failed':
        return 'danger';
      case 'refunded':
        return 'neutral';
    }
  };

  const handleBulkEmail = () => {
    if (selectedBookings.length > 0) {
      onEmailAttendees(selectedBookings);
    }
  };

  const statusCounts = useMemo(() => {
    return {
      all: bookings.length,
      confirmed: bookings.filter(b => b.status === 'confirmed').length,
      pending: bookings.filter(b => b.status === 'pending').length,
      cancelled: bookings.filter(b => b.status === 'cancelled').length
    };
  }, [bookings]);

  // Mobile Card Component
  const AttendeeCard: React.FC<{ booking: BookingDetails }> = ({ booking }) => (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 space-y-3">
      {/* Header with checkbox */}
      <div className="flex justify-between items-start">
        <div className="flex-1 pr-2">
          <h3 className="font-medium text-base text-gray-900 break-words">{booking.userName}</h3>
          <a 
            href={`mailto:${booking.userEmail}`}
            className="text-sm text-primary-600 hover:text-primary-700 break-all"
          >
            {booking.userEmail}
          </a>
          {booking.userPhone && (
            <a 
              href={`tel:${booking.userPhone}`}
              className="text-sm text-gray-600 flex items-center mt-1"
            >
              <Phone className="h-3 w-3 mr-1 flex-shrink-0" />
              {booking.userPhone}
            </a>
          )}
        </div>
        <input
          type="checkbox"
          checked={selectedBookings.includes(booking.id)}
          onChange={() => handleSelectBooking(booking.id)}
          className="h-5 w-5 text-primary-600 focus:ring-primary-500 border-gray-300 rounded flex-shrink-0"
        />
      </div>
      
      {/* Status badges */}
      <div className="flex flex-wrap gap-2 text-sm">
        <span className="flex items-center text-gray-600">
          <Calendar className="h-4 w-4 mr-1" />
          {format(new Date(booking.bookingDate), 'MMM d, yyyy')}
        </span>
        <div className="flex items-center">
          {getStatusIcon(booking.status)}
          <span className="ml-1 capitalize">{booking.status}</span>
        </div>
        <AdminBadge variant={getPaymentStatusVariant(booking.paymentStatus)}>
          <DollarSign className="h-3 w-3 mr-1" />
          {booking.paymentStatus}
        </AdminBadge>
      </div>

      {/* Special requirements indicator */}
      {booking.specialRequirements && (
        <div className="flex items-center text-xs text-amber-600 bg-amber-50 px-2 py-1 rounded">
          <AlertCircle className="h-3 w-3 mr-1" />
          Special requirements
        </div>
      )}
      
      {/* Action buttons */}
      <div className="flex gap-2 pt-2">
        <Button 
          size="sm" 
          variant="secondary" 
          className="flex-1 min-h-[44px]"
          onClick={() => onEmailAttendees([booking.id])}
        >
          <Mail className="h-4 w-4 mr-1" />
          Email
        </Button>
        <Button 
          size="sm" 
          variant="secondary" 
          className="flex-1 min-h-[44px]"
          onClick={() => onViewBooking(booking.id)}
        >
          <FileText className="h-4 w-4 mr-1" />
          View
        </Button>
        {booking.status !== 'cancelled' && (
          <Button 
            size="sm" 
            variant="secondary" 
            className="text-red-600 hover:text-red-700 hover:bg-red-50 min-h-[44px] px-3"
            onClick={() => onCancelBooking(booking.id)}
          >
            <UserX className="h-4 w-4" />
          </Button>
        )}
      </div>
    </div>
  );

  return (
    <AdminCard 
      title="Attendees" 
      subtitle={`${bookings.length} total bookings`}
      icon={Users}
      iconColor="primary"
      action={
        <div className="flex items-center flex-wrap gap-2">
          {selectedBookings.length > 0 && (
            <>
              <Button
                size="sm"
                variant="secondary"
                onClick={handleBulkEmail}
                className="min-h-[40px]"
              >
                <Mail className="h-4 w-4 mr-1" />
                <span className="hidden sm:inline">Email</span> ({selectedBookings.length})
              </Button>
              <Button
                size="sm"
                variant="secondary"
                onClick={() => setSelectedBookings([])}
                className="min-h-[40px]"
              >
                Clear
              </Button>
            </>
          )}
          <Button
            size="sm"
            variant="secondary"
            onClick={onExportList}
            className="min-h-[40px]"
          >
            <Download className="h-4 w-4 sm:mr-1" />
            <span className="hidden sm:inline">Export</span>
          </Button>
        </div>
      }
    >
      <div className="space-y-4">
        {/* Search and Filters - Mobile Optimized */}
        <div className="space-y-3">
          {/* Search Bar */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search attendees..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-3 text-base border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            />
          </div>

          {/* Mobile Filter Toggle */}
          <div className="sm:hidden">
            <Button
              size="sm"
              variant="secondary"
              onClick={() => setShowMobileFilters(!showMobileFilters)}
              className="w-full min-h-[44px] flex items-center justify-center"
            >
              <Filter className="h-5 w-5 mr-2" />
              Filters & Sort
              {filterStatus !== 'all' && (
                <span className="ml-2 bg-primary-100 text-primary-700 px-2 py-0.5 rounded-full text-xs">
                  Active
                </span>
              )}
            </Button>
          </div>

          {/* Desktop Filters */}
          <div className="hidden sm:flex items-center gap-3">
            <Filter className="h-5 w-5 text-gray-400" />
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value as FilterStatus)}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
            >
              <option value="all">All ({statusCounts.all})</option>
              <option value="confirmed">Confirmed ({statusCounts.confirmed})</option>
              <option value="pending">Pending ({statusCounts.pending})</option>
              <option value="cancelled">Cancelled ({statusCounts.cancelled})</option>
            </select>
            <select
              value={sortField}
              onChange={(e) => setSortField(e.target.value as SortField)}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
            >
              <option value="date">Sort by Date</option>
              <option value="name">Sort by Name</option>
              <option value="status">Sort by Status</option>
              <option value="payment">Sort by Payment</option>
            </select>
          </div>
        </div>

        {/* Mobile Filters Panel */}
        {showMobileFilters && (
          <div className="sm:hidden bg-gray-50 rounded-lg p-4 space-y-3 border border-gray-200">
            <div className="flex justify-between items-center mb-2">
              <h3 className="font-medium text-gray-900">Filters & Sort</h3>
              <button
                onClick={() => setShowMobileFilters(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value as FilterStatus)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
              >
                <option value="all">All ({statusCounts.all})</option>
                <option value="confirmed">Confirmed ({statusCounts.confirmed})</option>
                <option value="pending">Pending ({statusCounts.pending})</option>
                <option value="cancelled">Cancelled ({statusCounts.cancelled})</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Sort By</label>
              <select
                value={sortField}
                onChange={(e) => setSortField(e.target.value as SortField)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
              >
                <option value="date">Booking Date</option>
                <option value="name">Name</option>
                <option value="status">Status</option>
                <option value="payment">Payment Status</option>
              </select>
            </div>
            <div className="flex items-center">
              <input
                type="checkbox"
                id="sortOrder"
                checked={sortAscending}
                onChange={(e) => setSortAscending(e.target.checked)}
                className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
              />
              <label htmlFor="sortOrder" className="ml-2 text-sm text-gray-700">
                Sort ascending
              </label>
            </div>
          </div>
        )}

        {/* Select All for Mobile */}
        {filteredAndSortedBookings.length > 0 && (
          <div className="sm:hidden flex items-center justify-between py-2 px-1">
            <label className="flex items-center">
              <input
                type="checkbox"
                checked={selectedBookings.length === filteredAndSortedBookings.length}
                onChange={handleSelectAll}
                className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded mr-2"
              />
              <span className="text-sm text-gray-700">Select all</span>
            </label>
            {selectedBookings.length > 0 && (
              <span className="text-sm text-gray-500">{selectedBookings.length} selected</span>
            )}
          </div>
        )}

        {/* Mobile Card View */}
        <div className="sm:hidden space-y-3">
          {filteredAndSortedBookings.map((booking) => (
            <AttendeeCard key={booking.id} booking={booking} />
          ))}
        </div>

        {/* Desktop Table View */}
        <div className="hidden sm:block overflow-x-auto -mx-6 sm:mx-0">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="w-12 px-6 py-3">
                  <input
                    type="checkbox"
                    checked={selectedBookings.length === filteredAndSortedBookings.length && filteredAndSortedBookings.length > 0}
                    onChange={handleSelectAll}
                    className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                  />
                </th>
                <th 
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                  onClick={() => {
                    setSortField('name');
                    setSortAscending(!sortAscending);
                  }}
                >
                  <div className="flex items-center space-x-1">
                    <span>Attendee</span>
                    {sortField === 'name' && (
                      sortAscending ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />
                    )}
                  </div>
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Contact
                </th>
                <th 
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                  onClick={() => {
                    setSortField('date');
                    setSortAscending(!sortAscending);
                  }}
                >
                  <div className="flex items-center space-x-1">
                    <span>Booking Date</span>
                    {sortField === 'date' && (
                      sortAscending ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />
                    )}
                  </div>
                </th>
                <th 
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                  onClick={() => {
                    setSortField('status');
                    setSortAscending(!sortAscending);
                  }}
                >
                  Status
                </th>
                <th 
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                  onClick={() => {
                    setSortField('payment');
                    setSortAscending(!sortAscending);
                  }}
                >
                  Payment
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredAndSortedBookings.map((booking) => (
                <React.Fragment key={booking.id}>
                  <tr className="hover:bg-gray-50">
                    <td className="px-6 py-4">
                      <input
                        type="checkbox"
                        checked={selectedBookings.includes(booking.id)}
                        onChange={() => handleSelectBooking(booking.id)}
                        className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                      />
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div>
                          <p className="text-sm font-medium text-gray-900">{booking.userName}</p>
                          {booking.specialRequirements && (
                            <p className="text-xs text-gray-500 flex items-center mt-1">
                              <AlertCircle className="h-3 w-3 mr-1" />
                              Special requirements
                            </p>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm">
                        <a 
                          href={`mailto:${booking.userEmail}`}
                          className="text-primary-600 hover:text-primary-700 flex items-center"
                        >
                          <Mail className="h-4 w-4 mr-1" />
                          {booking.userEmail}
                        </a>
                        {booking.userPhone && (
                          <a 
                            href={`tel:${booking.userPhone}`}
                            className="text-gray-500 flex items-center mt-1"
                          >
                            <Phone className="h-4 w-4 mr-1" />
                            {booking.userPhone}
                          </a>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {format(new Date(booking.bookingDate), 'MMM d, yyyy')}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center space-x-2">
                        {getStatusIcon(booking.status)}
                        <span className="text-sm capitalize">{booking.status}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <AdminBadge variant={getPaymentStatusVariant(booking.paymentStatus)}>
                        <DollarSign className="h-3 w-3 mr-1" />
                        {booking.paymentStatus}
                      </AdminBadge>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      <div className="relative">
                        <button
                          onClick={() => setShowActions(showActions === booking.id ? null : booking.id)}
                          className="text-gray-400 hover:text-gray-600 p-2"
                        >
                          <MoreVertical className="h-5 w-5" />
                        </button>
                        {showActions === booking.id && (
                          <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg z-10 border border-gray-200">
                            <div className="py-1">
                              <button
                                onClick={() => {
                                  onViewBooking(booking.id);
                                  setShowActions(null);
                                }}
                                className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 w-full text-left"
                              >
                                <FileText className="h-4 w-4 mr-2" />
                                View Details
                              </button>
                              <button
                                onClick={() => {
                                  onEmailAttendees([booking.id]);
                                  setShowActions(null);
                                }}
                                className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 w-full text-left"
                              >
                                <Send className="h-4 w-4 mr-2" />
                                Send Email
                              </button>
                              {booking.status !== 'cancelled' && (
                                <button
                                  onClick={async () => {
                                    await onCancelBooking(booking.id);
                                    setShowActions(null);
                                  }}
                                  className="flex items-center px-4 py-2 text-sm text-red-700 hover:bg-red-50 w-full text-left"
                                >
                                  <UserX className="h-4 w-4 mr-2" />
                                  Cancel Booking
                                </button>
                              )}
                            </div>
                          </div>
                        )}
                      </div>
                    </td>
                  </tr>
                  {expandedBooking === booking.id && (
                    <tr>
                      <td colSpan={7} className="px-6 py-4 bg-gray-50">
                        <div className="space-y-3">
                          {booking.specialRequirements && (
                            <div>
                              <p className="text-sm font-medium text-gray-700">Special Requirements:</p>
                              <p className="text-sm text-gray-600 mt-1">{booking.specialRequirements}</p>
                            </div>
                          )}
                          <div className="flex items-center space-x-4 text-sm">
                            <span className="text-gray-500">Amount: £{booking.paymentAmount}</span>
                            {booking.certificateIssued && (
                              <span className="text-green-600">Certificate Issued</span>
                            )}
                            {booking.attendanceStatus && (
                              <span className="text-gray-500">
                                Attendance: {booking.attendanceStatus}
                              </span>
                            )}
                          </div>
                        </div>
                      </td>
                    </tr>
                  )}
                </React.Fragment>
              ))}
            </tbody>
          </table>
        </div>

        {filteredAndSortedBookings.length === 0 && (
          <div className="text-center py-12">
            <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-500 text-base">No attendees found</p>
            {(searchTerm || filterStatus !== 'all') && (
              <button
                onClick={() => {
                  setSearchTerm('');
                  setFilterStatus('all');
                }}
                className="mt-3 text-sm text-primary-600 hover:text-primary-700"
              >
                Clear filters
              </button>
            )}
          </div>
        )}
      </div>
    </AdminCard>
  );
};