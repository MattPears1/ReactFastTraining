import React from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { 
  ArrowLeft, 
  Calendar, 
  Clock, 
  MapPin, 
  Users, 
  DollarSign,
  Edit3,
  Trash2
} from 'lucide-react';
import { AdminCard } from '../../components/ui/AdminCard';
import { AdminBadge } from '../../components/ui/AdminBadge';
import { Button } from '../../../components/ui/Button';
import { LoadingSpinner } from '../../components/common/LoadingSpinner';
import { format } from 'date-fns';

interface ScheduleDetails {
  id: string;
  courseName: string;
  courseType: string;
  date: string;
  startTime: string;
  endTime: string;
  location: string;
  instructor: string;
  maxParticipants: number;
  currentBookings: number;
  status: 'scheduled' | 'in_progress' | 'completed' | 'cancelled';
  price: number;
  description?: string;
  bookings?: Array<{
    id: string;
    userName: string;
    userEmail: string;
    bookingDate: string;
    status: string;
  }>;
}

export const ScheduleDetailsPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const { data: schedule, isLoading, error } = useQuery({
    queryKey: ['admin-schedule-details', id],
    queryFn: async () => {
      const apiUrl = import.meta.env.PROD ? '' : (import.meta.env.VITE_API_URL || 'http://localhost:3000');
      const token = localStorage.getItem('adminAccessToken');
      
      const response = await fetch(`${apiUrl}/api/admin/schedules/${id}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        }
      });
      
      if (!response.ok) {
        throw new Error('Failed to fetch schedule details');
      }
      
      return response.json();
    },
    enabled: !!id,
  });

  const getStatusVariant = (status: string): 'success' | 'warning' | 'neutral' => {
    switch (status) {
      case 'scheduled':
        return 'neutral';
      case 'in_progress':
        return 'warning';
      case 'completed':
        return 'success';
      case 'cancelled':
        return 'neutral';
      default:
        return 'neutral';
    }
  };

  const getAvailabilityColor = (current: number, max: number) => {
    const percentage = (current / max) * 100;
    if (percentage >= 100) return 'text-red-600';
    if (percentage >= 80) return 'text-yellow-600';
    return 'text-green-600';
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (error || !schedule) {
    return (
      <div className="text-center py-12">
        <p className="text-red-600 mb-4">Failed to load schedule details</p>
        <Button onClick={() => navigate('/admin/schedule')} variant="secondary">
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Schedule
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Button
            onClick={() => navigate('/admin/schedule')}
            variant="secondary"
            size="sm"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{schedule.courseName}</h1>
            <p className="text-sm text-gray-500">Schedule ID: {schedule.id}</p>
          </div>
        </div>
        <div className="flex space-x-2">
          <Button variant="secondary" size="sm">
            <Edit3 className="h-4 w-4 mr-2" />
            Edit
          </Button>
          <Button variant="secondary" size="sm" className="text-red-600 hover:text-red-700">
            <Trash2 className="h-4 w-4 mr-2" />
            Cancel Session
          </Button>
        </div>
      </div>

      {/* Main Details */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Session Information */}
        <div className="lg:col-span-2">
          <AdminCard title="Session Information" noPadding>
            <div className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm font-medium text-gray-500">Course Type</p>
                  <p className="mt-1 text-lg">{schedule.courseType}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-500">Status</p>
                  <div className="mt-1">
                    <AdminBadge variant={getStatusVariant(schedule.status)}>
                      {schedule.status}
                    </AdminBadge>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm font-medium text-gray-500">Date</p>
                  <div className="mt-1 flex items-center">
                    <Calendar className="h-5 w-5 text-gray-400 mr-2" />
                    <span>{format(new Date(schedule.date), 'EEEE, MMMM d, yyyy')}</span>
                  </div>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-500">Time</p>
                  <div className="mt-1 flex items-center">
                    <Clock className="h-5 w-5 text-gray-400 mr-2" />
                    <span>{schedule.startTime} - {schedule.endTime}</span>
                  </div>
                </div>
              </div>

              <div>
                <p className="text-sm font-medium text-gray-500">Location</p>
                <div className="mt-1 flex items-center">
                  <MapPin className="h-5 w-5 text-gray-400 mr-2" />
                  <span>{schedule.location}</span>
                </div>
              </div>

              <div>
                <p className="text-sm font-medium text-gray-500">Instructor</p>
                <p className="mt-1">{schedule.instructor}</p>
              </div>

              {schedule.description && (
                <div>
                  <p className="text-sm font-medium text-gray-500">Description</p>
                  <p className="mt-1 text-gray-700">{schedule.description}</p>
                </div>
              )}
            </div>
          </AdminCard>
        </div>

        {/* Booking Summary */}
        <div>
          <AdminCard title="Booking Summary" noPadding>
            <div className="p-6 space-y-4">
              <div>
                <p className="text-sm font-medium text-gray-500">Capacity</p>
                <div className="mt-2">
                  <div className="flex items-center justify-between mb-2">
                    <span className={`text-2xl font-bold ${getAvailabilityColor(schedule.currentBookings, schedule.maxParticipants)}`}>
                      {schedule.currentBookings}/{schedule.maxParticipants}
                    </span>
                    <Users className="h-6 w-6 text-gray-400" />
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-3">
                    <div
                      className={`h-3 rounded-full transition-all ${
                        schedule.currentBookings >= schedule.maxParticipants
                          ? 'bg-red-500'
                          : schedule.currentBookings >= schedule.maxParticipants * 0.8
                          ? 'bg-yellow-500'
                          : 'bg-green-500'
                      }`}
                      style={{ width: `${Math.min((schedule.currentBookings / schedule.maxParticipants) * 100, 100)}%` }}
                    />
                  </div>
                  <p className="mt-2 text-sm text-gray-500">
                    {schedule.maxParticipants - schedule.currentBookings} spots available
                  </p>
                </div>
              </div>

              <div>
                <p className="text-sm font-medium text-gray-500">Price per Person</p>
                <div className="mt-1 flex items-center">
                  <DollarSign className="h-5 w-5 text-gray-400" />
                  <span className="text-2xl font-bold">£{schedule.price}</span>
                </div>
              </div>

              <div>
                <p className="text-sm font-medium text-gray-500">Total Revenue</p>
                <p className="mt-1 text-lg font-semibold text-green-600">
                  £{(schedule.currentBookings * schedule.price).toLocaleString()}
                </p>
              </div>
            </div>
          </AdminCard>
        </div>
      </div>

      {/* Bookings List */}
      {schedule.bookings && schedule.bookings.length > 0 && (
        <AdminCard 
          title="Bookings" 
          subtitle={`${schedule.bookings.length} participants`}
          icon={Users}
          iconColor="primary"
        >
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Participant
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Email
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Booking Date
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {schedule.bookings.map((booking) => (
                  <tr key={booking.id}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {booking.userName}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {booking.userEmail}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {format(new Date(booking.bookingDate), 'MMM d, yyyy')}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <AdminBadge variant={booking.status === 'confirmed' ? 'success' : 'neutral'}>
                        {booking.status}
                      </AdminBadge>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      <Link
                        to={`/admin/bookings/${booking.id}`}
                        className="text-primary-600 hover:text-primary-700"
                      >
                        View
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </AdminCard>
      )}
    </div>
  );
};