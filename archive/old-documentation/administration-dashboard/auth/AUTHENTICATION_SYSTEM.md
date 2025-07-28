# Authentication System Design

## Overview

Secure authentication system for React Fast Training admin portal using JWT tokens, bcrypt password hashing, and comprehensive security measures.

## Architecture

### Technology Stack
- **Frontend**: React with Axios interceptors
- **Backend**: LoopBack 4 with JWT authentication
- **Password Hashing**: Bcrypt with salt rounds
- **Token Management**: JWT with refresh tokens
- **Session Storage**: HTTP-only cookies + localStorage for UI state

## Authentication Flow

### 1. Login Process
```
User → Login Form → API Validation → JWT Generation → Secure Storage → Dashboard
```

### 2. Token Management
- **Access Token**: 15-minute expiry, stored in memory
- **Refresh Token**: 7-day expiry, HTTP-only cookie
- **Auto-refresh**: Silent refresh before expiry

### 3. Logout Process
- Clear tokens from client storage
- Invalidate refresh token on server
- Redirect to login page

## Security Features

### 1. Password Requirements
- Minimum 8 characters
- At least 1 uppercase letter
- At least 1 lowercase letter
- At least 1 number
- At least 1 special character

### 2. Login Security
- Rate limiting: 5 attempts per 15 minutes
- Account lockout after 10 failed attempts
- CAPTCHA after 3 failed attempts
- IP-based monitoring

### 3. Session Security
- CSRF tokens for all state-changing operations
- Secure, HTTP-only cookies
- SameSite cookie attribute
- Session timeout after 30 minutes inactivity

## API Endpoints

### Authentication Endpoints
```typescript
POST   /api/admin/auth/login
POST   /api/admin/auth/logout
POST   /api/admin/auth/refresh
GET    /api/admin/auth/me
POST   /api/admin/auth/forgot-password
POST   /api/admin/auth/reset-password
POST   /api/admin/auth/change-password
```

### Endpoint Details

#### 1. Login
```typescript
// POST /api/admin/auth/login
interface LoginRequest {
  email: string;
  password: string;
  captcha?: string; // Required after 3 failed attempts
}

interface LoginResponse {
  accessToken: string;
  refreshToken: string; // Set as HTTP-only cookie
  user: {
    id: number;
    email: string;
    name: string;
    role: string;
  };
  expiresIn: number;
}
```

#### 2. Refresh Token
```typescript
// POST /api/admin/auth/refresh
// No body required - uses HTTP-only cookie

interface RefreshResponse {
  accessToken: string;
  expiresIn: number;
}
```

#### 3. Current User
```typescript
// GET /api/admin/auth/me
// Requires valid access token

interface CurrentUserResponse {
  id: number;
  email: string;
  name: string;
  role: string;
  lastLogin: string;
  permissions: string[];
}
```

## Frontend Implementation

### 1. Auth Context Provider
```typescript
interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  refreshToken: () => Promise<void>;
}
```

### 2. Protected Routes
```typescript
// Route protection component
const ProtectedRoute: React.FC<{ children: ReactNode }> = ({ children }) => {
  const { isAuthenticated, isLoading } = useAuth();
  
  if (isLoading) return <LoadingSpinner />;
  if (!isAuthenticated) return <Navigate to="/admin/login" />;
  
  return <>{children}</>;
};
```

### 3. Axios Interceptors
```typescript
// Request interceptor - add auth token
axios.interceptors.request.use(
  config => {
    const token = getAccessToken();
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  }
);

// Response interceptor - handle 401
axios.interceptors.response.use(
  response => response,
  async error => {
    if (error.response?.status === 401) {
      // Try refresh token
      const refreshed = await refreshAccessToken();
      if (refreshed) {
        return axios.request(error.config);
      }
      // Redirect to login
      window.location.href = '/admin/login';
    }
    return Promise.reject(error);
  }
);
```

