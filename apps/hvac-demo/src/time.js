'use strict';
// Calendar math in America/New_York without dependencies.
const TZ = 'America/New_York';
const fmt = new Intl.DateTimeFormat('en-US', {
  timeZone: TZ, hourCycle: 'h23', year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit',
});
const WEEKDAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

function nyNow(ms) {
  const p = Object.fromEntries(fmt.formatToParts(new Date(ms)).map((x) => [x.type, x.value]));
  return { date: `${p.year}-${p.month}-${p.day}`, minutes: Number(p.hour) * 60 + Number(p.minute) };
}
function toUtc(date) {
  const [y, m, d] = date.split('-').map(Number);
  return Date.UTC(y, m - 1, d);
}
function addDays(date, n) {
  return new Date(toUtc(date) + n * 86400000).toISOString().slice(0, 10);
}
function dayDiff(a, b) {
  return Math.round((toUtc(a) - toUtc(b)) / 86400000);
}
function isValidDate(s) {
  if (typeof s !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(s)) return false;
  const t = toUtc(s);
  return Number.isFinite(t) && new Date(t).toISOString().slice(0, 10) === s;
}
function weekdayIndex(date) {
  return new Date(toUtc(date)).getUTCDay();
}
function ordinal(n) {
  const v = n % 100;
  if (v >= 11 && v <= 13) return `${n}th`;
  return `${n}${['th', 'st', 'nd', 'rd'][n % 10] || 'th'}`;
}
// How a person says the day on the phone, relative to today.
function spokenDay(date, today) {
  const diff = dayDiff(date, today);
  if (diff === 0) return 'today';
  if (diff === 1) return 'tomorrow';
  const name = WEEKDAYS[weekdayIndex(date)];
  if (diff > 1 && diff < 7) return name;
  const [, m, d] = date.split('-').map(Number);
  return `${name}, ${MONTHS[m - 1]} ${ordinal(d)}`;
}
function shortDay(date, today) {
  const diff = dayDiff(date, today);
  const [, m, d] = date.split('-').map(Number);
  const base = `${WEEKDAYS[weekdayIndex(date)].slice(0, 3)} ${MONTHS[m - 1].slice(0, 3)} ${d}`;
  if (diff === 0) return `Today · ${base}`;
  if (diff === 1) return `Tomorrow · ${base}`;
  return base;
}
module.exports = { nyNow, addDays, dayDiff, isValidDate, weekdayIndex, spokenDay, shortDay };
