import type { Knex } from "knex";
import * as dotenv from "dotenv";

dotenv.config();

const config: { [key: string]: Knex.Config } = {
  development: {
    client: "postgresql",
    connection: {
      connectionString: process.env.DATABASE_URL,
      ssl: { rejectUnauthorized: false }
    },
    migrations: {
      directory: "./src/database/migrations",
      extension: "ts"
    },
    seeds: {
      directory: "./src/database/seeds",
      extension: "ts"
    }
  },
  
  test: {
    client: "postgresql",
    connection: {
      host: "localhost",
      port: 5432,
      user: "postgres",
      password: process.env.DB_PASSWORD,
      database: "reactfast_test"
    },
    migrations: {
      directory: "./src/database/migrations",
      extension: "ts"
    }
  },
  
  production: {
    client: "postgresql",
    connection: {
      connectionString: process.env.DATABASE_URL,
      ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
    },
    migrations: {
      directory: "./src/database/migrations",
      extension: "ts"
    },
    seeds: {
      directory: "./src/database/seeds",
      extension: "ts"
    },
    pool: {
      min: 2,
      max: 10
    }
  }
};

export default config;