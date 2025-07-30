export interface IIntegration {
  id: string;
  name: string;
  provider: IntegrationProvider;
  status: IntegrationStatus;
  config: IIntegrationConfig;
  credentials?: IIntegrationCredentials;
  webhooks?: IWebhookConfig[];
  rateLimits?: IRateLimit;
  lastSyncAt?: Date;
  metadata?: Record<string, any>;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export enum IntegrationProvider {
  GOOGLE = 'google',
  FACEBOOK = 'facebook',
  TWITTER = 'twitter',
  INSTAGRAM = 'instagram',
  LINKEDIN = 'linkedin',
  GITHUB = 'github',
  SLACK = 'slack',
  DISCORD = 'discord',
  HUBSPOT = 'hubspot',
  SALESFORCE = 'salesforce',
  MAILCHIMP = 'mailchimp',
  ZAPIER = 'zapier',
  CUSTOM = 'custom'
}

export enum IntegrationStatus {
  CONNECTED = 'connected',
  DISCONNECTED = 'disconnected',
  ERROR = 'error',
  EXPIRED = 'expired',
  PENDING = 'pending'
}

export interface IIntegrationConfig {
  apiUrl?: string;
  apiVersion?: string;
  scopes?: string[];
  customHeaders?: Record<string, string>;
  timeout?: number;
  retryAttempts?: number;
}

export interface IIntegrationCredentials {
  type: 'oauth2' | 'api_key' | 'basic' | 'custom';
  accessToken?: string;
  refreshToken?: string;
  apiKey?: string;
  clientId?: string;
  clientSecret?: string;
  username?: string;
  password?: string;
  expiresAt?: Date;
  customCredentials?: Record<string, any>;
}

export interface IWebhookConfig {
  id: string;
  url: string;
  events: string[];
  secret?: string;
  isActive: boolean;
  headers?: Record<string, string>;
  retryPolicy?: IRetryPolicy;
}

export interface IRetryPolicy {
  maxAttempts: number;
  backoffType: 'fixed' | 'exponential';
  initialDelay: number;
  maxDelay?: number;
}

export interface IRateLimit {
  requests: number;
  period: number;
  unit: 'second' | 'minute' | 'hour' | 'day';
  remaining?: number;
  resetAt?: Date;
}

export interface ISocialMediaPost {
  id: string;
  integrationId: string;
  platform: IntegrationProvider;
  content: string;
  media?: IMediaAttachment[];
  scheduledAt?: Date;
  publishedAt?: Date;
  status: PostStatus;
  externalId?: string;
  metrics?: IPostMetrics;
  error?: string;
  createdAt: Date;
  updatedAt: Date;
}

export enum PostStatus {
  DRAFT = 'draft',
  SCHEDULED = 'scheduled',
  PUBLISHED = 'published',
  FAILED = 'failed',
  DELETED = 'deleted'
}

export interface IMediaAttachment {
  type: 'image' | 'video' | 'gif';
  url: string;
  thumbnail?: string;
  caption?: string;
  metadata?: Record<string, any>;
}

export interface IPostMetrics {
  likes: number;
  shares: number;
  comments: number;
  views: number;
  clicks: number;
  reach: number;
  engagement: number;
  updatedAt: Date;
}

export interface ICRMContact {
  id: string;
  integrationId: string;
  externalId: string;
  email: string;
  firstName?: string;
  lastName?: string;
  company?: string;
  phone?: string;
  properties: Record<string, any>;
  lists?: string[];
  tags?: string[];
  lastSyncedAt: Date;
}

export interface ICRMDeal {
  id: string;
  integrationId: string;
  externalId: string;
  name: string;
  amount: number;
  currency: string;
  stage: string;
  probability?: number;
  closeDate?: Date;
  contactIds: string[];
  properties: Record<string, any>;
  lastSyncedAt: Date;
}

export interface ICalendarEvent {
  id: string;
  integrationId: string;
  externalId?: string;
  title: string;
  description?: string;
  startTime: Date;
  endTime: Date;
  location?: string;
  attendees?: IAttendee[];
  recurrence?: IRecurrence;
  reminders?: IReminder[];
  status: EventStatus;
  createdAt: Date;
  updatedAt: Date;
}

export enum EventStatus {
  CONFIRMED = 'confirmed',
  TENTATIVE = 'tentative',
  CANCELLED = 'cancelled'
}

export interface IAttendee {
  email: string;
  name?: string;
  status: 'accepted' | 'declined' | 'tentative' | 'needsAction';
  isOrganizer?: boolean;
}

export interface IRecurrence {
  frequency: 'daily' | 'weekly' | 'monthly' | 'yearly';
  interval?: number;
  count?: number;
  until?: Date;
  byDay?: string[];
  byMonth?: number[];
}

export interface IReminder {
  method: 'email' | 'popup' | 'sms';
  minutes: number;
}

export interface IAPIMapping {
  id: string;
  integrationId: string;
  localField: string;
  remoteField: string;
  transform?: IFieldTransform;
  direction: 'inbound' | 'outbound' | 'bidirectional';
}

export interface IFieldTransform {
  type: 'map' | 'function' | 'template';
  config: Record<string, any>;
}

export interface ISyncJob {
  id: string;
  integrationId: string;
  type: 'full' | 'incremental';
  status: SyncStatus;
  direction: 'import' | 'export' | 'bidirectional';
  startedAt: Date;
  completedAt?: Date;
  recordsProcessed: number;
  recordsFailed: number;
  error?: string;
  nextSyncAt?: Date;
}

export enum SyncStatus {
  PENDING = 'pending',
  RUNNING = 'running',
  COMPLETED = 'completed',
  FAILED = 'failed',
  CANCELLED = 'cancelled'
}

export interface IIntegrationProvider {
  connect(config: IIntegrationConfig): Promise<IIntegration>;
  disconnect(integrationId: string): Promise<void>;
  refreshCredentials(integrationId: string): Promise<IIntegrationCredentials>;
  sync(integrationId: string, options?: ISyncOptions): Promise<ISyncJob>;
  testConnection(integrationId: string): Promise<boolean>;
}

export interface ISyncOptions {
  type?: 'full' | 'incremental';
  startDate?: Date;
  endDate?: Date;
  entities?: string[];
  batchSize?: number;
}