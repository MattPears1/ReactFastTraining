# Lex Business Website

A modern, responsive business website built with React, TypeScript, and Tailwind CSS. This flexible platform supports product-based businesses, service-based businesses, or hybrid models combining both. Features a comprehensive design selection system for easy customization.

## 🎯 Business Flexibility

This website platform is designed to accommodate:
- **Product-Based Businesses**: Full e-commerce capabilities with product catalogs, shopping cart, and payment processing
- **Service-Based Businesses**: Service showcases, appointment booking, and consultation forms
- **Hybrid Businesses**: Combine both products and services in one unified platform

## 🎨 Design Selection System

The website includes an interactive showcase system that allows non-technical users to:
1. **Browse Design Options**: View live previews of typography, colors, buttons, layouts, and more
2. **Make Selections**: Use a simple form to choose preferred design elements
3. **Share Preferences**: Generate a summary document of selections for easy communication

Access the showcase at `/showcase/index.html`

**Documentation:**
- [Showcase Guide](showcase/README.md) - Complete guide to using the selection system
- [User Guide](docs/USER_GUIDE.md) - Understanding business types and features
- [Implementation Guide](docs/IMPLEMENTATION_GUIDE.md) - Technical implementation details

## 🚀 Features

### Frontend
- **React 18** with TypeScript for type-safe development
- **Vite** for fast development and optimized builds
- **Tailwind CSS** for utility-first styling
- **Framer Motion** for smooth animations
- **Dark Mode** support with system preference detection
- **Responsive Design** - Mobile-first approach
- **Accessibility** - WCAG 2.1 AA compliant
- **SEO Optimized** with sitemap and meta tags

### Backend
- **Node.js & Express** REST API
- **PostgreSQL** database with Sequelize ORM
- **Redis** for caching and session management
- **JWT Authentication** with refresh tokens
- **Rate Limiting** and security middleware
- **Email Service** integration
- **File Upload** support

### Testing & Quality
- **Vitest** for unit testing
- **React Testing Library** for component testing
- **Cypress** for E2E testing
- **ESLint** & **Prettier** for code quality
- **GitHub Actions** CI/CD pipeline

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
lex-business-website/
├── src/                    # Frontend source code
│   ├── components/         # React components
│   │   ├── common/        # Shared components
│   │   ├── layout/        # Layout components
│   │   ├── sections/      # Page sections
│   │   └── ui/            # UI components
│   ├── contexts/          # React contexts
│   ├── hooks/             # Custom hooks
│   ├── pages/             # Page components
│   ├── services/          # API services
│   ├── styles/            # Global styles
│   ├── types/             # TypeScript types
│   └── utils/             # Utility functions
├── backend/               # Backend source code
│   ├── src/
│   │   ├── config/        # Configuration files
│   │   ├── controllers/   # Route controllers
│   │   ├── middleware/    # Express middleware
│   │   ├── models/        # Database models
│   │   ├── routes/        # API routes
│   │   ├── services/      # Business logic
│   │   └── utils/         # Utility functions
│   └── tests/             # Backend tests
├── public/                # Static assets
├── cypress/               # E2E tests
├── scripts/               # Build scripts
└── docs/                  # Documentation
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
- **CORS** configuration
- **Rate limiting** on API endpoints
- **Input validation** with Joi
- **SQL injection** prevention with Sequelize
- **XSS protection**
- **CSRF protection**
- **Secure session management**

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