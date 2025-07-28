import React, { useState, useEffect } from 'react';
import { 
  Calendar, 
  Clock, 
  MapPin, 
  User, 
  DollarSign, 
  Edit2, 
  Check, 
  X,
  Building,
  FileText
} from 'lucide-react';
import { format } from 'date-fns';
import { SessionDetails, UpdateSessionData, SessionViewMode } from '../../../types/schedule.types';
import { AdminCard } from '../../../components/ui/AdminCard';
import { AdminBadge } from '../../../components/ui/AdminBadge';
import { Button } from '../../../../components/ui/Button';

interface SessionInfoSectionProps {
  session: SessionDetails;
  viewMode: SessionViewMode;
  onEdit: () => void;
  onSave: (data: UpdateSessionData) => Promise<void>;
  onCancel: () => void;
  isLoading?: boolean;
}

interface EditableFieldProps {
  label: string;
  value: string | number;
  editValue: string | number;
  isEditing: boolean;
  type?: 'text' | 'number' | 'time' | 'date' | 'textarea';
  icon?: React.ReactNode;
  onChange: (value: string | number) => void;
  min?: number;
  max?: number;
  required?: boolean;
}

const EditableField: React.FC<EditableFieldProps> = ({
  label,
  value,
  editValue,
  isEditing,
  type = 'text',
  icon,
  onChange,
  min,
  max,
  required
}) => {
  return (
    <div className="space-y-2 group">
      <p className="text-sm font-semibold text-gray-700 flex items-center gap-2">
        {label}
        {required && <span className="text-red-500 text-xs">*</span>}
      </p>
      <div className="flex items-start sm:items-center space-x-3">
        {icon && (
          <span className="text-gray-400 flex-shrink-0 mt-2 sm:mt-0 transition-colors group-hover:text-primary-500">
            {icon}
          </span>
        )}
        {isEditing ? (
          type === 'textarea' ? (
            <textarea
              value={editValue}
              onChange={(e) => onChange(e.target.value)}
              className="flex-1 px-4 py-3 text-base sm:text-sm min-h-[80px] border-2 border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 resize-none transition-all duration-200 hover:border-gray-300"
              rows={3}
              required={required}
              placeholder={`Enter ${label.toLowerCase()}`}
            />
          ) : (
            <input
              type={type}
              value={editValue}
              onChange={(e) => onChange(type === 'number' ? parseInt(e.target.value) || 0 : e.target.value)}
              className="flex-1 px-4 py-3 text-base sm:text-sm min-h-[44px] border-2 border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all duration-200 hover:border-gray-300"
              min={min}
              max={max}
              required={required}
              placeholder={`Enter ${label.toLowerCase()}`}
            />
          )
        ) : (
          <span className="text-gray-900 break-words text-base sm:text-sm font-medium py-3">
            {value || <span className="text-gray-400 italic">Not set</span>}
          </span>
        )}
      </div>
    </div>
  );
};

