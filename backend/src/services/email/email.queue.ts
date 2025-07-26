import Bull from 'bull';
import { IEmailOptions, IEmailQueue, EmailStatus } from '../../interfaces/email.interface';
import { servicesConfig } from '../../config/services.config';
import { logger } from '../../utils/logger';
import { v4 as uuidv4 } from 'uuid';

export class EmailQueue {
  private queue: Bull.Queue;
  private trackingQueue: Bull.Queue;

  constructor() {
    const redisConfig = servicesConfig.queue.redis;
    
    this.queue = new Bull('email-queue', {
      redis: redisConfig,
      defaultJobOptions: servicesConfig.email.queue,
    });

    this.trackingQueue = new Bull('email-tracking', {
      redis: redisConfig,
    });

    this.setupProcessors();
  }

  private setupProcessors(): void {
    this.queue.on('failed', (job, err) => {
      logger.error('Email job failed', { jobId: job.id, error: err.message });
    });

    this.queue.on('completed', (job) => {
      logger.info('Email job completed', { jobId: job.id });
    });
  }

  async add(options: IEmailOptions, delay?: number): Promise<string> {
    const jobId = uuidv4();
    
    await this.queue.add('send-email', {
      id: jobId,
      options,
      attempts: 0,
      maxAttempts: servicesConfig.email.queue.maxRetries,
      status: EmailStatus.QUEUED,
    }, {
      delay,
      jobId,
    });

    return jobId;
  }

  async addBulk(recipients: string[], options: Omit<IEmailOptions, 'to'>): Promise<string[]> {
    const jobs = recipients.map(to => ({
      name: 'send-email',
      data: {
        id: uuidv4(),
        options: { ...options, to },
        attempts: 0,
        maxAttempts: servicesConfig.email.queue.maxRetries,
        status: EmailStatus.QUEUED,
      },
    }));

    const results = await this.queue.addBulk(jobs);
    return results.map(job => job.id.toString());
  }

  async getStatus(jobId: string): Promise<IEmailQueue | null> {
    const job = await this.queue.getJob(jobId);
    
    if (!job) {
      return null;
    }

    const state = await job.getState();
    
    return {
      id: job.id.toString(),
      options: job.data.options,
      attempts: job.attemptsMade,
      maxAttempts: job.opts.attempts || servicesConfig.email.queue.maxRetries,
      status: this.mapJobStateToEmailStatus(state),
      lastAttemptAt: job.processedOn ? new Date(job.processedOn) : undefined,
      nextRetryAt: job.opts.delay ? new Date(Date.now() + job.opts.delay) : undefined,
      error: job.failedReason,
      result: job.returnvalue,
    };
  }

  private mapJobStateToEmailStatus(state: string): EmailStatus {
    switch (state) {
      case 'waiting':
      case 'delayed':
        return EmailStatus.QUEUED;
      case 'active':
        return EmailStatus.SENDING;
      case 'completed':
        return EmailStatus.SENT;
      case 'failed':
        return EmailStatus.FAILED;
      default:
        return EmailStatus.QUEUED;
    }
  }

  async retryFailed(): Promise<number> {
    const failedJobs = await this.queue.getFailed();
    let retried = 0;

    for (const job of failedJobs) {
      if (job.attemptsMade < (job.opts.attempts || servicesConfig.email.queue.maxRetries)) {
        await job.retry();
        retried++;
      }
    }

    return retried;
  }

  async cleanup(days: number): Promise<number> {
    const grace = days * 24 * 60 * 60 * 1000;
    const completed = await this.queue.clean(grace, 'completed');
    const failed = await this.queue.clean(grace, 'failed');
    
    return completed.length + failed.length;
  }

  async addTracking(tracking: any): Promise<void> {
    await this.trackingQueue.add('track-email', tracking);
  }

  async pause(): Promise<void> {
    await this.queue.pause();
  }

  async resume(): Promise<void> {
    await this.queue.resume();
  }

  async getMetrics(): Promise<any> {
    const counts = await this.queue.getJobCounts();
    const workers = await this.queue.getWorkers();
    
    return {
      counts,
      workers: workers.length,
      isPaused: await this.queue.isPaused(),
    };
  }
}