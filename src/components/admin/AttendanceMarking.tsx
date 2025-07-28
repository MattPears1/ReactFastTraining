import React, { useState, useEffect } from "react";
import {
  adminApi,
  AttendanceRecord,
  SessionAttendance,
} from "@services/api/admin.service";
import { useWebSocket } from "@hooks/useWebSocket";
import {
  CheckCircle,
  XCircle,
  Clock,
  CircleDot,
  Save,
  Loader2,
  User,
  Mail,
  AlertCircle,
  Download,
} from "lucide-react";
import { cn } from "@utils/cn";
import { certificateService } from "@services/certificate/certificate.service";

interface AttendanceMarkingProps {
  sessionId: string;
  sessionDate: Date;
  courseName: string;
  onUpdate?: () => void;
  className?: string;
}

interface AttendanceItem extends SessionAttendance {
  newStatus?: "PRESENT" | "ABSENT" | "LATE" | "PARTIAL";
  newNotes?: string;
  hasChanges?: boolean;
}

const statusConfig = {
  PRESENT: {
    label: "Present",
    icon: CheckCircle,
    color: "text-green-600",
    bgColor: "bg-green-50",
    borderColor: "border-green-200",
  },
  ABSENT: {
    label: "Absent",
    icon: XCircle,
    color: "text-red-600",
    bgColor: "bg-red-50",
    borderColor: "border-red-200",
  },
  LATE: {
    label: "Late",
    icon: Clock,
    color: "text-yellow-600",
    bgColor: "bg-yellow-50",
    borderColor: "border-yellow-200",
  },
  PARTIAL: {
    label: "Partial",
    icon: CircleDot,
    color: "text-orange-600",
    bgColor: "bg-orange-50",
    borderColor: "border-orange-200",
  },
};

