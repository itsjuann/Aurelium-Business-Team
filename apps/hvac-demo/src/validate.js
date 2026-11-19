'use strict';
const { isValidDate } = require('./time');

const HARD_TEXT_LIMIT = 2000; // anything longer is rejected outright
const CONTROL = /[\u0000-\u001f\u007f]/g;

// US numbers only: +1 followed by a valid NANP area code and exchange.
function normalizePhone(v) {
  if (typeof v !== 'string' || v.length > 32) return null;
  if (!/^[+\d\s().-]+$/.test(v)) return null;
  let d = v.replace(/\D/g, '');
  if (d.length === 10) d = `1${d}`;
  if (d.length !== 11 || d[0] !== '1') return null;
  if (!/^1[2-9]\d{2}[2-9]\d{6}$/.test(d)) return null;
  return `+${d}`;
}

const T = {
  enum: (values) => ({ kind: 'enum', values }),
  // strict: over max is rejected. Free text (truncate: true) is cut to max instead,
  // so a long call summary never fails a booking in front of a prospect.
  str: (max, opts = {}) => ({ kind: 'str', max, truncate: !!opts.truncate }),
  bool: () => ({ kind: 'bool' }),
  phone: () => ({ kind: 'phone' }),
  date: () => ({ kind: 'date' }),
  id: () => ({ kind: 'id' }),
  windowId: () => ({ kind: 'windowId' }),
  int: (min, max) => ({ kind: 'int', min, max }),
};

function check(rule, v) {
  switch (rule.kind) {
    case 'enum':
      return typeof v === 'string' && rule.values.includes(v) ? { ok: true, v } : { ok: false };
    case 'str': {
      if (typeof v !== 'string' || v.length > HARD_TEXT_LIMIT) return { ok: false };
      let s = v.replace(CONTROL, ' ').replace(/\s+/g, ' ').trim();
      if (!s) return { ok: false };
      if (s.length > rule.max) {
        if (!rule.truncate) return { ok: false };
        s = s.slice(0, rule.max);
      }
      return { ok: true, v: s };
    }
    case 'bool':
      return typeof v === 'boolean' ? { ok: true, v } : { ok: false };
    case 'phone': {
      const p = normalizePhone(v);
      return p ? { ok: true, v: p } : { ok: false };
    }
    case 'date':
      return isValidDate(v) ? { ok: true, v } : { ok: false };
    case 'id':
      return typeof v === 'string' && /^[A-Za-z0-9_.:-]{1,128}$/.test(v) ? { ok: true, v } : { ok: false };
    case 'int':
      return Number.isInteger(v) && v >= rule.min && v <= rule.max ? { ok: true, v } : { ok: false };
    case 'windowId':
      return typeof v === 'string' && /^w_\d{4}-\d{2}-\d{2}_\d{2}$/.test(v) ? { ok: true, v } : { ok: false };
    default:
      return { ok: false };
  }
}

// schema: { field: { rule, required } }. Unknown fields are rejected.
// Returns { ok, value } or { ok: false, fields: [names only, never values] }.
function validate(schema, body) {
  if (body === null || typeof body !== 'object' || Array.isArray(body)) return { ok: false, fields: ['body'] };
  const bad = [];
  const value = {};
  // Unknown fields are refused. Their names came from the sender, so they are not echoed back.
  if (Object.keys(body).some((key) => !Object.hasOwn(schema, key))) bad.push('unknown_field');
  for (const [key, spec] of Object.entries(schema)) {
    const raw = body[key];
    // Optional fields a model sends as null or an empty string count as left out.
    if (raw === undefined || raw === null || (raw === '' && !spec.required)) {
      if (spec.required) bad.push(key);
      continue;
    }
    const r = check(spec.rule, raw);
    if (r.ok) value[key] = r.v;
    else bad.push(key);
  }
  return bad.length ? { ok: false, fields: bad } : { ok: true, value };
}

const req = (rule) => ({ rule, required: true });
const opt = (rule) => ({ rule, required: false });
const APPT = ['repair', 'maintenance', 'estimate'];

const schemas = {
  check_availability: {
    appointment_type: req(T.enum(APPT)),
    urgency: req(T.enum(['urgent', 'routine'])),
    preferred_day: opt(T.date()),
    conversation_id: req(T.id()),
  },
  book_appointment: {
    window_id: req(T.windowId()),
    appointment_type: req(T.enum(APPT)),
    urgency: req(T.enum(['urgent', 'routine'])),
    caller_name: req(T.str(80)),
    callback_phone: req(T.phone()),
    service_address: req(T.str(160)),
    service_town: req(T.str(60)),
    system_type: req(T.enum(['heating', 'cooling', 'both', 'unknown'])),
    issue_summary: req(T.str(300, { truncate: true })),
    existing_customer: req(T.bool()),
    vulnerable_occupant: opt(T.bool()),
    estimate_requested: opt(T.bool()),
    after_hours: req(T.bool()),
    conversation_id: req(T.id()),
  },
  save_lead: {
    caller_name: req(T.str(80)),
    callback_phone: req(T.phone()),
    reason: req(T.enum(['no_heat', 'no_cooling', 'leak', 'maintenance', 'estimate', 'reschedule', 'price_question', 'out_of_area', 'safety', 'other'])),
    urgency: req(T.enum(['safety', 'urgent', 'routine'])),
    service_town: opt(T.str(60)),
    appointment_pref: opt(T.str(120, { truncate: true })),
    wants_human: opt(T.bool()),
    call_summary: req(T.str(400, { truncate: true })),
    conversation_id: req(T.id()),
  },
  settings: {
    shop_name: req(T.str(80)),
    service_towns: opt(T.str(200)),
    avg_ticket: opt(T.int(0, 100000)),
    avg_install: opt(T.int(0, 1000000)),
  },
  login: { key: req(T.str(200)) },
  complete: { job_id: req(T.id()) },
};
module.exports = { validate, schemas, normalizePhone };
