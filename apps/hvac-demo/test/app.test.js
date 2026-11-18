'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const http = require('node:http');
const crypto = require('node:crypto');
const { createApp } = require('../src/app');
const { normalizePhone } = require('../src/validate');
const slots = require('../src/slots');

const TOOL = 'tool-secret-for-tests-0123456789abcdef';
const VIEW = 'view-key-for-tests-0123456789abcdefgh';
// Wednesday 2026-11-18 10:00 in New York (15:00 UTC).
const T0 = Date.UTC(2026, 10, 18, 15, 0, 0);

const open = new Set();
test.after(async () => { for (const c of open) await c(); });

async function start(overrides = {}) {
  const clock = { ms: overrides.at || T0 };
  const logs = [];
  const app = createApp({ toolSecret: TOOL, viewKey: VIEW, now: () => clock.ms, log: (o) => logs.push(o), insecureCookies: true, ...overrides });
  const server = http.createServer(app);
  await new Promise((r) => server.listen(0, '127.0.0.1', r));
  const base = `http://127.0.0.1:${server.address().port}`;
  const call = async (path, { body, headers = {}, method } = {}) => {
    const res = await fetch(base + path, {
      method: method || (body !== undefined ? 'POST' : 'GET'),
      headers: { ...(body !== undefined ? { 'Content-Type': 'application/json' } : {}), ...headers },
      body: body !== undefined ? (typeof body === 'string' ? body : JSON.stringify(body)) : undefined,
    });
    let json = null;
    try { json = await res.json(); } catch { /* not json */ }
    return { status: res.status, json, headers: res.headers };
  };
  const tool = (name, body, headers) => call(`/tools/${name}`, { body, headers: headers || { 'X-Aurelium-Signature': TOOL } });
  const close = () => new Promise((r) => { server.closeAllConnections(); server.close(r); });
  open.add(close);
  return { app, clock, logs, call, tool, close };
}
const booking = (over = {}) => ({
  window_id: 'w_2026-11-18_11', appointment_type: 'repair', urgency: 'urgent', caller_name: 'Pat Example', callback_phone: '(215) 555-0199',
  service_address: '1 Test Road', service_town: 'Testville', system_type: 'heating', issue_summary: 'Heat is out since this morning.',
  existing_customer: false, vulnerable_occupant: true, after_hours: false, conversation_id: 'conv_1', ...over,
});
const avail = (over = {}) => ({ appointment_type: 'repair', urgency: 'urgent', conversation_id: 'conv_1', ...over });
const lead = (over = {}) => ({ caller_name: 'Sam Example', callback_phone: '+12155550188', reason: 'price_question', urgency: 'routine', call_summary: 'Asked what a new furnace costs.', conversation_id: 'conv_9', ...over });
async function login(s) {
  const r = await s.call('/api/login', { body: { key: VIEW } });
  return r.headers.get('set-cookie').split(';')[0];
}

test('refuses to start without strong, distinct secrets', () => {
  assert.throws(() => createApp({ toolSecret: 'short', viewKey: VIEW }));
  assert.throws(() => createApp({ toolSecret: TOOL, viewKey: undefined }));
  assert.throws(() => createApp({ toolSecret: TOOL, viewKey: TOOL }));
});

test('tool endpoints reject missing or wrong auth before anything else', async () => {
  const s = await start();
  assert.equal((await s.tool('save_lead', lead(), {})).status, 401);
  assert.equal((await s.tool('save_lead', lead(), { 'X-Aurelium-Signature': 'wrong' })).status, 401);
  assert.equal((await s.tool('save_lead', 'not json', { 'X-Aurelium-Signature': 'wrong' })).status, 401);
  assert.equal(s.app.store.state.leads.length, 0);
  await s.close();
});

