import React, { useState, useEffect } from "react";
import { useMutation, useQueryClient, useQuery } from "@tanstack/react-query";
import {
  X,
  Calendar,
  Clock,
  MapPin,
  Users,
  PoundSterling,
  AlertTriangle,
  Edit3,
  Trash2,
  Mail,
  Copy,
  RefreshCw,
  UserPlus,
  Ban,
} from "lucide-react";
import { format } from "date-fns";
import { Button } from "../../../../components/ui/Button";
import { AdminBadge } from "../../../components/ui/AdminBadge";
import { useNotifications } from "../../../contexts/NotificationContext";
import { adminApi } from "../../../utils/api";
import { EmailAttendeesModal } from "./EmailAttendeesModal";

interface SessionDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  sessionId: string;
  date?: Date;
  isNewSession?: boolean;
}

interface Attendee {
  id: number;
  name: string;
  email: string;
  phone?: string;
  paymentStatus: string;
  bookingStatus: string;
  bookingId: number;
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
  const { addNotification } = useNotifications();

  // Form state for editing
  const [formData, setFormData] = useState({
    courseId: "",
    venueId: "",
    date: date ? format(date, "yyyy-MM-dd") : "",
    startTime: "09:00",
    endTime: "17:00",
    maxCapacity: 12,
    notes: "",
  });

  // Fetch session details
  const { data: session, isLoading } = useQuery({
    queryKey: ["admin-session-details", sessionId],
    queryFn: async () => {
      if (isNewSession) return null;
      const response = await adminApi.get(`/api/admin/schedules/${sessionId}`);
      if (!response.ok) throw new Error("Failed to fetch session details");
      return response.json();
    },
    enabled: isOpen && !isNewSession,
  });

  // Fetch courses and venues for dropdowns
  const { data: courses } = useQuery({
    queryKey: ["admin-courses-list"],
    queryFn: async () => {
      const response = await adminApi.get("/api/admin/courses");
      if (!response.ok) throw new Error("Failed to fetch courses");
      return response.json();
    },
    enabled: isOpen && editMode,
  });

  const { data: venues } = useQuery({
    queryKey: ["admin-venues"],
    queryFn: async () => {
      const response = await adminApi.get("/api/admin/venues");
      if (!response.ok) throw new Error("Failed to fetch venues");
      return response.json();
    },
    enabled: isOpen && editMode,
  });

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

  // Save/Update session
  const saveMutation = useMutation({
    mutationFn: async (data: typeof formData) => {
      const endpoint = isNewSession
        ? "/course-sessions"
        : `/api/admin/schedules/${sessionId}`;

      const method = isNewSession ? "POST" : "PUT";

      const response = await adminApi.fetch(endpoint, {
        method,
        body: JSON.stringify({
          ...data,
          startDatetime: `${data.date} ${data.startTime}:00`,
          endDatetime: `${data.date} ${data.endTime}:00`,
        }),
      });

      if (!response.ok) throw new Error("Failed to save session");
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-schedules"] });
      addNotification({
        type: "success",
        title: isNewSession
          ? "Session created successfully"
          : "Session updated successfully",
      });
      setEditMode(false);
      if (isNewSession) onClose();
    },
    onError: (error: Error) => {
      addNotification({
        type: "error",
        title: "Failed to save session",
        message: error.message,
      });
    },
  });

  // Delete session
  const deleteMutation = useMutation({
    mutationFn: async () => {
      const response = await adminApi.delete(
        `/api/admin/schedules/${sessionId}`,
      );
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Failed to delete session");
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-schedules"] });
      addNotification({
        type: "success",
        title: "Session deleted successfully",
      });
      onClose();
    },
    onError: (error: Error) => {
      addNotification({
        type: "error",
        title: "Failed to delete session",
        message: error.message,
      });
    },
  });

  // Send reminder emails
  const sendRemindersMutation = useMutation({
    mutationFn: async () => {
      const response = await adminApi.post(
        `/api/admin/schedules/${sessionId}/send-reminders`,
      );
      if (!response.ok) throw new Error("Failed to send reminders");
      return response.json();
    },
    onSuccess: (data) => {
      addNotification({
        type: "success",
        title: `Reminders sent to ${data.sent} attendees`,
      });
    },
  });

