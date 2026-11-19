# Proposal notes: Juan only, never handed to the owner

Template: `clients/_template-hvac/proposal.md`. Sources: `business/aurelium-motion.md` section 2 and `outreach/hvac/sales-call-15k.md`. Status: DRAFT until the open terms below are settled.

**This is not legal advice. Have a lawyer review the guarantee and exclusivity wording, and the open terms below, before the first signature.**

## Fill it in under ten minutes

1. Copy this folder to `clients/<slug>/`. Work on the copy, never the template.
2. From your Call 1 notes, in this order:
   - Shop name (2 places) and owner name (2 places), date.
   - Their three numbers: missed calls a month, average service call, average install. Use their words and their figures. If they gave a range, write the range. If they did not give one, cut that sentence; do not estimate for them.
   - Their towns (question 8 on Call 1). List each town by name. No "and surrounding areas".
   - Dispatch software and plan (question 7), plus the integration route in one plain line.
3. Go-live date: 14 days after the day you expect signature, payment and intake to all be in. Leave it blank if the integration route is not confirmed.
4. How the first payment is taken: invoice or payment link. Have it ready to send the same day (flag to `finance-controller`).
5. Offer expiry date: your call. No validity period is set anywhere; 14 days is the house habit from older proposals, not a decided term.
6. Cut any row in "What you get" that the owner did not care about on Call 1. Keep the three promises.
7. Search the file for `[BLANK`. Zero hits before it prints. Delete the comment at the top.
8. Print-check: it must fit one page. The template is about 580 words with two tables and has not been test-printed; expect 10pt type and narrow margins. If their town list is long, cut a table row before shrinking the type.

## Two things to confirm before it goes out

1. **Integration route for their software and plan.** Confirm a direct connection works on the plan they are on. If it does not, agree the fallback with the owner (the playbook's example: the job arrives by email or text to the dispatcher) and write that into promise 1. Do not write a go-live date until this is known.
2. **Their towns against existing clients.** Check every town against the towns written into every signed HVAC agreement under `clients/`. Today there are none, so the first deal is clear. There is no territory register in the repo yet; start one with the first signature.

## Open terms: working assumptions and gaps

Nothing below is decided in the business file or the playbook. Each is either a blank in the proposal or wording a lawyer should read.

| # | Term | Where it stands | What is needed |
|---|---|---|---|
| 1 | When monthly billing starts | Assumed at go-live; marked [CONFIRM] in the business file. Left as a blank in the proposal. | Your decision, then written into the business file. |
| 2 | "Booked job" and its dollar value for the guarantee | Sources say only "counted from the system's own records". Blank in the proposal. | Define: quoted price, invoiced amount or average ticket; whether cancelled, no-show and unsold-estimate bookings count; whether jobs from existing customers count. |
| 3 | What the guarantee pause covers | "Monthly fee pauses, we keep working at no charge." | Are paused months waived or owed later? When does billing resume? Does the 90-day clock stop if the client delays (for example, call forwarding not switched on)? |
| 4 | Pause or cancellation by the client | Not stated anywhere. Blank. | Notice period; whether exclusivity and the guarantee end on pause or cancel; whether a returning client gets their towns back. |
| 5 | Minimum term | None stated anywhere. Blank. | Your decision: month-to-month after the upfront, or a fixed first term. |
| 6 | Refundability of the $15,000 | Only the $2,500 setup fee is stated as non-refundable once the build starts. The proposal is silent on the $15,000. | Your decision and a lawyer's wording. Also define "build starts". |
| 7 | Integration fallback | Playbook says agree it before signing; no standard fallback is set. Blank in promise 1. | A standard fallback, and whether a fallback still counts as "works with your dispatch software". Who pays any fee the dispatch vendor charges for access. |
| 8 | Exclusivity scope | "One HVAC client per service area, the towns named at signing, while they are a client." | Lawyer: what "sign" covers, how a town is bounded, overlap when two shops name the same town, remedy if breached. |
| 9 | The 14-day clock | Sources say "live in 14 days". The proposal starts the clock when signature, payment and intake are all in; that start rule is our onboarding practice, not a decided term. Calendar or business days is unstated. | Your confirmation. |
| 10 | Legal entity on the signature line | [CONFIRM] in the business file (LLC or sole proprietor). Blank. | The exact legal name. |
| 11 | Usage costs inside the $1,200 | Not stated: phone minutes, texts, voice platform usage. | Your decision: all included, or a cap. |
| 12 | Data and number ownership on exit | "They own their data and their number." | Lawyer: export format and timing, who holds the website and domain, deletion timeline. |

## Rules that still apply

- No HVAC client is live. No case study, testimonial or result goes in this proposal. If the owner asks who else uses it, the playbook answer is the truth: they would be one of the first.
- The guarantee is only safe if every booked job is recorded with its source from day one. Do not sign before source tagging and the monthly report are in the build plan.
- If the proposal goes by email instead of by hand, it is a staged draft: Security Reviewer checks it, you approve and send it.
- Client-facing copy says "Aurelium Motion" or "we".
