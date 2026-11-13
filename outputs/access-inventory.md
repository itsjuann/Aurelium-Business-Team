# Access inventory — connected tools and credentials

Owner: Secrets & Access Guardian. Credential holder for every row: **Juan** (solo founder). Last updated: 2026-11-13 (first audit).

How this was built: from the stack list in `business/aurelium-motion.md`, `.env.example`, and the tool connections observed in this Claude Code session (MCP servers that loaded, and those that failed to connect). "Scopes granted" is **observed capability**, not a verified OAuth scope string; where the console was not checked it says **unknown**. "Last rotated" is unknown for every row because no rotation log exists yet; this file is where it goes.

Legend: **Admin** = can create/delete/configure resources · **Write** = can create or change content · **Read** = read only.

## 1. Tools in the stack

| Tool | Used for | Credential type | Scopes granted (observed) | Scopes needed (least privilege) | Gap | If this leaks | Rotation path | Revoke path |
|---|---|---|---|---|---|---|---|---|
| **ElevenLabs Agents** (MCP, connected **twice**: `ElevenLabs` and `ElevenLabs-22176042`) | Receptionist platform: agent "Aurelium Motion Receptionist" (claude-haiku-4-5, tools `save_lead`, `end_call`), future client agents, telephony, transcripts | OAuth connector (workspace level) + `ELEVENLABS_API_KEY` named in `.env.example` (not yet set) | **Admin**: create/delete/update agents, create secrets, create/delete phone numbers, submit batch calls, read every conversation and transcript, plus Creative tools that spend credits (image/video/speech generation) | Agents: read + draft edits (publish is Juan's approval). Conversations: read for the client being served. No batch calling, no phone-number deletion, no creative generation from the receptionist key. One scoped key per client integration if the plan allows | **Broader than needed.** Duplicate connection doubles the blast radius. API key scope unknown (not created yet) | Someone can edit every client's receptionist, read every caller's transcript, assign or drop phone numbers, run outbound batch calls, and burn credits | ElevenLabs → Profile → API Keys → create new key with Agents + Conversations only → update `.env` / tool secret store → delete old key | Same page → delete key. Connector: Claude settings → Connectors → disconnect. **Disconnect the duplicate now.** |
| **Gmail** (MCP) | Reading replies, drafting outreach and client emails, Juan sends | OAuth connector on `aureliummotion@gmail.com` (free Gmail; Workspace status **[CONFIRM]**) | **Write/full mailbox**: `send_message`, `reply`, `forward`, `trash_*`, `mark_spam`, labels, drafts | Read + draft only. Send stays with Juan (business rule: agents never click send) | **Broader than needed.** The approval gate is procedural, not technical: a misbehaving or prompt-injected agent *can* send | Someone can email as Juan to every prospect and client, read every reply, and delete evidence | Google Account → Security → Third-party access → remove Claude → reconnect with the narrowest consent screen offered | Same page → Remove access |
| **Google Calendar** (MCP) | Demo scheduling, kickoff calls | OAuth connector (same Google account) | **Write**: create/update/delete events, respond to invites | Read + create events; no delete | Minor over-grant | Someone can see every meeting and cancel demos | Same Google third-party access page | Same |
| **Buffer** (MCP) | Scheduling Instagram @aureliummotion, LinkedIn (Juan Jackson), Threads @xheksonsound | OAuth connector + `BUFFER_ACCESS_TOKEN` named in `.env.example` | **Write**: `create_post`, `edit_post`, `delete_post`, templates, ideas; 3 channels connected | Create ideas and **drafts** only; scheduling/publishing is an approval | **Broader than needed**: the connector can publish directly | Someone can post publicly on three channels in the brand's name | Buffer → Settings → Apps & Extras → revoke → reconnect | Same |
| **Canva** (MCP) | Thumbnails, carousels, proposal covers | OAuth connector | **Write**: create/edit/export designs, publish brand templates, upload assets | Create and edit designs; export is fine; publish brand templates not needed | Minor over-grant | Low direct harm; brand assets could be altered or leaked | Canva → Settings → Connected apps → remove | Same |
| **GitHub** (MCP + `gh` CLI) | This repo and anything deployed | OAuth app / token (scope **unknown**) | **Admin-ish**: `create_repository`, `push_files`, `delete_file`, `merge_pull_request`, `create_branch`, `run_secret_scanning` | Scoped to **this repo** only: contents read/write on a branch, PR create; no repo creation, no merge to default branch | **Unknown scope, likely all repos.** Fine-grained PAT or GitHub App install limited to `Aurelium-Business-Team` | Someone can push code that gets deployed, or read every private repo | GitHub → Settings → Applications / Developer settings → regenerate as fine-grained token scoped to one repo | Same → revoke |
| **Vercel** (MCP) | Website and app hosting (**no projects deployed yet**) | OAuth connector (team scope **unknown**) | **Admin**: 200+ tools incl. `create_project`, `create_deployment`, `buy_domain`, `create_project_env`, firewall, DNS records | Nothing today. When used: one project, deploy tokens project-scoped, env vars server-side | **Admin access held with zero workload.** Disconnect until there is a project | Someone can deploy arbitrary code on the brand's domain, read env vars, buy domains on Juan's card | Vercel → Settings → Tokens / Integrations → remove and recreate project-scoped | Same |
| **Render** (MCP) | Alternative hosting (no services known; **not checked** this audit) | OAuth connector / `RENDER_API_KEY` named in `.env.example` | **Admin**: create web services, update environment variables, query Postgres | Nothing today. When used: workspace with one service, read + deploy | Same as Vercel | Same as Vercel plus database read | Render → Account → API Keys → rotate | Same |
| **Notion** (plugin MCP) | Docs/CRM (planned) | OAuth connector | **Failed to connect** this session: "needs re-authorization" | Read + create pages in one workspace | None while disconnected; re-authorize only when an agent needs it | Internal notes and any client data stored there | Notion → Settings → Connections → remove → reconnect | Same |
| **Cold-email tool** (Instantly / Smartlead) | Cold outreach from a warmed secondary domain | API key `COLD_EMAIL_API_KEY` named in `.env.example` | **Not connected.** Tool **[CONFIRM]** | Campaign create as draft; sending controls stay in the tool's UI with Juan | n/a | Someone can send cold email at volume from the brand's secondary domain | Tool → API keys | Same |
| **Telephony** (Twilio or SIP via ElevenLabs) | Client phone numbers, forwarding | `TWILIO_ACCOUNT_SID` + `TWILIO_AUTH_TOKEN` named in `.env.example` | **Not connected.** No phone numbers assigned on the ElevenLabs agent | Subaccount per client where feasible; API key (not the account auth token) per integration | n/a | Someone can call or text clients' customers, port numbers, or run up a bill | Twilio Console → Account → API keys → create key per integration; never use the master auth token in a webhook | Same → delete key |
| **Lead notification relay** (SMS/email provider) | `save_lead` → owner's phone | `NOTIFY_SMS_PROVIDER_KEY` named in `.env.example` | **Not connected** | Send to allow-listed client numbers only | n/a | Someone can text clients and their customers | Provider console | Same |
| **Anthropic API** | In-house automation (none yet) | `ANTHROPIC_API_KEY` named in `.env.example` | **Not set** | One key per deployed service, with a spend limit | n/a | Someone can run up LLM spend | console.anthropic.com → API keys | Same |

## 2. Connected tools NOT in the stack (remove)

These MCP connectors loaded in this session but have no role in `business/aurelium-motion.md`. Each is an authenticated door with no job. Recommendation: disconnect unless Juan names a use.

| Connector | Observed capability | Why it matters |
|---|---|---|
| **Higgs** (Higgsfield) | Generate media, publish to TikTok, rent GPUs, spend credits, create websites | Spend and publish capability outside the approval table |
| **Klaviyo** | Create campaigns, **send campaigns**, import profiles, create sending domains, SMS senders | A second, ungoverned email-sending path; CAN-SPAM exposure if misused |
| **Shopify** | Create products, discounts, read customers and orders, GraphQL mutations | No e-commerce in the business; reads customer data if a store exists |
| **Windsor.ai** | Read ad/analytics data and **execute write actions** on Meta/Google/TikTok Ads, Instagram, Google Business Profile | Can post and change ad budgets outside the Paid Media + Finance gate |
| **Composio** | Proxy-execute tools on arbitrary connected apps, remote bash | Broad indirect access; hardest to reason about |
| **Claude Docs** | First-party documents | Fine to keep |
| **Plugin-configured, failed to connect** (ahrefs, hubspot, similarweb, supermetrics, asana, atlassian, notion, slack, amplitude, clickup, figma, fireflies, intercom, linear, monday, pendo) | None (proxy refused the tunnel) | No access today; remove the unused plugins so they do not silently connect later |

## 3. Standing rules

1. Every secret name lives in `.env.example` with an empty value and an owner/scope comment; values live only in `.env` (git-ignored) or the platform secret store. **Add to `.env.example`:** `SAVE_LEAD_WEBHOOK_SECRET` (shared secret the ElevenLabs tool sends), `GITHUB_TOKEN` (fine-grained, one repo), `CANVA_*`/`NOTION_*` only if ever used outside the connector.
2. ElevenLabs tool auth goes in the agent's **secret store**; the system prompt references the tool name only.
3. Any credential whose leak answer is "someone can call our clients' customers" or "someone can email as Juan" (ElevenLabs, Gmail, telephony, cold-email tool, Klaviyo if kept) gets quarterly rotation and a dated line in this file.
4. Rotation is staged by the Guardian and executed by Juan. Record the date here when done.

## 4. Rotation log

| Date | Credential | Reason | Done by |
|---|---|---|---|
| — | — | No rotations yet | — |
