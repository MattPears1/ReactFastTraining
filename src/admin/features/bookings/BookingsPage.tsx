import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { 
  Filter, 
  Search, 
  Download, 
  Eye, 
  Edit3,
  Mail,
  Phone,
  Calendar,
  User,
  PoundSterling,
  CheckCircle,
  XCircle,
  Clock,
  AlertCircle,
  CalendarDays
} from 'lucide-react';
import { Button } from '../../../components/ui/Button';
import { SearchInput } from '../../../components/ui/SearchInput';
import { LoadingSpinner } from '../../components/common/LoadingSpinner';
import { AdminCard } from '../../components/ui/AdminCard';
import { AdminTable } from '../../components/ui/AdminTable';
import { AdminBadge } from '../../components/ui/AdminBadge';
import { AdminEmptyState } from '../../components/ui/AdminEmptyState';
import '../../styles/admin-design-system.css';

interface Booking {
  id: string;
  bookingReference: string;
  courseName: string;
  courseDate: string;
  courseTime: string;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  participants: number;
  totalAmount: number;
  status: 'confirmed' | 'pending' | 'cancelled' | 'completed' | 'no_show';
  paymentStatus: 'paid' | 'pending' | 'refunded' | 'failed';
  createdAt: string;
  updatedAt: string;
  notes?: string;
}

const mockBookings: Booking[] = [
  {
    id: '1',
    bookingReference: 'RFT-2025-001',
    courseName: 'Emergency First Aid at Work (EFAW)',
    courseDate: '2025-02-15',
    courseTime: '09:00',
    customerName: 'John Smith',
    customerEmail: 'john.smith@example.com',
    customerPhone: '07123456789',
    participants: 1,
    totalAmount: 75,
    status: 'confirmed',
    paymentStatus: 'paid',
    createdAt: '2025-01-20T10:30:00Z',
    updatedAt: '2025-01-20T10:30:00Z'
  },
  {
    id: '2',
    bookingReference: 'RFT-2025-002',
    courseName: 'First Aid at Work (FAW)',
    courseDate: '2025-02-20',
    courseTime: '09:00',
    customerName: 'Sarah Johnson',
    customerEmail: 'sarah.j@company.co.uk',
    customerPhone: '07987654321',
    participants: 3,
    totalAmount: 450,
    status: 'confirmed',
    paymentStatus: 'paid',
    createdAt: '2025-01-21T14:15:00Z',
    updatedAt: '2025-01-21T14:15:00Z',
    notes: 'Group booking for company training'
  },
  {
    id: '3',
    bookingReference: 'RFT-2025-003',
    courseName: 'Paediatric First Aid',
    courseDate: '2025-02-25',
    courseTime: '09:00',
    customerName: 'Emma Wilson',
    customerEmail: 'emma.wilson@nursery.com',
    customerPhone: '07456789123',
    participants: 2,
    totalAmount: 170,
    status: 'pending',
    paymentStatus: 'pending',
    createdAt: '2025-01-22T09:45:00Z',
    updatedAt: '2025-01-22T09:45:00Z'
  }
];

