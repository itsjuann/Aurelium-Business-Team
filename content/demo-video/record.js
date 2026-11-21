'use strict';
// Records the HVAC demo walkthrough: a scripted example call on the left, the real demo CRM
// (apps/hvac-demo) reacting on the right, with captions. No narration, no real customer data.
// Usage: node record.js <output dir> [voice dir]   (needs Playwright and ffmpeg)
// With a voice dir from make_voice.py, each scene waits for its narration line and the audio is mixed in.
const { chromium } = require('playwright');
const { spawn, execFileSync } = require('node:child_process');
const crypto = require('node:crypto');
const fs = require('node:fs');
const path = require('node:path');

const APP = path.join(__dirname, '..', '..', 'apps', 'hvac-demo');
const OUT = path.resolve(process.argv[2] || __dirname);
const VOICE = process.argv[3] ? path.resolve(process.argv[3]) : null;
const DUR = VOICE ? JSON.parse(fs.readFileSync(path.join(VOICE, 'durations.json'), 'utf8')) : {};
const PORT = 8797;
const BASE = `http://localhost:${PORT}`;
const TOOL = crypto.randomBytes(24).toString('hex');
const VIEW = crypto.randomBytes(24).toString('hex');
const SHOP = 'Demo Heating and Air';
const W = 1920, H = 1080, PHONE = 520, CAPH = 150;
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

const OVERLAY_CSS = `
#vo-title{position:fixed;inset:0;z-index:9000;background:#0a1a2a;color:#fff;display:flex;flex-direction:column;align-items:center;justify-content:center;text-align:center;gap:26px;padding:0 160px;transition:opacity .6s;font-family:system-ui,-apple-system,"Segoe UI",Roboto,Arial,sans-serif}
#vo-title.off{opacity:0;pointer-events:none}
#vo-title .big{font-size:76px;font-weight:800;line-height:1.1;letter-spacing:-.01em}
#vo-title .mid{font-size:46px;font-weight:600;line-height:1.25;color:#f2d48f}
#vo-title .sm{font-size:30px;color:#c9d6e3;line-height:1.4}
#vo-title .fine{font-size:20px;color:#8ea2b6;margin-top:18px}
#vo-phone{position:fixed;left:0;top:0;bottom:${CAPH}px;width:${PHONE}px;z-index:8000;background:#0a1a2a;color:#fff;border-right:1px solid #2b3949;transform:translateX(-100%);transition:transform .6s;display:flex;flex-direction:column;font-family:system-ui,-apple-system,"Segoe UI",Roboto,Arial,sans-serif}
#vo-phone.on{transform:none}
#vo-phone header{padding:26px 28px 18px;border-bottom:1px solid #2b3949}
#vo-phone .when{font-size:17px;letter-spacing:.08em;text-transform:uppercase;color:#f2d48f;font-weight:700}
#vo-phone .who{font-size:30px;font-weight:700;margin-top:6px}
#vo-phone .tag{display:inline-block;margin-top:10px;font-size:14px;letter-spacing:.06em;text-transform:uppercase;color:#9fb2c6;border:1px solid #46586c;border-radius:999px;padding:3px 10px}
#vo-lines{flex:1;overflow:hidden;padding:20px 24px 26px;display:flex;flex-direction:column;justify-content:flex-end;gap:12px}
.vo-b{max-width:88%;padding:12px 16px;border-radius:18px;font-size:22px;line-height:1.35;animation:voin .35s ease-out}
.vo-b .r{display:block;font-size:13px;letter-spacing:.08em;text-transform:uppercase;font-weight:700;margin-bottom:3px;opacity:.75}
.vo-b.ai{align-self:flex-start;background:#1d3a57;border-bottom-left-radius:6px}
.vo-b.caller{align-self:flex-end;background:#e9eef4;color:#14202e;border-bottom-right-radius:6px}
@keyframes voin{from{opacity:0;transform:translateY(12px)}to{opacity:1;transform:none}}
#vo-cap{position:fixed;left:0;right:0;bottom:0;height:${CAPH}px;z-index:8500;background:#0a1a2a;border-top:1px solid #2b3949;color:#fff;display:flex;align-items:center;justify-content:center;text-align:center;padding:0 80px;font:600 36px/1.25 system-ui,-apple-system,"Segoe UI",Roboto,Arial,sans-serif}
#vo-cap span{opacity:0;transition:opacity .35s}
#vo-cap.on span{opacity:1}
#vo-mark{position:fixed;right:18px;bottom:${CAPH + 12}px;z-index:8600;font:600 14px system-ui,sans-serif;letter-spacing:.06em;text-transform:uppercase;color:#9fb2c6;background:rgba(8,16,26,.8);border:1px solid #2b3949;border-radius:999px;padding:4px 12px}
html{overflow:hidden}
/* The page scrolls inside the area above the caption strip, so a caption never covers the dashboard. */
body{height:calc(100vh - ${CAPH}px);overflow-y:auto;scrollbar-width:none;transition:padding-left .6s}
#app{zoom:1.4}
body.vo-shift{padding-left:${PHONE}px}
.vo-ring{outline:4px solid #f2d48f !important;outline-offset:6px;border-radius:12px;transition:outline-color .3s}
.actions{visibility:hidden}
`;

