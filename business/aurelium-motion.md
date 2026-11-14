# Aurelium Motion — Business Context

> **Every agent reads this file first.** It is the single source of truth for who we are, what we sell,
> who we sell to, how we sound, and what we are trying to do right now. If something here conflicts
> with an agent's own file, this file wins. Items marked **[CONFIRM]** are working assumptions
> awaiting Juan's answer. Treat them as true until he changes them, but never present them to a
> prospect or client as fact.

## 1. The company

| Field | Value |
|---|---|
| Name | Aurelium Motion |
| Website | aureliummotion.com |
| Founder / operator | Juan Jackson (solo founder; every agent reports to Juan) |
| Business email | aureliummotion@gmail.com (Google Workspace / domain mailbox: **[CONFIRM]**) |
| Location | Greater Philadelphia, PA (serves the Philadelphia metro: Philadelphia, Montgomery, Bucks, Delaware and Chester counties, plus Camden and Burlington counties in South Jersey) |
| Physical mailing address for email footers | **[CONFIRM — pending]**. Juan is setting up a PO Box or virtual office (decided 2026-11-13). Required by CAN-SPAM; every cold-email batch stays blocked until this line holds a real address. |
| Time zone | America/New_York |
| Legal entity | **[CONFIRM]** (LLC / sole proprietor) |
| What we are | An AI growth and marketing agency. Core product is the Aurelium Front Office for HVAC: a custom CRM with an AI receptionist built in. Focus as of 2026-11-13: HVAC deals only. |

## 2. Core offer: Aurelium Front Office for HVAC

> **Focus decided by Juan on 2026-11-13: HVAC deals only.** Every other vertical is paused. The source of truth for what is included, the guarantee, the demo flow and the objection answers is Juan's offer doc, "Aurelium HVAC Offer" (https://claude.ai/artifact/T15BkbgChhJi6iLkEm2VaE). Where that doc and this file disagree on price, this file wins because it carries Juan's latest word.

**One sentence:** A custom CRM with an AI receptionist built in, for HVAC shops in the Philadelphia region: every call answered, booked and followed up, 24/7.

**What the client gets** (from the offer doc)
- AI receptionist, 24/7, in their brand voice: triages emergencies vs routine, quotes service call fees.
- Live booking onto the tech calendar, with a confirmation text to the customer.
- Custom HVAC CRM: one dashboard for every lead, call, job and customer.
- Estimate follow-up at day 2, 7 and 14. Maintenance-plan reactivation for spring AC and fall furnace tune-ups.
- Review requests after every completed job. Missed-call text back. Monthly ROI report.
- Built on ElevenLabs Agents (our own agent is "Aurelium Motion Receptionist" on Claude Haiku 4.5 with a `save_lead` tool). The offer doc mentions Vapi and Twilio for minutes; platform per client is Juan's call.

**Pricing (set by Juan, 2026-11-13)**
| Item | Amount |
|---|---|
| Setup fee | $2,500 one-time |
| Monthly (MRR) | $1,500 per month |
| Package | $6,500 **[CONFIRM: what the $6,500 covers. Working reading: the upfront package, setup plus the first three months prepaid at $500 off ($2,500 + $4,500 − $500).]** |

- Supersedes the earlier draft tiers ($297–$797/mo) and the offer doc's Growth price of $2,500/mo.
- Terms carried from the offer doc until Juan says otherwise: 6-month minimum then month to month; live in 10 days; no free trial, a live demo instead. **[CONFIRM]** the 90-day guarantee threshold: the doc's $7,500 was three months of fees at $2,500/mo; at $1,500/mo three months is $4,500.
- Pricing is discussed on the demo and in the proposal, never in cold outreach.

**Why we win**
- Local: Philly operator, not a national call center.
- The owner calls the AI live on the demo and watches the booking land in the CRM.
- One recovered install pays for months of the system; the ROI math is done with the owner's own numbers.
- Honest positioning: it says it is an AI receptionist if asked.

## 3. Audience: who we sell to

**Ideal Customer Profile (ICP): HVAC only**
- Owner-operated HVAC shops with **5 to 25 trucks**, roughly $1M–$10M revenue, in Philadelphia, the Main Line, Bucks, Montgomery, Delaware and Chester counties, and South Jersey.
- Buying signals, strongest first: running Google Local Services Ads or Google Ads (paying for calls they miss); hiring a CSR, dispatcher or receptionist; 50+ Google reviews with some saying "nobody answered"; advertising 24/7 or emergency service.
- Pain: jobs lost to voicemail after hours, on weekends and in peak season. A CSR costs $3,500+ a month and does not work nights.

**The buyer:** the owner or general manager. Skeptical of "AI", moved by missed-install math and by hearing it answer.

**Disqualifiers:** one-truck owner-operators, shops with no real call volume, big franchises with a corporate call center, anyone outside the region, any non-HVAC business for now.

