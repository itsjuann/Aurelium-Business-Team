import { test } from 'node:test';
import assert from 'node:assert/strict';
import { openDb } from '../src/db.js';
import { createCore, UserError } from '../src/core.js';
import { createMessenger, validTwilioSignature } from '../src/messaging.js';
import { normalizePhone, zonedParts, zonedToUtc } from '../src/util.js';
import crypto from 'node:crypto';

function setup(settings = {}) {
  const db = openDb(':memory:');
  const sent = [];
  const messenger = createMessenger(db, {
    sms: (to, body) => { sent.push({ to, body }); return { status: 'sent', providerId: 'SM1' }; },
    email: (to, subject) => { sent.push({ to, subject }); return { status: 'sent' }; },
  });
  const core = createCore(db, messenger);
  const r = core.createRestaurant({ name: 'Bella Cucina', timezone: 'America/Toronto', ...settings });
  return { db, core, r, sent };
}

test('phone numbers normalise to E.164', () => {
  assert.equal(normalizePhone('(647) 555-0172'), '+16475550172');
  assert.equal(normalizePhone('1-647-555-0172'), '+16475550172');
  assert.equal(normalizePhone('+44 20 7946 0958'), '+442079460958');
  assert.equal(normalizePhone('555-0172'), null);
  assert.equal(normalizePhone('hello'), null);
});

test('zoned time round-trips across a DST change', () => {
  // 2026-03-08 is spring-forward day in Toronto; 4 PM local is 20:00 UTC (EDT).
  const at = zonedToUtc(2026, 3, 8, 16, 0, 'America/Toronto');
  assert.equal(at.toISOString(), '2026-03-08T20:00:00.000Z');
  assert.equal(zonedParts(at, 'America/Toronto').h, 16);
  assert.equal(zonedToUtc(2026, 1, 12, 16, 0, 'America/Toronto').toISOString(), '2026-01-12T21:00:00.000Z');
});

test('claim creates a contact, a coupon and a confirmation, once per number', async () => {
  const { db, core, r, sent } = setup();
  const out = await core.claimOffer(r, { name: 'Sofia Ramos', phone: '(647) 555-0172', email: 'Sofia.R@gmail.com', table: '12', consent: '1', ip: '1.2.3.4' });
  assert.equal(out.isNew, true);
  assert.match(out.code, /^APP-[2-9A-Z]{5}$/);
  assert.equal(out.contact.phone, '+16475550172');
  assert.equal(out.contact.source, 'Table QR · Table 12');
  assert.equal(out.contact.sms_opt_in, 1);
  assert.ok(out.contact.consent_at && out.contact.consent_text.includes('Bella Cucina'));
  assert.equal(sent.length, 2);
  assert.ok(sent[0].body.includes(out.code) && sent[0].body.includes('STOP'));
  assert.equal(sent[1].to, 'sofia.r@gmail.com');

  const again = await core.claimOffer(r, { name: 'Sofia', phone: '647-555-0172' });
  assert.equal(again.isNew, false);
  assert.equal(sent.length, 2, 'no second text for the same number');
  assert.equal(db.prepare('SELECT COUNT(*) n FROM coupons').get().n, 1);
});

test('claim rejects bad input and does not opt in without consent', async () => {
  const { core, r } = setup();
  await assert.rejects(core.claimOffer(r, { name: '', phone: '6475550172' }), UserError);
  await assert.rejects(core.claimOffer(r, { name: 'A', phone: '123' }), UserError);
  await assert.rejects(core.claimOffer(r, { name: 'A', phone: '6475550172', email: 'nope' }), UserError);
  const out = await core.claimOffer(r, { name: 'A', phone: '6475550172' });
  assert.equal(out.contact.sms_opt_in, 0);
  assert.equal(core.audienceCount(r), 0);
});

test('welcome coupon redeems exactly once', async () => {
  const { core, r } = setup();
  const { code } = await core.claimOffer(r, { name: 'A', phone: '6475550172' });
  assert.equal(core.redeem(r, code.toLowerCase()).kind, 'welcome');
  assert.throws(() => core.redeem(r, code), /already redeemed/);
  assert.throws(() => core.redeem(r, 'APP-NOPE1'), /No offer found/);
});

