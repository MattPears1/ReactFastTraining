export interface IJob {
  id: string;
  name: string;
  data: any;
  options?: IJobOptions;
  status: JobStatus;
  progress: number;
  attempts: number;
  maxAttempts: number;
  result?: any;
  error?: string;
  stackTrace?: string;
  processedAt?: Date;
  completedAt?: Date;
  failedAt?: Date;
  nextRetryAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export enum JobStatus {
  WAITING = 'waiting',
  ACTIVE = 'active',
  COMPLETED = 'completed',
  FAILED = 'failed',
  DELAYED = 'delayed',
  PAUSED = 'paused',
  STUCK = 'stuck'
}

export interface IJobOptions {
  priority?: number;
  delay?: number;
  attempts?: number;
  backoff?: IBackoffOptions;
  removeOnComplete?: boolean;
  removeOnFail?: boolean;
  timeout?: number;
  lifo?: boolean;
  repeat?: IRepeatOptions;
}

export interface IBackoffOptions {
  type: 'fixed' | 'exponential';
  delay: number;
}

export interface IRepeatOptions {
  cron?: string;
  tz?: string;
  startDate?: Date;
  endDate?: Date;
  limit?: number;
  every?: number;
  immediately?: boolean;
}

export interface IQueue {
  name: string;
  concurrency: number;
  isPaused: boolean;
  jobCounts: IJobCounts;
}

export interface IJobCounts {
  waiting: number;
  active: number;
  completed: number;
  failed: number;
  delayed: number;
  paused: number;
}

export interface IWorker {
  id: string;
  name: string;
  queues: string[];
  status: WorkerStatus;
  currentJob?: string;
  processedJobs: number;
  failedJobs: number;
  startedAt: Date;
  lastActiveAt: Date;
}

export enum WorkerStatus {
  IDLE = 'idle',
  BUSY = 'busy',
  PAUSED = 'paused',
  STOPPED = 'stopped'
}

export interface IScheduledJob {
  id: string;
  name: string;
  cronExpression: string;
  timezone?: string;
  jobName: string;
  jobData: any;
  isActive: boolean;
  lastRunAt?: Date;
  nextRunAt?: Date;
  executionCount: number;
  failureCount: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface IJobProcessor<T = any> {
  process(job: IJob): Promise<T>;
  onComplete?(job: IJob, result: T): Promise<void>;
  onFailed?(job: IJob, error: Error): Promise<void>;
  onProgress?(job: IJob, progress: number): void;
}

export interface IQueueManager {
  createQueue(name: string, options?: IQueueOptions): IQueue;
  getQueue(name: string): IQueue | null;
  getAllQueues(): IQueue[];
  pauseQueue(name: string): Promise<void>;
  resumeQueue(name: string): Promise<void>;
  cleanQueue(name: string, grace: number, status?: JobStatus): Promise<number>;
  obliterateQueue(name: string): Promise<void>;
}

export interface IQueueOptions {
  defaultJobOptions?: IJobOptions;
  concurrency?: number;
  stalledInterval?: number;
  maxStalledCount?: number;
  guardInterval?: number;
  retryProcessDelay?: number;
}

export interface IJobScheduler {
  schedule(job: IScheduledJob): Promise<void>;
  unschedule(jobId: string): Promise<void>;
  getScheduledJobs(): Promise<IScheduledJob[]>;
  runNow(jobId: string): Promise<void>;
  pause(jobId: string): Promise<void>;
  resume(jobId: string): Promise<void>;
}

export interface IJobMetrics {
  queue: string;
  period: Date;
  processed: number;
  failed: number;
  avgProcessingTime: number;
  minProcessingTime: number;
  maxProcessingTime: number;
  throughput: number;
  errorRate: number;
  waitTime: number;
}

export interface IBulkJobOperation {
  jobs: Array<{
    name: string;
    data: any;
    options?: IJobOptions;
  }>;
  queue: string;
}

export interface IJobEvent {
  jobId: string;
  queue: string;
  event: JobEventType;
  data?: any;
  timestamp: Date;
}

export enum JobEventType {
  CREATED = 'created',
  STARTED = 'started',
  PROGRESS = 'progress',
  COMPLETED = 'completed',
  FAILED = 'failed',
  RETRYING = 'retrying',
  REMOVED = 'removed',
  STALLED = 'stalled'
}

export interface IDeadLetterQueue {
  name: string;
  jobs: IJob[];
  maxSize: number;
  retentionPeriod: number;
}