test('signed requests: valid, stale and tampered', async () => {
  const s = await start();
  const body = JSON.stringify(lead());
  const sign = (ts, b) => `t=${ts},v1=${crypto.createHmac('sha256', TOOL).update(`${ts}.${b}`).digest('hex')}`;
  const nowS = Math.floor(T0 / 1000);
  assert.equal((await s.tool('save_lead', body, { 'X-Aurelium-Signature': sign(nowS, body) })).status, 200);
  assert.equal((await s.tool('save_lead', body, { 'X-Aurelium-Signature': sign(nowS, body) })).status, 401, 'a signature is accepted once');
  assert.equal((await s.tool('save_lead', body, { 'X-Aurelium-Signature': sign(nowS - 301, body) })).status, 401);
  assert.equal((await s.tool('save_lead', body.replace('Sam', 'Tam'), { 'X-Aurelium-Signature': sign(nowS, body) })).status, 401);
  await s.close();
  const strict = await start({ allowStaticSecret: false });
  assert.equal((await strict.tool('save_lead', lead())).status, 401);
  await strict.close();
});

test('strict validation: unknown fields, bad enums, bad phone, wrong types', async () => {
  const s = await start();
  let r = await s.tool('save_lead', lead({ extra: 1 }));
  assert.equal(r.status, 400);
  assert.deepEqual(r.json.fields, ['unknown_field']);
  assert.equal((await s.tool('save_lead', '{"__proto__":{"x":1}}')).status, 400);
  assert.equal(({}).x, undefined);
  r = await s.tool('save_lead', lead({ reason: 'nope', callback_phone: '12345', wants_human: 'yes' }));
  assert.deepEqual(r.json.fields.sort(), ['callback_phone', 'reason', 'wants_human']);
  assert.ok(!JSON.stringify(r.json).includes('12345'), 'values are never echoed');
  assert.equal((await s.tool('save_lead', lead({ caller_name: 'x'.repeat(81) }))).status, 400);
  assert.equal((await s.tool('save_lead', '[1,2]')).status, 400);
  assert.equal((await s.tool('save_lead', '{bad')).status, 400);
  assert.equal((await s.call('/tools/save_lead', { body: 'a=b', headers: { 'Content-Type': 'text/plain', 'X-Aurelium-Signature': TOOL } })).status, 415);
  assert.equal((await s.tool('save_lead', lead({ call_summary: 'x'.repeat(20000) }))).status, 413);
  assert.equal((await s.call('/tools/save_lead', { headers: { 'X-Aurelium-Signature': TOOL } })).status, 405);
  assert.equal((await s.tool('nope', {})).status, 404);
  await s.close();
});

test('optional fields sent empty or null count as left out', async () => {
  const s = await start();
  assert.equal((await s.tool('save_lead', lead({ service_town: '', appointment_pref: null }))).status, 200);
  assert.equal((await s.tool('check_availability', avail({ preferred_day: '' }))).status, 200);
  assert.equal((await s.tool('save_lead', lead({ caller_name: '' }))).status, 400);
  await s.close();
});

test('phone numbers normalize to E.164', () => {
  assert.equal(normalizePhone('(215) 555-0199'), '+12155550199');
  assert.equal(normalizePhone('+1 215-555-0199'), '+12155550199');
  assert.equal(normalizePhone('215.555.0199'), '+12155550199');
  for (const bad of ['555-0199', '+442071234567', '115-555-0199', '215-155-0199', 'call me', 2155550199, '']) assert.equal(normalizePhone(bad), null);
});

test('long free text is cut to the limit, not rejected', async () => {
  const s = await start();
  const r = await s.tool('save_lead', lead({ call_summary: 'word '.repeat(150) }));
  assert.equal(r.status, 200);
  assert.ok(s.app.store.state.leads[0].call_summary.length <= 400);
  await s.close();
});

test('urgent availability always returns at least two real windows with spoken phrases', async () => {
  for (const at of [T0, Date.UTC(2026, 10, 19, 3, 0), Date.UTC(2026, 10, 22, 22, 0), Date.UTC(2026, 11, 31, 23, 30)]) {
    const s = await start({ at });
    const r = await s.tool('check_availability', avail());
    assert.equal(r.status, 200);
    assert.ok(r.json.windows.length >= 2 && r.json.windows.length <= 3);
    for (const w of r.json.windows) {
      assert.match(w.window_id, /^w_\d{4}-\d{2}-\d{2}_\d{2}$/);
      assert.match(w.spoken, / between (eight and eleven|eleven and two|two and five)$/);
      assert.ok(slots.isBookable(slots.parseWindowId(w.window_id), at));
    }
    await s.close();
  }
});

