import { useMutation, useQueryClient } from "@tanstack/react-query";
import { adminApi } from "../../../utils/api";
import { useNotifications } from "../../../contexts/NotificationContext";
import { SessionFormData } from "../types";

export const useSessionMutations = (sessionId: string, isNewSession: boolean, onClose: () => void) => {
  const queryClient = useQueryClient();
  const { addNotification } = useNotifications();

  const saveMutation = useMutation({
    mutationFn: async (data: SessionFormData) => {
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

  const deleteMutation = useMutation({
    mutationFn: async () => {
      const response = await adminApi.delete(`/api/admin/schedules/${sessionId}`);
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

  const sendRemindersMutation = useMutation({
    mutationFn: async () => {
      const response = await adminApi.post(
        `/api/admin/schedules/${sessionId}/send-reminders`
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

  const emailAttendeesMutation = useMutation({
    mutationFn: async (data: {
      attendeeIds: number[];
      subject: string;
      message: string;
    }) => {
      const response = await adminApi.post(
        `/api/admin/schedules/${sessionId}/email-attendees`,
        data
      );
      if (!response.ok) throw new Error("Failed to send emails");
      return response.json();
    },
    onSuccess: () => {
      addNotification({ type: "success", title: "Emails sent successfully" });
    },
  });

  return {
    saveMutation,
    deleteMutation,
    sendRemindersMutation,
    emailAttendeesMutation,
  };
};