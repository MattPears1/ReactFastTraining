# React Fast Training - Technical Stack Documentation

## Core Technologies

### Frontend Framework
- **React 18** - Latest version with concurrent features
- **TypeScript** - Type safety and better developer experience
- **Vite** - Fast build tool and development server

### Styling & UI
- **Tailwind CSS** - Utility-first CSS framework
  - @tailwindcss/forms - Form styling
  - @tailwindcss/typography - Prose styling
  - @tailwindcss/aspect-ratio - Aspect ratio utilities
- **Framer Motion** - Animation library
- **Lucide React** - Icon library

### State Management & Data Fetching
- **React Query (TanStack Query)** - Server state management
- **React Hook Form** - Form management
- **Axios** - HTTP client

### Routing
- **React Router v6** - Client-side routing

### Charts & Data Visualization
- **Chart.js** - Flexible charting library
  - Will be used for:
    - Course completion statistics
    - Business growth metrics
    - Training effectiveness visualizations
    - Booking trends over time
  - Configuration:
    ```javascript
    // Example Chart.js configuration
    {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          position: 'top',
        },
        title: {
          display: true,
          text: 'Course Bookings Over Time'
        }
      },
      scales: {
        y: {
          beginAtZero: true
        }
      }
    }
    ```

### Backend
- **Node.js** with **Express**
- **PostgreSQL** - Primary database
- **Sequelize** - ORM for database management
- **JWT** - Authentication
- **Bcrypt** - Password hashing

### Development Tools
- **ESLint** - Code linting
- **Prettier** - Code formatting
- **Vitest** - Unit testing
- **Playwright/Cypress** - E2E testing (planned)

### Monitoring & Analytics
- **Sentry** - Error tracking
- **Google Analytics 4** - User analytics (configured)

### Deployment
- **Heroku** - Hosting platform
- **GitHub Actions** - CI/CD pipeline

## Design System

### Color Palette
- **Primary**: Trust Blue (#0EA5E9)
- **Secondary**: Healing Green (#10B981)
- **Accent**: Energy Orange (#F97316)
- **Error**: Alert Red (#DC2626) - Used sparingly

### Typography
- **Headings**: Outfit font family
- **Body**: Inter font family

### Components
- Custom UI components in `/src/components/ui`
- Reusable section components in `/src/components/sections`
- Layout components in `/src/components/layout`

## Key Features

### Implemented
- Notification system with toast alerts
- Search functionality with debouncing
- Social media integration
- User profile management
- SEO optimization with React Helmet
- Responsive design for all devices

### Planned
- Course booking system
- Payment integration (Stripe)
- Email automation
- Certificate generation
- Admin dashboard

## Performance Optimizations
- Code splitting with React.lazy
- Image optimization
- Bundle size monitoring
- Lighthouse CI integration (planned)

## Security Measures
- Input validation
- XSS protection
- CSRF tokens
- Rate limiting
- Secure headers

## Development Guidelines
- Mobile-first approach
- Accessibility (WCAG 2.1 AA)
- Progressive enhancement
- SEO best practices

## Critical Restrictions (DO NOT IMPLEMENT)
- No PWA/Service Workers
- No caching mechanisms
- No fake data or testimonials
- No multi-language support
- No comments sections