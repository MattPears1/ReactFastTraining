# Express to LoopBack 4 Migration Examples

## 1. Authentication Endpoint Migration

### Express Implementation (Current)
```javascript
// server.js
app.post('/api/admin/auth/login', createRateLimiter('auth'), async (req, res) => {
  const { email, password } = req.body;
  
  if (!email || !password) {
    return res.status(400).json({ error: 'Email and password are required' });
  }
  
  if (email !== ADMIN_EMAIL) {
    return res.status(401).json({ error: 'Invalid credentials' });
  }
  
  let isValidPassword = false;
  if (process.env.NODE_ENV === 'production') {
    isValidPassword = await bcrypt.compare(password, ADMIN_PASSWORD_HASH);
  } else {
    isValidPassword = password === 'LexOnly321!';
  }
  
  if (!isValidPassword) {
    return res.status(401).json({ error: 'Invalid credentials' });
  }
  
  const token = generateSecureToken();
  const tokenData = {
    userId: 1,
    email: ADMIN_EMAIL,
    name: 'Lex',
    role: 'admin',
    createdAt: Date.now(),
    expiresAt: Date.now() + (3600 * 1000)
  };
  
  activeTokens.set(token, tokenData);
  
  res.json({
    accessToken: token,
    user: {
      id: tokenData.userId,
      email: tokenData.email,
      name: tokenData.name,
      role: tokenData.role
    },
    expiresIn: 3600
  });
});
```

### LoopBack 4 Implementation (New)
```typescript
// backend-loopback4/src/controllers/admin/auth.controller.ts
import {post, requestBody, HttpErrors} from '@loopback/rest';
import {inject} from '@loopback/core';
import {repository} from '@loopback/repository';
import {UserRepository} from '../../repositories';
import {RateLimitInterceptor} from '../../interceptors';
import {JWTService} from '../../services';

export class AdminAuthController {
  constructor(
    @repository(UserRepository)
    private userRepository: UserRepository,
    @inject('services.jwt')
    private jwtService: JWTService,
  ) {}

  @post('/api/admin/auth/login')
  @intercept(RateLimitInterceptor.BINDING_KEY)
  async login(
    @requestBody({
      content: {
        'application/json': {
          schema: {
            type: 'object',
            required: ['email', 'password'],
            properties: {
              email: {type: 'string', format: 'email'},
              password: {type: 'string', minLength: 8}
            }
          }
        }
      }
    }) credentials: {email: string; password: string}
  ): Promise<{
    accessToken: string;
    user: {id: number; email: string; name: string; role: string};
    expiresIn: number;
  }> {
    // Input is automatically validated by LoopBack
    
    const user = await this.userRepository.findOne({
      where: {email: credentials.email, role: 'admin'}
    });

    if (!user || !(await user.verifyPassword(credentials.password))) {
      throw new HttpErrors.Unauthorized('Invalid credentials');
    }

    const tokenData = {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role
    };

    const accessToken = await this.jwtService.generateToken(tokenData);

    return {
      accessToken,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role
      },
      expiresIn: 3600
    };
  }
}
```

## 2. Course Sessions Endpoint Migration

### Express Implementation (Current)
```javascript
// server.js
app.get('/api/course-sessions', createRateLimiter('api'), (req, res) => {
  const availableSessions = courseSessions
    .filter(session => {
      const sessionDate = new Date(session.date);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      return sessionDate >= today && 
             session.status === 'scheduled' && 
             session.currentBookings < session.maxParticipants;
    })
    .sort((a, b) => new Date(a.date) - new Date(b.date));
  
  res.json(availableSessions);
});
```

