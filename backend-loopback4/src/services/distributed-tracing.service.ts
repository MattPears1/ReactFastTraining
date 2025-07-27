import { MonitoringService } from './monitoring.service';
import { v4 as uuidv4 } from 'uuid';

export interface Span {
  traceId: string;
  spanId: string;
  parentSpanId?: string;
  operationName: string;
  serviceName: string;
  startTime: number;
  endTime?: number;
  duration?: number;
  tags: Record<string, any>;
  logs: Array<{
    timestamp: number;
    fields: Record<string, any>;
  }>;
  status: 'ok' | 'error' | 'cancelled';
  error?: Error;
}

export interface TraceContext {
  traceId: string;
  spanId: string;
  parentSpanId?: string;
  baggage: Record<string, string>;
}

export class DistributedTracing {
  private static instance: DistributedTracing;
  private activeSpans = new Map<string, Span>();
  private completedSpans: Span[] = [];
  private readonly maxCompletedSpans = 10000;
  
  private constructor() {
    // Start span cleanup
    this.startSpanCleanup();
  }
  
  static getInstance(): DistributedTracing {
    if (!this.instance) {
      this.instance = new DistributedTracing();
    }
    return this.instance;
  }
  
  createRootSpan(operationName: string, tags?: Record<string, any>): Span {
    const span: Span = {
      traceId: uuidv4(),
      spanId: uuidv4(),
      operationName,
      serviceName: process.env.SERVICE_NAME || 'payment-service',
      startTime: Date.now(),
      tags: {
        ...tags,
        'span.kind': 'server',
        'service.version': process.env.APP_VERSION || 'unknown',
        'deployment.environment': process.env.NODE_ENV || 'development',
      },
      logs: [],
      status: 'ok',
    };
    
    this.activeSpans.set(span.spanId, span);
    return span;
  }
  
  createChildSpan(
    parentSpan: Span | TraceContext,
    operationName: string,
    tags?: Record<string, any>
  ): Span {
    const span: Span = {
      traceId: parentSpan.traceId,
      spanId: uuidv4(),
      parentSpanId: 'spanId' in parentSpan ? parentSpan.spanId : parentSpan.spanId,
      operationName,
      serviceName: process.env.SERVICE_NAME || 'payment-service',
      startTime: Date.now(),
      tags: {
        ...tags,
        'span.kind': 'internal',
      },
      logs: [],
      status: 'ok',
    };
    
    this.activeSpans.set(span.spanId, span);
    return span;
  }
  
  async traceAsync<T>(
    operationName: string,
    operation: (span: Span) => Promise<T>,
    parentSpan?: Span | TraceContext,
    tags?: Record<string, any>
  ): Promise<T> {
    const span = parentSpan
      ? this.createChildSpan(parentSpan, operationName, tags)
      : this.createRootSpan(operationName, tags);
    
    try {
      const result = await operation(span);
      this.finishSpan(span);
      return result;
    } catch (error) {
      this.finishSpan(span, error as Error);
      throw error;
    }
  }
  
  traceSync<T>(
    operationName: string,
    operation: (span: Span) => T,
    parentSpan?: Span | TraceContext,
    tags?: Record<string, any>
  ): T {
    const span = parentSpan
      ? this.createChildSpan(parentSpan, operationName, tags)
      : this.createRootSpan(operationName, tags);
    
    try {
      const result = operation(span);
      this.finishSpan(span);
      return result;
    } catch (error) {
      this.finishSpan(span, error as Error);
      throw error;
    }
  }
  
  addTags(span: Span, tags: Record<string, any>): void {
    Object.assign(span.tags, tags);
  }
  
  addLog(span: Span, fields: Record<string, any>): void {
    span.logs.push({
      timestamp: Date.now(),
      fields,
    });
  }
  
  setError(span: Span, error: Error): void {
    span.status = 'error';
    span.error = error;
    span.tags.error = true;
    span.tags['error.message'] = error.message;
    span.tags['error.type'] = error.name;
    span.tags['error.stack'] = error.stack;
  }
  
  finishSpan(span: Span, error?: Error): void {
    span.endTime = Date.now();
    span.duration = span.endTime - span.startTime;
    
    if (error) {
      this.setError(span, error);
    }
    
    // Remove from active spans
    this.activeSpans.delete(span.spanId);
    
    // Add to completed spans
    this.completedSpans.push(span);
    if (this.completedSpans.length > this.maxCompletedSpans) {
      this.completedSpans.shift();
    }
    
    // Log span completion
    this.logSpan(span);
    
    // Send to tracing backend (if configured)
    this.exportSpan(span);
  }
  
  private logSpan(span: Span): void {
    const logData = {
      traceId: span.traceId,
      spanId: span.spanId,
      parentSpanId: span.parentSpanId,
      operation: span.operationName,
      duration: span.duration,
      status: span.status,
      tags: span.tags,
    };
    
    if (span.status === 'error') {
      MonitoringService.error(`Span failed: ${span.operationName}`, span.error, logData);
    } else if (span.duration && span.duration > 1000) {
      MonitoringService.warn(`Slow span: ${span.operationName}`, logData);
    } else {
      MonitoringService.debug(`Span completed: ${span.operationName}`, logData);
    }
  }
  
