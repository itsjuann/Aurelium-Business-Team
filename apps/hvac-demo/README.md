# HVAC demo CRM and booking endpoints

One small service for the HVAC demo line (`clients/_demo-hvac/receptionist/script.md`). It gives the receptionist a
calendar to book into and gives Juan a CRM screen to share on Call 2, so the owner watches their own call land.

**Status: live on Render at commit `07b2c0e` (third deploy, 2026-11-18 late evening; first deployed at `cea6910`)**, approved by Juan after a Security Reviewer
"go with conditions". Every later deploy is its own approval; auto-deploy is off.

| | |
|---|---|
| Address | https://aurelium-hvac-demo-2sqc.onrender.com |
| Render service | `aurelium-hvac-demo-2sqc` (`srv-dbv2lvl6e07s73ai3m60`), free plan, Virginia, blueprint `apps/hvac-demo/render.yaml` |
| Secrets | `SAVE_LEAD_WEBHOOK_SECRET` and `DEMO_CRM_VIEW_KEY`, generated on Render, visible only on the service's Environment page |
| Smoke test after deploy | `/healthz` 200, `/api/state` 401 without a session, bad-secret tool call 401, bad sign-in 401, security headers present |

The free plan sleeps when idle and loses its data on restart. Open `/healthz` a minute before a demo.

- No dependencies. Node 20 or newer.
- Fictional seed customers only (555-01xx numbers, "Sample data" tag). The only real data is what an owner says on
  their own demo call.
- Nothing is sent anywhere. Texts are shown on screen as queued, never delivered.

## What is in it

| Route | Who calls it | What it does |
|---|---|---|
| `POST /tools/check_availability` | ElevenLabs tool | Up to 3 open windows with the phrase to say. Urgent always gets at least 2 |
| `POST /tools/book_appointment` | ElevenLabs tool | Books a window offered in the same call. One job per call; booking again moves it |
| `POST /tools/save_lead` | ElevenLabs tool | Saves a call-back lead. One lead per call |
| `GET /` | Juan's browser | The CRM screen (asks for the access key) |
| `GET /healthz` | Anyone | Wake-up check, no data |

Field names, types and limits match section 6 of the script. Windows are 8–11, 11–2 and 2–5, two jobs per window,
in America/New_York. Urgent calls are offered today when a window is at least 30 minutes away; routine calls start
tomorrow and skip Sundays.

## Revenue, pipeline and the guarantee tracker (live since `07b2c0e`)

- "Set up demo" takes the owner's average service call and average install from Call 1. Until they are typed in, the
  screen uses $400 and $10,000 and labels them as example values.
- A booked repair or tune-up counts as booked revenue at the service-call average. An estimate counts as open
  pipeline at the install average until Juan clicks "Mark estimate visit done" and then "Mark estimate won".
- The header shows revenue booked by the system and open pipeline. The guarantee bar shows booked revenue against
  the $15,000 in 90 days. Only jobs that came in through the AI receptionist are counted; sample jobs never are.
- The pipeline board has five stages: New lead, Visit booked, Job done, Estimate out, Install won.
- Also fixed here: a first booking lost its customer name, phone and address on screen (present in the version
  that was live at `51502f8`).

## Light and dark mode (live since `07b2c0e`)

The screen follows the device's light or dark setting. The "Dark mode" / "Light mode" button, on the sign-in card
and in the header, switches it and the choice is remembered in that browser. Only the theme choice is stored
there; no call data is.

## Run it locally

```bash
cd apps/hvac-demo
export SAVE_LEAD_WEBHOOK_SECRET="$(openssl rand -hex 32)"
export DEMO_CRM_VIEW_KEY="$(openssl rand -hex 32)"
npm start
```

Open http://localhost:8787 and paste the value of `DEMO_CRM_VIEW_KEY`. Run the tests with `npm test`.

## Settings (environment only, never in the repo)

| Name | Required | Purpose |
|---|---|---|
| `SAVE_LEAD_WEBHOOK_SECRET` | yes, 32+ characters | Shared secret for the three tool endpoints. Also stored in the ElevenLabs tool secret store |
| `DEMO_CRM_VIEW_KEY` | yes, 32+ characters, different from the above | Access key for the CRM screen |
| `TRUST_PROXY` | set `1` behind the host's proxy | Rate limits by the real client address |
| `REQUIRE_HTTPS` | set `1` in production | Refuses anything that did not arrive over HTTPS |
| `DEMO_DATA_DIR` | no | Where the state file lives. Default `apps/hvac-demo/data/` (git-ignored) |
| `ALLOW_STATIC_SECRET` | no | Set `0` to accept signed requests only (see below) |
| `PORT` | no | Default 8787 |

