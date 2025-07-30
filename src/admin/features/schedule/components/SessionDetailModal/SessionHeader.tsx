import React from "react";
import { X } from "lucide-react";
import { format } from "date-fns";
import { SessionDetail } from "../../types";

interface SessionHeaderProps {
  isNewSession: boolean;
  editMode: boolean;
  session?: SessionDetail | null;
  onClose: () => void;
}

export const SessionHeader: React.FC<SessionHeaderProps> = ({
  isNewSession,
  editMode,
  session,
  onClose,
}) => {
  return (
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
  );
};