### LoopBack 4 Implementation (New)
```typescript
// backend-loopback4/src/controllers/course-session.controller.ts
import {get, param, Filter} from '@loopback/rest';
import {repository} from '@loopback/repository';
import {CourseSessionRepository} from '../repositories';
import {CourseSession} from '../models';
import {authenticate} from '@loopback/authentication';

export class CourseSessionController {
  constructor(
    @repository(CourseSessionRepository)
    private courseSessionRepository: CourseSessionRepository,
  ) {}

  @get('/api/course-sessions')
  async getAvailableSessions(
    @param.filter(CourseSession) filter?: Filter<CourseSession>
  ): Promise<CourseSession[]> {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const customFilter: Filter<CourseSession> = {
      where: {
        and: [
          {date: {gte: today}},
          {status: 'scheduled'},
          // Custom where clause for available spots
        ]
      },
      order: ['date ASC'],
      include: [
        {relation: 'course'},
        {relation: 'venue'}
      ],
      ...filter
    };

    const sessions = await this.courseSessionRepository.find(customFilter);
    
    // Filter sessions with available spots
    return sessions.filter(session => 
      session.currentBookings < session.maxParticipants
    );
  }
}
```

## 3. Booking Creation with Payment Intent

### Express Implementation (Current)
```javascript
// server.js
app.post('/api/bookings/create-payment-intent', createRateLimiter('booking'), (req, res) => {
  const timestamp = Date.now();
  const amount = req.body.amount || 7500;
  const { sessionId } = req.body;
  
  if (sessionId) {
    const session = courseSessions.find(s => s.id === sessionId);
    if (session && session.currentBookings < session.maxParticipants) {
      session.currentBookings++;
      console.log(`Updated session ${sessionId} bookings`);
    }
  }
  
  res.json({
    clientSecret: `pi_demo_${timestamp}_secret_demo`,
    paymentIntentId: `pi_demo_${timestamp}`,
    amount: amount,
    currency: 'gbp',
    status: 'requires_payment_method'
  });
});
```

### LoopBack 4 Implementation (New)
```typescript
// backend-loopback4/src/controllers/booking-payment.controller.ts
import {post, requestBody, HttpErrors} from '@loopback/rest';
import {inject} from '@loopback/core';
import {repository} from '@loopback/repository';
import {BookingRepository, CourseSessionRepository} from '../repositories';
import {StripeService} from '../services';
import {RateLimitInterceptor} from '../interceptors';
import {transactional} from '@loopback/repository';

export class BookingPaymentController {
  constructor(
    @repository(BookingRepository)
    private bookingRepository: BookingRepository,
    @repository(CourseSessionRepository)
    private courseSessionRepository: CourseSessionRepository,
    @inject('services.stripe')
    private stripeService: StripeService,
  ) {}

  @post('/api/bookings/create-payment-intent')
  @intercept(RateLimitInterceptor.BINDING_KEY)
  @transactional()
  async createPaymentIntent(
    @requestBody({
      content: {
        'application/json': {
          schema: {
            type: 'object',
            required: ['sessionId'],
            properties: {
              sessionId: {type: 'string'},
              amount: {type: 'number', minimum: 100},
              customerDetails: {
                type: 'object',
                properties: {
                  name: {type: 'string'},
                  email: {type: 'string', format: 'email'},
                  phone: {type: 'string'}
                }
              }
            }
          }
        }
      }
    }) bookingData: {
      sessionId: string;
      amount?: number;
      customerDetails?: any;
    }
  ): Promise<{
    clientSecret: string;
    paymentIntentId: string;
    amount: number;
    currency: string;
    status: string;
  }> {
    // Validate session availability
    const session = await this.courseSessionRepository.findById(
      bookingData.sessionId,
      {include: [{relation: 'course'}]}
    );

    if (!session || session.status !== 'scheduled') {
      throw new HttpErrors.BadRequest('Session not available');
    }

    const availableSpots = session.maxParticipants - session.currentBookings;
    if (availableSpots <= 0) {
      throw new HttpErrors.BadRequest('Session is fully booked');
    }

    // Create payment intent with Stripe
    const amount = bookingData.amount || session.course.price * 100; // Convert to pence
    const paymentIntent = await this.stripeService.createPaymentIntent({
      amount,
      currency: 'gbp',
      metadata: {
        sessionId: bookingData.sessionId,
        customerEmail: bookingData.customerDetails?.email
      }
    });

    // Create pending booking
    const booking = await this.bookingRepository.create({
      sessionId: bookingData.sessionId,
      paymentIntentId: paymentIntent.id,
      amount: amount / 100,
      status: 'pending',
      customerDetails: bookingData.customerDetails,
      createdAt: new Date()
    });

    // Temporarily increment booking count (will be confirmed on payment)
    await this.courseSessionRepository.updateById(session.id, {
      currentBookings: session.currentBookings + 1
    });

    return {
      clientSecret: paymentIntent.client_secret!,
      paymentIntentId: paymentIntent.id,
      amount,
      currency: 'gbp',
      status: paymentIntent.status
    };
  }
}
```

