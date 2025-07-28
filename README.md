# React Fast Training - Professional First Aid Training Platform

A comprehensive first aid training platform built with React, TypeScript, and LoopBack 4. This enterprise-grade solution features an advanced booking system, course management, and client portal specifically designed for first aid training providers in Yorkshire.

**Last updated: 2025-07-27 - 23:30**

## 🏥 Project Overview

React Fast Training is Yorkshire's premier first aid training provider, offering HSE-approved and Ofqual-regulated courses. This platform provides:

- **Emergency First Aid at Work (EFAW)** - 1-day courses
- **First Aid at Work (FAW)** - 3-day comprehensive training
- **Paediatric First Aid** - Specialized child care training
- **Requalification Courses** - Maintain certifications
- **13 Total Course Types** - Comprehensive training offerings

## 🚀 Recent Major Enhancements (July 2025)

### Advanced Booking System
- **Calendar View**: Interactive monthly calendar with course availability
- **Dual View Modes**: Switch between calendar and list views
- **Group Booking Support**: Book multiple participants with automatic 10% discount for 5+ attendees
- **Advanced Filtering**: Filter by course type, location, month, and search
- **Real-time Availability**: Live capacity updates with "FULL" status indicators
- **Professional Email Templates**: Automated confirmations and reminders
- **Overbooking Prevention**: Database-level constraints and real-time validation
- **Duplicate Detection**: Prevents same email booking same session twice
- **Payment Validation**: Ensures correct payment amounts

### User & Payment Management
- **User Management System**: Track customer history without forced registration
- **Payment System**: Complete Stripe integration with webhooks
- **Customer Lifetime Value**: Track total spent and booking history
- **Payment Reconciliation**: Automated Stripe reconciliation
- **Refund Management**: Handle refunds and cancellations

### Admin Features
- **Admin Alerts**: Real-time monitoring of suspicious activities
- **Activity Logging**: Complete audit trail of admin actions
- **Enhanced Dashboard**: Comprehensive metrics and analytics
- **User Search**: Look up any customer by email
- **Payment Management**: View and manage all transactions

### Component Library
The booking system now features a comprehensive reusable component library:
- **CourseCard**: Display course information with availability
- **PricingSummary**: Dynamic pricing with group discounts
- **BookingSteps**: Visual progress indicator
- **BookingConfirmation**: Success page with next steps
- **CalendarView**: Interactive course calendar
- **FilteredCourseList**: Advanced course filtering

### Technical Architecture
- **Centralized Configuration**: All course data in single source of truth
- **Zod Validation**: Type-safe form validation throughout
- **Responsive Design**: Mobile-first approach with enhanced tablet/desktop views
- **Performance Optimized**: Lazy loading, code splitting, and optimized queries
- **Accessibility**: WCAG 2.1 AA compliant components

## 🚀 Features

### Frontend
- **React 18** with TypeScript for type-safe development
- **Vite** for fast development and optimized builds
- **Tailwind CSS** with custom medical/healthcare design system
- **Framer Motion** for smooth animations
- **Responsive Design** - Mobile-first with enhanced tablet/desktop views
- **Accessibility** - WCAG 2.1 AA compliant
- **SEO Optimized** for local Yorkshire searches
- **Real-time Updates** via WebSocket connections

### Backend (LoopBack 4)
- **LoopBack 4** - Modern TypeScript API framework
- **PostgreSQL** database with optimized indexes
- **JWT Authentication** with refresh tokens
- **CSRF Protection** - Token-based security
- **Email Service** integration (SMTP ready)
- **Real-time Validation** with row-level locking
- **Database Constraints** for data integrity
- **Admin Alerts System** for monitoring
- **Activity Logging** for complete audit trails

### Booking System Features
- **Multi-step Booking Wizard** with progress tracking
- **Calendar View** with monthly navigation
- **List View** with advanced filtering
- **Group Bookings** with automatic discounts
- **Course Filtering** by type, location, date
- **Real-time Availability** with "FULL" indicators
- **Email Confirmations** with professional templates
- **Payment Integration** with Stripe
- **Overbooking Prevention** - Database-level protection
- **Duplicate Booking Detection** - Email-based
- **Payment Validation** - Amount verification
- **Certificate Generation** upon completion

### Testing & Quality
- **Vitest** for unit testing
- **React Testing Library** for component testing
- **Cypress** for E2E testing
- **ESLint** & **Prettier** for code quality
- **95%+ Test Coverage** on critical paths

## 📦 Installation

### Prerequisites
- Node.js >= 18.0.0
- PostgreSQL >= 14
- Redis (optional)

### Setup

1. Clone the repository:
```bash
git clone https://github.com/your-org/lex-business-website.git
cd lex-business-website
```

2. Install dependencies:
```bash
# Frontend dependencies
npm install

# Backend dependencies
cd backend
npm install
```

3. Environment setup:
```bash
# Copy environment files
cp .env.example .env
cp backend/.env.example backend/.env
```

4. Configure your environment variables in both `.env` files.

5. Database setup:
```bash
# Create PostgreSQL database
createdb lex_business

# Run migrations (from backend directory)
npm run migrate
```

## 🛠️ Development

