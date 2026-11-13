# Aurelium Business Team

The AI agent team that runs **Aurelium Motion** (aureliummotion.com), Juan Jackson's AI growth and marketing agency in Greater Philadelphia. Core offer: done-for-you AI receptionists for local small businesses, sold through signal-based cold email to businesses hiring front desk staff.

Built on [The Agency](https://github.com/msitarzewski/agency-agents) agent format, with 12 agents adapted from that roster and 5 custom agents the roster lacked.

## Start here
1. `business/aurelium-motion.md` — the brain. Every agent reads it first. Fill the **[CONFIRM]** items.
2. `CLAUDE.md` — routing rules, the approval gate, slash commands.
3. Run Claude Code in this folder; the agents in `.claude/agents/` load automatically. To use them from any directory: `./install.sh` copies them to `~/.claude/agents/`.

## The team (17 agents)
| Division | Agent | File |
|---|---|---|
| Orchestration | Chief of Staff (custom) | `chief-of-staff.md` |
| Sales | Cold Outreach SDR (custom) · Outbound Systems Strategist · Discovery & Demo Coach | `cold-outreach-sdr.md` · `outbound-systems-strategist.md` · `discovery-demo-coach.md` |
| Marketing | Content Engine (custom) · Email Deliverability Strategist | `content-engine.md` · `email-deliverability-strategist.md` |
| Paid media | Paid Media Strategist | `paid-media-strategist.md` |
| Delivery | Client Onboarding (custom) · Receptionist Builder (custom) · Delivery Manager | `client-onboarding.md` · `receptionist-builder.md` · `delivery-manager.md` |
| Support | Client Success | `client-success.md` |
| Finance | Finance Controller | `finance-controller.md` |
| Security | Secrets & Access Guardian · Client Data Protection Officer · Outreach Compliance Officer · Website & App Security Reviewer · **Security Reviewer (veto)** | `secrets-access-guardian.md` · `client-data-protection.md` · `outreach-compliance-officer.md` · `website-app-security-reviewer.md` · `security-reviewer.md` |

## Slash commands
`/daily-brief` · `/outreach-batch [size] [vertical]` · `/content-week [theme]` · `/security-audit [scope]`

## The rule
Anything that **sends email, spends money, publishes, deploys, or touches client data** is staged by an agent, signed off by the Security Reviewer (and the relevant specialist), and approved by Juan per instance. Agents never click send.