## Backend Implementation

### 1. JWT Service
```typescript
// src/services/jwt.service.ts
export class JWTService {
  generateAccessToken(user: User): string {
    return jwt.sign(
      {
        id: user.id,
        email: user.email,
        role: user.role
      },
      process.env.JWT_SECRET,
      { expiresIn: '15m' }
    );
  }
  
  generateRefreshToken(user: User): string {
    return jwt.sign(
      { id: user.id, type: 'refresh' },
      process.env.JWT_REFRESH_SECRET,
      { expiresIn: '7d' }
    );
  }
  
  verifyToken(token: string, secret: string): any {
    return jwt.verify(token, secret);
  }
}
```

### 2. Authentication Controller
```typescript
// src/controllers/auth.controller.ts
export class AuthController {
  async login(
    @requestBody() credentials: LoginRequest
  ): Promise<LoginResponse> {
    // Validate rate limiting
    await this.checkRateLimit(credentials.email);
    
    // Find user
    const user = await this.userRepository.findOne({
      where: { email: credentials.email }
    });
    
    if (!user) {
      await this.recordFailedAttempt(credentials.email);
      throw new UnauthorizedError('Invalid credentials');
    }
    
    // Verify password
    const validPassword = await bcrypt.compare(
      credentials.password,
      user.passwordHash
    );
    
    if (!validPassword) {
      await this.recordFailedAttempt(credentials.email);
      throw new UnauthorizedError('Invalid credentials');
    }
    
    // Check if account is locked
    if (user.isLocked) {
      throw new ForbiddenError('Account is locked');
    }
    
    // Generate tokens
    const accessToken = this.jwtService.generateAccessToken(user);
    const refreshToken = this.jwtService.generateRefreshToken(user);
    
    // Update last login
    await this.userRepository.updateById(user.id, {
      lastLogin: new Date()
    });
    
    // Clear failed attempts
    await this.clearFailedAttempts(credentials.email);
    
    // Log activity
    await this.logActivity(user.id, 'login');
    
    return {
      accessToken,
      refreshToken,
      user: {
        id: user.id,
        email: user.email,
        name: `${user.firstName} ${user.lastName}`,
        role: user.role
      },
      expiresIn: 900 // 15 minutes
    };
  }
}
```

### 3. Authentication Middleware
```typescript
// src/middleware/auth.middleware.ts
export class AuthMiddleware {
  async authenticate(
    request: Request,
    response: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const token = this.extractToken(request);
      
      if (!token) {
        throw new UnauthorizedError('No token provided');
      }
      
      const decoded = this.jwtService.verifyToken(
        token,
        process.env.JWT_SECRET
      );
      
      // Check if user still exists and is active
      const user = await this.userRepository.findById(decoded.id);
      
      if (!user || !user.isActive) {
        throw new UnauthorizedError('Invalid token');
      }
      
      // Attach user to request
      request.user = user;
      next();
    } catch (error) {
      next(new UnauthorizedError('Authentication failed'));
    }
  }
  
  private extractToken(request: Request): string | null {
    const authHeader = request.headers.authorization;
    
    if (authHeader && authHeader.startsWith('Bearer ')) {
      return authHeader.substring(7);
    }
    
    return null;
  }
}
```

## Security Measures

### 1. Rate Limiting
```typescript
// Rate limiter configuration
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // 5 requests
  message: 'Too many login attempts',
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res) => {
    // Log suspicious activity
    logSuspiciousActivity(req);
    res.status(429).json({
      error: 'Too many login attempts. Please try again later.'
    });
  }
});
```

### 2. Failed Login Tracking
```typescript
interface FailedLoginAttempt {
  email: string;
  ipAddress: string;
  attempts: number;
  lastAttempt: Date;
  isLocked: boolean;
}

// Track in Redis or database
async function recordFailedAttempt(email: string, ip: string): Promise<void> {
  const key = `failed_login:${email}`;
  const attempts = await redis.incr(key);
  await redis.expire(key, 900); // 15 minutes
  
  if (attempts >= 10) {
    await lockAccount(email);
  }
  
  // Log for security monitoring
  await logSecurityEvent({
    type: 'failed_login',
    email,
    ip,
    attempts,
    timestamp: new Date()
  });
}
```

