import { get } from '@loopback/rest';

export class ApiController {
  constructor() {}

  @get('/api/ping')
  ping() {
    return {
      status: 'OK',
      timestamp: new Date().toISOString(),
      service: 'React Fast Training API',
      message: 'Backend is running successfully'
    };
  }

  @get('/api/health')
  health() {
    return {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      version: '1.0.0'
    };
  }
}