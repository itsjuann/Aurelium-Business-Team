# HVAC email sequence (v1, 2026-11-18) — STAGED, NOT SENDABLE YET

Owner: Cold Outreach SDR. Audience: owners and general managers at HVAC shops in the Philadelphia region, starting with campaign **HVAC Apollo Nov 2026** in Aurelium Motion HQ. Three touches over nine days. Stop the moment anyone replies.

**Status: BLOCKED.** Nothing here may be sent, loaded into a sending tool, or turned into a Gmail draft until the mailing address is in `business/aurelium-motion.md` and the secondary sending domain passes SPF, DKIM and DMARC and is past warm-up day 7. Then Compliance, Security and Juan's approval, per batch.

Merge fields: `{{first_name}}`, `{{company}}`. Pricing never appears. No attachments, no links except the signature.

## Touch 1 — Day 1
Subject: `after-hours calls at {{company}}`

Hi {{first_name}},

I'm Juan. I run Aurelium Motion here in Philadelphia.

When a no-heat call comes in at 9pm and nobody picks up, that homeowner often calls the next shop.

We set up an AI receptionist for HVAC shops. It answers every call, books the job on your tech calendar, and texts you the details.

Worth 30 minutes to call it yourself and hear how it handles a no-heat call?

Juan Jackson
Aurelium Motion · Philadelphia
[CONFIRM: physical mailing address]
Reply "no" and I won't email again.

## Touch 2 — Day 4 (same thread)
Subject: `estimates that go quiet`

Hi {{first_name}},

One more angle on this.

An install estimate that goes quiet is easy to lose in a busy week. The same system follows up on unsold estimates at day 2, 7 and 14, and reaches past customers when tune-up season starts. Calls, jobs and estimates sit in one dashboard.

On the demo we run the math with your numbers. Open to 30 minutes?

Juan Jackson
Aurelium Motion · Philadelphia
[CONFIRM: physical mailing address]
Reply "no" and I won't email again.

## Touch 3 — Day 9 (same thread)
Subject: `leaving this here`

Hi {{first_name}},

I'll leave it here.

If nights and weekends ever become a problem at {{company}}, the fastest way to judge this is to call the AI yourself. It takes two minutes, and it tells you it's an AI if you ask.

Reply "demo" and I'll send the number and a few times.

Juan Jackson
Aurelium Motion · Philadelphia
[CONFIRM: physical mailing address]
Reply "no" and I won't email again.

## SDR self-check
Honest From (Juan Jackson, Aurelium Motion) ✔ · subjects describe the body, no "re:", no implied relationship ✔ · says who we are in the first two lines ✔ · "AI receptionist" named in every touch ✔ · no pricing ✔ · no client names, results or statistics ✔ · opt-out line on every touch ✔ · mailing address ✘ placeholder · sending domain ✘ not purchased.

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
Checks: no claims we cannot back; the estimate follow-up and tune-up reactivation lines match the offer doc's feature list; the Touch 1 line about homeowners calling the next shop is worded as "often", not as a statistic.
**VERDICT: BLOCK** until the address and domain exist. Fix owner: Juan. Re-review is a five-minute read once both land.
