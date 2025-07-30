import React, { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Bell, X, Check, Archive, Settings, Trash2 } from "lucide-react";
import { clsx } from "clsx";
import { formatDistanceToNow } from "date-fns";

import { Notification } from "@contexts/NotificationContext";

interface NotificationCenterProps {
  notifications: Notification[];
  onMarkAsRead: (id: string) => void;
  onMarkAllAsRead: () => void;
  onDelete: (id: string) => void;
  onClearAll: () => void;
  onSettingsClick?: () => void;
  onClose?: () => void;
}

export const NotificationCenter: React.FC<NotificationCenterProps> = ({
  notifications,
  onMarkAsRead,
  onMarkAllAsRead,
  onDelete,
  onClearAll,
  onSettingsClick,
  onClose,
}) => {
  const [filter, setFilter] = useState<"all" | "unread">("all");
  const dropdownRef = useRef<HTMLDivElement>(null);

  const unreadCount = notifications.filter((n) => !n.read).length;
  const filteredNotifications =
    filter === "unread" ? notifications.filter((n) => !n.read) : notifications;

  // Component is now externally controlled, click outside handled by parent

  const getNotificationIcon = (type: Notification["type"]) => {
    const iconClasses = {
      info: "bg-blue-100 dark:bg-blue-900 text-blue-600 dark:text-blue-300",
      success:
        "bg-green-100 dark:bg-green-900 text-green-600 dark:text-green-300",
      warning:
        "bg-yellow-100 dark:bg-yellow-900 text-yellow-600 dark:text-yellow-300",
      error: "bg-red-100 dark:bg-red-900 text-red-600 dark:text-red-300",
    };

    return (
      <div
        className={clsx(
          "w-2 h-2 rounded-full",
          iconClasses[type] || iconClasses.info,
        )}
      />
    );
  };

  return (
    <div className="notification-center-container" ref={dropdownRef}>
      {/* Notification Dropdown */}
      <AnimatePresence>
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 10 }}
          transition={{ duration: 0.2 }}
          className="absolute right-0 mt-2 w-full sm:w-96 max-w-[calc(100vw-2rem)] sm:max-w-none bg-white dark:bg-gray-800 rounded-xl shadow-xl border border-gray-200 dark:border-gray-700 overflow-hidden z-50"
        >
          {/* Header */}
          <div className="p-4 border-b border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                Notifications
              </h3>
              <div className="flex items-center gap-2">
                {onSettingsClick && (
                  <button
                    onClick={onSettingsClick}
                    className="p-1.5 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                    aria-label="Notification settings"
                  >
                    <Settings className="w-4 h-4" />
                  </button>
                )}
                <button
                  onClick={onClose}
                  className="p-1.5 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                  aria-label="Close notifications"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Filter Tabs */}
            <div className="flex gap-4">
              <button
                onClick={() => setFilter("all")}
                className={clsx(
                  "text-sm font-medium pb-1 border-b-2 transition-colors",
                  filter === "all"
                    ? "text-primary-600 dark:text-primary-400 border-primary-600 dark:border-primary-400"
                    : "text-gray-500 dark:text-gray-400 border-transparent hover:text-gray-700 dark:hover:text-gray-200",
                )}
              >
                All ({notifications.length})
              </button>
              <button
                onClick={() => setFilter("unread")}
                className={clsx(
                  "text-sm font-medium pb-1 border-b-2 transition-colors",
                  filter === "unread"
                    ? "text-primary-600 dark:text-primary-400 border-primary-600 dark:border-primary-400"
                    : "text-gray-500 dark:text-gray-400 border-transparent hover:text-gray-700 dark:hover:text-gray-200",
                )}
              >
                Unread ({unreadCount})
              </button>
            </div>
          </div>

          {/* Notifications List */}
          <div className="max-h-[60vh] sm:max-h-96 overflow-y-auto">
            {filteredNotifications.length === 0 ? (
              <div className="p-8 text-center">
                <Bell className="w-12 h-12 mx-auto text-gray-300 dark:text-gray-600 mb-3" />
                <p className="text-gray-500 dark:text-gray-400">
                  {filter === "unread"
                    ? "No unread notifications"
                    : "No notifications yet"}
                </p>
              </div>
            ) : (
              <div className="divide-y divide-gray-200 dark:divide-gray-700">
                {filteredNotifications.map((notification) => (
                  <motion.div
                    key={notification.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 20 }}
                    className={clsx(
                      "p-4 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors cursor-pointer relative",
                      !notification.read && "bg-blue-50/50 dark:bg-blue-900/10",
                    )}
                    onClick={() => onMarkAsRead(notification.id)}
                  >
                    <div className="flex gap-3">
                      {/* Avatar or Icon */}
                      <div className="flex-shrink-0">
                        {notification.avatar ? (
                          <img
                            src={notification.avatar}
                            alt=""
                            className="w-10 h-10 rounded-full"
                          />
                        ) : (
                          <div className="w-10 h-10 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center">
                            {getNotificationIcon(notification.type)}
                          </div>
                        )}
                      </div>

                      {/* Content */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <p
                              className={clsx(
                                "text-sm",
                                !notification.read
                                  ? "font-semibold text-gray-900 dark:text-white"
                                  : "font-medium text-gray-700 dark:text-gray-300",
                              )}
                            >
                              {notification.title}
                            </p>
                            {notification.message && (
                              <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                                {notification.message}
                              </p>
                            )}
                            {notification.actions &&
                              notification.actions.length > 0 && (
                                <div className="mt-2 flex gap-2">
                                  {notification.actions.map((action, idx) => (
                                    <button
                                      key={idx}
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        action.onClick();
                                      }}
                                      className="inline-flex items-center text-sm text-primary-600 dark:text-primary-400 hover:text-primary-700 dark:hover:text-primary-300"
                                    >
                                      {action.label}
                                      <span className="ml-1">→</span>
                                    </button>
                                  ))}
                                </div>
                              )}
                          </div>

                          {/* Delete button */}
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              onDelete(notification.id);
                            }}
                            className="ml-2 p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 rounded hover:bg-gray-100 dark:hover:bg-gray-700 opacity-0 group-hover:opacity-100 transition-opacity"
                            aria-label="Delete notification"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </div>

                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                          {formatDistanceToNow(notification.timestamp, {
                            addSuffix: true,
                          })}
                        </p>
                      </div>

                      {/* Unread indicator */}
                      {!notification.read && (
                        <div className="absolute top-4 right-4 w-2 h-2 bg-blue-600 rounded-full" />
                      )}
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
          </div>

          {/* Footer */}
          {notifications.length > 0 && (
            <div className="p-3 border-t border-gray-200 dark:border-gray-700 flex justify-between">
              <button
                onClick={onMarkAllAsRead}
                disabled={unreadCount === 0}
                className={clsx(
                  "text-sm font-medium transition-colors",
                  unreadCount > 0
                    ? "text-primary-600 dark:text-primary-400 hover:text-primary-700 dark:hover:text-primary-300"
                    : "text-gray-400 dark:text-gray-600 cursor-not-allowed",
                )}
              >
                <Check className="w-4 h-4 inline mr-1" />
                Mark all as read
              </button>
              <button
                onClick={onClearAll}
                className="text-sm font-medium text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 transition-colors"
              >
                <Trash2 className="w-4 h-4 inline mr-1" />
                Clear all
              </button>
            </div>
          )}
        </motion.div>
      </AnimatePresence>
    </div>
  );
};
