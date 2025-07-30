import { useCallback } from "react";
import { useAuth } from "@contexts/AuthContext";

export interface AuditAction {
  action: string;
  category:
    | "auth"
    | "booking"
    | "course"
    | "user"
    | "payment"
    | "email"
    | "settings"
    | "security";
  severity: "info" | "warning" | "error" | "critical";
  details?: Record<string, any>;
  timestamp?: string;
}

export const useAuditTrail = () => {
  const { user } = useAuth();

  const logAction = useCallback(
    async (auditAction: AuditAction) => {
      if (!user) return;

      const logEntry = {
        ...auditAction,
        userId: user.id,
        userName: user.name,
        timestamp: auditAction.timestamp || new Date().toISOString(),
        ipAddress: await getClientIP(),
        userAgent: navigator.userAgent,
        sessionId: getSessionId(),
      };

      try {
        // Queue the audit log entry
        queueAuditLog(logEntry);

        // For critical actions, log immediately
        if (
          auditAction.severity === "critical" ||
          auditAction.severity === "error"
        ) {
          await sendAuditLog(logEntry);
        }
      } catch (error) {
        console.error("Failed to log audit action:", error);
      }
    },
    [user],
  );

  const logBulkAction = useCallback(
    async (
      action: string,
      category: AuditAction["category"],
      itemCount: number,
      details?: Record<string, any>,
    ) => {
      await logAction({
        action: `bulk_${action}`,
        category,
        severity: "warning",
        details: {
          ...details,
          itemCount,
          bulkOperation: true,
        },
      });
    },
    [logAction],
  );

  const logSecurityEvent = useCallback(
    async (
      event: string,
      severity: "warning" | "error" | "critical",
      details?: Record<string, any>,
    ) => {
      await logAction({
        action: event,
        category: "security",
        severity,
        details,
      });
    },
    [logAction],
  );

  const logDataExport = useCallback(
    async (dataType: string, recordCount: number, format: string) => {
      await logAction({
        action: "data_export",
        category: "security",
        severity: "warning",
        details: {
          dataType,
          recordCount,
          format,
          exportTime: new Date().toISOString(),
        },
      });
    },
    [logAction],
  );

  return {
    logAction,
    logBulkAction,
    logSecurityEvent,
    logDataExport,
  };
};

// Audit log queue for batching
const auditLogQueue: any[] = [];
let queueTimer: NodeJS.Timeout | null = null;

const queueAuditLog = (logEntry: any) => {
  auditLogQueue.push(logEntry);

  // Batch send every 5 seconds or when queue reaches 10 items
  if (auditLogQueue.length >= 10) {
    flushAuditQueue();
  } else if (!queueTimer) {
    queueTimer = setTimeout(flushAuditQueue, 5000);
  }
};

const flushAuditQueue = async () => {
  if (queueTimer) {
    clearTimeout(queueTimer);
    queueTimer = null;
  }

  if (auditLogQueue.length === 0) return;

  const logsToSend = [...auditLogQueue];
  auditLogQueue.length = 0;

  try {
    await sendBatchAuditLogs(logsToSend);
  } catch (error) {
    console.error("Failed to send batch audit logs:", error);
    // Re-queue failed logs
    auditLogQueue.unshift(...logsToSend);
  }
};

const sendAuditLog = async (logEntry: any) => {
  // In production, this would send to the audit log API
  console.log("Audit log:", logEntry);
  // await fetch('/api/admin/audit-log', {
  //   method: 'POST',
  //   headers: { 'Content-Type': 'application/json' },
  //   body: JSON.stringify(logEntry),
  // });
};

const sendBatchAuditLogs = async (logs: any[]) => {
  // In production, this would send to the audit log API
  console.log("Batch audit logs:", logs);
  // await fetch('/api/admin/audit-log/batch', {
  //   method: 'POST',
  //   headers: { 'Content-Type': 'application/json' },
  //   body: JSON.stringify({ logs }),
  // });
};

const getClientIP = async (): Promise<string> => {
  try {
    // In production, this would get the real IP from the server
    // const response = await fetch('/api/client-ip');
    // const data = await response.json();
    // return data.ip;
    return "CLIENT_IP";
  } catch {
    return "unknown";
  }
};

const getSessionId = (): string => {
  let sessionId = sessionStorage.getItem("adminSessionId");
  if (!sessionId) {
    sessionId = `admin_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    sessionStorage.setItem("adminSessionId", sessionId);
  }
  return sessionId;
};

// Auto-flush queue on page unload
if (typeof window !== "undefined") {
  window.addEventListener("beforeunload", () => {
    if (auditLogQueue.length > 0) {
      // Use sendBeacon for reliability
      const data = new Blob([JSON.stringify({ logs: auditLogQueue })], {
        type: "application/json",
      });
      navigator.sendBeacon("/api/admin/audit-log/batch", data);
    }
  });
}
