# Data policy — HVAC demo line (DRAFT, recommended settings, nothing applied yet)
Owner: Client Data Protection Officer · Drafted by: Receptionist Builder, 2026-11-18 · Reviewed: [pending] · Vertical: HVAC · Sensitive (medical/dental/therapy/legal): no · BAA: n/a

Who calls this line: HVAC owners and managers on a sales demo. They are prospects, class E, and their voice and whatever they say on the call is class A and B data. Master policy: `outputs/data-protection-policy.md`, row "Prospect demo calls".

## Flow map
Caller (prospect) → telephony ([PLACEHOLDER: ElevenLabs number or Twilio, Juan decides]) → ElevenLabs Agents (audio, transcript, data-collection fields) → LLM (Claude Haiku 4.5 via ElevenLabs) → `check_availability` / `book_appointment` / `save_lead` webhooks → demo CRM ([PLACEHOLDER: which one, open question 1 in the script]) → Juan's shared screen. No SMS or email leaves the demo by default.

## Retention to set (record the exact settings once applied)
| Hop | Data | Retention | Setting / where | Set on |
|---|---|---|---|---|
| ElevenLabs | audio | 30 d, set explicitly | agent → Privacy | [not set, agent not built] |
| ElevenLabs | transcript + summary | 30 d, set explicitly | agent → Privacy | [not set, agent not built] |
| ElevenLabs | zero-retention mode | off (Juan replays the call in the debrief) | agent → Privacy | |
| ElevenLabs | dynamic variable values (prospect's shop name, towns, fee) | reset to placeholders after each demo | agent → variables | per demo |
| Demo CRM | job and customer record from the prospect's call | deleted after the debrief, 30 d at most | | per demo |
| Aurelium | anything downloaded | nothing, by policy | | |

## Fields collected (minimum necessary)
name · callback number · service address and town (needed to dispatch a job) · reason category · heating or cooling · urgency · appointment window · existing customer yes/no · vulnerable occupant yes/no (no detail, used only to prioritise a no-heat or no-cooling job) · call summary

Not collected: email, payment details, health details, equipment serial numbers.

For review: the vulnerable-occupant flag is a yes/no only, but it touches class C. Data Protection decides whether it stays in v1.

## Disclosure wording
"This call may be recorded." in the first message: yes (recommended). Juan also says it out loud before the owner dials, and offers a made-up name and address.

## Deletion
Contact for requests: Juan · SLA 10 business days · log at `clients/_demo-hvac/data/deletion-log.md` (git-ignored) · a prospect who says no or asks for deletion: recording, transcript and CRM record deleted, and the shop goes on the suppression list.
