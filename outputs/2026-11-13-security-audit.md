# Aurelium Motion security audit — 2026-11-13

Scope: all (secrets, client data, outreach compliance, website & app). Run by the security team, read-only on every external system; nothing was rotated, deleted, deployed, sent or changed. Files created: this report and `outputs/access-inventory.md`. Branch: `claude/sharp-wozniak-oaqxpl` (2 commits; HEAD `6659fe7` pushed to origin during this audit; `main` not yet updated). Note: another agent staged `outreach/batches/2026-11-13-dental.md` and committed the repo while this audit ran; both were re-checked before this report was finalized.

**Verdict: CLEAR WITH CONDITIONS.**

Nothing is leaking. No secrets in the repo or its history, no customer data anywhere in the tree, no clients live, nothing deployed. Two operating channels are **BLOCKED** on facts only Juan has:

- **Cold outreach is BLOCKED** until the business file has a physical mailing address, an approved secondary sending domain with passing SPF/DKIM/DMARC, and a named sending tool. One batch is staged (`outreach/batches/2026-11-13-dental.md`, dental/ortho, 0 verified leads, 0 recipients); its copy passes every content check and it is correctly marked BLOCKED by the SDR, Compliance and the Security Reviewer. It stays blocked.
- **Any medical, dental, therapy or legal client go-live is BLOCKED** until the BAA question in the business file is decided.

Everything else is a Medium or Low with an owner and a date.

## Top 3 for Juan

