export interface IPagination {
  page: number;
  limit: number;
  total?: number;
  totalPages?: number;
}

export interface IApiResponse<T = any> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
  pagination?: IPagination;
}

export interface IUser {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: UserRole;
  isActive: boolean;
  isEmailVerified: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export enum UserRole {
  SUPER_ADMIN = 'super_admin',
  ADMIN = 'admin',
  MODERATOR = 'moderator',
  USER = 'user',
  GUEST = 'guest'
}

export interface ITimestamps {
  createdAt: Date;
  updatedAt: Date;
  deletedAt?: Date;
}

export interface IAuditLog {
  userId: string;
  action: string;
  resource: string;
  resourceId?: string;
  metadata?: Record<string, any>;
  ipAddress?: string;
  userAgent?: string;
  timestamp: Date;
}

export interface IWebhookEvent {
  id: string;
  type: string;
  payload: any;
  timestamp: Date;
  attempts?: number;
  lastAttemptAt?: Date;
  nextRetryAt?: Date;
  status: WebhookStatus;
}

export enum WebhookStatus {
  PENDING = 'pending',
  PROCESSING = 'processing',
  SUCCESS = 'success',
  FAILED = 'failed',
  RETRYING = 'retrying'
}