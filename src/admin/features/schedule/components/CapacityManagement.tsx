import React, { useState } from 'react';
import { 
  Users, 
  UserPlus, 
  AlertCircle, 
  TrendingUp,
  Clock,
  UserCheck,
  UserX
} from 'lucide-react';
import { AdminCard } from '../../../components/ui/AdminCard';
import { Button } from '../../../../components/ui/Button';
import { SessionDetails, CapacityInfo } from '../../../types/schedule.types';

interface CapacityManagementProps {
  session: SessionDetails;
  onAddBooking: () => void;
  onManageWaitlist?: () => void;
  onUpdateCapacity?: (newCapacity: number) => Promise<void>;
}

export const CapacityManagement: React.FC<CapacityManagementProps> = ({
  session,
  onAddBooking,
  onManageWaitlist,
  onUpdateCapacity
}) => {
  const [isEditingCapacity, setIsEditingCapacity] = useState(false);
  const [newCapacity, setNewCapacity] = useState(session.maxParticipants);

  // Calculate capacity information
  const capacityInfo: CapacityInfo = {
    maxCapacity: session.maxParticipants,
    currentBookings: session.currentParticipants,
    confirmedAttendees: session.bookings?.filter(b => b.status === 'confirmed').length || 0,
    waitlistCount: 0, // TODO: Get from backend
    availableSpots: Math.max(0, session.maxParticipants - session.currentParticipants),
    capacityPercentage: (session.currentParticipants / session.maxParticipants) * 100
  };

  const getCapacityColor = () => {
    if (capacityInfo.capacityPercentage >= 100) return 'text-red-600 bg-red-100';
    if (capacityInfo.capacityPercentage >= 80) return 'text-yellow-600 bg-yellow-100';
    return 'text-green-600 bg-green-100';
  };

  const getProgressBarColor = () => {
    if (capacityInfo.capacityPercentage >= 100) return 'bg-red-500';
    if (capacityInfo.capacityPercentage >= 80) return 'bg-yellow-500';
    return 'bg-green-500';
  };

  const handleCapacityUpdate = async () => {
    if (onUpdateCapacity && newCapacity !== session.maxParticipants) {
      await onUpdateCapacity(newCapacity);
      setIsEditingCapacity(false);
    }
  };

  const pendingBookings = session.bookings?.filter(b => b.status === 'pending').length || 0;
  const cancelledBookings = session.bookings?.filter(b => b.status === 'cancelled').length || 0;

  return (
    <AdminCard 
      title="Capacity & Bookings" 
      icon={Users}
      iconColor="primary"
      action={
        <div className="flex items-center space-x-2">
          {capacityInfo.availableSpots > 0 && (
            <Button
              size="sm"
              variant="primary"
              onClick={onAddBooking}
            >
              <UserPlus className="h-4 w-4 mr-1" />
              Add Booking
            </Button>
          )}
          {capacityInfo.waitlistCount > 0 && onManageWaitlist && (
            <Button
              size="sm"
              variant="secondary"
              onClick={onManageWaitlist}
            >
              Manage Waitlist ({capacityInfo.waitlistCount})
            </Button>
          )}
        </div>
      }
    >
      <div className="space-y-6">
        {/* Main Capacity Display */}
        <div className="text-center">
          <div className={`inline-flex items-center justify-center px-6 py-3 rounded-lg ${getCapacityColor()}`}>
            <span className="text-3xl font-bold">
              {capacityInfo.currentBookings}
            </span>
            <span className="text-xl mx-2">/</span>
            {isEditingCapacity ? (
              <input
                type="number"
                value={newCapacity}
                onChange={(e) => setNewCapacity(parseInt(e.target.value) || 0)}
                onBlur={handleCapacityUpdate}
                onKeyPress={(e) => e.key === 'Enter' && handleCapacityUpdate()}
                className="w-16 text-xl font-bold bg-transparent border-b-2 border-current focus:outline-none"
                min={capacityInfo.currentBookings}
              />
            ) : (
              <span 
                className="text-xl cursor-pointer hover:underline"
                onClick={() => setIsEditingCapacity(true)}
              >
                {capacityInfo.maxCapacity}
              </span>
            )}
          </div>
          <p className="mt-2 text-sm text-gray-600">
            {capacityInfo.availableSpots} spots available
          </p>
        </div>

        {/* Progress Bar */}
        <div>
          <div className="flex justify-between text-sm text-gray-600 mb-2">
            <span>Capacity</span>
            <span>{capacityInfo.capacityPercentage.toFixed(1)}% full</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-4 overflow-hidden">
            <div
              className={`h-full transition-all duration-300 ${getProgressBarColor()}`}
              style={{ width: `${Math.min(capacityInfo.capacityPercentage, 100)}%` }}
            />
          </div>
        </div>

        {/* Booking Breakdown */}
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-gray-50 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <UserCheck className="h-5 w-5 text-green-600" />
                <span className="text-sm font-medium text-gray-700">Confirmed</span>
              </div>
              <span className="text-xl font-bold text-green-600">
                {capacityInfo.confirmedAttendees}
              </span>
            </div>
          </div>
          
          <div className="bg-gray-50 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Clock className="h-5 w-5 text-yellow-600" />
                <span className="text-sm font-medium text-gray-700">Pending</span>
              </div>
              <span className="text-xl font-bold text-yellow-600">
                {pendingBookings}
              </span>
            </div>
          </div>
        </div>

        {/* Additional Stats */}
        <div className="border-t pt-4 space-y-3">
          {cancelledBookings > 0 && (
            <div className="flex items-center justify-between text-sm">
              <div className="flex items-center space-x-2 text-gray-600">
                <UserX className="h-4 w-4" />
                <span>Cancelled bookings</span>
              </div>
              <span className="font-medium">{cancelledBookings}</span>
            </div>
          )}
          
          {capacityInfo.waitlistCount > 0 && (
            <div className="flex items-center justify-between text-sm">
              <div className="flex items-center space-x-2 text-gray-600">
                <Clock className="h-4 w-4" />
                <span>On waitlist</span>
              </div>
              <span className="font-medium">{capacityInfo.waitlistCount}</span>
            </div>
          )}

          {/* Capacity Alert */}
          {capacityInfo.capacityPercentage >= 80 && capacityInfo.capacityPercentage < 100 && (
            <div className="flex items-start space-x-2 p-3 bg-yellow-50 rounded-lg">
              <AlertCircle className="h-5 w-5 text-yellow-600 flex-shrink-0 mt-0.5" />
              <div className="text-sm">
                <p className="font-medium text-yellow-800">Nearly full</p>
                <p className="text-yellow-700">
                  Only {capacityInfo.availableSpots} spots remaining. Consider opening a waitlist.
                </p>
              </div>
            </div>
          )}

          {capacityInfo.capacityPercentage >= 100 && (
            <div className="flex items-start space-x-2 p-3 bg-red-50 rounded-lg">
              <AlertCircle className="h-5 w-5 text-red-600 flex-shrink-0 mt-0.5" />
              <div className="text-sm">
                <p className="font-medium text-red-800">Session full</p>
                <p className="text-red-700">
                  No spots available. New bookings will be added to the waitlist.
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-2 gap-3">
          <button className="flex items-center justify-center space-x-2 p-3 bg-gray-50 hover:bg-gray-100 rounded-lg transition-colors">
            <TrendingUp className="h-5 w-5 text-gray-600" />
            <span className="text-sm font-medium">View Trends</span>
          </button>
          <button className="flex items-center justify-center space-x-2 p-3 bg-gray-50 hover:bg-gray-100 rounded-lg transition-colors">
            <Users className="h-5 w-5 text-gray-600" />
            <span className="text-sm font-medium">Suggest Capacity</span>
          </button>
        </div>
      </div>
    </AdminCard>
  );
};