# Express to LoopBack 4 Migration Plan

## Executive Summary

This document outlines a comprehensive strategy for migrating React Fast Training's backend from Express.js to LoopBack 4, ensuring zero downtime, maintaining all functionality, and improving the overall architecture.

## 1. Why Migrate to LoopBack 4?

### Current Express.js Limitations
- **No standard structure**: Code organization varies across endpoints
- **Manual implementation**: Authentication, validation, error handling all custom-built
- **Limited type safety**: JavaScript-based with no enforced contracts
- **Scalability concerns**: Monolithic structure in server.js
- **Testing challenges**: No built-in testing framework or patterns

### LoopBack 4 Benefits
- **Enterprise-grade framework**: Built for production-ready APIs
- **TypeScript-first**: Full type safety and better developer experience
- **Dependency Injection**: Cleaner code organization and testability
- **Built-in features**:
  - OpenAPI/Swagger documentation
  - Authentication & Authorization components
  - Request validation & sanitization
  - Repository pattern for data access
  - Interceptors for cross-cutting concerns
- **Microservices ready**: Can easily split into services later
- **Better performance**: Optimized request handling
- **Active community**: Regular updates and security patches

## 2. Migration Strategy Overview

### Phase 1: Parallel Running (Weeks 1-2)
- Both Express and LoopBack 4 run simultaneously
- LoopBack 4 on port 3000, Express on port 3002
- Nginx/Load balancer routes traffic based on endpoints
- Gradual migration of endpoints

### Phase 2: Feature Parity (Weeks 3-4)
- Implement all Express endpoints in LoopBack 4
- Maintain identical API contracts
- Share database and session storage
- Comprehensive testing

### Phase 3: Traffic Migration (Week 5)
- Gradually shift traffic to LoopBack 4
- Monitor performance and errors
- Quick rollback capability

### Phase 4: Decommission Express (Week 6)
- Remove Express server
- Clean up code
- Update documentation

## 3. Database Compatibility Strategy

### Current State
- PostgreSQL database
- Raw SQL queries in Express
- No ORM/migrations

### Migration Approach
1. **Use existing database schema**: No changes to tables
2. **Implement repositories**: Map to existing tables
3. **Gradual query migration**: Convert SQL to LoopBack queries
4. **Shared connection pool**: Both servers use same DB

### Database Migration Steps
```typescript
// 1. Create LoopBack datasource for existing DB
export const postgresDataSource = new juggler.DataSource({
  name: 'postgres',
  connector: 'postgresql',
  host: process.env.DB_HOST,
  port: process.env.DB_PORT,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  ssl: process.env.NODE_ENV === 'production'
});

// 2. Create models matching existing tables
@model({
  settings: {
    postgresql: {
      table: 'users' // Map to existing table
    }
  }
})
export class User extends Entity {
  @property({
    type: 'number',
    id: true,
    postgresql: {
      columnName: 'id'
    }
  })
  id: number;
  // ... other properties
}
```

## 4. Feature Migration Checklist

### Authentication System
- [x] JWT token generation (already in LB4)
- [x] Admin login endpoint (already in LB4)
- [ ] Session management compatibility
- [ ] Rate limiting migration
- [ ] CSRF protection

### Core Features
- [ ] Course management
- [ ] Booking system
- [ ] Payment processing (Stripe)
- [ ] Email notifications
- [ ] Analytics dashboard
- [ ] Schedule management
- [ ] Certificate generation

### Security Features
- [ ] Input validation
- [ ] SQL injection prevention
- [ ] XSS protection
- [ ] Security headers
- [ ] CORS configuration

## 5. Step-by-Step Implementation

### Step 1: Environment Setup
```bash
# 1. Update environment variables
cp .env .env.backup
echo "LOOPBACK_PORT=3000" >> .env
echo "EXPRESS_PORT=3002" >> .env
echo "MIGRATION_MODE=parallel" >> .env

# 2. Install dependencies
cd backend-loopback4
npm install

# 3. Build LoopBack application
npm run build
```

### Step 2: Configure Parallel Running
```javascript
// start-migration.js
const { spawn } = require('child_process');

// Start Express server
const expressServer = spawn('node', ['server.js'], {
  env: { ...process.env, PORT: 3002 }
});

// Start LoopBack server
const loopbackServer = spawn('node', ['backend-loopback4/index.js'], {
  env: { ...process.env, PORT: 3000 }
});

// Add process management and logging
```

### Step 3: Implement Shared Services
```typescript
// shared/services/database.service.ts
export class SharedDatabaseService {
  private static pool: Pool;
  
  static getPool(): Pool {
    if (!this.pool) {
      this.pool = new Pool({
        connectionString: process.env.DATABASE_URL,
        max: 20,
        idleTimeoutMillis: 30000
      });
    }
    return this.pool;
  }
}

// shared/services/redis.service.ts
export class SharedRedisService {
  private static client: RedisClient;
  
  static getClient(): RedisClient {
    if (!this.client) {
      this.client = createClient({
        url: process.env.REDIS_URL
      });
    }
    return this.client;
  }
}
```

