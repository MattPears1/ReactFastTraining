# Agent Guidelines & Best Practices

## Overview

This document provides comprehensive guidelines for all agents working on the business website project. These guidelines ensure consistency, quality, and efficient collaboration across all development phases.

## Agent Roster & Responsibilities

### 1. Requirements Interviewer
**Purpose**: Gather and document business requirements
**Key Responsibilities**:
- Ask clarifying questions about business model (e-commerce vs service)
- Document feature requirements with priorities
- Create user stories with acceptance criteria
- Identify technical constraints and integrations needed

### 2. SEO Content Optimizer
**Purpose**: Ensure maximum search engine visibility
**Key Responsibilities**:
- Optimize all content for target keywords
- Implement proper meta tags and schema markup
- Monitor and improve Core Web Vitals
- Generate and maintain XML sitemaps

### 3. Database Architect
**Purpose**: Design flexible, scalable database schemas
**Key Responsibilities**:
- Create adaptive schemas (simple contact → full e-commerce)
- Implement proper indexing strategies
- Set up migration and backup procedures
- Ensure data security and compliance

### 4. Test Coverage Guardian
**Purpose**: Maintain high code quality through testing
**Key Responsibilities**:
- Maintain minimum 80% test coverage
- Write unit, integration, and e2e tests
- Implement visual regression testing
- Set up CI/CD test pipelines

### 5. Responsive Viewport Specialist
**Purpose**: Ensure perfect display across all devices
**Key Responsibilities**:
- Create device-specific optimizations
- Test on all major viewport sizes
- Implement touch-friendly interfaces
- Ensure performance on mobile devices

### 6. Security Auditor
**Purpose**: Protect against vulnerabilities and threats
**Key Responsibilities**:
- Continuous security scanning
- Implement security headers and CSP
- Validate all user inputs
- Monitor for exposed secrets

### 7. Performance Optimizer
**Purpose**: Ensure fast, responsive user experience
**Key Responsibilities**:
- Monitor and reduce bundle sizes
- Implement lazy loading strategies
- Optimize images and assets
- Achieve sub-3-second load times

### 8. Accessibility Compliance
**Purpose**: Ensure website is usable by everyone
**Key Responsibilities**:
- WCAG 2.1 AA compliance
- Implement proper ARIA labels
- Ensure keyboard navigation
- Test with screen readers

### 9. Deployment Orchestrator
**Purpose**: Manage smooth, reliable deployments
**Key Responsibilities**:
- Set up CI/CD pipelines
- Implement blue-green deployments
- Monitor deployment health
- Manage rollback procedures

### 10. Analytics Integrator
**Purpose**: Track and analyze user behavior
**Key Responsibilities**:
- Set up Google Analytics 4
- Implement conversion tracking
- Create custom events
- Generate performance reports

## Core Development Principles

### 1. Mobile-First Development
- Start with mobile design and enhance for larger screens
- Test touch interactions thoroughly
- Optimize performance for mobile networks

### 2. Progressive Enhancement
- Build core functionality that works everywhere
- Add enhancements for modern browsers
- Ensure graceful degradation

### 3. Component-Based Architecture
- Create reusable components
- Maintain consistent styling
- Document component APIs

### 4. Performance Budget
- Maximum 3-second load time
- Bundle size under 500KB (initial)
- Images optimized and lazy-loaded
- Critical CSS inlined

### 5. Accessibility Standards
- WCAG 2.1 AA compliance minimum
- Semantic HTML structure
- Keyboard navigation support
- Screen reader compatibility

## File Structure & Organization

```
/mnt/f/2025/Lex_site_v1/
├── src/
│   ├── components/      # Reusable UI components
│   ├── pages/          # Page components
│   ├── styles/         # Global styles and themes
│   ├── utils/          # Helper functions
│   ├── hooks/          # Custom React hooks
│   ├── services/       # API and external services
│   └── types/          # TypeScript definitions
├── public/
│   ├── images/         # Static images
│   ├── fonts/          # Custom fonts
│   └── assets/         # Other static assets
├── showcase/           # Component showcase (temporary)
├── tests/
│   ├── unit/          # Unit tests
│   ├── integration/   # Integration tests
│   └── e2e/           # End-to-end tests
└── docs/
    ├── agents/        # Agent documentation
    ├── api/           # API documentation
    └── deployment/    # Deployment guides
```

## Code Standards

### TypeScript/JavaScript
- Use TypeScript for type safety
- Prefer functional components
- Use async/await over promises
- Implement proper error boundaries

### CSS/Styling
- Use CSS-in-JS or CSS modules
- Follow BEM naming convention
- Implement CSS custom properties for theming
- Mobile-first media queries

### Testing
- Test file naming: `*.test.ts` or `*.spec.ts`
- Minimum 80% code coverage
- Test edge cases and error states
- Mock external dependencies

## Workflow Guidelines

### 1. Feature Development
1. Requirements gathering (Requirements Interviewer)
2. Design review (UI/UX agents)
3. Implementation (Frontend/Backend agents)
4. Testing (Test Coverage Guardian)
5. Accessibility check (Accessibility Compliance)
6. Performance review (Performance Optimizer)
7. Security audit (Security Auditor)
8. Deployment (Deployment Orchestrator)

### 2. Code Review Checklist
- [ ] Follows coding standards
- [ ] Has appropriate test coverage
- [ ] Accessible (WCAG 2.1 AA)
- [ ] Performance optimized
- [ ] Security reviewed
- [ ] Mobile responsive
- [ ] SEO optimized
- [ ] Documentation updated

### 3. Communication Protocol
- Use clear, descriptive commit messages
- Document all decisions in ADRs (Architecture Decision Records)
- Update relevant documentation immediately
- Report blockers promptly

## Integration Points

### Between Agents
- Share context through documented interfaces
- Use consistent data formats
- Implement proper error handling
- Log all inter-agent communications

### With External Services
- Document all API endpoints
- Implement retry logic
- Use environment variables for configuration
- Monitor third-party service health

## Emergency Procedures

### Critical Issues
1. Security vulnerability: Immediate patch and audit
2. Site down: Rollback and investigate
3. Data breach: Isolate, assess, and notify
4. Performance degradation: Scale and optimize

### Escalation Path
1. Agent detects issue
2. Attempt automated resolution
3. Alert relevant specialised agents
4. Human intervention if needed

## Continuous Improvement

### Metrics to Track
- Page load times
- Test coverage percentage
- Accessibility score
- SEO rankings
- Security scan results
- User satisfaction scores

### Regular Reviews
- Weekly: Performance metrics
- Bi-weekly: Security audits
- Monthly: Accessibility compliance
- Quarterly: Architecture review

## Best Practices Summary

1. **Always test on real devices**, not just browser DevTools
2. **Optimize for the slowest device** your users might have
3. **Write code for humans**, not just machines
4. **Document as you go**, not after the fact
5. **Security is not optional**, build it in from the start
6. **Accessibility benefits everyone**, not just users with disabilities
7. **Performance is a feature**, treat it as such
8. **Iterate based on data**, not assumptions

---

*Last Updated: [Current Date]*
*Version: 1.0.0*