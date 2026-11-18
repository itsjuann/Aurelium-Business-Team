# Restaurant Autopilot

Turns a table QR code into a guest list, then fills slow hours with SMS offers.

| Step | What happens |
| --- | --- |
| 1. Table QR code | Printable, branded card per table. Each scan records the table. |
| 2. Landing page | Guest enters name, mobile and (optionally) email to claim the welcome offer. |
| 3. Contact | Guest is saved with source, table and tag. One welcome offer per phone number. |
| 4. Confirmation | Guest gets a text (and email) with a unique code. Staff redeem it on their phone. |
| 5. Contact list | Guests, new-per-day chart, CSV export. |
| 6. Slow time | Finds the quietest upcoming hour from the covers you enter, or from scan data. |
| 7. SMS blast | Sends a timed offer to opted-in guests at that hour, manually or on autopilot weekly. |
| 8. Seats fill up | Live dining-room map: staff tap tables seated / free, showing % full. Plus blast redemptions × average check. |

One deployment serves many restaurants; each has its own QR codes, guest list and settings.

## Run it

```sh
npm install
npm run seed     # optional: demo restaurant "Bella Cucina" with made-up guests
npm start        # http://localhost:3000/admin  (password "admin" in dev)
npm test
```

Needs Node 22.13+. Data lives in a SQLite file (`data/app.db`).

## Going live

Copy `.env.example` and set at least `ADMIN_PASSWORD`, `SESSION_SECRET` and `BASE_URL`
(the public address printed inside every QR code). `render.yaml` deploys it to Render with a
persistent disk. Run a single instance: the scheduler runs in-process once a minute.

Until providers are connected, texts and emails are **simulated**: recorded under Messages, never sent.

- **SMS**: set the `TWILIO_*` variables. US numbers need A2P 10DLC registration (or a verified
  toll-free number) before carriers deliver marketing texts. Point the Twilio number's inbound
  message webhook at `POST {BASE_URL}/webhooks/twilio/sms` so STOP / START stay in sync.
- **Email**: set `RESEND_API_KEY` and `EMAIL_FROM` (a verified sending domain).

## Texting rules built in

- Marketing texts go only to guests who ticked the consent box; the wording, time and IP are stored.
- Blasts only send between 8 AM and 9 PM restaurant-local time and always carry "Reply STOP to opt out".
- A blast that misses its slot by more than two hours is dropped, not sent late.
- Autopilot sends at most one blast per week.

This is not legal advice: check TCPA (US) / CASL (Canada) requirements for each client.
