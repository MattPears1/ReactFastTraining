# React Fast Training - Admin Portal Setup

## Overview

The administration dashboard for React Fast Training is now fully integrated into the application. This document provides instructions for accessing and using the admin portal.

## Accessing the Admin Portal

1. **Via Footer**: Click the 🔒 lock icon in the footer of any page
2. **Direct URL**: Navigate to `/admin` on your site

## Admin Credentials

- **Email**: lex@reactfasttraining.co.uk
- **Password**: LexOnly321!

⚠️ **IMPORTANT**: Change this password immediately after first login!

## Features Implemented

### ✅ Completed Features

1. **Authentication System**
   - JWT-based authentication with refresh tokens
   - Rate limiting (5 attempts per 15 minutes)
   - Password reset functionality via email
   - Secure password requirements

2. **Database Setup**
   - All required tables created via migrations
   - Admin user seeded automatically
   - Activity logging for audit trail

3. **Admin Dashboard Foundation**
   - Login page with security features
   - Admin layout with navigation
   - Dashboard page ready for analytics
   - Responsive design for all devices

4. **Security Features**
   - Bcrypt password hashing (12 rounds)
   - CSRF protection ready
   - HTTP-only cookies for refresh tokens
   - Activity logging for all admin actions

### 🚧 Ready for Development

The following features have placeholder pages ready for implementation:

1. **Dashboard Analytics**
   - Revenue tracking
   - Booking statistics
   - User metrics
   - Page visit analytics

2. **Course Management**
   - Create/Edit/Delete courses
   - Pricing and discount management
   - Course scheduling

3. **Booking Management**
   - View all bookings
   - Past/Current/Future views
   - Manual booking creation
   - Attendee management

4. **User Management**
   - View all users
   - Role management
   - Activity tracking

## Deployment Instructions

### For Heroku Production

The application is configured for Heroku deployment:

1. **Database Setup** (Automatic)
   - Migrations run automatically on deploy
   - Admin user created automatically

2. **Environment Variables Required**
   ```
   DATABASE_URL=<your-postgres-url>
   JWT_SECRET=<strong-random-string>
   JWT_REFRESH_SECRET=<different-random-string>
   FRONTEND_URL=https://your-app.herokuapp.com
   NODE_ENV=production
   ```

3. **Manual Database Setup** (if needed)
   ```bash
   heroku run npm run setup:database
   ```

## Password Reset Process

If you forget the admin password:

1. Click "Forgot Password" on the login page
2. Enter the admin email: lex@reactfasttraining.co.uk
3. Check email for reset link
4. Reset link expires in 1 hour

## Local Development

To run the admin portal locally:

```bash
# Backend (runs on port 3000)
cd backend-loopback4
npm install
npm run setup:database  # First time only
npm run dev

# Frontend (runs on port 3003)
cd ..
npm install
npm run dev
```

## Security Recommendations

1. **Change Default Password**: Immediately change the default admin password
2. **Use Strong Passwords**: Minimum 8 characters with uppercase, lowercase, numbers, and special characters
3. **Regular Backups**: Backup your database regularly
4. **Monitor Activity**: Check activity logs regularly for suspicious behavior
5. **Keep Updated**: Regularly update dependencies for security patches

## Support

For issues or questions about the admin portal, please contact the development team.

---

**Note**: This admin portal is for authorized administrators only. Unauthorized access attempts are logged and monitored.