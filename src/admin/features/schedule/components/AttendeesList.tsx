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
  ChevronUp
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
  onUpdateBooking,
  onCancelBooking,
  onEmailAttendees,
  onExportList,
  onBulkAction
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<FilterStatus>('all');
  const [selectedBookings, setSelectedBookings] = useState<string[]>([]);
  const [expandedBooking, setExpandedBooking] = useState<string | null>(null);
  const [sortField, setSortField] = useState<SortField>('date');
  const [sortAscending, setSortAscending] = useState(false);
  const [showActions, setShowActions] = useState<string | null>(null);

  // Filter and sort bookings
  const filteredAndSortedBookings = useMemo(() => {
    let filtered = bookings.filter(booking => {
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

  return (
    <AdminCard 
      title="Attendees" 
      subtitle={`${bookings.length} total bookings`}
      icon={Users}
      iconColor="primary"
      action={
        <div className="flex items-center space-x-2">
          {selectedBookings.length > 0 && (
            <>
              <Button
                size="sm"
                variant="secondary"
                onClick={handleBulkEmail}
              >
                <Mail className="h-4 w-4 mr-1" />
                Email ({selectedBookings.length})
              </Button>
              <Button
                size="sm"
                variant="secondary"
                onClick={() => setSelectedBookings([])}
              >
                Clear
              </Button>
            </>
          )}
          <Button
            size="sm"
            variant="secondary"
            onClick={onExportList}
          >
            <Download className="h-4 w-4 mr-1" />
            Export
          </Button>
        </div>
      }
    >
      <div className="space-y-4">
        {/* Search and Filters */}
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search by name, email, or phone..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            />
          </div>
          <div className="flex items-center space-x-2">
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
          </div>
        </div>

        {/* Attendees Table */}
        <div className="overflow-x-auto">
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
                          className="text-gray-400 hover:text-gray-600"
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
            <p className="text-gray-500">No attendees found</p>
          </div>
        )}
      </div>
    </AdminCard>
  );
};