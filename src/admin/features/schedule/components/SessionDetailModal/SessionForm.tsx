import React from "react";
import { SessionFormData, Course, Venue } from "../../types";

interface SessionFormProps {
  formData: SessionFormData;
  courses?: Course[];
  venues?: Venue[];
  onSubmit: (e: React.FormEvent) => void;
  onChange: (data: SessionFormData) => void;
}

export const SessionForm: React.FC<SessionFormProps> = ({
  formData,
  courses,
  venues,
  onSubmit,
  onChange,
}) => {
  return (
    <form onSubmit={onSubmit} className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Course *
          </label>
          <select
            value={formData.courseId}
            onChange={(e) =>
              onChange({ ...formData, courseId: e.target.value })
            }
            className="admin-select"
            required
          >
            <option value="">Select a course...</option>
            {courses?.map((course) => (
              <option key={course.id} value={course.id}>
                {course.name} - £{course.price}
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
              onChange({ ...formData, venueId: e.target.value })
            }
            className="admin-select"
            required
          >
            <option value="">Select a venue...</option>
            {venues?.map((venue) => (
              <option key={venue.id} value={venue.id}>
                {venue.name} (Max: {venue.capacity})
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
              onChange({ ...formData, date: e.target.value })
            }
            className="admin-input"
            required
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
              onChange({
                ...formData,
                maxCapacity: parseInt(e.target.value) || 0,
              })
            }
            className="admin-input"
            min="1"
            max="30"
            required
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
              onChange({ ...formData, startTime: e.target.value })
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
              onChange({ ...formData, endTime: e.target.value })
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
            onChange({ ...formData, notes: e.target.value })
          }
          className="admin-input h-24"
          placeholder="Any special instructions or notes..."
        />
      </div>
    </form>
  );
};