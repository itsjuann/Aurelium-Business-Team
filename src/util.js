import crypto from 'node:crypto';
import { config } from './config.js';

export const esc = (v) =>
  String(v ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

/** Normalise a typed phone number to E.164, or return null if it can't be one. */
export function normalizePhone(raw, countryCode = config.defaultCountryCode) {
  const s = String(raw ?? '').trim();
  const digits = s.replace(/\D/g, '');
  if (s.startsWith('+')) return digits.length >= 8 && digits.length <= 15 ? `+${digits}` : null;
  if (countryCode === '1') {
    if (digits.length === 10) return `+1${digits}`;
    if (digits.length === 11 && digits.startsWith('1')) return `+${digits}`;
    return null;
  }
  const national = digits.replace(/^0+/, '');
  return national.length >= 6 && national.length <= 12 ? `+${countryCode}${national}` : null;
}

export const validEmail = (s) => /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(String(s ?? ''));

export const slugify = (s) =>
  String(s ?? '').toLowerCase().normalize('NFKD').replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 40);

const CODE_ALPHABET = '23456789ABCDEFGHJKMNPQRSTUVWXYZ'; // no 0/O/1/I/L
export function randomCode(prefix, len = 5) {
  let out = '';
  for (let i = 0; i < len; i++) out += CODE_ALPHABET[crypto.randomInt(CODE_ALPHABET.length)];
  return `${prefix}-${out}`;
}

// ---- time zones -----------------------------------------------------------

const fmtCache = new Map();
function fmt(tz) {
  if (!fmtCache.has(tz)) {
    fmtCache.set(tz, new Intl.DateTimeFormat('en-US', {
      timeZone: tz, hourCycle: 'h23', weekday: 'short',
      year: 'numeric', month: 'numeric', day: 'numeric', hour: 'numeric', minute: 'numeric', second: 'numeric',
    }));
  }
  return fmtCache.get(tz);
}
const DOW = { Sun: 0, Mon: 1, Tue: 2, Wed: 3, Thu: 4, Fri: 5, Sat: 6 };
export const DAY_NAMES = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

export function validTimezone(tz) {
  try { fmt(tz); return true; } catch { return false; }
}

/** Wall-clock parts of an instant in a time zone. */
export function zonedParts(date, tz) {
  const p = {};
  for (const part of fmt(tz).formatToParts(date)) p[part.type] = part.value;
  return { y: +p.year, m: +p.month, d: +p.day, h: +p.hour, min: +p.minute, s: +p.second, dow: DOW[p.weekday] };
}

function offsetMs(date, tz) {
  const p = zonedParts(date, tz);
  return Date.UTC(p.y, p.m - 1, p.d, p.h, p.min, p.s) - Math.floor(date.getTime() / 1000) * 1000;
}

/** The instant at which a zone's wall clock reads the given local time. */
export function zonedToUtc(y, m, d, h, min, tz) {
  const guess = Date.UTC(y, m - 1, d, h, min);
  const first = guess - offsetMs(new Date(guess), tz);
  return new Date(guess - offsetMs(new Date(first), tz));
}

export function hourLabel(h) {
  const hh = ((h % 24) + 24) % 24;
  return `${hh % 12 || 12}:00 ${hh < 12 ? 'AM' : 'PM'}`;
}

export function formatLocal(iso, tz) {
  if (!iso) return '';
  return new Intl.DateTimeFormat('en-US', {
    timeZone: tz, weekday: 'short', month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit',
  }).format(new Date(iso));
}

export const money = (cents) => `$${(cents / 100).toLocaleString('en-US', { maximumFractionDigits: 0 })}`;
