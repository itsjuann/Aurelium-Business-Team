# Architecture

## 1. Repository context

This repository already contained an unrelated product (Restaurant Autopilot, an Express +
SQLite app at the repository root). The Atlas Lounge is a separate product with a different
stack, so it lives entirely in `atlas-lounge/` and shares nothing with the root app. On Vercel
the project's **Root Directory** is `atlas-lounge`.

## 2. System overview

```
Visitor / Client / Staff (browser, installable PWA)
        │  HTTPS
        ▼
Next.js 16 on Vercel ── App Router, React Server Components, Server Actions
        │                 Cache Components: public pages are prerendered static shells
        ├── Supabase ──── PostgreSQL (data + row-level security) and Auth (sessions, roles)
        ├── Stripe ────── Checkout (sessions, packages) and Billing (memberships); webhooks in
        ├── Resend ────── transactional email
        ├── Twilio ────── optional SMS reminders (explicit opt-in only)
        └── Claude API ── optional, administrator-controlled AI features
```

**Trust boundaries**

1. The browser is untrusted. Every Server Action re-validates input with Zod and re-checks
   authorisation; client-side validation is only a convenience.
2. PostgreSQL is the last line of defence. Row-level security, constraints and triggers hold
   even if application code is wrong: double-booking, role escalation, draft visibility and
   practitioner eligibility are all enforced in the database.
3. Secrets (service-role key, Stripe, Resend, Twilio, AI keys) exist only in server
   environment variables. Modules that use them import `server-only`.

## 3. Technology

| Concern | Choice | Notes |
| --- | --- | --- |
| Framework | Next.js 16 (App Router, TypeScript, Turbopack) | Cache Components + Partial Prefetching enabled |
| Styling | Tailwind CSS v4 | Brand tokens in `src/app/globals.css` (`@theme`) |
| Components | shadcn/ui conventions | `components.json`, `src/components/ui`, Radix primitives, `cva`. Components are written by hand in the same structure the shadcn CLI generates, so more can be added with it later |
| Forms | React Hook Form + Zod | One schema per form, shared by client and server |
| Data | Supabase PostgreSQL | Migrations in `supabase/migrations` |
| Auth | Supabase Auth (Phase 2) | Roles: owner, admin, practitioner, client |
| Payments | Stripe Checkout + Billing (Phase 4) | Card data never touches our servers |
| Email / SMS | Resend / Twilio (Phase 7) | Queue table: `notifications` |
| Hosting | Vercel | Preview deployments act as staging |
| Tests | Vitest (unit + database), Playwright (browser) | |

## 4. Project structure

```
atlas-lounge/
├── docs/                      Architecture, database, roadmap, setup, launch checklist
├── supabase/
│   ├── migrations/            Ordered, forward-only SQL migrations
│   ├── seed.sql               GENERATED from src/content/catalog.json
│   └── tests/local_shim.sql   Stand-in for Supabase roles/auth, for local database tests
├── scripts/generate-seed.mjs  Catalog JSON -> seed.sql
├── src/
│   ├── app/                   Routes (one folder per page), actions/, manifest, sitemap, robots
│   ├── components/
│   │   ├── ui/                Design-system primitives (button, field, accordion)
│   │   ├── site/              Header, footer, section primitives, art, content blocks
│   │   └── forms/             Waitlist, contact, booking-request forms
│   ├── content/catalog.json   Seed catalog: single source for the site (Phase 1) and seed.sql
│   └── lib/                   catalog, schemas, leads, rate-limit, supabase-admin, site, content
└── tests/                     unit/ (Vitest), db/ (Vitest + PostgreSQL), e2e/ (Playwright)
```

Planned route groups: `(public)` today; `(auth)`, `account/` (client portal) and `admin/`
arrive with their phases, each guarded in a layout **and** in every data access.

## 5. Design system

- **Palette**: Charcoal `#1C1C1C`, Warm Ivory `#F4F1EC`, Bronze `#A67C52`, Forest `#1F3D36`,
  plus tints. Bronze fails AA contrast for small text on ivory, so small labels use
  `bronze-deep` on light surfaces and `bronze-light` on dark ones; pure bronze is reserved for
  rules, numerals and large type.
- **Type**: Cormorant Garamond (display) and Hanken Grotesk (text), self-hosted at build time
  by `next/font`.
- **Layout**: 12-column editorial grid, generous vertical rhythm, hairline rules, square
  corners, no gradients.
- **Motion**: one entrance animation and scroll reveals; all disabled under
  `prefers-reduced-motion`, and content is visible without JavaScript.
