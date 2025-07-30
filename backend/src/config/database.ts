import { Sequelize } from 'sequelize-typescript';
import { config } from './config';
import { logger } from '../utils/logger';
import path from 'path';
import { defineAssociations } from '../models';

// Parse DATABASE_URL for Heroku deployment
const getDatabaseConfig = () => {
  if (process.env.DATABASE_URL) {
    const url = new URL(process.env.DATABASE_URL);
    return {
      dialect: 'postgres' as const,
      host: url.hostname,
      port: parseInt(url.port),
      database: url.pathname.substr(1),
      username: url.username,
      password: url.password,
      dialectOptions: {
        ssl: process.env.NODE_ENV === 'production' ? {
          require: true,
          rejectUnauthorized: false
        } : false
      }
    };
  }
  
  return {
    dialect: config.database.dialect,
    host: config.database.host,
    port: config.database.port,
    database: config.database.name,
    username: config.database.user,
    password: config.database.password,
  };
};

const dbConfig = getDatabaseConfig();

export const sequelize = new Sequelize({
  ...dbConfig,
  logging: config.database.logging ? (msg) => logger.debug(msg) : false,
  pool: config.database.pool,
  models: [path.join(__dirname, '../models/**/*.model.ts')],
  define: {
    timestamps: true,
    underscored: true,
  },
});

export const initializeDatabase = async (): Promise<void> => {
  try {
    await sequelize.authenticate();
    logger.info('Database connection established successfully');
    
    // Define associations
    defineAssociations();
    logger.info('Model associations defined');
    
    // Sync models in development (use migrations in production)
    if (config.env === 'development' && process.env.SYNC_DATABASE === 'true') {
      await sequelize.sync({ alter: true });
      logger.info('Database models synchronized');
    }
  } catch (error) {
    logger.error('Unable to connect to the database:', error);
    throw error;
  }
};