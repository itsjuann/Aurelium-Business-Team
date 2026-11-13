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
| What we are | An AI growth and marketing agency. Core product is a done-for-you AI receptionist for local small businesses. Secondary services: AI-assisted marketing (short-form content, paid ads strategy, lead follow-up automation). |

## 2. Core offer: the AI Receptionist

**One sentence:** We give Greater Philadelphia small businesses a 24/7 AI receptionist that answers every call, books appointments, captures leads and texts the owner, for less than one week of a human front-desk salary per month.

**What the client gets**
- A branded AI voice receptionist built on ElevenLabs Agents (our current production platform; the agent we run ourselves is "Aurelium Motion Receptionist" on Claude Haiku 4.5 with a `save_lead` tool).
- A dedicated local phone number or call-forwarding from their existing line (Twilio or SIP trunk via ElevenLabs). Overflow / after-hours / missed-call modes.
- A custom call script: greeting, FAQ answers (hours, location, services, pricing ranges, insurance, parking), appointment booking or intake, lead capture, and escalation rules (transfer to owner, take a message, flag emergencies).
- Lead notifications by SMS and email within 60 seconds of a call ending.
- Monthly call summary report: calls answered, leads captured, appointments booked, top questions.
- Ongoing script tuning based on real transcripts.

**Pricing** **[CONFIRM — DRAFT by Juan's decision, 2026-11-13]**. Juan chose to keep these tiers as a working draft. Agents may use them for internal margin math only. **Do not quote pricing to any prospect or in any proposal until Juan replaces this line with "Pricing confirmed".**
| Tier | Setup | Monthly | Includes |
|---|---|---|---|
| Starter | $497 one-time | $297/mo | 1 number, up to 300 minutes/mo, FAQ + message-taking + lead capture, email/SMS alerts |
| Growth | $997 one-time | $497/mo | Everything in Starter + appointment booking into their calendar, 750 minutes, monthly report |
| Pro | $1,497 one-time | $797/mo | Everything in Growth + CRM/booking-system integration, bilingual (EN/ES), 1,500 minutes, quarterly script review |

Overage: $0.35/minute **[CONFIRM]**. Month-to-month, cancel any time, 14-day money-back on setup **[CONFIRM]**.
Never quote pricing in a cold email. Pricing is for the demo and the proposal.

**Why we win**
- Speed: live in 5 business days from signed proposal.
- Local: we are in Philly, we know the neighborhoods, the accents, the "is there parking" questions.
- Human-in-the-loop: Juan personally reviews the first 20 calls of every deployment.
- Honest positioning: it is a receptionist, not a replacement for the whole team. It never pretends to be human if asked.

## 3. Audience: who we sell to

**Ideal Customer Profile (ICP)**
- Local, owner-operated service businesses in Greater Philadelphia with 2–25 staff.
- They are **currently hiring a receptionist / front desk / office coordinator / scheduler** (Indeed, ZipRecruiter, LinkedIn, Craigslist, their own site). This is our primary buying signal.
- Verticals, in priority order:
  1. Dental, orthodontic and medical/dermatology practices
  2. Med spas, aesthetics, chiropractic, physical therapy
  3. Law firms (personal injury, immigration, family)
  4. Home services: HVAC, plumbing, electrical, roofing, cleaning
  5. Salons, barbershops, tattoo studios, veterinary clinics, auto repair
- Pain: missed calls = missed revenue. Front desk turnover. Paying $38k–$48k/yr plus benefits for someone who is on the phone 30% of the day. Phones ringing while the one receptionist is checking a patient in.

**The buyer:** owner, practice manager or office manager. Reads email on a phone between appointments. Skeptical of "AI". Cares about: not losing calls, not sounding robotic to patients, not spending weeks setting something up, and what happens when the AI doesn't know something.

**Disqualifiers:** enterprises, franchises with central call centers, businesses outside the Philly metro (for now), anyone who requires a HIPAA Business Associate Agreement. **Decided 2026-11-13: Aurelium Motion does not sign BAAs for now.** Medical, dental and therapy clients get lead capture and booking only; receptionists collect name, number, reason category and callback window, never symptoms or health details; shortest retention; proposals must not imply HIPAA-grade handling. Revisit when a client requires it, and anyone who wants the AI to make outbound sales calls.

## 4. Go-to-market

**Primary channel: signal-based cold email.** Find businesses actively hiring front desk staff, email the owner/manager with a specific, honest, short note that references the job post, offer a 15-minute demo where they call the receptionist live.

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

1. **Book 5 AI receptionist demos per week** from cold email, starting this week.
2. **Sign the first 5 paying receptionist clients by December 31, 2026.** **[CONFIRM target]**
3. Get the sending infrastructure right before volume: secondary domain, SPF/DKIM/DMARC, warm-up, caps per mailbox per day: zero real sends in warm-up days 1–7, then 10 → 20 → 30 through week 4, 50 from week 5 (authoritative: `outputs/sending-caps.md`).
4. Publish 3 short-form videos per week showing the receptionist handling real-sounding calls.
5. Zero security or compliance incidents: no leaked keys, no unsubscribed contact ever re-emailed, no client call data stored outside approved locations.

## 7. Non-negotiables (every agent)

- **Juan approves** anything that sends an email, spends money, publishes publicly, deploys, or touches client or customer data. Agents draft, stage and recommend; Juan clicks send.
- **Security Reviewer sign-off** is required before any of those actions is even presented to Juan for approval.
- **Never fabricate** a client name, result, statistic or testimonial. Mark placeholders as placeholders.
- **Respect opt-outs instantly and permanently.** A reply of "no", "stop", "unsubscribe" or "remove" is a suppression-list entry forever.
- **Client data stays in client folders** (`clients/<slug>/`), never in prompts committed to git, never in social posts, never in examples. Call recordings and transcripts are governed by `security` team policy in `.claude/agents/client-data-protection.md`.
