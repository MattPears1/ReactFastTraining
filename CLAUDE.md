# Claude Instructions - React Fast Training Project

## 🚨 CRITICAL: MANDATORY READING

⚠️ **BEFORE ANY WORK**: You MUST read `CRITICAL_DO_NOT_DO.md` for absolute restrictions that can NEVER be violated.

---

## 🏥 PROJECT OVERVIEW

**Business**: React Fast Training - Yorkshire's premier first aid training provider
**Domain**: reactfasttraining.co.uk
**Industry**: Healthcare Education / First Aid Training
**Service Area**: Yorkshire, UK (Leeds, Sheffield, Bradford, York, Huddersfield, Wakefield, Halifax, Harrogate)
**Founder**: Lex

### Business Model
- Emergency First Aid at Work (EFAW) courses - Full day (6 hours) - £75
- First Aid at Work (FAW) courses - Full day (6 hours)
- Paediatric First Aid courses - Full day (6 hours)
- HSE approved & Ofqual regulated training
- Both on-site and public venue training

---

## 🎨 DESIGN SYSTEM & BRANDING

### Color Palette
```css
/* Primary - Trust Blue (Medical/Healthcare) */
--primary-500: 14 165 233;  /* #0EA5E9 - Main brand blue */
--primary-600: 2 132 199;   /* #0284C7 - Darker blue */
--primary-700: 3 105 161;   /* #0369A1 - Darkest blue */

/* Secondary - Healing Green */
--secondary-500: 16 185 129; /* #10B981 - Success/positive */

/* Accent - Energy Orange */
--accent-500: 249 115 22;    /* #F97316 - Call-to-action */
```

### Typography
- **Headings**: Font family 'Outfit' - Modern, professional
- **Body**: Font family 'Inter' - Clean, readable
- **All text**: Professional tone, no casual language

### Visual Elements
- Medical cross patterns (subtle background)
- Trust-building imagery (professional trainers, real training scenarios)
- Clean, clinical design aesthetic
- Light mode by default (NO dark mode as default)

---

## 🛠️ TECHNICAL STACK

### Frontend
- **Framework**: React 18 with TypeScript
- **Build Tool**: Vite (for fast HMR and builds)
- **Styling**: Tailwind CSS with custom design system
- **Routing**: React Router v6
- **State Management**: React Context API
- **Animations**: Framer Motion
- **Forms**: React Hook Form with Zod validation
- **Icons**: Lucide React

### Backend
- **Primary**: LoopBack 4 (Node.js) - Modern API framework
- **Legacy**: Express.js backend (being phased out)
- **Database**: PostgreSQL
- **ORM**: Drizzle ORM
- **Email**: Email service integration (SendGrid/Mailgun allowed)

### Infrastructure
- **Hosting**: To be determined (NO CDN currently)
- **Domain**: reactfasttraining.co.uk
- **SSL**: Required for production
- **Analytics**: Custom analytics dashboard (NO third-party analytics without approval)

---

## ✅ WHAT TO DO - KEY FEATURES

### 1. Course Management System
- Display course schedules with real-time availability
- Online booking system with secure payments
- Automated booking confirmations via email
- Course completion certificates

### 2. Lead Generation
- Contact forms for enquiries
- Quote request system for corporate training
- Newsletter signup (GDPR compliant)
- SEO optimized for local searches

### 3. Trust Building
- Display real certifications (HSE, Ofqual)
- Show trainer qualifications
- Case studies from real clients (with permission)
- Google Reviews integration (real reviews only)

### 4. Upcoming Features
- Live chat widget with Google Gemini AI API integration
- Customer portal for certificate downloads
- Automated reminder system for certificate renewals
- Mobile app for course materials

### 5. Cookie Consent & GDPR
- Full GDPR compliance required
- Cookie consent banner implementation
- Privacy policy and terms of service pages
- Data processing agreements

---

## ❌ CRITICAL DO NOT DO LIST

### 1. Caching & PWA
- **NO** Service Workers
- **NO** PWA functionality
- **NO** JavaScript/CSS caching mechanisms
- **NO** Offline functionality
- **NO** Background sync

### 2. Content Restrictions
- **NO** Fake testimonials or reviews
- **NO** Placeholder statistics ("hundreds of happy customers")
- **NO** Stock photos implying they're real clients
- **NO** Made-up case studies
- **NO** False certifications or accreditations