**Paused verticals:** dental, medical, med spa, law, cleaning, lawn care, bars and restaurants. The offer doc's plan is to copy this offer to other verticals after three HVAC case studies. (BAA stance for when medical returns: Aurelium Motion does not sign BAAs for now; decided 2026-11-13.)

**HQ list note (2026-11-13):** the 87 HVAC leads in Aurelium Motion HQ were pulled for a website pitch. Median 8 Google reviews, 50 with no website, only 8 with 50 or more reviews. Most are too small for this offer. A new list of 5–25 truck shops is needed.

## 4. Go-to-market

**Primary channel right now: phone.** Call HVAC owners directly (live calls to business lines only; no cold texts to cell phones) and book a 30-minute demo where the owner calls the AI live. **Cold email joins once the secondary domains finish warm-up:** signal-based, to shops running ads or hiring a CSR or dispatcher.

**Secondary channels:** LinkedIn (Juan's profile), Instagram @aureliummotion and Threads, short-form video demos of the receptionist handling a real-sounding call, referrals from existing clients, local business groups (Chambers of Commerce in Montgomery/Bucks/Delaware counties, Philly BNI chapters).

**Tools in the stack (connected today)**
- ElevenLabs Agents — receptionist platform (voice, telephony, tools, transcripts)
- Gmail + Google Calendar — email and demo scheduling
- Buffer — scheduling for Instagram (@aureliummotion), LinkedIn (Juan Jackson), Threads (@xheksonsound)
- Canva — thumbnails, carousels, proposal covers
- GitHub — this repo and anything we deploy
- Vercel / Render — website and app hosting (no projects deployed yet)
- Notion — needs re-authorization before agents can use it
- Cold-email sending: **plan approved by Juan 2026-11-13** (see `outputs/sending-infrastructure.md`): secondary domains aureliummotion.co and getaurelium.com, two Google Workspace mailboxes each, Instantly for sequencing and warm-up. Juan buys the domains and mailboxes himself with 2FA; Deliverability then publishes DNS and starts the 21-day warm-up. Status: **not yet purchased**. Never send cold outreach from aureliummotion.com or a gmail.com address.
- Demo booking link: **[CONFIRM]** (Google Calendar appointment page or Cal.com)

## 5. Brand voice

- **Plain, warm, confident.** We sound like a sharp local operator, not a SaaS landing page.
- **Short sentences. One idea each.** Our emails are under 90 words. Our scripts are under 12 seconds per turn.
- **Specific over clever.** "Your receptionist posting on Indeed went up Tuesday" beats "In today's fast-paced world".
- **Honest about AI.** We say "AI receptionist". We never claim it is a person. We never claim results we have not measured.
- **Philly, lightly.** Local references are welcome when true (neighborhoods, SEPTA, parking), never forced.
- **Words we use:** AI receptionist, answers every call, books, captures the lead, texts you, live in 5 days, 15-minute demo.
- **Words we avoid:** revolutionary, cutting-edge, leverage, synergy, "I hope this finds you well", "just checking in", "quick question" subject lines, emoji in cold email, ALL CAPS, exclamation points in business email.
- **Name usage:** "Juan" in first person from Juan; "Aurelium Motion" or "we" for the company. Never "Aurelium" alone in client-facing copy.

## 6. Current goals (Q4 2026)

1. **Sign HVAC clients at $2,500 setup + $1,500/month.** Juan's cash target (set 2026-11-13): turn $4k of incoming cash into $15k–$20k collected within about two weeks. Offer-doc milestone: first signed HVAC client by December 20, 2026.
2. **Build the right list:** 200 HVAC shops with 5–25 trucks in the region, with the hottest 50 tagged (running ads or hiring a CSR). The current HQ HVAC list is mostly too small.
3. **Demos:** 2+ booked per week as the floor; the two-week cash target needs far more (see `outputs/` sprint math).
4. Get the sending infrastructure right before email volume: secondary domains, SPF/DKIM/DMARC, warm-up caps per `outputs/sending-caps.md`.
5. One piece of HVAC demo or case-study content per week.
6. Zero security or compliance incidents: no leaked keys, no unsubscribed contact ever re-emailed, no client call data stored outside approved locations.

## 7. Non-negotiables (every agent)

- **Juan approves** anything that sends an email, spends money, publishes publicly, deploys, or touches client or customer data. Agents draft, stage and recommend; Juan clicks send.
- **Security Reviewer sign-off** is required before any of those actions is even presented to Juan for approval.
- **Never fabricate** a client name, result, statistic or testimonial. Mark placeholders as placeholders.
- **Respect opt-outs instantly and permanently.** A reply of "no", "stop", "unsubscribe" or "remove" is a suppression-list entry forever.
- **Client data stays in client folders** (`clients/<slug>/`), never in prompts committed to git, never in social posts, never in examples. Call recordings and transcripts are governed by `security` team policy in `.claude/agents/client-data-protection.md`.
