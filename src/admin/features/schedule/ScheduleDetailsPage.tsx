import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ArrowLeft, AlertCircle, Calendar, Clock, MapPin } from 'lucide-react';
import { Button } from '../../../components/ui/Button';
import { LoadingSpinner } from '../../components/common/LoadingSpinner';
import { useNotifications } from '../../contexts/NotificationContext';
import './styles/schedule-enhanced.css';

// Import services and types
import { adminScheduleService } from '../../services/admin-schedule.service';
import { 
  SessionDetails, 
  SessionSummary, 
  UpdateSessionData,
  EmailAttendeesData,
  SessionViewMode,
  BookingDetails
} from '../../types/schedule.types';

// Import components
import { SessionInfoSection } from './components/SessionInfoSection';
import { CapacityManagement } from './components/CapacityManagement';
import { AttendeesList } from './components/AttendeesList';
import { FinancialSummary } from './components/FinancialSummary';
import { SessionActions } from './components/SessionActions';

export const ScheduleDetailsPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { addNotification } = useNotifications();
  
  const [viewMode, setViewMode] = useState<SessionViewMode>('details');
  const [sessionSummary, setSessionSummary] = useState<SessionSummary | null>(null);

  // Fetch session details
  const { data: session, isLoading, error } = useQuery({
    queryKey: ['admin-session-details', id],
    queryFn: async () => {
      if (!id) throw new Error('Session ID is required');
      return adminScheduleService.getSessionDetails(id);
    },
    enabled: !!id,
  });

  // Fetch financial summary
  useEffect(() => {
    if (session && id) {
      adminScheduleService.getSessionSummary(id)
        .then(setSessionSummary)
        .catch((err) => {
          console.error('Failed to fetch session summary:', err);
        });
    }
  }, [session, id]);

  // Update session mutation
  const updateSessionMutation = useMutation({
    mutationFn: async (data: UpdateSessionData) => {
      if (!id) throw new Error('Session ID is required');
      return adminScheduleService.updateSession(id, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['admin-session-details', id]);
      addNotification({ type: 'success', title: 'Session updated successfully' });
      setViewMode('details');
    },
    onError: (error: any) => {
      addNotification({ type: 'error', title: error.message || 'Failed to update session' });
    }
  });

  // Cancel session mutation
  const cancelSessionMutation = useMutation({
    mutationFn: async (reason: string) => {
      if (!id) throw new Error('Session ID is required');
      return adminScheduleService.cancelSession(id, reason);
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['admin-session-details', id]);
      addNotification({ type: 'success', title: 'Session cancelled successfully' });
    },
    onError: (error: any) => {
      addNotification({ type: 'error', title: error.message || 'Failed to cancel session' });
    }
  });

  // Duplicate session mutation
  const duplicateSessionMutation = useMutation({
    mutationFn: async (newDate: string) => {
      if (!id) throw new Error('Session ID is required');
      return adminScheduleService.duplicateSession(id, newDate);
    },
    onSuccess: (newSession) => {
      addNotification({ type: 'success', title: 'Session duplicated successfully' });
      navigate(`/admin/schedule/${newSession.id}`);
    },
    onError: (error: any) => {
      addNotification({ type: 'error', title: error.message || 'Failed to duplicate session' });
    }
  });

  // Email attendees mutation
  const emailAttendeesMutation = useMutation({
    mutationFn: async (data: EmailAttendeesData) => {
      if (!id) throw new Error('Session ID is required');
      return adminScheduleService.emailAttendees(id, data);
    },
    onSuccess: (result) => {
      addNotification({ type: 'success', title: `Email sent to ${result.sent} attendees` });
    },
    onError: (error: any) => {
      addNotification({ type: 'error', title: error.message || 'Failed to send emails' });
    }
  });

  // Update booking mutation
  const updateBookingMutation = useMutation({
    mutationFn: async ({ bookingId, data }: { bookingId: string; data: Partial<BookingDetails> }) => {
      return adminScheduleService.updateBooking(bookingId, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['admin-session-details', id]);
      addNotification({ type: 'success', title: 'Booking updated successfully' });
    },
    onError: (error: any) => {
      addNotification({ type: 'error', title: error.message || 'Failed to update booking' });
    }
  });

  // Handler functions
  const handleEditSession = () => {
    setViewMode('edit');
  };

  const handleSaveSession = async (data: UpdateSessionData) => {
    await updateSessionMutation.mutateAsync(data);
  };

  const handleCancelEdit = () => {
    setViewMode('details');
  };

  const handleAddBooking = () => {
    // TODO: Implement add booking modal
    addNotification({ type: 'info', title: 'Add booking feature coming soon' });
  };

  const handleViewBooking = (bookingId: string) => {
    navigate(`/admin/bookings/${bookingId}`);
  };

  const handleCancelBooking = async (bookingId: string) => {
    await updateBookingMutation.mutateAsync({
      bookingId,
      data: { status: 'cancelled' }
    });
  };

  const handleExportAttendees = async (format: 'csv' | 'pdf' = 'csv') => {
    if (!id) return;
    try {
      const blob = await adminScheduleService.exportAttendeeList(id, format);
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `attendees-${id}.${format}`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      addNotification({ type: 'success', title: 'Attendee list exported successfully' });
    } catch (error) {
      addNotification({ type: 'error', title: 'Failed to export attendee list' });
    }
  };

  const handlePrintSignInSheet = async () => {
    if (!id) return;
    try {
      const blob = await adminScheduleService.generateSignInSheet(id);
      const url = window.URL.createObjectURL(blob);
      window.open(url, '_blank');
      addNotification({ type: 'success', title: 'Sign-in sheet generated' });
    } catch (error) {
      addNotification({ type: 'error', title: 'Failed to generate sign-in sheet' });
    }
  };

  const handleEmailAttendees = (bookingIds: string[]) => {
    // TODO: Implement email modal for selected attendees
    addNotification({ type: 'info', title: 'Email feature coming soon' });
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 to-primary-50/20">
        <div className="text-center space-y-4 schedule-fade-in">
          <LoadingSpinner size="lg" />
          <div className="space-y-2">
            <p className="text-lg font-medium text-gray-900">Loading session details</p>
            <div className="schedule-loading-dots">
              <span></span>
              <span></span>
              <span></span>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error || !session) {
    return (
      <div className="min-h-[400px] flex items-center justify-center">
        <div className="text-center space-y-6 schedule-fade-in max-w-md mx-auto px-4">
          <div className="relative">
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="w-32 h-32 bg-red-100 rounded-full animate-pulse"></div>
            </div>
            <AlertCircle className="h-16 w-16 text-red-500 mx-auto relative z-10" />
          </div>
          <div className="space-y-2">
            <h3 className="text-xl font-semibold text-gray-900">Unable to load session</h3>
            <p className="text-gray-600">We couldn't retrieve the session details. Please try again.</p>
          </div>
          <Button 
            onClick={() => navigate('/admin/schedule')} 
            variant="secondary"
            className="schedule-btn"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Schedule
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-primary-50/10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 space-y-6">
        {/* Enhanced Header with Status Overview */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 sm:p-6 schedule-fade-in">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
            <div className="flex items-start sm:items-center flex-col sm:flex-row gap-3 sm:gap-4">
              <Button
                onClick={() => navigate('/admin/schedule')}
                variant="secondary"
                size="sm"
                className="self-start schedule-btn hover:shadow-md transition-all"
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                <span className="hidden sm:inline">Back to Schedule</span>
                <span className="sm:hidden">Back</span>
              </Button>
              <div className="flex-1">
                <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 break-words mb-2">
                  {session.course?.name || 'Session Details'}
                </h1>
                <div className="flex flex-wrap items-center gap-3 text-sm">
                  <span className="inline-flex items-center text-gray-600">
                    <Calendar className="h-4 w-4 mr-1 text-primary-500" />
                    {new Date(session.startDate).toLocaleDateString('en-GB', { 
                      weekday: 'short', 
                      day: 'numeric', 
                      month: 'short', 
                      year: 'numeric' 
                    })}
                  </span>
                  <span className="inline-flex items-center text-gray-600">
                    <Clock className="h-4 w-4 mr-1 text-primary-500" />
                    {session.startTime} - {session.endTime}
                  </span>
                  <span className="inline-flex items-center text-gray-600">
                    <MapPin className="h-4 w-4 mr-1 text-primary-500" />
                    {session.location?.name}
                  </span>
                </div>
              </div>
            </div>
            
            {/* Quick Stats for Desktop */}
            <div className="hidden lg:flex items-center gap-6">
              <div className="text-center">
                <p className="text-2xl font-bold text-primary-600">{session.currentParticipants}</p>
                <p className="text-xs text-gray-500 uppercase tracking-wider">Attendees</p>
              </div>
              <div className="h-12 w-px bg-gray-200"></div>
              <div className="text-center">
                <p className="text-2xl font-bold text-secondary-600">£{session.pricePerPerson}</p>
                <p className="text-xs text-gray-500 uppercase tracking-wider">Per Person</p>
              </div>
              <div className="h-12 w-px bg-gray-200"></div>
              <div className="text-center">
                <p className="text-2xl font-bold text-accent-600">
                  {Math.round((session.currentParticipants / session.maxParticipants) * 100)}%
                </p>
                <p className="text-xs text-gray-500 uppercase tracking-wider">Capacity</p>
              </div>
            </div>
          </div>
        </div>

        {/* Main Content Grid - Enhanced Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
          {/* Left Column - Session Info and Attendees */}
          <div className="lg:col-span-2 space-y-4 sm:space-y-6 order-2 lg:order-1">
            <div className="schedule-stagger-item" style={{ animationDelay: '0.1s' }}>
              <SessionInfoSection
                session={session}
                viewMode={viewMode}
                onEdit={handleEditSession}
                onSave={handleSaveSession}
                onCancel={handleCancelEdit}
                isLoading={updateSessionMutation.isLoading}
              />
            </div>

            <div className="schedule-stagger-item" style={{ animationDelay: '0.2s' }}>
              <AttendeesList
                bookings={session.bookings || []}
                onViewBooking={handleViewBooking}
                onUpdateBooking={updateBookingMutation.mutateAsync}
                onCancelBooking={handleCancelBooking}
                onEmailAttendees={handleEmailAttendees}
                onExportList={() => handleExportAttendees('csv')}
              />
            </div>
          </div>

          {/* Right Column - Capacity, Financial, and Actions */}
          <div className="space-y-4 sm:space-y-6 order-1 lg:order-2">
            <div className="schedule-stagger-item" style={{ animationDelay: '0.15s' }}>
              <CapacityManagement
                session={session}
                onAddBooking={handleAddBooking}
                onUpdateCapacity={async (newCapacity) => {
                  await updateSessionMutation.mutateAsync({ maxParticipants: newCapacity });
                }}
              />
            </div>

            {sessionSummary && (
              <div className="schedule-stagger-item" style={{ animationDelay: '0.25s' }}>
                <FinancialSummary
                  session={session}
                  summary={sessionSummary}
                  onProcessRefunds={() => {
                    addNotification({ type: 'info', title: 'Refund processing coming soon' });
                  }}
                  onViewPaymentDetails={() => {
                    addNotification({ type: 'info', title: 'Payment details coming soon' });
                  }}
                />
              </div>
            )}

            <div className="schedule-stagger-item" style={{ animationDelay: '0.35s' }}>
              <SessionActions
                session={session}
                onEditSession={handleEditSession}
                onCancelSession={cancelSessionMutation.mutateAsync}
                onDuplicateSession={duplicateSessionMutation.mutateAsync}
                onEmailAttendees={emailAttendeesMutation.mutateAsync}
                onExportAttendees={handleExportAttendees}
                onPrintSignInSheet={handlePrintSignInSheet}
                isLoading={
                  updateSessionMutation.isLoading ||
                  cancelSessionMutation.isLoading ||
                  duplicateSessionMutation.isLoading ||
                  emailAttendeesMutation.isLoading
                }
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};