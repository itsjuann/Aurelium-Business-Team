'use strict';
// Records the vertical step-by-step explainer (explainer.html) with narration.
// Usage: node explainer.js <output dir> <voice dir>
// The voice dir holds e1..e6.wav and e8.wav (narration), ring.wav, k1..k9.wav (the call) and durations.json.
const { chromium } = require('playwright');
const { execFileSync } = require('node:child_process');
const fs = require('node:fs');
const path = require('node:path');

const OUT = path.resolve(process.argv[2] || __dirname);
const VOICE = path.resolve(process.argv[3] || '');
const DUR = JSON.parse(fs.readFileSync(path.join(VOICE, 'durations.json'), 'utf8'));
const W = 1080, H = 1920;
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function main() {
  fs.mkdirSync(OUT, { recursive: true });
  const vdir = fs.mkdtempSync(path.join(OUT, 'raw-'));
  const browser = await chromium.launch();
  try {
    const ctx = await browser.newContext({ viewport: { width: W, height: H }, deviceScaleFactor: 1, recordVideo: { dir: vdir, size: { width: W, height: H } } });
    const page = await ctx.newPage();
    const t0 = Date.now();
    await page.goto(`file://${path.join(__dirname, 'explainer.html')}`);
    await page.waitForFunction(() => window.ex);
    const ex = (fn, ...args) => page.evaluate(([f, a]) => window.ex[f](...a), [fn, args]);
    await sleep(900);
    const tStart = Date.now();
    const cues = [];
    // Play one audio clip: note when it starts, then wait for it to finish.
    const speak = async (key, tail = 380) => { cues.push({ key, at: Date.now() - tStart }); await sleep(DUR[key] * 1000 + tail); };

    // Step 1: the call. The narrator sets the scene, the phone rings, then the whole exchange is heard
    // while each line slides into the chat.
    const CALL = [
      ['ai', 'Thanks for calling Wrenfield Heating and Air. This call may be recorded. How can I help?'],
      ['caller', "My heat's out, and it's freezing in here."],
      ['ai', "I'm sorry, that's no fun this time of year. Do you smell gas, or is a carbon monoxide alarm going off?"],
      ['caller', 'No, nothing like that.'],
      ['ai', "Good. What's your first and last name?"],
      ['caller', 'Marcus Hale.'],
      ['ai', 'Thanks, Marcus. I have tomorrow between eight and eleven, or tomorrow between eleven and two. Which works?'],
      ['caller', 'The first one.'],
      ['ai', "You're booked for tomorrow between eight and eleven. The tech will be there in that window."],
    ];
    await sleep(500);
    await speak('e1');
    await ex('ringing', true);
    await speak('ring', 300);
    await ex('ringing', false);
    for (let i = 0; i < CALL.length; i++) {
      await ex('say', CALL[i][0], CALL[i][1]);
      await sleep(180); // the bubble starts to open just before the voice
      await speak(`k${i + 1}`, 330);
    }
    await sleep(700);

    // Steps 2 to 6: move along the path, then the card plays while its line is spoken.
    for (let i = 1; i < 6; i++) {
      await ex('go', i);
      await sleep(1250);
      await ex('play', i);
      await speak(`e${i + 1}`, 550);
    }

    // The whole journey on one screen.
    await ex('overview');
    await sleep(1500);
    await speak('e8', 1800);
    const tEnd = Date.now();

    const video = page.video();
    await ctx.close();
    const raw = await video.path();
    const ss = ((tStart - t0) / 1000).toFixed(2);
    const dur = ((tEnd - tStart) / 1000 - 0.2).toFixed(2);
    const mp4 = path.join(OUT, 'hvac-explainer.mp4');
    const args = ['-y', '-loglevel', 'error', '-ss', ss, '-i', raw];
    cues.forEach((c) => args.push('-i', path.join(VOICE, `${c.key}.wav`)));
    const parts = cues.map((c, i) => `[${i + 1}:a]adelay=${c.at}:all=1[a${i}]`);
    const mix = `${cues.map((c, i) => `[a${i}]`).join('')}amix=inputs=${cues.length}:normalize=0,loudnorm=I=-16:TP=-1.5:LRA=11[aout]`;
    args.push('-filter_complex', `${parts.join(';')};${mix}`, '-map', '0:v', '-map', '[aout]', '-t', dur,
      '-c:v', 'libx264', '-preset', 'slow', '-crf', '20', '-pix_fmt', 'yuv420p', '-r', '30', '-movflags', '+faststart', '-c:a', 'aac', '-b:a', '160k', '-ar', '48000', mp4);
    execFileSync('ffmpeg', args);
    console.log(JSON.stringify({ mp4, seconds: Number(dur), bytes: fs.statSync(mp4).size, clips: cues.length }));
  } finally {
    await browser.close();
    fs.rmSync(vdir, { recursive: true, force: true });
  }
}
main().catch((e) => { console.error(e); process.exit(1); });
