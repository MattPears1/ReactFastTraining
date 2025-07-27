# Setup and Configuration Guide

**Last updated: 2025-07-27**

## Overview

This guide provides comprehensive instructions for setting up and configuring the React Fast Training platform, including both frontend and backend components.

## Prerequisites

### System Requirements
- Node.js 18.0.0 or higher
- PostgreSQL 14 or higher
- Git
- npm or yarn package manager

### Optional Services
- Redis (for caching - prepared but not required)
- Email service account (SendGrid or Mailgun)
- Stripe account for payment processing

## Frontend Setup

### 1. Clone Repository
```bash
git clone https://github.com/react-fast-training/platform.git
cd platform
```

### 2. Install Dependencies
```bash
npm install
```

### 3. Environment Configuration
Create a `.env` file in the root directory:

```env
# API Configuration
VITE_API_URL=http://localhost:3000
VITE_WS_URL=ws://localhost:3001

# Site Configuration
VITE_SITE_URL=http://localhost:5173
VITE_SITE_NAME="React Fast Training"

# Feature Flags
VITE_ENABLE_BOOKING=true
VITE_ENABLE_PAYMENT=true
VITE_ENABLE_WEBSOCKET=true

# Stripe Public Key
VITE_STRIPE_PUBLIC_KEY=pk_test_...

# Google OAuth (optional)
VITE_GOOGLE_CLIENT_ID=...
```

### 4. Course Configuration
All course data is centralized in `/src/constants/courses.ts`:

```typescript
export const COURSES = {
  'emergency-first-aid': {
    id: 'emergency-first-aid',
    title: 'Emergency First Aid at Work',
    duration: '1 day (6 hours)',
    price: 75,
    // ... additional properties
  },
  // ... 12 more course types
};
```

### 5. Location Configuration
Yorkshire locations are defined in the same file:

```typescript
export const LOCATIONS = {
  'leeds': { 
    id: 'leeds', 
    name: 'Leeds', 
    address: 'City Square, Leeds LS1 2HQ' 
  },
  // ... 7 more locations
};
```

### 6. Start Development Server
```bash
npm run dev
```

The application will be available at `http://localhost:5173`

## Backend Setup (LoopBack 4)

### 1. Navigate to Backend Directory
```bash
cd backend-loopback4
```

### 2. Install Dependencies
```bash
npm install
```

### 3. Database Setup
Create a PostgreSQL database:

```bash
createdb react_fast_training
```

### 4. Environment Configuration
Create a `.env` file in the backend directory:

```env
# Database
DATABASE_URL=postgresql://username:password@localhost:5432/react_fast_training

# JWT Configuration
JWT_SECRET=your-super-secret-jwt-key-minimum-32-characters
JWT_EXPIRES_IN=7d
JWT_REFRESH_EXPIRES_IN=30d

# Email Configuration
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-specific-password
EMAIL_FROM="React Fast Training <info@reactfasttraining.co.uk>"
ADMIN_EMAIL=admin@reactfasttraining.co.uk

# Stripe Configuration
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...

# WebSocket Configuration
WS_PORT=3001

# Frontend URL
FRONTEND_URL=http://localhost:5173

# Environment
NODE_ENV=development
```

### 5. Run Database Migrations
```bash
npm run migrate
```

### 6. Seed Initial Data
```bash
npm run seed
```

This will create:
- Sample course sessions
- Test user accounts
- Admin user (admin@reactfasttraining.co.uk)

### 7. Start the Server
```bash
npm run dev
```

The API will be available at `http://localhost:3000`

## Email Configuration

### SendGrid Setup
1. Create a SendGrid account
2. Verify your sender domain
3. Generate an API key
4. Update `.env` with SendGrid credentials:

```env
SMTP_HOST=smtp.sendgrid.net
SMTP_PORT=587
SMTP_USER=apikey
SMTP_PASS=your-sendgrid-api-key
```

### Email Templates
Email templates are located in `/backend-loopback4/src/templates/`:
- `booking-confirmation.html`
- `course-reminder.html`
- `payment-receipt.html`
- `welcome.html`

## Payment Configuration (Stripe)

### 1. Create Stripe Account
Visit https://stripe.com and create an account

