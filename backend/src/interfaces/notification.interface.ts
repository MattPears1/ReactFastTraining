export interface INotification {
  id: string;
  userId: string;
  type: NotificationType;
  channel: NotificationChannel;
  title: string;
  message: string;
  data?: Record<string, any>;
  status: NotificationStatus;
  priority: NotificationPriority;
  readAt?: Date;
  sentAt?: Date;
  expiresAt?: Date;
  retryCount: number;
  error?: string;
  createdAt: Date;
  updatedAt: Date;
}

export enum NotificationType {
  SYSTEM = 'system',
  USER = 'user',
  ORDER = 'order',
  PAYMENT = 'payment',
  SECURITY = 'security',
  MARKETING = 'marketing',
  REMINDER = 'reminder',
  ALERT = 'alert'
}

export enum NotificationChannel {
  EMAIL = 'email',
  SMS = 'sms',
  PUSH = 'push',
  IN_APP = 'in_app',
  WEBHOOK = 'webhook',
  SLACK = 'slack',
  DISCORD = 'discord'
}

export enum NotificationStatus {
  PENDING = 'pending',
  SENT = 'sent',
  DELIVERED = 'delivered',
  READ = 'read',
  FAILED = 'failed',
  EXPIRED = 'expired'
}

export enum NotificationPriority {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  URGENT = 'urgent'
}

export interface INotificationTemplate {
  id: string;
  name: string;
  type: NotificationType;
  channels: NotificationChannel[];
  subject?: string;
  content: INotificationContent;
  variables: string[];
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface INotificationContent {
  email?: {
    subject: string;
    html: string;
    text?: string;
  };
  sms?: {
    message: string;
  };
  push?: {
    title: string;
    body: string;
    icon?: string;
    image?: string;
    actions?: IPushAction[];
  };
  inApp?: {
    title: string;
    message: string;
    actionUrl?: string;
    icon?: string;
  };
}

export interface IPushAction {
  action: string;
  title: string;
  icon?: string;
  url?: string;
}

export interface INotificationPreference {
  userId: string;
  email: IChannelPreference;
  sms: IChannelPreference;
  push: IChannelPreference;
  inApp: IChannelPreference;
  quietHours?: IQuietHours;
  unsubscribeToken?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface IChannelPreference {
  enabled: boolean;
  types: NotificationType[];
  frequency?: 'instant' | 'hourly' | 'daily' | 'weekly';
}

export interface IQuietHours {
  enabled: boolean;
  start: string;
  end: string;
  timezone: string;
  daysOfWeek?: number[];
}

export interface IPushSubscription {
  id: string;
  userId: string;
  endpoint: string;
  keys: {
    p256dh: string;
    auth: string;
  };
  deviceInfo?: IDeviceInfo;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface IDeviceInfo {
  type: string;
  os: string;
  browser?: string;
  model?: string;
  appVersion?: string;
}

export interface ISmsProvider {
  send(to: string, message: string, options?: any): Promise<ISmsResult>;
  sendBulk(messages: ISmsMessage[]): Promise<ISmsResult[]>;
  getBalance(): Promise<number>;
}

export interface ISmsMessage {
  to: string;
  message: string;
  from?: string;
}

export interface ISmsResult {
  messageId: string;
  status: 'sent' | 'failed';
  error?: string;
  cost?: number;
}

export interface IPushProvider {
  send(subscription: IPushSubscription, notification: any): Promise<IPushResult>;
  sendToMultiple(subscriptions: IPushSubscription[], notification: any): Promise<IPushResult[]>;
}

export interface IPushResult {
  success: boolean;
  messageId?: string;
  error?: string;
  statusCode?: number;
}

export interface INotificationQueue {
  id: string;
  notification: INotification;
  scheduledFor?: Date;
  attempts: number;
  maxAttempts: number;
  lastAttemptAt?: Date;
  nextRetryAt?: Date;
  error?: string;
}

export interface INotificationBatch {
  id: string;
  name: string;
  type: NotificationType;
  channel: NotificationChannel;
  recipients: string[];
  template: string;
  variables?: Record<string, any>;
  scheduledFor?: Date;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  sent: number;
  failed: number;
  createdAt: Date;
  updatedAt: Date;
}