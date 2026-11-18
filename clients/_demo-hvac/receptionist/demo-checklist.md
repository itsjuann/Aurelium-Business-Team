# Swap in the prospect and run the demo — one page for Juan

For Call 2 in `outreach/hvac/sales-call-15k.md`. Assumes the demo agent, its number and the demo CRM have already been built, reviewed and published with your approval. Until then this sheet is a rehearsal script.

## The day before (10 minutes)

- [ ] Call 1 notes in hand: shop name as they say it, their towns, their service-call fee, their dispatch software.
- [ ] Their towns checked against any existing Aurelium HVAC client (exclusivity).
- [ ] Demo CRM cleared of the last prospect's call. Only fictional seed customers remain.
- [ ] Demo calendar has at least two open windows for tomorrow and the day after.

## The swap (under two minutes)

In ElevenLabs, open the HVAC demo agent, go to the dynamic variables, and set four values:

| Variable | Set to |
|---|---|
| `shop_name` | Their shop name, spelled the way it should be said |
| `service_towns` | Their towns as a spoken list: "A, B and C" |
| `service_call_fee` | Their fee in words: "eighty nine dollars". If you do not have it: `not set` |
| `office_status` | `open`, or `after_hours` if you want them to hear the night version |

- [ ] Save. Do not publish anything else. No prompt edits on demo day.
- [ ] Optional, 5 more minutes: fill FAQ rows from their website (hours, brands, financing). Blank rows are safe.

Type the prospect's details into ElevenLabs only. Never into a file in this repo.

## Test call (2 minutes, from your own phone)

- [ ] It answers with their shop name and the recording line.
- [ ] Say "my heat is out". It asks about gas first, takes your details one at a time, reads the number back, offers two windows.
- [ ] The job appears in the demo CRM with the URGENT badge and the "AI receptionist, phone call" source tag.
- [ ] Delete your test job so the board is clean.

If any of the three fails, do not run the live call. Dial it on speaker yourself from a rehearsed scenario, or move the demo.

## On the call

1. Recap their numbers first (5 minutes), as the sales doc says.
2. Share the demo CRM screen. Calendar visible.
3. Say: "Call this number. Tell it your heat is out, or your AC. Use a made-up name and address if you like. The call is recorded so we can play it back, and I delete it within 30 days."
4. Go on mute. Say nothing until they hang up.
5. When the job lands: point at the calendar slot, the urgent badge, the source tag, the queued confirmation text.
6. Then: "Now watch what the rest of the system does with that job." Estimate follow-up, tune-up campaign, review request.

Good second calls to suggest if they want another go:
- "Ask it how much a new furnace costs." (It will not guess.)
- "Ask it if it's a real person." (It says it is an AI receptionist.)
- "Tell it you smell gas." (It tells them to get out and call 911, and does not book.)

## If something goes wrong live

| What happens | What you do |
|---|---|
| It does not answer | "Let me dial it on speaker." If still dead, show the last test call recording of your own voice and rebook. |
| Booking does not land in the CRM | It will have taken a message instead. Show the lead card. Say: "When the calendar is unreachable it never invents a slot. It hands the job to a person." |
| It says something off | Do not explain it away. "Good catch. That is what the first-20-calls review is for. I fix it the same day." Log it. |

## Right after (5 minutes)

- [ ] Reset the four variables to their placeholders: `[PLACEHOLDER shop name]`, `[PLACEHOLDER service towns]`, `not set`, `open`.
- [ ] Clear any FAQ rows you filled for them.
- [ ] Delete the prospect's job and customer record from the demo CRM once the debrief is written.
- [ ] Log the call in `clients/_demo-hvac/receptionist/test-calls.md` by date and conversation ID. No names or numbers.
- [ ] Leave the recording in ElevenLabs. Do not download it. It expires at 30 days.

## Never on a demo

- No real customer data in the demo CRM. No other prospect's name left on the agent.
- No claim that an HVAC client is live. None is yet.
- No price from the receptionist beyond their own service-call fee.