### 3. Technical Restrictions
- **NO** Server-side caching (Redis, Memcached)
- **NO** CDN integration (CloudFlare, etc.)
- **NO** Cloud file storage (S3, Google Cloud)
- **NO** Comments sections
- **NO** Multi-language support (English only for now)

---

## 📋 DEVELOPMENT GUIDELINES

### Code Quality Standards
1. **TypeScript**: Strict mode enabled, no `any` types
2. **Components**: Functional components with hooks only
3. **Styling**: Tailwind utility classes, minimal custom CSS
4. **Testing**: Unit tests for critical business logic
5. **Accessibility**: WCAG 2.1 AA compliance minimum

### Git Workflow
```bash
# Always check current branch
git status

# Create feature branches
git checkout -b feature/description

# Commit messages format
# type(scope): description
# Example: feat(booking): add email confirmation system

# Never force push to main/master
```

### File Structure
```
src/
├── components/     # Reusable UI components
├── pages/         # Route pages
├── contexts/      # React contexts
├── hooks/         # Custom hooks
├── services/      # API and business logic
├── utils/         # Helper functions
└── styles/        # Global styles
```

### Performance Requirements
- Lighthouse score: 90+ for all metrics
- First Contentful Paint: < 1.5s
- Time to Interactive: < 3.5s
- No layout shifts after initial load

---

## 🔒 SECURITY REQUIREMENTS

1. **Data Protection**
   - All forms must have CSRF protection
   - Input validation on client AND server
   - SQL injection prevention (parameterized queries)
   - XSS protection (sanitize all user input)

2. **Authentication**
   - Secure password requirements (min 8 chars, complexity)
   - Password hashing with bcrypt
   - Session management with secure cookies
   - Rate limiting on login attempts

3. **Payment Security**
   - PCI DSS compliance for card payments
   - Use Stripe or similar for payment processing
   - Never store card details
   - SSL/TLS required for all payment pages

---

## 📱 RESPONSIVE DESIGN

### Breakpoints
- Mobile: < 640px
- Tablet: 640px - 1024px
- Desktop: > 1024px

### Mobile-First Approach
- Design for mobile screens first
- Progressive enhancement for larger screens
- Touch-friendly buttons (min 44x44px)
- Readable font sizes (min 16px on mobile)

---

## 🚀 DEPLOYMENT CHECKLIST

Before any deployment:
1. Run all tests: `npm test`
2. Check for console errors
3. Verify all forms work correctly
4. Test on real mobile devices
5. Check all email notifications
6. Verify SSL certificate
7. Update sitemap.xml
8. Test 404 and error pages

---

## 📞 CONTACT & SUPPORT

**Business Owner**: Lex
**Developer Support**: Check package.json for maintainer info
**Urgent Issues**: Create HIGH priority issue in project tracker

---

## 🎯 BUSINESS GOALS & KPIs

1. **Primary Goal**: Become Yorkshire's #1 first aid training provider
2. **Conversion Rate**: Target 5%+ visitor to booking
3. **Local SEO**: Rank #1 for "first aid training [city]" in all service areas
4. **Customer Satisfaction**: Maintain 4.8+ star rating
5. **Growth**: 20% increase in bookings year-on-year

---

## 🔄 MAINTENANCE & UPDATES

### Regular Tasks
- Weekly: Check for security updates
- Monthly: Review analytics and performance
- Quarterly: Update course content and pricing
- Annually: Renew SSL certificates and domain

### Update Protocol
1. Always create a backup before major updates
2. Test updates in development environment first
3. Deploy during low-traffic hours
4. Monitor for 24 hours post-deployment

---

## ⚡ QUICK REFERENCE

### Commands
```bash
npm run dev          # Start development server
npm run build        # Build for production
npm run test         # Run tests
npm run lint         # Check code quality
```

### Key Files
- `/index.html` - Meta tags and SEO data
- `/src/config/siteConfig.ts` - Site configuration
- `/CRITICAL_DO_NOT_DO.md` - Restrictions list
- `/backend-loopback4/` - Main API directory

### Environment Variables
```
VITE_API_URL=http://localhost:3000
VITE_SITE_URL=https://reactfasttraining.co.uk
DATABASE_URL=postgresql://...
EMAIL_API_KEY=...
```

---

**REMEMBER**: This is a REAL business. Every decision should enhance the company's reputation and help save lives through quality first aid training.