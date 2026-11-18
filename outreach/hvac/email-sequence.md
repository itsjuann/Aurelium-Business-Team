# HVAC email sequence (v2, 2026-11-18, whole-system positioning) — STAGED, NOT SENDABLE YET

Owner: Cold Outreach SDR. Audience: owners and general managers at HVAC shops in the Philadelphia region, starting with campaign **HVAC Apollo Nov 2026** in Aurelium Motion HQ. Three touches over nine days. Stop the moment anyone replies.

**Status: BLOCKED.** Nothing here may be sent, loaded into a sending tool, or turned into a Gmail draft until the mailing address is in `business/aurelium-motion.md` and the secondary sending domain passes SPF, DKIM and DMARC and is past warm-up day 7. Then Compliance, Security and Juan's approval, per batch.

Merge fields: `{{first_name}}`, `{{company}}`. Pricing never appears. No attachments, no links except the signature.

## Touch 1 — Day 1
Subject: `after-hours calls at {{company}}`

Hi {{first_name}},

I'm Juan. I run Aurelium Motion here in Philadelphia.

We build one front-office system for HVAC shops. An AI receptionist answers and books every call. The same system follows up on unsold estimates, brings past customers back for tune-ups, and asks for a review after each job. You see all of it in one dashboard.

Worth 30 minutes to see it running with {{company}}'s name on it?

Juan Jackson
Aurelium Motion · Philadelphia
[CONFIRM: physical mailing address]
Reply "no" and I won't email again.

## Touch 2 — Day 4 (same thread)
Subject: `the three leaks`

Hi {{first_name}},

One more angle on this.

The missed call is only the first leak. The estimate that never got a second call is the second. The customer who has not heard from you since last winter is the third.

One system covers all three, and a weekly report shows what it booked. On a call we run the math with your numbers.

Open to 30 minutes?

Juan Jackson
Aurelium Motion · Philadelphia
[CONFIRM: physical mailing address]
Reply "no" and I won't email again.

## Touch 3 — Day 9 (same thread)
Subject: `leaving this here`

Hi {{first_name}},

I'll leave it here.

If missed calls, quiet estimates or slow seasons ever become a problem at {{company}}, the fastest way to judge this is to see it built with your name on it. The receptionist tells callers it's an AI if they ask.

Reply "demo" and I'll send a few times.

Juan Jackson
Aurelium Motion · Philadelphia
[CONFIRM: physical mailing address]
Reply "no" and I won't email again.

## SDR self-check
Honest From (Juan Jackson, Aurelium Motion) ✔ · subjects describe the body, no "re:", no implied relationship ✔ · says who we are in the first two lines ✔ · "AI receptionist" named in Touch 1 and the AI disclosure repeated in Touch 3 ✔ · sells the whole system, not the receptionist alone ✔ · no pricing ✔ · no client names, results or statistics ✔ · opt-out line on every touch ✔ · mailing address ✘ placeholder · sending domain ✘ not purchased.

## Compliance review — 2026-11-18 (Outreach Compliance Officer)
| Touch | Honest From | Honest subject | Address | Opt-out | No pricing | No fabricated claims | Verdict |
|---|---|---|---|---|---|---|---|
| 1 | ✔ name; ✘ no approved sending address | ✔ | ✘ [CONFIRM] | ✔ | ✔ | ✔ | FAIL (address, domain) |
| 2 | same | ✔ | ✘ [CONFIRM] | ✔ | ✔ | ✔ | FAIL (address, domain) |
| 3 | same | ✔ | ✘ [CONFIRM] | ✔ | ✔ | ✔ | FAIL (address, domain) |

Copy passes every content check. Suppression list checked against the 12 leads on 2026-11-18: 0 matches. Sending cap today: 0.
**VERDICT: FAIL, blocked on the mailing address and an approved, authenticated, warmed sending domain.**

## Security review — 2026-11-18 (Security Reviewer)
Class: email. Inputs: Compliance FAIL (infrastructure facts only) · Secrets PASS (no keys, no client data in this file) · personal data: none here, the 12 contacts live in HQ.
Checks (v2 copy re-read): no claims we cannot back; every feature named (call answering and booking, estimate follow-up, tune-up reactivation, review requests, dashboard, weekly report) is in Juan's offer sheets; no results, clients or statistics are stated; "AI receptionist" is named in Touch 1 and the AI disclosure is repeated in Touch 3.
**VERDICT: BLOCK** until the address and domain exist. Fix owner: Juan. Re-review is a five-minute read once both land.