test('slowest slot comes from the baseline, skips closed days, the past and quiet hours', () => {
  const { core, r: r0 } = setup({ open_hour: 11, close_hour: 22, closed_days: ['2'] });
  assert.equal(core.slowestSlot(r0), null, 'no data, no slot');
  const cells = [];
  for (let dow = 0; dow < 7; dow++) for (let hour = 0; hour < 24; hour++) cells.push({ dow, hour, covers: 20 });
  cells.push({ dow: 1, hour: 16, covers: 3 });  // Monday 4 PM
  cells.push({ dow: 2, hour: 15, covers: 0 });  // Tuesday is closed
  cells.push({ dow: 3, hour: 23, covers: 0 });  // outside sendable hours
  core.setBaseline(r0, cells);

  // Wednesday 2026-01-07 noon Toronto
  const now = zonedToUtc(2026, 1, 7, 12, 0, 'America/Toronto');
  const slot = core.slowestSlot(r0, now);
  assert.equal(slot.dow, 1);
  assert.equal(slot.hour, 16);
  assert.equal(slot.at.toISOString(), zonedToUtc(2026, 1, 12, 16, 0, 'America/Toronto').toISOString());

  // Monday 4:30 PM: this week's slot has passed, so it picks next Monday.
  const later = core.slowestSlot(r0, zonedToUtc(2026, 1, 12, 16, 30, 'America/Toronto'));
  assert.equal(later.at.toISOString(), zonedToUtc(2026, 1, 19, 16, 0, 'America/Toronto').toISOString());
});

test('campaigns respect quiet hours and build the message', async () => {
  const { core, r } = setup({ blast_window_hours: 3 });
  const now = zonedToUtc(2026, 1, 7, 12, 0, 'America/Toronto');
  assert.throws(() => core.createCampaign(r, { offer: 'x', at: zonedToUtc(2026, 1, 8, 22, 0, 'America/Toronto') }, now), /between/);
  assert.throws(() => core.createCampaign(r, { offer: 'x', at: zonedToUtc(2026, 1, 6, 12, 0, 'America/Toronto') }, now), /past/);
  const c = core.createCampaign(r, { offer: 'Buy one, get one FREE on any pasta', at: zonedToUtc(2026, 1, 12, 16, 0, 'America/Toronto') }, now);
  assert.ok(c.body.startsWith('Bella Cucina: TODAY ONLY: Buy one, get one FREE on any pasta until 7 PM.'));
  assert.ok(c.body.includes(c.code) && c.body.endsWith('Reply STOP to opt out.'));
  assert.equal(c.expires_at, zonedToUtc(2026, 1, 12, 19, 0, 'America/Toronto').toISOString());
});

test('tick sends a due blast once, only to opted-in guests, and tracks redemptions', async () => {
  const { core, r, sent } = setup();
  await core.claimOffer(r, { name: 'In', phone: '6475550001', consent: '1' });
  await core.claimOffer(r, { name: 'Out', phone: '6475550002' });
  await core.claimOffer(r, { name: 'Gone', phone: '6475550003', consent: '1' });
  assert.equal(core.handleInbound('+16475550003', ' stop '), 'stop');
  assert.equal(core.audienceCount(r), 1);
  sent.length = 0;

  const now = zonedToUtc(2026, 1, 12, 15, 0, 'America/Toronto');
  const at = zonedToUtc(2026, 1, 12, 16, 0, 'America/Toronto');
  const c = core.createCampaign(r, { offer: 'BOGO pasta', at }, now);
  assert.equal(await core.tick(now), 0, 'not due yet');
  assert.throws(() => core.redeem(r, c.code, now), /not been sent/);
  assert.equal(await core.tick(at), 1);
  assert.equal(await core.tick(at), 0, 'never sent twice');
  assert.deepEqual(sent.map((m) => m.to), ['+16475550001']);

  const [camp] = core.listCampaigns(r);
  assert.equal(camp.status, 'sent');
  assert.equal(camp.recipients, 1);

  core.redeem(r, c.code, new Date(at.getTime() + 3600e3));
  core.redeem(r, c.code, new Date(at.getTime() + 2 * 3600e3));
  assert.throws(() => core.redeem(r, c.code, new Date(at.getTime() + 4 * 3600e3)), /expired/);
  const s = core.stats(r);
  assert.equal(s.blastRedemptions, 2);
  assert.equal(s.blastRevenueCents, 2 * r.avg_check_cents);

  assert.equal(core.handleInbound('+16475550003', 'START'), 'start');
  assert.equal(core.audienceCount(r), 2);
});

