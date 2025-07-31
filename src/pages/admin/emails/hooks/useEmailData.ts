import { useState, useCallback, useEffect } from "react";
import { adminDashboardApi } from "@services/api/admin-dashboard.service";
import { EmailTemplate, EmailHistory, EmailRecipient, EmailFilters, TabType } from "../types";

export const useEmailData = () => {
  const [activeTab, setActiveTab] = useState<TabType>("templates");
  const [templates, setTemplates] = useState<EmailTemplate[]>([]);
  const [history, setHistory] = useState<EmailHistory[]>([]);
  const [recipients, setRecipients] = useState<EmailRecipient[]>([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState<EmailFilters>({
    search: "",
    category: "",
    status: "",
  });

  // Load email templates
  const loadTemplates = useCallback(async () => {
    try {
      // Mock data for now
      const mockTemplates: EmailTemplate[] = [
        {
          id: "1",
          name: "Booking Confirmation",
          subject: "Your First Aid Training is Confirmed",
          category: "booking",
          lastModified: "2025-01-28",
          timesUsed: 145,
          status: "active",
        },
        {
          id: "2",
          name: "Course Reminder",
          subject: "Reminder: Your Training is Tomorrow",
          category: "reminder",
          lastModified: "2025-01-25",
          timesUsed: 98,
          status: "active",
        },
        {
          id: "3",
          name: "Certificate Ready",
          subject: "Your Certificate is Ready",
          category: "system",
          lastModified: "2025-01-20",
          timesUsed: 76,
          status: "active",
        },
      ];
      setTemplates(mockTemplates);
    } catch (error) {
      console.error("Failed to load email templates:", error);
    }
  }, []);

  // Load email history
  const loadHistory = useCallback(async () => {
    try {
      // Mock data for now
      const mockHistory: EmailHistory[] = [
        {
          id: "1",
          template: "Course Reminder",
          recipients: 12,
          subject: "Reminder: Your Training is Tomorrow",
          sentAt: "2025-01-29T14:30:00",
          status: "delivered",
          openRate: 78,
        },
        {
          id: "2",
          template: "Booking Confirmation",
          recipients: 8,
          subject: "Your First Aid Training is Confirmed",
          sentAt: "2025-01-29T10:15:00",
          status: "delivered",
          openRate: 92,
        },
      ];
      setHistory(mockHistory);
    } catch (error) {
      console.error("Failed to load email history:", error);
    }
  }, []);

  // Load recipients
  const loadRecipients = useCallback(async () => {
    try {
      // Mock data for now
      const mockRecipients: EmailRecipient[] = [
        {
          id: "1",
          name: "John Smith",
          email: "john.smith@example.com",
          selected: false,
        },
        {
          id: "2",
          name: "Jane Doe",
          email: "jane.doe@example.com",
          selected: false,
        },
      ];
      setRecipients(mockRecipients);
    } catch (error) {
      console.error("Failed to load recipients:", error);
    }
  }, []);

  // Load all data
  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      await Promise.all([
        loadTemplates(),
        loadHistory(),
        loadRecipients(),
      ]);
    } finally {
      setLoading(false);
    }
  }, [loadTemplates, loadHistory, loadRecipients]);

  // Toggle recipient selection
  const toggleRecipient = useCallback((id: string) => {
    setRecipients(prev =>
      prev.map(r => r.id === id ? { ...r, selected: !r.selected } : r)
    );
  }, []);

  // Select all recipients
  const selectAllRecipients = useCallback((selected: boolean) => {
    setRecipients(prev =>
      prev.map(r => ({ ...r, selected }))
    );
  }, []);

  // Initial load
  useEffect(() => {
    loadData();
  }, [loadData]);

  return {
    activeTab,
    setActiveTab,
    templates,
    history,
    recipients,
    loading,
    filters,
    setFilters,
    toggleRecipient,
    selectAllRecipients,
    loadData,
  };
};