## 4. Analytics Dashboard Migration

### Express Implementation (Current)
```javascript
// server.js
app.get('/api/admin/dashboard/overview', verifyAdminToken, (req, res) => {
  res.json({
    metrics: {
      revenue: {
        current: 15750,
        previous: 12300,
        change: 28.04
      },
      bookings: {
        current: 210,
        previous: 164,
        change: 28.05
      },
      // ... more metrics
    },
    revenueData: [
      { date: '2025-01-01', revenue: 2250, bookings: 30 },
      // ... more data
    ]
  });
});
```

### LoopBack 4 Implementation (New)
```typescript
// backend-loopback4/src/controllers/admin/dashboard.controller.ts
import {get, param} from '@loopback/rest';
import {inject} from '@loopback/core';
import {authenticate} from '@loopback/authentication';
import {authorize} from '@loopback/authorization';
import {AdminDashboardService} from '../../services';

interface DashboardMetrics {
  revenue: MetricData;
  bookings: MetricData;
  users: UserMetrics;
  courses: CourseMetrics;
}

interface MetricData {
  current: number;
  previous: number;
  change: number;
}

@authenticate('jwt')
@authorize({allowedRoles: ['admin']})
export class AdminDashboardController {
  constructor(
    @inject('services.adminDashboard')
    private dashboardService: AdminDashboardService,
  ) {}

  @get('/api/admin/dashboard/overview')
  async getOverview(
    @param.query.string('period') period: string = '30days'
  ): Promise<{
    metrics: DashboardMetrics;
    revenueData: Array<{date: string; revenue: number; bookings: number}>;
    bookingStatus: Array<{status: string; count: number; percentage: number}>;
    upcomingSchedules: Array<any>;
    recentActivity: Array<any>;
  }> {
    const endDate = new Date();
    const startDate = this.calculateStartDate(period);

    const [metrics, revenueData, bookingStatus, upcomingSchedules, recentActivity] = 
      await Promise.all([
        this.dashboardService.getMetrics(startDate, endDate),
        this.dashboardService.getRevenueData(startDate, endDate),
        this.dashboardService.getBookingStatusBreakdown(),
        this.dashboardService.getUpcomingSchedules(5),
        this.dashboardService.getRecentActivity(10)
      ]);

    return {
      metrics,
      revenueData,
      bookingStatus,
      upcomingSchedules,
      recentActivity
    };
  }

  private calculateStartDate(period: string): Date {
    const date = new Date();
    switch (period) {
      case '7days':
        date.setDate(date.getDate() - 7);
        break;
      case '30days':
        date.setDate(date.getDate() - 30);
        break;
      case '90days':
        date.setDate(date.getDate() - 90);
        break;
      default:
        date.setDate(date.getDate() - 30);
    }
    return date;
  }
}
```

## 5. Shared Session Management

