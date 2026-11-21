'use strict';
// Records a short vertical "camera over the dashboard" reel of the real demo CRM (apps/hvac-demo):
// zooms, pans, a cursor, and a light-to-dark wipe. No narration. Sample data only.
// Usage: node reel.js <output dir>   (needs Playwright and ffmpeg)
const { chromium } = require('playwright');
const { spawn, execFileSync } = require('node:child_process');
const crypto = require('node:crypto');
const fs = require('node:fs');
const path = require('node:path');

const APP = path.join(__dirname, '..', '..', 'apps', 'hvac-demo');
const OUT = path.resolve(process.argv[2] || __dirname);
const PORT = 8796;
const BASE = `http://localhost:${PORT}`;
const TOOL = crypto.randomBytes(24).toString('hex');
const VIEW = crypto.randomBytes(24).toString('hex');
const SHOP = 'Demo Heating and Air';
const W = 1080, H = 1920, APPW = 1600, FOCUS_Y = 720;
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

const CSS = `
html,body{height:100%;overflow:hidden}
body{background:linear-gradient(180deg,#e3e5e9 0%,#cfd3d9 100%) !important;transition:background .8s}
:root[data-theme="dark"] body{background:linear-gradient(180deg,#141b25 0%,#0a0f16 100%) !important}
#app{position:fixed;left:0;top:0;width:${APPW}px;transform-origin:0 0;background:var(--bg);border-radius:22px;overflow:hidden;box-shadow:0 40px 120px rgba(10,20,35,.35),0 0 0 1px rgba(10,20,35,.08);will-change:transform;transition:transform 1.1s cubic-bezier(.65,0,.2,1),filter .9s,opacity .9s}
#app.pre{filter:blur(14px);opacity:0}
.actions{display:none !important}
.detail{position:static !important}
#rl-band{position:fixed;left:0;right:0;bottom:0;height:700px;z-index:50;pointer-events:none;background:linear-gradient(180deg,rgba(207,211,217,0) 0%,#cfd3d9 26%,#cfd3d9 100%);transition:background .8s}
:root[data-theme="dark"] #rl-band{background:linear-gradient(180deg,rgba(10,15,22,0) 0%,#0a0f16 26%,#0a0f16 100%)}
#rl-cap{position:fixed;left:60px;right:60px;top:1300px;z-index:60;text-align:center;font:800 62px/1.12 system-ui,-apple-system,"Segoe UI",Roboto,Arial,sans-serif;letter-spacing:-.02em;color:#101a26;opacity:0;transform:translateY(18px);transition:opacity .35s,transform .35s}
#rl-cap.on{opacity:1;transform:none}
#rl-cap small{display:block;margin-top:16px;font:600 30px/1.25 system-ui,sans-serif;letter-spacing:0;color:#4d5b6b}
:root[data-theme="dark"] #rl-cap{color:#f4f7fb}
:root[data-theme="dark"] #rl-cap small{color:#9fb0c3}
#rl-mark{position:fixed;left:0;right:0;top:1560px;z-index:60;text-align:center;font:600 22px system-ui,sans-serif;letter-spacing:.08em;text-transform:uppercase;color:#7a8796}
#rl-cursor{position:absolute;left:0;top:0;z-index:999;width:30px;height:30px;pointer-events:none;transition:transform .7s cubic-bezier(.5,0,.2,1);opacity:0}
#rl-cursor.on{opacity:1}
#rl-cursor svg{display:block;filter:drop-shadow(0 2px 3px rgba(0,0,0,.45))}
#rl-cursor i{position:absolute;left:-14px;top:-14px;width:36px;height:36px;border-radius:50%;border:3px solid #f2b83a;opacity:0}
#rl-cursor.click i{animation:rlclick .5s ease-out}
@keyframes rlclick{0%{opacity:.9;transform:scale(.4)}100%{opacity:0;transform:scale(1.9)}}
::view-transition-old(root),::view-transition-new(root){animation:none;mix-blend-mode:normal}
::view-transition-new(root){z-index:2}
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
    const api = (p, body) => fetch(`${BASE}${p}`, { method: 'POST', headers: { 'Content-Type': 'application/json', 'X-Demo-CSRF': '1', Cookie: cookie }, body: JSON.stringify(body) });
    await api('/api/settings', { shop_name: SHOP, service_towns: 'Testville, Sampleton', avg_ticket: 420, avg_install: 11500 });

    browser = await chromium.launch();
    const ctx = await browser.newContext({ viewport: { width: W, height: H }, deviceScaleFactor: 1, colorScheme: 'light', bypassCSP: true, recordVideo: { dir: vdir, size: { width: W, height: H } } });
    await ctx.addCookies([{ name: cookie.slice(0, cookie.indexOf('=')), value: cookie.slice(cookie.indexOf('=') + 1), url: BASE }]);
    const page = await ctx.newPage();
    const t0 = Date.now();
    await page.goto(BASE);
    await page.addStyleTag({ content: CSS });
    await page.evaluate(([APPW, FOCUS_Y, W]) => {
      const app = document.getElementById('app');
      app.classList.add('pre');
      const add = (id, html, parent) => { const d = document.createElement('div'); d.id = id; d.innerHTML = html; (parent || document.body).appendChild(d); return d; };
      add('rl-band', ''); add('rl-cap', ''); add('rl-mark', 'Demo · sample data');
      add('rl-cursor', '<svg width="30" height="30" viewBox="0 0 24 24"><path d="M4 2l15 11h-8l-3 8z" fill="#fff" stroke="#111" stroke-width="1.6" stroke-linejoin="round"/></svg><i></i>', app);
      let scale = 1;
      const local = (sel, ax = 0.5, ay = 0.5) => {
        const e = typeof sel === 'string' ? document.querySelector(sel) : sel;
        const r = e.getBoundingClientRect(), a = app.getBoundingClientRect();
        return { x: (r.left - a.left + r.width * ax) / scale, y: (r.top - a.top + r.height * ay) / scale };
      };
      const byText = (sel, text) => [...document.querySelectorAll(sel)].find((e) => e.textContent.includes(text));
      window.rl = {
        // Point the camera at a spot in the dashboard (app coordinates) at a zoom level.
        cam(x, y, s, ms = 1100, fy = FOCUS_Y) { scale = s; app.style.transitionDuration = `${ms}ms, .9s, .9s`; app.style.transform = `translate(${W / 2 - x * s}px, ${fy - y * s}px) scale(${s})`; },
        camTo(sel, s, ms, ax, ay, fy) { // ax, ay: which point of the element, as a fraction of its size
          const p = local(sel, ax, ay); this.cam(p.x, p.y, s, ms, fy); },
        camText(sel, text, s, ms, fy) { const p = local(byText(sel, text)); this.cam(p.x, p.y, s, ms, fy); },
        fit(ms = 1200) { const s = (W - 60) / APPW; scale = s; app.style.transitionDuration = `${ms}ms, .9s, .9s`; app.style.transform = `translate(30px, 235px) scale(${s})`; },
        reveal() { app.classList.remove('pre'); },
        cap(text, sub) { const c = document.getElementById('rl-cap'); c.classList.remove('on'); setTimeout(() => { c.textContent = text; if (sub) { const s = document.createElement('small'); s.textContent = sub; c.appendChild(s); } c.classList.add('on'); }, 220); },
        cursor(sel, text) { const e = text ? byText(sel, text) : document.querySelector(sel); const p = local(e, 0.55, 0.6); const c = document.getElementById('rl-cursor'); c.classList.add('on'); c.style.transform = `translate(${p.x}px, ${p.y}px)`; },
        click(sel, text) { const c = document.getElementById('rl-cursor'); c.classList.remove('click'); void c.offsetWidth; c.classList.add('click'); const e = text ? byText(sel, text) : document.querySelector(sel); if (e) e.click(); },
        cursorOff() { document.getElementById('rl-cursor').classList.remove('on'); },
        // Light to dark, revealed as a circle growing from a point on screen.
        wipeDark(cx, cy) {
          const go = () => document.documentElement.setAttribute('data-theme', 'dark');
          if (!document.startViewTransition) { go(); return; }
          const r = Math.hypot(Math.max(cx, innerWidth - cx), Math.max(cy, innerHeight - cy));
          document.startViewTransition(go).ready.then(() => document.documentElement.animate(
            { clipPath: [`circle(0px at ${cx}px ${cy}px)`, `circle(${r}px at ${cx}px ${cy}px)`] },
            { duration: 1100, easing: 'cubic-bezier(.65,0,.2,1)', pseudoElement: '::view-transition-new(root)' }));
        },
      };
    }, [APPW, FOCUS_Y, W]);
    const rl = (fn, ...args) => page.evaluate(([f, a]) => window.rl[f](...a), [fn, args]);
    await page.waitForSelector('#app:not([hidden])');
    await page.waitForSelector('.job');
    await page.evaluate(() => document.documentElement.setAttribute('data-theme', 'light'));

    // ---- 1. Open: close on the shop name, then pull back to the whole screen ------
    await rl('camTo', '.brand', 2.4, 0, 1.0, 0.5, 330);
    await sleep(500);
    const tStart = Date.now();
    await rl('reveal');
    await rl('cap', '9:14 PM. The furnace quits.');
    await sleep(800);
    await rl('fit', 1200);
    await sleep(1400);

    // ---- 2. The call is booked: zoom on the job landing on the calendar ---------
    const wins = (await tool('check_availability', { appointment_type: 'repair', urgency: 'urgent', conversation_id: 'reel_1' })).windows;
    await tool('book_appointment', {
      window_id: wins[0].window_id, appointment_type: 'repair', urgency: 'urgent', caller_name: 'Pat Example', callback_phone: '215-555-0142',
      service_address: '12 Test Road', service_town: 'Testville', system_type: 'heating', issue_summary: 'Heat is out and the house is cold.',
      existing_customer: false, vulnerable_occupant: true, after_hours: true, conversation_id: 'reel_1',
    });
    await page.waitForSelector('.job.ai');
    await rl('camTo', '.job.ai', 2.6, 950, 0.5, 0.5, 620);
    await rl('cap', 'Answered. Booked.');
    await sleep(1900);

    // ---- 3. What it is worth ------------------------------------------------------
    await rl('camTo', '#stat-revenue', 2.3, 950, 1.7, 0.5, 330);
    await rl('cap', 'Tagged with its value.');
    await sleep(1700);

    // ---- 4. The record, then mark it complete --------------------------------------
    await rl('camTo', '#detail', 1.7, 950, 0.5, 0.0, 300);
    await rl('cap', 'Urgent. After hours.');
    await sleep(1600);
    await rl('camText', '#detail .btn', 'Mark job complete', 1.7, 850);
    await sleep(450);
    await rl('cursor', '#detail .btn', 'Mark job complete');
    await sleep(800);
    await rl('click', '#detail .btn', 'Mark job complete');
    await rl('cap', 'Review request queued.');
    await sleep(1500);
    await rl('cursorOff');

    // ---- 5. An estimate moves through the pipeline ----------------------------------
    const est = (await tool('check_availability', { appointment_type: 'estimate', urgency: 'routine', conversation_id: 'reel_2' })).windows;
    const estJob = (await tool('book_appointment', {
      window_id: est[0].window_id, appointment_type: 'estimate', urgency: 'routine', caller_name: 'Morgan Demo', callback_phone: '215-555-0184',
      service_address: '3 Sample Street', service_town: 'Sampleton', system_type: 'heating', issue_summary: 'Furnace is 22 years old. Wants a price on a replacement.',
      existing_customer: true, after_hours: false, conversation_id: 'reel_2',
    })).job_id;
    const card = () => page.waitForFunction(() => [...document.querySelectorAll('.pcard')].some((e) => e.textContent.includes('Morgan Demo')));
    await card();
    await rl('camText', '.pcard', 'Morgan Demo', 2.0, 1000, 520);
    await rl('cap', 'New furnace? In the pipeline.');
    await sleep(1900);
    await api('/api/jobs/complete', { job_id: estJob });
    await page.waitForFunction(() => [...document.querySelectorAll('.pcard')].some((e) => e.textContent.includes('Morgan Demo') && e.parentElement.textContent.includes('Estimate out')));
    await rl('camText', '.pcard', 'Morgan Demo', 2.0, 800, 520);
    await sleep(1100);
    await api('/api/jobs/won', { job_id: estJob });
    await page.waitForFunction(() => [...document.querySelectorAll('.pcard')].some((e) => e.textContent.includes('Morgan Demo') && e.parentElement.textContent.includes('Install won')));
    await rl('camText', '.pcard', 'Morgan Demo', 2.0, 800, 520);
    await rl('cap', 'Followed up. Won.');
    await sleep(1700);

    // ---- 6. The guarantee -----------------------------------------------------------
    await rl('camTo', '.guarantee', 1.75, 1000, 0.27, 0.5, 420);
    await rl('cap', '$11,920 toward the $15,000 guarantee.');
    await sleep(2100);

    // ---- 7. Pull back, wipe to dark, sign off ------------------------------------------
    await rl('fit', 1100);
    await sleep(650);
    await rl('wipeDark', 540, 640);
    await rl('cap', 'Aurelium Front Office for HVAC', 'Every call answered. Every job booked.');
    await sleep(2800);
    const tEnd = Date.now();

    const video = page.video();
    await ctx.close();
    const raw = await video.path();
    const ss = ((tStart - t0) / 1000).toFixed(2);
    const dur = ((tEnd - tStart) / 1000 - 0.2).toFixed(2);
    const mp4 = path.join(OUT, 'hvac-demo-reel.mp4');
    execFileSync('ffmpeg', ['-y', '-loglevel', 'error', '-ss', ss, '-i', raw, '-t', dur, '-c:v', 'libx264', '-preset', 'slow', '-crf', '21', '-pix_fmt', 'yuv420p', '-r', '30', '-movflags', '+faststart', '-an', mp4]);
    console.log(JSON.stringify({ mp4, seconds: Number(dur), bytes: fs.statSync(mp4).size }));
  } finally {
    if (browser) await browser.close();
    srv.kill();
    fs.rmSync(data, { recursive: true, force: true });
    fs.rmSync(vdir, { recursive: true, force: true });
  }
}
main().catch((e) => { console.error(e); process.exit(1); });
