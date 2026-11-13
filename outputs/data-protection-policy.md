# Client data protection policy (master, v1 — Nov 2026)

Owner: Client Data Protection Officer. Enforced by Security Reviewer. Applies to every client and prospect.

## Data classes
A. Customer PII (names, phones, emails, addresses) · B. Call content (audio, transcripts, summaries) · C. Sensitive content (health, legal matter details, financial details, minors) · D. Client business data (scripts, hours, staff numbers) · E. Prospect data (public job postings and business contacts)

## Flow map (per client, filled in `clients/<slug>/data-policy.md`)
Caller → telephony (Twilio/SIP) → ElevenLabs Agents (audio, transcript, data-collection fields) → LLM (Claude via ElevenLabs; conversation text transits the model provider under ElevenLabs' terms) → `save_lead` webhook → notification relay (SMS/email) → owner's phone/inbox → optional client CRM. Every hop lists: retention, who can access, deletion path.

## Retention (defaults)
| Data | Where | Default | Medical / dental / therapy / legal |
|---|---|---|---|
| Audio | ElevenLabs only; never downloaded | 30 days | 7 days; zero-retention mode offered and recommended |
| Transcripts / summaries | ElevenLabs | 90 days | 30 days |
| `save_lead` payload | Client's notification destination and CRM | Aurelium copies ≤30 days | Fields limited to name, number, reason category, callback window |
| Prospect lead lists | `outreach/batches/*-leads.csv` (git-ignored) | 180 days after last touch | n/a |
| Suppression list | `outreach/suppression-list.csv` (git-ignored) | Indefinite (legal record) | n/a |
| Prospect demo calls (people who call our own demo receptionist) | ElevenLabs, "Aurelium Motion Receptionist" | 30 days audio and transcript, retention set explicitly (F3) | n/a |
| Monthly reports | `clients/<slug>/reports/` | Aggregates and anonymized moments only | same |

## Rules
1. Reading, moving, exporting or deleting client/customer data is an approval-class action: staged → Security Reviewer → Juan.
2. No recordings, transcripts or customer phone numbers in the repo, prompts, knowledge bases, content, or chat examples. Fictional data or `[PLACEHOLDER]` only.
3. Minimum necessary: every collected field must justify itself.
4. Medical/dental/therapy/legal clients: Aurelium Motion does not sign BAAs for now (Juan, 2026-11-13); such clients get lead capture and booking only, proposals never imply HIPAA-grade handling; shortest retention; audio off unless signed for; receptionist scripted not to collect symptoms or case details.
5. Recording disclosure line available to every client ("This call may be recorded"); AI-honesty rule mandatory.
6. Deletion requests completed across every hop within 10 business days and logged in `clients/<slug>/data/deletion-log.md`. Offboarding deletes everything within 30 days with written confirmation.
7. Incident (exposure, wrong recipient, lost device): contain → assess → notify Juan with the one decision needed → remediate → 10-line post-mortem in `outputs/incidents/`.
