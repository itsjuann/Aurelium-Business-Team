'use strict';
// Records "the dashboard as jobs are created": a vertical, narrated video shot on the real demo CRM
// (apps/hvac-demo). Five calls arrive one after another through the real booking endpoints, and the
// camera follows each new job onto the schedule, into the revenue figure and across the pipeline.
// Usage: node dashboard-jobs.js <output dir> <voice dir>
// The voice dir holds d1..d8.wav (one narration line per beat) and durations.json.
const { chromium } = require('playwright');
const { spawn, execFileSync } = require('node:child_process');
const crypto = require('node:crypto');
const fs = require('node:fs');
const path = require('node:path');

const APP = path.join(__dirname, '..', '..', 'apps', 'hvac-demo');
const OUT = path.resolve(process.argv[2] || __dirname);
const VOICE = path.resolve(process.argv[3] || '');
const DUR = JSON.parse(fs.readFileSync(path.join(VOICE, 'durations.json'), 'utf8'));
const PORT = 8795;
const BASE = `http://localhost:${PORT}`;
const TOOL = crypto.randomBytes(24).toString('hex');
const VIEW = crypto.randomBytes(24).toString('hex');
const SHOP = 'Wrenfield Heating and Air'; // a made-up shop
const W = 1080, H = 1920, APPW = 1600;
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

