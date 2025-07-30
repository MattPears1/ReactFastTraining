import React, { useState, useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { format } from "date-fns";
import { EmailAttendeesModal } from "./EmailAttendeesModal";
import {
  SessionHeader,
  SessionForm,
  SessionDetails,
  CancelSessionModal,
  SessionFooter,
} from "./SessionDetailModal";
import { useSessionDetail, useCourses, useVenues } from "../hooks/useSessionDetail";
import { useSessionMutations } from "../hooks/useSessionMutations";
import { SessionFormData } from "../types";

interface SessionDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  sessionId: string;
  date?: Date;
  isNewSession?: boolean;
}

export const SessionDetailModal: React.FC<SessionDetailModalProps> = ({
  isOpen,
  onClose,
  sessionId,
  date,
  isNewSession = false,
}) => {
  const [editMode, setEditMode] = useState(isNewSession);
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [selectedAttendees, setSelectedAttendees] = useState<number[]>([]);
  const [showEmailModal, setShowEmailModal] = useState(false);
  const queryClient = useQueryClient();

  // Form state for editing
  const [formData, setFormData] = useState<SessionFormData>({
    courseId: "",
    venueId: "",
    date: date ? format(date, "yyyy-MM-dd") : "",
    startTime: "09:00",
    endTime: "17:00",
    maxCapacity: 12,
    notes: "",
  });

  // Custom hooks
  const { data: session, isLoading } = useSessionDetail(sessionId, isOpen, isNewSession);
  const { data: courses } = useCourses(isOpen && editMode);
  const { data: venues } = useVenues(isOpen && editMode);
  
  const {
    saveMutation,
    deleteMutation,
    sendRemindersMutation,
    emailAttendeesMutation,
  } = useSessionMutations(sessionId, isNewSession, onClose);

  // Update form when session loads
  useEffect(() => {
    if (session && !isNewSession) {
      setFormData({
        courseId: session.course_id || "",
        venueId: session.venue_id || "",
        date: session.date || "",
        startTime: session.startTime || "09:00",
        endTime: session.endTime || "17:00",
        maxCapacity: session.maxParticipants || 12,
        notes: session.notes || "",
      });
    }
  }, [session, isNewSession]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    saveMutation.mutate(formData);
  };

  const handleSelectAttendee = (bookingId: number, selected: boolean) => {
    if (selected) {
      setSelectedAttendees([...selectedAttendees, bookingId]);
    } else {
      setSelectedAttendees(selectedAttendees.filter((id) => id !== bookingId));
    }
  };

  const handleCancelEdit = () => {
    setEditMode(false);
    // Reset form data
    if (session) {
      setFormData({
        courseId: session.course_id || "",
        venueId: session.venue_id || "",
        date: session.date || "",
        startTime: session.startTime || "09:00",
        endTime: session.endTime || "17:00",
        maxCapacity: session.maxParticipants || 12,
        notes: session.notes || "",
      });
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-hidden">
        <SessionHeader
          isNewSession={isNewSession}
          editMode={editMode}
          session={session}
          onClose={onClose}
        />

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[calc(90vh-200px)]">
          {editMode ? (
            <SessionForm
              formData={formData}
              courses={courses}
              venues={venues}
              onSubmit={handleSubmit}
              onChange={setFormData}
            />
          ) : session ? (
            <SessionDetails
              session={session}
              selectedAttendees={selectedAttendees}
              onSelectAttendee={handleSelectAttendee}
              onSendReminders={() => sendRemindersMutation.mutate()}
              onEmailSelected={() => setShowEmailModal(true)}
              sendingReminders={sendRemindersMutation.isPending}
            />
          ) : (
            <div>Loading...</div>
          )}
        </div>

        <SessionFooter
          isNewSession={isNewSession}
          editMode={editMode}
          isSaving={saveMutation.isPending}
          isDeleting={deleteMutation.isPending}
          onClose={onClose}
          onEdit={() => setEditMode(true)}
          onCancelEdit={handleCancelEdit}
          onDelete={() => deleteMutation.mutate()}
          onCancelSession={() => setShowCancelModal(true)}
          onSave={handleSubmit}
        />
      </div>

      {/* Cancel Session Modal */}
      {showCancelModal && (
        <CancelSessionModal
          sessionId={sessionId}
          attendeeCount={session?.currentBookings || 0}
          onClose={() => setShowCancelModal(false)}
          onSuccess={() => {
            onClose();
            queryClient.invalidateQueries({ queryKey: ["admin-schedules"] });
          }}
        />
      )}

      {/* Email Attendees Modal */}
      {showEmailModal && session && (
        <EmailAttendeesModal
          isOpen={showEmailModal}
          onClose={() => {
            setShowEmailModal(false);
            setSelectedAttendees([]);
          }}
          sessionId={sessionId}
          attendeeIds={selectedAttendees}
          attendeeNames={session.bookings
            .filter((b) => selectedAttendees.includes(b.id))
            .map((b) => b.userName)}
        />
      )}
    </div>
  );
};