The service refuses to start if either secret is missing, short, or the two are the same.

## How the tools authenticate

Header `X-Aurelium-Signature`, checked in constant time before the body is parsed. Two forms are accepted:

1. **Signed:** `t=<unix seconds>,v1=<hex HMAC-SHA256(secret, t + "." + raw body)>`. Rejected if older than 5 minutes.
2. **Static:** the shared secret itself.

The checklist asks for the signed form. ElevenLabs webhook tools are expected to send only a fixed secret header
taken from their secret store, with no per-request signing, so the static form is on by default. **Confirm this
in the ElevenLabs tool settings at build.** If signing is available, set `ALLOW_STATIC_SECRET=0`. A signed
request is accepted once. The static form has no replay protection; a replayed booking only repeats the same job
(idempotent on `conversation_id`). This exception needs the Security Reviewer's explicit acceptance.

## Checklist status (`docs/webhook-security-checklist.md`)

| Item | Status |
|---|---|
| HTTPS only, HSTS | HSTS header sent; `REQUIRE_HTTPS=1` enforces it behind the host's TLS |
| Authenticate every request, constant time, 401 first | Done, tested |
| `X-Aurelium-Signature` with timestamp and 5 minute window | Done for the signed form; static form is the documented exception above |
| 200 only after validation and persistence; generic errors | Done. Errors name the schema's own fields that failed, never values and never sender-supplied names |
| Strict schema, unknown fields rejected, E.164 phones | Done, tested. One deliberate softening: free-text summaries longer than the limit are cut to the limit instead of rejected, so a long summary cannot fail a booking mid-demo. Anything over 2,000 characters is rejected |
| Idempotency on `conversation_id` | Done, tested |
| Rate limits, 429 | Split so anonymous traffic cannot use up the tools' or a signed-in screen's allowance: 120 a minute for authenticated tool calls, 20 a minute per source for failed tool auth, 120 a minute per source and 600 overall for anonymous requests, 10 a minute per source for sign-in. Tested |
| Caller text never treated as instructions | Nothing here calls an LLM. The screen renders caller text as text only; CSP blocks inline script |
| Notification recipients from config | Nothing is sent |
| Logs: IDs and status only | Done, tested |
| Timeouts, graceful failure | 15 second request timeout, 16 KB body cap, generic 500 |
| Server-side env only | Done. No build step, no public env |
| Dependencies locked and audited | No dependencies |
| Preview protection, branch protection, scoped deploy token | Open: set on the host at deploy |
| Reviewed and signed; Juan approves the deploy | Open |

## Security review, 2026-11-18

Website & App Security Reviewer: **pass with conditions**. Fixed after the review: the anonymous-flood lockout
(the one must-fix), health check above the HTTPS rule, sign-out now ends the session, signed requests accepted
once, bad URLs return 400, sender-supplied field names no longer echoed, records capped at 500 of each kind.
The fixes have tests; the reviewer has not re-read them.

Security Reviewer, same day: **go with conditions** for commit `cea6910`. The static-secret form is accepted for this
demo service only; the value must never be reused for a client endpoint.

Conditions still open:

- Check which address Render puts last in `X-Forwarded-For`. Per-source limits rely on it. Not checked yet.
- Client Data Protection sign-off before the first real prospect call.
- The instance must be reachable only through the host's proxy.
- Security Reviewer accepts or refuses the static-secret form.
- Preview protection, branch protection, a project-scoped deploy token, both secrets in the host's secret store.
- An outsider who finds the URL can still use up the shared sign-in allowance (60 a minute). Sign in before the demo starts.

## Data rules

- CRM data sits behind a 12-hour session cookie (HttpOnly, Secure, SameSite=Strict). "Sign out" ends every open session. The tool secret does not open it.
- "Clear demo" deletes every call and puts the placeholder shop name back. Run it after each demo.
- Call data older than 30 days is deleted automatically (hourly check). Sample data stays.
- The state file is written with owner-only permissions and is git-ignored.

## Before each demo

1. Open the CRM and sign in. If the host sleeps when idle, open `/healthz` a minute early to wake it.
2. "Set up demo": type the prospect's shop name and towns. They are held in this service only, never in the repo.
3. After the call: "Mark job complete" shows the review request. "Clear demo" when the debrief is done.

## Not built

- No real texts, emails or calendar invites.
- No connection to ServiceTitan, Housecall Pro or Jobber. That is a per-client build.
- One screen, one shared access key. This is a demo, not the client CRM.