async function main() {
  fs.mkdirSync(OUT, { recursive: true });
  const data = fs.mkdtempSync(path.join(OUT, 'data-'));
  const vdir = fs.mkdtempSync(path.join(OUT, 'raw-'));
  const srv = spawn('node', ['server.js'], {
    cwd: APP, stdio: 'ignore',
    env: { ...process.env, PORT: String(PORT), SAVE_LEAD_WEBHOOK_SECRET: TOOL, DEMO_CRM_VIEW_KEY: VIEW, DEMO_DATA_DIR: data, INSECURE_COOKIES: '1' },
  });
  let browser;
  try {
    await sleep(900);
    const tool = async (name, body) => (await fetch(`${BASE}/tools/${name}`, { method: 'POST', headers: { 'Content-Type': 'application/json', 'X-Aurelium-Signature': TOOL }, body: JSON.stringify(body) })).json();
    const login = await fetch(`${BASE}/api/login`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ key: VIEW }) });
    const cookie = login.headers.get('set-cookie').split(';')[0];
    const [cname, cvalue] = [cookie.slice(0, cookie.indexOf('=')), cookie.slice(cookie.indexOf('=') + 1)];
    await fetch(`${BASE}/api/settings`, { method: 'POST', headers: { 'Content-Type': 'application/json', 'X-Demo-CSRF': '1', Cookie: cookie }, body: JSON.stringify({ shop_name: SHOP, service_towns: 'Testville, Sampleton', avg_ticket: 420, avg_install: 11500 }) });

    browser = await chromium.launch();
    const ctx = await browser.newContext({ viewport: { width: W, height: H }, deviceScaleFactor: 1, colorScheme: 'dark', bypassCSP: true, recordVideo: { dir: vdir, size: { width: W, height: H } } });
    await ctx.addCookies([{ name: cname, value: cvalue, url: BASE }]);
    const page = await ctx.newPage();
    const t0 = Date.now();
    await page.goto(BASE);
    await page.addStyleTag({ content: OVERLAY_CSS });
    await page.evaluate(() => {
      const mk = (id, html) => { const d = document.createElement('div'); d.id = id; d.innerHTML = html; document.body.appendChild(d); return d; };
      mk('vo-title', '');
      mk('vo-phone', '<header><div class="when"></div><div class="who"></div><span class="tag">Example call · caller is a voice actor</span></header><div id="vo-lines"></div>');
      mk('vo-cap', '<span></span>');
      mk('vo-mark', 'Demo · sample data');
      const esc = (s) => String(s).replace(/[&<>]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;' }[c]));
      window.vo = {
        title(lines) { const t = document.getElementById('vo-title'); t.innerHTML = lines.map(([c, s]) => `<div class="${c}">${esc(s)}</div>`).join(''); t.classList.remove('off'); },
        titleOff() { document.getElementById('vo-title').classList.add('off'); },
        phone(on, when, who) {
          const p = document.getElementById('vo-phone');
          if (when) { p.querySelector('.when').textContent = when; p.querySelector('.who').textContent = who; document.getElementById('vo-lines').innerHTML = ''; }
          p.classList.toggle('on', on); document.body.classList.toggle('vo-shift', on);
        },
        say(role, text) { const b = document.createElement('div'); b.className = `vo-b ${role}`; b.innerHTML = `<span class="r">${role === 'ai' ? 'AI receptionist' : 'Caller'}</span>${esc(text)}`; document.getElementById('vo-lines').appendChild(b); },
        cap(text) { const c = document.getElementById('vo-cap'); if (!text) { c.classList.remove('on'); return; } c.firstChild.textContent = text; c.classList.add('on'); },
        ring(sel) { document.querySelectorAll('.vo-ring').forEach((e) => e.classList.remove('vo-ring')); if (sel) { const e = document.querySelector(sel); if (e) e.classList.add('vo-ring'); } },
        to(sel, block) { const e = document.querySelector(sel); if (e) e.scrollIntoView({ behavior: 'smooth', block: block || 'center' }); },
        top() { document.body.scrollTo({ top: 0, behavior: 'smooth' }); },
      };
    });
    const vo = (fn, ...args) => page.evaluate(([f, a]) => window.vo[f](...a), [fn, args]);
    // Narration: one line at a time. narrate() waits for the previous line to finish, notes when this one starts.
    const cues = [];
    let tStart = 0, voiceFreeAt = 0;
    const voiceDone = async () => { const w = voiceFreeAt - Date.now(); if (w > 0) await sleep(w); };
    const narrate = async (key) => {
      if (!DUR[key]) return 0;
      await voiceDone();
      cues.push({ key, at: Date.now() - tStart });
      voiceFreeAt = Date.now() + DUR[key] * 1000 + 350;
      return DUR[key] * 1000;
    };
    let callLine = 0;
    const say = async (role, text) => {
      callLine += 1;
      const d = await narrate(`c${callLine}`); // waits for the previous line to finish
      await vo('say', role, text);
      await sleep(d ? d + 280 : Math.max(1700, 900 + text.length * 38));
    };
    const cap = async (text, ms, key) => { const d = key ? await narrate(key) : 0; await vo('cap', text); await sleep(Math.max(ms, d + 500)); };

    // ---- 1. Title -----------------------------------------------------------
    await vo('title', [['big', "It's 9:14 at night."], ['mid', 'A furnace just quit.'], ['sm', "Here is what your shop's phone does next."]]);
    await page.waitForSelector('#app:not([hidden])');
    tStart = Date.now();
    await sleep(400);
    await sleep(Math.max(4200, (await narrate('n1')) + 600));
    await vo('titleOff');
    await sleep(700);

    // ---- 2. The call --------------------------------------------------------
    await vo('phone', true, '9:14 PM · after hours', `Calling ${SHOP}`);
    await narrate('ring');
    await sleep(DUR.ring ? 1900 : 0);
    await vo('cap', 'This is the call. The receptionist\'s voice is the one your callers hear.');
    await say('ai', `Thanks for calling ${SHOP}. This call may be recorded. How can I help?`);
    await say('caller', "My heat's out and it's freezing in here.");
    await say('ai', "I'm sorry, that's no fun this time of year. Do you smell gas, or is a carbon monoxide alarm going off?");
    await vo('cap', 'It checks for danger first. Then one question at a time.');
    await say('caller', 'No, nothing like that.');
    await say('ai', "Good. What's your first and last name?");
    await say('caller', 'Pat Example.');
    await say('ai', "And the best number to reach you?");
    await say('caller', '215-555-0142.');
    await vo('cap', 'It reads the number back to make sure it is right.');
    await say('ai', "That's 2-1-5, 5-5-5, 0-1-4-2. Did I get that right?");
    await say('caller', 'Yes. I\'m at 12 Test Road in Testville.');
    await say('ai', 'Is anyone in the home elderly, very young, or unwell?');
    await say('caller', "My mother lives with us.");
    const wins = (await tool('check_availability', { appointment_type: 'repair', urgency: 'urgent', conversation_id: 'video_call_1' })).windows;
    // The recorded call says these two windows out loud, so the calendar has to be offering them.
    if (VOICE && DUR.c13 && (wins[0].spoken !== 'tomorrow between eight and eleven' || wins[1].spoken !== 'tomorrow between eleven and two')) {
      throw new Error(`The call audio says "tomorrow between eight and eleven", but the calendar is offering "${wins[0].spoken}". Record after 1:30 PM Eastern, or regenerate lines c13 and c15.`);
    }
    await vo('cap', 'It reads your real calendar. It never makes up a time.');
    await say('ai', `I have ${wins[0].spoken}, or ${wins[1].spoken}. Which works?`);
    await say('caller', 'The first one.');
    const booked = await tool('book_appointment', {
      window_id: wins[0].window_id, appointment_type: 'repair', urgency: 'urgent', caller_name: 'Pat Example', callback_phone: '215-555-0142',
      service_address: '12 Test Road', service_town: 'Testville', system_type: 'heating', issue_summary: 'Heat is out and the house is cold.',
      existing_customer: false, vulnerable_occupant: true, after_hours: true, conversation_id: 'video_call_1',
    });
    await page.waitForSelector('.job.ai');
    await vo('ring', '.job.ai');
    await say('ai', `You're booked for ${booked.spoken_window}. I can't promise an exact time. The tech will be there in that window. I'm flagging this for the on-call tech now.`);
    await cap('Booked. The job is on your calendar before the caller hangs up.', 600, 'n6');
    await voiceDone();

    // ---- 3. What landed in the CRM -----------------------------------------
    await vo('phone', false);
    await vo('ring', null);
    await sleep(900);
    await vo('ring', '.stats');
    await cap('Every job is tagged with where it came from and what it is worth.', 4200, 'n7');
    await vo('ring', '#detail');
    await cap('Urgent, after hours, new customer: your dispatcher sees it all at a glance.', 4200, 'n8');
    await vo('ring', null);
    await vo('to', '#detail .section:last-child', 'center');
    await cap('The customer gets a confirmation text. A review request is lined up for when the job is done.', 5000, 'n9');
    await page.click('#detail >> text=Mark job complete');
    await cap('Job done. The review request goes out on its own.', 3800, 'n10');

    // ---- 4. A second call: an estimate ---------------------------------------
    await vo('top');
    const est = (await tool('check_availability', { appointment_type: 'estimate', urgency: 'routine', conversation_id: 'video_call_2' })).windows;
    await cap('Next morning, another call: a 22-year-old furnace, and the owner wants a price.', 3600, 'n11');
    await tool('book_appointment', {
      window_id: est[0].window_id, appointment_type: 'estimate', urgency: 'routine', caller_name: 'Morgan Demo', callback_phone: '215-555-0184',
      service_address: '3 Sample Street', service_town: 'Sampleton', system_type: 'heating', issue_summary: 'Furnace is 22 years old and still running. Wants a price on a replacement.',
      existing_customer: true, after_hours: false, conversation_id: 'video_call_2',
    });
    await page.waitForSelector('.pcard >> text=Morgan Demo');
    await vo('to', '#pipeline', 'start');
    await sleep(900);
    await vo('ring', '#pipeline');
    await cap('It books the estimate visit and puts the install in your pipeline.', 4600, 'n12');
    await vo('ring', null);
    await page.click('.pcard >> text=Morgan Demo');
    await vo('to', '#detail .section:last-child', 'center');
    await cap('If the estimate goes quiet, follow-ups go out on day 2, 7 and 14.', 4600, 'n13');
    await page.click('#detail >> text=Mark estimate visit done');
    await sleep(1800);
    await page.click('#detail >> text=Mark estimate won');
    await vo('to', '#pipeline', 'start');
    await cap('When the install closes, it moves to won.', 3600, 'n14');
    await vo('top');
    await sleep(900);
    await vo('ring', '.guarantee');
    await cap('And it counts toward the $15,000 in booked jobs we guarantee in your first 90 days.', 5600, 'n15');
    await vo('ring', null);
    await vo('cap', '');
    await sleep(500);

    // ---- 5. End card ---------------------------------------------------------
    await vo('title', [['big', 'Aurelium Front Office for HVAC'], ['mid', 'Every call answered. Every job booked. Every estimate followed up.'], ['sm', 'Want to hear it answer as your shop? Book a 30-minute call with Juan at Aurelium Motion.'], ['fine', 'Demo with sample data. The call is a scripted example: the receptionist is its real voice, the caller is a voice actor. Not a recording of a customer.']]);
    await sleep(Math.max(6500, (await narrate('n16')) + 1200));
    const tEnd = Date.now();

    const video = page.video();
    await ctx.close();
    const raw = await video.path();
    const ss = ((tStart - t0) / 1000 + 0.15).toFixed(2);
    const dur = ((tEnd - tStart) / 1000 - 0.3).toFixed(2);
    const mp4 = path.join(OUT, 'hvac-demo-walkthrough.mp4');
    const args = ['-y', '-loglevel', 'error', '-ss', ss, '-i', raw];
    const venc = ['-t', dur, '-c:v', 'libx264', '-preset', 'slow', '-crf', '24', '-pix_fmt', 'yuv420p', '-r', '25', '-movflags', '+faststart'];
    if (cues.length) {
      // Each narration line is delayed to the moment its scene started, then all lines are mixed onto one track.
      cues.forEach((c) => args.push('-i', path.join(VOICE, `${c.key}.wav`)));
      const parts = cues.map((c, i) => `[${i + 1}:a]adelay=${Math.max(0, c.at - 150)}:all=1[a${i}]`);
      const mix = `${cues.map((c, i) => `[a${i}]`).join('')}amix=inputs=${cues.length}:normalize=0,loudnorm=I=-16:TP=-1.5:LRA=11[aout]`;
      args.push('-filter_complex', `${parts.join(';')};${mix}`, '-map', '0:v', '-map', '[aout]', ...venc, '-c:a', 'aac', '-b:a', '160k', '-ar', '48000', mp4);
    } else {
      args.push(...venc, '-an', mp4);
    }
    execFileSync('ffmpeg', args);
    console.log(JSON.stringify({ mp4, seconds: Number(dur), bytes: fs.statSync(mp4).size, narrationLines: cues.length, cues }));
  } finally {
    if (browser) await browser.close();
    srv.kill();
    fs.rmSync(data, { recursive: true, force: true });
    fs.rmSync(vdir, { recursive: true, force: true });
  }
}
main().catch((e) => { console.error(e); process.exit(1); });
