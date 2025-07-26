import { createClient } from 'redis';
import { config } from './config';
import { logger } from '../utils/logger';

// Parse REDIS_URL for Heroku deployment
const getRedisConfig = () => {
  if (process.env.REDIS_URL) {
    return {
      url: process.env.REDIS_URL,
      socket: {
        tls: process.env.NODE_ENV === 'production',
        rejectUnauthorized: false
      }
    };
  }
  
  return {
    socket: {
      host: config.redis.host,
      port: config.redis.port,
    },
    password: config.redis.password,
  };
};

export const redisClient = createClient(getRedisConfig());

redisClient.on('error', (err) => {
  logger.error('Redis Client Error:', err);
});

redisClient.on('connect', () => {
  logger.info('Redis Client Connected');
});

export const initializeRedis = async (): Promise<void> => {
  try {
    await redisClient.connect();
  } catch (error) {
    logger.error('Failed to connect to Redis:', error);
    // Don't throw error, Redis is optional
  }
};