test('10am Wednesday: urgent offers today; routine starts tomorrow and skips Sunday', async () => {
  const s = await start();
  let r = await s.tool('check_availability', avail());
  assert.equal(r.json.windows[0].spoken, 'today between eleven and two');
  r = await s.tool('check_availability', avail({ urgency: 'routine', appointment_type: 'maintenance', conversation_id: 'c2' }));
  assert.equal(r.json.windows[0].spoken, 'tomorrow between eight and eleven');
  r = await s.tool('check_availability', avail({ urgency: 'routine', preferred_day: '2026-11-22', conversation_id: 'c3' }));
  assert.equal(r.json.windows[0].date, '2026-11-23');
  assert.equal(r.json.windows[0].spoken, 'Monday between eight and eleven');
  r = await s.tool('check_availability', avail({ urgency: 'routine', preferred_day: '2026-12-03', conversation_id: 'c4' }));
  assert.equal(r.json.windows[0].spoken, 'Thursday, December 3rd between eight and eleven');
  assert.equal((await s.tool('check_availability', avail({ preferred_day: '2026-02-30' }))).status, 400);
  await s.close();
});

test('booking: only offered windows, lands in the CRM, idempotent, moves on rebook', async () => {
  const s = await start();
  let r = await s.tool('book_appointment', booking());
  assert.deepEqual(r.json, { booked: false, reason: 'window_not_offered' });
  const offered = (await s.tool('check_availability', avail())).json.windows;
  r = await s.tool('book_appointment', booking({ window_id: offered[0].window_id }));
  assert.equal(r.json.booked, true);
  assert.equal(r.json.spoken_window, 'today between eleven and two');
  const jobId = r.json.job_id;
  r = await s.tool('book_appointment', booking({ window_id: offered[0].window_id }));
  assert.equal(r.json.job_id, jobId, 'a retry returns the same job');
  r = await s.tool('book_appointment', booking({ window_id: offered[1].window_id }));
  assert.equal(r.json.job_id, jobId, 'a change of mind moves the job');
  const real = s.app.store.state.jobs.filter((j) => !j.sample);
  assert.equal(real.length, 1);
  assert.equal(real[0].window_id, offered[1].window_id);
  assert.equal(s.app.store.state.customers.filter((c) => !c.sample).length, 1);

  const cookie = await login(s);
  const view = (await s.call('/api/state', { headers: { Cookie: cookie } })).json;
  const job = view.jobs.find((j) => j.id === jobId);
  assert.equal(job.source, 'AI receptionist, phone call');
  assert.equal(job.customer.phone, '+12155550199');
  assert.equal(job.customer.is_new, true);
  assert.equal(job.vulnerable_occupant, true);
  assert.equal(job.urgency, 'urgent');
  assert.ok(job.automations.some((a) => a.kind === 'Confirmation text' && a.status === 'Queued'));
  assert.equal(view.counts.booked_by_ai, 1);
  assert.equal((await s.tool('book_appointment', booking({ window_id: 'w_2026-11-17_08' }))).json.reason, 'window_unavailable');
  assert.equal((await s.tool('book_appointment', booking({ window_id: 'w_2026-11-19_09' }))).json.reason, 'window_unavailable');
  await s.close();
});

test('a full window is no longer offered or bookable', async () => {
  const s = await start();
  // Today 2-5 PM holds one sample job; one more call fills it.
  const id = 'w_2026-11-18_14';
  await s.tool('check_availability', avail({ conversation_id: 'a' }));
  await s.tool('check_availability', avail({ conversation_id: 'b' }));
  assert.equal((await s.tool('book_appointment', booking({ window_id: id, conversation_id: 'a' }))).json.booked, true);
  assert.equal((await s.tool('book_appointment', booking({ window_id: id, conversation_id: 'b', callback_phone: '2155550177' }))).json.reason, 'window_unavailable');
  const r = await s.tool('check_availability', avail({ conversation_id: 'c' }));
  assert.ok(!r.json.windows.some((w) => w.window_id === id));
  await s.close();
});

