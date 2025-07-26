export interface ITicket {
  id: string;
  userId?: string;
  assignedTo?: string;
  subject: string;
  description: string;
  category: TicketCategory;
  priority: TicketPriority;
  status: TicketStatus;
  source: TicketSource;
  tags: string[];
  attachments?: string[];
  customFields?: Record<string, any>;
  satisfactionRating?: number;
  resolvedAt?: Date;
  closedAt?: Date;
  firstResponseAt?: Date;
  slaBreached?: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export enum TicketCategory {
  TECHNICAL = 'technical',
  BILLING = 'billing',
  ACCOUNT = 'account',
  PRODUCT = 'product',
  GENERAL = 'general',
  FEEDBACK = 'feedback',
  BUG_REPORT = 'bug_report'
}

export enum TicketPriority {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  URGENT = 'urgent'
}

export enum TicketStatus {
  NEW = 'new',
  OPEN = 'open',
  PENDING = 'pending',
  ON_HOLD = 'on_hold',
  RESOLVED = 'resolved',
  CLOSED = 'closed',
  SPAM = 'spam'
}

export enum TicketSource {
  EMAIL = 'email',
  WEB_FORM = 'web_form',
  CHAT = 'chat',
  PHONE = 'phone',
  SOCIAL_MEDIA = 'social_media',
  API = 'api'
}

export interface ITicketMessage {
  id: string;
  ticketId: string;
  userId: string;
  message: string;
  attachments?: string[];
  isInternal: boolean;
  isSystemMessage: boolean;
  metadata?: Record<string, any>;
  createdAt: Date;
  updatedAt: Date;
}

export interface IKnowledgeBase {
  id: string;
  title: string;
  slug: string;
  content: string;
  category: string;
  tags: string[];
  author: string;
  status: 'draft' | 'published' | 'archived';
  viewCount: number;
  helpfulCount: number;
  notHelpfulCount: number;
  relatedArticles?: string[];
  attachments?: string[];
  metadata?: Record<string, any>;
  publishedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface IFAQ {
  id: string;
  question: string;
  answer: string;
  category: string;
  order: number;
  isActive: boolean;
  viewCount: number;
  helpfulCount: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface IChatSession {
  id: string;
  userId?: string;
  agentId?: string;
  status: ChatStatus;
  startedAt: Date;
  endedAt?: Date;
  messages: IChatMessage[];
  metadata?: Record<string, any>;
  rating?: number;
  feedback?: string;
}

export enum ChatStatus {
  WAITING = 'waiting',
  ACTIVE = 'active',
  ENDED = 'ended',
  ABANDONED = 'abandoned'
}

export interface IChatMessage {
  id: string;
  sessionId: string;
  senderId: string;
  senderType: 'user' | 'agent' | 'system';
  message: string;
  attachments?: string[];
  timestamp: Date;
}

export interface ISupportAgent {
  id: string;
  userId: string;
  name: string;
  email: string;
  avatar?: string;
  status: AgentStatus;
  skills: string[];
  maxConcurrentChats: number;
  currentChats: number;
  availability: IAgentAvailability;
  performance: IAgentPerformance;
  createdAt: Date;
  updatedAt: Date;
}

export enum AgentStatus {
  ONLINE = 'online',
  BUSY = 'busy',
  AWAY = 'away',
  OFFLINE = 'offline'
}

export interface IAgentAvailability {
  schedule: IScheduleSlot[];
  timezone: string;
  autoAccept: boolean;
}

export interface IScheduleSlot {
  dayOfWeek: number;
  startTime: string;
  endTime: string;
}

export interface IAgentPerformance {
  totalTickets: number;
  resolvedTickets: number;
  avgResponseTime: number;
  avgResolutionTime: number;
  satisfactionRating: number;
  totalChats: number;
}

export interface ITicketSLA {
  id: string;
  name: string;
  description?: string;
  conditions: ISLACondition[];
  targets: ISLATarget[];
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface ISLACondition {
  field: string;
  operator: string;
  value: any;
}

export interface ISLATarget {
  metric: 'first_response' | 'resolution' | 'next_response';
  priority: TicketPriority;
  time: number;
  unit: 'minutes' | 'hours' | 'days';
  businessHours: boolean;
}

export interface ITicketAutomation {
  id: string;
  name: string;
  description?: string;
  triggers: IAutomationTrigger[];
  conditions: IAutomationCondition[];
  actions: IAutomationAction[];
  isActive: boolean;
  executionCount: number;
  lastExecutedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface IAutomationTrigger {
  event: string;
  parameters?: Record<string, any>;
}

export interface IAutomationCondition {
  field: string;
  operator: string;
  value: any;
}

export interface IAutomationAction {
  type: string;
  parameters: Record<string, any>;
}

export interface ISupportMetrics {
  period: Date;
  newTickets: number;
  resolvedTickets: number;
  avgFirstResponseTime: number;
  avgResolutionTime: number;
  satisfactionScore: number;
  ticketsByCategory: Record<string, number>;
  ticketsByPriority: Record<string, number>;
  agentPerformance: Record<string, IAgentPerformance>;
}