export const SessionInfoSection: React.FC<SessionInfoSectionProps> = ({
  session,
  viewMode,
  onEdit,
  onSave,
  onCancel,
  isLoading: _isLoading = false
}) => {
  const [editData, setEditData] = useState<UpdateSessionData>({});
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (viewMode === 'edit') {
      // Initialize edit data with current values
      setEditData({
        startDate: session.startDate,
        endDate: session.endDate,
        startTime: session.startTime,
        endTime: session.endTime,
        pricePerPerson: session.pricePerPerson,
        maxParticipants: session.maxParticipants,
        notes: session.notes || ''
      });
    }
  }, [viewMode, session]);

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await onSave(editData);
    } finally {
      setIsSaving(false);
    }
  };

  const getStatusVariant = (status: string): 'success' | 'warning' | 'neutral' => {
    switch (status) {
      case 'SCHEDULED':
        return 'neutral';
      case 'CONFIRMED':
      case 'COMPLETED':
        return 'success';
      case 'IN_PROGRESS':
        return 'warning';
      case 'CANCELLED':
        return 'neutral';
      default:
        return 'neutral';
    }
  };

  const isEditing = viewMode === 'edit';

  return (
    <AdminCard 
      title="Session Information" 
      subtitle={session.course?.name}
      icon={FileText}
      iconColor="primary"
      className="schedule-card overflow-hidden"
      action={
        <div className="flex items-center gap-2">
          {isEditing ? (
            <>
              <Button
                size="sm"
                variant="primary"
                onClick={handleSave}
                disabled={isSaving}
                className="min-h-[40px] shadow-sm hover:shadow-md transition-all group"
              >
                {isSaving ? (
                  <div className="h-4 w-4 mr-2 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  <Check className="h-4 w-4 mr-1.5 group-hover:scale-110 transition-transform" />
                )}
                <span className="hidden sm:inline">{isSaving ? 'Saving...' : 'Save Changes'}</span>
              </Button>
              <Button
                size="sm"
                variant="secondary"
                onClick={onCancel}
                disabled={isSaving}
                className="min-h-[40px] hover:bg-gray-100 transition-all group"
              >
                <X className="h-4 w-4 mr-1.5 group-hover:rotate-90 transition-transform" />
                <span className="hidden sm:inline">Cancel</span>
              </Button>
            </>
          ) : (
            <Button
              size="sm"
              variant="secondary"
              onClick={onEdit}
              className="min-h-[40px] hover:bg-primary-50 hover:text-primary-700 hover:border-primary-300 transition-all group"
            >
              <Edit2 className="h-4 w-4 mr-1.5 group-hover:scale-110 transition-transform" />
              <span className="hidden sm:inline">Edit Details</span>
            </Button>
          )}
        </div>
      }
    >
      <div className="space-y-4 sm:space-y-6">
        {/* Status and Course Type - Mobile Stack */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <p className="text-sm font-medium text-gray-500">Course Type</p>
            <p className="mt-1 text-base sm:text-lg font-medium">{session.course?.category || 'N/A'}</p>
          </div>
          <div>
            <p className="text-sm font-medium text-gray-500">Status</p>
            <div className="mt-1">
              <AdminBadge variant={getStatusVariant(session.status)}>
                {session.status}
              </AdminBadge>
            </div>
          </div>
        </div>

        {/* Date and Time - Mobile Optimized */}
        <div className="space-y-4">
          <EditableField
            label="Date"
            value={format(new Date(session.startDate), 'EEEE, MMMM d, yyyy')}
            editValue={editData.startDate || session.startDate}
            isEditing={isEditing}
            type="date"
            icon={<Calendar className="h-5 w-5" />}
            onChange={(value) => setEditData({ ...editData, startDate: value as string })}
            required
          />
          <div className="grid grid-cols-2 gap-3">
            <EditableField
              label="Start Time"
              value={session.startTime}
              editValue={editData.startTime || session.startTime}
              isEditing={isEditing}
              type="time"
              icon={<Clock className="h-5 w-5" />}
              onChange={(value) => setEditData({ ...editData, startTime: value as string })}
              required
            />
            <EditableField
              label="End Time"
              value={session.endTime}
              editValue={editData.endTime || session.endTime}
              isEditing={isEditing}
              type="time"
              onChange={(value) => setEditData({ ...editData, endTime: value as string })}
              required
            />
          </div>
        </div>

        {/* Location and Instructor - Mobile Stack */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <div>
            <p className="text-sm font-medium text-gray-500">Location</p>
            <div className="mt-1 flex items-start space-x-2">
              <MapPin className="h-5 w-5 text-gray-400 mt-0.5 flex-shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="font-medium break-words">{session.location?.name}</p>
                <p className="text-sm text-gray-600 break-words">
                  {session.location?.address}, {session.location?.city} {session.location?.postcode}
                </p>
                {session.location?.directions && (
                  <a 
                    href={session.location.directions} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="text-sm text-primary-600 hover:text-primary-700 inline-block mt-1"
                  >
                    Get directions
                  </a>
                )}
              </div>
            </div>
          </div>
          <div>
            <p className="text-sm font-medium text-gray-500">Instructor</p>
            <div className="mt-1 flex items-start space-x-2">
              <User className="h-5 w-5 text-gray-400 mt-0.5 flex-shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="font-medium break-words">{session.trainer?.name}</p>
                <p className="text-sm text-gray-600">{session.trainer?.qualification}</p>
                {session.trainer?.email && (
                  <a 
                    href={`mailto:${session.trainer.email}`}
                    className="text-sm text-primary-600 hover:text-primary-700 break-all"
                  >
                    {session.trainer.email}
                  </a>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Pricing and Capacity - Mobile Stack */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <EditableField
            label="Price per Person"
            value={`£${session.pricePerPerson}`}
            editValue={editData.pricePerPerson || session.pricePerPerson}
            isEditing={isEditing}
            type="number"
            icon={<DollarSign className="h-5 w-5" />}
            onChange={(value) => setEditData({ ...editData, pricePerPerson: value as number })}
            min={0}
            required
          />
          <EditableField
            label="Maximum Capacity"
            value={session.maxParticipants}
            editValue={editData.maxParticipants || session.maxParticipants}
            isEditing={isEditing}
            type="number"
            icon={<User className="h-5 w-5" />}
            onChange={(value) => setEditData({ ...editData, maxParticipants: value as number })}
            min={session.currentParticipants}
            required
          />
        </div>

        {/* On-site Details - Mobile Optimized */}
        {session.isOnsite && (
          <div className="border-t pt-4">
            <div className="flex items-center space-x-2 mb-3">
              <Building className="h-5 w-5 text-gray-400" />
              <p className="font-medium text-gray-900">On-site Training</p>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <p className="text-sm font-medium text-gray-500">Client</p>
                <p className="mt-1 break-words">{session.onsiteClientName}</p>
              </div>
              {session.onsiteDetails && (
                <>
                  <div>
                    <p className="text-sm font-medium text-gray-500">Contact</p>
                    <p className="mt-1 break-words">{session.onsiteDetails.contactName}</p>
                    {session.onsiteDetails.contactEmail && (
                      <a 
                        href={`mailto:${session.onsiteDetails.contactEmail}`}
                        className="text-sm text-primary-600 hover:text-primary-700 break-all"
                      >
                        {session.onsiteDetails.contactEmail}
                      </a>
                    )}
                  </div>
                </>
              )}
            </div>
            {session.onsiteDetails?.specialRequirements && (
              <div className="mt-4">
                <p className="text-sm font-medium text-gray-500">Special Requirements</p>
                <p className="mt-1 text-sm text-gray-700 break-words">{session.onsiteDetails.specialRequirements}</p>
              </div>
            )}
          </div>
        )}

        {/* Notes - Mobile Optimized */}
        {(session.notes || isEditing) && (
          <EditableField
            label="Notes"
            value={session.notes || 'No notes'}
            editValue={editData.notes || ''}
            isEditing={isEditing}
            type="textarea"
            onChange={(value) => setEditData({ ...editData, notes: value as string })}
          />
        )}

        {/* Course Description */}
        {session.course?.description && (
          <div className="prose prose-sm max-w-none">
            <p className="text-sm font-medium text-gray-500">Course Description</p>
            <p className="mt-1 text-sm text-gray-700 break-words">{session.course.description}</p>
          </div>
        )}
      </div>
    </AdminCard>
  );
};