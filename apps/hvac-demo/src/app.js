'use strict';
const crypto = require('node:crypto');
const fs = require('node:fs');
const path = require('node:path');
const { validate, schemas } = require('./validate');
const { Store } = require('./store');
const slots = require('./slots');
const { nyNow, addDays, dayDiff, shortDay, spokenDay } = require('./time');

const MAX_BODY = 16 * 1024;
const REPLAY_WINDOW_S = 300;
const SESSION_S = 12 * 3600;
const COOKIE = 'am_demo';
const PUBLIC_DIR = path.join(__dirname, '..', 'public');
const STATIC = {
  '/': ['index.html', 'text/html; charset=utf-8'],
  '/app.js': ['app.js', 'text/javascript; charset=utf-8'],
  '/app.css': ['app.css', 'text/css; charset=utf-8'],
};
const REASON_LABEL = {
  no_heat: 'No heat', no_cooling: 'No cooling', leak: 'Water leak', maintenance: 'Maintenance', estimate: 'Estimate',
  reschedule: 'Reschedule', price_question: 'Price question', out_of_area: 'Out of area', safety: 'Safety', other: 'Other',
};

function safeEqual(a, b) {
  const ha = crypto.createHash('sha256').update(String(a)).digest();
  const hb = crypto.createHash('sha256').update(String(b)).digest();
  return crypto.timingSafeEqual(ha, hb);
}
function hmac(key, data) {
  return crypto.createHmac('sha256', key).update(data).digest('hex');
}

class RateLimiter {
  constructor(now) { this.now = now; this.buckets = new Map(); }
  hit(key, limit, windowMs = 60000) {
    const t = this.now();
    let b = this.buckets.get(key);
    if (!b || t >= b.reset) { b = { count: 0, reset: t + windowMs }; this.buckets.set(key, b); }
    b.count += 1;
    if (this.buckets.size > 5000) for (const [k, v] of this.buckets) if (t >= v.reset) this.buckets.delete(k);
    return b.count <= limit;
  }
}

