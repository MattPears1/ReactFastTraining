export interface IBackup {
  id: string;
  name: string;
  type: BackupType;
  source: string;
  destination: string;
  size: number;
  status: BackupStatus;
  provider: StorageProvider;
  compression?: CompressionType;
  encryption?: IEncryption;
  metadata?: IBackupMetadata;
  startedAt: Date;
  completedAt?: Date;
  expiresAt?: Date;
  retentionDays: number;
  error?: string;
  createdAt: Date;
  updatedAt: Date;
}

export enum BackupType {
  FULL = 'full',
  INCREMENTAL = 'incremental',
  DIFFERENTIAL = 'differential',
  SNAPSHOT = 'snapshot'
}

export enum BackupStatus {
  PENDING = 'pending',
  IN_PROGRESS = 'in_progress',
  COMPLETED = 'completed',
  FAILED = 'failed',
  CORRUPTED = 'corrupted',
  EXPIRED = 'expired'
}

export enum CompressionType {
  NONE = 'none',
  GZIP = 'gzip',
  ZIP = 'zip',
  TAR = 'tar',
  BROTLI = 'brotli'
}

export interface IEncryption {
  algorithm: string;
  keyId: string;
  iv?: string;
}

export interface IBackupMetadata {
  tables?: string[];
  fileCount?: number;
  checksum?: string;
  version?: string;
  gitCommit?: string;
  environment?: string;
  tags?: string[];
}

export interface IBackupSchedule {
  id: string;
  name: string;
  type: BackupType;
  source: string;
  destination: string;
  cronExpression: string;
  timezone?: string;
  retentionDays: number;
  isActive: boolean;
  lastRunAt?: Date;
  nextRunAt?: Date;
  successCount: number;
  failureCount: number;
  notificationEmails?: string[];
  createdAt: Date;
  updatedAt: Date;
}

export interface IRestorePoint {
  id: string;
  backupId: string;
  name: string;
  description?: string;
  timestamp: Date;
  size: number;
  isVerified: boolean;
  metadata?: Record<string, any>;
  createdAt: Date;
}

export interface IRestoreOperation {
  id: string;
  backupId: string;
  restorePointId?: string;
  target: string;
  status: RestoreStatus;
  options: IRestoreOptions;
  startedAt: Date;
  completedAt?: Date;
  error?: string;
  restoredFiles?: number;
  restoredSize?: number;
}

export enum RestoreStatus {
  PENDING = 'pending',
  IN_PROGRESS = 'in_progress',
  COMPLETED = 'completed',
  FAILED = 'failed',
  PARTIAL = 'partial'
}

export interface IRestoreOptions {
  overwrite?: boolean;
  targetPath?: string;
  includePatterns?: string[];
  excludePatterns?: string[];
  verifyChecksum?: boolean;
  stopOnError?: boolean;
}

export interface IBackupPolicy {
  id: string;
  name: string;
  description?: string;
  rules: IBackupRule[];
  retentionRules: IRetentionRule[];
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface IBackupRule {
  type: BackupType;
  frequency: string;
  sources: string[];
  destinations: string[];
  compression?: CompressionType;
  encryption?: boolean;
}

export interface IRetentionRule {
  type: BackupType;
  keepLast?: number;
  keepDaily?: number;
  keepWeekly?: number;
  keepMonthly?: number;
  keepYearly?: number;
}

export interface IBackupVerification {
  backupId: string;
  status: VerificationStatus;
  checksumValid?: boolean;
  integrityValid?: boolean;
  restorable?: boolean;
  errors?: string[];
  verifiedAt: Date;
}

export enum VerificationStatus {
  PENDING = 'pending',
  IN_PROGRESS = 'in_progress',
  PASSED = 'passed',
  FAILED = 'failed'
}

export interface IDisasterRecovery {
  id: string;
  name: string;
  rpo: number;
  rto: number;
  primarySite: string;
  secondarySite: string;
  replicationStatus: ReplicationStatus;
  lastReplicatedAt?: Date;
  failoverReady: boolean;
  testResults?: IDisasterRecoveryTest[];
}

export enum ReplicationStatus {
  ACTIVE = 'active',
  PAUSED = 'paused',
  FAILED = 'failed',
  SYNCING = 'syncing'
}

export interface IDisasterRecoveryTest {
  id: string;
  testType: 'failover' | 'failback' | 'connectivity';
  status: 'passed' | 'failed';
  duration: number;
  issues?: string[];
  testedAt: Date;
}

export interface IBackupProvider {
  backup(source: string, options: IBackupOptions): Promise<IBackup>;
  restore(backupId: string, options: IRestoreOptions): Promise<IRestoreOperation>;
  verify(backupId: string): Promise<IBackupVerification>;
  delete(backupId: string): Promise<boolean>;
  list(filter?: IBackupFilter): Promise<IBackup[]>;
}

export interface IBackupOptions {
  type: BackupType;
  destination: string;
  compression?: CompressionType;
  encryption?: IEncryption;
  excludePatterns?: string[];
  includePatterns?: string[];
  metadata?: Record<string, any>;
}

export interface IBackupFilter {
  type?: BackupType;
  status?: BackupStatus;
  startDate?: Date;
  endDate?: Date;
  source?: string;
  tags?: string[];
}