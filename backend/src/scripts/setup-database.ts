import { exec } from 'child_process';
import { promisify } from 'util';
import { sequelize } from '../config/database';
import { defineAssociations } from '../models';
import { logger } from '../utils/logger';

const execAsync = promisify(exec);

export async function setupDatabase() {
  try {
    logger.info('Starting database setup...');

    // Test database connection
    await sequelize.authenticate();
    logger.info('Database connection established');

    // Define model associations
    defineAssociations();
    logger.info('Model associations defined');

    // Run migrations
    logger.info('Running migrations...');
    const { stdout: migrationOutput } = await execAsync('npx sequelize-cli db:migrate');
    logger.info('Migrations completed:', migrationOutput);

    // Run seeders in development
    if (process.env.NODE_ENV === 'development') {
      logger.info('Running seeders...');
      const { stdout: seederOutput } = await execAsync('npx sequelize-cli db:seed:all');
      logger.info('Seeders completed:', seederOutput);
    }

    logger.info('Database setup completed successfully');
  } catch (error) {
    logger.error('Database setup failed:', error);
    throw error;
  }
}

// Run if called directly
if (require.main === module) {
  setupDatabase()
    .then(() => {
      logger.info('Database setup script completed');
      process.exit(0);
    })
    .catch((error) => {
      logger.error('Database setup script failed:', error);
      process.exit(1);
    });
}