- **Imagery**: architectural line compositions (`components/site/art.tsx`) stand in until the
  business supplies approved photography. No stock photos are used.

## 6. Catalog, drafts and the eligibility gate

- Catalog status is `draft | published | archived`. Only `published` rows are public, enforced
  by RLS and, in Phase 1, by `lib/catalog.ts`.
- Seeded: **Massage** (60/90/120 min) is published. Myofascial Release, Stretch & Mobility,
  Muscle Activation, Massage + Muscle Activation and all four packages are **drafts**.
- A service with `required_credential_type` can only be booked with a practitioner holding a
  verified, unexpired credential of that type. The database enforces this twice:
  `service_is_bookable()` drives what the public may book, and the `appointments_prepare`
  trigger rejects any live appointment with an ineligible practitioner.
- **Phase 1 stand-in**: the site has no database-driven catalog yet, so the owner attests
  verification per service with `CREDENTIAL_VERIFIED_SERVICES`. While empty, the Book page
  collects interest only. Phase 3 replaces this with the database functions above.

## 7. Booking design (Phase 3)

1. Client picks service variant → appointment type → travel zone (by postal code) → practitioner.
2. Server computes open slots from `availability_rules` minus `availability_exceptions` minus
   existing appointments (with buffers), in the location's timezone.
3. `book_appointment()` (a `security definer` function, single transaction) inserts a
   `pending_payment` hold with `hold_expires_at`. The exclusion constraint makes simultaneous
   requests for one slot impossible: exactly one insert wins, the rest receive `23P01` and the
   client is shown fresh availability. This is already implemented and tested at schema level.
4. Stripe Checkout collects payment or deposit; the webhook confirms the appointment.
   Unpaid holds expire and release the slot.
5. Reschedule/cancel go through functions that apply the configured policy windows.

## 8. Payments (Phase 4)

Stripe Checkout for sessions and packages; Stripe Billing for memberships. The database stores
only Stripe identifiers, amounts and statuses. Webhooks verify signatures against the raw body
and are idempotent via `stripe_events`. Prices are edited in the admin dashboard and synced to
Stripe; the amount charged is always computed server-side from the database.

## 9. Security model

| Control | Implementation |
| --- | --- |
| Authorisation | Server-side role checks + RLS on every table (`is_admin()`, `is_staff()`, `is_practitioner_for()`) |
| Role escalation | `guard_profile_update` trigger: only owners assign roles; admins cannot create owners |
| Sensitive data | Intake, consent and client notes: client, treating practitioner (30-day window) and admins only; excluded from audit payloads |
| Audit | Append-only `audit_logs` via triggers; API roles cannot modify it |
| Rate limiting | `check_rate_limit()` in PostgreSQL (shared across instances), keyed by hashed IP |
| Spam | Honeypot fields; server-side validation |
| Transport / headers | HTTPS only (HSTS), `X-Frame-Options: DENY`, `nosniff`, strict referrer policy |
| Secrets | Server-only environment variables; none in the repository |
| Card data | Never stored or handled; Stripe-hosted Checkout |
| To add | Nonce-based Content-Security-Policy (Phase 2, alongside auth), CAPTCHA if spam appears |

## 10. AI features (Phase 8, optional, off by default)

Each feature has its own administrator switch in `settings` (`ai.*`, all seeded `false`).

| Feature | Data it may use | Guardrails |
| --- | --- | --- |
| Website FAQ assistant | Published site content and catalog only | No client data; refuses medical questions and directs to a healthcare provider |
| Booking assistance | Published catalog and public availability | Cannot create bookings; hands off to the normal flow |
| Service recommendations | Visitor's stated preferences in the conversation | General wellness framing only; never diagnoses or suggests treatment for conditions |
| Follow-up drafts | Appointment metadata (service, date, first name) | Staff-only; drafts are never auto-sent; no intake, consent or note contents |
| Analytics summaries | Aggregated, de-identified metrics | Admin-only; no row-level client data |

Rules for all of them: no diagnosis or medical advice; intake forms, consent records and client
notes are never sent to a model; every call is server-side, rate limited and logged in
`audit_logs`; outputs shown to clients are labelled as AI-generated.

## 11. Data retention and deletion (policy to finalise before launch)

- Clients can request deletion (`profiles.deletion_requested_at`); an admin job (Phase 6)
  removes or anonymises personal data while keeping financial records required by law.
- Proposed defaults to confirm with counsel: leads 24 months; intake/consent per professional
  record-keeping rules in the operating jurisdiction; audit logs 7 years.
