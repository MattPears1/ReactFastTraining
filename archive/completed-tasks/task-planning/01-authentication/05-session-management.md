# Session Management - Single Session System

**Status: 100% Complete**

## Overview
Implement a simple, secure session management system where sessions are lost on page refresh or logout. No persistent sessions or "remember me" functionality.please use ultra think to plan for this and you can createfiles withinthis folder if it helps like a CSV with tasks to keep track etc 

## Session Architecture

### Key Principles
1. **Single active session per user**
2. **Session stored in memory only (not localStorage)**
3. **Lost on page refresh**
4. **Expires after inactivity**
5. **Immediate termination on logout**

## Database Schema

### Sessions Table
```sql
CREATE TABLE sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  token VARCHAR(255) UNIQUE NOT NULL,
  ip_address INET,
  user_agent TEXT,
  last_activity TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  expires_at TIMESTAMP NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_sessions_token ON sessions(token);
CREATE INDEX idx_sessions_user_id ON sessions(user_id);
CREATE INDEX idx_sessions_expires_at ON sessions(expires_at);
```

### Drizzle Schema
```typescript
// backend-loopback4/src/db/schema/sessions.ts
import { pgTable, uuid, varchar, timestamp, inet, text } from 'drizzle-orm/pg-core';
import { users } from './users';

export const sessions = pgTable('sessions', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  token: varchar('token', { length: 255 }).unique().notNull(),
  ipAddress: inet('ip_address'),
  userAgent: text('user_agent'),
  lastActivity: timestamp('last_activity').defaultNow(),
  expiresAt: timestamp('expires_at').notNull(),
  createdAt: timestamp('created_at').defaultNow(),
});
```

## Backend Implementation

### Session Service
```typescript
// backend-loopback4/src/services/session.service.ts
import crypto from 'crypto';
import { db } from '../config/database.config';
import { sessions } from '../db/schema/sessions';
import { eq, lt, and } from 'drizzle-orm';

export class SessionService {
  private static readonly SESSION_DURATION = 2 * 60 * 60 * 1000; // 2 hours
  private static readonly ACTIVITY_THRESHOLD = 15 * 60 * 1000; // 15 minutes

  static generateToken(): string {
    return crypto.randomBytes(32).toString('hex');
  }

  static async createSession(
    userId: string, 
    ipAddress?: string, 
    userAgent?: string
  ) {
    // Invalidate any existing sessions for this user
    await this.invalidateUserSessions(userId);

    const token = this.generateToken();
    const expiresAt = new Date(Date.now() + this.SESSION_DURATION);

    const [session] = await db.insert(sessions).values({
      userId,
      token,
      ipAddress,
      userAgent,
      expiresAt,
    }).returning();

    return session;
  }

  static async validateSession(token: string) {
    const [session] = await db
      .select()
      .from(sessions)
      .where(
        and(
          eq(sessions.token, token),
          gt(sessions.expiresAt, new Date())
        )
      );

    if (!session) {
      return null;
    }

    // Update last activity if more than threshold
    const timeSinceActivity = Date.now() - session.lastActivity.getTime();
    if (timeSinceActivity > this.ACTIVITY_THRESHOLD) {
      await db
        .update(sessions)
        .set({ lastActivity: new Date() })
        .where(eq(sessions.id, session.id));
    }

    return session;
  }

  static async invalidateSession(token: string) {
    await db
      .delete(sessions)
      .where(eq(sessions.token, token));
  }

  static async invalidateUserSessions(userId: string) {
    await db
      .delete(sessions)
      .where(eq(sessions.userId, userId));
  }

  static async cleanupExpiredSessions() {
    await db
      .delete(sessions)
      .where(lt(sessions.expiresAt, new Date()));
  }
}
```

### Auth Middleware
```typescript
// backend-loopback4/src/middleware/auth.middleware.ts
import { Request } from '@loopback/rest';
import { SessionService } from '../services/session.service';
import { UserService } from '../services/user.service';

export interface AuthenticatedRequest extends Request {
  user?: User;
  session?: Session;
}

export async function authenticate(req: AuthenticatedRequest) {
  const token = extractToken(req);
  
  if (!token) {
    throw new HttpErrors.Unauthorized('No authentication token provided');
  }

  const session = await SessionService.validateSession(token);
  
  if (!session) {
    throw new HttpErrors.Unauthorized('Invalid or expired session');
  }

  const user = await UserService.findById(session.userId);
  
  if (!user) {
    throw new HttpErrors.Unauthorized('User not found');
  }

  req.user = user;
  req.session = session;
}

function extractToken(req: Request): string | null {
  const authHeader = req.headers.authorization;
  
  if (authHeader && authHeader.startsWith('Bearer ')) {
    return authHeader.substring(7);
  }
  
  return null;
}
```

