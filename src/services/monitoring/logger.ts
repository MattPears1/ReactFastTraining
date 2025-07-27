import { apiClient } from '@services/api/enhanced-client';

type LogLevel = 'debug' | 'info' | 'warn' | 'error' | 'fatal';
type LogCategory = 'performance' | 'security' | 'business' | 'technical' | 'user-action';

interface LogEntry {
  id: string;
  timestamp: string;
  level: LogLevel;
  category: LogCategory;
  message: string;
  data?: any;
  context: LogContext;
  stack?: string;
  sessionId?: string;
  userId?: string;
}

interface LogContext {
  browser: string;
  userAgent: string;
  url: string;
  viewport: { width: number; height: number };
  memory?: number;
  connectionType?: string;
  environment: string;
}

interface LoggerConfig {
  enableConsole: boolean;
  enableRemote: boolean;
  enableLocalStorage: boolean;
  minLevel: LogLevel;
  maxLocalEntries: number;
  batchSize: number;
  flushInterval: number;
  samplingRate: number;
}

class Logger {
  private config: LoggerConfig;
  private buffer: LogEntry[] = [];
  private flushTimer: NodeJS.Timeout | null = null;
  private sessionId: string;
  private userId: string | null = null;
  private logLevels: Record<LogLevel, number> = {
    debug: 0,
    info: 1,
    warn: 2,
    error: 3,
    fatal: 4,
  };

  constructor(config: Partial<LoggerConfig> = {}) {
    this.config = {
      enableConsole: process.env.NODE_ENV === 'development',
      enableRemote: true,
      enableLocalStorage: true,
      minLevel: process.env.NODE_ENV === 'production' ? 'info' : 'debug',
      maxLocalEntries: 1000,
      batchSize: 50,
      flushInterval: 30000, // 30 seconds
      samplingRate: 1.0, // 100% by default
      ...config,
    };

    this.sessionId = this.generateSessionId();
    this.startFlushTimer();
    this.setupErrorHandlers();
    this.setupPerformanceObserver();
  }

  // Core logging methods
  debug(message: string, data?: any, category: LogCategory = 'technical') {
    this.log('debug', message, data, category);
  }

  info(message: string, data?: any, category: LogCategory = 'technical') {
    this.log('info', message, data, category);
  }

  warn(message: string, data?: any, category: LogCategory = 'technical') {
    this.log('warn', message, data, category);
  }

  error(message: string, error?: Error | any, category: LogCategory = 'technical') {
    const data = error instanceof Error ? {
      message: error.message,
      stack: error.stack,
      name: error.name,
    } : error;
    
    this.log('error', message, data, category, error?.stack);
  }

  fatal(message: string, error?: Error | any, category: LogCategory = 'technical') {
    const data = error instanceof Error ? {
      message: error.message,
      stack: error.stack,
      name: error.name,
    } : error;
    
    this.log('fatal', message, data, category, error?.stack);
    this.flush(); // Immediately flush fatal errors
  }

  // Specialized logging methods
  performance(metric: string, value: number, metadata?: any) {
    this.info(`Performance: ${metric}`, { value, ...metadata }, 'performance');
  }

  security(event: string, details: any) {
    this.warn(`Security: ${event}`, details, 'security');
  }

  businessEvent(event: string, data: any) {
    this.info(`Business Event: ${event}`, data, 'business');
  }

  userAction(action: string, details: any) {
    this.info(`User Action: ${action}`, details, 'user-action');
  }

  // Set user context
  setUser(userId: string | null) {
    this.userId = userId;
  }

  // Set custom context
  setContext(key: string, value: any) {
    // Store in session storage for persistence
    const context = this.getStoredContext();
    context[key] = value;
    sessionStorage.setItem('logger_context', JSON.stringify(context));
  }

  // Core logging implementation
  private log(
    level: LogLevel,
    message: string,
    data: any,
    category: LogCategory,
    stack?: string
  ) {
    // Check minimum log level
    if (this.logLevels[level] < this.logLevels[this.config.minLevel]) {
      return;
    }

    // Apply sampling
    if (Math.random() > this.config.samplingRate) {
      return;
    }

    const entry: LogEntry = {
      id: this.generateId(),
      timestamp: new Date().toISOString(),
      level,
      category,
      message,
      data,
      context: this.getContext(),
      stack,
      sessionId: this.sessionId,
      userId: this.userId,
    };

    // Console logging
    if (this.config.enableConsole) {
      this.logToConsole(entry);
    }

    // Local storage
    if (this.config.enableLocalStorage) {
      this.logToLocalStorage(entry);
    }

    // Buffer for remote logging
    if (this.config.enableRemote) {
      this.buffer.push(entry);
      
      if (this.buffer.length >= this.config.batchSize) {
        this.flush();
      }
    }
  }

