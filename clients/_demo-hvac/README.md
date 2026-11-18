# Demo: HVAC demo line (not a client)

The receptionist an HVAC owner calls on Call 2 of `outreach/hvac/sales-call-15k.md`. Fictional shop by default; the prospect's shop name, towns and service-call fee are swapped in through four variables before each demo.

**Status: DRAFT. Nothing is built or published on ElevenLabs. No endpoint exists. No number is assigned.** Build, publish and number assignment are Deploys-class actions: Website & App Security Reviewer and Security Reviewer sign off, then Juan approves.

- `receptionist/script.md` — first message, system prompt, flows, emergency rules, FAQ, tool specs, data and evaluation fields, data settings, open questions
- `receptionist/test-calls.md` — 12 scripted test calls and the first-20-calls review log
- `receptionist/demo-checklist.md` — one page: swap in the prospect and run the demo
- `data-policy.md` — recommended retention and disclosure for the demo line
- `data/` — git-ignored. The only place a real prospect's details or a transfer number may be written down.

Rule for this folder: no real prospect names, numbers or addresses in any tracked file.
