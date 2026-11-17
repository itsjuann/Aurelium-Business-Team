import { nowIso, tx } from './db.js';
import {
  normalizePhone, validEmail, slugify, randomCode, validTimezone,
  zonedParts, zonedToUtc, hourLabel,
} from './util.js';

export const CONSENT_TEXT = (name) =>
  `I agree to receive recurring marketing text messages from ${name} at the number provided. ` +
  'Consent is not a condition of purchase. Msg & data rates may apply. Reply STOP to opt out.';

// Marketing texts only go out inside this local-time window (TCPA / CASL quiet hours).
const QUIET_START = 8;
const QUIET_END = 21;
const ACTIVITY_DAYS = 56;
const MIN_ACTIVITY_EVENTS = 20;
const STALE_MS = 2 * 60 * 60 * 1000;

export class UserError extends Error {}

export function createCore(db, messenger) {
  const q = (sql) => db.prepare(sql);

  // ---- restaurants ----------------------------------------------------------

  const getRestaurant = (slug) => q('SELECT * FROM restaurants WHERE slug = ?').get(String(slug)) ?? null;
  const listRestaurants = () => q('SELECT * FROM restaurants ORDER BY name').all();

  function cleanSettings(input, current = {}) {
    const int = (v, lo, hi, d) => {
      const n = Number.parseInt(v, 10);
      return Number.isFinite(n) ? Math.min(hi, Math.max(lo, n)) : d;
    };
    const str = (v, d, max = 160) => (String(v ?? '').trim().slice(0, max) || d);
    const tz = str(input.timezone, current.timezone ?? 'America/Toronto');
    if (!validTimezone(tz)) throw new UserError(`Unknown time zone: ${tz}`);
    const color = str(input.brand_color, current.brand_color ?? '#2dd4bf');
    if (!/^#[0-9a-fA-F]{6}$/.test(color)) throw new UserError('Brand colour must look like #2dd4bf');
    const open = int(input.open_hour, 0, 23, current.open_hour ?? 11);
    const close = int(input.close_hour, 1, 24, current.close_hour ?? 22);
    if (close <= open) throw new UserError('Closing hour must be after opening hour');
    const closedDays = []
      .concat(input.closed_days ?? [])
      .flatMap((v) => String(v).split(','))
      .map((v) => Number.parseInt(v, 10))
      .filter((n) => n >= 0 && n <= 6);
    const pin = String(input.staff_pin ?? current.staff_pin ?? '').trim();
    if (pin && !/^\d{4,8}$/.test(pin)) throw new UserError('Staff PIN must be 4-8 digits');
    return {
      name: str(input.name, current.name, 60),
      timezone: tz,
      brand_color: color,
      welcome_offer: str(input.welcome_offer, current.welcome_offer ?? 'Free appetizer', 80),
      table_count: int(input.table_count, 1, 300, current.table_count ?? 12),
      open_hour: open,
      close_hour: close,
      closed_days: [...new Set(closedDays)].sort().join(','),
      avg_check_cents: Math.round(100 * Math.max(0, Number.parseFloat(input.avg_check) ||
        (current.avg_check_cents ?? 4500) / 100)),
      staff_pin: pin,
      auto_blast: input.auto_blast ? 1 : 0,
      blast_offer: str(input.blast_offer, current.blast_offer ?? 'Buy one, get one FREE on any pasta', 100),
      blast_window_hours: int(input.blast_window_hours, 1, 8, current.blast_window_hours ?? 3),
    };
  }

  function createRestaurant(input) {
    const s = cleanSettings(input);
    if (!s.name) throw new UserError('Restaurant name is required');
    const slug = slugify(input.slug || s.name);
    if (!slug) throw new UserError('Restaurant name needs at least one letter or number');
    if (getRestaurant(slug)) throw new UserError(`"${slug}" is already taken`);
    q(`INSERT INTO restaurants (slug, name, timezone, brand_color, welcome_offer, table_count, open_hour,
        close_hour, closed_days, avg_check_cents, staff_pin, auto_blast, blast_offer, blast_window_hours, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`)
      .run(slug, s.name, s.timezone, s.brand_color, s.welcome_offer, s.table_count, s.open_hour, s.close_hour,
        s.closed_days, s.avg_check_cents, s.staff_pin, s.auto_blast, s.blast_offer, s.blast_window_hours, nowIso());
    return getRestaurant(slug);
  }

  function updateRestaurant(r, input) {
    const s = cleanSettings(input, r);
    q(`UPDATE restaurants SET name=?, timezone=?, brand_color=?, welcome_offer=?, table_count=?, open_hour=?,
        close_hour=?, closed_days=?, avg_check_cents=?, staff_pin=?, auto_blast=?, blast_offer=?,
        blast_window_hours=? WHERE id=?`)
      .run(s.name, s.timezone, s.brand_color, s.welcome_offer, s.table_count, s.open_hour, s.close_hour,
        s.closed_days, s.avg_check_cents, s.staff_pin, s.auto_blast, s.blast_offer, s.blast_window_hours, r.id);
    return getRestaurant(r.slug);
  }

  // ---- steps 1-4: scan -> landing page -> contact -> confirmation -------------

  const cleanTable = (t) => String(t ?? '').replace(/[^\w-]/g, '').slice(0, 8) || null;

  function recordScan(r, table) {
    q('INSERT INTO scans (restaurant_id, table_no, created_at) VALUES (?, ?, ?)').run(r.id, cleanTable(table), nowIso());
  }

  function newCode(r, prefix, table) {
    for (let i = 0; i < 20; i++) {
      const code = randomCode(prefix);
      if (!q(`SELECT 1 FROM ${table} WHERE restaurant_id = ? AND code = ?`).get(r.id, code)) return code;
    }
    throw new Error('Could not allocate a unique code');
  }

  async function claimOffer(r, input) {
    const name = String(input.name ?? '').trim().slice(0, 80);
    const phone = normalizePhone(input.phone);
    const email = String(input.email ?? '').trim().toLowerCase().slice(0, 160);
    if (!name) throw new UserError('Please enter your name.');
    if (!phone) throw new UserError('Please enter a valid mobile number.');
    if (email && !validEmail(email)) throw new UserError('That email address does not look right.');
    const table = cleanTable(input.table);
    const optIn = input.consent ? 1 : 0;
    const now = nowIso();

    const existing = q('SELECT * FROM contacts WHERE restaurant_id = ? AND phone = ?').get(r.id, phone);
    if (existing) {
      // One welcome offer per number. A returning guest may still join the list.
      if (optIn && !existing.sms_opt_in) {
        q(`UPDATE contacts SET sms_opt_in = 1, consent_text = ?, consent_at = ?, consent_ip = ?,
           unsubscribed_at = NULL WHERE id = ?`).run(CONSENT_TEXT(r.name), now, input.ip ?? null, existing.id);
      }
      return { isNew: false, contact: existing };
    }

    const { contactId, code } = tx(db, () => {
      const res = q(`INSERT INTO contacts (restaurant_id, name, phone, email, source, table_no, tag, sms_opt_in,
          consent_text, consent_at, consent_ip, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`)
        .run(r.id, name, phone, email || null, table ? `Table QR · Table ${table}` : 'Landing page', table,
          r.welcome_offer, optIn, optIn ? CONSENT_TEXT(r.name) : null, optIn ? now : null,
          optIn ? input.ip ?? null : null, now);
      const id = Number(res.lastInsertRowid);
      const c = newCode(r, 'APP', 'coupons');
      q('INSERT INTO coupons (restaurant_id, contact_id, code, offer, created_at) VALUES (?, ?, ?, ?, ?)')
        .run(r.id, id, c, r.welcome_offer, now);
      return { contactId: id, code: c };
    });

    const meta = { restaurantId: r.id, contactId };
    const offer = r.welcome_offer.toLowerCase();
    const sms = await messenger.sendSms(meta, phone,
      `${r.name}: Your ${offer} is ready! Show this text to your server. Code: ${code}` +
      (optIn ? '\nReply STOP to opt out.' : ''));
    if (email) {
      await messenger.sendEmail(meta, email, `Claim your ${offer}`,
        `Hi ${name.split(' ')[0]},\n\nThanks for joining ${r.name} Rewards. Your ${offer} is ready.\n\n` +
        `Show this code to your server: ${code}\n\nSee you soon,\n${r.name}`, r.name);
    }
    return { isNew: true, code, smsStatus: sms.status, contact: q('SELECT * FROM contacts WHERE id = ?').get(contactId) };
  }

  /** Staff enter a code at the table. Works for welcome coupons and blast codes. */
  function redeem(r, rawCode, now = new Date()) {
    const code = String(rawCode ?? '').trim().toUpperCase();
    if (!code) throw new UserError('Enter the code from the guest\'s text.');
    const at = now.toISOString();
    const coupon = q('SELECT * FROM coupons WHERE restaurant_id = ? AND code = ?').get(r.id, code);
    if (coupon) {
      const done = q('UPDATE coupons SET redeemed_at = ? WHERE id = ? AND redeemed_at IS NULL').run(at, coupon.id);
      if (!done.changes) throw new UserError(`${code} was already redeemed.`);
      q('INSERT INTO redemptions (restaurant_id, coupon_id, created_at) VALUES (?, ?, ?)').run(r.id, coupon.id, at);
      return { kind: 'welcome', offer: coupon.offer, code };
    }
    const camp = q('SELECT * FROM campaigns WHERE restaurant_id = ? AND code = ?').get(r.id, code);
    if (camp) {
      if (camp.status !== 'sent' && camp.status !== 'sending') throw new UserError(`${code} has not been sent to guests yet.`);
      if (at > camp.expires_at) throw new UserError(`${code} expired — the offer window has closed.`);
      q('INSERT INTO redemptions (restaurant_id, campaign_id, created_at) VALUES (?, ?, ?)').run(r.id, camp.id, at);
      return { kind: 'campaign', offer: camp.offer, code };
    }
    throw new UserError(`No offer found for ${code}.`);
  }

  // ---- step 6: slow-time analysis ---------------------------------------------

  /** 7x24 grid of how busy each weekday/hour is, plus where the numbers came from. */
  function activityGrid(r, now = new Date()) {
    const grid = Array.from({ length: 7 }, () => new Array(24).fill(0));
    const base = q('SELECT dow, hour, covers FROM traffic_baseline WHERE restaurant_id = ?').all(r.id);
    if (base.length) {
      for (const b of base) grid[b.dow][b.hour] = b.covers;
      return { source: 'baseline', grid };
    }
    const since = new Date(now.getTime() - ACTIVITY_DAYS * 864e5).toISOString();
    const events = q(`SELECT created_at FROM scans WHERE restaurant_id = ?1 AND created_at >= ?2
                      UNION ALL SELECT created_at FROM redemptions WHERE restaurant_id = ?1 AND created_at >= ?2`)
      .all(r.id, since);
    if (events.length < MIN_ACTIVITY_EVENTS) return { source: null, grid };
    for (const e of events) {
      const p = zonedParts(new Date(e.created_at), r.timezone);
      grid[p.dow][p.h] += 1;
    }
    return { source: 'activity', grid };
  }

  const closedSet = (r) => new Set(r.closed_days ? r.closed_days.split(',').map(Number) : []);
  /** Hours at which a blast may start: open, inside quiet hours, >= 1h before close. */
  function sendableHours(r) {
    const out = [];
    for (let h = Math.max(r.open_hour, QUIET_START); h <= Math.min(r.close_hour - 1, QUIET_END - 1); h++) out.push(h);
    return out;
  }

  /** The quietest upcoming hour in the next 7 days, or null when there is no traffic data yet. */
  function slowestSlot(r, now = new Date()) {
    const { source, grid } = activityGrid(r, now);
    if (!source) return null;
    const today = zonedParts(now, r.timezone);
    const closed = closedSet(r);
    const hours = sendableHours(r);
    let best = null;
    for (let i = 0; i <= 7; i++) {
      const day = new Date(Date.UTC(today.y, today.m - 1, today.d + i));
      const dow = day.getUTCDay();
      if (closed.has(dow)) continue;
      for (const hour of hours) {
        const at = zonedToUtc(day.getUTCFullYear(), day.getUTCMonth() + 1, day.getUTCDate(), hour, 0, r.timezone);
        if (at.getTime() < now.getTime() + 5 * 60 * 1000) continue;
        if (at.getTime() > now.getTime() + 7 * 864e5) continue;
        const value = grid[dow][hour];
        if (!best || value < best.value) best = { dow, hour, at, value, source };
      }
    }
    return best;
  }

  function setBaseline(r, cells) {
    tx(db, () => {
      q('DELETE FROM traffic_baseline WHERE restaurant_id = ?').run(r.id);
      const ins = q('INSERT OR REPLACE INTO traffic_baseline (restaurant_id, dow, hour, covers) VALUES (?, ?, ?, ?)');
      for (const c of cells) {
        if (c.dow >= 0 && c.dow <= 6 && c.hour >= 0 && c.hour <= 23 && c.covers >= 0) {
          ins.run(r.id, c.dow, c.hour, Math.round(c.covers));
        }
      }
    });
  }

  // ---- step 7: SMS blasts -----------------------------------------------------

  const audienceCount = (r) =>
    q('SELECT COUNT(*) n FROM contacts WHERE restaurant_id = ? AND sms_opt_in = 1 AND unsubscribed_at IS NULL').get(r.id).n;

  function createCampaign(r, { offer, at, origin = 'manual' }, now = new Date()) {
    const text = String(offer ?? '').trim().slice(0, 100);
    if (!text) throw new UserError('Write the offer first.');
    if (!(at instanceof Date) || Number.isNaN(at.getTime())) throw new UserError('Pick a valid send time.');
    if (at.getTime() < now.getTime() - 60 * 1000) throw new UserError('That send time is in the past.');
    const local = zonedParts(at, r.timezone);
    if (local.h < QUIET_START || local.h >= QUIET_END) {
      throw new UserError(`Marketing texts can only go out between ${hourLabel(QUIET_START)} and ${hourLabel(QUIET_END)} local time.`);
    }
    // Offer runs for the configured window, but never past closing time.
    const endHour = Math.min(local.h + r.blast_window_hours, Math.max(r.close_hour, local.h + 1));
    const expires = zonedToUtc(local.y, local.m, local.d, endHour, 0, r.timezone);
    const code = newCode(r, 'VIP', 'campaigns');
    const until = hourLabel(endHour).replace(':00', '');
    const body = `${r.name}: TODAY ONLY: ${text} until ${until}. Show this text to redeem. Code ${code}. Reply STOP to opt out.`;
    const res = q(`INSERT INTO campaigns (restaurant_id, offer, body, code, scheduled_at, expires_at, origin, created_at)
                   VALUES (?, ?, ?, ?, ?, ?, ?, ?)`)
      .run(r.id, text, body, code, at.toISOString(), expires.toISOString(), origin, nowIso());
    return q('SELECT * FROM campaigns WHERE id = ?').get(Number(res.lastInsertRowid));
  }

  function cancelCampaign(r, id) {
    return q(`UPDATE campaigns SET status = 'cancelled' WHERE id = ? AND restaurant_id = ? AND status = 'scheduled'`)
      .run(id, r.id).changes === 1;
  }

  async function sendCampaign(campaignId) {
    // Claim the campaign first so two ticks can never send it twice.
    const claimed = q(`UPDATE campaigns SET status = 'sending' WHERE id = ? AND status = 'scheduled'`).run(campaignId);
    if (!claimed.changes) return null;
    const camp = q('SELECT * FROM campaigns WHERE id = ?').get(campaignId);
    const guests = q(`SELECT id, phone FROM contacts WHERE restaurant_id = ? AND sms_opt_in = 1
                      AND unsubscribed_at IS NULL ORDER BY id`).all(camp.restaurant_id);
    let ok = 0, failed = 0, next = 0;
    const worker = async () => {
      while (next < guests.length) {
        const g = guests[next++];
        const r = await messenger.sendSms(
          { restaurantId: camp.restaurant_id, contactId: g.id, campaignId: camp.id }, g.phone, camp.body);
        if (r.status === 'failed') failed++; else ok++;
      }
    };
    await Promise.all(Array.from({ length: 5 }, worker));
    q(`UPDATE campaigns SET status = 'sent', recipients = ?, failed = ?, sent_at = ? WHERE id = ?`)
      .run(ok, failed, nowIso(), camp.id);
    return { recipients: ok, failed };
  }

  /** Run once a minute: plan auto-blasts, send whatever is due. */
  async function tick(now = new Date()) {
    const iso = now.toISOString();
    for (const r of q('SELECT * FROM restaurants WHERE auto_blast = 1').all()) {
      const recent = q(`SELECT 1 FROM campaigns WHERE restaurant_id = ? AND status != 'cancelled' AND scheduled_at > ?`)
        .get(r.id, new Date(now.getTime() - 6 * 864e5).toISOString());
      if (recent || !audienceCount(r)) continue;
      const slot = slowestSlot(r, now);
      if (slot) createCampaign(r, { offer: r.blast_offer, at: slot.at, origin: 'auto' }, now);
    }
    // A "today only" text that missed its slot (e.g. the server was down) is dropped, not sent late.
    q(`UPDATE campaigns SET status = 'cancelled' WHERE status = 'scheduled' AND scheduled_at <= ?`)
      .run(new Date(now.getTime() - STALE_MS).toISOString());
    const due = q(`SELECT id FROM campaigns WHERE status = 'scheduled' AND scheduled_at <= ? ORDER BY scheduled_at`).all(iso);
    for (const c of due) await sendCampaign(c.id);
    return due.length;
  }

  // ---- inbound STOP / START ---------------------------------------------------

  function handleInbound(from, body) {
    const phone = normalizePhone(from);
    const word = String(body ?? '').trim().toUpperCase();
    if (!phone) return null;
    if (['STOP', 'STOPALL', 'UNSUBSCRIBE', 'CANCEL', 'END', 'QUIT'].includes(word)) {
      q('UPDATE contacts SET unsubscribed_at = ? WHERE phone = ? AND unsubscribed_at IS NULL').run(nowIso(), phone);
      return 'stop';
    }
    if (['START', 'UNSTOP', 'YES'].includes(word)) {
      q('UPDATE contacts SET unsubscribed_at = NULL WHERE phone = ? AND sms_opt_in = 1').run(phone);
      return 'start';
    }
    return null;
  }

  // ---- steps 5 & 8: list + results --------------------------------------------

  function stats(r, now = new Date()) {
    const one = (sql, ...a) => q(sql).get(r.id, ...a).n;
    const today = zonedParts(now, r.timezone);
    const days = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date(Date.UTC(today.y, today.m - 1, today.d - i));
      days.push({ key: d.toISOString().slice(0, 10), label: 'SMTWTFS'[d.getUTCDay()], count: 0 });
    }
    const weekStart = zonedToUtc(today.y, today.m, today.d - 6, 0, 0, r.timezone).toISOString();
    for (const c of q('SELECT created_at FROM contacts WHERE restaurant_id = ? AND created_at >= ?').all(r.id, weekStart)) {
      const p = zonedParts(new Date(c.created_at), r.timezone);
      const key = `${p.y}-${String(p.m).padStart(2, '0')}-${String(p.d).padStart(2, '0')}`;
      const day = days.find((d) => d.key === key);
      if (day) day.count++;
    }
    const blastRedemptions = one('SELECT COUNT(*) n FROM redemptions WHERE restaurant_id = ? AND campaign_id IS NOT NULL');
    return {
      contacts: one('SELECT COUNT(*) n FROM contacts WHERE restaurant_id = ?'),
      audience: audienceCount(r),
      scans: one('SELECT COUNT(*) n FROM scans WHERE restaurant_id = ?'),
      welcomeRedeemed: one('SELECT COUNT(*) n FROM coupons WHERE restaurant_id = ? AND redeemed_at IS NOT NULL'),
      blastsSent: one(`SELECT COUNT(*) n FROM campaigns WHERE restaurant_id = ? AND status = 'sent'`),
      blastRedemptions,
      blastRevenueCents: blastRedemptions * r.avg_check_cents,
      days,
    };
  }

  const listContacts = (r, limit = 500) =>
    q('SELECT * FROM contacts WHERE restaurant_id = ? ORDER BY id DESC LIMIT ?').all(r.id, limit);
  const listCampaigns = (r) =>
    q(`SELECT c.*, (SELECT COUNT(*) FROM redemptions x WHERE x.campaign_id = c.id) AS redemptions
       FROM campaigns c WHERE restaurant_id = ? ORDER BY scheduled_at DESC LIMIT 100`).all(r.id);
  const listMessages = (r, limit = 200) =>
    q('SELECT * FROM messages WHERE restaurant_id = ? ORDER BY id DESC LIMIT ?').all(r.id, limit);
  const nextCampaign = (r) =>
    q(`SELECT * FROM campaigns WHERE restaurant_id = ? AND status = 'scheduled' ORDER BY scheduled_at LIMIT 1`).get(r.id) ?? null;

  return {
    getRestaurant, listRestaurants, createRestaurant, updateRestaurant,
    recordScan, claimOffer, redeem,
    activityGrid, slowestSlot, setBaseline, sendableHours,
    audienceCount, createCampaign, cancelCampaign, sendCampaign, tick, nextCampaign,
    handleInbound, stats, listContacts, listCampaigns, listMessages,
  };
}