### 2. Get API Keys
From the Stripe Dashboard:
- Copy the publishable key to `VITE_STRIPE_PUBLIC_KEY`
- Copy the secret key to `STRIPE_SECRET_KEY`

### 3. Configure Webhook
In Stripe Dashboard:
1. Go to Webhooks
2. Add endpoint: `https://your-domain.com/api/webhooks/stripe`
3. Select events:
   - `payment_intent.succeeded`
   - `payment_intent.failed`
   - `checkout.session.completed`
4. Copy webhook secret to `STRIPE_WEBHOOK_SECRET`

### 4. Test Cards
For development:
- Success: `4242 4242 4242 4242`
- Decline: `4000 0000 0000 0002`
- 3D Secure: `4000 0027 6000 3184`

## Production Deployment

### Frontend Deployment

#### Build for Production
```bash
npm run build
```

#### Environment Variables
Set production environment variables:
```env
VITE_API_URL=https://api.reactfasttraining.co.uk
VITE_WS_URL=wss://api.reactfasttraining.co.uk
VITE_SITE_URL=https://reactfasttraining.co.uk
```

### Backend Deployment (Heroku)

#### 1. Create Heroku App
```bash
heroku create react-fast-training-api
```

#### 2. Add PostgreSQL
```bash
heroku addons:create heroku-postgresql:essential-0
```

#### 3. Set Environment Variables
```bash
heroku config:set NODE_ENV=production
heroku config:set JWT_SECRET=...
# Set all other environment variables
```

#### 4. Deploy
```bash
git push heroku main
```

#### 5. Run Migrations
```bash
heroku run npm run migrate
```

## Security Configuration

### SSL/TLS
- Use Let's Encrypt for free SSL certificates
- Configure HTTPS redirect in production
- Set secure cookie flags

### CORS Configuration
Update `/backend-loopback4/src/application.ts`:

```typescript
this.configure(RestBindings.Middleware.CORS).to({
  origin: process.env.FRONTEND_URL,
  credentials: true,
  maxAge: 86400,
});
```

### Rate Limiting
Configure in `/backend-loopback4/src/middleware/rate-limit.ts`:

```typescript
export const rateLimitConfig = {
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: 'Too many requests, please try again later.',
};
```

## Monitoring Setup

### Health Check Endpoint
Available at `/api/health`:
```json
{
  "status": "ok",
  "timestamp": "2025-07-27T10:00:00Z",
  "services": {
    "database": "connected",
    "email": "operational",
    "payment": "operational"
  }
}
```

### Logging Configuration
Configure Winston in `/backend-loopback4/src/config/logger.ts`:

```typescript
export const loggerConfig = {
  level: process.env.LOG_LEVEL || 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.json()
  ),
  transports: [
    new winston.transports.File({ filename: 'error.log', level: 'error' }),
    new winston.transports.File({ filename: 'combined.log' })
  ]
};
```

## Troubleshooting

### Common Issues

#### Database Connection Failed
- Check PostgreSQL is running
- Verify DATABASE_URL format
- Check firewall settings

#### Email Not Sending
- Verify SMTP credentials
- Check spam folder
- Enable "less secure apps" for Gmail

#### WebSocket Connection Failed
- Check WS_PORT is not blocked
- Verify CORS settings
- Check proxy configuration

#### Payment Processing Issues
- Verify Stripe API keys
- Check webhook configuration
- Review Stripe logs

### Debug Mode
Enable debug logging:
```bash
DEBUG=loopback:* npm run dev
```

## Maintenance

### Database Backups
Schedule regular backups:
```bash
pg_dump react_fast_training > backup_$(date +%Y%m%d).sql
```

### Update Dependencies
```bash
# Check for updates
npm outdated

# Update dependencies
npm update

# Update major versions carefully
npm install package@latest
```

### Performance Monitoring
- Monitor API response times
- Track database query performance
- Review error logs regularly
- Check email delivery rates

## Support

For technical support:
- Check documentation in `/docs`
- Review task planning in `/task-planning`
- Contact: support@reactfasttraining.co.uk

## License

Copyright © 2025 React Fast Training. All rights reserved.