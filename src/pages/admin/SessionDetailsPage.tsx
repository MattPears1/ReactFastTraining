import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { AttendanceMarking } from '@components/admin/AttendanceMarking';
import { CapacityIndicator } from '@components/booking/CapacityIndicator';
import apiClient from '@services/api/client';
import { adminApi } from '@services/api/admin.service';
import { 
  ArrowLeft, 
  Calendar, 
  Clock, 
  MapPin, 
  Users, 
  DollarSign,
  AlertCircle,
  CheckCircle,
  XCircle,
  Edit,
  Trash2,
  Mail,
  Download
} from 'lucide-react';
import { cn } from '@utils/cn';

interface SessionDetails {
  id: string;
  courseId: string;
  courseName: string;
  startDate: string;
  endDate: string;
  startTime: string;
  endTime: string;
  locationId: string;
  locationName: string;
  trainerId: string;
  trainerName: string;
  currentParticipants: number;
  maxParticipants: number;
  pricePerPerson: number;
  status: string;
  notes?: string;
  bookings?: Array<{
    id: string;
    bookingReference: string;
    contactName: string;
    contactEmail: string;
    contactPhone: string;
    numberOfParticipants: number;
    totalAmount: number;
    status: string;
    createdAt: string;
  }>;
}

const SessionDetailsPage: React.FC = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [session, setSession] = useState<SessionDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'details' | 'bookings' | 'attendance'>('details');

  useEffect(() => {
    if (id) {
      loadSessionDetails();
    }
  }, [id]);

  const loadSessionDetails = async () => {
    try {
      setLoading(true);
      const response = await apiClient.get(`/courses/sessions/${id}`);
      setSession(response.data);
    } catch (error) {
      console.error('Failed to load session details:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCancelSession = async () => {
    if (!confirm('Are you sure you want to cancel this session? All attendees will be notified.')) {
      return;
    }

    try {
      await adminApi.cancelSession(id!, 'Admin cancelled');
      navigate('/admin/calendar');
    } catch (error) {
      console.error('Failed to cancel session:', error);
    }
  };

  const handleExportAttendance = async () => {
    try {
      const csv = await adminApi.exportAttendanceCSV(id!);
      const blob = new Blob([csv], { type: 'text/csv' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `attendance-${id}.csv`;
      a.click();
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Failed to export attendance:', error);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  if (!session) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500">Session not found</p>
        <button
          onClick={() => navigate('/admin/calendar')}
          className="mt-4 text-primary-600 hover:text-primary-700"
        >
          Back to Calendar
        </button>
      </div>
    );
  }

  const sessionDate = new Date(session.startDate);
  const isPastSession = sessionDate < new Date();
  const revenue = session.currentParticipants * session.pricePerPerson;

  return (
    <div>
      {/* Header */}
      <div className="mb-8">
        <button
          onClick={() => navigate(-1)}
          className="flex items-center gap-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white mb-4"
        >
          <ArrowLeft className="w-4 h-4" />
          Back
        </button>

        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
              {session.courseName}
            </h1>
            <div className="flex items-center gap-4 text-sm text-gray-600 dark:text-gray-400">
              <div className="flex items-center gap-1">
                <Calendar className="w-4 h-4" />
                {sessionDate.toLocaleDateString('en-GB', {
                  weekday: 'long',
                  day: 'numeric',
                  month: 'long',
                  year: 'numeric'
                })}
              </div>
              <div className="flex items-center gap-1">
                <Clock className="w-4 h-4" />
                {session.startTime} - {session.endTime}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => navigate(`/admin/sessions/${id}/edit`)}
              className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 flex items-center gap-2"
            >
              <Edit className="w-4 h-4" />
              Edit
            </button>
            <button
              onClick={handleCancelSession}
              className="px-4 py-2 border border-red-300 dark:border-red-700 text-red-600 dark:text-red-400 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 flex items-center gap-2"
            >
              <Trash2 className="w-4 h-4" />
              Cancel
            </button>
          </div>
        </div>
      </div>

      {/* Status Badge */}
      <div className="mb-6">
        {session.status === 'SCHEDULED' && (
          <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400">
            <Clock className="w-4 h-4" />
            Scheduled
          </span>
        )}
        {session.status === 'COMPLETED' && (
          <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm font-medium bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400">
            <CheckCircle className="w-4 h-4" />
            Completed
          </span>
        )}
        {session.status === 'CANCELLED' && (
          <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm font-medium bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400">
            <XCircle className="w-4 h-4" />
            Cancelled
          </span>
        )}
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200 dark:border-gray-700 mb-6">
        <nav className="-mb-px flex space-x-8">
          <button
            onClick={() => setActiveTab('details')}
            className={cn(
              'py-2 px-1 border-b-2 font-medium text-sm',
              activeTab === 'details'
                ? 'border-primary-600 text-primary-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            )}
          >
            Details
          </button>
          <button
            onClick={() => setActiveTab('bookings')}
            className={cn(
              'py-2 px-1 border-b-2 font-medium text-sm',
              activeTab === 'bookings'
                ? 'border-primary-600 text-primary-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            )}
          >
            Bookings ({session.currentParticipants})
          </button>
          {isPastSession && (
            <button
              onClick={() => setActiveTab('attendance')}
              className={cn(
                'py-2 px-1 border-b-2 font-medium text-sm',
                activeTab === 'attendance'
                  ? 'border-primary-600 text-primary-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              )}
            >
              Attendance
            </button>
          )}
        </nav>
      </div>

      {/* Tab Content */}
      {activeTab === 'details' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Details */}
          <div className="lg:col-span-2 space-y-6">
            {/* Session Information */}
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                Session Information
              </h2>
              <dl className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">Location</dt>
                  <dd className="mt-1 text-sm text-gray-900 dark:text-white flex items-center gap-1">
                    <MapPin className="w-4 h-4 text-gray-400" />
                    {session.locationName}
                  </dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">Trainer</dt>
                  <dd className="mt-1 text-sm text-gray-900 dark:text-white">
                    {session.trainerName || 'Lex'}
                  </dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">Duration</dt>
                  <dd className="mt-1 text-sm text-gray-900 dark:text-white">
                    Full Day (6 hours)
                  </dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">Price per Person</dt>
                  <dd className="mt-1 text-sm text-gray-900 dark:text-white">
                    £{session.pricePerPerson}
                  </dd>
                </div>
              </dl>

              {session.notes && (
                <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
                  <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">Notes</dt>
                  <dd className="mt-1 text-sm text-gray-900 dark:text-white">
                    {session.notes}
                  </dd>
                </div>
              )}
            </div>

            {/* Capacity */}
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                Capacity
              </h2>
              <CapacityIndicator
                sessionId={session.id}
                currentParticipants={session.currentParticipants}
                maxParticipants={session.maxParticipants}
                showDetails
              />
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Financial Summary */}
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                Financial Summary
              </h2>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600 dark:text-gray-400">Participants</span>
                  <span className="text-sm font-medium text-gray-900 dark:text-white">
                    {session.currentParticipants}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600 dark:text-gray-400">Price per Person</span>
                  <span className="text-sm font-medium text-gray-900 dark:text-white">
                    £{session.pricePerPerson}
                  </span>
                </div>
                <div className="pt-3 border-t border-gray-200 dark:border-gray-700">
                  <div className="flex items-center justify-between">
                    <span className="text-base font-medium text-gray-900 dark:text-white">Total Revenue</span>
                    <span className="text-lg font-bold text-green-600">
                      £{revenue.toFixed(2)}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Quick Actions */}
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                Quick Actions
              </h2>
              <div className="space-y-2">
                <button className="w-full px-4 py-2 text-left text-sm border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 flex items-center gap-2">
                  <Mail className="w-4 h-4" />
                  Email Attendees
                </button>
                <button 
                  onClick={handleExportAttendance}
                  className="w-full px-4 py-2 text-left text-sm border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 flex items-center gap-2"
                >
                  <Download className="w-4 h-4" />
                  Export Attendance
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'bookings' && (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
          <div className="p-6">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              Bookings
            </h2>
            {session.bookings && session.bookings.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                  <thead>
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                        Reference
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                        Contact
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                        Participants
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                        Amount
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                        Status
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                        Date
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                    {session.bookings.map((booking) => (
                      <tr key={booking.id}>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">
                          {booking.bookingReference}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                          <div>
                            <div className="text-gray-900 dark:text-white">{booking.contactName}</div>
                            <div className="text-gray-500">{booking.contactEmail}</div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                          {booking.numberOfParticipants}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                          £{booking.totalAmount.toFixed(2)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={cn(
                            'inline-flex px-2 py-1 text-xs font-medium rounded-full',
                            booking.status === 'CONFIRMED' && 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400',
                            booking.status === 'PENDING' && 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400',
                            booking.status === 'CANCELLED' && 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400'
                          )}>
                            {booking.status}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                          {new Date(booking.createdAt).toLocaleDateString('en-GB')}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <p className="text-center py-8 text-gray-500 dark:text-gray-400">
                No bookings yet
              </p>
            )}
          </div>
        </div>
      )}

      {activeTab === 'attendance' && isPastSession && (
        <AttendanceMarking
          sessionId={session.id}
          sessionDate={sessionDate}
          courseName={session.courseName}
          onUpdate={loadSessionDetails}
        />
      )}
    </div>
  );
};

export default SessionDetailsPage;