---
description: Full security audit — secrets and access, client data protection, outreach compliance, website and app security — with a Security Reviewer verdict
argument-hint: [scope, optional: secrets | data | outreach | web | all]
---
Run the Aurelium Motion security audit. Scope: `$ARGUMENTS` (default: all). Read `business/aurelium-motion.md` first.

Run each section as the named agent, read-only unless a fix is a pure file edit inside this repo (e.g., `.gitignore`). Never rotate, delete, or deploy anything in this command; recommend and stage instead.

1. **Secrets & Access Guardian** (`secrets-access-guardian.md`): scan the working tree and full git history for API keys, tokens, passwords, private keys and `.env` files (use `git log -p`, `grep -rIn`, and gitleaks/trufflehog if installed). Check `.gitignore` covers `.env*`, lead CSVs, recordings and transcripts. Inventory every connected tool and its scope; flag anything broader than least privilege.
2. **Client Data Protection Officer** (`client-data-protection.md`): check where call recordings, transcripts and customer phone numbers could live (ElevenLabs retention settings, repo, exports). Verify the retention and deletion policy exists and is followed. Flag PHI/HIPAA exposure for medical clients.
3. **Outreach Compliance Officer** (`outreach-compliance-officer.md`): audit the latest batch in `outreach/batches/` for CAN-SPAM (address, opt-out, honest headers), suppression list integrity, sending limits, and domain health (SPF, DKIM, DMARC via `dig` if network allows; otherwise state what to check).
4. **Website & App Security Reviewer** (`website-app-security-reviewer.md`): review any deployable code in the repo and the public surface of aureliummotion.com (headers, forms, exposed endpoints) to the extent reachable; list what could not be checked.
5. **Security Reviewer** (`security-reviewer.md`): consolidate into one report with severity (Critical / High / Medium / Low), owner, fix, and a final verdict: **CLEAR**, **CLEAR WITH CONDITIONS**, or **BLOCKED** (what is blocked and until when).

Save to `outputs/YYYY-MM-DD-security-audit.md` and summarize for Juan in under 200 words.
