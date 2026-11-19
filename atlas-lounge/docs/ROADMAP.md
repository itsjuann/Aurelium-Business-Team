# Implementation roadmap

Built incrementally. Each phase ends with passing checks and a summary of what works, what
remains, and blockers.

## Phase 1 · Foundation and public website — COMPLETE

- Architecture, project structure, database design, migration strategy (this folder)
- Full schema with RLS, seeded catalog (confirmed massage pricing published; proposed services
  and packages as drafts)
- Design system and all 13 public pages: Home, About, Services, Service detail, Pricing &
  Packages, Book, Memberships, Private Mobile Sessions, The Future Lounge, FAQs, Contact,
  Client Login, Privacy Policy and Terms
- Lead capture: waitlist (lounge, memberships, booking, packages), contact, appointment request;
  validated, rate limited, honeypot-protected
- Installable PWA manifest and icons, sitemap, robots, security headers
- Tests: 28 unit, 20 database, 50 browser

**Honest limits of Phase 1**

- The Client Login page explains accounts are not open; there is no sign-in yet.
- "Booking" is an appointment *request* confirmed by a person, and is closed until
  `CREDENTIAL_VERIFIED_SERVICES` is set. No availability, payment, or reminders yet.
- Form storage in Supabase is covered by unit tests with a mocked client and by SQL tests, but
  has **not** been run against a hosted Supabase project.
- The public site reads the seed catalog file, not the database, until Phase 2.
- Stripe, Resend, Twilio and AI are not integrated at all.

## Phase 2 · Authentication and roles

Supabase Auth (email magic link + password), `@supabase/ssr` session handling, `proxy.ts`
session refresh, role-guarded layouts for `/account` and `/admin`, owner bootstrap procedure,
catalog read from the database, generated database types, nonce-based CSP.

## Phase 3 · Booking and availability

Staff schedules and exceptions, slot computation with buffers and timezones, travel zones and
fees, `book_appointment` / `reschedule_appointment` / `cancel_appointment` functions, intake and
consent capture, hold expiry job, database-driven eligibility replacing the Phase 1 flag.

## Phase 4 · Stripe (test mode)

Checkout for sessions/deposits and packages, Billing for memberships, signature-verified
idempotent webhooks, price sync from the admin editor, receipts, refunds, discount codes.

## Phase 5 · Client portal

Profile, appointments and history, package balances, memberships, receipts, forms,
communication preferences, support, account deletion request.

## Phase 6 · Admin dashboard

Revenue (daily/weekly/monthly), calendar, CRM with restricted notes, service/pricing/package/
membership editors, staff scheduling, credential verification, travel zones, discounts,
refunds, cancellation and no-show reporting, email templates, analytics, audit log viewer,
website content and testimonial management.

## Phase 7 · Notifications

Resend transactional email, optional Twilio SMS with recorded consent and STOP handling,
reminder scheduling from the `notifications` queue, template rendering.

## Phase 8 · AI features (optional)

Administrator-switched features with the guardrails in ARCHITECTURE §10.

## Phase 9 · Hardening and launch

Accessibility audit, performance budget, penetration-style review of RLS and server actions,
backup/restore drill, monitoring and alerting, legal and compliance sign-off, launch checklist.
