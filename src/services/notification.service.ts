import React from "react";
import { useNotifications } from "@contexts/NotificationContext";
import { NotificationType } from "@contexts/NotificationContext";

class NotificationService {
  private static instance: NotificationService;
  private addNotificationFn: any = null;
  private showSystemAlertFn: any = null;

  static getInstance(): NotificationService {
    if (!NotificationService.instance) {
      NotificationService.instance = new NotificationService();
    }
    return NotificationService.instance;
  }

  setHandlers(addNotification: any, showSystemAlert: any) {
    this.addNotificationFn = addNotification;
    this.showSystemAlertFn = showSystemAlert;
  }

  notify(
    type: NotificationType,
    title: string,
    message?: string,
    options?: {
      persistent?: boolean;
      duration?: number;
      actions?: Array<{ label: string; onClick: () => void }>;
      category?: string;
    },
  ) {
    if (!this.addNotificationFn) {
      console.warn("NotificationService: No handler set");
      return;
    }

    return this.addNotificationFn({
      type,
      title,
      message,
      ...options,
    });
  }

  success(title: string, message?: string, options?: any) {
    return this.notify("success", title, message, options);
  }

  error(title: string, message?: string, options?: any) {
    return this.notify("error", title, message, options);
  }

  warning(title: string, message?: string, options?: any) {
    return this.notify("warning", title, message, options);
  }

  info(title: string, message?: string, options?: any) {
    return this.notify("info", title, message, options);
  }

  systemAlert(
    type: NotificationType,
    title: string,
    message?: string,
    options?: {
      persistent?: boolean;
      actions?: Array<{
        label: string;
        onClick: () => void;
        primary?: boolean;
      }>;
    },
  ) {
    if (!this.showSystemAlertFn) {
      console.warn("NotificationService: No system alert handler set");
      return;
    }

    this.showSystemAlertFn({
      type,
      title,
      message,
      ...options,
    });
  }
}

export const notificationService = NotificationService.getInstance();

// Hook to initialize the service with context functions
export const useNotificationService = () => {
  const { addNotification, showSystemAlert } = useNotifications();

  React.useEffect(() => {
    notificationService.setHandlers(addNotification, showSystemAlert);
  }, [addNotification, showSystemAlert]);

  return notificationService;
};