  // Email selected attendees
  const emailAttendeesMutation = useMutation({
    mutationFn: async (data: {
      attendeeIds: number[];
      subject: string;
      message: string;
    }) => {
      const response = await adminApi.post(
        `/api/admin/schedules/${sessionId}/email-attendees`,
        data,
      );
      if (!response.ok) throw new Error("Failed to send emails");
      return response.json();
    },
    onSuccess: () => {
      addNotification({ type: "success", title: "Emails sent successfully" });
      setSelectedAttendees([]);
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    saveMutation.mutate(formData);
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<
      string,
      "success" | "warning" | "error" | "neutral"
    > = {
      scheduled: "neutral",
      in_progress: "warning",
      completed: "success",
      cancelled: "error",
    };
    return variants[status] || "neutral";
  };

  const getPaymentBadge = (status: string) => {
    const variants: Record<string, "success" | "warning" | "error"> = {
      completed: "success",
      pending: "warning",
      failed: "error",
    };
    return variants[status] || "neutral";
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">
              {isNewSession
                ? "Create New Session"
                : editMode
                  ? "Edit Session"
                  : "Session Details"}
            </h2>
            {session && !editMode && (
              <p className="text-sm text-gray-500 mt-1">
                {session.courseName} •{" "}
                {format(new Date(session.date), "dd MMM yyyy")}
              </p>
            )}
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[calc(90vh-200px)]">
          {editMode ? (
            // Edit/Create Form
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Course *
                  </label>
                  <select
                    value={formData.courseId}
                    onChange={(e) =>
                      setFormData({ ...formData, courseId: e.target.value })
                    }
                    className="admin-select"
                    required
                  >
                    <option value="">Select a course...</option>
                    {courses?.map((course: any) => (
                      <option key={course.id} value={course.id}>
                        {course.name} (£{course.price})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Venue *
                  </label>
                  <select
                    value={formData.venueId}
                    onChange={(e) =>
                      setFormData({ ...formData, venueId: e.target.value })
                    }
                    className="admin-select"
                    required
                  >
                    <option value="">Select a venue...</option>
                    {venues?.map((venue: any) => (
                      <option key={venue.id} value={venue.id}>
                        {venue.name} - {venue.city}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Date *
                  </label>
                  <input
                    type="date"
                    value={formData.date}
                    onChange={(e) =>
                      setFormData({ ...formData, date: e.target.value })
                    }
                    className="admin-input"
                    required
                    min={new Date().toISOString().split("T")[0]}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Max Capacity *
                  </label>
                  <input
                    type="number"
                    value={formData.maxCapacity}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        maxCapacity: parseInt(e.target.value) || 12,
                      })
                    }
                    className="admin-input"
                    required
                    min="1"
                    max="50"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Start Time *
                  </label>
                  <input
                    type="time"
                    value={formData.startTime}
                    onChange={(e) =>
                      setFormData({ ...formData, startTime: e.target.value })
                    }
                    className="admin-input"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    End Time *
                  </label>
                  <input
                    type="time"
                    value={formData.endTime}
                    onChange={(e) =>
                      setFormData({ ...formData, endTime: e.target.value })
                    }
                    className="admin-input"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Notes
                </label>
                <textarea
                  value={formData.notes}
                  onChange={(e) =>
                    setFormData({ ...formData, notes: e.target.value })
                  }
                  className="admin-input h-24"
                  placeholder="Any additional notes..."
                />
              </div>
            </form>
          ) : session ? (
            // View Mode
            <div className="space-y-6">
              {/* Session Info */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div className="flex items-start gap-3">
                    <Calendar className="w-5 h-5 text-gray-400 mt-0.5" />
                    <div>
                      <p className="text-sm font-medium text-gray-600">
                        Date & Time
                      </p>
                      <p className="text-sm text-gray-900">
                        {format(new Date(session.date), "EEEE, dd MMMM yyyy")}
                      </p>
                      <p className="text-sm text-gray-900">
                        {session.startTime} - {session.endTime}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <MapPin className="w-5 h-5 text-gray-400 mt-0.5" />
                    <div>
                      <p className="text-sm font-medium text-gray-600">Venue</p>
                      <p className="text-sm text-gray-900">
                        {session.venueName}
                      </p>
                      <p className="text-sm text-gray-500">
                        {session.venueAddress}, {session.venueCity}{" "}
                        {session.venuePostcode}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="flex items-start gap-3">
                    <Users className="w-5 h-5 text-gray-400 mt-0.5" />
                    <div>
                      <p className="text-sm font-medium text-gray-600">
                        Capacity
                      </p>
                      <p className="text-lg font-semibold text-gray-900">
                        {session.currentBookings} / {session.maxParticipants}
                      </p>
                      <div className="w-32 bg-gray-200 rounded-full h-2 mt-2">
                        <div
                          className={`h-2 rounded-full transition-all ${
                            session.currentBookings >= session.maxParticipants
                              ? "bg-red-500"
                              : session.currentBookings >=
                                  session.maxParticipants * 0.8
                                ? "bg-yellow-500"
                                : "bg-green-500"
                          }`}
                          style={{
                            width: `${Math.min((session.currentBookings / session.maxParticipants) * 100, 100)}%`,
                          }}
                        />
                      </div>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <PoundSterling className="w-5 h-5 text-gray-400 mt-0.5" />
                    <div>
                      <p className="text-sm font-medium text-gray-600">
                        Revenue
                      </p>
                      <p className="text-lg font-semibold text-gray-900">
                        £{(session.price * session.currentBookings).toFixed(2)}
                      </p>
                      <p className="text-sm text-gray-500">
                        £{session.price} per person
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Status and Actions */}
              <div className="flex items-center justify-between py-4 border-y">
                <div className="flex items-center gap-4">
                  <span className="text-sm font-medium text-gray-600">
                    Status:
                  </span>
                  <AdminBadge variant={getStatusBadge(session.status)}>
                    {session.status}
                  </AdminBadge>
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => sendRemindersMutation.mutate()}
                    disabled={sendRemindersMutation.isPending}
                  >
                    <Mail className="w-4 h-4 mr-1" />
                    Send Reminders
                  </Button>
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => {
                      /* TODO: Implement duplicate */
                    }}
                  >
                    <Copy className="w-4 h-4 mr-1" />
                    Duplicate
                  </Button>
                </div>
              </div>

              {/* Attendees List */}
              {session.bookings && session.bookings.length > 0 && (
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-semibold">
                      Attendees ({session.bookings.length})
                    </h3>
                    {selectedAttendees.length > 0 && (
                      <Button
                        variant="primary"
                        size="sm"
                        onClick={() => setShowEmailModal(true)}
                      >
                        Email {selectedAttendees.length} Selected
                      </Button>
                    )}
                  </div>

                  <div className="space-y-2">
                    {session.bookings.map((booking: any) => (
                      <div
                        key={booking.id}
                        className="flex items-center justify-between p-3 border rounded-lg hover:bg-gray-50"
                      >
                        <div className="flex items-center gap-3">
                          <input
                            type="checkbox"
                            checked={selectedAttendees.includes(booking.id)}
                            onChange={(e) => {
                              if (e.target.checked) {
                                setSelectedAttendees([
                                  ...selectedAttendees,
                                  booking.id,
                                ]);
                              } else {
                                setSelectedAttendees(
                                  selectedAttendees.filter(
                                    (id) => id !== booking.id,
                                  ),
                                );
                              }
                            }}
                            className="w-4 h-4 text-primary-600 rounded"
                          />
                          <div>
                            <p className="font-medium text-gray-900">
                              {booking.userName}
                            </p>
                            <p className="text-sm text-gray-500">
                              {booking.userEmail}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-4">
                          <AdminBadge
                            variant={getPaymentBadge(booking.payment_status)}
                          >
                            {booking.payment_status}
                          </AdminBadge>
                          <p className="text-sm text-gray-900">
                            £{booking.payment_amount}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Notes */}
              {session.notes && (
                <div>
                  <h3 className="text-sm font-medium text-gray-600 mb-2">
                    Notes
                  </h3>
                  <p className="text-sm text-gray-900 p-3 bg-gray-50 rounded-lg">
                    {session.notes}
                  </p>
                </div>
              )}
            </div>
          ) : (
            <div>Loading...</div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between p-6 border-t bg-gray-50">
          <div className="flex gap-2">
            {!isNewSession && !editMode && (
              <>
                <Button
                  variant="secondary"
                  onClick={() => setShowCancelModal(true)}
                  className="text-red-600 hover:bg-red-50"
                >
                  <Ban className="w-4 h-4 mr-2" />
                  Cancel Session
                </Button>
                <Button
                  variant="secondary"
                  onClick={() => {
                    if (
                      window.confirm(
                        "Are you sure you want to delete this session?",
                      )
                    ) {
                      deleteMutation.mutate();
                    }
                  }}
                  disabled={deleteMutation.isPending}
                >
                  <Trash2 className="w-4 h-4 mr-2" />
                  Delete
                </Button>
              </>
            )}
          </div>

          <div className="flex gap-3">
            <Button
              variant="secondary"
              onClick={() => {
                if (editMode) {
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
                } else {
                  onClose();
                }
              }}
            >
              {editMode ? "Cancel" : "Close"}
            </Button>

            {editMode ? (
              <Button
                variant="primary"
                onClick={handleSubmit}
                disabled={saveMutation.isPending}
              >
                {saveMutation.isPending ? "Saving..." : "Save Changes"}
              </Button>
            ) : (
              !isNewSession && (
                <Button variant="primary" onClick={() => setEditMode(true)}>
                  <Edit3 className="w-4 h-4 mr-2" />
                  Edit Session
                </Button>
              )
            )}
          </div>
        </div>
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
            .filter((b: any) => selectedAttendees.includes(b.id))
            .map((b: any) => b.userName)}
        />
      )}
    </div>
  );
};

// Separate Cancel Session Modal Component
const CancelSessionModal: React.FC<{
  sessionId: string;
  attendeeCount: number;
  onClose: () => void;
  onSuccess: () => void;
}> = ({ sessionId, attendeeCount, onClose, onSuccess }) => {
  const [cancellationReasonId, setCancellationReasonId] = useState("");
  const [reasonDetails, setReasonDetails] = useState("");
  const { addNotification } = useNotifications();

  // Fetch cancellation reasons
  const { data: reasons } = useQuery({
    queryKey: ["cancellation-reasons"],
    queryFn: async () => {
      const response = await adminApi.get("/api/admin/cancellation-reasons");
      if (!response.ok) throw new Error("Failed to fetch reasons");
      return response.json();
    },
  });

  const cancelMutation = useMutation({
    mutationFn: async () => {
      const response = await adminApi.post(
        `/api/admin/schedules/${sessionId}/cancel`,
        {
          cancellationReasonId,
          reasonDetails,
          sendNotifications: true,
          processRefunds: true,
        },
      );
      if (!response.ok) throw new Error("Failed to cancel session");
      return response.json();
    },
    onSuccess: (data) => {
      addNotification({
        type: "success",
        title: "Session cancelled successfully",
        message: `${data.emailsSent} notifications sent, ${data.refundsProcessed} refunds initiated`,
      });
      onSuccess();
    },
    onError: (error: Error) => {
      addNotification({
        type: "error",
        title: "Failed to cancel session",
        message: error.message,
      });
    },
  });

  const selectedReason = reasons?.find(
    (r: any) => r.id === parseInt(cancellationReasonId),
  );

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[60] p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
        <div className="flex items-start gap-4 mb-6">
          <div className="p-3 bg-red-100 rounded-full">
            <AlertTriangle className="w-6 h-6 text-red-600" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-gray-900">
              Cancel Session
            </h3>
            <p className="text-sm text-gray-500 mt-1">
              This will notify {attendeeCount} attendee
              {attendeeCount !== 1 ? "s" : ""} and process refunds
              automatically.
            </p>
          </div>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Cancellation Reason *
            </label>
            <select
              value={cancellationReasonId}
              onChange={(e) => setCancellationReasonId(e.target.value)}
              className="admin-select"
              required
            >
              <option value="">Select a reason...</option>
              {reasons?.map((reason: any) => (
                <option key={reason.id} value={reason.id}>
                  {reason.reason}
                </option>
              ))}
            </select>
          </div>

          {selectedReason?.requires_details && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Additional Details *
              </label>
              <textarea
                value={reasonDetails}
                onChange={(e) => setReasonDetails(e.target.value)}
                className="admin-input h-24"
                placeholder="Please provide more details..."
                required
              />
            </div>
          )}

          <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
            <p className="text-sm text-amber-800">
              <strong>This action will:</strong>
            </p>
            <ul className="text-sm text-amber-700 mt-2 space-y-1 list-disc list-inside">
              <li>Cancel the session and update its status</li>
              <li>Send cancellation emails to all attendees</li>
              <li>Process full refunds via Stripe</li>
              <li>Log this action for audit purposes</li>
            </ul>
          </div>
        </div>

        <div className="flex gap-3 mt-6">
          <Button variant="secondary" onClick={onClose} className="flex-1">
            Cancel
          </Button>
          <Button
            variant="primary"
            onClick={() => cancelMutation.mutate()}
            disabled={
              !cancellationReasonId ||
              cancelMutation.isPending ||
              (selectedReason?.requires_details && !reasonDetails)
            }
            className="flex-1 bg-red-600 hover:bg-red-700"
          >
            {cancelMutation.isPending
              ? "Processing..."
              : "Confirm Cancellation"}
          </Button>
        </div>
      </div>
    </div>
  );
};
