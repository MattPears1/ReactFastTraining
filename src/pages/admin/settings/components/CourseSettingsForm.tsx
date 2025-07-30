import React from "react";
import { Users, Clock, Calendar, MapPin, X, Plus } from "lucide-react";
import { CourseSettings } from "../types";

interface CourseSettingsFormProps {
  settings: CourseSettings;
  onChange: (settings: CourseSettings) => void;
  editMode: boolean;
}

export const CourseSettingsForm: React.FC<CourseSettingsFormProps> = ({
  settings,
  onChange,
  editMode,
}) => {
  const handleChange = (field: keyof CourseSettings, value: any) => {
    onChange({
      ...settings,
      [field]: value,
    });
  };

  const handleAddLocation = () => {
    const newLocation = prompt("Enter new location name:");
    if (newLocation) {
      handleChange("locations", [...settings.locations, newLocation]);
    }
  };

  const handleRemoveLocation = (index: number) => {
    const newLocations = settings.locations.filter((_, i) => i !== index);
    handleChange("locations", newLocations);
  };

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-medium text-gray-900 mb-4">
          Course Configuration
        </h3>

        {/* Capacity Settings */}
        <div className="mb-6">
          <h4 className="text-sm font-medium text-gray-700 mb-3 flex items-center gap-2">
            <Users className="h-4 w-4" />
            Capacity Settings
          </h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Maximum Participants
              </label>
              <input
                type="number"
                value={settings.maxParticipants}
                onChange={(e) =>
                  handleChange("maxParticipants", parseInt(e.target.value) || 0)
                }
                disabled={!editMode}
                min="1"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 disabled:bg-gray-50 disabled:text-gray-500"
              />
              <p className="mt-1 text-xs text-gray-500">
                Maximum number of participants per session
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Minimum Participants
              </label>
              <input
                type="number"
                value={settings.minParticipants}
                onChange={(e) =>
                  handleChange("minParticipants", parseInt(e.target.value) || 0)
                }
                disabled={!editMode}
                min="1"
                max={settings.maxParticipants}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 disabled:bg-gray-50 disabled:text-gray-500"
              />
              <p className="mt-1 text-xs text-gray-500">
                Minimum participants required to run a session
              </p>
            </div>
          </div>
        </div>

        {/* Booking Settings */}
        <div className="mb-6">
          <h4 className="text-sm font-medium text-gray-700 mb-3 flex items-center gap-2">
            <Calendar className="h-4 w-4" />
            Booking & Cancellation
          </h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Booking Deadline (days before)
              </label>
              <input
                type="number"
                value={settings.bookingDeadlineDays}
                onChange={(e) =>
                  handleChange(
                    "bookingDeadlineDays",
                    parseInt(e.target.value) || 0,
                  )
                }
                disabled={!editMode}
                min="0"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 disabled:bg-gray-50 disabled:text-gray-500"
              />
              <p className="mt-1 text-xs text-gray-500">
                How many days before the session bookings close
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Cancellation Deadline (days before)
              </label>
              <input
                type="number"
                value={settings.cancellationDeadlineDays}
                onChange={(e) =>
                  handleChange(
                    "cancellationDeadlineDays",
                    parseInt(e.target.value) || 0,
                  )
                }
                disabled={!editMode}
                min="0"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 disabled:bg-gray-50 disabled:text-gray-500"
              />
              <p className="mt-1 text-xs text-gray-500">
                How many days before the session cancellations are allowed
              </p>
            </div>
          </div>
        </div>

        {/* Session Settings */}
        <div className="mb-6">
          <h4 className="text-sm font-medium text-gray-700 mb-3 flex items-center gap-2">
            <Clock className="h-4 w-4" />
            Session Details
          </h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Session Duration (hours)
              </label>
              <input
                type="number"
                value={settings.sessionDuration}
                onChange={(e) =>
                  handleChange("sessionDuration", parseInt(e.target.value) || 0)
                }
                disabled={!editMode}
                min="1"
                step="0.5"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 disabled:bg-gray-50 disabled:text-gray-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Default Instructor
              </label>
              <input
                type="text"
                value={settings.defaultInstructor}
                onChange={(e) =>
                  handleChange("defaultInstructor", e.target.value)
                }
                disabled={!editMode}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 disabled:bg-gray-50 disabled:text-gray-500"
              />
            </div>
          </div>
        </div>

        {/* Locations */}
        <div>
          <h4 className="text-sm font-medium text-gray-700 mb-3 flex items-center gap-2">
            <MapPin className="h-4 w-4" />
            Training Locations
          </h4>
          <div className="space-y-2">
            {settings.locations.map((location, index) => (
              <div key={index} className="flex items-center gap-2">
                <input
                  type="text"
                  value={location}
                  onChange={(e) => {
                    const newLocations = [...settings.locations];
                    newLocations[index] = e.target.value;
                    handleChange("locations", newLocations);
                  }}
                  disabled={!editMode}
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 disabled:bg-gray-50 disabled:text-gray-500"
                />
                {editMode && settings.locations.length > 1 && (
                  <button
                    onClick={() => handleRemoveLocation(index)}
                    className="p-2 text-red-600 hover:bg-red-50 rounded-md"
                  >
                    <X className="h-4 w-4" />
                  </button>
                )}
              </div>
            ))}
            {editMode && (
              <button
                onClick={handleAddLocation}
                className="flex items-center gap-2 px-3 py-2 text-sm text-primary-600 hover:bg-primary-50 rounded-md"
              >
                <Plus className="h-4 w-4" />
                Add Location
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
