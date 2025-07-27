import React, { useState } from 'react';
import { 
  Mail, 
  Copy, 
  Download, 
  Printer,
  Calendar,
  XCircle,
  AlertCircle,
  Send,
  FileText,
  MoreVertical,
  Trash2,
  Edit3,
  RefreshCw,
  CheckCircle
} from 'lucide-react';
import { AdminCard } from '../../../components/ui/AdminCard';
import { Button } from '../../../../components/ui/Button';
import { SessionDetails, EmailAttendeesData } from '../../../types/schedule.types';

interface SessionActionsProps {
  session: SessionDetails;
  onEditSession: () => void;
  onCancelSession: (reason: string) => Promise<void>;
  onDuplicateSession: (newDate: string) => Promise<void>;
  onEmailAttendees: (data: EmailAttendeesData) => Promise<void>;
  onExportAttendees: (format: 'csv' | 'pdf') => void;
  onPrintSignInSheet: () => void;
  onGenerateCertificates?: () => void;
  isLoading?: boolean;
}

interface EmailModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSend: (data: EmailAttendeesData) => Promise<void>;
  attendeeCount: number;
}

const EmailModal: React.FC<EmailModalProps> = ({ isOpen, onClose, onSend, attendeeCount }) => {
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [includeCalendar, setIncludeCalendar] = useState(false);
  const [isSending, setIsSending] = useState(false);

  if (!isOpen) return null;

  const handleSend = async () => {
    setIsSending(true);
    try {
      await onSend({
        subject,
        message,
        includeCalendarInvite: includeCalendar
      });
      onClose();
    } finally {
      setIsSending(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full mx-4">
        <div className="p-6">
          <h3 className="text-lg font-semibold mb-4">Email Attendees</h3>
          <p className="text-sm text-gray-600 mb-4">
            Send an email to {attendeeCount} confirmed attendees
          </p>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Subject
              </label>
              <input
                type="text"
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                placeholder="Important update about your upcoming training"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Message
              </label>
              <textarea
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                rows={6}
                placeholder="Type your message here..."
              />
            </div>
            
            <div className="flex items-center">
              <input
                type="checkbox"
                id="includeCalendar"
                checked={includeCalendar}
                onChange={(e) => setIncludeCalendar(e.target.checked)}
                className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
              />
              <label htmlFor="includeCalendar" className="ml-2 text-sm text-gray-700">
                Include calendar invite
              </label>
            </div>
          </div>
          
          <div className="flex justify-end space-x-3 mt-6">
            <Button variant="secondary" onClick={onClose} disabled={isSending}>
              Cancel
            </Button>
            <Button 
              variant="primary" 
              onClick={handleSend} 
              disabled={!subject || !message || isSending}
            >
              <Send className="h-4 w-4 mr-1" />
              Send Email
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

interface CancelModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (reason: string) => Promise<void>;
}

const CancelModal: React.FC<CancelModalProps> = ({ isOpen, onClose, onConfirm }) => {
  const [reason, setReason] = useState('');
  const [isCancelling, setIsCancelling] = useState(false);

  if (!isOpen) return null;

  const handleCancel = async () => {
    setIsCancelling(true);
    try {
      await onConfirm(reason);
      onClose();
    } finally {
      setIsCancelling(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4">
        <div className="p-6">
          <div className="flex items-center space-x-3 mb-4">
            <div className="p-2 bg-red-100 rounded-full">
              <AlertCircle className="h-6 w-6 text-red-600" />
            </div>
            <h3 className="text-lg font-semibold">Cancel Session</h3>
          </div>
          
          <p className="text-sm text-gray-600 mb-4">
            This action will cancel the session and notify all attendees. Refunds will be processed automatically.
          </p>
          
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Cancellation Reason
            </label>
            <textarea
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
              rows={3}
              placeholder="Please provide a reason for cancellation..."
              required
            />
          </div>
          
          <div className="flex justify-end space-x-3">
            <Button variant="secondary" onClick={onClose} disabled={isCancelling}>
              Keep Session
            </Button>
            <Button 
              variant="danger" 
              onClick={handleCancel} 
              disabled={!reason || isCancelling}
            >
              <XCircle className="h-4 w-4 mr-1" />
              Cancel Session
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export const SessionActions: React.FC<SessionActionsProps> = ({
  session,
  onEditSession,
  onCancelSession,
  onDuplicateSession,
  onEmailAttendees,
  onExportAttendees,
  onPrintSignInSheet,
  onGenerateCertificates,
  isLoading = false
}) => {
  const [showEmailModal, setShowEmailModal] = useState(false);
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [showMoreActions, setShowMoreActions] = useState(false);

  const confirmedAttendees = session.bookings?.filter(b => b.status === 'confirmed').length || 0;
  const canCancel = session.status !== 'CANCELLED' && session.status !== 'COMPLETED';
  const canEmail = confirmedAttendees > 0;
  const isCompleted = session.status === 'COMPLETED';

  const primaryActions = [
    {
      label: 'Edit Session',
      icon: Edit3,
      onClick: onEditSession,
      variant: 'secondary' as const,
      disabled: session.status === 'CANCELLED' || session.status === 'COMPLETED'
    },
    {
      label: `Email Attendees (${confirmedAttendees})`,
      icon: Mail,
      onClick: () => setShowEmailModal(true),
      variant: 'secondary' as const,
      disabled: !canEmail
    },
    {
      label: 'Cancel Session',
      icon: XCircle,
      onClick: () => setShowCancelModal(true),
      variant: 'danger' as const,
      disabled: !canCancel
    }
  ];

  const moreActions = [
    {
      label: 'Duplicate Session',
      icon: Copy,
      onClick: () => {
        const newDate = prompt('Enter date for duplicated session (YYYY-MM-DD):');
        if (newDate) {
          onDuplicateSession(newDate);
        }
      }
    },
    {
      label: 'Export Attendees (CSV)',
      icon: Download,
      onClick: () => onExportAttendees('csv')
    },
    {
      label: 'Export Attendees (PDF)',
      icon: FileText,
      onClick: () => onExportAttendees('pdf')
    },
    {
      label: 'Print Sign-in Sheet',
      icon: Printer,
      onClick: onPrintSignInSheet
    },
    ...(isCompleted && onGenerateCertificates ? [{
      label: 'Generate Certificates',
      icon: CheckCircle,
      onClick: onGenerateCertificates
    }] : [])
  ];

  return (
    <>
      <AdminCard 
        title="Session Actions" 
        icon={Calendar}
        iconColor="primary"
      >
        <div className="space-y-4">
          {/* Primary Actions */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {primaryActions.map((action, index) => (
              <Button
                key={index}
                variant={action.variant}
                onClick={action.onClick}
                disabled={action.disabled || isLoading}
                className="w-full"
              >
                <action.icon className="h-4 w-4 mr-2" />
                {action.label}
              </Button>
            ))}
          </div>

          {/* More Actions */}
          <div className="relative">
            <Button
              variant="secondary"
              onClick={() => setShowMoreActions(!showMoreActions)}
              className="w-full"
            >
              <MoreVertical className="h-4 w-4 mr-2" />
              More Actions
            </Button>
            
            {showMoreActions && (
              <div className="absolute top-full mt-2 w-full bg-white rounded-lg shadow-lg border border-gray-200 z-10">
                <div className="py-1">
                  {moreActions.map((action, index) => (
                    <button
                      key={index}
                      onClick={() => {
                        action.onClick();
                        setShowMoreActions(false);
                      }}
                      className="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                    >
                      <action.icon className="h-4 w-4 mr-3 text-gray-400" />
                      {action.label}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Session Status Info */}
          {session.status === 'CANCELLED' && (
            <div className="flex items-start space-x-2 p-3 bg-red-50 rounded-lg">
              <XCircle className="h-5 w-5 text-red-600 flex-shrink-0 mt-0.5" />
              <div className="text-sm">
                <p className="font-medium text-red-800">Session Cancelled</p>
                <p className="text-red-700">
                  This session has been cancelled. All attendees have been notified.
                </p>
              </div>
            </div>
          )}

          {session.status === 'COMPLETED' && (
            <div className="flex items-start space-x-2 p-3 bg-green-50 rounded-lg">
              <CheckCircle className="h-5 w-5 text-green-600 flex-shrink-0 mt-0.5" />
              <div className="text-sm">
                <p className="font-medium text-green-800">Session Completed</p>
                <p className="text-green-700">
                  This session has been completed. You can generate certificates for attendees.
                </p>
              </div>
            </div>
          )}
        </div>
      </AdminCard>

      {/* Modals */}
      <EmailModal
        isOpen={showEmailModal}
        onClose={() => setShowEmailModal(false)}
        onSend={onEmailAttendees}
        attendeeCount={confirmedAttendees}
      />

      <CancelModal
        isOpen={showCancelModal}
        onClose={() => setShowCancelModal(false)}
        onConfirm={onCancelSession}
      />
    </>
  );
};