### Frontend Development
```bash
# Start development server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview
```

### Backend Development
```bash
cd backend

# Start development server
npm run dev

# Build TypeScript
npm run build

# Start production server
npm start
```

### Testing
```bash
# Run unit tests
npm test

# Run tests with coverage
npm run test:coverage

# Run E2E tests
npm run test:e2e

# Run E2E tests headless
npm run test:e2e:headless
```

## 📁 Project Structure

```
react-fast-training/
├── src/                        # Frontend source code
│   ├── components/            # React components
│   │   ├── booking/          # Booking system components
│   │   │   ├── shared/      # Reusable booking components
│   │   │   ├── steps/       # Multi-step wizard components
│   │   │   └── *.tsx        # Core booking components
│   │   ├── common/          # Shared components
│   │   ├── layout/          # Layout components
│   │   ├── sections/        # Page sections
│   │   └── ui/              # UI components
│   ├── constants/           # Configuration and constants
│   │   └── courses.ts      # Centralized course data
│   ├── contexts/           # React contexts
│   ├── hooks/              # Custom hooks
│   ├── pages/              # Page components
│   │   └── courses/        # Individual course pages
│   ├── services/           # API services
│   ├── styles/             # Global styles
│   ├── types/              # TypeScript types
│   └── utils/              # Utility functions
├── backend-loopback4/          # LoopBack 4 API
│   ├── src/
│   │   ├── controllers/    # API controllers
│   │   ├── models/         # Data models
│   │   ├── repositories/   # Data repositories
│   │   ├── services/       # Business logic
│   │   └── datasources/    # Database connections
│   └── dist/               # Compiled output
├── task-planning/              # Implementation tracking
│   ├── 01-authentication/  # Auth implementation docs
│   ├── 02-course-management/ # Course system docs
│   ├── 03-booking-system/  # Booking system docs
│   ├── 04-payment-system/  # Payment integration docs
│   ├── 05-client-portal/   # Client portal docs
│   └── 06-admin-dashboard/ # Admin system docs
├── docs/                       # Project documentation
├── public/                     # Static assets
└── scripts/                    # Build and deployment scripts
```

## 🚀 Deployment

### Heroku Deployment

1. Create Heroku app:
```bash
heroku create your-app-name
```

2. Add PostgreSQL and Redis:
```bash
heroku addons:create heroku-postgresql:hobby-dev
heroku addons:create heroku-redis:hobby-dev
```

3. Set environment variables:
```bash
heroku config:set NODE_ENV=production
heroku config:set JWT_SECRET=your-secret
# ... other environment variables
```

4. Deploy:
```bash
git push heroku main
```

### Docker Deployment

```bash
# Build Docker image
docker build -t lex-business .

# Run container
docker run -p 3002:3002 lex-business
```

## 🧪 Testing Strategy

### Unit Tests
- Component logic and rendering
- Utility functions
- API service methods
- Backend controllers and services

### Integration Tests
- API endpoints
- Database operations
- Authentication flows

### E2E Tests
- User journeys
- Form submissions
- Navigation flows
- Responsive behavior

## 🔒 Security

- **Helmet.js** for security headers
- **CORS** configuration with whitelist
- **Rate limiting** on API endpoints
- **Input validation** with Zod and Joi
- **SQL injection** prevention with parameterized queries
- **XSS protection** with input sanitization
- **CSRF protection** with token validation
- **Secure session management** with JWT
- **Password hashing** with bcrypt
- **Admin activity logging**
- **Suspicious activity alerts**
- **Database constraints** for data integrity

## 📊 Performance

- **Code splitting** with React.lazy
- **Image optimization**
- **Lazy loading** for images and components
- **Caching strategies** with Redis
- **Compression** middleware
- **CDN integration** ready

## ♿ Accessibility

- **Semantic HTML**
- **ARIA labels** and roles
- **Keyboard navigation** support
- **Focus management**
- **Screen reader** friendly
- **Color contrast** compliance
- **Skip to content** links

## 🎨 Design System

### Colors
- Primary: Blue (#3b82f6)
- Secondary: Gray (#64748b)
- Accent: Yellow (#eab308)
- Success: Green (#22c55e)
- Warning: Orange (#f59e0b)
- Error: Red (#ef4444)

### Typography
- Display: Sora
- Body: Inter
- Monospace: JetBrains Mono

### Components
- Buttons (primary, secondary, outline, ghost)
- Cards
- Forms
- Modals
- Tooltips
- Accordions
- Navigation

## 📚 API Documentation

### Authentication
```
POST /api/v1/auth/register
POST /api/v1/auth/login
POST /api/v1/auth/refresh-token
POST /api/v1/auth/logout
```

### User Management
```
GET    /api/v1/users/profile
PUT    /api/v1/users/profile
DELETE /api/v1/users/profile
```

### Contact
```
POST /api/v1/contact/submit
```

### Newsletter
```
POST /api/v1/newsletter/subscribe
POST /api/v1/newsletter/unsubscribe
```

## 🤝 Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- React team for the amazing framework
- Tailwind CSS for the utility-first approach
- All contributors and open source packages used

---

Built with ❤️ by Lex Business Team