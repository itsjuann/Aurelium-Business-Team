# Outreach compliance rules (standing)

Owner: Outreach Compliance Officer. Applies to every cold email Aurelium Motion sends. The SDR builds these in; Compliance verifies; Security signs; Juan sends.

## Every email must have
1. **Honest From**: "Juan Jackson" or "Aurelium Motion", on the approved secondary sending domain (never aureliummotion.com, never gmail.com). Monitored Reply-To.
2. **Honest subject**: describes the body. No "re:"/"fwd:" on a first touch, no implied relationship, no fake urgency.
3. **Plain identification**: who we are, what we offer, in the first three lines.
4. **Physical mailing address** in the footer (from `business/aurelium-motion.md`; if [CONFIRM], the batch is blocked).
5. **Working opt-out**: "Reply 'no' and I won't email again" and/or an unsubscribe link that works from the first send and for at least 30 days. We honor immediately and forever (law allows 10 business days; we do not use them).
6. **No pricing**, no fabricated clients, results or statistics, no attachments, no tracking of anything beyond opens/clicks.

## Suppression list (`outreach/suppression-list.csv`, git-ignored)
- Columns: `email,added_on,source,reason`. Add every "no / stop / unsubscribe / remove", hard bounce, complaint, and any "do not contact" from any channel, the same session it arrives.
- Checked before every batch. Never shared, sold or exported. Kept indefinitely.

## Sending limits (published by Email Deliverability in `outputs/sending-caps.md`)
- Warm-up weeks 1–2: ≤10 real sends/mailbox/day. Week 3: 20. Week 4: 30. Week 5+: 50. Follow-ups count.
- Max 3 mailboxes per domain. Pause a mailbox at >3% bounces or >0.1% complaints in a day.

## Domain health (verified before every batch)
- SPF includes the mail provider and the sending tool, ends `~all`/`-all`. DKIM published and aligned. DMARC at least `p=none` with `rua=`; `p=quarantine` after two clean weeks.

## Not allowed
- Cold SMS or cold calls to mobile numbers without prior express consent (TCPA). Receptionist confirmation texts to someone who just called are transactional; keep them that way and honor STOP.
- Purchased lists. Scraped personal emails. Emailing anyone on the suppression list from any domain for any offer.
