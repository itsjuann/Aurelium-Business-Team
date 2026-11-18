import crypto from 'node:crypto';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import express from 'express';
import QRCode from 'qrcode';
import { config, smsLive, emailLive } from './config.js';
import { createCore, UserError } from './core.js';
import { createMessenger, validTwilioSignature } from './messaging.js';
import { zonedToUtc } from './util.js';
import * as v from './views.js';

const here = path.dirname(fileURLToPath(import.meta.url));

// ---- small helpers ----------------------------------------------------------------

const sign = (value) => crypto.createHmac('sha256', config.sessionSecret).update(value).digest('base64url');
const token = (scope, hours) => {
  const payload = `${scope}.${Date.now() + hours * 3600 * 1000}`;
  return `${payload}.${sign(payload)}`;
};
function tokenValid(raw, scope) {
  const [s, exp, mac] = String(raw ?? '').split('.');
  if (s !== scope || !mac || Number(exp) < Date.now()) return false;
  const a = Buffer.from(mac), b = Buffer.from(sign(`${s}.${exp}`));
  return a.length === b.length && crypto.timingSafeEqual(a, b);
}
const cookies = (req) => Object.fromEntries((req.headers.cookie ?? '').split(';').map((c) => {
  const i = c.indexOf('=');
  return i < 0 ? ['', ''] : [c.slice(0, i).trim(), decodeURIComponent(c.slice(i + 1).trim())];
}));
const setCookie = (res, name, value, { path: p = '/', maxAge } = {}) =>
  res.append('Set-Cookie', `${name}=${encodeURIComponent(value)}; Path=${p}; HttpOnly; SameSite=Strict` +
    (maxAge != null ? `; Max-Age=${maxAge}` : '') + (config.isProd ? '; Secure' : ''));
const safeEqual = (a, b) => {
  const x = crypto.createHash('sha256').update(String(a)).digest();
  const y = crypto.createHash('sha256').update(String(b)).digest();
  return crypto.timingSafeEqual(x, y);
};

function rateLimiter(max, windowMs) {
  const hits = new Map();
  return (key) => {
    const now = Date.now();
    if (hits.size > 5000) for (const [k, h] of hits) if (h.reset < now) hits.delete(k);
    const h = hits.get(key);
    if (!h || h.reset < now) { hits.set(key, { n: 1, reset: now + windowMs }); return true; }
    return ++h.n <= max;
  };
}

const wrap = (fn) => (req, res, next) => Promise.resolve(fn(req, res, next)).catch(next);
const csvCell = (s) => {
  let t = String(s ?? '');
  if (/^[=+\-@\t\r]/.test(t)) t = `'${t}`; // stop spreadsheet formula injection
  return `"${t.replace(/"/g, '""')}"`;
};

// ---- app --------------------------------------------------------------------------