### Shared Redis Service
```typescript
// backend-loopback4/src/services/shared/redis-session.service.ts
import {inject, Provider} from '@loopback/core';
import * as Redis from 'ioredis';

export class SharedRedisSessionService implements Provider<SessionService> {
  private redis: Redis.Redis;

  constructor(
    @inject('datasources.redis.config')
    private redisConfig: object,
  ) {
    this.redis = new Redis(this.redisConfig);
  }

  value(): SessionService {
    return {
      get: this.get.bind(this),
      set: this.set.bind(this),
      delete: this.delete.bind(this),
      exists: this.exists.bind(this),
    };
  }

  async get(key: string): Promise<any> {
    const value = await this.redis.get(key);
    return value ? JSON.parse(value) : null;
  }

  async set(key: string, value: any, ttl?: number): Promise<void> {
    const serialized = JSON.stringify(value);
    if (ttl) {
      await this.redis.setex(key, ttl, serialized);
    } else {
      await this.redis.set(key, serialized);
    }
  }

  async delete(key: string): Promise<void> {
    await this.redis.del(key);
  }

  async exists(key: string): Promise<boolean> {
    const result = await this.redis.exists(key);
    return result === 1;
  }
}

export interface SessionService {
  get(key: string): Promise<any>;
  set(key: string, value: any, ttl?: number): Promise<void>;
  delete(key: string): Promise<void>;
  exists(key: string): Promise<boolean>;
}
```

## 6. Middleware Migration

### Express Middleware (Current)
```javascript
// server.js
app.use((req, res, next) => {
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-XSS-Protection', '1; mode=block');
  // ... more headers
  next();
});
```

### LoopBack 4 Sequence (New)
```typescript
// backend-loopback4/src/sequence.ts
import {
  RestBindings,
  SequenceHandler,
  RequestContext,
  FindRoute,
  ParseParams,
  InvokeMethod,
  Send,
  Reject,
} from '@loopback/rest';
import {inject} from '@loopback/core';

export class MySequence implements SequenceHandler {
  constructor(
    @inject(RestBindings.SequenceActions.FIND_ROUTE) protected findRoute: FindRoute,
    @inject(RestBindings.SequenceActions.PARSE_PARAMS) protected parseParams: ParseParams,
    @inject(RestBindings.SequenceActions.INVOKE_METHOD) protected invoke: InvokeMethod,
    @inject(RestBindings.SequenceActions.SEND) public send: Send,
    @inject(RestBindings.SequenceActions.REJECT) public reject: Reject,
  ) {}

  async handle(context: RequestContext): Promise<void> {
    try {
      const {request, response} = context;
      
      // Set security headers
      response.setHeader('X-Frame-Options', 'DENY');
      response.setHeader('X-Content-Type-Options', 'nosniff');
      response.setHeader('X-XSS-Protection', '1; mode=block');
      response.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
      response.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
      response.setHeader('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');
      
      // CSP headers
      const cspDirectives = [
        "default-src 'self'",
        "script-src 'self' 'unsafe-inline' 'unsafe-eval'",
        "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
        "img-src 'self' data: https: blob:",
        "font-src 'self' data: https://fonts.gstatic.com",
        "connect-src 'self' http://localhost:* https://api.stripe.com https://reactfasttraining.co.uk",
        "frame-ancestors 'none'",
        "base-uri 'self'",
        "form-action 'self'"
      ];
      response.setHeader('Content-Security-Policy', cspDirectives.join('; '));

      // Continue with normal sequence
      const route = this.findRoute(request);
      const args = await this.parseParams(request, route);
      const result = await this.invoke(route, args);
      this.send(response, result);
    } catch (error) {
      this.reject(context, error);
    }
  }
}
```

## 7. Database Transaction Example

