import { esc, DAY_NAMES, hourLabel, formatLocal, money } from './util.js';
import { CONSENT_TEXT } from './core.js';

const head = (title, extra = '') => `<!doctype html>
<html lang="en"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${esc(title)}</title>
<link rel="stylesheet" href="/static/style.css">${extra}</head>`;

const flash = (f) => (f ? `<p class="flash ${f.ok ? 'ok' : 'err'}" role="status">${esc(f.text)}</p>` : '');
const pill = (text, tone = '') => `<span class="pill ${tone}">${esc(text)}</span>`;

// ---- guest-facing ---------------------------------------------------------------

function guestShell(r, inner) {
  return `${head(`${r.name} Rewards`)}
<body class="guest" style="--brand:${esc(r.brand_color)}">
<main class="guest-card">
  <p class="eyebrow">${esc(r.name)} Rewards</p>
  ${inner}
</main></body></html>`;
}

export function landingPage(r, { table, error, values = {} }) {
  return guestShell(r, `
  <h1>Claim your ${esc(r.welcome_offer.toLowerCase())}</h1>
  <p class="muted">Tell us where to send it. It takes ten seconds.</p>
  ${error ? `<p class="flash err" role="alert">${esc(error)}</p>` : ''}
  <form method="post" action="/r/${esc(r.slug)}/claim" class="stack">
    <input type="hidden" name="table" value="${esc(table ?? '')}">
    <label>Name<input name="name" autocomplete="name" required maxlength="80" value="${esc(values.name)}"></label>
    <label>Mobile number<input name="phone" type="tel" inputmode="tel" autocomplete="tel" required
      placeholder="(647) 555-0172" value="${esc(values.phone)}"></label>
    <label>Email <span class="muted">(optional)</span><input name="email" type="email" autocomplete="email"
      maxlength="160" value="${esc(values.email)}"></label>
    <label class="check"><input type="checkbox" name="consent" value="1" ${values.consent ? 'checked' : ''}>
      <span>Text me exclusive offers. ${esc(CONSENT_TEXT(r.name))}</span></label>
    <button class="btn brand" type="submit">Claim my ${esc(r.welcome_offer.toLowerCase())}</button>
  </form>
  <p class="fine">We'll text your code to this number once. We never sell your details.</p>`);
}

export function claimedPage(r, result) {
  if (!result.isNew) {
    return guestShell(r, `
  <h1>You're already in</h1>
  <p class="muted">This number has already claimed its welcome offer. Check your texts for your code,
  or ask your server for help.</p>`);
  }
  return guestShell(r, `
  <h1>Your ${esc(r.welcome_offer.toLowerCase())} is ready</h1>
  <p class="muted">Show this code to your server. We've also sent it to your phone.</p>
  <p class="code" aria-label="Your code">${esc(result.code)}</p>`);
}

export function staffPage(r, { authed, error, success }) {
  const body = authed ? `
  <h1>Redeem a code</h1>
  ${success ? `<p class="flash ok" role="status">${esc(success)}</p>` : ''}
  ${error ? `<p class="flash err" role="alert">${esc(error)}</p>` : ''}
  <form method="post" action="/r/${esc(r.slug)}/staff/redeem" class="stack">
    <label>Code from the guest's text<input name="code" required autocapitalize="characters" autocomplete="off"
      placeholder="APP-4821" autofocus></label>
    <button class="btn brand" type="submit">Redeem</button>
  </form>` : `
  <h1>Staff sign-in</h1>
  ${error ? `<p class="flash err" role="alert">${esc(error)}</p>` : ''}
  <form method="post" action="/r/${esc(r.slug)}/staff" class="stack">
    <label>Staff PIN<input name="pin" type="password" inputmode="numeric" required autocomplete="off" autofocus></label>
    <button class="btn brand" type="submit">Sign in</button>
  </form>`;
  return guestShell(r, body);
}

export const notFoundPage = () => `${head('Not found')}<body class="guest"><main class="guest-card">
<h1>Page not found</h1><p class="muted">That link doesn't lead anywhere. Try scanning the code again.</p></main></body></html>`;

// ---- admin ----------------------------------------------------------------------

export function loginPage(error) {
  return `${head('Sign in')}<body class="guest"><main class="guest-card">
  <p class="eyebrow">Restaurant Autopilot</p><h1>Sign in</h1>
  ${error ? `<p class="flash err" role="alert">${esc(error)}</p>` : ''}
  <form method="post" action="/admin/login" class="stack">
    <label>Password<input name="password" type="password" required autofocus></label>
    <button class="btn brand" type="submit">Sign in</button>
  </form></main></body></html>`;
}

