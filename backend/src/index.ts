import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import morgan from 'morgan';
import dotenv from 'dotenv';
import { createServer } from 'http';
import { config } from './config/config';
import { logger } from './utils/logger';
import { errorHandler } from './middleware/errorHandler';
import { rateLimiter } from './middleware/rateLimiter';
import { analyticsMiddleware, trackApiError, trackApiPerformance } from './middleware/analytics.middleware';
import routes from './routes';
import { initializeDatabase } from './config/database';
import { initializeRedis } from './config/redis';

// Load environment variables
dotenv.config();

const app = express();
const server = createServer(app);

// Middleware
app.use(helmet());
app.use(cors(config.cors));
app.use(compression());
app.use(morgan('combined', { stream: { write: (msg) => logger.info(msg.trim()) } }));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Rate limiting
app.use('/api/', rateLimiter);

// Analytics middleware
app.use(analyticsMiddleware());
app.use(trackApiPerformance());

// Health check
app.get('/health', (_, res) => {
  res.json({ 
    status: 'healthy', 
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  });
});

// API routes
app.use('/api', routes);

// Error handling
app.use(trackApiError());
app.use(errorHandler);

// 404 handler
app.use((_, res) => {
  res.status(404).json({ error: 'Route not found' });
});

// Initialize services and start server
const startServer = async () => {
  try {
    // Initialize database
    try {
      await initializeDatabase();
      logger.info('Database connected successfully');
    } catch (dbError) {
      logger.warn('Database connection failed, running without database:', dbError);
    }

    // Initialize Redis
    try {
      await initializeRedis();
      logger.info('Redis connected successfully');
    } catch (redisError) {
      logger.warn('Redis connection failed, running without Redis:', redisError);
    }

    // Start server
    server.listen(config.port, () => {
      logger.info(`Server running on port ${config.port} in ${config.env} mode`);
    });
  } catch (error) {
    logger.error('Failed to start server:', error);
    process.exit(1);
  }
};

// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
  logger.error('Uncaught Exception:', error);
  process.exit(1);
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (error) => {
  logger.error('Unhandled Rejection:', error);
  process.exit(1);
});

// Graceful shutdown
process.on('SIGTERM', async () => {
  logger.info('SIGTERM signal received: closing HTTP server');
  server.close(() => {
    logger.info('HTTP server closed');
    process.exit(0);
  });
});

startServer();