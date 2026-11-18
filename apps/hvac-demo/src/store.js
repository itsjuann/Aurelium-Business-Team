'use strict';
const fs = require('node:fs');
const path = require('node:path');
const { nyNow, addDays } = require('./time');
const { windowId, parseWindowId } = require('./slots');

const DEFAULT_SHOP = 'Demo Heating and Air';
const RETENTION_MS = 30 * 86400000; // prospect demo data is kept 30 days at most
const MAX_RECORDS = 500; // of each kind; the oldest call record is dropped first

// Fictional people, 555-01xx numbers. Shown with a "Sample" tag on screen.
const SAMPLE = [
  { name: 'Dana Whitfield', phone: '+12155550114', address: '14 Sample Street', day: 0, start: 8, type: 'maintenance', system: 'heating', issue: 'Fall furnace tune-up.' },
  { name: 'Marcus Oyelaran', phone: '+12155550127', address: '208 Example Avenue', day: 0, start: 14, type: 'repair', system: 'heating', issue: 'Furnace short cycling.' },
  { name: 'Priya Raman', phone: '+12155550139', address: '51 Placeholder Lane', day: 1, start: 11, type: 'estimate', system: 'both', issue: 'Estimate for a full system replacement.' },
  { name: 'Tom Kessler', phone: '+12155550152', address: '9 Demo Court', day: 2, start: 8, type: 'maintenance', system: 'heating', issue: 'Annual maintenance visit.' },
];

