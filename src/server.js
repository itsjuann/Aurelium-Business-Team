import { config, smsLive, emailLive } from './config.js';
import { openDb } from './db.js';
import { createApp } from './app.js';

const db = openDb();
const { app, core } = createApp(db);

let ticking = false;
async function tick() {
  if (ticking) return;
  ticking = true;
  try { await core.tick(); } catch (e) { console.error('scheduler tick failed', e); } finally { ticking = false; }
}
setInterval(tick, 60 * 1000).unref();

const server = app.listen(config.port, () => {
  console.log(`Restaurant Autopilot on ${config.baseUrl}`);
  console.log(`SMS: ${smsLive() ? 'Twilio (live)' : 'simulated'} · Email: ${emailLive() ? 'Resend (live)' : 'simulated'}`);
  if (!process.env.ADMIN_PASSWORD) console.log('Dev mode: admin password is "admin". Set ADMIN_PASSWORD before deploying.');
  tick();
});

for (const sig of ['SIGINT', 'SIGTERM']) {
  process.on(sig, () => server.close(() => { db.close(); process.exit(0); }));
}
