import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ArrowLeft, AlertCircle } from 'lucide-react';
import { Button } from '../../../components/ui/Button';
import { LoadingSpinner } from '../../components/common/LoadingSpinner';
import { useNotification } from '../../contexts/NotificationContext';

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
  const { showNotification } = useNotification();
  
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
      showNotification('Session updated successfully', 'success');
      setViewMode('details');
    },
    onError: (error: any) => {
      showNotification(error.message || 'Failed to update session', 'error');
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
      showNotification('Session cancelled successfully', 'success');
    },
    onError: (error: any) => {
      showNotification(error.message || 'Failed to cancel session', 'error');
    }
  });

  // Duplicate session mutation
  const duplicateSessionMutation = useMutation({
    mutationFn: async (newDate: string) => {
      if (!id) throw new Error('Session ID is required');
      return adminScheduleService.duplicateSession(id, newDate);
    },
    onSuccess: (newSession) => {
      showNotification('Session duplicated successfully', 'success');
      navigate(`/admin/schedule/${newSession.id}`);
    },
    onError: (error: any) => {
      showNotification(error.message || 'Failed to duplicate session', 'error');
    }
  });

  // Email attendees mutation
  const emailAttendeesMutation = useMutation({
    mutationFn: async (data: EmailAttendeesData) => {
      if (!id) throw new Error('Session ID is required');
      return adminScheduleService.emailAttendees(id, data);
    },
    onSuccess: (result) => {
      showNotification(`Email sent to ${result.sent} attendees`, 'success');
    },
    onError: (error: any) => {
      showNotification(error.message || 'Failed to send emails', 'error');
    }
  });

  // Update booking mutation
  const updateBookingMutation = useMutation({
    mutationFn: async ({ bookingId, data }: { bookingId: string; data: Partial<BookingDetails> }) => {
      return adminScheduleService.updateBooking(bookingId, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['admin-session-details', id]);
      showNotification('Booking updated successfully', 'success');
    },
    onError: (error: any) => {
      showNotification(error.message || 'Failed to update booking', 'error');
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
    showNotification('Add booking feature coming soon', 'info');
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
      showNotification('Attendee list exported successfully', 'success');
    } catch (error) {
      showNotification('Failed to export attendee list', 'error');
    }
  };

  const handlePrintSignInSheet = async () => {
    if (!id) return;
    try {
      const blob = await adminScheduleService.generateSignInSheet(id);
      const url = window.URL.createObjectURL(blob);
      window.open(url, '_blank');
      showNotification('Sign-in sheet generated', 'success');
    } catch (error) {
      showNotification('Failed to generate sign-in sheet', 'error');
    }
  };

  const handleEmailAttendees = (bookingIds: string[]) => {
    // TODO: Implement email modal for selected attendees
    showNotification('Email feature coming soon', 'info');
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (error || !session) {
    return (
      <div className="text-center py-12">
        <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
        <p className="text-red-600 mb-4">Failed to load session details</p>
        <Button onClick={() => navigate('/admin/schedule')} variant="secondary">
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Schedule
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header - Mobile Optimized */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-start sm:items-center flex-col sm:flex-row gap-3 sm:gap-4">
          <Button
            onClick={() => navigate('/admin/schedule')}
            variant="secondary"
            size="sm"
            className="self-start"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            <span className="hidden sm:inline">Back</span>
          </Button>
          <div className="flex-1">
            <h1 className="text-xl sm:text-2xl font-bold text-gray-900 break-words">
              {session.course?.name || 'Session Details'}
            </h1>
            <p className="text-xs sm:text-sm text-gray-500">Session ID: {session.id}</p>
          </div>
        </div>
      </div>

      {/* Main Content Grid - Mobile First */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
        {/* Left Column - Session Info and Attendees */}
        <div className="lg:col-span-2 space-y-4 sm:space-y-6 order-2 lg:order-1">
          <SessionInfoSection
            session={session}
            viewMode={viewMode}
            onEdit={handleEditSession}
            onSave={handleSaveSession}
            onCancel={handleCancelEdit}
            isLoading={updateSessionMutation.isLoading}
          />

          <AttendeesList
            bookings={session.bookings || []}
            onViewBooking={handleViewBooking}
            onUpdateBooking={updateBookingMutation.mutateAsync}
            onCancelBooking={handleCancelBooking}
            onEmailAttendees={handleEmailAttendees}
            onExportList={() => handleExportAttendees('csv')}
          />
        </div>

        {/* Right Column - Capacity, Financial, and Actions */}
        <div className="space-y-4 sm:space-y-6 order-1 lg:order-2">
          <CapacityManagement
            session={session}
            onAddBooking={handleAddBooking}
            onUpdateCapacity={async (newCapacity) => {
              await updateSessionMutation.mutateAsync({ maxParticipants: newCapacity });
            }}
          />

          {sessionSummary && (
            <FinancialSummary
              session={session}
              summary={sessionSummary}
              onProcessRefunds={() => {
                showNotification('Refund processing coming soon', 'info');
              }}
              onViewPaymentDetails={() => {
                showNotification('Payment details coming soon', 'info');
              }}
            />
          )}

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
  );
};