function adminShell(title, r, active, inner, f) {
  const tabs = r ? [
    ['', 'Overview'], ['/qr', 'QR codes'], ['/guests', 'Guests'], ['/campaigns', 'Blasts'],
    ['/traffic', 'Slow times'], ['/messages', 'Messages'], ['/settings', 'Settings'],
  ].map(([p, label]) => `<a href="/admin/r/${esc(r.slug)}${p}" ${p === active ? 'aria-current="page"' : ''}>${label}</a>`).join('') : '';
  return `${head(title)}
<body class="admin">
<header class="top">
  <a class="brandmark" href="/admin">Restaurant Autopilot</a>
  ${r ? `<span class="crumb">${esc(r.name)}</span>` : ''}
  <form method="post" action="/admin/logout"><button class="link" type="submit">Sign out</button></form>
</header>
${r ? `<nav class="tabs" aria-label="Sections">${tabs}</nav>` : ''}
<main class="wrap">${flash(f)}${inner}</main>
</body></html>`;
}

const settingsFields = (r = {}) => {
  const closed = new Set((r.closed_days || '').split(',').filter(Boolean).map(Number));
  return `
  <label>Restaurant name<input name="name" required maxlength="60" value="${esc(r.name)}"></label>
  <label>Welcome offer <span class="muted">(what the QR code promises)</span>
    <input name="welcome_offer" maxlength="80" value="${esc(r.welcome_offer ?? 'Free appetizer')}"></label>
  <div class="row">
    <label>Tables<input name="table_count" type="number" min="1" max="300" value="${esc(r.table_count ?? 12)}"></label>
    <label>Average check ($)<input name="avg_check" type="number" min="0" step="1" value="${esc((r.avg_check_cents ?? 4500) / 100)}"></label>
    <label>Brand colour<input name="brand_color" type="color" value="${esc(r.brand_color ?? '#2dd4bf')}"></label>
  </div>
  <div class="row">
    <label>Time zone<input name="timezone" value="${esc(r.timezone ?? 'America/Toronto')}" placeholder="America/Toronto"></label>
    <label>Opens (hour, 0-23)<input name="open_hour" type="number" min="0" max="23" value="${esc(r.open_hour ?? 11)}"></label>
    <label>Closes (hour, 1-24)<input name="close_hour" type="number" min="1" max="24" value="${esc(r.close_hour ?? 22)}"></label>
  </div>
  <fieldset><legend>Closed on</legend><div class="days">
    ${DAY_NAMES.map((d, i) => `<label class="check"><input type="checkbox" name="closed_days" value="${i}" ${closed.has(i) ? 'checked' : ''}><span>${d.slice(0, 3)}</span></label>`).join('')}
  </div></fieldset>`;
};

export function restaurantsPage(list, f) {
  return adminShell('Restaurants', null, '', `
  <h1>Restaurants</h1>
  ${list.length ? `<ul class="cards">${list.map((r) => `
    <li><a class="card linkcard" href="/admin/r/${esc(r.slug)}"><strong>${esc(r.name)}</strong>
    <span class="muted">${esc(r.timezone)} · ${r.table_count} tables</span></a></li>`).join('')}</ul>`
    : '<p class="muted">No restaurants yet. Add the first one below.</p>'}
  <section class="card">
    <h2>Add a restaurant</h2>
    <form method="post" action="/admin/restaurants" class="stack">${settingsFields()}
      <button class="btn" type="submit">Add restaurant</button></form>
  </section>`, f);
}

function bars(items, { highlight = -1, unit = '' } = {}) {
  const max = Math.max(1, ...items.map((i) => i.value));
  return `<div class="bars" role="img" aria-label="${esc(items.map((i) => `${i.label}: ${i.value}${unit}`).join(', '))}">
    ${items.map((it, i) => `<div class="bar ${i === highlight ? 'hi' : ''}" title="${esc(it.title ?? it.label)}: ${it.value}${unit}">
      <i style="height:${Math.max(4, Math.round((it.value / max) * 100))}%"></i><b>${esc(it.label)}</b></div>`).join('')}
  </div>`;
}

const slotText = (slot) => (slot ? `${DAY_NAMES[slot.dow]} ${hourLabel(slot.hour)}` : null);