  private logToConsole(entry: LogEntry) {
    const style = this.getConsoleStyle(entry.level);
    const prefix = `[${entry.timestamp}] [${entry.level.toUpperCase()}] [${entry.category}]`;
    
    console.log(`%c${prefix} ${entry.message}`, style, entry.data || '');
    
    if (entry.stack) {
      console.log(entry.stack);
    }
  }

  private getConsoleStyle(level: LogLevel): string {
    const styles: Record<LogLevel, string> = {
      debug: 'color: #9CA3AF',
      info: 'color: #3B82F6',
      warn: 'color: #F59E0B; font-weight: bold',
      error: 'color: #EF4444; font-weight: bold',
      fatal: 'color: #DC2626; font-weight: bold; font-size: 14px',
    };
    
    return styles[level];
  }

  private logToLocalStorage(entry: LogEntry) {
    try {
      const stored = localStorage.getItem('app_logs');
      const logs = stored ? JSON.parse(stored) : [];
      
      logs.push(entry);
      
      // Maintain max entries
      if (logs.length > this.config.maxLocalEntries) {
        logs.splice(0, logs.length - this.config.maxLocalEntries);
      }
      
      localStorage.setItem('app_logs', JSON.stringify(logs));
    } catch (error) {
      // Fail silently - localStorage might be full
      console.error('Failed to log to localStorage:', error);
    }
  }

  private async flush() {
    if (this.buffer.length === 0) return;

    const entries = [...this.buffer];
    this.buffer = [];

    try {
      await apiClient.post('/api/logs', { entries });
    } catch (error) {
      // Re-add to buffer if failed
      this.buffer.unshift(...entries);
      console.error('Failed to flush logs:', error);
    }
  }

  private startFlushTimer() {
    this.flushTimer = setInterval(() => {
      this.flush();
    }, this.config.flushInterval);
  }

  private setupErrorHandlers() {
    // Global error handler
    window.addEventListener('error', (event) => {
      this.error('Uncaught error', {
        message: event.message,
        filename: event.filename,
        lineno: event.lineno,
        colno: event.colno,
        error: event.error?.stack,
      });
    });

    // Unhandled promise rejection
    window.addEventListener('unhandledrejection', (event) => {
      this.error('Unhandled promise rejection', {
        reason: event.reason,
        promise: event.promise,
      });
    });
  }

  private setupPerformanceObserver() {
    if (!('PerformanceObserver' in window)) return;

    // Long tasks
    try {
      const longTaskObserver = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          if (entry.duration > 50) {
            this.performance('long-task', entry.duration, {
              name: entry.name,
              startTime: entry.startTime,
            });
          }
        }
      });
      
      longTaskObserver.observe({ entryTypes: ['longtask'] });
    } catch (e) {
      // Feature might not be supported
    }

    // Resource timing
    try {
      const resourceObserver = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          if (entry.duration > 1000) {
            this.performance('slow-resource', entry.duration, {
              name: entry.name,
              type: (entry as any).initiatorType,
              size: (entry as any).transferSize,
            });
          }
        }
      });
      
      resourceObserver.observe({ entryTypes: ['resource'] });
    } catch (e) {
      // Feature might not be supported
    }
  }

  private getContext(): LogContext {
    const customContext = this.getStoredContext();
    
    return {
      browser: this.getBrowserInfo(),
      userAgent: navigator.userAgent,
      url: window.location.href,
      viewport: {
        width: window.innerWidth,
        height: window.innerHeight,
      },
      memory: this.getMemoryUsage(),
      connectionType: this.getConnectionType(),
      environment: process.env.NODE_ENV || 'production',
      ...customContext,
    };
  }

  private getStoredContext(): Record<string, any> {
    try {
      const stored = sessionStorage.getItem('logger_context');
      return stored ? JSON.parse(stored) : {};
    } catch {
      return {};
    }
  }

  private getBrowserInfo(): string {
    const ua = navigator.userAgent;
    if (ua.includes('Chrome')) return 'Chrome';
    if (ua.includes('Firefox')) return 'Firefox';
    if (ua.includes('Safari')) return 'Safari';
    if (ua.includes('Edge')) return 'Edge';
    return 'Unknown';
  }

  private getMemoryUsage(): number | undefined {
    if ('memory' in performance) {
      return (performance as any).memory.usedJSHeapSize;
    }
    return undefined;
  }

  private getConnectionType(): string | undefined {
    if ('connection' in navigator) {
      return (navigator as any).connection.effectiveType;
    }
    return undefined;
  }

  private generateId(): string {
    return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  private generateSessionId(): string {
    return `session-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  // Cleanup
  destroy() {
    if (this.flushTimer) {
      clearInterval(this.flushTimer);
    }
    this.flush();
  }
}

// Export singleton instance
export const logger = new Logger();

// Export types
export type { LogLevel, LogCategory, LogEntry, LoggerConfig };