# React Fast Training API - Heroku Deployment Guide

## Prerequisites

1. Install Heroku CLI: https://devcenter.heroku.com/articles/heroku-cli
2. Create a Heroku account: https://signup.heroku.com/
3. Have Git installed and repository initialized

## Step 1: Create Heroku App

```bash
# Login to Heroku
heroku login

# Create a new Heroku app
heroku create react-fast-training-api

# Or if you want a specific region (Europe)
heroku create react-fast-training-api --region eu
```

## Step 2: Add PostgreSQL Database

```bash
# Add PostgreSQL addon (Essential-0 tier for production)
heroku addons:create heroku-postgresql:essential-0
```

## Step 3: Configure Environment Variables

```bash
# Set required environment variables
heroku config:set NODE_ENV=production
heroku config:set JWT_SECRET=$(openssl rand -base64 32)
heroku config:set JWT_REFRESH_SECRET=$(openssl rand -base64 32)
heroku config:set FRONTEND_URL=https://reactfasttraining.co.uk

# Optional: Email configuration (if using email service)
heroku config:set EMAIL_HOST=smtp.sendgrid.net
heroku config:set EMAIL_PORT=587
heroku config:set EMAIL_USER=apikey
heroku config:set EMAIL_PASS=your-sendgrid-api-key

# Optional: Stripe configuration (for payments)
heroku config:set STRIPE_SECRET_KEY=your-stripe-secret-key
heroku config:set STRIPE_PUBLISHABLE_KEY=your-stripe-publishable-key
```

## Step 4: Deploy the Application

```bash
# Add Heroku remote if not already added
heroku git:remote -a react-fast-training-api

# Deploy to Heroku
git push heroku main

# Or if you're on a different branch
git push heroku your-branch:main
```

## Step 5: Verify Deployment

```bash
# Check application logs
heroku logs --tail

# Open the application
heroku open

# Check database setup
heroku run npm run knex migrate:status
```

## Database Management Commands

```bash
# Run migrations manually (if needed)
heroku run npm run migrate:latest

# Rollback migrations
heroku run npm run migrate:rollback

# Re-seed admin user (if needed)
heroku run npm run seed:run

# Access PostgreSQL console
heroku pg:psql
```

## Monitoring and Maintenance

### View Logs
```bash
# Real-time logs
heroku logs --tail

# Filter by process type
heroku logs --tail --ps web

# Save logs to file
heroku logs -n 1500 > logs.txt
```

### Scale Application
```bash
# Check current dynos
heroku ps

# Scale to 2 web dynos
heroku ps:scale web=2

# Scale to professional dynos
heroku ps:scale web=1:standard-1x
```

### Database Backups
```bash
# Create manual backup
heroku pg:backups:capture

# Schedule automatic backups
heroku pg:backups:schedule --at '02:00 Europe/London'

# List backups
heroku pg:backups

# Download backup
heroku pg:backups:download
```

## Troubleshooting

### Common Issues

1. **Database Connection Errors**
   - Check DATABASE_URL is set: `heroku config:get DATABASE_URL`
   - Ensure SSL is configured in knexfile.ts for production

2. **Build Failures**
   - Check Node.js version in package.json engines
   - Review build logs: `heroku logs --tail --ps build`

3. **Application Crashes**
   - Check logs: `heroku logs --tail`
   - Verify all environment variables are set: `heroku config`
   - Ensure Procfile is correct

### Reset Database (CAUTION: Destroys all data)
```bash
# Reset database completely
heroku pg:reset DATABASE --confirm react-fast-training-api

# Re-run setup
heroku run npm run setup:database
```

## SSL Certificate

For production, ensure your custom domain has SSL:

```bash
# Add custom domain
heroku domains:add api.reactfasttraining.co.uk

# Enable automatic certificate management
heroku certs:auto:enable
```

## Production Checklist

- [ ] All environment variables configured
- [ ] Database migrations successful
- [ ] Admin user created (lex@reactfasttraining.co.uk)
- [ ] API endpoints accessible
- [ ] CORS configured for frontend URL
- [ ] SSL certificate active
- [ ] Monitoring alerts configured
- [ ] Backup schedule created
- [ ] Error tracking enabled (optional: Sentry, Rollbar)

## Support

For Heroku-specific issues:
- Heroku Status: https://status.heroku.com/
- Heroku Support: https://help.heroku.com/

For application issues:
- Check logs first: `heroku logs --tail`
- Review this deployment guide
- Contact development team

---

**Note**: Keep your Heroku API key and database credentials secure. Never commit them to version control.