# The Atlas Lounge

Luxury wellness website and client-management platform: a private, appointment-based recovery
practice today, designed to grow into a multi-location members' lounge.

**Status: Phase 1 complete** (architecture, database schema, design system, public website,
lead capture). Accounts, live booking, payments, the client portal and the admin dashboard are
later phases. See [docs/ROADMAP.md](docs/ROADMAP.md).

| Document | What it covers |
| --- | --- |
| [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) | System design, project structure, security model, AI guardrails |
| [docs/DATABASE.md](docs/DATABASE.md) | Schema, row-level security, migration strategy |
| [docs/ROADMAP.md](docs/ROADMAP.md) | Phased implementation plan and what each phase delivers |
| [docs/SETUP.md](docs/SETUP.md) | Environment variables, local setup, staging deployment |
| [docs/LAUNCH_CHECKLIST.md](docs/LAUNCH_CHECKLIST.md) | Everything that must be true before production launch |

## Quick start

```sh
cd atlas-lounge
npm install
cp .env.example .env.local
npm run dev            # http://localhost:3000
```

The site runs without any services connected. Forms then tell visitors, truthfully, that their
details were not sent; connect Supabase (see SETUP) to store submissions.

## Checks

```sh
npm run check          # lint + typecheck + unit tests + production build
npm run test:db        # schema, RLS and double-booking tests (needs TEST_DATABASE_URL)
npm run test:e2e       # browser tests against the production build (run `npm run build` first)
```

## Ground rules built into the code

- **Drafts are never public.** Only `published` catalog rows are visible; proposed services and
  packages are seeded as drafts.
- **Licence-gated services stay closed** until a practitioner's credential is verified.
- **Future amenities are labelled as planned** and have no booking or payment path.
- **No invented facts.** No testimonials, contact details, service area, or policies appear
  until the business supplies them.
- **Forms never fake success.** If a submission is not stored, the visitor is told.
