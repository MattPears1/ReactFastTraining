import { config } from './config';

export interface MonitoringConfig {
  sentry: {
    dsn: string;
    environment: string;
    tracesSampleRate: number;
    enabled: boolean;
  };
  newRelic: {
    appName: string;
    licenseKey: string;
    enabled: boolean;
  };
  logging: {
    level: string;
    format: 'json' | 'simple';
    transports: Array<'console' | 'file' | 'remote'>;
    fileOptions: {
      filename: string;
      maxSize: string;
      maxFiles: number;
    };
  };
  metrics: {
    enabled: boolean;
    interval: number;
    includeNodeMetrics: boolean;
    includeExpressMetrics: boolean;
  };
  alerts: {
    errorThreshold: number;
    responseTimeThreshold: number;
    cpuThreshold: number;
    memoryThreshold: number;
  };
}

export const monitoringConfig: MonitoringConfig = {
  sentry: {
    dsn: process.env.SENTRY_DSN || '',
    environment: config.env,
    tracesSampleRate: config.env === 'production' ? 0.1 : 1.0,
    enabled: !!process.env.SENTRY_DSN,
  },
  newRelic: {
    appName: process.env.NEW_RELIC_APP_NAME || 'lex-business',
    licenseKey: process.env.NEW_RELIC_LICENSE_KEY || '',
    enabled: !!process.env.NEW_RELIC_LICENSE_KEY,
  },
  logging: {
    level: process.env.LOG_LEVEL || (config.env === 'production' ? 'info' : 'debug'),
    format: config.env === 'production' ? 'json' : 'simple',
    transports: config.env === 'production' 
      ? ['console', 'file', 'remote'] 
      : ['console'],
    fileOptions: {
      filename: process.env.LOG_FILE || 'logs/app-%DATE%.log',
      maxSize: '20m',
      maxFiles: 14,
    },
  },
  metrics: {
    enabled: config.env === 'production',
    interval: 60000, // 1 minute
    includeNodeMetrics: true,
    includeExpressMetrics: true,
  },
  alerts: {
    errorThreshold: 10, // errors per minute
    responseTimeThreshold: 1000, // ms
    cpuThreshold: 80, // percentage
    memoryThreshold: 85, // percentage
  },
};

// Heroku-specific configurations
if (process.env.DYNO) {
  // Running on Heroku
  monitoringConfig.logging.transports = ['console']; // Heroku captures stdout
  monitoringConfig.metrics.enabled = true;
}