# Heroku Deployment Guide

## Table of Contents
- [Prerequisites](#prerequisites)
- [Initial Setup](#initial-setup)
- [Environment Configuration](#environment-configuration)
- [Database Setup](#database-setup)
- [Deployment Process](#deployment-process)
- [Zero-Downtime Deployment](#zero-downtime-deployment)
- [Monitoring & Health Checks](#monitoring--health-checks)
- [Rollback Procedures](#rollback-procedures)
- [Troubleshooting](#troubleshooting)
- [Performance Optimization](#performance-optimization)

## Prerequisites

### Required Tools
- Heroku CLI: `brew install heroku/brew/heroku` (macOS) or download from [heroku.com](https://devcenter.heroku.com/articles/heroku-cli)
- Git: `git --version` to verify installation
- Node.js 18+: `node --version` to verify
- PostgreSQL client (optional): For database management

### Heroku Account Setup
1. Create account at [heroku.com](https://www.heroku.com)
2. Login via CLI: `heroku login`
3. Add SSH keys: `heroku keys:add`

## Initial Setup

### 1. Create Heroku Applications
```bash
# Create staging app
heroku create lex-business-staging --region us

# Create production app
heroku create lex-business-production --region us

# Add git remotes
git remote add heroku-staging https://git.heroku.com/lex-business-staging.git
git remote add heroku-production https://git.heroku.com/lex-business-production.git
```

### 2. Add Required Add-ons
```bash
# For each app (staging and production)
heroku addons:create heroku-postgresql:mini --app lex-business-production
heroku addons:create heroku-redis:mini --app lex-business-production
heroku addons:create papertrail:choklad --app lex-business-production
heroku addons:create newrelic:wayne --app lex-business-production
heroku addons:create scheduler:standard --app lex-business-production
```

### 3. Configure Buildpacks
```bash
heroku buildpacks:set heroku/nodejs --app lex-business-production
```

## Environment Configuration

### Essential Environment Variables
```bash
# Set environment variables for production
heroku config:set NODE_ENV=production --app lex-business-production
heroku config:set JWT_SECRET=$(openssl rand -base64 32) --app lex-business-production
heroku config:set CORS_ORIGIN=https://lex-business-production.herokuapp.com --app lex-business-production
```

### Complete Configuration
Copy from `.env.example` and set all required variables:
```bash
# Database (automatically set by Heroku PostgreSQL addon)
# DATABASE_URL=postgres://...

# Redis (automatically set by Heroku Redis addon)
# REDIS_URL=redis://...

# Application
heroku config:set JWT_SECRET=your-secret-key --app lex-business-production
heroku config:set JWT_EXPIRES_IN=7d --app lex-business-production
heroku config:set JWT_REFRESH_EXPIRES_IN=30d --app lex-business-production

# Email (Choose one provider)
heroku config:set SENDGRID_API_KEY=your-sendgrid-key --app lex-business-production
heroku config:set EMAIL_FROM=noreply@lexbusiness.com --app lex-business-production

# File Storage (Choose one provider)
heroku config:set AWS_ACCESS_KEY_ID=your-key --app lex-business-production
heroku config:set AWS_SECRET_ACCESS_KEY=your-secret --app lex-business-production
heroku config:set AWS_S3_BUCKET=your-bucket --app lex-business-production

# Payment Processing
heroku config:set STRIPE_SECRET_KEY=sk_live_xxx --app lex-business-production
heroku config:set STRIPE_WEBHOOK_SECRET=whsec_xxx --app lex-business-production

# Error Tracking
heroku config:set SENTRY_DSN=https://xxx@sentry.io/xxx --app lex-business-production

# Analytics
heroku config:set GOOGLE_ANALYTICS_ID=G-XXXXXXXXXX --app lex-business-production
```

### View Configuration
```bash
heroku config --app lex-business-production
```

## Database Setup

### Initial Migration
```bash
# Run migrations on deployment
heroku run npm run migrate:prod --app lex-business-production

# Seed initial data (optional)
heroku run npm run seed:prod --app lex-business-production
```

### Database Backups
```bash
# Manual backup
heroku pg:backups:capture --app lex-business-production

# Schedule automatic backups
heroku pg:backups:schedule DATABASE_URL --at '03:00 America/New_York' --app lex-business-production

# List backups
heroku pg:backups --app lex-business-production

# Download backup
heroku pg:backups:download --app lex-business-production
```

## Deployment Process

### Manual Deployment
```bash
# Deploy to staging
git push heroku-staging main:main

# Deploy to production
git push heroku-production main:main
```

### Automated Deployment Script
```bash
# Make deployment script executable
chmod +x scripts/deploy.sh

# Deploy to staging
./scripts/deploy.sh staging

# Deploy to production (includes staging test)
./scripts/deploy.sh production
```

## Zero-Downtime Deployment

### Using Heroku Preboot
```bash
# Enable preboot for zero-downtime deployments
heroku features:enable preboot --app lex-business-production
```

### Deployment Steps
1. **Enable Maintenance Mode**
   ```bash
   heroku maintenance:on --app lex-business-production
   ```

2. **Create Database Backup**
   ```bash
   heroku pg:backups:capture --app lex-business-production
   ```

3. **Deploy New Code**
   ```bash
   git push heroku-production main:main
   ```

4. **Run Migrations**
   ```bash
   heroku run npm run migrate:prod --app lex-business-production
   ```

5. **Disable Maintenance Mode**
   ```bash
   heroku maintenance:off --app lex-business-production
   ```

## Monitoring & Health Checks

### Health Check Endpoints
- `/health` - Basic health check
- `/health/detailed` - Detailed system status
- `/health/ready` - Readiness probe
- `/health/live` - Liveness probe
- `/api/health` - API health check

### Monitoring Commands
```bash
# View logs
heroku logs --tail --app lex-business-production

# View metrics
heroku metrics --app lex-business-production

# Check dyno status
heroku ps --app lex-business-production

# View recent releases
heroku releases --app lex-business-production
```

### Setting Up Alerts
```bash
# Configure log alerts in Papertrail
heroku addons:open papertrail --app lex-business-production

# Configure performance monitoring in New Relic
heroku addons:open newrelic --app lex-business-production
```

## Rollback Procedures

### Quick Rollback
```bash
# Rollback to previous release
heroku rollback --app lex-business-production

# Rollback to specific version
heroku rollback v102 --app lex-business-production
```

### Database Rollback
```bash
# Undo last migration
heroku run npm run migrate:undo --app lex-business-production

# Restore from backup
heroku pg:backups:restore b001 DATABASE_URL --app lex-business-production
```

### Complete Rollback Script
```bash
./scripts/deploy.sh rollback
```

## Troubleshooting

### Common Issues

#### 1. Build Failures
```bash
# Clear build cache
heroku builds:cache:purge --app lex-business-production

# Check build logs
heroku logs --source app --tail --app lex-business-production
```

#### 2. Database Connection Issues
```bash
# Check database credentials
heroku pg:credentials:url --app lex-business-production

# Reset database credentials
heroku pg:credentials:rotate --app lex-business-production
```

#### 3. Memory Issues
```bash
# Check memory usage
heroku metrics --app lex-business-production

# Scale dynos
heroku ps:scale web=2:standard-2x --app lex-business-production
```

#### 4. Application Crashes
```bash
# Check crash logs
heroku logs --tail --ps web --app lex-business-production

# Restart all dynos
heroku restart --app lex-business-production
```

### Debug Mode
```bash
# Enable debug logging
heroku config:set LOG_LEVEL=debug --app lex-business-production

# SSH into dyno
heroku run bash --app lex-business-production
```

## Performance Optimization

### Dyno Configuration
```bash
# Scale web dynos
heroku ps:scale web=2:standard-2x --app lex-business-production

# Scale worker dynos
heroku ps:scale worker=1:standard-1x --app lex-business-production

# Enable autoscaling
heroku autoscale:enable --app lex-business-production
```

### Caching Configuration
```bash
# Configure Redis connection pooling
heroku config:set REDIS_MAX_CLIENTS=20 --app lex-business-production
```

### Database Optimization
```bash
# Analyze slow queries
heroku pg:diagnose --app lex-business-production

# Create database indexes
heroku run npm run db:optimize --app lex-business-production
```

## Scheduled Jobs

### Configure Heroku Scheduler
```bash
heroku addons:open scheduler --app lex-business-production
```

### Example Jobs
- Daily backup: `npm run backup:daily` at 3:00 UTC
- Clean old sessions: `npm run clean:sessions` every 10 minutes
- Send email digest: `npm run email:digest` at 9:00 UTC

## Security Considerations

### SSL/TLS
- Heroku provides SSL certificates automatically
- Force HTTPS in application code

### Environment Variables
- Never commit secrets to git
- Use `heroku config:set` for sensitive data
- Rotate credentials regularly

### Database Security
```bash
# Rotate database credentials
heroku pg:credentials:rotate --app lex-business-production

# Enable encryption at rest
# (Enabled by default on Heroku PostgreSQL)
```

## Continuous Integration

### GitHub Integration
```bash
# Connect to GitHub
heroku git:remote --app lex-business-production

# Enable automatic deploys from GitHub
# Configure in Heroku Dashboard > Deploy > GitHub
```

### Pipeline Setup
```bash
# Create pipeline
heroku pipelines:create lex-business

# Add apps to pipeline
heroku pipelines:add lex-business --app lex-business-staging --stage staging
heroku pipelines:add lex-business --app lex-business-production --stage production

# Promote from staging to production
heroku pipelines:promote --app lex-business-staging
```

## Cost Management

### Monitor Usage
```bash
# Check current usage
heroku ps --app lex-business-production

# View billing
heroku billing --app lex-business-production
```

### Optimization Tips
- Use Standard-1X dynos for consistent performance
- Enable dyno sleeping for staging environment
- Use Heroku Scheduler instead of worker dynos for periodic tasks
- Monitor and optimize database queries

## Maintenance Mode

### Custom Maintenance Page
Create `public/maintenance.html` for custom maintenance page.

### Enable/Disable
```bash
# Enable maintenance mode
heroku maintenance:on --app lex-business-production

# Disable maintenance mode
heroku maintenance:off --app lex-business-production

# Check status
heroku maintenance --app lex-business-production
```

## Support

### Heroku Support
- Documentation: https://devcenter.heroku.com
- Status: https://status.heroku.com
- Support: https://help.heroku.com

### Application Logs
```bash
# Download logs
heroku logs -n 10000 --app lex-business-production > logs.txt

# Search logs
heroku logs --tail --app lex-business-production | grep ERROR
```

### Contact
For application-specific support, contact the development team.