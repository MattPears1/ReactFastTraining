# Quick Deployment Guide - React Fast Training

## Heroku Deployment Steps

1. **Initialize Git** (if not already done)
```bash
git init
git add .
git commit -m "Initial commit for React Fast Training"
```

2. **Create Heroku App**
```bash
heroku create react-fast-training
```

3. **Set Environment Variables**
```bash
heroku config:set EMAIL_HOST=smtp.gmail.com
heroku config:set EMAIL_USER=your-email@gmail.com
heroku config:set EMAIL_PASS=your-app-password
heroku config:set EMAIL_FROM=noreply@reactfasttraining.co.uk
```

4. **Deploy to Heroku**
```bash
git push heroku main
```

5. **Open the App**
```bash
heroku open
```

## Email Configuration

To use Gmail for sending emails:
1. Enable 2-factor authentication on your Gmail account
2. Generate an app-specific password
3. Use the app password in EMAIL_PASS

## What's Working

- ✅ Frontend pages (Home, About, Courses, Contact, etc.)
- ✅ Contact form with email functionality
- ✅ Responsive design
- ✅ Basic backend API

## What's Disabled

- ❌ Booking system (disabled for now)
- ❌ Admin panel (disabled for now)
- ❌ Payment processing (disabled for now)

## Troubleshooting

If build fails:
```bash
heroku logs --tail
```

If you need to restart:
```bash
heroku restart
```

## Domain Setup

After deployment, add your custom domain:
```bash
heroku domains:add reactfasttraining.co.uk
heroku domains:add www.reactfasttraining.co.uk
```

Then update your DNS settings with the provided DNS targets.