const CSS = `
html,body{height:100%;overflow:hidden}
body{background:#070b12 !important}
#app{position:fixed;left:0;top:0;width:${APPW}px;transform-origin:0 0;background:var(--bg);border-radius:22px;overflow:hidden;box-shadow:0 40px 120px rgba(0,0,0,.6),0 0 0 1px rgba(255,255,255,.08),0 0 60px -10px rgba(242,193,78,.35);will-change:transform;transition:transform 1.1s cubic-bezier(.65,0,.2,1),filter .9s,opacity .9s}
#app.pre{filter:blur(14px);opacity:0}
/* Not part of this story: the setup buttons, the guarantee bar, and notes that only make sense in a live demo. */
.actions,.guarantee,.auto .note{display:none !important}
.detail{position:static !important}
#dj-shade{position:fixed;left:0;right:0;top:0;height:450px;z-index:50;pointer-events:none;background:linear-gradient(180deg,#070b12 0%,#070b12 70%,rgba(7,11,18,0) 100%)}
#dj-hl{position:fixed;left:30px;right:30px;top:158px;z-index:60;text-align:center;font:900 92px/.98 system-ui,-apple-system,"Segoe UI",Roboto,Arial,sans-serif;letter-spacing:-.035em;text-transform:uppercase;color:#fff;transition:opacity .3s,transform .3s}
#dj-hl.off{opacity:0;transform:translateY(-16px)}
#dj-hl .l2{display:block;color:#f2c14e;text-shadow:0 0 34px rgba(242,193,78,.45)}
#dj-sub{position:fixed;left:60px;right:60px;top:362px;z-index:60;text-align:center;font:700 32px/1.25 system-ui,sans-serif;color:#dbe4ee;opacity:0;transition:opacity .5s}
#dj-sub.on{opacity:1}
#dj-fade{position:fixed;left:0;right:0;bottom:0;height:400px;z-index:50;pointer-events:none;background:linear-gradient(180deg,rgba(7,11,18,0) 0%,#070b12 55%,#070b12 100%)}
#dj-mark{position:fixed;left:0;right:0;top:1690px;z-index:60;text-align:center;font:700 22px ui-monospace,Menlo,monospace;letter-spacing:.16em;text-transform:uppercase;color:#6f7f91}
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
    await fetch(`${BASE}/api/settings`, { method: 'POST', headers: { 'Content-Type': 'application/json', 'X-Demo-CSRF': '1', Cookie: cookie }, body: JSON.stringify({ shop_name: SHOP, service_towns: 'Wrenfield, Alder Park', avg_ticket: 420, avg_install: 11500 }) });

    // One call: ask the calendar for openings, then book the first one. Returns the job id.
    const call = async (id, c) => {
      const wins = (await tool('check_availability', { appointment_type: c.type, urgency: c.urgency, conversation_id: id })).windows;
      return (await tool('book_appointment', {
        window_id: wins[0].window_id, appointment_type: c.type, urgency: c.urgency, caller_name: c.name, callback_phone: c.phone,
        service_address: c.address, service_town: c.town, system_type: 'heating', issue_summary: c.summary,
        existing_customer: !!c.existing, vulnerable_occupant: !!c.vulnerable, after_hours: !!c.afterHours, conversation_id: id,
      })).job_id;
    };

    browser = await chromium.launch();
    const ctx = await browser.newContext({ viewport: { width: W, height: H }, deviceScaleFactor: 1, colorScheme: 'dark', bypassCSP: true, recordVideo: { dir: vdir, size: { width: W, height: H } } });
    await ctx.addCookies([{ name: cookie.slice(0, cookie.indexOf('=')), value: cookie.slice(cookie.indexOf('=') + 1), url: BASE }]);
    const page = await ctx.newPage();
    const t0 = Date.now();
    await page.goto(BASE);
    await page.addStyleTag({ content: CSS });
    await page.evaluate(([APPW, W]) => {
      const app = document.getElementById('app');
      app.classList.add('pre');
      const add = (id, html) => { const d = document.createElement('div'); d.id = id; d.innerHTML = html; document.body.appendChild(d); return d; };
      add('dj-shade', ''); add('dj-hl', '<span class="l1"></span><span class="l2"></span>'); add('dj-sub', 'Aurelium Front Office for HVAC');
      add('dj-fade', ''); add('dj-mark', 'Example shop · sample data');
      let scale = 1;
      const local = (e, ax = 0.5, ay = 0.5) => {
        const r = e.getBoundingClientRect(), a = app.getBoundingClientRect();
        return { x: (r.left - a.left + r.width * ax) / scale, y: (r.top - a.top + r.height * ay) / scale };
      };
      const byText = (sel, text) => [...document.querySelectorAll(sel)].find((e) => e.textContent.includes(text));
      window.dj = {
        // Point the camera at a spot in the dashboard at a zoom level; fy is where it lands on screen.
        cam(x, y, s, ms, fy) { scale = s; app.style.transitionDuration = `${ms}ms, .9s, .9s`; app.style.transform = `translate(${W / 2 - x * s}px, ${fy - y * s}px) scale(${s})`; },
        camTo(sel, s, ms, ax, ay, fy) { const p = local(document.querySelector(sel), ax, ay); this.cam(p.x, p.y, s, ms, fy); },
        camText(sel, text, s, ms, fy) { const p = local(byText(sel, text)); this.cam(p.x, p.y, s, ms, fy); },
        fit(ms) { const s = (W - 60) / APPW; scale = s; app.style.transitionDuration = `${ms}ms, .9s, .9s`; app.style.transform = `translate(30px, 452px) scale(${s})`; },
        reveal() { app.classList.remove('pre'); },
        headline(a, b) {
          const h = document.getElementById('dj-hl'); h.classList.add('off');
          setTimeout(() => { h.querySelector('.l1').textContent = a; h.querySelector('.l2').textContent = b; h.classList.remove('off'); }, 300);
        },
        sub() { document.getElementById('dj-sub').classList.add('on'); },
      };
    }, [APPW, W]);
    const dj = (fn, ...args) => page.evaluate(([f, a]) => window.dj[f](...a), [fn, args]);
    const has = (sel, text) => page.waitForFunction(([s, t]) => [...document.querySelectorAll(s)].some((e) => e.textContent.includes(t)), [sel, text]);
    await page.waitForSelector('#app:not([hidden])');
    await page.waitForSelector('.job');
    await page.evaluate(() => document.documentElement.setAttribute('data-theme', 'dark'));
    await dj('fit', 0);
    await sleep(600);

    const tStart = Date.now();
    const cues = [];
    const speak = async (key, tail = 450) => { cues.push({ key, at: Date.now() - tStart }); await sleep(DUR[key] * 1000 + tail); };

    // 1. The dashboard, before anything happens.
    await dj('headline', 'Your dashboard.', 'Live.');
    await dj('reveal');
    await sleep(1000);
    await speak('d1');

    // 2. The first call: a job is created and lands on the schedule.
    await call('dash_1', { type: 'repair', urgency: 'urgent', name: 'Marcus Hale', phone: '215-555-0142', address: '48 Alder Lane', town: 'Wrenfield', summary: 'Heat is out and the house is cold.', afterHours: true, vulnerable: true });
    await page.waitForSelector('.job.ai');
    await dj('headline', 'A call comes in.', 'A job appears.');
    await dj('camTo', '.job.ai', 2.5, 1000, 0.5, 0.5, 900);
    await sleep(900);
    await speak('d2');

    // 3. What the job carries.
    await dj('headline', 'Who. Where.', 'What they said.');
    await dj('camTo', '#detail', 1.65, 1000, 0.5, 0.0, 470);
    await sleep(1000);
    await speak('d3');

    // 4. More calls: two more jobs drop onto the schedule while the camera holds on it.
    await dj('headline', 'More calls.', 'More jobs.');
    await dj('camTo', '#calendar', 1.95, 1000, 0.37, 0.0, 480); // close on today and tomorrow, where the new jobs land
    await sleep(1100);
    cues.push({ key: 'd4', at: Date.now() - tStart });
    await sleep(700);
    await call('dash_2', { type: 'maintenance', urgency: 'routine', name: 'Renee Carter', phone: '215-555-0156', address: '9 Birch Court', town: 'Alder Park', summary: 'Wants a furnace tune-up before winter.', existing: true });
    await has('.job', 'Renee Carter');
    await sleep(1500);
    await call('dash_3', { type: 'repair', urgency: 'urgent', name: 'Luis Ortega', phone: '215-555-0163', address: '210 Mill Road', town: 'Wrenfield', summary: 'Furnace keeps shutting off after a few minutes.' });
    await has('.job', 'Luis Ortega');
    await sleep(Math.max(900, DUR.d4 * 1000 - 3400));

    // 5. Every job adds to the revenue figure.
    await dj('headline', 'Every job', 'counted.');
    await dj('camTo', '#stat-revenue', 2.3, 1000, 1.7, 0.5, 760);
    await sleep(1000);
    await speak('d5');

    // 6. An estimate goes into the pipeline.
    await call('dash_4', { type: 'estimate', urgency: 'routine', name: 'Helen Brooks', phone: '215-555-0171', address: '77 Quarry Street', town: 'Alder Park', summary: 'Furnace is 22 years old. Wants a price on a replacement.', existing: true });
    await has('.pcard', 'Helen Brooks');
    await dj('headline', 'Estimates', 'in the pipeline.');
    await dj('camText', '.pcard', 'Helen Brooks', 2.0, 1000, 900);
    await sleep(1000);
    await speak('d6');

    // 7. A caller who does not book is still captured.
    await tool('save_lead', { caller_name: 'Tom Avery', callback_phone: '215-555-0188', reason: 'estimate', urgency: 'routine', service_town: 'Wrenfield', wants_human: true, call_summary: 'Asked about a new system and wants someone to call him back.', conversation_id: 'dash_5' });
    await has('.pcard', 'Tom Avery');
    await dj('headline', 'No booking?', 'Still a lead.');
    await dj('camText', '.pcard', 'Tom Avery', 2.0, 1000, 900);
    await sleep(1000);
    await speak('d7');

    // 8. Pull back to the whole dashboard.
    await dj('headline', 'Every job.', 'One screen.');
    await dj('fit', 1500);
    await sleep(900);
    await dj('sub');
    await sleep(500);
    await speak('d8', 2000);
    const tEnd = Date.now();

    const video = page.video();
    await ctx.close();
    const raw = await video.path();
    const ss = ((tStart - t0) / 1000).toFixed(2);
    const dur = ((tEnd - tStart) / 1000 - 0.2).toFixed(2);
    const mp4 = path.join(OUT, 'hvac-dashboard-jobs.mp4');
    const args = ['-y', '-loglevel', 'error', '-ss', ss, '-i', raw];
    cues.forEach((c) => args.push('-i', path.join(VOICE, `${c.key}.wav`)));
    const parts = cues.map((c, i) => `[${i + 1}:a]adelay=${c.at}:all=1[a${i}]`);
    const mix = `${cues.map((c, i) => `[a${i}]`).join('')}amix=inputs=${cues.length}:normalize=0,loudnorm=I=-16:TP=-1.5:LRA=11[aout]`;
    args.push('-filter_complex', `${parts.join(';')};${mix}`, '-map', '0:v', '-map', '[aout]', '-t', dur,
      '-c:v', 'libx264', '-preset', 'slow', '-crf', '20', '-pix_fmt', 'yuv420p', '-r', '30', '-movflags', '+faststart', '-c:a', 'aac', '-b:a', '160k', '-ar', '48000', mp4);
    execFileSync('ffmpeg', args);
    console.log(JSON.stringify({ mp4, seconds: Number(dur), bytes: fs.statSync(mp4).size, clips: cues.length }));
  } finally {
    if (browser) await browser.close();
    srv.kill();
    fs.rmSync(data, { recursive: true, force: true });
    fs.rmSync(vdir, { recursive: true, force: true });
  }
}
main().catch((e) => { console.error(e); process.exit(1); });
