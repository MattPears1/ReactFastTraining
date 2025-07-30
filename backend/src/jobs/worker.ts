import { Worker } from 'bullmq';
import { logger } from '../utils/logger';
import { redisClient } from '../config/redis';
import { emailQueue } from '../services/email/email.queue';
import { analyticsProcessor } from '../services/analytics/analytics.processor';
import { monitoringConfig } from '../config/monitoring';

// Worker configuration
const workerOptions = {
  connection: redisClient,
  concurrency: parseInt(process.env.WORKER_CONCURRENCY || '5'),
  maxStalledCount: 3,
  stalledInterval: 30000,
};

// Email worker
const emailWorker = new Worker('email', async (job) => {
  logger.info(`Processing email job ${job.id}`, { data: job.data });
  
  try {
    await emailQueue.processEmailJob(job);
    logger.info(`Email job ${job.id} completed successfully`);
  } catch (error) {
    logger.error(`Email job ${job.id} failed:`, error);
    throw error;
  }
}, workerOptions);

// Analytics worker
const analyticsWorker = new Worker('analytics', async (job) => {
  logger.info(`Processing analytics job ${job.id}`, { data: job.data });
  
  try {
    await analyticsProcessor.processEvent(job.data);
    logger.info(`Analytics job ${job.id} completed successfully`);
  } catch (error) {
    logger.error(`Analytics job ${job.id} failed:`, error);
    throw error;
  }
}, workerOptions);

// Backup worker
const backupWorker = new Worker('backup', async (job) => {
  logger.info(`Processing backup job ${job.id}`, { data: job.data });
  
  try {
    const { backupService } = await import('../services/backup/backup.service');
    await backupService.performBackup(job.data);
    logger.info(`Backup job ${job.id} completed successfully`);
  } catch (error) {
    logger.error(`Backup job ${job.id} failed:`, error);
    throw error;
  }
}, workerOptions);

// Report generation worker
const reportWorker = new Worker('reports', async (job) => {
  logger.info(`Processing report job ${job.id}`, { data: job.data });
  
  try {
    const { reportService } = await import('../services/admin/report.service');
    await reportService.generateReport(job.data);
    logger.info(`Report job ${job.id} completed successfully`);
  } catch (error) {
    logger.error(`Report job ${job.id} failed:`, error);
    throw error;
  }
}, workerOptions);

// Worker event handlers
const workers = [emailWorker, analyticsWorker, backupWorker, reportWorker];

workers.forEach(worker => {
  worker.on('completed', (job) => {
    logger.debug(`Job ${job.id} completed in queue ${worker.name}`);
  });

  worker.on('failed', (job, err) => {
    logger.error(`Job ${job?.id} failed in queue ${worker.name}:`, err);
  });

  worker.on('error', (err) => {
    logger.error(`Worker error in queue ${worker.name}:`, err);
  });

  worker.on('stalled', (jobId) => {
    logger.warn(`Job ${jobId} stalled in queue ${worker.name}`);
  });
});

// Graceful shutdown
const shutdown = async () => {
  logger.info('Shutting down workers...');
  
  await Promise.all(workers.map(worker => worker.close()));
  
  logger.info('Workers shut down successfully');
  process.exit(0);
};

process.on('SIGTERM', shutdown);
process.on('SIGINT', shutdown);

// Health check for workers
if (monitoringConfig.metrics.enabled) {
  setInterval(async () => {
    const metrics = {
      workers: await Promise.all(workers.map(async (worker) => ({
        name: worker.name,
        isRunning: worker.isRunning(),
        isPaused: worker.isPaused(),
      }))),
      timestamp: new Date().toISOString(),
    };
    
    logger.debug('Worker health check:', metrics);
  }, 60000); // Every minute
}

logger.info('Workers started successfully', {
  workers: workers.map(w => w.name),
  concurrency: workerOptions.concurrency,
});