test('estimate bookings stage day 2, 7 and 14 follow-ups; completing a job queues the review request', async () => {
  const s = await start();
  const w = (await s.tool('check_availability', avail({ urgency: 'routine', appointment_type: 'estimate' }))).json.windows[0];
  const jobId = (await s.tool('book_appointment', booking({ window_id: w.window_id, urgency: 'routine', appointment_type: 'estimate' }))).json.job_id;
  const cookie = await login(s);
  const get = async () => (await s.call('/api/state', { headers: { Cookie: cookie } })).json.jobs.find((j) => j.id === jobId);
  let job = await get();
  assert.equal(job.automations.filter((a) => a.kind.startsWith('Estimate follow-up')).length, 3);
  assert.equal(job.automations.find((a) => a.kind === 'Review request').status, 'Staged');
  const post = { headers: { Cookie: cookie, 'X-Demo-CSRF': '1' }, body: { job_id: jobId } };
  assert.equal((await s.call('/api/jobs/complete', post)).status, 200);
  job = await get();
  assert.equal(job.automations.find((a) => a.kind === 'Review request').status, 'Queued');
  await s.close();
});

test('save_lead is idempotent per call and shows a call-back task', async () => {
  const s = await start();
  const a = await s.tool('save_lead', lead({ wants_human: true }));
  const b = await s.tool('save_lead', lead({ wants_human: true }));
  assert.equal(a.json.saved, true);
  assert.equal(a.json.lead_id, b.json.lead_id);
  assert.equal(s.app.store.state.leads.length, 1);
  const cookie = await login(s);
  const view = (await s.call('/api/state', { headers: { Cookie: cookie } })).json;
  assert.equal(view.leads[0].task, 'Call back: caller asked for a person');
  assert.equal(view.leads[0].reason, 'Price question');
  await s.close();
});

test('CRM data needs a session; state changes need the CSRF header and same origin', async () => {
  const s = await start();
  assert.equal((await s.call('/api/state')).status, 401);
  assert.equal((await s.call('/api/login', { body: { key: 'wrong' } })).status, 401);
  assert.equal((await s.call('/api/state', { headers: { Cookie: 'am_demo=9999999999.1.' + '0'.repeat(64) } })).status, 401);
  assert.equal((await s.call('/api/state', { headers: { 'X-Aurelium-Signature': TOOL } })).status, 401, 'the tool secret does not open the CRM');
  const cookie = await login(s);
  assert.equal((await s.call('/api/state', { headers: { Cookie: cookie } })).status, 200);
  assert.equal((await s.call('/api/reset', { headers: { Cookie: cookie }, body: {} })).status, 403);
  assert.equal((await s.call('/api/reset', { headers: { Cookie: cookie, 'X-Demo-CSRF': '1', Origin: 'https://evil.example' }, body: {} })).status, 403);
  assert.equal((await s.call('/api/reset', { headers: { 'X-Demo-CSRF': '1' }, body: {} })).status, 401);
  s.clock.ms += 13 * 3600000;
  assert.equal((await s.call('/api/state', { headers: { Cookie: cookie } })).status, 401, 'sessions expire after 12 hours');
  await s.close();
});

test('settings rename the shop; reset clears every call and restores placeholders', async () => {
  const s = await start();
  const cookie = await login(s);
  const h = { Cookie: cookie, 'X-Demo-CSRF': '1' };
  assert.equal((await s.call('/api/settings', { headers: h, body: { shop_name: 'Test Comfort Co', service_towns: 'Testville, Sampleton' } })).status, 200);
  assert.equal((await s.call('/api/settings', { headers: h, body: { shop_name: 'x', bogus: 1 } })).status, 400);
  const w = (await s.tool('check_availability', avail())).json.windows[0];
  await s.tool('book_appointment', booking({ window_id: w.window_id }));
  await s.tool('save_lead', lead());
  let view = (await s.call('/api/state', { headers: { Cookie: cookie } })).json;
  assert.equal(view.settings.shop_name, 'Test Comfort Co');
  assert.ok(view.jobs.find((j) => !j.sample).automations[0].text.startsWith('Test Comfort Co:'));
  assert.equal((await s.call('/api/reset', { headers: h, body: {} })).status, 200);
  view = (await s.call('/api/state', { headers: { Cookie: cookie } })).json;
  assert.equal(view.settings.shop_name, 'Demo Heating and Air');
  assert.equal(view.jobs.filter((j) => !j.sample).length, 0);
  assert.equal(view.leads.length, 0);
  assert.equal(s.app.store.state.customers.filter((c) => !c.sample).length, 0);
  await s.close();
});