### Express (Manual Transaction)
```javascript
// Complex booking with manual transaction handling
app.post('/api/bookings/create', async (req, res) => {
  const client = await pool.connect();
  
  try {
    await client.query('BEGIN');
    
    // Insert booking
    const bookingResult = await client.query(
      'INSERT INTO bookings (session_id, user_id, amount) VALUES ($1, $2, $3) RETURNING id',
      [sessionId, userId, amount]
    );
    
    // Update session capacity
    await client.query(
      'UPDATE course_sessions SET current_bookings = current_bookings + 1 WHERE id = $1',
      [sessionId]
    );
    
    // Create payment record
    await client.query(
      'INSERT INTO payments (booking_id, amount, status) VALUES ($1, $2, $3)',
      [bookingResult.rows[0].id, amount, 'pending']
    );
    
    await client.query('COMMIT');
    res.json({ success: true, bookingId: bookingResult.rows[0].id });
  } catch (error) {
    await client.query('ROLLBACK');
    res.status(500).json({ error: error.message });
  } finally {
    client.release();
  }
});
```

### LoopBack 4 (Automatic Transaction)
```typescript
// backend-loopback4/src/controllers/booking.controller.ts
import {transactional} from '@loopback/repository';

export class BookingController {
  @post('/api/bookings/create')
  @transactional() // Automatic transaction handling
  async createBooking(
    @requestBody() bookingData: CreateBookingDto
  ): Promise<{success: boolean; bookingId: number}> {
    // All repository operations within this method are transactional
    
    // Create booking
    const booking = await this.bookingRepository.create({
      sessionId: bookingData.sessionId,
      userId: bookingData.userId,
      amount: bookingData.amount
    });
    
    // Update session capacity
    const session = await this.sessionRepository.findById(bookingData.sessionId);
    await this.sessionRepository.updateById(session.id, {
      currentBookings: session.currentBookings + 1
    });
    
    // Create payment record
    await this.paymentRepository.create({
      bookingId: booking.id,
      amount: bookingData.amount,
      status: 'pending'
    });
    
    // If any operation fails, all are rolled back automatically
    return {
      success: true,
      bookingId: booking.id
    };
  }
}
```

## 8. Testing Migration

### Express Test (Mocha/Chai)
```javascript
// test/auth.test.js
const chai = require('chai');
const chaiHttp = require('chai-http');
const app = require('../server');

chai.use(chaiHttp);
const expect = chai.expect;

describe('Auth API', () => {
  it('should login admin user', (done) => {
    chai.request(app)
      .post('/api/admin/auth/login')
      .send({
        email: 'lex@reactfasttraining.co.uk',
        password: 'LexOnly321!'
      })
      .end((err, res) => {
        expect(res).to.have.status(200);
        expect(res.body).to.have.property('accessToken');
        done();
      });
  });
});
```

### LoopBack 4 Test
```typescript
// backend-loopback4/src/__tests__/acceptance/auth.controller.acceptance.ts
import {Client, expect} from '@loopback/testlab';
import {ReactFastTrainingApiApplication} from '../..';
import {setupApplication} from './test-helper';

describe('AuthController', () => {
  let app: ReactFastTrainingApiApplication;
  let client: Client;

  before('setupApplication', async () => {
    ({app, client} = await setupApplication());
  });

  after(async () => {
    await app.stop();
  });

  it('invokes POST /api/admin/auth/login', async () => {
    const res = await client
      .post('/api/admin/auth/login')
      .send({
        email: 'lex@reactfasttraining.co.uk',
        password: 'LexOnly321!'
      })
      .expect(200);

    expect(res.body).to.have.property('accessToken');
    expect(res.body.user).to.have.property('email', 'lex@reactfasttraining.co.uk');
  });

  it('rejects invalid credentials', async () => {
    await client
      .post('/api/admin/auth/login')
      .send({
        email: 'wrong@email.com',
        password: 'wrongpassword'
      })
      .expect(401);
  });
});
```

## Summary

These examples demonstrate:

1. **Type Safety**: LoopBack 4 provides full TypeScript support
2. **Built-in Validation**: Request validation is declarative
3. **Dependency Injection**: Cleaner service organization
4. **Automatic Transactions**: Simpler transaction handling
5. **Better Testing**: Integrated testing framework
6. **Security**: Built-in authentication/authorization
7. **Documentation**: Auto-generated OpenAPI specs

The migration preserves all existing functionality while adding enterprise-grade features and improving maintainability.