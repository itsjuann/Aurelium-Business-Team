// Fills a demo restaurant with made-up guests and traffic so the dashboard has something to show.
// Usage: npm run seed   (safe to run once; refuses if the demo restaurant already exists)
import { openDb, nowIso } from '../src/db.js';
import { createCore } from '../src/core.js';
import { createMessenger } from '../src/messaging.js';

const db = openDb();
const core = createCore(db, createMessenger(db, { sms: () => ({ status: 'simulated' }), email: () => ({ status: 'simulated' }) }));
if (core.getRestaurant('bella-cucina')) {
  console.log('Demo restaurant already exists: /admin/r/bella-cucina');
  process.exit(0);
}
const r = core.createRestaurant({ name: 'Bella Cucina', staff_pin: '1234' });

const first = ['Sofia', 'Liam', 'Maya', 'Noah', 'Ava', 'Ethan', 'Zoe', 'Lucas', 'Mia', 'Omar', 'Priya', 'Diego'];
const last = ['Ramos', 'Chen', 'Patel', 'Nguyen', 'Silva', 'Kim', 'Rossi', 'Khan', 'Brown', 'Costa'];
const ins = db.prepare(`INSERT INTO contacts (restaurant_id, name, phone, email, source, table_no, tag, sms_opt_in,
  consent_text, consent_at, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`);
for (let i = 0; i < 240; i++) {
  const name = `${first[i % first.length]} ${last[(i * 7) % last.length]}`;
  const table = 1 + (i % 12);
  const at = new Date(Date.now() - Math.floor(Math.random() ** 2 * 30 * 864e5)).toISOString();
  const optIn = i % 5 ? 1 : 0;
  ins.run(r.id, name, `+1647555${String(1000 + i)}`, `${name.toLowerCase().replace(' ', '.')}@example.com`,
    `Table QR · Table ${table}`, String(table), r.welcome_offer, optIn, optIn ? 'demo' : null, optIn ? at : null, at);
  db.prepare('INSERT INTO scans (restaurant_id, table_no, created_at) VALUES (?, ?, ?)').run(r.id, String(table), at);
  if (i % 2) db.prepare('INSERT INTO scans (restaurant_id, table_no, created_at) VALUES (?, ?, ?)').run(r.id, String(table), at);
}

// Typical covers: lunch and dinner peaks, quiet mid-afternoon, Monday the slowest day.
const shape = { 11: 14, 12: 30, 13: 34, 14: 20, 15: 9, 16: 6, 17: 16, 18: 34, 19: 42, 20: 36, 21: 18 };
const dayFactor = [0.9, 0.55, 0.65, 0.75, 0.85, 1.2, 1.3];
const cells = [];
for (let dow = 0; dow < 7; dow++) {
  for (const [hour, covers] of Object.entries(shape)) cells.push({ dow, hour: +hour, covers: covers * dayFactor[dow] });
}
core.setBaseline(r, cells);
for (const t of [1, 2, 4, 5, 7, 8, 9, 11]) core.toggleTable(r, t, new Date(Date.now() - t * 6 * 60e3));
console.log(`Seeded demo restaurant at ${nowIso()}: /admin/r/bella-cucina (staff PIN 1234)`);
