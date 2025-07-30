# Google OAuth Login Integration

**Status: 0% - BLOCKED**

## Overview
Implement Google OAuth 2.0 login as an alternative authentication method, allowing users to sign in with their Google accounts.please use ultra think to plan for this and you can createfiles withinthis folder if it helps like a CSV with tasks to keep track etc 

## Setup Requirements

### 1. Google Cloud Console Setup
1. Create project at https://console.cloud.google.com
2. Enable Google+ API
3. Create OAuth 2.0 credentials
4. Add authorized redirect URIs:
   - `http://localhost:3000/api/auth/google/callback` (development)
   - `https://reactfasttraining.co.uk/api/auth/google/callback` (production)

### 2. Environment Variables
```env
# Google OAuth
GOOGLE_CLIENT_ID=your-client-id.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=your-client-secret
GOOGLE_CALLBACK_URL=https://reactfasttraining.co.uk/api/auth/google/callback
```

## Backend Implementation

### Install Dependencies
```json
{
  "passport": "^0.7.0",
  "passport-google-oauth20": "^2.0.0",
  "@types/passport": "^1.0.16",
  "@types/passport-google-oauth20": "^2.0.14"
}
```

### Passport Configuration
```typescript
// backend-loopback4/src/config/passport.config.ts
import passport from 'passport';
import { Strategy as GoogleStrategy } from 'passport-google-oauth20';
import { UserService } from '../services/user.service';

passport.use(
  new GoogleStrategy(
    {
      clientID: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
      callbackURL: process.env.GOOGLE_CALLBACK_URL!,
    },
    async (accessToken, refreshToken, profile, done) => {
      try {
        // Check if user exists with Google ID
        let user = await UserService.findByGoogleId(profile.id);
        
        if (!user) {
          // Check if email already exists
          user = await UserService.findByEmail(profile.emails![0].value);
          
          if (user) {
            // Link Google account to existing user
            await UserService.linkGoogleAccount(user.id, profile.id);
          } else {
            // Create new user
            user = await UserService.createGoogleUser({
              googleId: profile.id,
              email: profile.emails![0].value,
              name: profile.displayName,
              emailVerified: true, // Google emails are pre-verified
            });
          }
        }
        
        return done(null, user);
      } catch (error) {
        return done(error, null);
      }
    }
  )
);
```

### Auth Controller Updates
```typescript
// backend-loopback4/src/controllers/auth.controller.ts
import passport from 'passport';

export class AuthController {
  // Initiate Google OAuth
  @get('/auth/google')
  async googleAuth(@inject(RestBindings.Http.RESPONSE) res: Response) {
    return passport.authenticate('google', {
      scope: ['profile', 'email']
    })(res);
  }

  // Google OAuth callback
  @get('/auth/google/callback')
  async googleCallback(
    @inject(RestBindings.Http.REQUEST) req: Request,
    @inject(RestBindings.Http.RESPONSE) res: Response
  ) {
    return new Promise((resolve, reject) => {
      passport.authenticate('google', async (err, user) => {
        if (err || !user) {
          // Redirect to error page
          res.redirect(`${process.env.FRONTEND_URL}/login?error=google_auth_failed`);
          return resolve();
        }

        try {
          // Create session
          const session = await SessionService.createSession(user.id);
          
          // Redirect with session token
          res.redirect(`${process.env.FRONTEND_URL}/auth/callback?token=${session.token}`);
          resolve();
        } catch (error) {
          res.redirect(`${process.env.FRONTEND_URL}/login?error=session_creation_failed`);
          resolve();
        }
      })(req, res);
    });
  }
}
```

### User Service Updates
```typescript
// backend-loopback4/src/services/user.service.ts
export class UserService {
  static async findByGoogleId(googleId: string) {
    const [user] = await db
      .select()
      .from(users)
      .where(eq(users.googleId, googleId));
    
    return user;
  }

  static async createGoogleUser(data: {
    googleId: string;
    email: string;
    name: string;
    emailVerified: boolean;
  }) {
    const [user] = await db.insert(users).values({
      ...data,
      email: data.email.toLowerCase(),
      passwordHash: '', // No password for OAuth users
    }).returning();

    return user;
  }

  static async linkGoogleAccount(userId: string, googleId: string) {
    await db
      .update(users)
      .set({ 
        googleId,
        emailVerified: true, // Auto-verify when linking Google
        updatedAt: new Date()
      })
      .where(eq(users.id, userId));
  }
}
```

## Frontend Implementation

