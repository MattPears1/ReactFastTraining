export interface IEmailOptions {
  to: string | string[];
  cc?: string | string[];
  bcc?: string | string[];
  from?: string;
  subject: string;
  template?: string;
  html?: string;
  text?: string;
  attachments?: IEmailAttachment[];
  variables?: Record<string, any>;
  replyTo?: string;
  headers?: Record<string, string>;
  tags?: string[];
  trackOpens?: boolean;
  trackClicks?: boolean;
  priority?: EmailPriority;
}

export interface IEmailAttachment {
  filename: string;
  content?: Buffer | string;
  path?: string;
  contentType?: string;
  contentDisposition?: 'attachment' | 'inline';
  cid?: string;
}

export enum EmailPriority {
  HIGH = 'high',
  NORMAL = 'normal',
  LOW = 'low'
}

export interface IEmailTemplate {
  id: string;
  name: string;
  subject: string;
  htmlContent: string;
  textContent?: string;
  variables: string[];
  category: EmailCategory;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export enum EmailCategory {
  TRANSACTIONAL = 'transactional',
  MARKETING = 'marketing',
  NOTIFICATION = 'notification',
  SYSTEM = 'system'
}

export interface IEmailProvider {
  send(options: IEmailOptions): Promise<IEmailResult>;
  sendBulk(options: IEmailOptions[]): Promise<IEmailResult[]>;
  verifyConnection(): Promise<boolean>;
}

export interface IEmailResult {
  messageId: string;
  accepted: string[];
  rejected: string[];
  response?: string;
  error?: string;
}

export interface IEmailTracking {
  messageId: string;
  recipient: string;
  status: EmailStatus;
  opens: number;
  clicks: number;
  lastOpenedAt?: Date;
  lastClickedAt?: Date;
  bounced?: boolean;
  complained?: boolean;
  unsubscribed?: boolean;
}

export enum EmailStatus {
  QUEUED = 'queued',
  SENDING = 'sending',
  SENT = 'sent',
  DELIVERED = 'delivered',
  OPENED = 'opened',
  CLICKED = 'clicked',
  BOUNCED = 'bounced',
  COMPLAINED = 'complained',
  UNSUBSCRIBED = 'unsubscribed',
  FAILED = 'failed'
}

export interface IEmailQueue {
  id: string;
  options: IEmailOptions;
  attempts: number;
  maxAttempts: number;
  scheduledAt?: Date;
  lastAttemptAt?: Date;
  nextRetryAt?: Date;
  status: EmailStatus;
  error?: string;
  result?: IEmailResult;
}