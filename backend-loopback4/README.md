# React Fast Training API

Backend API for React Fast Training - First Aid Training Company in Yorkshire

## Features

- Course management (EFAW, FAW, Requalification, Paediatric)
- Session scheduling with trainer and location availability
- Online booking system with group discounts
- Certificate generation and management
- Email notifications
- UK-specific compliance (Ofqual, HSE, QCF)

## Tech Stack

- LoopBack 4 Framework
- PostgreSQL Database
- JWT Authentication
- Nodemailer for emails
- TypeScript

## Setup

1. Install dependencies:
```bash
npm install
```

2. Set up environment variables:
```bash
cp .env.example .env
# Edit .env with your configuration
```

3. Set up PostgreSQL database:
```bash
# Create database
createdb react_fast_training

# Run migrations
npm run migrate
```

4. Start the application:
```bash
npm start
```

## Heroku Deployment

1. Create Heroku app:
```bash
heroku create react-fast-training-api
```

2. Add PostgreSQL (Eco plan - free):
```bash
heroku addons:create heroku-postgresql:essential-0
```

3. Set environment variables:
```bash
heroku config:set JWT_SECRET=your-secure-secret-key
heroku config:set JWT_EXPIRES_IN=7d
heroku config:set SMTP_HOST=smtp.gmail.com
heroku config:set SMTP_PORT=587
heroku config:set SMTP_USER=your-email@gmail.com
heroku config:set SMTP_PASS=your-app-password
heroku config:set EMAIL_FROM="React Fast Training <info@reactfasttraining.co.uk>"
heroku config:set ADMIN_EMAIL=admin@reactfasttraining.co.uk
heroku config:set FRONTEND_URL=https://your-frontend-url.com
```

4. Deploy:
```bash
git add .
git commit -m "Initial React Fast Training API"
git push heroku main
```

5. Run migrations:
```bash
heroku run npm run migrate
```

## API Endpoints

### Public Endpoints

- `GET /ping` - Health check
- `GET /courses` - List all active courses
- `GET /courses/{id}` - Get course details
- `GET /course-sessions/upcoming` - List upcoming sessions
- `GET /course-sessions/available` - List sessions with availability
- `POST /bookings` - Create new booking
- `GET /bookings/reference/{reference}` - Look up booking by reference
- `POST /enquiries/onsite-training` - Submit onsite training enquiry
- `POST /enquiries/general` - Submit general enquiry

### Protected Endpoints (Admin/Trainer)

- `POST /courses` - Create new course
- `PATCH /courses/{id}` - Update course
- `POST /course-sessions` - Create new session
- `GET /bookings` - List all bookings
- `POST /bookings/{id}/attend` - Mark attendance
- `POST /bookings/{id}/complete` - Complete booking and issue certificates

## Business Rules

1. **Age Requirements**: Minimum age 16 for all courses
2. **English Level**: Level 2 English required
3. **Group Discounts**: Applied automatically based on participant count
4. **Certificates**: Valid for 3 years, Ofqual regulated
5. **Cancellation**: Not allowed within 48 hours of course start
6. **Minimum Participants**: 4 for public courses, sessions auto-confirm when minimum reached

## Development

```bash
# Run in dev mode with auto-reload
npm run dev

# Run tests
npm test

# Build
npm run build

# Generate OpenAPI spec
npm run openapi-spec
```

## License

Copyright (c) React Fast Training. All rights reserved.