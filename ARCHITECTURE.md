# React Fast Training — Full Platform Architecture (horizon31julyv1)

Status: Active design and implementation track for full booking/admin-capable platform while preserving brochure site stability.

Goals
- Keep public brochure pages (Home, About, Courses, Contact) stable.
- Prepare production-ready booking system and admin back office, gated behind feature flags until needed.
- Standardize on LoopBack 4 API (port 3000) and Vite frontend (port 8081) with Cypress aligned.
- Ensure repeatable database setup via Knex migrations and seeds (already present under backend-loopback4/src/database).

High-Level Architecture
- Frontend: React 18 + Vite + TypeScript + Tailwind.
  - Routing: React Router SPA with lazy-loaded modules.
  - Data access: React Query; environment-based API root (proxied to :3000).
  - Feature flags to toggle booking/admin exposure.
- Backend: LoopBack 4 on Express (port 3000).
  - API layers: Controllers (REST), Services (business logic), Repositories (LB4 and/or Drizzle-powered services).
  - DB: PostgreSQL with Knex migrations/seeds; Drizzle ORM used in service/query layers where convenient.
  - WebSockets: initialized for real-time notifications/update channels.
  - Security: CORS allowlist, rate limiting on sensitive endpoints, server-side validation, JWT for admin.
  - Observability: Structured logging, health endpoints, optional Sentry.

Environments and Ports
- Frontend dev: http://localhost:8081 (strictPort).
- Backend dev: http://localhost:3000.
- Vite proxy: /api, /ping, /health → http://localhost:3000.
- Cypress baseUrl: http://localhost:8081.

Core Domain Model (Minimum Set)
- Course: id, slug, title, category, duration, price, active, certification flags.
- Session: id, courseId, start/end, venueId, capacity, seatsRemaining (derived), status, trainerId.
- Booking: id, sessionId, purchaser info (name, email, phone), attendees[], total, currency, status (pending, paid, cancelled, refunded), paymentIntentId (Stripe), created_at.
- User: id, email, name, role (admin, staff, viewer), phone, last_login, active.
- Testimonial: id, author, rating, content, status (pending/published).
- Payment/PaymentEvents/PaymentLogs: status, amounts, provider, reconciliation metadata.
- AdminActivityLog: adminId, action, entityType, entityId, metadata, timestamp.
- Venues/Locations: normalized for scheduling and search.
- Trainers: trainer data for session assignment.

Database Strategy
- Knex migrations and seeds located at:
  - backend-loopback4/src/database/migrations
  - backend-loopback4/src/database/seeds
- Database config and setup scripts:
  - backend-loopback4/src/database/config.ts
  - backend-loopback4/src/scripts/setup-database.ts / .js
  - Package scripts (backend-loopback4/package.json): migrate:latest, seed:run, db:setup, db:migrate, db:seed, etc.
- Policy:
  - All schema changes via Knex migrations.
  - Seeds provide initial admin, course catalog, and demo data.
  - Drizzle schemas under backend-loopback4/src/db/schema/ are kept in sync conceptually to assist typed queries in services.

API Surfaces (Initial Public Read + Booking Skeleton)
Public Read
- GET /api/courses
  - Query params: q (search), category, active (bool), pagination: page, pageSize.
  - Returns list with minimal fields for cards and course pages.
- GET /api/sessions
  - Query params: courseId/slug, date range, venue, status (published/open), pagination.
  - Returns upcoming sessions with capacity indicators.

Booking (Skeleton)
- POST /api/bookings
  - Body: { sessionId, purchaser: {name, email, phone}, attendees: [{name, email}], discountCode? }
  - Validates capacity, duplicate booking by email for the session, pricing rules (group discounts).
  - Creates pending booking row(s), returns bookingId and clientSecret if Stripe PI is created inline or returns next-action to create PI.
- POST /api/payments/stripe/webhook
  - Stripe signed webhook endpoint to reconcile payment events → update booking status to paid/refunded/cancelled, log events.

Admin (Skeleton)
- Auth: POST /api/admin/login, token issuance; protected routes via JWT.
- CRUD:
  - Courses: GET/POST/PUT/PATCH.
  - Sessions: GET/POST/PUT/PATCH (publish/unpublish, duplicate).
  - Bookings: GET (search), POST (admin-created), PATCH (edit purchaser/attendees), refund request.
  - Testimonials: GET (moderation queue), PATCH (publish/unpublish).
- Reports: GET /api/admin/reports/summary (bookings, revenue, occupancy) — initial simple aggregates.

Security and Compliance
- JWT for admin routes, refresh token pattern optional later.
- CORS allowlist includes production domains and http://localhost:8081.
- Rate limit sensitive endpoints (login, payment actions).
- Input validation: LB4 request validators + service-level checks.
- Audit logs for admin actions.
- GDPR-friendly email preferences and data export in roadmap.

Notifications/Emails
- Nodemailer-based email service with handlebars templates.
- Emails: booking confirmation, admin notification, reminders, refund confirmations.
- Queueability hooks to avoid blocking request lifecycle (defer heavy tasks).

Observability/Resilience
- Health checks: /ping and /health endpoints.
- Structured logs; WebSocket monitoring logs.
- Optional Sentry integration behind env var toggle (frontend and backend).
- Idempotency keys for payment actions to avoid double charges.

Feature Flags and Exposure
- Booking and Admin hidden from main nav until client opt-in.
- Dev/test routes enabled via env flags for internal QA.

Phasing (Execution Outline)
- Phase A: Documented here; verify migrations/seeds run; curate seed dataset minimal for demo.
- Phase B: Implement courses/sessions read endpoints; integrate frontend listings with real data.
- Phase C: Implement booking POST skeleton and Stripe webhook; smoke test end-to-end payment flow (dev mode).
- Phase D: Admin auth and minimal CRUD for courses/sessions/bookings/testimonials.
- Phase E: E2E tests for main flows; accessibility checks; resilience and rate limits; refine docs.

Deployment Notes
- Frontend: static hosting behind Nginx/Caddy; proxy /api and WS upgrades to LB4 on :3000.
- Backend: LB4 service managed under systemd/PM2/Docker; configure env variables (DB, Stripe, CORS).
- Database: run migrations, then guarded seeds in non-dev environments; include rollback/backup procedures.

Change Control
- All DB schema via Knex migrations only; no manual alterations.
- Commit atomic changes per feature slice; maintain tests alongside API endpoints.
- Keep README and this ARCHITECTURE.md updated on material shifts.