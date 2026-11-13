# Delivery board — week of Mon 2026-11-10 (updated Thu 2026-11-13)

Owner: Delivery Manager. Status: green = on track · yellow = at risk · red = blocked. All times America/New_York.
Goal this week: book 5 AI receptionist demos (business file §6.1). Honest read: **0 demos booked; cold email cannot send this week** (no sending domain, no address, warm-up not started). The week's realistic outcome is "channel unblocked and first batch staged for Mon 11/24".

| # | Item | Phase | Next step | Owner | Due | Status | Blocker |
|---|------|-------|-----------|-------|-----|--------|---------|
| 1 | Business-file [CONFIRM] facts for outreach: mailing address, sending domain/tool decision, booking link, BAA stance | Waiting on Juan | Juan answers in chat; Chief of Staff writes them into `business/aurelium-motion.md` | Juan → chief-of-staff | Thu 11/13 5pm | red | Only Juan has these facts |
| 2 | Sending infrastructure recommendation + Finance note + Security sign-off | Staged | Juan replies "approved: sending infrastructure" | Juan | Thu 11/13 | yellow | Spend approval (`outputs/sending-infrastructure.md`) |
| 3 | Buy domains, create 4 Workspace mailboxes, publish DNS, connect Instantly, start warm-up | Not started | Juan does steps 2–5 in `outputs/sending-infrastructure.md` (~45 min) | Juan | Fri 11/14 | yellow | Depends on #2 |
| 4 | Verify SPF/DKIM/DMARC with dig; stamp warm-up calendar; update `outputs/sending-caps.md` | Not started | Run after "DNS published" | email-deliverability-strategist | Mon 11/17 | yellow | Depends on #3 |
| 5 | Dental/ortho batch template (sequence, queries, lead-sheet header, Compliance + Security verdicts) | Staged, BLOCKED | Replace address placeholder once #1 lands; create `outreach/suppression-list.csv` from example | cold-outreach-sdr | Thu 11/13 (done); re-review on #1 | red | Address + domain [CONFIRM] |
| 6 | Verify 25 live dental/ortho postings (<14 days old, owner-operated) and build the git-ignored lead sheet | Not started | Run the queries in the batch file; validate emails before load | cold-outreach-sdr (Juan confirms posting dates) | Wed 11/19 | green | None yet; stale aggregator results are the risk |
| 7 | Compliance re-review and Security re-review of the first sendable batch | Not started | Same session as #6 completes | outreach-compliance-officer, security-reviewer | Thu 11/20 | green | Depends on #1, #4, #6 |
| 8 | Juan approves first batch; SDR loads into Instantly at ≤10/mailbox/day | Not started | "approved: dental batch 2026-11-20" | Juan | Mon 11/24 | green | Warm-up day 8 earliest |
| 9 | Demo playbook (structure, questions, objection bank, templates) | Done | Juan reads before first demo | discovery-demo-coach | Thu 11/13 | green | — |
| 10 | Demo phone number: confirm the ElevenLabs receptionist is dialable with fictional data; assign a number if not (deploy class) | Not started | Receptionist Builder checks; if a number is needed, Security sign-off then Juan approves | receptionist-builder | Fri 11/14 | yellow | [CONFIRM] whether a number exists |
| 11 | Demo booking link (Google Calendar appointment page or Cal.com) | Waiting on Juan | Juan creates it (10 min) and writes it into the business file | Juan | Fri 11/14 | red | Only Juan can create it |
| 12 | Demos this week via warm channels (Juan's LinkedIn network, referrals) | Proposed | Juan decides yes/no; if yes, content-engine drafts one LinkedIn post as a Buffer draft (publish class → Security + Juan) | Juan | Fri 11/14 | yellow | Not produced this session; needs Juan's yes |
| 13 | Friday week review | Scheduled | Write `outputs/2026-11-14-week-review.md`: demos vs 5, slips, blockers carried, top 3 for next week | delivery-manager | Fri 11/14 5pm | green | — |

## Blocker log

| Item | Blocked since | Owner | Unblock action | Time it takes Juan | Escalation |
|---|---|---|---|---|---|
| Physical mailing address [CONFIRM] | business file created (before 11/13) | Juan | Write the address in chat; Chief of Staff updates the business file | 2 min | In today's report, first line |
| Secondary sending domain + tool [CONFIRM] | same | Juan | Approve spend in `outputs/sending-infrastructure.md`; buy and publish DNS | 45 min | Today's report |
| Demo booking link [CONFIRM] | same | Juan | Create a Google Calendar appointment page; paste the link | 10 min | Today's report |
| BAA stance [CONFIRM] | same | Juan (with client-data-protection) | Decide "we do not sign BAAs at this stage" or "we do, with X terms" | 5 min to decide; more if yes | Before the first dental demo |
| Suppression list file not created | 11/13 | cold-outreach-sdr | Copy `suppression-list.csv.example` to `suppression-list.csv` | 0 (agent) | Before first verified batch |

## Rhythm this week

Thu 11/13: plan, infra recommendation, batch template, playbook, board (this session). Fri 11/14: Juan's 45-minute setup block; week review at 5pm. Mon 11/17: warm-up day 1; caps updated. Wed 11/19: leads verified. Thu 11/20: reviews. Mon 11/24: first sends at ≤10 per mailbox.

```
REVIEW — delivery-manager — outputs/delivery-board.md
Business-file check: PASS (goal §6.1 and §6.3 reflected; approval classes marked; no status by assumption: demos booked = 0 is read from the empty outreach/demos folder)
Voice check: PASS (owners and dates, no vague items)
Approval class: none (the board itself); items 2, 8, 10, 12 carry their own classes
Reviewer sign-offs: n/a
Verdict: FORWARD TO JUAN
```


## Added 2026-11-13 after Juan's answers
| Item | Owner | Due | Status |
|---|---|---|---|
| Set up PO Box or virtual office; write the address into business/aurelium-motion.md §1 | Juan | 2026-11-20 | Open (blocks all outreach) |
| Buy aureliummotion.co + getaurelium.com, 4 Workspace mailboxes, Instantly plan (approved plan) | Juan | 2026-11-17 | Approved, not purchased |
| Publish DNS, verify with dig, start warm-up | Email Deliverability → Juan | day after purchase | Waiting |
| Pricing: keep DRAFT; no quoting until Juan confirms | all | — | Decided |
| BAA: not signing for now; medical clients lead-capture/booking only | Client Data Protection | — | Decided |
