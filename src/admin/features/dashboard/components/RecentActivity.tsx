import React from "react";
import { formatDistanceToNow } from "date-fns";
import {
  UserPlus,
  Calendar,
  CreditCard,
  Edit,
  XCircle,
  Activity,
} from "lucide-react";

interface ActivityItem {
  id: number;
  action: string;
  user: string;
  timestamp: string;
  details: string;
}

interface RecentActivityProps {
  activities: ActivityItem[];
}

const getActivityIcon = (action: string) => {
  switch (action) {
    case "user.created":
      return <UserPlus className="h-4 w-4" />;
    case "booking.created":
    case "booking.confirmed":
      return <Calendar className="h-4 w-4" />;
    case "booking.cancelled":
      return <XCircle className="h-4 w-4" />;
    case "payment.received":
      return <CreditCard className="h-4 w-4" />;
    case "course.updated":
      return <Edit className="h-4 w-4" />;
    default:
      return <Activity className="h-4 w-4" />;
  }
};

const getActivityColor = (action: string) => {
  if (action.includes("created") || action.includes("confirmed")) {
    return "text-green-600 bg-green-100";
  }
  if (action.includes("cancelled") || action.includes("failed")) {
    return "text-red-600 bg-red-100";
  }
  if (action.includes("updated") || action.includes("edited")) {
    return "text-blue-600 bg-blue-100";
  }
  return "text-gray-600 bg-gray-100";
};

export const RecentActivity: React.FC<RecentActivityProps> = ({
  activities,
}) => {
  if (activities.length === 0) {
    return (
      <div className="text-center py-6 text-gray-500">No recent activity</div>
    );
  }

  return (
    <div className="flow-root">
      <ul className="-mb-8">
        {activities.slice(0, 8).map((activity, idx) => (
          <li key={activity.id}>
            <div className="relative pb-8">
              {idx !== activities.length - 1 && (
                <span
                  className="absolute top-4 left-4 -ml-px h-full w-0.5 bg-gray-200"
                  aria-hidden="true"
                />
              )}
              <div className="relative flex space-x-3">
                <div>
                  <span
                    className={`h-8 w-8 rounded-full flex items-center justify-center ring-8 ring-white ${getActivityColor(activity.action)}`}
                  >
                    {getActivityIcon(activity.action)}
                  </span>
                </div>
                <div className="flex min-w-0 flex-1 justify-between space-x-4 pt-1.5">
                  <div>
                    <p className="text-sm text-gray-600">
                      <span className="font-medium text-gray-900">
                        {activity.user}
                      </span>{" "}
                      {activity.details}
                    </p>
                  </div>
                  <div className="whitespace-nowrap text-right text-sm text-gray-500">
                    {formatDistanceToNow(new Date(activity.timestamp), {
                      addSuffix: true,
                    })}
                  </div>
                </div>
              </div>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
};
