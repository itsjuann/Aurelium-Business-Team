# Plan: book 5 AI receptionist demos this week — 2026-11-13

**Outcome we are buying:** 5 demos booked per week from signal-based cold email, with the first demos landing the week of Mon 2026-11-24 (the first week cold email can legally and safely send). This week's measurable outcome: every blocker cleared, infrastructure bought and warming, dental batch staged and reviewed, demo playbook ready.
**Deadline:** Fri 2026-11-14 for this week's deliverables; Mon 2026-11-24 for the first sends · **Owner of the outcome:** Juan · **Coordinator:** Chief of Staff

**Honest read before the table.** Juan, "5 demos this week from cold email" is not reachable by Sunday. The business file has no mailing address (CAN-SPAM), no sending domain or tool, no booking link, and no warm-up started; a new domain needs 7 days of warm-up before the first real send and 21 before volume. Sending anyway from gmail.com or aureliummotion.com is prohibited by the business file and would cost the brand domain. So this plan spends the week removing every blocker so the 5-per-week goal becomes true from Nov 24, and offers one optional path to demos this week through your own network (task 12), which only you can run.

| # | Task | Agent | Input | Output (file) | Due | Approval class |
|---|------|-------|-------|---------------|-----|----------------|
| 1 | Answer the four outreach [CONFIRM] facts: mailing address, sending domain/tool, booking link, BAA stance; CoS writes them into the business file | Juan → chief-of-staff | `business/aurelium-motion.md` | `business/aurelium-motion.md` (updated by CoS after Juan answers) | Thu 11/13 5pm | none (business facts) |
| 2 | Sending infrastructure recommendation: domains, mailboxes, tool, DNS templates, warm-up calendar, cost | email-deliverability-strategist | business file §4, §6.3 | `outputs/sending-infrastructure.md` | Thu 11/13 | spend → Finance + Security + Juan |
| 3 | Spend note on task 2 (amount, category, runway, cancel path) | finance-controller | task 2 | appended to `outputs/sending-infrastructure.md` | Thu 11/13 | spend (note only) |
| 4 | Security sign-off on task 2 | security-reviewer | tasks 2–3 | appended to `outputs/sending-infrastructure.md` | Thu 11/13 | spend (sign-off) |
| 5 | Buy domains, create 4 mailboxes, publish DNS, connect Instantly, start warm-up | Juan | `outputs/sending-infrastructure.md` steps 2–5 | registrar, Workspace, Instantly (no files) | Fri 11/14 | spend (executes task 2 after approval) |
| 6 | Verify SPF/DKIM/DMARC with dig; stamp warm-up dates; publish caps | email-deliverability-strategist | task 5 "DNS published" | `outputs/sending-caps.md`, `outputs/2026-11-17-deliverability.md` | Mon 11/17 | none |
| 7 | Dental/ortho batch template: 3-touch sequence, personalized [PLACEHOLDER] example, exact search queries, lead-sheet header, self-check | cold-outreach-sdr | business file, `outreach/PLAYBOOK.md`, web search | `outreach/batches/2026-11-13-dental.md` | Thu 11/13 | sends email → Compliance + Security + Juan |
| 8 | Compliance review of task 7 | outreach-compliance-officer | task 7, `outreach/COMPLIANCE.md` | appended to batch file | Thu 11/13; re-review when task 1 lands | sends email (verdict) |
| 9 | Security review of task 7 | security-reviewer | tasks 7–8 | appended to batch file | Thu 11/13; re-review with task 8 | sends email (verdict) |
| 10 | Verify 25 live dental/ortho postings (<14 days, owner-operated, in metro); build git-ignored lead sheet; validate emails; create suppression file from example | cold-outreach-sdr (Juan confirms dates if search is unreliable) | queries in batch file | `outreach/batches/2026-11-13-dental-leads.csv` (git-ignored), `outreach/suppression-list.csv` (git-ignored) | Wed 11/19 | prospect data stays local; no commit |
| 11 | Demo playbook: 15-minute structure, discovery questions, objection bank, scenarios, prep and debrief templates | discovery-demo-coach | business file §2, §3 | `outreach/DEMO-PLAYBOOK.md` | Thu 11/13 | none |
| 12 | Optional: demos this week through Juan's network (LinkedIn DMs, referral asks); if Juan says yes, Content Engine drafts one LinkedIn post as a Buffer draft | Juan; content-engine | business file §4 secondary channels | `content/weeks/2026-11-14-linkedin-demo-post.md` (not produced yet) | Fri 11/14 | publish → Security + Juan |
| 13 | Confirm the demo receptionist is dialable with fictional data; assign a number if not | receptionist-builder | ElevenLabs agent "Aurelium Motion Receptionist" | note in `outreach/DEMO-PLAYBOOK.md` | Fri 11/14 | deploy (only if a number is assigned) → Web/App + Security + Juan |
| 14 | Delivery board and blocker log for the week | delivery-manager | tasks 1–13 | `outputs/delivery-board.md` | Thu 11/13 | none |
| 15 | Juan approves the first verified batch; SDR loads it at ≤10 per mailbox per day | Juan; cold-outreach-sdr | tasks 6, 8, 9, 10 | batch file marked APPROVED with date | Mon 11/24 | sends email |
| 16 | Friday week review | delivery-manager | board, batch, demos folder | `outputs/2026-11-14-week-review.md` | Fri 11/14 5pm | none |

**Sequence:** 1 → (2 → 3 → 4) ∥ 7 → 8 → 9 ∥ 11 ∥ 14 → Juan approves spend → 5 → 6 → 10 → 8/9 re-review → 15 (Mon 11/24, warm-up day 8) · 12 and 13 run in parallel on Fri · 16 closes the week.

**Risks:**
- Juan does not answer the [CONFIRM] facts today → every date slips one day per day. Mitigation: they are the first line of today's report, with the minutes each takes.
- Temptation to send from gmail.com this week to hit the number → brand domain reputation and a CAN-SPAM violation (no address). Mitigation: Compliance FAIL and Security BLOCK are already written into the batch; the SDR has a cap of 0.
- Web-search job results are aggregator reposts with stale or missing dates; several hits were DSOs (Dental365, Smile Doctors, ProSmile) that the ICP disqualifies → wasted sends and bounces. Mitigation: no business enters the lead table until verified on the original board within 14 days; validation before load.
- HIPAA/BAA question in the first dental demo with no decision on file → improvised promise. Mitigation: playbook routes the answer to client-data-protection; BAA stance is in task 1.
- Agent-file conflict on warm-up caps (10/day in weeks 1–2 vs zero under 14 days). Mitigation: calendar takes zero for days 1–7 and ≤10 for days 8–14, written into `outputs/sending-caps.md`.
- Thanksgiving week (11/26–11/28) lands in the first send week. Mitigation: skip Thu/Fri sends; practices are closed.

**Assumptions to confirm with Juan (only the ones that change the plan):**
1. Physical mailing address exists and can go in every footer (if not, a P.O. box or registered-agent address must be arranged before any send).
2. He accepts ~$115–140 now and ~$70/month for two domains, four mailboxes and Instantly (if he wants one domain and two mailboxes, cost drops to ~$55/month and capacity still covers the goal).
3. The demo receptionist on ElevenLabs has, or can be given, a dialable number with fictional data (if not, demos need a different format and the playbook changes).
4. He is willing to use his own LinkedIn network for demos this week (task 12); if not, this week's demo count is 0 by design and the first demos come from the Nov 24 batch.