test('call data older than 30 days is purged; sample data stays', async () => {
  const s = await start();
  const w = (await s.tool('check_availability', avail())).json.windows[0];
  await s.tool('book_appointment', booking({ window_id: w.window_id }));
  await s.tool('save_lead', lead());
  s.clock.ms += 29 * 86400000;
  assert.equal(s.app.store.purge(), 0);
  s.clock.ms += 2 * 86400000;
  assert.equal(s.app.store.purge(), 2);
  assert.equal(s.app.store.state.customers.filter((c) => !c.sample).length, 0);
  await s.close();
});

test('anonymous floods cannot lock out the tools or a signed-in screen', async () => {
  const s = await start();
  const cookie = await login(s);
  let last = 0;
  for (let i = 0; i < 70; i++) last = (await s.call('/healthz')).status;
  assert.equal(last, 429);
  for (let i = 0; i < 130; i++) last = (await s.call('/')).status;
  assert.equal(last, 429);
  for (let i = 0; i < 25; i++) last = (await s.tool('save_lead', lead(), { 'X-Aurelium-Signature': 'wrong' })).status;
  assert.equal(last, 429);
  assert.equal((await s.tool('check_availability', avail())).status, 200);
  assert.equal((await s.call('/api/state', { headers: { Cookie: cookie } })).status, 200);
  await s.close();
});

test('signing out ends the session; a bad URL is a 400', async () => {
  const s = await start();
  const cookie = await login(s);
  s.clock.ms += 1000;
  assert.equal((await s.call('/api/logout', { headers: { Cookie: cookie, 'X-Demo-CSRF': '1' }, body: {} })).status, 200);
  assert.equal((await s.call('/api/state', { headers: { Cookie: cookie } })).status, 401);
  s.clock.ms += 1000;
  const again = await login(s);
  assert.equal((await s.call('/api/state', { headers: { Cookie: again } })).status, 200);
  assert.equal((await s.call('//%')).status, 400);
  await s.close();
});

test('records are capped at 500 of each kind', async () => {
  const s = await start({ toolsPerMinute: 100000 });
  for (let i = 0; i < 505; i++) s.app.store.saveLead({ ...lead(), callback_phone: '+12155550188', conversation_id: `c${i}` });
  assert.equal(s.app.store.state.leads.length, 500);
  assert.equal(s.app.store.state.leads[0].conversation_id, 'c5');
  await s.close();
});

test('rate limits: tools per source, login attempts', async () => {
  const s = await start({ toolsPerMinute: 5 });
  for (let i = 0; i < 5; i++) assert.equal((await s.tool('save_lead', lead())).status, 200);
  assert.equal((await s.tool('save_lead', lead())).status, 429);
  s.clock.ms += 61000;
  assert.equal((await s.tool('save_lead', lead())).status, 200);
  for (let i = 0; i < 10; i++) await s.call('/api/login', { body: { key: 'wrong' } });
  assert.equal((await s.call('/api/login', { body: { key: VIEW } })).status, 429);
  await s.close();
});

test('logs carry ids and status only; responses carry security headers', async () => {
  const s = await start();
  const w = (await s.tool('check_availability', avail())).json.windows[0];
  await s.tool('book_appointment', booking({ window_id: w.window_id }));
  await s.tool('save_lead', lead());
  const text = JSON.stringify(s.logs);
  for (const secret of ['Pat Example', 'Sam Example', '5550199', '5550188', 'Test Road', 'Heat is out', TOOL, VIEW]) assert.ok(!text.includes(secret), `log leaked ${secret}`);
  const r = await s.call('/');
  assert.equal(r.status, 200);
  assert.match(r.headers.get('content-security-policy'), /default-src 'none'/);
  assert.equal(r.headers.get('x-frame-options'), 'DENY');
  assert.equal(r.headers.get('x-content-type-options'), 'nosniff');
  assert.match(r.headers.get('strict-transport-security'), /max-age=31536000/);
  const https = await start({ requireHttps: true });
  assert.equal((await https.call('/healthz')).status, 200, 'the health check works over internal http');
  assert.equal((await https.call('/')).status, 400);
  assert.equal((await https.call('/', { headers: { 'X-Forwarded-Proto': 'https' } })).status, 200);
  await https.close();
  await s.close();
});