export function overviewPage(r, d, f) {
  const { s, slot, grid, hours, next, live, baseUrl } = d;
  const step = (n, title, body) => `<section class="card step"><h2><span class="num">${n}</span>${title}</h2>${body}</section>`;
  const slowDay = slot ? hours.map((h) => ({ label: String(h % 12 || 12), title: hourLabel(h), value: grid[slot.dow][h] })) : [];
  return adminShell(r.name, r, '', `
  <div class="headline">
    <h1>${esc(r.name)}</h1>
    <div>${pill(live.sms ? 'SMS live' : 'SMS simulated', live.sms ? 'good' : 'warn')}
         ${pill(live.email ? 'Email live' : 'Email simulated', live.email ? 'good' : 'warn')}
         ${pill(r.auto_blast ? 'Autopilot on' : 'Autopilot off', r.auto_blast ? 'good' : '')}</div>
  </div>
  <section class="card">
    <h2>Redeem a guest's code</h2>
    <form method="post" action="/admin/r/${esc(r.slug)}/redeem" class="inline">
      <label class="sr" for="code">Code</label>
      <input id="code" name="code" placeholder="APP-4821" required autocapitalize="characters" autocomplete="off">
      <button class="btn" type="submit">Redeem</button>
    </form>
    <p class="fine">Servers can do this from their own phone at <a href="/r/${esc(r.slug)}/staff">${esc(baseUrl)}/r/${esc(r.slug)}/staff</a>${r.staff_pin ? '' : ' once you set a staff PIN in Settings'}.</p>
  </section>
  <div class="grid">
    ${step(1, 'Table QR code', `<p class="big">${s.scans.toLocaleString()}</p><p class="muted">scans across ${r.table_count} tables</p>
      <a class="btn ghost" href="/admin/r/${esc(r.slug)}/qr">Print QR cards</a>`)}
    ${step(2, 'Landing page', `<p class="big">${s.scans ? Math.round((s.contacts / s.scans) * 100) : 0}%</p>
      <p class="muted">of scans claim the offer</p><a class="btn ghost" href="/r/${esc(r.slug)}">Open page</a>`)}
    ${step(3, 'Guest contacts', `<p class="big">${s.contacts.toLocaleString()}</p><p class="muted">guests captured</p>
      <a class="btn ghost" href="/admin/r/${esc(r.slug)}/guests">View guests</a>`)}
    ${step(4, 'Confirmation', `<p class="big">${s.welcomeRedeemed.toLocaleString()}</p>
      <p class="muted">welcome offers redeemed</p><a class="btn ghost" href="/admin/r/${esc(r.slug)}/messages">Message log</a>`)}
    ${step(5, 'Contact list', `${bars(s.days.map((x) => ({ label: x.label, title: x.key, value: x.count })))}
      <p class="muted">new guests per day · ${s.audience.toLocaleString()} can be texted</p>`)}
    ${step(6, 'Slow time', slot ? `${bars(slowDay, { highlight: hours.indexOf(slot.hour) })}
      <p><strong>Slowest slot: ${esc(slotText(slot))}</strong></p>
      <p class="muted">${slot.source === 'baseline' ? 'From your typical-covers grid' : 'From scans and redemptions, last 8 weeks'}</p>`
      : `<p class="muted">Not enough traffic data yet. Enter your typical covers per hour and the slowest slot appears here.</p>
      <a class="btn ghost" href="/admin/r/${esc(r.slug)}/traffic">Enter covers</a>`)}
    ${step(7, 'SMS blast', `${next ? `<p><strong>Next: ${esc(formatLocal(next.scheduled_at, r.timezone))}</strong></p>
      <p class="sms">${esc(next.body)}</p>` : '<p class="muted">Nothing scheduled.</p>'}
      <a class="btn ghost" href="/admin/r/${esc(r.slug)}/campaigns">${next ? 'Manage blasts' : 'Schedule a blast'}</a>`)}
    ${step(8, 'Seats fill up', `<p class="big">${money(s.blastRevenueCents)}</p>
      <p class="muted">${s.blastRedemptions.toLocaleString()} blast redemptions × ${money(r.avg_check_cents)} average check,
      from ${s.blastsSent} blast${s.blastsSent === 1 ? '' : 's'}</p>`)}
  </div>`, f);
}