function createApp(cfg) {
  const now = cfg.now || Date.now;
  const log = cfg.log || ((o) => console.log(JSON.stringify(o)));
  for (const name of ['toolSecret', 'viewKey']) {
    if (typeof cfg[name] !== 'string' || cfg[name].length < 32) throw new Error(`${name} must be set and at least 32 characters`);
  }
  if (cfg.toolSecret === cfg.viewKey) throw new Error('toolSecret and viewKey must be different');
  const sessionKey = hmac(cfg.viewKey, 'aurelium-demo-session-v1');
  const store = cfg.store || new Store({ dataDir: cfg.dataDir || null, now });
  const limiter = new RateLimiter(now);
  const seenSignatures = new Map();
  const files = {};
  for (const [route, [name, type]] of Object.entries(STATIC)) files[route] = { body: fs.readFileSync(path.join(PUBLIC_DIR, name)), type };

  // ---- helpers -----------------------------------------------------------
  function send(res, status, body, extra = {}) {
    const headers = {
      'Cache-Control': 'no-store',
      'X-Content-Type-Options': 'nosniff',
      'X-Frame-Options': 'DENY',
      'Referrer-Policy': 'no-referrer',
      'Strict-Transport-Security': 'max-age=31536000; includeSubDomains',
      'Content-Security-Policy': "default-src 'none'; script-src 'self'; style-src 'self'; connect-src 'self'; img-src 'self' data:; base-uri 'none'; form-action 'none'; frame-ancestors 'none'",
      ...extra,
    };
    let payload = body;
    if (!Buffer.isBuffer(body)) {
      payload = Buffer.from(JSON.stringify(body));
      headers['Content-Type'] = 'application/json; charset=utf-8';
    }
    headers['Content-Length'] = payload.length;
    res.writeHead(status, headers);
    res.end(payload);
  }
  function clientIp(req) {
    if (cfg.trustProxy) {
      const xff = String(req.headers['x-forwarded-for'] || '').split(',').map((s) => s.trim()).filter(Boolean);
      if (xff.length) return xff[xff.length - 1]; // the hop our own proxy added
    }
    return req.socket.remoteAddress || 'unknown';
  }
  function readBody(req) {
    return new Promise((resolve, reject) => {
      const chunks = [];
      let size = 0;
      req.on('data', (c) => {
        size += c.length;
        if (size > MAX_BODY) { chunks.length = 0; reject(Object.assign(new Error('too large'), { status: 413 })); return; }
        if (size <= MAX_BODY) chunks.push(c);
      });
      req.on('end', () => resolve(Buffer.concat(chunks)));
      req.on('error', reject);
    });
  }
  function parseJson(req, raw) {
    if (!/^application\/json\b/i.test(String(req.headers['content-type'] || ''))) throw Object.assign(new Error('type'), { status: 415 });
    try { return JSON.parse(raw.toString('utf8')); } catch { throw Object.assign(new Error('json'), { status: 400 }); }
  }

  // ---- tool auth: X-Aurelium-Signature ------------------------------------
  // Two accepted forms, both checked in constant time:
  //   signed:  "t=<unix seconds>,v1=<hex HMAC-SHA256(secret, t + '.' + raw body)>", 5 minute replay window
  //   static:  the shared secret itself, for platforms that can only send a fixed secret header
  function toolAuthorized(req, raw) {
    const h = req.headers['x-aurelium-signature'];
    if (typeof h !== 'string' || !h || h.length > 512) return false;
    const m = /^t=(\d{1,12}),v1=([0-9a-f]{64})$/.exec(h);
    if (m) {
      const ts = Number(m[1]);
      if (Math.abs(now() / 1000 - ts) > REPLAY_WINDOW_S) return false;
      if (!safeEqual(m[2], hmac(cfg.toolSecret, `${m[1]}.${raw.toString('utf8')}`))) return false;
      // A signature is accepted once. Entries outlive the replay window, then are dropped.
      const t = now();
      for (const [k, exp] of seenSignatures) if (exp <= t) seenSignatures.delete(k);
      if (seenSignatures.has(m[2]) || seenSignatures.size >= 5000) return false;
      seenSignatures.set(m[2], t + 2 * REPLAY_WINDOW_S * 1000);
      return true;
    }
    if (cfg.allowStaticSecret === false) return false;
    return safeEqual(h, cfg.toolSecret);
  }

  // ---- CRM session ----------------------------------------------------------
  function sessionCookie() {
    const iat = now();
    const exp = Math.floor(iat / 1000) + SESSION_S;
    const secure = cfg.insecureCookies ? '' : ' Secure;';
    return `${COOKIE}=${exp}.${iat}.${hmac(sessionKey, `${exp}.${iat}`)}; HttpOnly;${secure} SameSite=Strict; Path=/; Max-Age=${SESSION_S}`;
  }
  function hasSession(req) {
    const m = new RegExp(`(?:^|;\\s*)${COOKIE}=(\\d{1,12})\\.(\\d{1,15})\\.([0-9a-f]{64})(?:;|$)`).exec(String(req.headers.cookie || ''));
    if (!m) return false;
    if (Number(m[1]) < now() / 1000) return false;
    if (Number(m[2]) <= store.revokedBefore()) return false; // signed out
    return safeEqual(m[3], hmac(sessionKey, `${m[1]}.${m[2]}`));
  }
  // State-changing CRM calls: session cookie, a custom header and a same-origin check.
  function sameOrigin(req) {
    if (req.headers['x-demo-csrf'] !== '1') return false;
    const origin = req.headers.origin;
    if (!origin) return true;
    try { return new URL(origin).host === req.headers.host; } catch { return false; }
  }

  // ---- what the CRM screen shows ---------------------------------------------
  function automations(job, shop, today) {
    const win = slots.parseWindowId(job.window_id);
    const when = `${spokenDay(job.date, today)} between ${win.words}`;
    const list = [{
      kind: 'Confirmation text', status: job.sample ? 'Sent' : 'Queued', note: job.sample ? '' : 'Demo: shown here, not sent',
      text: `${shop}: you're booked for ${when}. Your tech will arrive in that window. Reply to this text or call us to make a change.`,
    }];
    // A visit today or tomorrow is already covered by the confirmation text.
    if (dayDiff(job.date, today) >= 2) {
      list.push({
        kind: 'Day-before reminder', status: 'Scheduled', note: `Goes out ${shortDay(addDays(job.date, -1), today)}`,
        text: `${shop}: a reminder that your tech arrives tomorrow between ${win.words}.`,
      });
    }
    if (job.estimate_requested) {
      for (const d of [2, 7, 14]) {
        list.push({
          kind: `Estimate follow-up, day ${d}`, status: 'Staged', note: `${shortDay(addDays(job.date, d), today)}, only if the estimate is still open`,
          text: `${shop}: checking in on the estimate we left with you. Any questions, or would you like to get on the schedule?`,
        });
      }
    }
    const done = job.status === 'complete' || job.status === 'won';
    if (job.status === 'won') list.forEach((a) => { if (a.kind.startsWith('Estimate follow-up')) { a.status = 'Stopped'; a.note = 'Estimate accepted'; } });
    list.push({
      kind: 'Review request', status: done ? 'Queued' : 'Staged', note: done ? 'Demo: shown here, not sent' : 'Goes out when the job is marked complete',
      text: `Thanks for choosing ${shop}. If we took good care of you, would you leave us a quick Google review? [review link]`,
    });
    return list;
  }
  // Where a job sits in the pipeline and what it is worth, using the shop's own averages.
  // Service visits count as booked revenue. An estimate is open pipeline until it is won.
  function worth(job, money) {
    if (job.estimate_requested) {
      if (job.status === 'won') return { stage: 'won', value: money.avg_install, counts_as: 'booked' };
      if (job.status === 'complete') return { stage: 'estimate_open', value: money.avg_install, counts_as: 'pipeline' };
      return { stage: 'booked', value: money.avg_install, counts_as: 'pipeline' };
    }
    return { stage: job.status === 'complete' ? 'completed' : 'booked', value: money.avg_ticket, counts_as: 'booked' };
  }
  function leadWorth(lead, money) {
    if (lead.reason === 'estimate') return money.avg_install;
    return ['no_heat', 'no_cooling', 'leak', 'maintenance', 'reschedule'].includes(lead.reason) ? money.avg_ticket : 0;
  }
  function viewState() {
    store.ensureSeed();
    const s = store.state;
    const today = nyNow(now()).date;
    const shop = s.settings.shop_name;
    const money = store.money();
    const customers = new Map(s.customers.map((c) => [c.id, c]));
    const jobs = s.jobs.map((j) => {
      const win = slots.parseWindowId(j.window_id);
      const c = customers.get(j.customer_id) || {};
      const w = worth(j, money);
      return {
        stage: w.stage, value: w.value, counts_as: w.counts_as, estimate: j.estimate_requested,
        id: j.id, date: j.date, start: j.start, window_label: win.label, day_label: shortDay(j.date, today),
        appointment_type: j.appointment_type, urgency: j.urgency, system_type: j.system_type, issue_summary: j.issue_summary,
        vulnerable_occupant: j.vulnerable_occupant, after_hours: j.after_hours, status: j.status, sample: j.sample,
        source: j.sample ? 'Sample data' : 'AI receptionist, phone call', created_at: j.created_at, updated_at: j.updated_at || j.created_at,
        customer: { name: c.name, phone: c.phone, address: c.address, town: c.town, is_new: c.is_new },
        automations: automations(j, shop, today),
      };
    });
    const leads = s.leads.map((l) => ({
      value: leadWorth(l, money),
      id: l.id, caller_name: l.caller_name, callback_phone: l.callback_phone, reason: REASON_LABEL[l.reason] || 'Other', urgency: l.urgency,
      service_town: l.service_town, appointment_pref: l.appointment_pref, wants_human: l.wants_human, call_summary: l.call_summary,
      source: 'AI receptionist, phone call', task: l.wants_human ? 'Call back: caller asked for a person' : 'Call back',
      created_at: l.created_at, updated_at: l.updated_at || l.created_at,
    }));
    return {
      settings: { shop_name: s.settings.shop_name, service_towns: s.settings.service_towns, ...money },
      days: [0, 1, 2, 3].map((n) => ({ date: addDays(today, n), label: shortDay(addDays(today, n), today) })),
      windows: slots.WINDOWS.map((w) => ({ start: w.start, label: w.label })),
      jobs, leads,
      counts: { booked_by_ai: jobs.filter((j) => !j.sample).length, leads: leads.length },
      // Money counts only what came in through the AI receptionist. Sample data is never counted.
      totals: {
        booked_revenue: jobs.filter((j) => !j.sample && j.counts_as === 'booked').reduce((n, j) => n + j.value, 0),
        open_pipeline: jobs.filter((j) => !j.sample && j.counts_as === 'pipeline').reduce((n, j) => n + j.value, 0) + leads.reduce((n, l) => n + l.value, 0),
        guarantee_target: 15000, guarantee_days: 90,
      },
    };
  }

  // ---- tool handlers ----------------------------------------------------------
  const tools = {
    check_availability(v) {
      const windows = slots.findWindows({ nowMs: now(), urgency: v.urgency, preferredDay: v.preferred_day, countInWindow: (id) => store.countInWindow(id, v.conversation_id) });
      store.rememberOffer(v.conversation_id, windows.map((w) => w.window_id));
      return { body: { windows }, id: v.conversation_id };
    },
    book_appointment(v) {
      const win = slots.parseWindowId(v.window_id);
      if (!win || !slots.isBookable(win, now())) return { body: { booked: false, reason: 'window_unavailable' }, id: v.conversation_id };
      const mine = store.state.jobs.find((j) => j.conversation_id === v.conversation_id);
      if (!(mine && mine.window_id === win.window_id)) {
        if (!store.wasOffered(v.conversation_id, win.window_id)) return { body: { booked: false, reason: 'window_not_offered' }, id: v.conversation_id };
        if (store.countInWindow(win.window_id, v.conversation_id) >= slots.CAPACITY) return { body: { booked: false, reason: 'window_unavailable' }, id: v.conversation_id };
      }
      const job = store.book(v);
      return { body: { booked: true, job_id: job.id, spoken_window: slots.spoken(win, now()) }, id: job.id };
    },
    save_lead(v) {
      const lead = store.saveLead(v);
      return { body: { saved: true, lead_id: lead.id }, id: lead.id };
    },
  };

  // ---- router -----------------------------------------------------------------
  async function route(req, res) {
    let p;
    try { p = new URL(req.url, 'http://local').pathname; } catch { return send(res, 400, { error: 'invalid_request' }); }
    const ip = clientIp(req);
    const limited = () => send(res, 429, { error: 'rate_limited' }, { 'Retry-After': '30' });

    // The host's health check may arrive over internal HTTP, so it sits above the HTTPS rule. It returns no data.
    if (p === '/healthz' && req.method === 'GET') return limiter.hit(`health:${ip}`, 60) ? send(res, 200, { ok: true }) : limited();
    if (cfg.requireHttps && req.headers['x-forwarded-proto'] !== 'https') return send(res, 400, { error: 'https_required' });

    // Limits are split so anonymous traffic can never use up the allowance of the
    // receptionist's tool calls or of a signed-in CRM screen.
    const isTool = p.startsWith('/tools/');
    const session = !isTool && hasSession(req);
    if (!isTool) {
      if (session) { if (!limiter.hit('session', 1200)) return limited(); }
      else if (!limiter.hit(`anon:${ip}`, cfg.anonPerMinute || 120) || !limiter.hit('anon:all', 600)) return limited();
    }
    if (files[p]) {
      if (req.method !== 'GET' && req.method !== 'HEAD') return send(res, 405, { error: 'method_not_allowed' });
      return send(res, 200, files[p].body, { 'Content-Type': files[p].type });
    }

    if (p.startsWith('/tools/')) {
      const name = p.slice('/tools/'.length);
      if (!Object.hasOwn(tools, name)) return send(res, 404, { error: 'not_found' });
      if (req.method !== 'POST') return send(res, 405, { error: 'method_not_allowed' });
      const raw = await readBody(req);
      if (!toolAuthorized(req, raw)) {
        if (!limiter.hit(`toolfail:${ip}`, 20) || !limiter.hit('toolfail:all', 300)) return limited();
        log({ route: name, status: 401 });
        return send(res, 401, { error: 'unauthorized' });
      }
      if (!limiter.hit('tools', cfg.toolsPerMinute || 120)) return limited();
      const parsed = validate(schemas[name], parseJson(req, raw));
      if (!parsed.ok) { log({ route: name, status: 400 }); return send(res, 400, { error: 'invalid_request', fields: parsed.fields }); }
      const out = tools[name](parsed.value);
      log({ route: name, status: 200, id: out.id });
      return send(res, 200, out.body);
    }

    if (p === '/api/login' && req.method === 'POST') {
      if (!limiter.hit(`login:${ip}`, 10) || !limiter.hit('login:all', 60)) return send(res, 429, { error: 'rate_limited' }, { 'Retry-After': '60' });
      const parsed = validate(schemas.login, parseJson(req, await readBody(req)));
      if (!parsed.ok || !safeEqual(parsed.value.key, cfg.viewKey)) { log({ route: 'login', status: 401 }); return send(res, 401, { error: 'unauthorized' }); }
      log({ route: 'login', status: 200 });
      return send(res, 200, { ok: true }, { 'Set-Cookie': sessionCookie() });
    }
    if (p.startsWith('/api/')) {
      if (!session) return send(res, 401, { error: 'unauthorized' });
      if (p === '/api/state' && req.method === 'GET') return send(res, 200, viewState());
      if (req.method !== 'POST') return send(res, 405, { error: 'method_not_allowed' });
      if (!sameOrigin(req)) return send(res, 403, { error: 'forbidden' });
      const raw = await readBody(req);
      if (p === '/api/logout') { store.revokeSessions(); return send(res, 200, { ok: true }, { 'Set-Cookie': `${COOKIE}=; HttpOnly; SameSite=Strict; Path=/; Max-Age=0` }); }
      if (p === '/api/reset') { store.reset(); log({ route: 'reset', status: 200 }); return send(res, 200, { ok: true }); }
      if (p === '/api/settings') {
        const parsed = validate(schemas.settings, parseJson(req, raw));
        if (!parsed.ok) return send(res, 400, { error: 'invalid_request', fields: parsed.fields });
        store.setSettings(parsed.value);
        log({ route: 'settings', status: 200 });
        return send(res, 200, { ok: true });
      }
      if (p === '/api/jobs/won') {
        const parsed = validate(schemas.complete, parseJson(req, raw));
        const job = parsed.ok ? store.winEstimate(parsed.value.job_id) : null;
        if (!job) return send(res, 404, { error: 'not_found' });
        log({ route: 'won', status: 200, id: job.id });
        return send(res, 200, { ok: true });
      }
      if (p === '/api/jobs/complete') {
        const parsed = validate(schemas.complete, parseJson(req, raw));
        const job = parsed.ok ? store.completeJob(parsed.value.job_id) : null;
        if (!job) return send(res, 404, { error: 'not_found' });
        log({ route: 'complete', status: 200, id: job.id });
        return send(res, 200, { ok: true });
      }
    }
    return send(res, 404, { error: 'not_found' });
  }

  function handler(req, res) {
    route(req, res).catch((err) => {
      const status = [400, 413, 415].includes(err && err.status) ? err.status : 500;
      if (status === 500) log({ route: 'error', status: 500 });
      if (res.headersSent) { res.destroy(); return; }
      // An oversized upload is answered, then the connection is dropped so the rest is never read.
      if (status === 413) res.once('finish', () => req.destroy());
      send(res, status, { error: status === 500 ? 'server_error' : 'invalid_request' }, status === 413 ? { Connection: 'close' } : {});
    });
  }
  handler.store = store;
  return handler;
}
module.exports = { createApp };
