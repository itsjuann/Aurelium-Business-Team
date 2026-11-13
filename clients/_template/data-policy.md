# Data policy — [PLACEHOLDER business]
Owner: Client Data Protection Officer · Reviewed: [date] · Vertical: [ ] · Sensitive (medical/dental/therapy/legal): yes / no · BAA: n/a / signed [date] / declined

## Flow map
Caller → telephony ([Twilio / SIP / ElevenLabs number]) → ElevenLabs Agents (audio, transcript, data-collection fields) → LLM (Claude via ElevenLabs) → `save_lead` webhook → notification relay ([SMS / email]) → owner's [phone / inbox] → CRM ([none / name])

## Retention set (record the exact settings applied)
| Hop | Data | Retention | Setting / where | Set on |
|---|---|---|---|---|
| ElevenLabs | audio | 30 d (7 d sensitive) / zero-retention | agent → Privacy | |
| ElevenLabs | transcript + summary | 90 d (30 d sensitive) | agent → Privacy | |
| Notification relay | lead payload | ≤30 d | | |
| Aurelium | anything downloaded | nothing, by policy | | |

## Fields collected (minimum necessary)
name · callback number · reason category · callback window · [other, justified: ]

## Disclosure wording
"This call may be recorded." in first message: yes / no (owner decision, date)

## Deletion
Contact for requests: [owner name/role] · SLA 10 business days · log at `data/deletion-log.md` (git-ignored) · offboarding: everything deleted within 30 days, confirmation sent
