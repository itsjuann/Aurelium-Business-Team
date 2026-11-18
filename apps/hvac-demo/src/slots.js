'use strict';
const { nyNow, addDays, dayDiff, isValidDate, weekdayIndex, spokenDay } = require('./time');

// Arrival windows a tech can be booked into. Fictional calendar for the demo.
const WINDOWS = [
  { start: 8, end: 11, words: 'eight and eleven', label: '8–11 AM' },
  { start: 11, end: 14, words: 'eleven and two', label: '11 AM–2 PM' },
  { start: 14, end: 17, words: 'two and five', label: '2–5 PM' },
];
const CAPACITY = 2; // jobs per window
const LEAD_MINUTES = 30; // a window is offered until 30 minutes before it starts
const SEARCH_DAYS = 21;
const MAX_PREFERRED_DAYS = 60;

function windowId(date, start) {
  return `w_${date}_${String(start).padStart(2, '0')}`;
}
function parseWindowId(id) {
  const m = typeof id === 'string' && /^w_(\d{4}-\d{2}-\d{2})_(\d{2})$/.exec(id);
  if (!m || !isValidDate(m[1])) return null;
  const w = WINDOWS.find((x) => x.start === Number(m[2]));
  return w ? { window_id: id, date: m[1], start: w.start, end: w.end, words: w.words, label: w.label } : null;
}
function isBookable(win, nowMs) {
  const now = nyNow(nowMs);
  const diff = dayDiff(win.date, now.date);
  if (diff < 0 || diff > MAX_PREFERRED_DAYS + SEARCH_DAYS) return false;
  if (diff === 0) return now.minutes <= win.start * 60 - LEAD_MINUTES;
  return true;
}
function spoken(win, nowMs) {
  return `${spokenDay(win.date, nyNow(nowMs).date)} between ${win.words}`;
}
function describe(win, nowMs) {
  return {
    window_id: win.window_id,
    date: win.date,
    start: `${String(win.start).padStart(2, '0')}:00`,
    end: `${String(win.end).padStart(2, '0')}:00`,
    spoken: spoken(win, nowMs),
  };
}
// Up to `limit` open windows. Urgent starts today; routine starts tomorrow (or the
// caller's preferred day) and skips Sundays. countInWindow(id) = jobs already there.
function findWindows({ nowMs, urgency, preferredDay, countInWindow, limit = 3 }) {
  const today = nyNow(nowMs).date;
  let first = urgency === 'urgent' ? today : addDays(today, 1);
  if (preferredDay && isValidDate(preferredDay)) {
    const diff = dayDiff(preferredDay, today);
    if (diff >= (urgency === 'urgent' ? 0 : 1) && diff <= MAX_PREFERRED_DAYS) first = preferredDay;
  }
  const out = [];
  for (let i = 0; i < SEARCH_DAYS && out.length < limit; i++) {
    const date = addDays(first, i);
    if (urgency !== 'urgent' && weekdayIndex(date) === 0) continue;
    for (const w of WINDOWS) {
      const win = parseWindowId(windowId(date, w.start));
      if (!isBookable(win, nowMs)) continue;
      if (countInWindow(win.window_id) >= CAPACITY) continue;
      out.push(describe(win, nowMs));
      if (out.length >= limit) break;
    }
  }
  return out;
}
module.exports = { WINDOWS, CAPACITY, windowId, parseWindowId, isBookable, spoken, describe, findWindows };
