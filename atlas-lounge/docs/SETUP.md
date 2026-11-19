# Setup and deployment

## Requirements

- Node.js 20.19+ (22 recommended), npm
- For database tests: PostgreSQL 15+ with a superuser connection
- For browser tests: Playwright Chromium (`npx playwright install chromium`)

## Environment variables

`.env.example` is the authoritative list, grouped by the phase that first needs each variable.
Phase 1 uses:

| Variable | Required | Purpose |
| --- | --- | --- |
| `NEXT_PUBLIC_SITE_URL` | Yes (deployed) | Canonical URL for metadata and sitemap |
| `NEXT_PUBLIC_CONTACT_EMAIL`, `NEXT_PUBLIC_CONTACT_PHONE`, `NEXT_PUBLIC_SERVICE_AREA`, `NEXT_PUBLIC_INSTAGRAM_URL` | No | Shown on the site when set; omitted when blank |
| `NEXT_PUBLIC_LEGAL_REVIEWED` | No | `true` removes the "draft pending legal review" notice |
| `CREDENTIAL_VERIFIED_SERVICES` | No | Opens appointment requests for the listed licence-gated services |
| `CATALOG_PREVIEW_DRAFTS` | No | Design review of draft catalog items; ignored in production |
| `NEXT_PUBLIC_SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY` | For forms | Stores form submissions and shared rate limits |

Most of these are read when pages are prerendered, so **redeploy after changing them**.
Never commit real values, and never prefix a secret with `NEXT_PUBLIC_`.

## Local development

```sh
cd atlas-lounge
npm install
cp .env.example .env.local
npm run dev
```

Useful review modes:

```sh
CATALOG_PREVIEW_DRAFTS=true npm run dev                 # see draft services and packages
CREDENTIAL_VERIFIED_SERVICES=massage npm run dev        # see the appointment request form
```

## Database (Supabase)

1. Create a Supabase project (one for staging, a separate one for production).
2. Install the Supabase CLI, then from `atlas-lounge/`:
   ```sh
   supabase link --project-ref <project-ref>
   supabase db push                                   # applies supabase/migrations
   psql "<connection string>" -f supabase/seed.sql    # seeds catalog, locations, settings
   ```
3. In Project Settings → API, copy the project URL and the service-role key into
   `NEXT_PUBLIC_SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY`.
4. Verify: submit the waitlist form and confirm a row appears in `waitlist_entries`; confirm
   in the SQL editor that `select slug, status from services` shows one published service.
5. Do **not** run `supabase/tests/local_shim.sql` against Supabase. It is for local tests only.

## Staging deployment (Vercel)

1. Import the GitHub repository in Vercel. Set **Root Directory** to `atlas-lounge`
   (framework preset: Next.js; default build and install commands).
2. Add environment variables for the **Preview** environment using the *staging* Supabase
   project. Leave `CREDENTIAL_VERIFIED_SERVICES` empty unless you are testing the request form.
3. Every push to a branch produces a preview deployment: that is staging. Previews send
   `Disallow: /` in robots.txt, so they are not indexed. Enable Vercel Deployment Protection
   so previews are not public.
4. Smoke test the preview: all 13 pages, the three forms (rows appear in Supabase), mobile
   navigation, `/manifest.webmanifest`, and response headers.
5. Production: add the same variables for the **Production** environment with the production
   Supabase project and the real domain in `NEXT_PUBLIC_SITE_URL`. Do not promote until
   [LAUNCH_CHECKLIST.md](LAUNCH_CHECKLIST.md) is complete.

## Continuous integration

`.github/workflows/atlas-lounge-ci.yml` runs lint, typecheck, unit tests, database tests
(against a PostgreSQL service container), the production build, and the browser tests on every
push and pull request that touches `atlas-lounge/`.
