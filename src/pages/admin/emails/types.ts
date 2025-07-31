export interface EmailTemplate {
  id: string;
  name: string;
  subject: string;
  category: "booking" | "reminder" | "marketing" | "system";
  lastModified: string;
  timesUsed: number;
  status: "active" | "draft";
}

export interface EmailHistory {
  id: string;
  template: string;
  recipients: number;
  subject: string;
  sentAt: string;
  status: "delivered" | "failed" | "pending";
  openRate?: number;
}

export interface EmailRecipient {
  id: string;
  name: string;
  email: string;
  selected: boolean;
}

export interface EmailFilters {
  search: string;
  category: string;
  status: string;
}

export type TabType = "templates" | "compose" | "history";

export interface EmailFormData {
  template: string;
  subject: string;
  content: string;
  recipients: string[];
  scheduledFor?: Date;
}