import React from 'react';
import { Calendar, XCircle, Edit, UserPlus, Mail, AlertCircle } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { Link } from 'react-router-dom';
import { cn } from '@utils/cn';

interface Activity {
  type: 'new_booking' | 'cancellation' | 'update' | 'new_user' | 'email_sent';
  booking?: any;
  user?: any;
  timestamp: Date | string;
  details?: string;
}

interface RecentActivityFeedProps {
  activities: Activity[];
}

export const RecentActivityFeed: React.FC<RecentActivityFeedProps> = ({ activities }) => {
  const getActivityIcon = (type: Activity['type']) => {
    switch (type) {
      case 'new_booking':
        return { icon: Calendar, color: 'text-green-600 bg-green-100 dark:bg-green-900/30' };
      case 'cancellation':
        return { icon: XCircle, color: 'text-red-600 bg-red-100 dark:bg-red-900/30' };
      case 'update':
        return { icon: Edit, color: 'text-blue-600 bg-blue-100 dark:bg-blue-900/30' };
      case 'new_user':
        return { icon: UserPlus, color: 'text-purple-600 bg-purple-100 dark:bg-purple-900/30' };
      case 'email_sent':
        return { icon: Mail, color: 'text-gray-600 bg-gray-100 dark:bg-gray-700' };
      default:
        return { icon: AlertCircle, color: 'text-gray-600 bg-gray-100 dark:bg-gray-700' };
    }
  };

  const getActivityMessage = (activity: Activity): string => {
    switch (activity.type) {
      case 'new_booking':
        return `New booking for ${activity.booking?.session?.courseType || 'Unknown Course'}`;
      case 'cancellation':
        return `Booking cancelled for ${activity.booking?.session?.courseType || 'Unknown Course'}`;
      case 'update':
        return `Booking updated for ${activity.booking?.session?.courseType || 'Unknown Course'}`;
      case 'new_user':
        return `New user registered`;
      case 'email_sent':
        return activity.details || 'Email sent';
      default:
        return 'Unknown activity';
    }
  };

  if (activities.length === 0) {
    return (
      <div className="text-center py-8">
        <AlertCircle className="w-12 h-12 text-gray-400 mx-auto mb-3" />
        <p className="text-gray-500 dark:text-gray-400">No recent activity</p>
      </div>
    );
  }

  return (
    <div className="space-y-4 max-h-96 overflow-y-auto">
      {activities.map((activity, index) => {
        const { icon: Icon, color } = getActivityIcon(activity.type);
        const message = getActivityMessage(activity);
        const timeAgo = formatDistanceToNow(new Date(activity.timestamp), { addSuffix: true });

        return (
          <div key={index} className="flex items-start gap-3">
            <div className={cn(
              "w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0",
              color
            )}>
              <Icon className="w-4 h-4" />
            </div>
            
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-gray-900 dark:text-white">
                {message}
              </p>
              
              {activity.user && (
                <p className="text-sm text-gray-600 dark:text-gray-400 mt-0.5">
                  {activity.user.name} ({activity.user.email})
                </p>
              )}
              
              {activity.booking && (
                <div className="flex items-center gap-3 mt-1">
                  <Link
                    to={`/admin/bookings/${activity.booking.id}`}
                    className="text-xs text-primary-600 hover:text-primary-700 dark:text-primary-400"
                  >
                    {activity.booking.bookingReference}
                  </Link>
                  {activity.booking.totalAmount && (
                    <span className="text-xs text-gray-500 dark:text-gray-400">
                      £{activity.booking.totalAmount.toFixed(2)}
                    </span>
                  )}
                </div>
              )}
              
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                {timeAgo}
              </p>
            </div>
          </div>
        );
      })}
    </div>
  );
};