  private async exportSpan(span: Span): Promise<void> {
    // Export to Jaeger/Zipkin/etc if configured
    if (process.env.JAEGER_ENDPOINT) {
      try {
        // Convert to Jaeger format and send
        const jaegerSpan = this.convertToJaegerFormat(span);
        // await sendToJaeger(jaegerSpan);
      } catch (error) {
        MonitoringService.error('Failed to export span', error);
      }
    }
  }
  
  private convertToJaegerFormat(span: Span): any {
    return {
      traceID: span.traceId,
      spanID: span.spanId,
      parentSpanID: span.parentSpanId,
      operationName: span.operationName,
      startTime: span.startTime * 1000, // microseconds
      duration: (span.duration || 0) * 1000,
      tags: Object.entries(span.tags).map(([key, value]) => ({
        key,
        type: typeof value === 'string' ? 'string' : 'number',
        value: String(value),
      })),
      logs: span.logs.map(log => ({
        timestamp: log.timestamp * 1000,
        fields: Object.entries(log.fields).map(([key, value]) => ({
          key,
          value: String(value),
        })),
      })),
      process: {
        serviceName: span.serviceName,
        tags: [
          { key: 'hostname', value: process.env.HOSTNAME || 'unknown' },
          { key: 'ip', value: process.env.POD_IP || 'unknown' },
        ],
      },
    };
  }
  
  extractContext(headers: Record<string, string>): TraceContext | null {
    // Support for W3C Trace Context
    const traceparent = headers['traceparent'];
    if (traceparent) {
      const parts = traceparent.split('-');
      if (parts.length === 4) {
        return {
          traceId: parts[1],
          spanId: parts[2],
          baggage: this.parseBaggage(headers['baggage']),
        };
      }
    }
    
    // Support for Jaeger headers
    const jaegerHeader = headers['uber-trace-id'];
    if (jaegerHeader) {
      const parts = jaegerHeader.split(':');
      if (parts.length >= 3) {
        return {
          traceId: parts[0],
          spanId: parts[1],
          parentSpanId: parts[2],
          baggage: {},
        };
      }
    }
    
    return null;
  }
  
  injectContext(context: TraceContext): Record<string, string> {
    // W3C Trace Context format
    const headers: Record<string, string> = {
      'traceparent': `00-${context.traceId}-${context.spanId}-01`,
    };
    
    // Add baggage if present
    if (Object.keys(context.baggage).length > 0) {
      headers['baggage'] = Object.entries(context.baggage)
        .map(([key, value]) => `${key}=${value}`)
        .join(',');
    }
    
    return headers;
  }
  
  private parseBaggage(baggageHeader?: string): Record<string, string> {
    if (!baggageHeader) return {};
    
    const baggage: Record<string, string> = {};
    const items = baggageHeader.split(',');
    
    for (const item of items) {
      const [key, value] = item.split('=');
      if (key && value) {
        baggage[key.trim()] = value.trim();
      }
    }
    
    return baggage;
  }
  
  getActiveSpans(): Span[] {
    return Array.from(this.activeSpans.values());
  }
  
  getTrace(traceId: string): Span[] {
    return this.completedSpans.filter(span => span.traceId === traceId);
  }
  
  private startSpanCleanup(): void {
    // Clean up orphaned spans
    setInterval(() => {
      const now = Date.now();
      const timeout = 300000; // 5 minutes
      
      for (const [spanId, span] of this.activeSpans) {
        if (now - span.startTime > timeout) {
          MonitoringService.warn('Orphaned span detected', {
            spanId,
            operation: span.operationName,
            age: now - span.startTime,
          });
          
          span.tags['span.timeout'] = true;
          this.finishSpan(span, new Error('Span timeout'));
        }
      }
    }, 60000); // Every minute
  }
}

// Tracing middleware for Express/LoopBack
export function tracingMiddleware(req: any, res: any, next: any) {
  const tracer = DistributedTracing.getInstance();
  
  // Extract trace context from headers
  const parentContext = tracer.extractContext(req.headers);
  
  // Create span for this request
  const span = parentContext
    ? tracer.createChildSpan(parentContext, `${req.method} ${req.path}`)
    : tracer.createRootSpan(`${req.method} ${req.path}`);
  
  // Add request metadata
  tracer.addTags(span, {
    'http.method': req.method,
    'http.url': req.url,
    'http.path': req.path,
    'http.remote_addr': req.ip,
    'http.user_agent': req.headers['user-agent'],
  });
  
  // Attach span to request
  req.span = span;
  req.traceContext = {
    traceId: span.traceId,
    spanId: span.spanId,
    baggage: {},
  };
  
  // Track response
  const originalSend = res.send;
  res.send = function(data: any) {
    tracer.addTags(span, {
      'http.status_code': res.statusCode,
      'http.response_size': data ? data.length : 0,
    });
    
    if (res.statusCode >= 400) {
      tracer.setError(span, new Error(`HTTP ${res.statusCode}`));
    }
    
    tracer.finishSpan(span);
    return originalSend.call(this, data);
  };
  
  next();
}

// Export singleton instance
export const tracer = DistributedTracing.getInstance();