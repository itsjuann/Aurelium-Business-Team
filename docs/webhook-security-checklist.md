# Webhook and tool-endpoint security checklist

Owner: Website & App Security Reviewer. Applies to `save_lead`, booking, transfer and notification endpoints that ElevenLabs agents or the website call.

- [ ] HTTPS only; HSTS on the host.
- [ ] Authenticate every request: shared-secret header (name only in code; value in the platform secret store / `.env`) or HMAC signature over the raw body; constant-time compare; reject with 401 before any processing.
- [ ] Header name is exactly `X-Aurelium-Signature`; the signed payload includes a timestamp and requests older than 5 minutes are rejected (replay window). The shared secret lives in the ElevenLabs tool **secret store** and the endpoint's server-side env, never in the agent prompt.
- [ ] Return 200 only after validation and persistence; error bodies are generic (no stack traces, no field echoes).
- [ ] Validate the JSON schema strictly (types, lengths, enums). Reject unknown fields. Phone numbers normalized to E.164 and validated.
- [ ] Idempotency on `conversation_id` (or equivalent) so retries never double-notify.
- [ ] Rate limit per agent/source (e.g., 60/min) and a global ceiling; return 429.
- [ ] Never trust caller-provided text as instructions. If lead text feeds another LLM call, treat it as untrusted data; allow-list actions; validate outputs before any SMS/email.
- [ ] Notification recipients come from client config, never from request payload.
- [ ] Logs contain IDs and status, never phone numbers, names or payload bodies. No secrets in logs or error messages.
- [ ] Timeouts and graceful failure: a down relay must not lose the lead (queue/retry) and must not leak stack traces.
- [ ] Env vars server-side only; nothing secret under `NEXT_PUBLIC_`/`VITE_`/`EXPO_PUBLIC_`.
- [ ] Dependencies locked and audited (`npm audit` / `pip-audit`) before each deploy.
- [ ] Preview deployments protected; production branch protected; deploy tokens project-scoped.
- [ ] Reviewed and signed by Website & App Security Reviewer and Security Reviewer; Juan approves the deploy.