class Store {
  constructor({ dataDir = null, now = Date.now } = {}) {
    this.now = now;
    this.file = dataDir ? path.join(dataDir, 'state.json') : null;
    this.state = this.load();
    this.offered = new Map(); // conversation_id -> { ids:Set, at }
    this.ensureSeed();
  }
  fresh() {
    return {
      settings: { shop_name: DEFAULT_SHOP, service_towns: '' },
      customers: [], jobs: [], leads: [],
      seq: { job: 1041, lead: 200, cust: 500 },
      seed_date: null,
    };
  }
  load() {
    if (!this.file) return this.fresh();
    try {
      const s = JSON.parse(fs.readFileSync(this.file, 'utf8'));
      if (s && Array.isArray(s.jobs) && Array.isArray(s.leads) && Array.isArray(s.customers) && s.seq && s.settings) return s;
    } catch { /* first run or unreadable file: start clean */ }
    return this.fresh();
  }
  save() {
    if (!this.file) return;
    fs.mkdirSync(path.dirname(this.file), { recursive: true, mode: 0o700 });
    const tmp = `${this.file}.tmp`;
    fs.writeFileSync(tmp, JSON.stringify(this.state), { mode: 0o600 });
    fs.renameSync(tmp, this.file);
  }
  nextId(kind, prefix) {
    this.state.seq[kind] += 1;
    return `${prefix}-${this.state.seq[kind]}`;
  }
  // Sample jobs are rebuilt each day so the calendar never looks stale.
  ensureSeed() {
    const today = nyNow(this.now()).date;
    const s = this.state;
    if (s.seed_date === today) return;
    s.jobs = s.jobs.filter((j) => !j.sample);
    s.customers = s.customers.filter((c) => !c.sample);
    const town = (s.settings.service_towns.split(',')[0] || '').trim();
    for (const x of SAMPLE) {
      const cust = { id: this.nextId('cust', 'C'), name: x.name, phone: x.phone, address: x.address, town, is_new: false, sample: true };
      const date = addDays(today, x.day);
      s.customers.push(cust);
      s.jobs.push({
        id: this.nextId('job', 'J'), conversation_id: null, created_at: this.now(), window_id: windowId(date, x.start), date, start: x.start,
        appointment_type: x.type, urgency: 'routine', customer_id: cust.id, system_type: x.system, issue_summary: x.issue,
        existing_customer: true, vulnerable_occupant: false, estimate_requested: x.type === 'estimate', after_hours: false,
        source: 'sample', status: 'booked', sample: true,
      });
    }
    s.seed_date = today;
    this.save();
  }
  countInWindow(id, exceptConversation = null) {
    return this.state.jobs.filter((j) => j.window_id === id && (!exceptConversation || j.conversation_id !== exceptConversation)).length;
  }
  rememberOffer(conversationId, ids) {
    const cur = this.offered.get(conversationId) || { ids: new Set(), at: 0 };
    ids.forEach((i) => cur.ids.add(i));
    cur.at = this.now();
    this.offered.set(conversationId, cur);
    if (this.offered.size > 2000) this.offered.delete(this.offered.keys().next().value);
  }
  wasOffered(conversationId, id) {
    const cur = this.offered.get(conversationId);
    return !!cur && this.now() - cur.at < 2 * 3600000 && cur.ids.has(id);
  }
  upsertCustomer({ name, phone, address, town, existing }) {
    let c = this.state.customers.find((x) => !x.sample && x.phone === phone);
    if (!c) {
      c = { id: this.nextId('cust', 'C'), sample: false };
      this.state.customers.push(c);
    }
    Object.assign(c, { name, phone, address, town, is_new: !existing });
    return c;
  }
  // One job per call. Booking again in the same call moves the job.
  book(v) {
    const win = parseWindowId(v.window_id);
    const cust = this.upsertCustomer({ name: v.caller_name, phone: v.callback_phone, address: v.service_address, town: v.service_town, existing: v.existing_customer });
    let job = this.state.jobs.find((j) => j.conversation_id === v.conversation_id);
    if (!job) {
      job = { id: this.nextId('job', 'J'), conversation_id: v.conversation_id, created_at: this.now(), source: 'ai_receptionist_phone', status: 'booked', sample: false };
      this.state.jobs.push(job);
      this.trim();
    }
    Object.assign(job, {
      window_id: win.window_id, date: win.date, start: win.start, appointment_type: v.appointment_type, urgency: v.urgency,
      customer_id: cust.id, system_type: v.system_type, issue_summary: v.issue_summary, existing_customer: v.existing_customer,
      vulnerable_occupant: v.vulnerable_occupant === true, estimate_requested: v.estimate_requested === true || v.appointment_type === 'estimate',
      after_hours: v.after_hours, updated_at: this.now(),
    });
    this.save();
    return job;
  }
  saveLead(v) {
    let lead = this.state.leads.find((l) => l.conversation_id === v.conversation_id);
    if (!lead) {
      lead = { id: this.nextId('lead', 'L'), conversation_id: v.conversation_id, created_at: this.now(), source: 'ai_receptionist_phone' };
      this.state.leads.push(lead);
      this.trim();
    }
    Object.assign(lead, {
      caller_name: v.caller_name, callback_phone: v.callback_phone, reason: v.reason, urgency: v.urgency,
      service_town: v.service_town || '', appointment_pref: v.appointment_pref || '', wants_human: v.wants_human === true,
      call_summary: v.call_summary, updated_at: this.now(),
    });
    this.save();
    return lead;
  }
  trim() {
    const s = this.state;
    const real = s.jobs.filter((j) => !j.sample);
    if (real.length > MAX_RECORDS) {
      const drop = new Set(real.slice(0, real.length - MAX_RECORDS).map((j) => j.id));
      s.jobs = s.jobs.filter((j) => !drop.has(j.id));
    }
    if (s.leads.length > MAX_RECORDS) s.leads = s.leads.slice(s.leads.length - MAX_RECORDS);
    const used = new Set(s.jobs.map((j) => j.customer_id));
    s.customers = s.customers.filter((c) => c.sample || used.has(c.id));
  }
  revokedBefore() { return this.state.revoked_before || 0; }
  revokeSessions() { this.state.revoked_before = this.now(); this.save(); }
  completeJob(id) {
    const job = this.state.jobs.find((j) => j.id === id);
    if (!job) return null;
    job.status = 'complete';
    job.completed_at = this.now();
    this.save();
    return job;
  }
  setSettings({ shop_name, service_towns }) {
    this.state.settings = { shop_name, service_towns: service_towns || '' };
    this.state.seed_date = null; // sample customers pick up the first town
    this.ensureSeed();
    this.save();
  }
  // Clears everything a prospect said and puts the placeholders back.
  reset() {
    const revoked = this.revokedBefore();
    this.state = this.fresh();
    this.state.revoked_before = revoked;
    this.offered.clear();
    this.ensureSeed();
    this.save();
  }
  purge() {
    const cutoff = this.now() - RETENTION_MS;
    const s = this.state;
    const before = s.jobs.length + s.leads.length;
    s.jobs = s.jobs.filter((j) => j.sample || j.created_at >= cutoff);
    s.leads = s.leads.filter((l) => l.created_at >= cutoff);
    const used = new Set(s.jobs.map((j) => j.customer_id));
    s.customers = s.customers.filter((c) => c.sample || used.has(c.id));
    const removed = before - (s.jobs.length + s.leads.length);
    if (removed) this.save();
    return removed;
  }
}
module.exports = { Store, DEFAULT_SHOP };