### Step 4: Migrate Endpoints (Example: Auth)
```typescript
// backend-loopback4/src/controllers/auth.controller.ts
import {post, requestBody} from '@loopback/rest';
import {inject} from '@loopback/core';
import {SecurityBindings} from '@loopback/security';

export class AuthController {
  constructor(
    @inject('services.auth') private authService: AuthService,
    @inject('services.shared.redis') private redis: SharedRedisService
  ) {}

  @post('/api/admin/auth/login')
  async login(
    @requestBody() credentials: LoginRequest
  ): Promise<LoginResponse> {
    // Implement same logic as Express endpoint
    // Use shared Redis for session storage
    // Return identical response structure
  }
}
```

### Step 5: Implement Route Proxy
```nginx
# nginx.conf
upstream express_backend {
    server localhost:3002;
}

upstream loopback_backend {
    server localhost:3000;
}

server {
    listen 80;
    server_name api.reactfasttraining.co.uk;

    # Phase 1: Route specific endpoints to LoopBack
    location ~ ^/api/admin/auth/(login|logout|me)$ {
        proxy_pass http://loopback_backend;
    }

    # Default: Route to Express
    location /api {
        proxy_pass http://express_backend;
    }
}
```

## 6. Migration Timeline

### Week 1-2: Foundation
- Set up parallel infrastructure
- Migrate authentication endpoints
- Implement shared services
- Set up monitoring

### Week 3-4: Core Features
- Migrate booking endpoints
- Migrate payment processing
- Migrate admin dashboard
- Comprehensive testing

### Week 5: Traffic Migration
- 10% traffic to LoopBack (Day 1)
- 25% traffic (Day 2)
- 50% traffic (Day 3)
- 75% traffic (Day 4)
- 100% traffic (Day 5)

### Week 6: Cleanup
- Monitor for issues
- Remove Express code
- Update documentation
- Team training

## 7. Testing Strategy

### Unit Tests
```typescript
describe('AuthController', () => {
  let app: RestApplication;
  let client: Client;

  before(async () => {
    app = await setupApplication();
    client = createRestAppClient(app);
  });

  it('should authenticate admin user', async () => {
    const response = await client
      .post('/api/admin/auth/login')
      .send({
        email: 'lex@reactfasttraining.co.uk',
        password: 'test123'
      })
      .expect(200);

    expect(response.body).to.have.property('accessToken');
  });
});
```

### Integration Tests
- Test both servers return identical responses
- Verify database consistency
- Check session sharing
- Validate third-party integrations

### Performance Tests
```bash
# Load testing with k6
k6 run --vus 100 --duration 30s migration-test.js
```

## 8. Rollback Plan

### Immediate Rollback (< 5 minutes)
```bash
# Update nginx to route all traffic to Express
nginx -s reload

# Stop LoopBack server
pm2 stop loopback-api

# Notify team
./scripts/notify-rollback.sh
```

### Data Rollback
- Database changes are backward compatible
- No schema migrations during transition
- Session data compatible between systems

## 9. Monitoring & Success Metrics

### Key Metrics
- Response time: Should improve by 20%
- Error rate: < 0.1%
- Uptime: 99.9%
- Memory usage: Should decrease
- CPU usage: Should decrease

### Monitoring Tools
```typescript
// Custom middleware for metrics
export class MetricsInterceptor implements Provider<Interceptor> {
  value() {
    return this.intercept.bind(this);
  }

  async intercept(
    invocationCtx: InvocationContext,
    next: () => ValueOrPromise<InvocationResult>
  ) {
    const start = Date.now();
    try {
      const result = await next();
      const duration = Date.now() - start;
      
      // Log to monitoring service
      metrics.histogram('api.request.duration', duration, {
        endpoint: invocationCtx.targetName,
        method: invocationCtx.methodName
      });
      
      return result;
    } catch (err) {
      metrics.increment('api.request.error', {
        endpoint: invocationCtx.targetName,
        error: err.message
      });
      throw err;
    }
  }
}
```

## 10. Team Training

### Documentation
- API documentation auto-generated via OpenAPI
- Migration guide for developers
- Troubleshooting guide

### Training Sessions
1. LoopBack 4 fundamentals (2 hours)
2. Dependency injection patterns (1 hour)
3. Repository pattern & data access (2 hours)
4. Testing in LoopBack 4 (1 hour)

## 11. Post-Migration Improvements

### Immediate Improvements
- API documentation via Swagger UI
- Stronger type safety
- Better error handling
- Improved testing

### Future Enhancements
- GraphQL support
- WebSocket integration
- Microservices architecture
- API versioning
- Rate limiting per user/tier

## Conclusion

This migration plan ensures a smooth transition from Express to LoopBack 4 with:
- Zero downtime
- No data loss
- Improved performance
- Better maintainability
- Enhanced developer experience

The gradual approach minimizes risk while maximizing the benefits of a modern, enterprise-grade framework.