test('autopilot plans one blast a week at the slowest slot and drops stale ones', async () => {
  const { core, r: r0, sent } = setup();
  const r = core.updateRestaurant(r0, { auto_blast: '1', blast_offer: 'Half-price apps' });
  await core.claimOffer(r, { name: 'In', phone: '6475550001', consent: '1' });
  const cells = [];
  for (let dow = 0; dow < 7; dow++) for (let hour = 11; hour < 22; hour++) cells.push({ dow, hour, covers: dow === 1 && hour === 16 ? 2 : 25 });
  core.setBaseline(r, cells);
  sent.length = 0;

  const wed = zonedToUtc(2026, 1, 7, 12, 0, 'America/Toronto');
  await core.tick(wed);
  await core.tick(new Date(wed.getTime() + 60e3));
  let list = core.listCampaigns(r);
  assert.equal(list.length, 1, 'only one planned');
  assert.equal(list[0].origin, 'auto');
  assert.equal(list[0].scheduled_at, zonedToUtc(2026, 1, 12, 16, 0, 'America/Toronto').toISOString());

  // Server was down through the slot: 3 hours late means the blast is dropped, not sent.
  await core.tick(zonedToUtc(2026, 1, 12, 19, 0, 'America/Toronto'));
  list = core.listCampaigns(r);
  assert.equal(list.find((c) => c.scheduled_at.startsWith('2026-01-12')).status, 'cancelled');
  assert.equal(sent.length, 0);
});

test('failed sends are recorded, not thrown', async () => {
  const db = openDb(':memory:');
  const core = createCore(db, createMessenger(db, { sms: () => { throw new Error('network down'); } }));
  const r = core.createRestaurant({ name: 'Test' });
  const out = await core.claimOffer(r, { name: 'A', phone: '6475550001' });
  assert.equal(out.smsStatus, 'failed');
  assert.equal(core.listMessages(r)[0].error, 'network down');
});

test('twilio signature validation', () => {
  const url = 'https://x.test/webhooks/twilio/sms';
  const params = { From: '+16475550001', Body: 'STOP' };
  const sig = crypto.createHmac('sha1', 'tok').update(`${url}Body${params.Body}From${params.From}`).digest('base64');
  assert.equal(validTwilioSignature('tok', sig, url, params), true);
  assert.equal(validTwilioSignature('tok', 'bad', url, params), false);
  assert.equal(validTwilioSignature('', sig, url, params), false);
});

test('floor: tables toggle seated/free, stale seatings clear, seatings feed slow-time data', () => {
  const { core, r } = setup({ table_count: 4 });
  const t0 = zonedToUtc(2026, 1, 12, 18, 0, 'America/Toronto');
  assert.deepEqual(core.toggleTable(r, '2', t0), { table: 2, seated: true });
  core.toggleTable(r, 3, t0);
  assert.throws(() => core.toggleTable(r, 5, t0), /does not exist/);
  assert.throws(() => core.toggleTable(r, 'x', t0), /does not exist/);
  assert.deepEqual(core.floorState(r, t0).map((t) => Boolean(t.seatedAt)), [false, true, true, false]);

  assert.deepEqual(core.toggleTable(r, 2, new Date(t0.getTime() + 3600e3)), { table: 2, seated: false });
  // Table 3 was never cleared: it frees itself after 4 hours.
  const late = new Date(t0.getTime() + 5 * 3600e3);
  assert.equal(core.floorState(r, late).filter((t) => t.seatedAt).length, 0);
  assert.deepEqual(core.toggleTable(r, 3, late), { table: 3, seated: true }, 'can be seated again');

  for (let i = 0; i < 40; i++) core.toggleTable(r, 1, new Date(t0.getTime() + i * 1000));
  const { source, grid } = core.activityGrid(r, late);
  assert.equal(source, 'activity');
  assert.ok(grid[1][18] >= 12, 'Monday 6 PM seatings counted');
});
