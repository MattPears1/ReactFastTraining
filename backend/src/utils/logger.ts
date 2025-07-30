import winston from 'winston';
import path from 'path';
import { monitoringConfig } from '../config/monitoring';
import 'winston-daily-rotate-file';

const { combine, timestamp, printf, colorize, errors, json } = winston.format;

const logFormat = printf(({ level, message, timestamp, stack, ...meta }) => {
  const metaStr = Object.keys(meta).length ? ` ${JSON.stringify(meta)}` : '';
  return `${timestamp} [${level}]: ${stack || message}${metaStr}`;
});

const createLogger = () => {
  const transports: winston.transport[] = [];
  
  // Console transport
  if (monitoringConfig.logging.transports.includes('console')) {
    transports.push(
      new winston.transports.Console({
        format: monitoringConfig.logging.format === 'json' 
          ? json() 
          : combine(colorize(), logFormat),
      })
    );
  }
  
  // File transport with rotation
  if (monitoringConfig.logging.transports.includes('file') && !process.env.DYNO) {
    // Don't use file transport on Heroku
    const fileRotateTransport = new (winston.transports as any).DailyRotateFile({
      filename: monitoringConfig.logging.fileOptions.filename,
      datePattern: 'YYYY-MM-DD',
      zippedArchive: true,
      maxSize: monitoringConfig.logging.fileOptions.maxSize,
      maxFiles: monitoringConfig.logging.fileOptions.maxFiles,
      format: json(),
    });
    
    transports.push(fileRotateTransport);
    
    // Error-only file
    transports.push(
      new winston.transports.File({
        filename: path.join('logs', 'error.log'),
        level: 'error',
        maxsize: 5242880, // 5MB
        maxFiles: 5,
        format: json(),
      })
    );
  }
  
  const logger = winston.createLogger({
    level: monitoringConfig.logging.level,
    format: combine(
      timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
      errors({ stack: true }),
      monitoringConfig.logging.format === 'json' ? json() : logFormat
    ),
    transports,
    exitOnError: false,
  });
  
  // Add metadata to all logs
  logger.defaultMeta = {
    service: 'lex-business-backend',
    environment: process.env.NODE_ENV,
    dyno: process.env.DYNO || 'local',
  };

  return logger;
};

export const logger = createLogger();