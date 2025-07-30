import React from "react";
import {
  Calendar,
  Clock,
  MapPin,
  Users,
  PoundSterling,
  RefreshCw,
  Mail,
  Copy,
} from "lucide-react";
import { format } from "date-fns";
import { Button } from "../../../../../components/ui/Button";
import { AdminBadge } from "../../../../components/ui/AdminBadge";
import { SessionDetail } from "../../types";

interface SessionDetailsProps {
  session: SessionDetail;
  selectedAttendees: number[];
  onSelectAttendee: (bookingId: number, selected: boolean) => void;
  onSendReminders: () => void;
  onEmailSelected: () => void;
  sendingReminders: boolean;
}

export const SessionDetails: React.FC<SessionDetailsProps> = ({
  session,
  selectedAttendees,
  onSelectAttendee,
  onSendReminders,
  onEmailSelected,
  sendingReminders,
}) => {
  const getStatusBadge = (status: string) => {
    const variants: Record<string, "success" | "warning" | "error" | "neutral"> = {
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

  return (
    <div className="space-y-6">
      {/* Session Info Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-4">
          <div className="flex items-center gap-3">
            <Calendar className="w-5 h-5 text-gray-400" />
            <div>
              <p className="text-sm text-gray-500">Date & Time</p>
              <p className="font-medium">
                {format(new Date(session.date), "EEEE, dd MMMM yyyy")}
              </p>
              <p className="text-sm text-gray-600">
                {session.startTime} - {session.endTime}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <MapPin className="w-5 h-5 text-gray-400" />
            <div>
              <p className="text-sm text-gray-500">Venue</p>
              <p className="font-medium">{session.venueName}</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <Users className="w-5 h-5 text-gray-400" />
            <div>
              <p className="text-sm text-gray-500">Capacity</p>
              <p className="font-medium">
                {session.currentBookings} / {session.maxParticipants}
              </p>
              <div className="w-32 bg-gray-200 rounded-full h-2 mt-1">
                <div
                  className="bg-primary-600 h-2 rounded-full"
                  style={{
                    width: `${(session.currentBookings / session.maxParticipants) * 100}%`,
                  }}
                />
              </div>
            </div>
          </div>
        </div>

        <div className="space-y-4">
          <div className="flex items-center gap-3">
            <RefreshCw className="w-5 h-5 text-gray-400" />
            <div>
              <p className="text-sm text-gray-500">Status</p>
              <AdminBadge variant={getStatusBadge(session.status)}>
                {session.status}
              </AdminBadge>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <PoundSterling className="w-5 h-5 text-gray-400" />
            <div>
              <p className="text-sm text-gray-500">Revenue</p>
              <p className="font-medium">£{session.revenue}</p>
            </div>
          </div>

          {session.instructor && (
            <div className="flex items-center gap-3">
              <Users className="w-5 h-5 text-gray-400" />
              <div>
                <p className="text-sm text-gray-500">Instructor</p>
                <p className="font-medium">{session.instructor}</p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Quick Actions */}
      <div className="flex gap-2">
        <Button
          variant="secondary"
          size="sm"
          onClick={onSendReminders}
          disabled={sendingReminders}
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
                onClick={onEmailSelected}
              >
                Email {selectedAttendees.length} Selected
              </Button>
            )}
          </div>

          <div className="space-y-2">
            {session.bookings.map((booking) => (
              <div
                key={booking.id}
                className="flex items-center justify-between p-3 border rounded-lg hover:bg-gray-50"
              >
                <div className="flex items-center gap-3">
                  <input
                    type="checkbox"
                    checked={selectedAttendees.includes(booking.id)}
                    onChange={(e) => onSelectAttendee(booking.id, e.target.checked)}
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
                  <AdminBadge variant={getPaymentBadge(booking.payment_status)}>
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
          <h3 className="text-sm font-medium text-gray-600 mb-2">Notes</h3>
          <p className="text-sm text-gray-900 p-3 bg-gray-50 rounded-lg">
            {session.notes}
          </p>
        </div>
      )}
    </div>
  );
};