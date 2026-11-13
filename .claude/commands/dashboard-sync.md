---
description: Refresh the Aurelium Motion Command Center dashboard from the repo state and Aurelium Motion HQ aggregates. Read-only on HQ; uploads one JSON file to the dashboard.
---
Act as the **Chief of Staff** (`.claude/agents/chief-of-staff.md`). Read `business/aurelium-motion.md` first.

The dashboard lives at https://claude.ai/artifact/Cngkv1ZwsPw6uHyKEbjNUg (Overview + one tab per department). It reads a single attached file, `command-center.json`, built from two inputs:

1. **Team state** in `dashboard/state.json`: summary, departments, agents, approvals, blockers, findings, delivery, finance, content, outreach. Update it first from the latest files in `outputs/`, `outreach/`, `content/`, `clients/`:
   - `summary`: demos booked this week vs goal, emails sent, replies, proposals out, clients live, MRR, approvals waiting, blockers open, security verdict and finding counts, next audit, outreach status, today's sending cap.
   - `departments`: status (green on track / yellow waiting / red blocked / gray not started), one-line headline, open items, items waiting on Juan.
   - `agents`: last run date, status (ran / blocked / waiting / idle), latest output and its file path.
   - `approvals`, `blockers`, `findings`, `delivery`, `finance`, `content`, `outreach`: mirror the latest reports. Never invent numbers; "unknown" or 0 with a note is fine.
2. **HQ aggregates**: with the `ArtifactData` tool (read-only), export Aurelium Motion HQ's `leads`, `activities`, `appointments` and `proposals` collections from https://claude.ai/artifact/9uffcdaut84mtgYfuon9ZG to a scratch folder using `out_dir` (query, limit 1000). Then run:
   ```
   python3 scripts/build_dashboard_data.py <scratch folder>
   ```
   The script writes `dashboard/command-center.json` with stage counts, campaign splits, industries and 14-day activity. It never copies business names, people, phones or emails; confirm with `grep -c '"phone"' dashboard/command-center.json` (expect 0).

3. **Upload** `dashboard/command-center.json` to the dashboard as an asset (Artifact tool, `asset: true`, `url` above). Take the returned `/_blob/<id>`.

4. **Point every dataset at the new file**: read each `datasets/<id>` document (ids: cc_summary, cc_departments, cc_agents, cc_approvals, cc_blockers, cc_findings, cc_delivery, cc_finance, cc_content, cc_outreach, hq_summary, hq_stages, hq_campaigns, hq_industries, hq_activity), then one `batch` of `update`s pinned with `if_version`, setting `source.url` to the new blob, `updated: {at: <now UTC ISO>, by: "Chief of Staff (agent team sync)"}` and `edit: {via: "claude", at: <now>}`. Delete the previous blob with the Artifact tool (`action: delete`, `path: <old id>`) once the new one is in place.

5. Commit `dashboard/state.json` and `dashboard/command-center.json`. Tell Juan in three lines what changed on the dashboard.

Rules: this command changes nothing in HQ, sends nothing, and publishes nothing beyond the dashboard's own data file. Do not edit `dashboard/index.html` here; page changes go through a separate request and the dashboard's own one-writer rules.