### Google Login Button
```typescript
// src/components/auth/GoogleLoginButton.tsx
import React from 'react';
import { FcGoogle } from 'react-icons/fc';

export const GoogleLoginButton: React.FC = () => {
  const handleGoogleLogin = () => {
    // Redirect to backend Google OAuth endpoint
    window.location.href = `${import.meta.env.VITE_API_URL}/auth/google`;
  };

  return (
    <button
      onClick={handleGoogleLogin}
      className="w-full flex items-center justify-center gap-3 px-4 py-3 
                 border border-gray-300 rounded-lg hover:bg-gray-50 
                 transition-colors duration-200"
    >
      <FcGoogle className="w-5 h-5" />
      <span className="font-medium">Continue with Google</span>
    </button>
  );
};
```

### OAuth Callback Handler
```typescript
// src/pages/AuthCallbackPage.tsx
import React, { useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';

export const AuthCallbackPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { login } = useAuth();

  useEffect(() => {
    const token = searchParams.get('token');
    const error = searchParams.get('error');

    if (error) {
      navigate(`/login?error=${error}`);
      return;
    }

    if (token) {
      // Store token and update auth state
      login(token);
      navigate('/dashboard');
    } else {
      navigate('/login?error=no_token');
    }
  }, [searchParams, navigate, login]);

  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="text-center">
        <h2 className="text-xl font-semibold mb-2">Completing sign in...</h2>
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 
                        border-primary-600 mx-auto"></div>
      </div>
    </div>
  );
};
```

### Updated Login Page
```typescript
// src/pages/LoginPage.tsx
import React from 'react';
import { GoogleLoginButton } from '@/components/auth/GoogleLoginButton';

export const LoginPage: React.FC = () => {
  return (
    <div className="max-w-md mx-auto mt-8">
      <h2 className="text-2xl font-bold mb-6">Sign In</h2>
      
      {/* Email/Password Form */}
      <form className="space-y-4 mb-6">
        {/* ... existing form fields ... */}
      </form>

      {/* Divider */}
      <div className="relative my-6">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t border-gray-300"></div>
        </div>
        <div className="relative flex justify-center text-sm">
          <span className="px-2 bg-white text-gray-500">Or continue with</span>
        </div>
      </div>

      {/* Google Login */}
      <GoogleLoginButton />
    </div>
  );
};
```

## Security Considerations

1. **OAuth Security**
   - Validate state parameter to prevent CSRF
   - Use HTTPS for all OAuth flows
   - Validate redirect URIs
   - Store minimal user data

2. **Account Linking**
   - Check email match before linking
   - Require password confirmation for linking
   - Send notification email when linked

3. **Session Security**
   - Create secure session after OAuth
   - Use same session management as regular login
   - Implement proper logout

## User Flow Scenarios

### 1. New User with Google
1. Click "Continue with Google"
2. Authenticate with Google
3. Auto-create account (email pre-verified)
4. Redirect to dashboard

### 2. Existing Email User
1. Click "Continue with Google"
2. Authenticate with Google
3. Link Google to existing account
4. Redirect to dashboard

### 3. Returning Google User
1. Click "Continue with Google"
2. Authenticate with Google
3. Find user by Google ID
4. Create session and redirect

## Error Handling

```typescript
// src/components/auth/LoginError.tsx
const errorMessages: Record<string, string> = {
  google_auth_failed: 'Google sign in failed. Please try again.',
  session_creation_failed: 'Could not create session. Please try again.',
  email_exists: 'Email already registered. Please sign in with password.',
  no_token: 'Authentication failed. Please try again.',
};
```

## Testing

1. Test new user registration via Google
2. Test existing user Google linking
3. Test error scenarios
4. Test logout functionality
5. Test session persistence

## Blocker Documentation
**Status: BLOCKED - Cannot proceed without Google Cloud Console access**

### What's Needed:
1. Access to Google Cloud Console (https://console.cloud.google.com)
2. Create new project or use existing
3. Enable Google+ API
4. Create OAuth 2.0 credentials
5. Configure authorized redirect URIs

### What's Ready:
- Database schema includes `google_id` field in users table
- UserService has methods for Google user creation and account linking
- Environment variables documented in `.env.example`

### Next Steps When Unblocked:
1. Install passport and passport-google-oauth20 packages
2. Configure Passport strategy with Google credentials
3. Add Google OAuth endpoints to auth controller
4. Implement frontend Google login button
5. Test the complete OAuth flow

### Alternative:
The authentication system is fully functional without Google OAuth. Users can:
- Sign up with email/password
- Verify their email address
- Log in with credentials
- Reset forgotten passwords
- Account lockout protection is active