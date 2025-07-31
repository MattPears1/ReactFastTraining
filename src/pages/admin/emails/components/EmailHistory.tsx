import React from "react";
import { CheckCircle, AlertCircle, Clock, Eye } from "lucide-react";
import { EmailHistory as EmailHistoryType, EmailFilters } from "../types";
import { cn } from "@utils/cn";

interface EmailHistoryProps {
  history: EmailHistoryType[];
  filters: EmailFilters;
  onViewDetails: (email: EmailHistoryType) => void;
}

export const EmailHistory: React.FC<EmailHistoryProps> = ({
  history,
  filters,
  onViewDetails,
}) => {
  // Filter history based on search and filters
  const filteredHistory = history.filter((email) => {
    if (filters.search && 
        !email.subject.toLowerCase().includes(filters.search.toLowerCase()) &&
        !email.template.toLowerCase().includes(filters.search.toLowerCase())) {
      return false;
    }
    if (filters.status && email.status !== filters.status) {
      return false;
    }
    return true;
  });

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "delivered":
        return <CheckCircle className="w-4 h-4 text-green-500" />;
      case "failed":
        return <AlertCircle className="w-4 h-4 text-red-500" />;
      case "pending":
        return <Clock className="w-4 h-4 text-yellow-500" />;
      default:
        return null;
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInHours = (now.getTime() - date.getTime()) / (1000 * 60 * 60);

    if (diffInHours < 24) {
      return date.toLocaleTimeString('en-GB', { 
        hour: '2-digit', 
        minute: '2-digit' 
      });
    } else if (diffInHours < 48) {
      return 'Yesterday';
    } else {
      return date.toLocaleDateString('en-GB', {
        day: 'numeric',
        month: 'short',
        year: date.getFullYear() !== now.getFullYear() ? 'numeric' : undefined,
      });
    }
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow">
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-gray-200 dark:border-gray-700">
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                Status
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                Email
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                Recipients
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                Sent
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                Open Rate
              </th>
              <th className="relative px-6 py-3">
                <span className="sr-only">Actions</span>
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
            {filteredHistory.map((email) => (
              <tr
                key={email.id}
                className="hover:bg-gray-50 dark:hover:bg-gray-700"
              >
                <td className="px-6 py-4">
                  <div className="flex items-center">
                    {getStatusIcon(email.status)}
                    <span className={cn(
                      "ml-2 text-sm font-medium",
                      email.status === "delivered" && "text-green-600 dark:text-green-400",
                      email.status === "failed" && "text-red-600 dark:text-red-400",
                      email.status === "pending" && "text-yellow-600 dark:text-yellow-400"
                    )}>
                      {email.status}
                    </span>
                  </div>
                </td>
                <td className="px-6 py-4">
                  <div>
                    <div className="text-sm font-medium text-gray-900 dark:text-white">
                      {email.subject}
                    </div>
                    <div className="text-sm text-gray-500 dark:text-gray-400">
                      Template: {email.template}
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4 text-sm text-gray-500 dark:text-gray-400">
                  {email.recipients}
                </td>
                <td className="px-6 py-4 text-sm text-gray-500 dark:text-gray-400">
                  {formatDate(email.sentAt)}
                </td>
                <td className="px-6 py-4">
                  {email.openRate !== undefined ? (
                    <div className="flex items-center">
                      <div className="w-16 bg-gray-200 dark:bg-gray-700 rounded-full h-2 mr-2">
                        <div
                          className="bg-primary-600 h-2 rounded-full"
                          style={{ width: `${email.openRate}%` }}
                        />
                      </div>
                      <span className="text-sm text-gray-500 dark:text-gray-400">
                        {email.openRate}%
                      </span>
                    </div>
                  ) : (
                    <span className="text-sm text-gray-400">-</span>
                  )}
                </td>
                <td className="px-6 py-4 text-right text-sm font-medium">
                  <button
                    onClick={() => onViewDetails(email)}
                    className="text-primary-600 hover:text-primary-900 dark:text-primary-400 dark:hover:text-primary-300"
                    title="View Details"
                  >
                    <Eye className="w-4 h-4" />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {filteredHistory.length === 0 && (
          <div className="text-center py-12">
            <AlertCircle className="w-12 h-12 text-gray-400 mx-auto mb-2" />
            <p className="text-gray-500 dark:text-gray-400">
              No emails found matching your criteria
            </p>
          </div>
        )}
      </div>
    </div>
  );
};