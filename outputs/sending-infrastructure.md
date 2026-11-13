# Sending infrastructure recommendation — 2026-11-13

Owner: Email Deliverability Strategist · Spend note: Finance Controller · Sign-off: Security Reviewer · Decision: Juan
Fills the two **[CONFIRM]** items in `business/aurelium-motion.md` §4: "Cold-email sending tool and secondary sending domain" and (indirectly) the sending mailbox for the goal "book 5 AI receptionist demos per week".

## What exists today (from the business file; nothing verified against a live account)

| Item | State |
|---|---|
| Primary domain | aureliummotion.com (website). **Never used for cold email.** |
| Business mailbox | aureliummotion@gmail.com. Whether this is Google Workspace or free Gmail: [CONFIRM]. Either way, **not used for cold email.** |
| Secondary sending domain | none |
| Cold-email tool | none |
| Suppression list | `outreach/suppression-list.csv` not yet created (example file only) |
| Demo booking link | [CONFIRM] |

## Recommendation (one path)

**Two secondary domains, two mailboxes each, on Instantly, warmed for 21 days before real volume.**

| Component | Recommendation | Why |
|---|---|---|
| Domains | `aureliummotion.co` and `getaurelium.com` (availability [CONFIRM at registrar]; fallbacks in order: `aureliumreceptionist.com`, `aureliummotion.net`, `tryaurelium.com`) | Look like the brand, protect the brand domain, two domains so one bad week never stops the channel. Each 301-redirects to aureliummotion.com. |
| Registrar | Whichever Juan already uses for aureliummotion.com (one account, one 2FA) | Fewer logins, fewer secrets. |
| Mailboxes | Google Workspace Business Starter, 2 per domain: `juan@` and `j.jackson@` on each. Real name, real signature, profile photo, 2FA on. | Google-hosted mailboxes inbox well at Gmail-heavy small practices; 2 per domain is under the 3-per-domain ceiling. |
| Sending tool | Instantly (Growth plan). Alternative only if Juan already has an account: Smartlead. | Built-in warm-up, per-mailbox caps, bounce processing, unsubscribe handling, suppression sync. Gmail's own UI stays for replies and clients. |
| Email validation | Pay-as-you-go validator (ZeroBounce or NeverBounce) run on every lead sheet before load | Bounce rate target under 2%; guessed patterns are the usual cause of misses. |
| Monitoring | Google Postmaster Tools for both domains; DMARC reports to `dmarc@aureliummotion.com` (or the tool's DMARC inbox); weekly blocklist check (Spamhaus, Barracuda) | Numbers, not feelings. |
| Transactional email (receptionist lead alerts) | Stays off these domains entirely. Later: `notify.aureliummotion.com` via a transactional provider with its own SPF/DKIM. | Outreach reputation never touches client alerts. |

Capacity check: the goal needs about 125 new contacts per week (5 demos at a 4-per-100 benchmark). Four mailboxes at 10/day in warm-up week 2 is 200/week; at 30/day in week 4 it is 600/week. Capacity is not the constraint; list quality is.

## DNS records to publish (templates; exact DKIM values come from Workspace and Instantly after setup)

Repeat for each domain. `<domain>` = `aureliummotion.co`, then `getaurelium.com`.

| Type | Host | Value | Notes |
|---|---|---|---|
| MX | `@` | `1 smtp.google.com.` | Google Workspace single MX record. |
| TXT (SPF) | `@` | `v=spf1 include:_spf.google.com ~all` | One SPF record only. Add the Instantly include only if Instantly sends via its own SMTP rather than through the Google mailbox (default is through Google; then no extra include). |
| TXT (DKIM) | `google._domainkey` | `v=DKIM1; k=rsa; p=<2048-bit key from Workspace Admin > Gmail > Authenticate email>` | Generate per domain; turn on authentication after the record propagates. |
| TXT (DMARC) | `_dmarc` | `v=DMARC1; p=none; rua=mailto:dmarc@aureliummotion.com; adkim=r; aspf=r; pct=100` | Start at `p=none` for 14 clean days, then `p=quarantine`. |
| CNAME (tracking) | `track` | value provided by Instantly | Only if link tracking is ever turned on. First touches have no body links, so optional. |
| A / redirect | `@`, `www` | 301 redirect to `https://aureliummotion.com` | Registrar forwarding or a one-page site. A sending domain with no website looks like spam. |
| TXT (Workspace verification) | `@` | `google-site-verification=<value>` | Given during Workspace domain setup. |

Verification commands (run after publishing, before any send):
```
dig TXT aureliummotion.co +short
dig TXT google._domainkey.aureliummotion.co +short
dig TXT _dmarc.aureliummotion.co +short
dig MX aureliummotion.co +short
```
Then the same for getaurelium.com. Record results in `outputs/YYYY-MM-DD-deliverability.md`.

## Warm-up calendar (assumes Juan buys and publishes DNS by Fri 2026-11-14; every day of slip moves every date one day)

| Dates (America/New_York) | Warm-up day | Real cold sends per mailbox per day | Notes |
|---|---|---|---|
| Fri 11/14 | 0 | 0 | Domains bought, Workspace users created, DNS published, Instantly connected, warm-up switched on. |
| Mon 11/17 – Sun 11/23 | 1–7 | **0** | Warm-up tool only. Verify SPF/DKIM/DMARC with `dig`. Postmaster Tools added. |
| Mon 11/24 – Sun 11/30 | 8–14 | **≤10** | First real batch (dental) goes out Mon 11/24 if Compliance and Security pass and Juan approves. Skip Thu 11/27 and Fri 11/28 (Thanksgiving; practices closed). |
| Mon 12/1 – Sun 12/7 | 15–21 | **≤20** | DMARC to `p=quarantine` if reports are clean. |
| Mon 12/8 – Sun 12/14 | 22–28 | **≤30** | |
| Mon 12/15 onward | 29+ | **≤50 (hard max)** | Follow-ups count toward the cap. |

Rule reconciliation: the strategist's own file says both "weeks 1–2: up to 10 real sends/day" and "under 14 days of warm-up = cap of zero". This calendar takes the conservative reading for days 1–7 (zero) and the standing rule in `outreach/COMPLIANCE.md` for days 8–14 (≤10). Caps are published in `outputs/sending-caps.md`.

Pause rules: bounce rate over 3% in a day pauses that mailbox; spam complaints over 0.1% pause the mailbox and send copy and targeting back to the Outbound Systems Strategist; reputation drop in Postmaster Tools cuts volume 50% for a week.

## Estimated monthly cost

These are list prices as last known to the agent, not from an invoice or statement. **Confirm every figure at checkout.** Finance treats them as estimates.

| Line | Qty | Estimated cost | Cadence |
|---|---|---|---|
| `aureliummotion.co` | 1 | ~$25–35 | per year |
| `getaurelium.com` | 1 | ~$10–15 | per year |
| Google Workspace Business Starter | 4 users | ~$7–8.40 per user → ~$28–34 | per month |
| Instantly Growth plan | 1 | ~$37 | per month |
| Email validation credits | ~2,000 verifications | ~$15–20 | one-time, top up as needed |
| **Recurring total** | | **~$65–71 per month** | |
| **First-month total incl. domains and validation** | | **~$115–140** | |

## Finance Controller — spend note (2026-11-13)

```
SPEND REQUEST — Sending infrastructure (two domains, four mailboxes, Instantly, validation credits)
Amount: ~$115–140 first month, then ~$65–71/month recurring (estimates; confirm at checkout)
Category: outreach tools
Remaining in category: unknown — no monthly budget ceiling has been set yet; this would be the first line in it
Runway impact: unknown — no ledger or personal float is tracked yet (MRR today: $0, no clients live). At ~$70/month this is under 25% of one Starter-tier month ($297, [CONFIRM] pricing) once the first client signs.
Cancel path: Workspace on the Flexible plan and Instantly are month-to-month; domains are annual and non-refundable after the registrar's grace window (treat ~$50/year as sunk). Nothing here locks in beyond 30 days except the domains.
Source for figures: agent knowledge of list prices as of its training; no invoice exists yet. Every figure must be replaced with the checkout receipt in finance/ledger.md after purchase.
Recommendation: approve. This is the smallest spend that unblocks the primary growth channel; the alternative (sending from gmail.com or aureliummotion.com) is prohibited by the business file and would cost the brand domain.
Follow-ups for Finance: (1) set the outreach-tools ceiling at $100/month pending Juan; (2) record the Workspace renewal date and the two domain renewal dates in finance/subscriptions.md; (3) the pricing tiers in the business file are [CONFIRM]; margins are not yet modeled.
```

## Security Reviewer — sign-off (2026-11-13)

```
SECURITY REVIEW — Sending infrastructure purchase (outputs/sending-infrastructure.md) — 2026-11-13
Class: spend
Inputs: Compliance n/a (reviewed the design: addresses SPF/DKIM/DMARC, caps, suppression) · Secrets PENDING (Secrets & Access Guardian has not yet reviewed the Instantly API key scope or Workspace admin setup) · Data Protection n/a · Web/App n/a · Finance note present (estimates, approve)
Checks:
  1. Primary domain and free gmail.com are kept out of cold email entirely; outreach reputation cannot reach client alerts. ✔
  2. Cost is small, month-to-month except ~$50/year in domains; cancel path is clear. ✔
  3. DNS templates start DMARC at p=none with reporting, moving to quarantine; no record is published without Juan. ✔
  4. Caps and pause thresholds are numeric and published for Compliance to enforce. ✔
  5. New credentials will be created (registrar, Workspace admin, Instantly API key): none may be pasted in chat, a prompt, a repo file or an agent config; values live in .env only (.gitignore already excludes .env). ✔ as a rule, PENDING as practice
VERDICT: APPROVE WITH CONDITIONS (1. Juan makes the purchases himself in his own accounts with 2FA on registrar, Workspace and Instantly; 2. Secrets & Access Guardian reviews Instantly API key scope and the Workspace admin role before any agent is given access to either; 3. Finance replaces the estimates with receipts in finance/ledger.md within 48 hours of purchase; 4. zero real sends until Deliverability confirms SPF, DKIM and DMARC with dig and warm-up day 8 is reached)
For Juan: you are approving roughly $115–140 now and ~$70/month for the domains, mailboxes and tool that make cold email legal and safe; the one thing to know is that nothing real sends for at least 7 days after you publish DNS.
```

## What Juan must approve or do (in this order, about 45 minutes total)

1. **Approve the spend** above by replying "approved: sending infrastructure" (~$115–140 now, ~$70/month). Approval class: spend. Sign-offs: Finance ✔ · Security ✔ with conditions.
2. **Buy** `aureliummotion.co` and `getaurelium.com` at the registrar (15 min). If either is taken, use the fallbacks in order and tell the Chief of Staff so the business file is updated.
3. **Create** the Workspace users (`juan@`, `j.jackson@` on each domain) and **publish** the DNS records above (20 min). Send the DKIM values to no one; they go only into DNS.
4. **Sign up** for Instantly, connect the four mailboxes, switch warm-up on (10 min). Store the API key in `.env` only.
5. **Tell the Chief of Staff** "DNS published" so Deliverability verifies with `dig` and the warm-up calendar is stamped with real dates.
6. Separately, and blocking the batch independently of this file: **write the physical mailing address** into `business/aurelium-motion.md`.

```
REVIEW — email-deliverability-strategist (+ finance-controller, security-reviewer) — outputs/sending-infrastructure.md
Business-file check: PASS (never primary domain or gmail.com; secondary brand-like domains; warm-up before volume; under 30/day for the first 3 weeks per goal §6.3; transactional kept separate)
Voice check: PASS (plain, numeric; costs labeled as estimates, no figure presented as fact)
Approval class: spend
Reviewer sign-offs: Finance ✔ (note attached) / Security ✔ APPROVE WITH CONDITIONS / Secrets & Access pending (condition 2)
Verdict: FORWARD TO JUAN
```
