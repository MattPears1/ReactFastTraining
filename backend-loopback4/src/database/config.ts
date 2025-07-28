import * as dotenv from 'dotenv';
import { URL } from 'url';

// Load environment variables
dotenv.config();

// Parse DATABASE_URL if present
function parseConnectionString(connectionString: string) {
  try {
    const dbUrl = new URL(connectionString);
    return {
      host: dbUrl.hostname,
      port: parseInt(dbUrl.port || '5432'),
      user: dbUrl.username,
      password: dbUrl.password,
      database: dbUrl.pathname.substring(1),
      ssl: { rejectUnauthorized: false }
    };
  } catch (error) {
    console.error('Error parsing DATABASE_URL:', error);
    return null;
  }
}

// Database configuration with production-ready settings
export const getDatabaseConfig = () => {
  const isProduction = process.env.NODE_ENV === 'production';
  const connectionString = process.env.DATABASE_URL;
  
  // Parse connection string if available
  const parsedConnection = connectionString ? parseConnectionString(connectionString) : null;
  
  const config = {
    name: 'postgres',
    connector: 'postgresql',
    
    // Connection settings
    ...(parsedConnection || {
      host: process.env.DB_HOST || 'localhost',
      port: parseInt(process.env.DB_PORT || '5432'),
      user: process.env.DB_USER || 'postgres',
      password: process.env.DB_PASSWORD || 'postgres',
      database: process.env.DB_NAME || 'react_fast_training',
    }),
    
    // Connection pool settings - optimized for production
    min: isProduction ? 5 : 2,
    max: isProduction ? 20 : 10,
    idleTimeoutMillis: 60000, // 1 minute
    connectionTimeoutMillis: 30000, // 30 seconds
    
    // SSL configuration for production
    ssl: isProduction || connectionString 
      ? { rejectUnauthorized: false } 
      : false,
    
    // Statement timeout to prevent long-running queries
    statement_timeout: 60000, // 60 seconds
    
    // Query timeout
    query_timeout: 60000, // 60 seconds
    
    // Connection retry settings
    acquireConnectionTimeout: 60000, // 60 seconds
    
    // Application name for monitoring
    application_name: 'react-fast-training-api',
  };
  
  return config;
};

// Knex configuration for migrations
export const getKnexConfig = () => {
  const isProduction = process.env.NODE_ENV === 'production';
  const connectionString = process.env.DATABASE_URL;
  
  return {
    client: 'postgresql',
    connection: connectionString ? {
      connectionString,
      ssl: { rejectUnauthorized: false }
    } : {
      host: process.env.DB_HOST || 'localhost',
      port: parseInt(process.env.DB_PORT || '5432'),
      user: process.env.DB_USER || 'postgres',
      password: process.env.DB_PASSWORD || 'postgres',
      database: process.env.DB_NAME || 'react_fast_training',
    },
    pool: {
      min: isProduction ? 2 : 1,
      max: isProduction ? 10 : 5,
      createTimeoutMillis: 30000,
      acquireTimeoutMillis: 30000,
      idleTimeoutMillis: 30000,
      reapIntervalMillis: 1000,
      createRetryIntervalMillis: 200,
    },
    migrations: {
      directory: './src/database/migrations',
      extension: 'ts',
      tableName: 'knex_migrations',
    },
    seeds: {
      directory: './src/database/seeds',
      extension: 'ts',
    },
    // Additional knex settings
    acquireConnectionTimeout: 60000,
    debug: process.env.DATABASE_DEBUG === 'true',
  };
};

// Test database connection
export async function testDatabaseConnection() {
  const knex = require('knex');
  const config = getKnexConfig();
  
  const db = knex(config);
  
  try {
    // Test connection
    await db.raw('SELECT 1');
    console.log('✅ Database connection successful');
    
    // Get database version
    const result = await db.raw('SELECT version()');
    console.log('📊 PostgreSQL version:', result.rows[0].version);
    
    return true;
  } catch (error) {
    console.error('❌ Database connection failed:', error);
    return false;
  } finally {
    await db.destroy();
  }
}

// Create database connection with retry logic
export async function createDatabaseConnection(maxRetries = 5, retryDelay = 5000) {
  const knex = require('knex');
  const config = getKnexConfig();
  
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      console.log(`🔄 Attempting database connection (attempt ${attempt}/${maxRetries})...`);
      
      const db = knex(config);
      
      // Test the connection
      await db.raw('SELECT 1');
      
      console.log('✅ Database connected successfully');
      return db;
    } catch (error) {
      console.error(`❌ Connection attempt ${attempt} failed:`, error.message);
      
      if (attempt === maxRetries) {
        throw new Error(`Failed to connect to database after ${maxRetries} attempts: ${error.message}`);
      }
      
      console.log(`⏳ Waiting ${retryDelay}ms before retry...`);
      await new Promise(resolve => setTimeout(resolve, retryDelay));
    }
  }
}