export interface IArticle {
  id: string;
  title: string;
  slug: string;
  content: string;
  excerpt?: string;
  featuredImage?: string;
  images?: string[];
  authorId: string;
  categoryId: string;
  tags: string[];
  status: ArticleStatus;
  publishedAt?: Date;
  viewCount: number;
  likeCount: number;
  commentCount: number;
  readTime: number;
  seo?: ISeoMetadata;
  isFeature?: boolean;
  allowComments: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export enum ArticleStatus {
  DRAFT = 'draft',
  PUBLISHED = 'published',
  SCHEDULED = 'scheduled',
  ARCHIVED = 'archived'
}

export interface ISeoMetadata {
  title?: string;
  description?: string;
  keywords?: string[];
  ogTitle?: string;
  ogDescription?: string;
  ogImage?: string;
  twitterCard?: string;
  twitterTitle?: string;
  twitterDescription?: string;
  twitterImage?: string;
  canonicalUrl?: string;
  noIndex?: boolean;
  noFollow?: boolean;
}

export interface ICategory {
  id: string;
  name: string;
  slug: string;
  description?: string;
  parentId?: string;
  image?: string;
  articleCount: number;
  isActive: boolean;
  order: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface ITag {
  id: string;
  name: string;
  slug: string;
  description?: string;
  articleCount: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface IComment {
  id: string;
  articleId: string;
  userId?: string;
  parentId?: string;
  content: string;
  authorName?: string;
  authorEmail?: string;
  authorUrl?: string;
  status: CommentStatus;
  likeCount: number;
  ipAddress?: string;
  userAgent?: string;
  createdAt: Date;
  updatedAt: Date;
}

export enum CommentStatus {
  PENDING = 'pending',
  APPROVED = 'approved',
  SPAM = 'spam',
  TRASH = 'trash'
}

export interface IAuthor {
  id: string;
  userId: string;
  name: string;
  bio?: string;
  avatar?: string;
  socialLinks?: ISocialLinks;
  articleCount: number;
  followerCount: number;
  isVerified: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface ISocialLinks {
  twitter?: string;
  facebook?: string;
  instagram?: string;
  linkedin?: string;
  github?: string;
  website?: string;
}

export interface IArticleVersion {
  id: string;
  articleId: string;
  version: number;
  title: string;
  content: string;
  changedBy: string;
  changeLog?: string;
  createdAt: Date;
}

export interface IContentBlock {
  id: string;
  type: ContentBlockType;
  content: any;
  order: number;
  metadata?: Record<string, any>;
}

export enum ContentBlockType {
  TEXT = 'text',
  IMAGE = 'image',
  VIDEO = 'video',
  CODE = 'code',
  QUOTE = 'quote',
  EMBED = 'embed',
  TABLE = 'table',
  LIST = 'list',
  DIVIDER = 'divider',
  CUSTOM = 'custom'
}

export interface IRelatedArticle {
  articleId: string;
  relatedArticleId: string;
  score: number;
  type: 'manual' | 'auto';
}

export interface IArticleStats {
  articleId: string;
  date: Date;
  views: number;
  uniqueViews: number;
  likes: number;
  shares: number;
  comments: number;
  avgReadTime: number;
  bounceRate: number;
}

export interface IEditorialWorkflow {
  articleId: string;
  currentStage: WorkflowStage;
  assignedTo?: string;
  stages: IWorkflowStageHistory[];
}

export enum WorkflowStage {
  IDEA = 'idea',
  DRAFT = 'draft',
  REVIEW = 'review',
  EDITING = 'editing',
  FACT_CHECK = 'fact_check',
  APPROVAL = 'approval',
  SCHEDULED = 'scheduled',
  PUBLISHED = 'published'
}

export interface IWorkflowStageHistory {
  stage: WorkflowStage;
  userId: string;
  notes?: string;
  timestamp: Date;
}