export function qrPage(r, cards) {
  return adminShell(`QR codes · ${r.name}`, r, '/qr', `
  <div class="headline noprint"><h1>Table QR codes</h1>
    <button class="btn" type="button" onclick="window.print()">Print</button></div>
  <p class="muted noprint">One card per table. Each code records which table the guest scanned.
  Change the table count or offer in Settings.</p>
  <div class="qr-sheet">${cards.map((c) => `
    <figure class="qr-card" style="--brand:${esc(r.brand_color)}">
      <p class="qr-name">${esc(r.name)}</p>
      <p class="qr-offer">Scan &amp; get a<br><strong>${esc(r.welcome_offer)}</strong></p>
      <div class="qr-code">${c.svg}</div>
      <figcaption>Table ${esc(c.table)}</figcaption>
    </figure>`).join('')}</div>`);
}

export function guestsPage(r, guests, s) {
  return adminShell(`Guests · ${r.name}`, r, '/guests', `
  <div class="headline"><h1>Guests</h1><a class="btn ghost" href="/admin/r/${esc(r.slug)}/guests.csv">Export CSV</a></div>
  <p class="muted">${s.contacts.toLocaleString()} captured · ${s.audience.toLocaleString()} opted in to texts</p>
  <div class="table-wrap"><table>
    <thead><tr><th>Name</th><th>Phone</th><th>Email</th><th>Source</th><th>Texts</th><th>Joined</th></tr></thead>
    <tbody>${guests.map((g) => `<tr><td>${esc(g.name)}</td><td>${esc(g.phone)}</td><td>${esc(g.email ?? '')}</td>
      <td>${esc(g.source ?? '')}</td>
      <td>${g.unsubscribed_at ? pill('Unsubscribed', 'warn') : g.sms_opt_in ? pill('Opted in', 'good') : pill('No consent')}</td>
      <td>${esc(formatLocal(g.created_at, r.timezone))}</td></tr>`).join('') ||
      '<tr><td colspan="6" class="muted">No guests yet. Print the QR cards and put them on the tables.</td></tr>'}</tbody>
  </table></div>`);
}

export function campaignsPage(r, d, f) {
  const { campaigns, slot, audience } = d;
  const tone = { sent: 'good', scheduled: '', sending: 'warn', cancelled: 'warn' };
  return adminShell(`Blasts · ${r.name}`, r, '/campaigns', `
  <h1>SMS blasts</h1>
  <section class="card">
    <h2>Schedule a blast</h2>
    <p class="muted">Goes to ${audience.toLocaleString()} guest${audience === 1 ? '' : 's'} who opted in. The offer runs for
    ${r.blast_window_hours} hour${r.blast_window_hours === 1 ? '' : 's'} and the text adds the end time, a redeem code and the opt-out line.</p>
    <form method="post" action="/admin/r/${esc(r.slug)}/campaigns" class="stack">
      <label>Offer<input name="offer" required maxlength="100" value="${esc(r.blast_offer)}"></label>
      <fieldset><legend>When</legend>
        <label class="check"><input type="radio" name="when" value="slow" ${slot ? 'checked' : 'disabled'}>
          <span>${slot ? `Slowest slot: ${esc(slotText(slot))}` : 'Slowest slot (needs traffic data first)'}</span></label>
        <label class="check"><input type="radio" name="when" value="now" ${slot ? '' : 'checked'}><span>Send now</span></label>
        <label class="check"><input type="radio" name="when" value="custom"><span>Pick a time</span></label>
        <label>Date and time (${esc(r.timezone)})<input type="datetime-local" name="at"></label>
      </fieldset>
      <button class="btn" type="submit">Schedule blast</button>
    </form>
  </section>
  <div class="table-wrap"><table>
    <thead><tr><th>When</th><th>Offer</th><th>Code</th><th>Status</th><th>Delivered</th><th>Redeemed</th><th></th></tr></thead>
    <tbody>${campaigns.map((c) => `<tr><td>${esc(formatLocal(c.scheduled_at, r.timezone))}</td>
      <td>${esc(c.offer)}${c.origin === 'auto' ? ` ${pill('Auto')}` : ''}</td><td><code>${esc(c.code)}</code></td>
      <td>${pill(c.status[0].toUpperCase() + c.status.slice(1), tone[c.status])}</td>
      <td>${c.status === 'sent' ? `${c.recipients}${c.failed ? ` (${c.failed} failed)` : ''}` : ''}</td>
      <td>${c.status === 'sent' ? c.redemptions : ''}</td>
      <td>${c.status === 'scheduled' ? `<form method="post" action="/admin/r/${esc(r.slug)}/campaigns/${c.id}/cancel">
        <button class="link" type="submit">Cancel</button></form>` : ''}</td></tr>`).join('') ||
      '<tr><td colspan="7" class="muted">No blasts yet.</td></tr>'}</tbody>
  </table></div>`, f);
}

