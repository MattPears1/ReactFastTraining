import type { Knex } from "knex";
import { getKnexConfig } from "./src/database/config";

// Use centralized configuration
const baseConfig = getKnexConfig();

const config: { [key: string]: Knex.Config } = {
  development: baseConfig,
  
  test: {
    ...baseConfig,
    connection: {
      host: "localhost",
      port: 5432,
      user: "postgres",
      password: process.env.DB_PASSWORD || "postgres",
      database: "reactfast_test"
    },
    pool: {
      min: 1,
      max: 5
    }
  },
  
  production: baseConfig
};

export default config;