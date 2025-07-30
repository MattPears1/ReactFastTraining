import React, { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { AlertTriangle } from "lucide-react";
import { Button } from "../../../../../components/ui/Button";
import { adminApi } from "../../../../utils/api";
import { useNotifications } from "../../../../contexts/NotificationContext";
import { CancellationReason } from "../../types";

interface CancelSessionModalProps {
  sessionId: string;
  attendeeCount: number;
  onClose: () => void;
  onSuccess: () => void;
}

export const CancelSessionModal: React.FC<CancelSessionModalProps> = ({
  sessionId,
  attendeeCount,
  onClose,
  onSuccess,
}) => {
  const [cancellationReasonId, setCancellationReasonId] = useState("");
  const [reasonDetails, setReasonDetails] = useState("");
  const { addNotification } = useNotifications();

  // Fetch cancellation reasons
  const { data: reasons } = useQuery<CancellationReason[]>({
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
        }
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
    (r) => r.id === parseInt(cancellationReasonId)
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
              {reasons?.map((reason) => (
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