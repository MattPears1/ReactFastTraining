import React from "react";
import { Edit3, Trash2, Ban } from "lucide-react";
import { Button } from "../../../../../components/ui/Button";

interface SessionFooterProps {
  isNewSession: boolean;
  editMode: boolean;
  isSaving: boolean;
  isDeleting: boolean;
  onClose: () => void;
  onEdit: () => void;
  onCancelEdit: () => void;
  onDelete: () => void;
  onCancelSession: () => void;
  onSave: () => void;
}

export const SessionFooter: React.FC<SessionFooterProps> = ({
  isNewSession,
  editMode,
  isSaving,
  isDeleting,
  onClose,
  onEdit,
  onCancelEdit,
  onDelete,
  onCancelSession,
  onSave,
}) => {
  return (
    <div className="flex items-center justify-between p-6 border-t bg-gray-50">
      <div className="flex gap-2">
        {!isNewSession && !editMode && (
          <>
            <Button
              variant="secondary"
              onClick={onCancelSession}
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
                    "Are you sure you want to delete this session?"
                  )
                ) {
                  onDelete();
                }
              }}
              disabled={isDeleting}
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
              onCancelEdit();
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
            onClick={onSave}
            disabled={isSaving}
          >
            {isSaving ? "Saving..." : "Save Changes"}
          </Button>
        ) : (
          !isNewSession && (
            <Button variant="primary" onClick={onEdit}>
              <Edit3 className="w-4 h-4 mr-2" />
              Edit Session
            </Button>
          )
        )}
      </div>
    </div>
  );
};