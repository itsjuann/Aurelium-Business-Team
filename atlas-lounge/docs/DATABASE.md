# Database

PostgreSQL on Supabase. Schema lives in `supabase/migrations`; seed data in `supabase/seed.sql`
(generated). All of it has been applied to PostgreSQL 16 and exercised by `npm run test:db`.

## Migrations

| File | Contents |
| --- | --- |
| `…000100_foundation.sql` | Extensions, enums, `locations`, `rooms`, `equipment`, `profiles`, role helpers, new-user and role-guard triggers |
| `…000200_catalog.sql` | `services`, `service_variants`, `packages`, `membership_tiers`, `practitioners`, `practitioner_credentials`, `practitioner_services`, eligibility functions, `catalog_services` view |
| `…000300_booking.sql` | `travel_zones`, availability, `appointments` (+ exclusion constraints), `client_packages`, `memberships`, `intake_forms`, `consent_records`, `client_notes`, `equipment_reservations` |
| `…000400_commerce_operations.sql` | `payments`, `refunds`, discounts, `stripe_events`, `notifications`, `email_templates`, lead tables, `testimonials`, `site_content`, `settings`, `audit_logs`, `rate_limits` |
| `…000500_row_level_security.sql` | RLS enabled on every table, all policies, function privileges |

## Entity overview

```
auth.users ─1:1─ profiles (role) ─┬─< appointments >─ practitioners ─< practitioner_credentials
                                  ├─< client_packages >─ packages ─ service_variants ─ services
                                  ├─< memberships >─ membership_tiers ─ locations ─< rooms, equipment
                                  ├─< intake_forms, consent_records, client_notes
                                  └─< payments ─< refunds
practitioners ─< practitioner_services >─ services
practitioners ─< availability_rules, availability_exceptions
equipment ─< equipment_reservations          travel_zones ─< appointments
```

## Safeguards enforced by the database

| Requirement | Mechanism |
| --- | --- |
| No double-booking | `EXCLUDE USING gist` on `(practitioner_id, tstzrange(blocked_from, blocked_until))` for live statuses; buffers included; second constraint per room. Tested with six simultaneous inserts: exactly one succeeds |
| Unpaid holds block the slot | `pending_payment` counts as live until it expires |
| Practitioner eligibility | `practitioner_can_perform()`, `service_is_bookable()`, and the `appointments_prepare` trigger |
| A credential cannot be "verified" anonymously | Check constraint requires `verified_by` and `verified_at` |
| Drafts invisible | RLS: public read policies require `status = 'published'` |
| Prices are data | `service_variants.price_cents`, `packages.price_cents`, editable by admins, audited |
| Clients cannot write bookings or payments | No client insert/update policies; server-side functions only |
| Role changes | `guard_profile_update` trigger |
| Sensitive records | Dedicated policies; never copied to `audit_logs` |
| Testimonials | Check constraint: publishing requires consent on file and approval |
| Future amenities | `equipment`/`rooms`/`locations` default to `planned`; reservations for non-active equipment are rejected by trigger; capacity via `slot_index` |
| Webhook idempotency | `stripe_events` primary key on the Stripe event id |

## Multi-location readiness

`locations` (kind: mobile, studio, lounge; own timezone and capacity), `rooms`, `equipment`,
`equipment_reservations`, and `membership_tiers` (optional location, capacity limit) exist now
so later phases add features without reshaping data. Seeded: `private-mobile` (active) and
`the-atlas-lounge` (planned).

## Migration strategy

1. **Forward-only, ordered files.** Never edit a migration that has been applied to a shared
   environment; add a new one. Name: `YYYYMMDDHHMMSS_description.sql`.
2. **Environments.** Separate Supabase projects for staging and production. Apply with the
   Supabase CLI: `supabase link --project-ref <ref>` then `supabase db push`.
3. **Order of rollout.** Staging first, run `npm run test:db` in CI on every change, then
   production during a quiet window. Take a backup (or confirm point-in-time recovery) first.
4. **Backwards-compatible changes.** Expand, migrate, contract: add nullable columns or new
   tables, deploy code that writes both, backfill, then remove the old shape in a later release.
5. **Seed.** `supabase/seed.sql` is generated from `src/content/catalog.json`
   (`npm run db:seed:generate`; a unit test fails if they drift). It is idempotent and uses
   `on conflict do nothing`, so re-running it never overwrites prices edited in the dashboard.
   Once the admin dashboard exists, the database is the source of truth for the catalog.
6. **Types.** From Phase 2, generate TypeScript types with `supabase gen types typescript`.

## Running the database tests

```sh
TEST_DATABASE_URL=postgres://user:pass@localhost:5432/postgres npm run test:db
```

The suite creates a throwaway database, applies `supabase/tests/local_shim.sql` (stand-ins for
Supabase's `anon`/`authenticated`/`service_role` roles and `auth.uid()`), then the real
migrations and seed, runs the checks, and drops the database. The shim is for local testing
only. **Not yet verified against a hosted Supabase project**: do that as the first step of
staging (see SETUP).
