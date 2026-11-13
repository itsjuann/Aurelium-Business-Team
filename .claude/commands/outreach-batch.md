---
description: Build one cold-email batch (leads + emails), run Compliance and Security review, stage for Juan's approval. Nothing is sent.
argument-hint: [batch size, default 25] [vertical, optional]
---
Run the outreach batch pipeline. Arguments: `$ARGUMENTS` (batch size, optional vertical such as "dental" or "HVAC").

Read `business/aurelium-motion.md` first.

**Step 1 — Cold Outreach SDR** (`.claude/agents/cold-outreach-sdr.md`): build the batch.
- Find Greater Philadelphia businesses with a live job posting for receptionist / front desk / office coordinator / scheduler. Use web search if available; otherwise produce the exact search queries and a lead-sheet template Juan can fill.
- For each lead: business, vertical, city, job-post source and date, decision-maker name/role if public, website, phone, why-now line. No personal data beyond what is on the public posting or the business website.
- Write the 3-step sequence for this batch (Day 1, Day 4, Day 9) in Aurelium voice: under 90 words, honest subject line, one soft CTA for a 15-minute demo, no pricing.
- Write the batch to `outreach/batches/YYYY-MM-DD-<vertical>.md` and personal data to `outreach/batches/YYYY-MM-DD-<vertical>-leads.csv` (git-ignored).
- Check every address against `outreach/suppression-list.csv` and drop matches.

**Step 2 — Outreach Compliance Officer** (`.claude/agents/outreach-compliance-officer.md`): check every email for CAN-SPAM (physical mailing address, working opt-out, honest subject and From), sending-limit compliance (per-mailbox daily cap, warm-up stage), and suppression. Record PASS/FAIL per email with fixes.

**Step 3 — Security Reviewer** (`.claude/agents/security-reviewer.md`): confirm no secrets, no client data, no fabricated claims, sending domain is the approved secondary domain (not aureliummotion.com, not gmail.com). Issue APPROVE / BLOCK.

**Step 4 — Present to Juan**: batch summary table, the three email templates, one fully personalized example, the compliance and security verdicts, and the exact next step ("reply 'approved' to load into [sending tool]"). Do not send, schedule, or create Gmail drafts in this command. If any **[CONFIRM]** item in the business file blocks sending (physical address, sending domain), say so at the top.