export const AttendanceMarking: React.FC<AttendanceMarkingProps> = ({
  sessionId,
  sessionDate,
  courseName,
  onUpdate,
  className = "",
}) => {
  const [attendance, setAttendance] = useState<AttendanceItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [markAllStatus, setMarkAllStatus] = useState<"PRESENT" | null>(null);

  const { isConnected } = useWebSocket({
    onAttendanceUpdate: (data) => {
      if (data.sessionId === sessionId) {
        loadAttendance();
      }
    },
  });

  useEffect(() => {
    loadAttendance();
  }, [sessionId]);

  const loadAttendance = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await adminApi.getSessionAttendance(sessionId);
      setAttendance(
        data.map((item) => ({
          ...item,
          newStatus: (item.status as any) || undefined,
          hasChanges: false,
        })),
      );
    } catch (err: any) {
      setError("Failed to load attendance data");
      console.error("Load attendance error:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleStatusChange = (
    bookingId: string,
    newStatus: "PRESENT" | "ABSENT" | "LATE" | "PARTIAL",
  ) => {
    setAttendance((prev) =>
      prev.map((item) => {
        if (item.bookingId === bookingId) {
          const hasChanges =
            newStatus !== item.status || item.newNotes !== item.notes;
          return { ...item, newStatus, hasChanges };
        }
        return item;
      }),
    );
    setSuccess(false);
  };

  const handleNotesChange = (bookingId: string, notes: string) => {
    setAttendance((prev) =>
      prev.map((item) => {
        if (item.bookingId === bookingId) {
          const hasChanges =
            (item.newStatus || item.status) !== item.status ||
            notes !== item.notes;
          return { ...item, newNotes: notes, hasChanges };
        }
        return item;
      }),
    );
    setSuccess(false);
  };

  const handleMarkAll = (status: "PRESENT") => {
    setMarkAllStatus(status);
    setAttendance((prev) =>
      prev.map((item) => ({
        ...item,
        newStatus: status,
        hasChanges: status !== item.status || item.newNotes !== item.notes,
      })),
    );
    setSuccess(false);
  };

  const handleSave = async () => {
    const changedItems = attendance.filter((item) => item.hasChanges);

    if (changedItems.length === 0) {
      setError("No changes to save");
      return;
    }

    // Validate attendance records
    const validStatuses = ["PRESENT", "ABSENT", "LATE", "PARTIAL"];
    for (const item of changedItems) {
      const status = item.newStatus || item.status;
      if (!status || !validStatuses.includes(status as string)) {
        setError(
          `Invalid status for ${item.userName}. Please select a valid status.`,
        );
        return;
      }

      // Validate notes length
      const notes = item.newNotes || item.notes || "";
      if (notes.length > 500) {
        setError(
          `Notes for ${item.userName} are too long (max 500 characters).`,
        );
        return;
      }
    }

    setSaving(true);
    setError(null);
    setSuccess(false);

    try {
      const attendanceRecords: AttendanceRecord[] = changedItems.map(
        (item) => ({
          bookingId: item.bookingId,
          userId: item.userId,
          status: item.newStatus || (item.status as any),
          notes: (item.newNotes || item.notes || "").trim().slice(0, 500), // Sanitize and limit notes
        }),
      );

      // Get admin name from session/context
      const adminName = localStorage.getItem("adminName") || "Admin";
      await adminApi.markAttendance(sessionId, attendanceRecords, adminName);

      setSuccess(true);
      setAttendance((prev) =>
        prev.map((item) => ({
          ...item,
          status: item.newStatus || item.status,
          notes: item.newNotes || item.notes,
          hasChanges: false,
        })),
      );

      // Generate certificates for present attendees
      const presentAttendees = attendance.filter(
        (item) => (item.newStatus || item.status) === "PRESENT",
      );

      if (presentAttendees.length > 0) {
        console.log(
          `Generating certificates for ${presentAttendees.length} attendees...`,
        );
        // Certificate generation is handled by the backend
      }

      onUpdate?.();

      // Hide success message after 3 seconds
      setTimeout(() => setSuccess(false), 3000);
    } catch (err: any) {
      setError(
        err.response?.data?.error?.message || "Failed to save attendance",
      );
      console.error("Save attendance error:", err);
    } finally {
      setSaving(false);
    }
  };

  const hasChanges = attendance.some((item) => item.hasChanges);
  const presentCount = attendance.filter(
    (item) => (item.newStatus || item.status) === "PRESENT",
  ).length;
  const totalCount = attendance.length;

  if (loading) {
    return (
      <div
        className={cn("bg-white rounded-lg shadow-sm border p-6", className)}
      >
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-primary-600" />
        </div>
      </div>
    );
  }

  return (
    <div className={cn("bg-white rounded-lg shadow-sm border", className)}>
      {/* Header */}
      <div className="p-6 border-b">
        <div className="flex justify-between items-start">
          <div>
            <h3 className="text-lg font-semibold text-gray-900">
              Mark Attendance
            </h3>
            <p className="text-sm text-gray-600 mt-1">{courseName}</p>
            <p className="text-sm text-gray-500">
              {new Date(sessionDate).toLocaleDateString("en-GB", {
                weekday: "long",
                day: "numeric",
                month: "long",
                year: "numeric",
              })}
            </p>
          </div>
          <div className="text-right">
            <p className="text-2xl font-bold text-primary-600">
              {presentCount}/{totalCount}
            </p>
            <p className="text-sm text-gray-500">Present</p>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="mt-4 flex gap-2">
          <button
            onClick={() => handleMarkAll("PRESENT")}
            className="px-4 py-2 text-sm bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
          >
            Mark All Present
          </button>
        </div>
      </div>

      {/* Alerts */}
      {error && (
        <div className="mx-6 mt-4 p-4 bg-red-50 border border-red-200 rounded-lg flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
          <p className="text-sm text-red-800">{error}</p>
        </div>
      )}

      {success && (
        <div className="mx-6 mt-4 p-4 bg-green-50 border border-green-200 rounded-lg">
          <div className="flex items-center gap-3 mb-2">
            <CheckCircle className="w-5 h-5 text-green-600" />
            <p className="text-sm text-green-800 font-medium">
              Attendance saved successfully!
            </p>
          </div>
          <p className="text-xs text-green-700 ml-8">
            Certificates will be automatically generated and emailed to
            attendees marked as present.
          </p>
        </div>
      )}

      {/* Attendance List */}
      <div className="p-6">
        {attendance.length === 0 ? (
          <div className="text-center py-12">
            <User className="w-12 h-12 text-gray-400 mx-auto mb-3" />
            <p className="text-gray-500">No bookings for this session</p>
          </div>
        ) : (
          <div className="space-y-4">
            {attendance.map((item) => {
              const currentStatus = item.newStatus || item.status || "PRESENT";
              const config =
                statusConfig[currentStatus as keyof typeof statusConfig];
              const StatusIcon = config.icon;

              return (
                <div
                  key={item.bookingId}
                  className={cn(
                    "p-4 rounded-lg border transition-all",
                    item.hasChanges
                      ? "border-primary-400 bg-primary-50"
                      : "border-gray-200",
                  )}
                >
                  <div className="flex items-start gap-4">
                    {/* Status Indicator */}
                    <div className={cn("p-2 rounded-lg", config.bgColor)}>
                      <StatusIcon className={cn("w-5 h-5", config.color)} />
                    </div>

                    {/* Attendee Info */}
                    <div className="flex-1">
                      <div className="flex items-start justify-between">
                        <div>
                          <h4 className="font-medium text-gray-900">
                            {item.userName}
                          </h4>
                          <div className="flex items-center gap-2 text-sm text-gray-600 mt-1">
                            <Mail className="w-4 h-4" />
                            {item.userEmail}
                          </div>
                          {item.markedAt && (
                            <p className="text-xs text-gray-500 mt-1">
                              Previously marked:{" "}
                              {new Date(item.markedAt).toLocaleString()}
                            </p>
                          )}
                        </div>

                        {/* Status Buttons */}
                        <div className="flex gap-2">
                          {Object.entries(statusConfig).map(([status, cfg]) => (
                            <button
                              key={status}
                              onClick={() =>
                                handleStatusChange(
                                  item.bookingId,
                                  status as any,
                                )
                              }
                              className={cn(
                                "px-3 py-1.5 text-sm rounded-lg border transition-all",
                                currentStatus === status
                                  ? `${cfg.bgColor} ${cfg.borderColor} ${cfg.color} font-medium`
                                  : "border-gray-300 text-gray-600 hover:bg-gray-50",
                              )}
                            >
                              {cfg.label}
                            </button>
                          ))}
                        </div>
                      </div>

                      {/* Notes */}
                      <div className="mt-3">
                        <input
                          type="text"
                          value={item.newNotes ?? item.notes ?? ""}
                          onChange={(e) =>
                            handleNotesChange(item.bookingId, e.target.value)
                          }
                          placeholder="Add notes (optional, max 500 characters)"
                          maxLength={500}
                          className="w-full px-3 py-1.5 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Save Button */}
        {attendance.length > 0 && (
          <div className="mt-6 flex justify-end">
            <button
              onClick={handleSave}
              disabled={!hasChanges || saving}
              className={cn(
                "px-6 py-2.5 rounded-lg font-medium transition-all flex items-center gap-2",
                hasChanges && !saving
                  ? "bg-primary-600 text-white hover:bg-primary-700"
                  : "bg-gray-200 text-gray-500 cursor-not-allowed",
              )}
            >
              {saving ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Save className="w-5 h-5" />
                  Save Attendance
                </>
              )}
            </button>
          </div>
        )}
      </div>

      {/* Connection Status */}
      {!isConnected && (
        <div className="px-6 pb-4">
          <p className="text-xs text-yellow-600 flex items-center gap-1">
            <AlertCircle className="w-3 h-3" />
            Real-time updates unavailable - refresh to see latest changes
          </p>
        </div>
      )}
    </div>
  );
};
