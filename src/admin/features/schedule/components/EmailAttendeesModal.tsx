import React, { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { X, Mail, Send } from "lucide-react";
import { Button } from "../../../../components/ui/Button";
import { useNotifications } from "../../../contexts/NotificationContext";
import { adminApi } from "../../../utils/api";

interface EmailAttendeesModalProps {
  isOpen: boolean;
  onClose: () => void;
  sessionId: string;
  attendeeIds: number[];
  attendeeNames: string[];
}

export const EmailAttendeesModal: React.FC<EmailAttendeesModalProps> = ({
  isOpen,
  onClose,
  sessionId,
  attendeeIds,
  attendeeNames,
}) => {
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const { addNotification } = useNotifications();

  const sendEmailMutation = useMutation({
    mutationFn: async (data: { subject: string; message: string }) => {
      const response = await adminApi.post(
        `/api/admin/schedules/${sessionId}/email-attendees`,
        {
          attendeeIds,
          subject: data.subject,
          message: data.message,
        },
      );
      if (!response.ok) throw new Error("Failed to send emails");
      return response.json();
    },
    onSuccess: (data) => {
      addNotification({
        type: "success",
        title: `Emails sent to ${data.emailsSent} attendees`,
      });
      onClose();
    },
    onError: (error: Error) => {
      addNotification({
        type: "error",
        title: "Failed to send emails",
        message: error.message,
      });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!subject.trim() || !message.trim()) {
      addNotification({
        type: "error",
        title: "Please fill in all fields",
      });
      return;
    }
    sendEmailMutation.mutate({ subject, message });
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-primary-100 rounded-lg">
              <Mail className="w-5 h-5 text-primary-600" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-900">
                Email Attendees
              </h2>
              <p className="text-sm text-gray-500 mt-1">
                Send email to {attendeeIds.length} selected attendee
                {attendeeIds.length !== 1 ? "s" : ""}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {/* Recipients */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Recipients
            </label>
            <div className="p-3 bg-gray-50 rounded-lg max-h-24 overflow-y-auto">
              <p className="text-sm text-gray-600">
                {attendeeNames.slice(0, 3).join(", ")}
                {attendeeNames.length > 3 &&
                  ` and ${attendeeNames.length - 3} more`}
              </p>
            </div>
          </div>

          {/* Subject */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Subject *
            </label>
            <input
              type="text"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              className="admin-input"
              placeholder="Enter email subject..."
              required
            />
          </div>

          {/* Message */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Message *
            </label>
            <textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              className="admin-input h-32"
              placeholder="Enter your message..."
              required
            />
            <p className="text-xs text-gray-500 mt-1">
              This message will be sent from React Fast Training
            </p>
          </div>

          {/* Preview */}
          {(subject || message) && (
            <div className="border rounded-lg p-4 bg-gray-50">
              <p className="text-xs font-medium text-gray-600 mb-2">Preview</p>
              <div className="bg-white rounded border p-3 text-sm">
                <p className="font-medium text-gray-900 mb-2">
                  {subject || "(No subject)"}
                </p>
                <p className="text-gray-700 whitespace-pre-wrap">
                  Dear [Attendee Name],
                  {"\n\n"}
                  {message || "(No message)"}
                  {"\n\n"}
                  Best regards,
                  {"\n"}
                  React Fast Training Team
                </p>
              </div>
            </div>
          )}
        </form>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 p-6 border-t bg-gray-50">
          <Button
            variant="secondary"
            onClick={onClose}
            disabled={sendEmailMutation.isPending}
          >
            Cancel
          </Button>
          <Button
            variant="primary"
            onClick={handleSubmit}
            disabled={
              sendEmailMutation.isPending || !subject.trim() || !message.trim()
            }
          >
            {sendEmailMutation.isPending ? (
              <>Sending...</>
            ) : (
              <>
                <Send className="w-4 h-4 mr-2" />
                Send Email
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  );
};