1. **Fill the three outreach facts in `business/aurelium-motion.md`**: physical mailing address, secondary sending domain (e.g. aureliummotion.co), sending tool (Instantly or Smartlead). Then publish SPF/DKIM/DMARC on that domain. The outreach channel stays blocked until all four are true. Goal 1 (5 demos/week) depends on this.
2. **ElevenLabs, two settings before the first live demo or client number**: (a) set conversation retention on "Aurelium Motion Receptionist" (it is `zero_retention_mode = false` with no retention period set, so every demo caller's voice and transcript is kept indefinitely); (b) when the `save_lead` endpoint is built, create a second API key scoped to agents/conversations only and put the webhook shared secret in the tool's secret store, not the prompt.
3. **Lock the gates on GitHub and trim the connectors**: the repo (including the `.gitignore` that keeps client data out of git) was committed and pushed to the working branch during this audit, so the protections now exist on the remote; merge to `main` is your call. Then turn on GitHub secret scanning + push protection, add a gitleaks pre-commit hook, and disconnect the connectors with no job (Higgs, Klaviyo, Shopify, Windsor.ai, Composio, the duplicate ElevenLabs).

## Findings

Severity guide: Critical = active exposure or a legal violation if sent · High = missing control on a live path · Medium = hygiene with a plausible path to harm · Low = best practice. Owner is Juan for every execution step (solo founder); the agent named stages and verifies.

| # | Domain | Finding | Severity | Fix | Owner | Due |
|---|---|---|---|---|---|---|
| F1 | Outreach | Physical mailing address is **[CONFIRM]**. Any email sent without it violates CAN-SPAM §7704(a)(5). The staged dental batch carries a labeled `[CONFIRM: physical mailing address]` placeholder in every footer and is marked BLOCKED, so this is a block, not an exposure; it becomes Critical the moment any touch is loaded into a sending tool or a Gmail draft | **High** | Write the address into `business/aurelium-motion.md` §1; SDR replaces the placeholder | Juan · Outreach Compliance | Before first send |
| F2 | Outreach | No approved secondary sending domain or sending tool; business mailbox is free `aureliummotion@gmail.com`. SPF/DKIM/DMARC cannot be verified from this session (no `dig`, DNS blocked) | **High** | Confirm domain + tool in the business file; publish SPF, DKIM, DMARC `p=none; rua=`; verify with the checks in §3 below; never send cold email from gmail.com or aureliummotion.com | Juan · Email Deliverability · Outreach Compliance | Before first batch |
| F3 | Client data | ElevenLabs agent "Aurelium Motion Receptionist": `zero_retention_mode = false`, no retention period documented or set. Demo callers (prospects) are real people whose audio and transcripts will be kept indefinitely by default | **High** once the first prospect calls it; Medium today | Set conversation retention to 30 days (7 if any medical demo), or enable zero-retention; record the setting in `outputs/data-protection-policy.md` | Juan · Client Data Protection | Before first live demo; no later than 2026-11-20 |
| F4 | Client data | BAA decision **[CONFIRM: do we sign BAAs?]** is open while dental/medical is the #1 target vertical. PHI is likely in call content | **High** (gate) | Decide yes/no; if yes, confirm ElevenLabs BAA availability on the current plan and the LLM path (Claude Haiku via ElevenLabs); if no, script receptionists to collect no symptoms and sell lead-capture-only to medical | Juan · Client Data Protection | Before any medical client proposal is sent |
| F5 | Secrets | **Resolved during audit.** At audit start the `.gitignore` client-data rules, `.env.example`, `SECURITY.md`, agents and policies were uncommitted (1 commit, 2 tracked files). Commit `6659fe7` (34 files, 0 secrets, 0 data files) landed and was pushed to `origin/claude/sharp-wozniak-oaqxpl` mid-audit; re-scanned clean. `main` still has only the initial commit, so the protections are not on the default branch yet | **Low** (was Medium) | Open a PR and merge to `main` when Juan is ready; nothing further for security | Juan | 2026-11-20 |
| F6 | Secrets | No secret scanner installed (`gitleaks`, `trufflehog` absent), no `.pre-commit-config.yaml`, GitHub secret scanning / push protection status **unknown** | **Medium** | Install gitleaks; add `.pre-commit-config.yaml` with the gitleaks hook; enable Secret scanning + Push protection in GitHub repo Settings → Code security | Juan · Secrets & Access | 2026-11-20 |
| F7 | Secrets | Connectors with scope wider than their job: Gmail can **send/trash** (needed: read + draft); Buffer can **publish** (needed: drafts/ideas); GitHub scope unknown, likely all repos; Vercel and Render hold **admin** with zero projects; ElevenLabs connected **twice** at admin level. See `outputs/access-inventory.md` | **Medium** | Disconnect the duplicate ElevenLabs connector; disconnect Vercel/Render until a project exists; re-issue GitHub as a fine-grained token for this repo only; accept Gmail/Buffer over-grant only because the approval gate is procedural, and record that acceptance | Juan · Secrets & Access | 2026-11-20 |
| F8 | Secrets | Five connectors with **no role in the business**: Higgs (publish/spend), Klaviyo (**can send email campaigns**), Shopify (customer data), Windsor.ai (can change ad budgets and post), Composio (proxy-executes other apps). Each is an ungoverned send/spend/publish path | **Medium** | Disconnect all five unless Juan names a use; remove the 16 unconnected plugin MCP servers so they do not connect later | Juan · Secrets & Access | 2026-11-20 |
| F9 | Secrets | `.gitignore` gaps: `*.csv` outside `outreach/` (e.g. `outputs/leads.csv`) not ignored; `clients/*/*.json` call exports not ignored; `transcripts/`/`recordings/` only ignored under `clients/*/`; `.ogg`/`.webm`/`.flac` not ignored. Verified with `git check-ignore` | **Low** | Recommended additions (not applied by this audit): `*.csv` + `!outreach/suppression-list.csv.example`, `**/recordings/`, `**/transcripts/`, `clients/**/*.json`, `*.ogg`, `*.webm`, `*.flac` | Juan · Secrets & Access | 2026-11-20 |
| F10 | Secrets | `.env.example` lacks `SAVE_LEAD_WEBHOOK_SECRET` and `GITHUB_TOKEN`; no rotation log existed (created in `outputs/access-inventory.md` §4) | **Low** | Add the two names with scope comments | Secrets & Access | 2026-11-27 |
| F11 | Client data | `outputs/data-protection-policy.md` exists and is sound, but `clients/_template/` has no `data-policy.md` skeleton, the flow map omits the LLM hop (Anthropic Claude via ElevenLabs) and there is no retention row for **prospect demo calls** | **Low** | Add `clients/_template/data-policy.md`; add LLM hop and demo-call row to the master policy | Client Data Protection | 2026-11-27 |
| F12 | Outreach | Warm-up caps disagree across files: business file §6 "under 30/day for 3 weeks"; agent file "30/day weeks 1–3, 50 weeks 4+"; `outreach/COMPLIANCE.md` "10/10/20/30/50 by week"; the new `outputs/sending-caps.md` (written mid-audit) "0/10/20/30/50 by 7-day block, 50 hard max, today's cap 0". Agents will pick different numbers | **Low** | `outputs/sending-caps.md` is the strictest and the one `COMPLIANCE.md` names as authoritative; align the business file §6 and the agent file to it | Email Deliverability · Outreach Compliance | 2026-11-20 |
| F13 | Web & app | `save_lead` tool exists on the ElevenLabs agent but its destination endpoint, auth header and secret storage could not be inspected read-only this session; no code exists in the repo to review | **Medium** (gate) | Before any phone number is assigned: Receptionist Builder documents the tool's URL + auth header name; the endpoint is reviewed against `docs/webhook-security-checklist.md`; `agents_get_tool` read in the next audit | Receptionist Builder · Web & App Security | Before first number assignment |
| F14 | Web & app | aureliummotion.com headers could not be checked (session proxy refused CONNECT to the host, HTTP 403 from the gateway; no `dig`). Unknown: HSTS, CSP, forms, third-party scripts, whether primary-domain DNS authorizes any mailer | **Low** (nothing deployed by us; site state unknown) | Run the checks in §4 from Juan's machine or a session with network access | Web & App Security | 2026-11-20 |
| F15 | Outreach / Client data | The staged batch file `outreach/batches/2026-11-13-dental.md` is **not git-ignored** (only `*.csv` under `outreach/` is) and lists nine real dental practices by name with job-posting URLs as "unverified candidates", plus ~15 named disqualified businesses. No person names, emails or phones (verified by grep). This is class E prospect data, which the data-protection policy routes to the git-ignored lead CSV, not a tracked `.md` | **Low** | Keep the `.md` as the template and verdict record; move candidate and disqualified business rows into `outreach/batches/2026-11-13-dental-leads.csv` (already git-ignored) before the file is committed. Rule for the SDR: business names go in the CSV, the `.md` holds copy, queries and verdicts | Cold Outreach SDR · Outreach Compliance | Before the batch file is committed |
| F16 | Outreach | Files that other files rely on were missing at audit start. `outputs/sending-infrastructure.md` and `outputs/sending-caps.md` were written by Email Deliverability during the audit (scanned: no secrets, no personal data; they propose `aureliummotion.co` + `getaurelium.com` on Instantly, Google Workspace mailboxes, SPF/DKIM/DMARC templates, `p=none` → `p=quarantine` after 14 clean days, and a 0-send warm-up through 11/23). Still missing: `outreach/suppression-list.csv`, `outreach/experiments.md`, `outputs/threat-model.md`. Note the infrastructure plan is a **proposal** until Juan confirms it in the business file; domains and the Instantly plan are a spend (Finance + Security sign-off) | **Low** | SDR creates the suppression CSV from the example; Security Reviewer writes the threat model at the next audit; Juan confirms the infrastructure plan and writes the chosen domain and tool into `business/aurelium-motion.md` §4 | SDR · Security Reviewer · Juan | 2026-11-20 |

## Section reports

### 1. Secrets & Access

Scan scope: working tree (36 files incl. the staged batch and this audit's outputs) + full git history (2 commits, 34 tracked files; the second commit landed mid-audit and was re-scanned) · Tools: `grep -rInE` and `git log -p --all` / gitleaks **not installed** / trufflehog **not installed**

Patterns scanned: `sk_`, `sk-`, `xi-api-key`, `AC[0-9a-f]{32}`, `SK[0-9a-f]{32}`, `ghp_`, `gho_`, `github_pat_`, `AIza`, `-----BEGIN`, `Bearer `, `password=`, `passwd=`, `token=`, `secret=`, `api_key=`, plus a 32+ character high-entropy sweep over `.md`, `.json`, `.yaml`, `.csv`.

| # | Finding | Location | Severity | Fix | Owner | Due |
|---|---|---|---|---|---|---|
| S1 | **No secrets found** in working tree or either commit. The only grep hits are the pattern lists inside `.claude/agents/secrets-access-guardian.md` and this report (false positives). Zero high-entropy tokens. No `.env`, CSV, JSON or audio file is tracked | repo | — | none | — | — |
| S2 | Protections committed and pushed to the working branch during the audit (F5); `main` not yet updated | `.gitignore`, `.env.example`, `SECURITY.md` on `6659fe7` | Low | PR to `main` | Juan | 2026-11-20 |
| S3 | No scanner / pre-commit / push protection unknown (F6) | repo + GitHub settings | Medium | gitleaks hook, enable push protection | Juan | 2026-11-20 |
| S4 | Over-scoped and duplicate connectors (F7), connectors with no job (F8) | Claude connectors | Medium | see `outputs/access-inventory.md` | Juan | 2026-11-20 |
| S5 | `.gitignore` gaps (F9); `.env.example` missing two names (F10) | `.gitignore`, `.env.example` | Low | recommended lines in F9/F10 | Juan | 2026-11-20 / 11-27 |

.gitignore coverage (verified with `git check-ignore`): `.env` ✔ · `.env.*` ✔ · `!.env.example` ✔ · lead CSVs (`outreach/**/*.csv`, `outreach/batches/*-leads.csv`) ✔ · recordings (`clients/*/recordings/`, `*.wav`, `*.mp3`, `*.m4a`) ✔ · transcripts (`clients/*/transcripts/`) ✔ · `clients/*/data/` ✔ · suppression list ✔ with `.example` unignored ✔ · **gaps**: CSV/JSON/transcripts outside those folders ✘ (F9)

`.env.example` present: ✔ (9 secret names, each with owner/scope comment) · `SECURITY.md` present: ✔ · Pre-commit scan: ✘ · GitHub push protection: **unknown**

ElevenLabs facts used: one agent "Aurelium Motion Receptionist" (LLM claude-haiku-4-5; tools `save_lead`, `end_call`; `zero_retention_mode = false`; no evaluation criteria; no data-collection fields; no tests; no phone numbers). Buffer: Instagram, LinkedIn, Threads connected. Vercel: no projects. Notion: needs re-authorization. Full inventory with leak impact, rotation and revoke paths: `outputs/access-inventory.md`.

### 2. Client Data Protection

Clients live: **0** · Medical/legal: **0** · BAA decided: ✘ **[CONFIRM]**

| Client | Audio retention | Transcript retention | Zero-retention mode | Fields collected | Deletion log | Status |
|---|---|---|---|---|---|---|
| (none live) | — | — | — | — | — | — |
| Aurelium Motion Receptionist (own demo agent) | **not set** (platform default) | **not set** | **off** | none configured (good: minimum necessary); `save_lead` payload fields unknown | n/a | **Set retention before first prospect demo** (F3) |

Repo check: recordings ✘ (no `.wav/.mp3/.m4a` files) · transcripts ✘ (no transcript or JSON export files) · customer numbers ✘ (phone-pattern grep `\(?[0-9]{3}\)?[-. ][0-9]{3}[-. ][0-9]{4}`: 0 hits) · email addresses: only `aureliummotion@gmail.com` (business) · `clients/` contains only `_template/README.md` ✔

Policy: `outputs/data-protection-policy.md` exists ✔ and covers data classes A–E, the per-client flow map, a retention table (30/90-day defaults, 7/30 for medical/legal, zero-retention recommended), minimum-necessary rule, BAA gate, disclosure line, 10-business-day deletion SLA, 30-day offboarding, incident steps. Assessment: adequate as a v1 master policy. Gaps are F11 (template skeleton, LLM hop, demo-call row) and the fact that it is not yet "followed" because there is nothing to follow it on; F3 is the first real test.

PHI/HIPAA: the #1 vertical is dental/medical. Until F4 is decided, Client Onboarding may not send a proposal to a medical practice that implies HIPAA-grade handling, and Receptionist Builder scripts for medical demos collect **no symptoms or health details**. PA and NJ are one-party consent states for recording; the "This call may be recorded" line stays in every client script regardless.

Findings: F3 (High-in-waiting), F4 (High gate), F11 (Low).

### 3. Outreach Compliance

**Latest batch: `outreach/batches/2026-11-13-dental.md`** (dental / orthodontic, staged by the Cold Outreach SDR while this audit ran; empty at audit start, present at the end). It already carries an appended Compliance review (FAIL on infrastructure facts, copy PASS) and a Security Reviewer sign-off note (BLOCK). This audit re-ran the checks independently on the file as it stands:

| Check | Result |
|---|---|
| Status header | "STAGED, BLOCKED. Nothing in this file may be sent, loaded into a sending tool, or turned into a Gmail draft." ✔ |
| Honest From | Juan Jackson / Aurelium Motion ✔ · sending address: **none approved** ✘ |
| Honest subjects | `your front desk opening` · `calls during the hiring gap` · `your front desk opening, last note` ✔ no "re:"/"fwd:", no implied relationship, no urgency |
| Identification in first three lines | ✔ "I'm Juan. I run Aurelium Motion in Philadelphia. We set up an AI receptionist for dental practices" |
| Physical address | ✘ `[CONFIRM: physical mailing address]` placeholder, labeled, in all four footers → **BLOCKED** |
| Opt-out | ✔ "Reply 'no' and I won't email again." on every touch; honored immediately and forever per `COMPLIANCE.md` |
| No pricing | ✔ |
| No fabricated clients, results, statistics | ✔ no proof line at all; the one example lead is fictional and labeled `[PLACEHOLDER]` |
| AI honesty | ✔ "AI receptionist" in every touch; never implies a human |
| Word count (audit's own count) | T1 **88**, T2 **85**, T3 **81** ✔ (matches SDR); personalized example **100** ✘ over the 90-word rule — copy note, not a block |
| Personal data | ✔ none: no person names, emails or phones (grep: 0 phone patterns; only `aureliummotion@gmail.com` appears). Lead CSV is header-only and git-ignored |
| Prospect business data | ⚠ nine real practices named as unverified candidates plus a disqualified list, in a tracked `.md` (F15) |
| Suppression check | ✘ not run — `outreach/suppression-list.csv` does not exist |
| Verified leads / recipients / cap | 0 / 0 / 0 ✔ (nothing can be loaded from this file) |
| Sending limits | n/a, no mailbox; the file's cap statement (0) is correct |

**Audit verdict on the batch: FAIL / BLOCKED**, agreeing with the appended Compliance and Security notes. Blocked on: physical mailing address [CONFIRM]; approved secondary sending domain with passing SPF/DKIM/DMARC [CONFIRM]; suppression list file not created; zero verified leads. Copy fixes: trim the personalized example to 90 words; keep "Dentrix-style" only when the posting names the system (already noted by Compliance). Structural fix: F15.

Standing blockers from `business/aurelium-motion.md` (every one blocks every future batch):

| [CONFIRM] item | Why it blocks | Where to fix |
|---|---|---|
| Physical mailing address | CAN-SPAM requires a valid postal address in every message | business file §1 |
| Secondary sending domain | gmail.com and aureliummotion.com are not approved cold-sending domains (business rule + deliverability) | business file §4 |
| Cold-email sending tool | No tool, no DKIM selector to publish, no opt-out link to test, no cap enforcement | business file §4 |
| Business mailbox type (Workspace vs free Gmail) | Determines whether the primary identity can even carry SPF/DKIM | business file §1 |

**Business email is a free `gmail.com` address.** What that means: SPF, DKIM and DMARC for gmail.com belong to Google, not Juan, so no domain authentication is possible; Gmail's bulk-sender rules and daily send limits (about 500/day on free accounts) apply; a spam complaint damages the account that holds the Calendar, the Drive and every client thread; and "From: Juan Jackson <aureliummotion@gmail.com>" reads as unestablished to a practice manager. Recommendation: move the primary mailbox to Google Workspace on aureliummotion.com (not for cold sending) and run cold outreach from a warmed secondary domain in the chosen tool, with Reply-To monitored.

Domain health: **could not be verified from this session.** `dig` and `nslookup` are not installed and DNS resolution is blocked in the sandbox (`getent hosts aureliummotion.com` failed; Python `gethostbyname` failed). Juan must run these from his own machine (Terminal on Mac, PowerShell `Resolve-DnsName` on Windows, or mxtoolbox.com):

```
dig TXT aureliummotion.com            # expect one v=spf1 record, ending ~all or -all, listing only Google (and later the tool) — no stray mailers on the primary domain
dig TXT _dmarc.aureliummotion.com     # expect v=DMARC1; p=none or stronger; rua=mailto:...
dig MX aureliummotion.com             # expect Google MX if Workspace; empty if the domain has no mail at all
# once the secondary domain exists:
dig TXT <secondary-domain>            # SPF includes the sending tool, ends ~all
dig TXT <selector>._domainkey.<secondary-domain>   # DKIM selector published by the tool (tool shows the selector name)
dig TXT _dmarc.<secondary-domain>     # p=none; rua= during warm-up; p=quarantine after two clean weeks
dig MX <secondary-domain>             # MX present so replies and bounces land
```
Pass criteria are in `outreach/COMPLIANCE.md` → Domain health.

Suppression list: `outreach/suppression-list.csv` does not exist yet (expected; no sends). `outreach/suppression-list.csv.example` has the correct header `email,added_on,source,reason` ✔. Git-ignored ✔ with `.example` tracked ✔.

Playbook copy review (`outreach/PLAYBOOK.md`): subjects are honest and specific ("your front desk opening", "calls while you're with patients"); no "re:"/"fwd:"; footer carries `[mailing address]` placeholder and the opt-out line "Reply 'no' and I won't email again" ✔; no pricing ✔; purchased lists and scraped personal emails disallowed ✔; TCPA rule on cold SMS present ✔.

Sending limits: three different warm-up schedules across the committed files (F12). `outputs/sending-caps.md` and `outputs/sending-infrastructure.md`, which `COMPLIANCE.md` and the batch point to, were created by Email Deliverability during this audit and scanned clean (F16); the infrastructure plan remains a proposal until Juan confirms the domain and tool in the business file.

**VERDICT for the outreach channel: BLOCKED** (on: address, secondary domain, tool, domain records, suppression file). Not a finding against any agent; the agents handled the batch exactly as the gate requires. These are Juan's facts.

Findings: F1, F2 (High), F12, F15, F16 (Low).

### 4. Website & App Security

Deployables in the repo: **none.** No source code, no `package.json`, no `vercel.json`, no serverless functions. Vercel: no projects. Render: not inspected this session. Nothing to review; nothing can ship without review.

Public surface, aureliummotion.com: `curl -sI https://aureliummotion.com` and `www.` both returned **HTTP 403 from the session's egress proxy** ("gateway answered 403 to CONNECT", recorded in the proxy status log), so the site itself was not reached. Unknown: TLS, HSTS, CSP, `X-Content-Type-Options`, `Referrer-Policy`, frame protection, forms and their endpoints, third-party scripts, exposed `.env`/`.git`/source maps, privacy policy and terms links, and whether the site's DNS accidentally authorizes a mailer on the primary domain.

Checks to run later (Juan's machine or a networked session), non-destructive:
1. `curl -sI https://aureliummotion.com` and `https://www.aureliummotion.com`: confirm 200/301, `Strict-Transport-Security`, `Content-Security-Policy`, `X-Content-Type-Options: nosniff`, `Referrer-Policy`, `X-Frame-Options` or CSP `frame-ancestors`.
2. `curl -sI https://aureliummotion.com/.env`, `/.git/HEAD`, `/server.js.map`: all must be 404.
3. View source: list every third-party script and every `<form action>`; confirm form endpoints are HTTPS, rate-limited, with a honeypot or CAPTCHA.
4. Confirm a privacy policy and terms page exist and are linked in the footer (needed before any lead form or receptionist recording disclosure references them).
5. securityheaders.com and ssllabs.com reports for the record.
6. The `dig TXT aureliummotion.com` result from §3: no cold-email tool `include:` on the primary domain.

Standard reviewed: `docs/webhook-security-checklist.md` is the bar the future `save_lead` endpoint must meet. It is complete on the essentials: HTTPS + HSTS, shared-secret or HMAC auth with constant-time compare and 401-before-processing, strict schema with E.164 normalization, idempotency on `conversation_id`, per-source rate limit with 429, caller text treated as untrusted (prompt-injection sink), recipients from client config only, no PII or secrets in logs, graceful failure with queue/retry, server-side env vars only, locked and audited dependencies, protected previews and production branch, dual sign-off. Suggested additions for v2 (Low, Web & App Security, 2026-11-27): a timestamp in the signed payload with a 5-minute replay window; "return 200 only after validation and persistence"; generic error bodies; the exact header name (`X-Aurelium-Signature`) so the ElevenLabs tool config and the code agree; and a line that the shared secret lives in the ElevenLabs tool **secret store**, never in the agent prompt.

Threat model for the receptionist data path (standing, for `outputs/threat-model.md` when created): assets are caller PII and call content, client notification channels, agent configs, Juan's email identity; entry points are `save_lead`/booking webhooks, website forms, notification relay, OAuth grants, deploy pipeline, DNS; trust boundary is "is this POST really from our ElevenLabs agent?", answered only by the signature check. Today every entry point except the OAuth grants (F7, F8) is unbuilt, so the live risk sits in the connectors, not the code.

Findings: F13 (Medium gate), F14 (Low).

## Open [CONFIRM] items blocking operations

| Item (business file) | Blocks | Who needs it |
|---|---|---|
| Physical mailing address (§1) | **Every cold-email batch** | Outreach Compliance, SDR |
| Secondary sending domain + cold-email tool (§4) | **Every cold-email batch**; DNS verification | Email Deliverability, Outreach Compliance |
| Business mailbox: Workspace or free Gmail (§1) | Primary-domain authentication; reply handling | Email Deliverability |
| Do we sign BAAs? (§3) | **Any medical/dental/therapy/legal client go-live**; medical proposals that imply HIPAA handling | Client Data Protection, Client Onboarding |
| Legal entity (§1) | Contracts, BAA signature block, footer accuracy | Client Onboarding, Finance |
| Demo booking link (§4) | Not a security block; needed for the CTA in every email | SDR |
| Pricing, overage, refund terms (§2) | Not a security block; proposals only | Client Onboarding |

## What this audit could not do (and why)

- Verify DNS records: no `dig`/`nslookup`, sandbox DNS blocked.
- Reach aureliummotion.com: session egress proxy refused the tunnel.
- Confirm GitHub secret scanning / push protection: repo settings not readable from here; status unknown.
- Inspect the `save_lead` tool's URL and auth config, or Render's workspace: kept to the known facts supplied and to repo-local reads, per the read-only rule.
- Run gitleaks/trufflehog: not installed.

## Next audit: 2026-11-20 (weekly during Q4 launch)

Re-check at that audit: `main` updated (F5); F3 retention set and recorded; connectors trimmed (F7, F8); gitleaks hook present (F6); the three outreach facts filled and DNS verified (F1, F2); the dental batch re-reviewed once unblocked, with business names moved to the git-ignored CSV (F15); `sending-infrastructure.md`, `sending-caps.md`, suppression CSV and `threat-model.md` created (F16); `agents_get_tool` read on `save_lead` (F13); site headers (F14).

---

### Summary for Juan (under 200 words)

Juan, the audit verdict is **CLEAR WITH CONDITIONS**. Nothing is leaking: no keys in the repo or either commit, no recordings, transcripts or phone numbers anywhere, no clients live, nothing deployed.

Two things are blocked, both on facts only you have. Cold outreach cannot start until the business file has your physical mailing address, a secondary sending domain and a sending tool, and that domain's SPF/DKIM/DMARC pass (I could not check DNS from here; the commands are in section 3). The dental batch the SDR staged today is clean copy and correctly marked blocked; it waits on the same facts. Medical and dental clients cannot go live until you decide whether we sign BAAs.

Three things this week. One: set conversation retention on the ElevenLabs receptionist; it keeps every demo caller's audio indefinitely right now. Two: the repo is pushed to the working branch; merge to main, turn on GitHub push protection, add the gitleaks hook. Three: disconnect the connectors with no job (Higgs, Klaviyo, Shopify, Windsor.ai, Composio, the second ElevenLabs) and shrink Vercel, Render and GitHub to project scope. Inventory: `outputs/access-inventory.md`. Next audit: November 20.