export function createApp(db, opts = {}) {
  const messenger = opts.messenger ?? createMessenger(db);
  const core = createCore(db, messenger);
  const app = express();
  app.set('trust proxy', 1);
  app.disable('x-powered-by');
  app.use((req, res, next) => {
    res.set({ 'X-Content-Type-Options': 'nosniff', 'X-Frame-Options': 'DENY', 'Referrer-Policy': 'same-origin' });
    next();
  });
  app.use('/static', express.static(path.join(here, '..', 'public'), { maxAge: '1h' }));
  app.use(express.urlencoded({ extended: false, limit: '100kb' }));

  const claimLimit = rateLimiter(8, 10 * 60 * 1000);
  const loginLimit = rateLimiter(10, 15 * 60 * 1000);

  app.get('/', (req, res) => res.redirect('/admin'));
  app.get('/healthz', (req, res) => res.json({ ok: true }));

  // ---- guest-facing -----------------------------------------------------------------

  const withRestaurant = (req, res, next) => {
    req.r = core.getRestaurant(req.params.slug);
    if (!req.r) return res.status(404).send(v.notFoundPage());
    next();
  };

  app.get('/r/:slug', withRestaurant, (req, res) => {
    core.recordScan(req.r, req.query.t);
    res.send(v.landingPage(req.r, { table: req.query.t }));
  });

  app.post('/r/:slug/claim', withRestaurant, wrap(async (req, res) => {
    const values = req.body;
    try {
      if (!claimLimit(req.ip)) throw new UserError('Too many attempts. Please try again in a few minutes.');
      const result = await core.claimOffer(req.r, { ...values, ip: req.ip });
      res.send(v.claimedPage(req.r, result));
    } catch (e) {
      if (!(e instanceof UserError)) throw e;
      res.status(400).send(v.landingPage(req.r, { table: values.table, error: e.message, values }));
    }
  }));

  // Staff redeem page, behind the restaurant's PIN.
  const staffCookie = (r) => `staff_${r.id}`;
  const staffAuthed = (req) => tokenValid(cookies(req)[staffCookie(req.r)], `staff${req.r.id}`);

  const staffView = (req, extra = {}) => v.staffPage(req.r, { authed: true, floor: core.floorState(req.r), ...extra });

  app.get('/r/:slug/staff', withRestaurant, (req, res) => {
    res.send(staffAuthed(req) ? staffView(req) : v.staffPage(req.r, { authed: false }));
  });
  app.post('/r/:slug/staff/table/:table', withRestaurant, (req, res) => {
    if (staffAuthed(req)) {
      try { core.toggleTable(req.r, req.params.table); } catch (e) { if (!(e instanceof UserError)) throw e; }
    }
    res.redirect(`/r/${req.r.slug}/staff`);
  });
  app.post('/r/:slug/staff', withRestaurant, (req, res) => {
    const r = req.r;
    if (!loginLimit(`staff:${r.id}:${req.ip}`)) {
      return res.status(429).send(v.staffPage(r, { error: 'Too many attempts. Try again later.' }));
    }
    if (!r.staff_pin || !safeEqual(req.body.pin, r.staff_pin)) {
      return res.status(401).send(v.staffPage(r, { error: 'That PIN is not right.' }));
    }
    setCookie(res, staffCookie(r), token(`staff${r.id}`, 12), { path: `/r/${r.slug}`, maxAge: 12 * 3600 });
    res.redirect(`/r/${r.slug}/staff`);
  });
  app.post('/r/:slug/staff/redeem', withRestaurant, (req, res) => {
    if (!staffAuthed(req)) return res.redirect(`/r/${req.r.slug}/staff`);
    try {
      const out = core.redeem(req.r, req.body.code);
      res.send(staffView(req, { success: `${out.code} redeemed: ${out.offer}` }));
    } catch (e) {
      if (!(e instanceof UserError)) throw e;
      res.status(400).send(staffView(req, { error: e.message }));
    }
  });

  // Twilio posts inbound texts here so STOP / START stay in sync with the guest list.
  app.post('/webhooks/twilio/sms', (req, res) => {
    const tokenSet = Boolean(config.twilio.authToken);
    if (tokenSet || config.isProd) {
      const ok = validTwilioSignature(config.twilio.authToken, req.get('X-Twilio-Signature'),
        config.baseUrl + req.originalUrl, req.body);
      if (!ok) return res.status(403).send('Invalid signature');
    }
    core.handleInbound(req.body.From, req.body.Body);
    res.type('text/xml').send('<?xml version="1.0" encoding="UTF-8"?><Response></Response>');
  });

  // ---- admin --------------------------------------------------------------------------

  const admin = express.Router();
  app.use('/admin', admin);

  admin.get('/login', (req, res) => res.send(v.loginPage()));
  admin.post('/login', (req, res) => {
    if (!loginLimit(`admin:${req.ip}`)) return res.status(429).send(v.loginPage('Too many attempts. Try again later.'));
    if (!safeEqual(req.body.password, config.adminPassword)) return res.status(401).send(v.loginPage('Wrong password.'));
    setCookie(res, 'sess', token('admin', 24 * 7), { maxAge: 7 * 24 * 3600 });
    res.redirect('/admin');
  });

  admin.use((req, res, next) => {
    if (!tokenValid(cookies(req).sess, 'admin')) return res.redirect('/admin/login');
    // Belt and braces on top of SameSite=Strict: reject cross-origin form posts.
    const origin = req.get('Origin');
    if (req.method !== 'GET' && origin && URL.parse(origin)?.host !== req.get('Host')) return res.status(403).send('Forbidden');
    res.set('Cache-Control', 'no-store');
    next();
  });

  admin.post('/logout', (req, res) => { setCookie(res, 'sess', '', { maxAge: 0 }); res.redirect('/admin/login'); });

  // One-shot flash message carried across a redirect.
  const flash = (res, ok, text) => setCookie(res, 'flash', JSON.stringify({ ok, text }), { path: '/admin', maxAge: 30 });
  const readFlash = (req, res) => {
    const raw = cookies(req).flash;
    if (!raw) return null;
    setCookie(res, 'flash', '', { path: '/admin', maxAge: 0 });
    try { return JSON.parse(raw); } catch { return null; }
  };
  /** Run a form action, then redirect with a success or error flash. */
  const action = (to, fn) => wrap(async (req, res) => {
    const dest = typeof to === 'function' ? to(req) : to;
    try {
      const msg = await fn(req, res);
      if (res.headersSent) return;
      flash(res, true, msg);
    } catch (e) {
      if (!(e instanceof UserError)) throw e;
      flash(res, false, e.message);
    }
    res.redirect(dest);
  });

  admin.get('/', (req, res) => res.send(v.restaurantsPage(core.listRestaurants(), readFlash(req, res))));
  admin.post('/restaurants', action('/admin', (req, res) => {
    const r = core.createRestaurant(req.body);
    res.redirect(`/admin/r/${r.slug}`);
  }));

  const rr = express.Router({ mergeParams: true });
  admin.use('/r/:slug', (req, res, next) => {
    req.r = core.getRestaurant(req.params.slug);
    if (!req.r) return res.status(404).send(v.notFoundPage());
    next();
  }, rr);
  const home = (req) => `/admin/r/${req.r.slug}`;

  rr.get('/', (req, res) => {
    const r = req.r;
    res.send(v.overviewPage(r, {
      s: core.stats(r), slot: core.slowestSlot(r), grid: core.activityGrid(r).grid, hours: core.sendableHours(r),
      floor: core.floorState(r), next: core.nextCampaign(r), live: { sms: smsLive(), email: emailLive() }, baseUrl: config.baseUrl,
    }, readFlash(req, res)));
  });

  rr.post('/redeem', action(home, (req) => {
    const out = core.redeem(req.r, req.body.code);
    return `${out.code} redeemed: ${out.offer}`;
  }));

  rr.get('/floor', (req, res) => res.send(v.floorPage(req.r, core.floorState(req.r), readFlash(req, res))));
  rr.post('/floor/:table', action((req) => `${home(req)}/floor`, (req) => {
    const out = core.toggleTable(req.r, req.params.table);
    return `Table ${out.table} ${out.seated ? 'seated' : 'freed'}.`;
  }));

  rr.get('/qr', wrap(async (req, res) => {
    const r = req.r;
    const cards = await Promise.all(Array.from({ length: r.table_count }, async (_, i) => ({
      table: i + 1,
      svg: await QRCode.toString(`${config.baseUrl}/r/${r.slug}?t=${i + 1}`, { type: 'svg', margin: 1, errorCorrectionLevel: 'M' }),
    })));
    res.send(v.qrPage(r, cards));
  }));

  rr.get('/guests', (req, res) => res.send(v.guestsPage(req.r, core.listContacts(req.r), core.stats(req.r))));
  rr.get('/guests.csv', (req, res) => {
    const rows = core.listContacts(req.r, 100000).map((g) =>
      [g.name, g.phone, g.email, g.source, g.tag, g.sms_opt_in ? 'yes' : 'no', g.consent_at, g.unsubscribed_at, g.created_at]
        .map(csvCell).join(','));
    res.type('text/csv').attachment(`${req.r.slug}-guests.csv`)
      .send(['name,phone,email,source,tag,sms_opt_in,consent_at,unsubscribed_at,created_at', ...rows].join('\n'));
  });

  rr.get('/campaigns', (req, res) => res.send(v.campaignsPage(req.r, {
    campaigns: core.listCampaigns(req.r), slot: core.slowestSlot(req.r), audience: core.audienceCount(req.r),
  }, readFlash(req, res))));

  rr.post('/campaigns', action((req) => `${home(req)}/campaigns`, async (req) => {
    const r = req.r;
    const { when, offer, at } = req.body;
    if (when === 'now') {
      if (!core.audienceCount(r)) throw new UserError('No guests have opted in to texts yet.');
      const camp = core.createCampaign(r, { offer, at: new Date() });
      const out = await core.sendCampaign(camp.id);
      return `Blast sent to ${out.recipients} guest${out.recipients === 1 ? '' : 's'}${out.failed ? `, ${out.failed} failed` : ''}.`;
    }
    let sendAt;
    if (when === 'slow') {
      const slot = core.slowestSlot(r);
      if (!slot) throw new UserError('There is no traffic data yet to find the slowest slot.');
      sendAt = slot.at;
    } else {
      const m = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})/.exec(at ?? '');
      if (!m) throw new UserError('Pick a date and time for the blast.');
      sendAt = zonedToUtc(+m[1], +m[2], +m[3], +m[4], +m[5], r.timezone);
    }
    core.createCampaign(r, { offer, at: sendAt });
    return 'Blast scheduled.';
  }));

  rr.post('/campaigns/:id/cancel', action((req) => `${home(req)}/campaigns`, (req) => {
    if (!core.cancelCampaign(req.r, Number(req.params.id))) throw new UserError('That blast can no longer be cancelled.');
    return 'Blast cancelled.';
  }));

  rr.get('/traffic', (req, res) => {
    const { source, grid } = core.activityGrid(req.r);
    res.send(v.trafficPage(req.r, { source, grid, hours: core.sendableHours(req.r), slot: core.slowestSlot(req.r) },
      readFlash(req, res)));
  });
  rr.post('/traffic', action((req) => `${home(req)}/traffic`, (req) => {
    if (req.body.clear) { core.setBaseline(req.r, []); return 'Cleared. Using scan and redemption data.'; }
    const cells = [];
    for (const [k, val] of Object.entries(req.body)) {
      const m = /^c_(\d)_(\d{1,2})$/.exec(k);
      if (m && val !== '' && Number.isFinite(Number(val))) cells.push({ dow: +m[1], hour: +m[2], covers: Number(val) });
    }
    if (!cells.length) throw new UserError('Enter at least one number.');
    core.setBaseline(req.r, cells);
    return 'Covers saved.';
  }));

  rr.get('/messages', (req, res) => res.send(v.messagesPage(req.r, core.listMessages(req.r))));

  rr.get('/settings', (req, res) => res.send(v.settingsPage(req.r, readFlash(req, res))));
  rr.post('/settings', action((req) => `${home(req)}/settings`, (req) => {
    core.updateRestaurant(req.r, { ...req.body, closed_days: req.body.closed_days ?? [] });
    return 'Settings saved.';
  }));

  app.use((req, res) => res.status(404).send(v.notFoundPage()));
  // eslint-disable-next-line no-unused-vars
  app.use((err, req, res, next) => {
    console.error(err);
    res.status(500).send('Something went wrong on our side. Please try again.');
  });

  return { app, core };
}
