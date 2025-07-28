import React, { useState } from "react";
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
  Edit3,
  CheckCircle,
  X,
} from "lucide-react";
import { AdminCard } from "../../../components/ui/AdminCard";
import { Button } from "../../../../components/ui/Button";
import {
  SessionDetails,
  EmailAttendeesData,
} from "../../../types/schedule.types";

interface SessionActionsProps {
  session: SessionDetails;
  onEditSession: () => void;
  onCancelSession: (reason: string) => Promise<void>;
  onDuplicateSession: (newDate: string) => Promise<void>;
  onEmailAttendees: (data: EmailAttendeesData) => Promise<void>;
  onExportAttendees: (format: "csv" | "pdf") => void;
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

const EmailModal: React.FC<EmailModalProps> = ({
  isOpen,
  onClose,
  onSend,
  attendeeCount,
}) => {
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [includeCalendar, setIncludeCalendar] = useState(false);
  const [isSending, setIsSending] = useState(false);

  if (!isOpen) return null;

  const handleSend = async () => {
    setIsSending(true);
    try {
      await onSend({
        subject,
        message,
        includeCalendarInvite: includeCalendar,
      });
      onClose();
      // Reset form
      setSubject("");
      setMessage("");
      setIncludeCalendar(false);
    } finally {
      setIsSending(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fadeIn">
      <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto transform transition-all duration-300 scale-100 animate-slideInUp">
        <div className="p-6 sm:p-8">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-xl font-bold text-gray-900">
                Email Attendees
              </h3>
              <p className="text-sm text-gray-600 mt-1">
                Send an email to {attendeeCount} confirmed attendees
              </p>
            </div>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 hover:bg-gray-100 p-2 rounded-lg transition-all"
              disabled={isSending}
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Subject
              </label>
              <input
                type="text"
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                className="w-full px-3 py-2 text-base sm:text-sm min-h-[44px] border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
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
                className="w-full px-3 py-2 text-base sm:text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 resize-none"
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
                className="h-5 w-5 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
              />
              <label
                htmlFor="includeCalendar"
                className="ml-2 text-sm text-gray-700"
              >
                Include calendar invite
              </label>
            </div>
          </div>

          <div className="flex flex-col-reverse sm:flex-row justify-end gap-3 mt-6">
            <Button
              variant="secondary"
              onClick={onClose}
              disabled={isSending}
              className="w-full sm:w-auto min-h-[44px]"
            >
              Cancel
            </Button>
            <Button
              variant="primary"
              onClick={handleSend}
              disabled={!subject || !message || isSending}
              className="w-full sm:w-auto min-h-[44px]"
            >
              <Send className="h-4 w-4 mr-1" />
              {isSending ? "Sending..." : "Send Email"}
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

const CancelModal: React.FC<CancelModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
}) => {
  const [reason, setReason] = useState("");
  const [isCancelling, setIsCancelling] = useState(false);

  if (!isOpen) return null;

  const handleCancel = async () => {
    setIsCancelling(true);
    try {
      await onConfirm(reason);
      onClose();
      setReason("");
    } finally {
      setIsCancelling(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full max-h-[90vh] overflow-y-auto">
        <div className="p-4 sm:p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-red-100 rounded-full">
                <AlertCircle className="h-6 w-6 text-red-600" />
              </div>
              <h3 className="text-lg font-semibold">Cancel Session</h3>
            </div>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 p-2"
              disabled={isCancelling}
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          <p className="text-sm text-gray-600 mb-4">
            This action will cancel the session and notify all attendees.
            Refunds will be processed automatically.
          </p>

          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Cancellation Reason
            </label>
            <textarea
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              className="w-full px-3 py-2 text-base sm:text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 resize-none"
              rows={3}
              placeholder="Please provide a reason for cancellation..."
              required
            />
          </div>

          <div className="flex flex-col-reverse sm:flex-row justify-end gap-3">
            <Button
              variant="secondary"
              onClick={onClose}
              disabled={isCancelling}
              className="w-full sm:w-auto min-h-[44px]"
            >
              Keep Session
            </Button>
            <Button
              variant="danger"
              onClick={handleCancel}
              disabled={!reason || isCancelling}
              className="w-full sm:w-auto min-h-[44px]"
            >
              <XCircle className="h-4 w-4 mr-1" />
              {isCancelling ? "Cancelling..." : "Cancel Session"}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

// Duplicate Session Modal
interface DuplicateModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (date: string) => Promise<void>;
}

const DuplicateModal: React.FC<DuplicateModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
}) => {
  const [newDate, setNewDate] = useState("");
  const [isDuplicating, setIsDuplicating] = useState(false);

  if (!isOpen) return null;

  const handleDuplicate = async () => {
    setIsDuplicating(true);
    try {
      await onConfirm(newDate);
      onClose();
      setNewDate("");
    } finally {
      setIsDuplicating(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full">
        <div className="p-4 sm:p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold">Duplicate Session</h3>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 p-2"
              disabled={isDuplicating}
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          <p className="text-sm text-gray-600 mb-4">
            Create a copy of this session with a new date. All other details
            will be copied.
          </p>

          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              New Session Date
            </label>
            <input
              type="date"
              value={newDate}
              onChange={(e) => setNewDate(e.target.value)}
              className="w-full px-3 py-2 text-base sm:text-sm min-h-[44px] border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
              required
            />
          </div>

          <div className="flex flex-col-reverse sm:flex-row justify-end gap-3">
            <Button
              variant="secondary"
              onClick={onClose}
              disabled={isDuplicating}
              className="w-full sm:w-auto min-h-[44px]"
            >
              Cancel
            </Button>
            <Button
              variant="primary"
              onClick={handleDuplicate}
              disabled={!newDate || isDuplicating}
              className="w-full sm:w-auto min-h-[44px]"
            >
              <Copy className="h-4 w-4 mr-1" />
              {isDuplicating ? "Duplicating..." : "Duplicate Session"}
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
  isLoading = false,
}) => {
  const [showEmailModal, setShowEmailModal] = useState(false);
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [showDuplicateModal, setShowDuplicateModal] = useState(false);
  const [showMoreActions, setShowMoreActions] = useState(false);

  const confirmedAttendees =
    session.bookings?.filter((b) => b.status === "confirmed").length || 0;
  const canCancel =
    session.status !== "CANCELLED" && session.status !== "COMPLETED";
  const canEmail = confirmedAttendees > 0;
  const isCompleted = session.status === "COMPLETED";

  const primaryActions = [
    {
      label: "Edit",
      icon: Edit3,
      onClick: onEditSession,
      variant: "secondary" as const,
      disabled:
        session.status === "CANCELLED" || session.status === "COMPLETED",
    },
    {
      label: `Email (${confirmedAttendees})`,
      icon: Mail,
      onClick: () => setShowEmailModal(true),
      variant: "secondary" as const,
      disabled: !canEmail,
    },
    {
      label: "Cancel",
      icon: XCircle,
      onClick: () => setShowCancelModal(true),
      variant: "danger" as const,
      disabled: !canCancel,
    },
  ];

  const moreActions = [
    {
      label: "Duplicate Session",
      icon: Copy,
      onClick: () => setShowDuplicateModal(true),
      disabled: false,
    },
    {
      label: "Export Attendees (CSV)",
      icon: Download,
      onClick: () => onExportAttendees("csv"),
      disabled: confirmedAttendees === 0,
    },
    {
      label: "Export Attendees (PDF)",
      icon: FileText,
      onClick: () => onExportAttendees("pdf"),
      disabled: confirmedAttendees === 0,
    },
    {
      label: "Print Sign-in Sheet",
      icon: Printer,
      onClick: onPrintSignInSheet,
      disabled: confirmedAttendees === 0,
    },
    ...(isCompleted && onGenerateCertificates
      ? [
          {
            label: "Generate Certificates",
            icon: CheckCircle,
            onClick: onGenerateCertificates,
            disabled: false,
          },
        ]
      : []),
  ];

  return (
    <>
      <AdminCard title="Session Actions" icon={Calendar} iconColor="primary">
        <div className="space-y-4">
          {/* Enhanced Primary Actions with hover effects */}
          <div className="grid grid-cols-3 gap-3">
            {primaryActions.map((action, index) => (
              <Button
                key={index}
                variant={action.variant}
                onClick={action.onClick}
                disabled={action.disabled || isLoading}
                className={`w-full min-h-[48px] px-3 sm:px-4 group transition-all duration-200 ${
                  action.variant === "danger"
                    ? "hover:bg-red-600 hover:shadow-lg hover:shadow-red-500/25"
                    : "hover:shadow-md hover:transform hover:-translate-y-0.5"
                }`}
                size="sm"
              >
                <action.icon className="h-4 w-4 sm:mr-2 group-hover:scale-110 transition-transform" />
                <span className="hidden sm:inline font-medium">
                  {action.label}
                </span>
                <span className="sm:hidden text-xs font-medium">
                  {action.label.split(" ")[0]}
                </span>
              </Button>
            ))}
          </div>

          {/* More Actions - Mobile Friendly Dropdown */}
          <div className="relative">
            <Button
              variant="secondary"
              onClick={() => setShowMoreActions(!showMoreActions)}
              className="w-full min-h-[44px]"
            >
              <MoreVertical className="h-4 w-4 mr-2" />
              More Actions
            </Button>

            {showMoreActions && (
              <div className="absolute bottom-full mb-2 sm:bottom-auto sm:top-full sm:mt-2 w-full bg-white rounded-xl shadow-2xl border border-gray-100 z-10 animate-slideInUp overflow-hidden">
                <div className="py-2">
                  {moreActions.map((action, index) => (
                    <button
                      key={index}
                      onClick={() => {
                        if (!action.disabled) {
                          action.onClick();
                          setShowMoreActions(false);
                        }
                      }}
                      disabled={action.disabled || isLoading}
                      className="flex items-center w-full px-4 py-3 min-h-[48px] text-sm text-gray-700 hover:bg-primary-50 hover:text-primary-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-150 group"
                    >
                      <action.icon className="h-4 w-4 mr-3 text-gray-500 group-hover:text-primary-600 group-hover:scale-110 transition-all" />
                      <span className="font-medium">{action.label}</span>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Session Status Info - Mobile Optimized */}
          {session.status === "CANCELLED" && (
            <div className="flex items-start space-x-2 p-3 bg-red-50 rounded-lg">
              <XCircle className="h-5 w-5 text-red-600 flex-shrink-0 mt-0.5" />
              <div className="text-sm">
                <p className="font-medium text-red-800">Session Cancelled</p>
                <p className="text-red-700 text-xs sm:text-sm">
                  This session has been cancelled. All attendees have been
                  notified.
                </p>
              </div>
            </div>
          )}

          {session.status === "COMPLETED" && (
            <div className="flex items-start space-x-2 p-3 bg-green-50 rounded-lg">
              <CheckCircle className="h-5 w-5 text-green-600 flex-shrink-0 mt-0.5" />
              <div className="text-sm">
                <p className="font-medium text-green-800">Session Completed</p>
                <p className="text-green-700 text-xs sm:text-sm">
                  This session has been completed. You can generate certificates
                  for attendees.
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

      <DuplicateModal
        isOpen={showDuplicateModal}
        onClose={() => setShowDuplicateModal(false)}
        onConfirm={onDuplicateSession}
      />
    </>
  );
};
