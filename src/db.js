import { DatabaseSync } from 'node:sqlite';
import fs from 'node:fs';
import path from 'node:path';
import { config } from './config.js';

const SCHEMA = `
CREATE TABLE IF NOT EXISTS restaurants (
  id INTEGER PRIMARY KEY,
  slug TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  timezone TEXT NOT NULL DEFAULT 'America/Toronto',
  brand_color TEXT NOT NULL DEFAULT '#2dd4bf',
  welcome_offer TEXT NOT NULL DEFAULT 'Free appetizer',
  table_count INTEGER NOT NULL DEFAULT 12,
  open_hour INTEGER NOT NULL DEFAULT 11,
  close_hour INTEGER NOT NULL DEFAULT 22,
  closed_days TEXT NOT NULL DEFAULT '',
  avg_check_cents INTEGER NOT NULL DEFAULT 4500,
  staff_pin TEXT NOT NULL DEFAULT '',
  auto_blast INTEGER NOT NULL DEFAULT 0,
  blast_offer TEXT NOT NULL DEFAULT 'Buy one, get one FREE on any pasta',
  blast_window_hours INTEGER NOT NULL DEFAULT 3,
  created_at TEXT NOT NULL
);
CREATE TABLE IF NOT EXISTS scans (
  id INTEGER PRIMARY KEY,
  restaurant_id INTEGER NOT NULL REFERENCES restaurants(id),
  table_no TEXT,
  created_at TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS scans_rest ON scans(restaurant_id, created_at);
CREATE TABLE IF NOT EXISTS contacts (
  id INTEGER PRIMARY KEY,
  restaurant_id INTEGER NOT NULL REFERENCES restaurants(id),
  name TEXT NOT NULL,
  phone TEXT NOT NULL,
  email TEXT,
  source TEXT,
  table_no TEXT,
  tag TEXT,
  sms_opt_in INTEGER NOT NULL DEFAULT 0,
  consent_text TEXT,
  consent_at TEXT,
  consent_ip TEXT,
  unsubscribed_at TEXT,
  created_at TEXT NOT NULL,
  UNIQUE (restaurant_id, phone)
);
CREATE TABLE IF NOT EXISTS coupons (
  id INTEGER PRIMARY KEY,
  restaurant_id INTEGER NOT NULL REFERENCES restaurants(id),
  contact_id INTEGER NOT NULL REFERENCES contacts(id),
  code TEXT NOT NULL,
  offer TEXT NOT NULL,
  redeemed_at TEXT,
  created_at TEXT NOT NULL,
  UNIQUE (restaurant_id, code)
);
CREATE TABLE IF NOT EXISTS campaigns (
  id INTEGER PRIMARY KEY,
  restaurant_id INTEGER NOT NULL REFERENCES restaurants(id),
  offer TEXT NOT NULL,
  body TEXT NOT NULL,
  code TEXT NOT NULL,
  scheduled_at TEXT NOT NULL,
  expires_at TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'scheduled', -- scheduled | sending | sent | cancelled
  origin TEXT NOT NULL DEFAULT 'manual',    -- manual | auto
  recipients INTEGER NOT NULL DEFAULT 0,
  failed INTEGER NOT NULL DEFAULT 0,
  sent_at TEXT,
  created_at TEXT NOT NULL,
  UNIQUE (restaurant_id, code)
);
CREATE TABLE IF NOT EXISTS redemptions (
  id INTEGER PRIMARY KEY,
  restaurant_id INTEGER NOT NULL REFERENCES restaurants(id),
  coupon_id INTEGER REFERENCES coupons(id),
  campaign_id INTEGER REFERENCES campaigns(id),
  created_at TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS red_rest ON redemptions(restaurant_id, created_at);
CREATE TABLE IF NOT EXISTS messages (
  id INTEGER PRIMARY KEY,
  restaurant_id INTEGER NOT NULL REFERENCES restaurants(id),
  contact_id INTEGER REFERENCES contacts(id),
  campaign_id INTEGER REFERENCES campaigns(id),
  channel TEXT NOT NULL,          -- sms | email
  recipient TEXT NOT NULL,
  subject TEXT,
  body TEXT NOT NULL,
  status TEXT NOT NULL,           -- sent | simulated | failed
  provider_id TEXT,
  error TEXT,
  created_at TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS msg_rest ON messages(restaurant_id, id);
-- Typical guests seated per weekday/hour, entered by the owner or pulled from the POS.
CREATE TABLE IF NOT EXISTS traffic_baseline (
  restaurant_id INTEGER NOT NULL REFERENCES restaurants(id),
  dow INTEGER NOT NULL,   -- 0 = Sunday
  hour INTEGER NOT NULL,  -- 0-23, restaurant local time
  covers INTEGER NOT NULL,
  PRIMARY KEY (restaurant_id, dow, hour)
);
`;

export function openDb(file = config.dbPath) {
  if (file !== ':memory:') fs.mkdirSync(path.dirname(file), { recursive: true });
  const db = new DatabaseSync(file);
  db.exec('PRAGMA journal_mode = WAL; PRAGMA foreign_keys = ON; PRAGMA busy_timeout = 5000;');
  db.exec(SCHEMA);
  return db;
}

export const nowIso = () => new Date().toISOString();

export function tx(db, fn) {
  db.exec('BEGIN IMMEDIATE');
  try {
    const out = fn();
    db.exec('COMMIT');
    return out;
  } catch (e) {
    db.exec('ROLLBACK');
    throw e;
  }
}