### 3. CSRF Protection
```typescript
// CSRF token generation
function generateCSRFToken(): string {
  return crypto.randomBytes(32).toString('hex');
}

// Middleware
app.use(csrf({
  cookie: {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict'
  }
}));
```

## Password Management

### 1. Password Reset Flow
```
Request Reset → Email Validation → Send Reset Link → Verify Token → Update Password
```

### 2. Password Reset Implementation
```typescript
// Generate reset token
async function generatePasswordResetToken(user: User): Promise<string> {
  const token = crypto.randomBytes(32).toString('hex');
  const hashedToken = await bcrypt.hash(token, 10);
  
  await this.passwordResetRepository.create({
    userId: user.id,
    token: hashedToken,
    expiresAt: new Date(Date.now() + 3600000) // 1 hour
  });
  
  return token;
}

// Verify and reset
async function resetPassword(
  token: string,
  newPassword: string
): Promise<void> {
  const resetRecord = await this.passwordResetRepository.findOne({
    where: {
      expiresAt: { gt: new Date() }
    }
  });
  
  if (!resetRecord) {
    throw new BadRequestError('Invalid or expired token');
  }
  
  // Verify token
  const validToken = await bcrypt.compare(token, resetRecord.token);
  
  if (!validToken) {
    throw new BadRequestError('Invalid token');
  }
  
  // Update password
  const hashedPassword = await bcrypt.hash(newPassword, 12);
  await this.userRepository.updateById(resetRecord.userId, {
    passwordHash: hashedPassword
  });
  
  // Delete reset token
  await this.passwordResetRepository.deleteById(resetRecord.id);
  
  // Log activity
  await this.logActivity(resetRecord.userId, 'password_reset');
}
```

## Activity Logging

### 1. Login Activity
```typescript
interface LoginActivity {
  userId: number;
  action: 'login' | 'logout' | 'failed_login';
  ipAddress: string;
  userAgent: string;
  timestamp: Date;
  success: boolean;
}
```

### 2. Audit Trail
- All authentication events logged
- IP address tracking
- User agent recording
- Timestamp for all actions
- Success/failure status

## Error Handling

### 1. Error Responses
```typescript
// Consistent error format
interface AuthError {
  error: string;
  message: string;
  statusCode: number;
  timestamp: string;
  path: string;
}
```

### 2. Error Types
- `401 Unauthorized`: Invalid credentials or token
- `403 Forbidden`: Account locked or insufficient permissions
- `429 Too Many Requests`: Rate limit exceeded
- `400 Bad Request`: Invalid input or expired token

## Testing Strategy

### 1. Unit Tests
- Password hashing and comparison
- JWT generation and verification
- Rate limiting logic
- CSRF token validation

### 2. Integration Tests
- Complete login flow
- Token refresh process
- Password reset flow
- Session management

### 3. Security Tests
- Brute force protection
- Token expiry handling
- CSRF attack prevention
- SQL injection prevention

## Deployment Considerations

### 1. Environment Variables
```env
JWT_SECRET=long-random-string
JWT_REFRESH_SECRET=different-long-random-string
BCRYPT_ROUNDS=12
SESSION_TIMEOUT=1800000
PASSWORD_RESET_TIMEOUT=3600000
MAX_LOGIN_ATTEMPTS=10
RATE_LIMIT_WINDOW=900000
RATE_LIMIT_MAX=5
```

### 2. Production Security
- Use HTTPS only
- Secure cookie settings
- Strong JWT secrets
- Regular secret rotation
- Monitor suspicious activity
- Regular security audits