export const BookingsPage: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [paymentFilter, setPaymentFilter] = useState<string>('all');
  const queryClient = useQueryClient();

  const { data: bookings, isLoading, error } = useQuery({
    queryKey: ['admin-bookings', searchTerm, statusFilter, paymentFilter],
    queryFn: async () => {
      await new Promise(resolve => setTimeout(resolve, 500));
      
      let filtered = mockBookings;
      
      if (searchTerm) {
        filtered = filtered.filter(booking => 
          booking.bookingReference.toLowerCase().includes(searchTerm.toLowerCase()) ||
          booking.customerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
          booking.customerEmail.toLowerCase().includes(searchTerm.toLowerCase()) ||
          booking.courseName.toLowerCase().includes(searchTerm.toLowerCase())
        );
      }
      
      if (statusFilter !== 'all') {
        filtered = filtered.filter(booking => booking.status === statusFilter);
      }
      
      if (paymentFilter !== 'all') {
        filtered = filtered.filter(booking => booking.paymentStatus === paymentFilter);
      }
      
      return filtered.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    },
  });

  const updateStatusMutation = useMutation({
    mutationFn: async ({ bookingId, status }: { bookingId: string; status: string }) => {
      await new Promise(resolve => setTimeout(resolve, 1000));
      console.log('Updating booking status:', bookingId, status);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-bookings'] });
    },
  });

  const getStatusVariant = (status: string): 'success' | 'warning' | 'danger' | 'info' | 'neutral' => {
    switch (status) {
      case 'confirmed':
        return 'success';
      case 'pending':
        return 'warning';
      case 'cancelled':
        return 'danger';
      case 'completed':
        return 'info';
      case 'no_show':
      default:
        return 'neutral';
    }
  };

  const getPaymentVariant = (status: string): 'success' | 'warning' | 'danger' | 'info' | 'neutral' => {
    switch (status) {
      case 'paid':
        return 'success';
      case 'pending':
        return 'warning';
      case 'refunded':
        return 'info';
      case 'failed':
        return 'danger';
      default:
        return 'neutral';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'confirmed':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'pending':
        return <Clock className="h-4 w-4 text-yellow-500" />;
      case 'cancelled':
        return <XCircle className="h-4 w-4 text-red-500" />;
      case 'completed':
        return <CheckCircle className="h-4 w-4 text-blue-500" />;
      case 'no_show':
        return <AlertCircle className="h-4 w-4 text-gray-500" />;
      default:
        return <Clock className="h-4 w-4 text-gray-500" />;
    }
  };

  if (isLoading) {
    return (
      <div className="admin-loading-container">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (error) {
    return (
      <AdminCard className="admin-mt-8">
        <div className="text-center">
          <p className="text-red-600 font-medium">Failed to load bookings</p>
          <p className="admin-text-small admin-text-muted admin-mt-2">Please try refreshing the page</p>
        </div>
      </AdminCard>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="admin-page-header admin-fade-in">
        <div className="sm:flex sm:items-center sm:justify-between">
          <div>
            <h1 className="admin-page-title">Booking Management</h1>
            <p className="admin-page-subtitle">
              View and manage all course bookings
            </p>
          </div>
          <div className="mt-4 sm:mt-0">
            <button className="admin-btn admin-btn-secondary">
              <Download className="admin-icon-sm" />
              Export Bookings
            </button>
          </div>
        </div>
      </div>

      {/* Filters */}
      <AdminCard>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search bookings..."
              className="admin-input"
            />
          </div>
          <div>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="admin-select"
            >
              <option value="all">All Status</option>
              <option value="confirmed">Confirmed</option>
              <option value="pending">Pending</option>
              <option value="cancelled">Cancelled</option>
              <option value="completed">Completed</option>
              <option value="no_show">No Show</option>
            </select>
          </div>
          <div>
            <select
              value={paymentFilter}
              onChange={(e) => setPaymentFilter(e.target.value)}
              className="admin-select"
            >
              <option value="all">All Payments</option>
              <option value="paid">Paid</option>
              <option value="pending">Pending</option>
              <option value="refunded">Refunded</option>
              <option value="failed">Failed</option>
            </select>
          </div>
          <div className="flex justify-end">
            <button className="admin-btn admin-btn-secondary">
              <Filter className="admin-icon-sm" />
              More Filters
            </button>
          </div>
        </div>
      </AdminCard>

      {/* Bookings Table */}
      <AdminTable
        columns={[
          {
            key: 'booking',
            header: 'Booking',
            render: (booking: Booking) => (
              <div className="flex items-center">
                {getStatusIcon(booking.status)}
                <div className="ml-3">
                  <div className="font-medium text-gray-900">
                    {booking.bookingReference}
                  </div>
                  <div className="admin-text-small admin-text-muted">
                    {new Date(booking.createdAt).toLocaleDateString()}
                  </div>
                </div>
              </div>
            ),
          },
          {
            key: 'customer',
            header: 'Customer',
            render: (booking: Booking) => (
              <div className="flex items-center">
                <User className="admin-icon-md text-gray-400 mr-2" />
                <div>
                  <div className="font-medium text-gray-900">
                    {booking.customerName}
                  </div>
                  <div className="admin-text-small admin-text-muted flex items-center">
                    <Mail className="admin-icon-sm mr-1" />
                    {booking.customerEmail}
                  </div>
                  <div className="admin-text-small admin-text-muted flex items-center">
                    <Phone className="admin-icon-sm mr-1" />
                    {booking.customerPhone}
                  </div>
                </div>
              </div>
            ),
          },
          {
            key: 'course',
            header: 'Course',
            render: (booking: Booking) => (
              <div>
                <div className="font-medium text-gray-900">
                  {booking.courseName}
                </div>
                <div className="admin-text-small admin-text-muted flex items-center">
                  <Calendar className="admin-icon-sm mr-1" />
                  {new Date(booking.courseDate).toLocaleDateString()} at {booking.courseTime}
                </div>
                <div className="admin-text-small admin-text-muted">
                  {booking.participants} participant{booking.participants > 1 ? 's' : ''}
                </div>
              </div>
            ),
          },
          {
            key: 'amount',
            header: 'Amount',
            render: (booking: Booking) => (
              <div className="flex items-center font-medium text-gray-900">
                <PoundSterling className="admin-icon-sm mr-1" />
                {booking.totalAmount}
              </div>
            ),
          },
          {
            key: 'status',
            header: 'Status',
            render: (booking: Booking) => (
              <AdminBadge variant={getStatusVariant(booking.status)}>
                {booking.status}
              </AdminBadge>
            ),
          },
          {
            key: 'payment',
            header: 'Payment',
            render: (booking: Booking) => (
              <AdminBadge variant={getPaymentVariant(booking.paymentStatus)}>
                {booking.paymentStatus}
              </AdminBadge>
            ),
          },
          {
            key: 'actions',
            header: 'Actions',
            align: 'right',
            render: (booking: Booking) => (
              <div className="flex justify-end gap-1">
                <button className="admin-btn admin-btn-secondary p-2" title="View">
                  <Eye className="admin-icon-sm" />
                </button>
                <button className="admin-btn admin-btn-secondary p-2" title="Edit">
                  <Edit3 className="admin-icon-sm" />
                </button>
                <button className="admin-btn admin-btn-secondary p-2" title="Email">
                  <Mail className="admin-icon-sm" />
                </button>
              </div>
            ),
          },
        ]}
        data={bookings || []}
        keyExtractor={(booking) => booking.id}
        loading={false}
        emptyMessage="No bookings found"
        emptyIcon={<CalendarDays className="w-12 h-12" />}
      />

      {/* Empty state is handled by AdminTable */}
    </div>
  );
};