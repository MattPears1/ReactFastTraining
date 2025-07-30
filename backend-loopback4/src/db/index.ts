// Database configuration and connection
import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as schema from './schema';

// Database connection
const connectionString = process.env.DATABASE_URL || 'postgresql://localhost:5432/react_fast_training';

// Create postgres client
const client = postgres(connectionString, {
  max: 20,
  idle_timeout: 30,
  connect_timeout: 10,
});

// Create drizzle database instance with schema
export const db = drizzle(client, { schema });

// Export all schema for convenience
export * from './schema';