import { Router } from 'express';
import { monitoring } from '../services/monitoring/monitoring.service';
import db from '../models';
import { redis } from '../config/redis';
import os from 'os';

const router = Router();

// Basic health check
router.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: process.env.NODE_ENV,
  });
});

// Detailed health check
router.get('/health/detailed', async (req, res) => {
  const health = monitoring.getHealthStatus();
  
  res.status(health.status === 'healthy' ? 200 : 503).json({
    ...health,
    system: {
      uptime: process.uptime(),
      memory: process.memoryUsage(),
      cpu: process.cpuUsage(),
      loadAverage: os.loadavg(),
      hostname: os.hostname(),
    },
  });
});

// Monitoring dashboard data
router.get('/health/metrics', (req, res) => {
  const dashboardData = monitoring.getDashboardData();
  res.json(dashboardData);
});

// Liveness probe for k8s
router.get('/health/live', (req, res) => {
  res.status(200).send('OK');
});

// Readiness probe for k8s
router.get('/health/ready', async (req, res) => {
  try {
    // Check database connection
    await db.sequelize.authenticate();
    
    // Check Redis connection (if available)
    if (redis) {
      await redis.ping();
    }
    
    res.status(200).json({ status: 'ready' });
  } catch (error) {
    res.status(503).json({ 
      status: 'not ready',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Register health checks
export const registerHealthChecks = () => {
  // Database health check
  monitoring.registerHealthCheck('database', async () => {
    try {
      await db.sequelize.authenticate();
      const [results] = await db.sequelize.query('SELECT 1');
      return {
        name: 'database',
        status: 'healthy',
        message: 'Database connection is healthy',
      };
    } catch (error) {
      return {
        name: 'database',
        status: 'unhealthy',
        message: error instanceof Error ? error.message : 'Database connection failed',
      };
    }
  });

  // Redis health check
  monitoring.registerHealthCheck('redis', async () => {
    try {
      if (!redis) {
        return {
          name: 'redis',
          status: 'degraded',
          message: 'Redis not configured',
        };
      }
      
      const result = await redis.ping();
      return {
        name: 'redis',
        status: result === 'PONG' ? 'healthy' : 'unhealthy',
        message: result === 'PONG' ? 'Redis is responsive' : 'Redis not responding correctly',
      };
    } catch (error) {
      return {
        name: 'redis',
        status: 'unhealthy',
        message: error instanceof Error ? error.message : 'Redis connection failed',
      };
    }
  });

  // Memory health check
  monitoring.registerHealthCheck('memory', async () => {
    const usage = process.memoryUsage();
    const heapUsedMB = usage.heapUsed / 1024 / 1024;
    const heapTotalMB = usage.heapTotal / 1024 / 1024;
    const percentage = (usage.heapUsed / usage.heapTotal) * 100;

    let status: 'healthy' | 'degraded' | 'unhealthy' = 'healthy';
    if (percentage > 90) {
      status = 'unhealthy';
    } else if (percentage > 70) {
      status = 'degraded';
    }

    return {
      name: 'memory',
      status,
      message: `Heap usage: ${heapUsedMB.toFixed(2)}MB / ${heapTotalMB.toFixed(2)}MB (${percentage.toFixed(1)}%)`,
      metadata: {
        heapUsed: usage.heapUsed,
        heapTotal: usage.heapTotal,
        rss: usage.rss,
        external: usage.external,
      },
    };
  });

  // Disk space health check
  monitoring.registerHealthCheck('disk', async () => {
    try {
      const { execSync } = require('child_process');
      const dfOutput = execSync('df -h /').toString();
      const lines = dfOutput.trim().split('\n');
      const dataLine = lines[1];
      const parts = dataLine.split(/\s+/);
      const usagePercent = parseInt(parts[4].replace('%', ''));

      let status: 'healthy' | 'degraded' | 'unhealthy' = 'healthy';
      if (usagePercent > 90) {
        status = 'unhealthy';
      } else if (usagePercent > 70) {
        status = 'degraded';
      }

      return {
        name: 'disk',
        status,
        message: `Disk usage: ${usagePercent}%`,
        metadata: {
          filesystem: parts[0],
          size: parts[1],
          used: parts[2],
          available: parts[3],
          usagePercent,
        },
      };
    } catch (error) {
      return {
        name: 'disk',
        status: 'unhealthy',
        message: 'Failed to check disk space',
      };
    }
  });
};

export default router;