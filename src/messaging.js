import crypto from 'node:crypto';
import { config, smsLive, emailLive } from './config.js';
import { nowIso } from './db.js';

// Each driver resolves to { status, providerId?, error? }.
// With no credentials configured, messages are recorded as "simulated" so the
// whole flow can be exercised without texting anyone.

async function twilioSms(to, body) {
  const { accountSid, authToken, messagingServiceSid, from } = config.twilio;
  const params = new URLSearchParams({ To: to, Body: body });
  if (messagingServiceSid) params.set('MessagingServiceSid', messagingServiceSid);
  else params.set('From', from);
  const res = await fetch(`https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Messages.json`, {
    method: 'POST',
    headers: {
      Authorization: `Basic ${Buffer.from(`${accountSid}:${authToken}`).toString('base64')}`,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: params,
    signal: AbortSignal.timeout(15000),
  });
  const json = await res.json().catch(() => ({}));
  if (!res.ok) return { status: 'failed', error: `${json.code ?? res.status}: ${json.message ?? 'Twilio error'}` };
  return { status: 'sent', providerId: json.sid };
}

async function resendEmail(to, subject, body, fromName) {
  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: { Authorization: `Bearer ${config.resend.apiKey}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      from: fromName ? `${fromName.replace(/[<>"]/g, '')} <${config.resend.from}>` : config.resend.from,
      to: [to], subject, text: body,
    }),
    signal: AbortSignal.timeout(15000),
  });
  const json = await res.json().catch(() => ({}));
  if (!res.ok) return { status: 'failed', error: json.message ?? `Resend error ${res.status}` };
  return { status: 'sent', providerId: json.id };
}

export function createMessenger(db, drivers = {}) {
  const sms = drivers.sms ?? ((to, body) => (smsLive() ? twilioSms(to, body) : { status: 'simulated' }));
  const email = drivers.email ??
    ((to, subject, body, fromName) => (emailLive() ? resendEmail(to, subject, body, fromName) : { status: 'simulated' }));
  const insert = db.prepare(`INSERT INTO messages
    (restaurant_id, contact_id, campaign_id, channel, recipient, subject, body, status, provider_id, error, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`);

  async function deliver(fn) {
    try { return await fn(); } catch (e) { return { status: 'failed', error: String(e.message ?? e) }; }
  }
  const record = (m, channel, recipient, subject, body, r) =>
    insert.run(m.restaurantId, m.contactId ?? null, m.campaignId ?? null, channel, recipient, subject,
      body, r.status, r.providerId ?? null, r.error ?? null, nowIso());

  return {
    async sendSms(meta, to, body) {
      const r = await deliver(() => sms(to, body));
      record(meta, 'sms', to, null, body, r);
      return r;
    },
    async sendEmail(meta, to, subject, body, fromName) {
      const r = await deliver(() => email(to, subject, body, fromName));
      record(meta, 'email', to, subject, body, r);
      return r;
    },
  };
}

/** Verify the X-Twilio-Signature header on an inbound webhook. */
export function validTwilioSignature(authToken, signature, url, params) {
  if (!authToken || !signature) return false;
  const data = url + Object.keys(params).sort().map((k) => k + params[k]).join('');
  const expected = crypto.createHmac('sha1', authToken).update(data).digest('base64');
  const a = Buffer.from(expected), b = Buffer.from(String(signature));
  return a.length === b.length && crypto.timingSafeEqual(a, b);
}
