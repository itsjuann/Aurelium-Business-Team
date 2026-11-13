# Threat model — Aurelium Motion (v1, 2026-11-13)
Owner: Security Reviewer. Update when a client, tool or channel is added.

## Assets
Caller PII and call content (clients' customers) · client notification channels (owner SMS/email) · ElevenLabs agent configs and API keys · Juan's email identity and domains' reputation · the suppression list (legal record) · this repo.

## Actors
Opportunistic internet scanners (webhook URLs, exposed env) · spammers/competitors flooding a client's lead endpoint · a disgruntled or careless connected-tool integration (over-scoped OAuth) · an AI coding assistant shipping defaults · ourselves (wrong recipient, wrong domain, downloaded recording).

## Entry points and the control that answers each
| Entry point | Question | Control | Status |
|---|---|---|---|
| `save_lead` / booking webhooks | Is this POST really from our agent? | HMAC `X-Aurelium-Signature` + timestamp, schema, idempotency, rate limit (`docs/webhook-security-checklist.md`) | Unbuilt; gate F13 |
| Website forms | Can a bot flood or inject? | Honeypot/CAPTCHA, rate limit, HTTPS, no PII in URLs | Site unreviewed (F14) |
| Notification relay | Can caller text become instructions or reach the wrong person? | Recipients from config only; caller text treated as data; STOP handling | Unbuilt |
| OAuth grants / connectors | Can a connector send, spend or publish without the gate? | Least privilege, disconnect idle connectors (F7, F8); procedural gate in CLAUDE.md | Open |
| Cold-email sending | Can we break the law or burn the brand domain? | CAN-SPAM checks, suppression list, secondary domain, caps, DMARC | Blocked until facts filled (F1, F2) |
| Call data at rest | How long does a caller's voice live, and where? | Retention settings per `outputs/data-protection-policy.md`; nothing downloaded | F3 open on demo agent |
| Repo | Can a key or a recording land in git? | `.gitignore`, `.env.example`, gitleaks hook (F6), push protection (unknown) | Partly |
| DNS | Can the primary domain be used to send cold mail or be spoofed? | SPF/DKIM/DMARC on both domains; primary never authorizes the cold tool | Unverified |

## Gaps ranked
1. Connectors with send/spend/publish power and no job (F7, F8). 2. Demo agent retention unset (F3). 3. No secret scanner / push protection (F6). 4. Webhook unbuilt but will be the hottest surface (F13).