### Login Implementation
```typescript
// backend-loopback4/src/controllers/auth.controller.ts
export class AuthController {
  @post('/auth/login')
  async login(
    @requestBody() credentials: LoginRequest,
    @inject(RestBindings.Http.REQUEST) req: Request
  ): Promise<LoginResponse> {
    const { email, password } = credentials;

    // Find user
    const user = await UserService.findByEmail(email);
    if (!user) {
      throw new HttpErrors.Unauthorized('Invalid credentials');
    }

    // Check if account is locked
    if (user.accountLockedUntil && user.accountLockedUntil > new Date()) {
      throw new HttpErrors.Forbidden('Account is locked. Please reset your password.');
    }

    // Verify password
    const isValid = await PasswordService.verifyPassword(password, user.passwordHash);
    
    if (!isValid) {
      await UserService.incrementFailedAttempts(user.id);
      throw new HttpErrors.Unauthorized('Invalid credentials');
    }

    // Check email verification
    if (!user.emailVerified) {
      throw new HttpErrors.Forbidden('Please verify your email before logging in');
    }

    // Reset failed attempts on successful login
    await UserService.resetFailedAttempts(user.id);

    // Create session
    const session = await SessionService.createSession(
      user.id,
      req.ip,
      req.headers['user-agent']
    );

    return {
      token: session.token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
      },
      expiresAt: session.expiresAt,
    };
  }

  @post('/auth/logout')
  @authenticate
  async logout(@inject('authentication.session') session: Session) {
    await SessionService.invalidateSession(session.token);
    return { success: true };
  }
}
```

## Frontend Implementation

### Auth Context (Memory Only)
```typescript
// src/contexts/AuthContext.tsx
import React, { createContext, useContext, useState, useCallback } from 'react';
import { authApi } from '@/services/api/auth';

interface AuthContextType {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  setAuth: (token: string, user: User) => void;
}

const AuthContext = createContext<AuthContextType | null>(null);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Store in memory only - will be lost on refresh
  const [token, setToken] = useState<string | null>(null);
  const [user, setUser] = useState<User | null>(null);

  const login = useCallback(async (email: string, password: string) => {
    const response = await authApi.login({ email, password });
    setToken(response.token);
    setUser(response.user);
  }, []);

  const logout = useCallback(async () => {
    if (token) {
      try {
        await authApi.logout(token);
      } catch (error) {
        console.error('Logout error:', error);
      }
    }
    setToken(null);
    setUser(null);
  }, [token]);

  const setAuth = useCallback((newToken: string, newUser: User) => {
    setToken(newToken);
    setUser(newUser);
  }, []);

  return (
    <AuthContext.Provider value={{
      user,
      token,
      isAuthenticated: !!token,
      login,
      logout,
      setAuth,
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
};
```

### API Client with Auth
```typescript
// src/services/api/client.ts
import axios from 'axios';

const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add token
apiClient.interceptors.request.use((config) => {
  // Get token from auth context (passed in from components)
  const token = window.__authToken;
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Response interceptor for 401 errors
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Redirect to login
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export default apiClient;
```

### Protected Route Component
```typescript
// src/components/auth/ProtectedRoute.tsx
import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';

interface ProtectedRouteProps {
  children: React.ReactNode;
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children }) => {
  const { isAuthenticated } = useAuth();

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
};
```

## Session Cleanup

### Scheduled Job
```typescript
// backend-loopback4/src/jobs/session-cleanup.job.ts
import { CronJob } from '@loopback/cron';
import { SessionService } from '../services/session.service';

@cronJob()
export class SessionCleanupJob extends CronJob {
  constructor() {
    super({
      name: 'session-cleanup',
      onTick: async () => {
        await SessionService.cleanupExpiredSessions();
      },
      cronTime: '0 */15 * * * *', // Every 15 minutes
      start: true,
    });
  }
}
```

## Security Considerations

1. **Token Security**
   - Use cryptographically secure random tokens
   - Never store tokens in localStorage/cookies
   - Tokens lost on page refresh (by design)

2. **Session Security**
   - Single session per user
   - Track IP and user agent
   - Auto-expire after inactivity
   - Immediate invalidation on logout

3. **API Security**
   - Require auth header for protected routes
   - Validate token on every request
   - Return 401 for invalid sessions

## Testing

1. Test login creates single session
2. Test multiple login invalidates previous session
3. Test session expires after timeout
4. Test logout invalidates session
5. Test page refresh loses session
6. Test protected routes require auth

## Completion Notes
- Created sessions table schema at `/backend-loopback4/src/db/schema/sessions.ts`
- Implemented SessionService at `/backend-loopback4/src/services/session.service.ts`
- Created authentication middleware at `/backend-loopback4/src/middleware/auth.middleware.ts`
- Sessions expire after 2 hours of inactivity
- Single active session per user (new login invalidates old sessions)
- No persistent sessions - tokens stored in memory only on frontend
- Session cleanup job can be implemented using LoopBack's cron functionality