export function trafficPage(r, d, f) {
  const { source, grid, hours, slot } = d;
  const editable = source === 'baseline';
  const max = Math.max(1, ...grid.flat());
  const closed = new Set((r.closed_days || '').split(',').filter(Boolean).map(Number));
  return adminShell(`Slow times · ${r.name}`, r, '/traffic', `
  <h1>Slow times</h1>
  <p class="muted">${slot ? `<strong>Slowest upcoming slot: ${esc(slotText(slot))}.</strong> ` : ''}
  ${source === 'baseline' ? 'Using the typical covers you entered below.'
    : source === 'activity' ? 'Estimated from QR scans and redemptions over the last 8 weeks. Enter your real covers below to override.'
    : 'No traffic data yet. Enter the typical number of guests seated in each hour (your POS hourly sales report has this).'}</p>
  <form method="post" action="/admin/r/${esc(r.slug)}/traffic">
  <div class="table-wrap"><table class="heat">
    <thead><tr><th>Day</th>${hours.map((h) => `<th>${h % 12 || 12}${h < 12 ? 'a' : 'p'}</th>`).join('')}</tr></thead>
    <tbody>${DAY_NAMES.map((day, dow) => closed.has(dow) ? `<tr><th>${day.slice(0, 3)}</th><td colspan="${hours.length}" class="muted">Closed</td></tr>`
      : `<tr><th>${day.slice(0, 3)}</th>${hours.map((h) => {
        const v = grid[dow][h];
        return `<td style="--heat:${(v / max).toFixed(2)}" class="${slot && slot.dow === dow && slot.hour === h ? 'slow' : ''}">
          <input type="number" min="0" max="9999" name="c_${dow}_${h}" aria-label="${day} ${hourLabel(h)}"
          ${editable ? `value="${v}"` : `placeholder="${source ? v : ''}"`}></td>`;
      }).join('')}</tr>`).join('')}</tbody>
  </table></div>
  <div class="inline"><button class="btn" type="submit">Save covers</button>
  ${editable ? '<button class="btn ghost" type="submit" name="clear" value="1">Clear and use scan data</button>' : ''}</div>
  </form>`, f);
}

export function messagesPage(r, messages) {
  const tone = { sent: 'good', simulated: 'warn', failed: 'err' };
  return adminShell(`Messages · ${r.name}`, r, '/messages', `
  <h1>Messages</h1>
  <p class="muted">Every text and email the system has sent. "Simulated" means no SMS or email provider is connected yet, so nothing left the server.</p>
  <div class="table-wrap"><table>
    <thead><tr><th>When</th><th>Channel</th><th>To</th><th>Message</th><th>Status</th></tr></thead>
    <tbody>${messages.map((m) => `<tr><td>${esc(formatLocal(m.created_at, r.timezone))}</td><td>${m.channel === 'sms' ? 'SMS' : 'Email'}</td>
      <td>${esc(m.recipient)}</td><td class="msg">${m.subject ? `<strong>${esc(m.subject)}</strong><br>` : ''}${esc(m.body)}</td>
      <td>${pill(m.status[0].toUpperCase() + m.status.slice(1), tone[m.status])}${m.error ? `<br><span class="fine">${esc(m.error)}</span>` : ''}</td></tr>`).join('') ||
      '<tr><td colspan="5" class="muted">No messages yet.</td></tr>'}</tbody>
  </table></div>`);
}

export function settingsPage(r, f) {
  return adminShell(`Settings · ${r.name}`, r, '/settings', `
  <h1>Settings</h1>
  <form method="post" action="/admin/r/${esc(r.slug)}/settings" class="stack card">
    ${settingsFields(r)}
    <label>Staff PIN <span class="muted">(4-8 digits, lets servers redeem codes on their phone)</span>
      <input name="staff_pin" inputmode="numeric" maxlength="8" value="${esc(r.staff_pin)}"></label>
    <h2>Autopilot</h2>
    <label class="check"><input type="checkbox" name="auto_blast" value="1" ${r.auto_blast ? 'checked' : ''}>
      <span>Automatically text this offer once a week at the slowest slot</span></label>
    <label>Weekly offer<input name="blast_offer" maxlength="100" value="${esc(r.blast_offer)}"></label>
    <label>Offer lasts (hours)<input name="blast_window_hours" type="number" min="1" max="8" value="${esc(r.blast_window_hours)}"></label>
    <button class="btn" type="submit">Save settings</button>
  </form>`, f);
}
