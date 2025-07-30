export interface IAnalyticsEvent {
  id?: string;
  userId?: string;
  sessionId: string;
  event: string;
  category: EventCategory;
  properties?: Record<string, any>;
  timestamp: Date;
  ipAddress?: string;
  userAgent?: string;
  referrer?: string;
  url?: string;
  device?: IDeviceInfo;
  location?: ILocationInfo;
}

export enum EventCategory {
  PAGE_VIEW = 'page_view',
  USER_ACTION = 'user_action',
  SYSTEM_EVENT = 'system_event',
  ERROR = 'error',
  CONVERSION = 'conversion',
  CUSTOM = 'custom'
}

export interface IDeviceInfo {
  type: 'desktop' | 'mobile' | 'tablet';
  os: string;
  osVersion?: string;
  browser: string;
  browserVersion?: string;
  screenResolution?: string;
  viewport?: string;
  language?: string;
}

export interface ILocationInfo {
  country?: string;
  countryCode?: string;
  region?: string;
  city?: string;
  postalCode?: string;
  latitude?: number;
  longitude?: number;
  timezone?: string;
}

export interface IPageView {
  url: string;
  title: string;
  referrer?: string;
  loadTime?: number;
  timeOnPage?: number;
  scrollDepth?: number;
  exits?: number;
  bounces?: number;
}

export interface IUserBehavior {
  userId: string;
  totalSessions: number;
  totalPageViews: number;
  averageSessionDuration: number;
  bounceRate: number;
  conversionRate: number;
  lastSeen: Date;
  firstSeen: Date;
  devices: IDeviceInfo[];
  topPages: IPageView[];
  events: IAnalyticsEvent[];
}

export interface IConversion {
  id: string;
  userId?: string;
  sessionId: string;
  type: ConversionType;
  value?: number;
  currency?: string;
  source?: string;
  medium?: string;
  campaign?: string;
  metadata?: Record<string, any>;
  timestamp: Date;
}

export enum ConversionType {
  SIGNUP = 'signup',
  PURCHASE = 'purchase',
  SUBSCRIPTION = 'subscription',
  DOWNLOAD = 'download',
  CONTACT = 'contact',
  CUSTOM = 'custom'
}

export interface IAnalyticsReport {
  period: IPeriod;
  metrics: IMetrics;
  dimensions?: IDimensions;
  segments?: ISegment[];
}

export interface IPeriod {
  start: Date;
  end: Date;
  granularity: 'hour' | 'day' | 'week' | 'month' | 'year';
}

export interface IMetrics {
  users: number;
  newUsers: number;
  sessions: number;
  pageViews: number;
  bounceRate: number;
  avgSessionDuration: number;
  conversions: number;
  conversionRate: number;
  revenue?: number;
}

export interface IDimensions {
  pages?: IPageMetrics[];
  sources?: ISourceMetrics[];
  devices?: IDeviceMetrics[];
  locations?: ILocationMetrics[];
}

export interface IPageMetrics {
  url: string;
  views: number;
  uniqueViews: number;
  avgTimeOnPage: number;
  bounceRate: number;
  exitRate: number;
}

export interface ISourceMetrics {
  source: string;
  medium: string;
  users: number;
  sessions: number;
  bounceRate: number;
  conversionRate: number;
}

export interface IDeviceMetrics {
  device: IDeviceInfo;
  users: number;
  sessions: number;
  bounceRate: number;
  conversionRate: number;
}

export interface ILocationMetrics {
  location: ILocationInfo;
  users: number;
  sessions: number;
  pageViews: number;
  conversionRate: number;
}

export interface ISegment {
  name: string;
  conditions: ISegmentCondition[];
  users?: number;
}

export interface ISegmentCondition {
  field: string;
  operator: 'equals' | 'contains' | 'greater_than' | 'less_than' | 'in' | 'not_in';
  value: any;
}

export interface IAnalyticsProvider {
  track(event: IAnalyticsEvent): Promise<void>;
  identify(userId: string, traits?: Record<string, any>): Promise<void>;
  page(pageView: IPageView): Promise<void>;
  getReport(options: IReportOptions): Promise<IAnalyticsReport>;
}