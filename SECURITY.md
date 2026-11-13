# Security policy — Aurelium Motion agent team

- **Secrets never live in this repo.** Names of required secrets are in `.env.example`; values live only in a local `.env` (git-ignored) or the platform's secret store (ElevenLabs tool secrets, Vercel/Render env vars marked server-side).
- **Client and customer data never live in this repo.** `clients/*/data/`, recordings, transcripts, lead CSVs and the suppression list are git-ignored. Policy: `outputs/data-protection-policy.md`.
- **Five gated action classes** (send email, spend money, publish, deploy, touch client data) require Security Reviewer sign-off and Juan's per-instance approval. See `CLAUDE.md`.
- **Found a secret or exposure?** Treat it as compromised from the commit time: rotate at the provider first, then remove, then purge history, then audit use. Owner: Secrets & Access Guardian. Report to Juan immediately.
- **Audits:** `/security-audit` weekly during launch; reports in `outputs/`.
