'use strict';
// Demo CRM screen. Everything a caller said is rendered with textContent, never as HTML.
(function () {
  const $ = (id) => document.getElementById(id);
  const POLL_MS = 1500;
  let state = null;
  let selected = null; // { kind: 'job' | 'lead', id }
  let seen = null; // ids already on screen, to highlight what just arrived
  let timer = null;

  function el(tag, cls, text) {
    const n = document.createElement(tag);
    if (cls) n.className = cls;
    if (text !== undefined && text !== null) n.textContent = text;
    return n;
  }
  function phone(p) {
    const m = /^\+1(\d{3})(\d{3})(\d{4})$/.exec(p || '');
    return m ? `(${m[1]}) ${m[2]}-${m[3]}` : (p || '');
  }
  const TYPE = { repair: 'Repair', maintenance: 'Maintenance', estimate: 'Estimate' };
  const SYSTEM = { heating: 'Heating', cooling: 'Cooling', both: 'Heating and cooling', unknown: 'Not sure' };

  async function api(path, body) {
    const opts = { credentials: 'same-origin', headers: {} };
    if (body !== undefined) {
      opts.method = 'POST';
      opts.headers = { 'Content-Type': 'application/json', 'X-Demo-CSRF': '1' };
      opts.body = JSON.stringify(body);
    }
    const res = await fetch(path, opts);
    if (res.status === 401) { showLogin(); throw new Error('unauthorized'); }
    if (!res.ok) throw new Error(`request failed: ${res.status}`);
    return res.json();
  }

  function showLogin() {
    clearInterval(timer); timer = null;
    $('app').hidden = true;
    $('login').hidden = false;
    $('key').focus();
  }
  function showApp() {
    $('login').hidden = true;
    $('app').hidden = false;
    if (!timer) timer = setInterval(refresh, POLL_MS);
  }

  async function refresh() {
    try {
      state = await api('/api/state');
      $('live-text').textContent = 'Live';
      $('live-text').parentElement.classList.remove('off');
      showApp();
      render();
    } catch (e) {
      if (e.message !== 'unauthorized') {
        $('live-text').textContent = 'Reconnecting';
        $('live-text').parentElement.classList.add('off');
      }
    }
  }

  function badges(parent, list) {
    const wrap = el('div', 'badges');
    list.filter(Boolean).forEach(([cls, text]) => wrap.appendChild(el('span', `badge ${cls}`, text)));
    if (wrap.children.length) parent.appendChild(wrap);
  }

  function render() {
    document.title = `${state.settings.shop_name} · Front Office`;
    $('shop').textContent = state.settings.shop_name;
    $('stat-booked').textContent = state.counts.booked_by_ai;
    $('stat-leads').textContent = state.counts.leads;

    const ids = new Set([...state.jobs.map((j) => `job:${j.id}:${j.updated_at}`), ...state.leads.map((l) => `lead:${l.id}:${l.updated_at}`)]);
    const fresh = new Set();
    if (seen) ids.forEach((k) => { if (!seen.has(k)) fresh.add(k.split(':').slice(0, 2).join(':')); });
    seen = ids;
    // A record that just arrived takes over the detail panel.
    if (fresh.size) {
      const [kind, id] = [...fresh][fresh.size - 1].split(':');
      selected = { kind, id };
    }
    if (!selected) {
      const ai = state.jobs.filter((j) => !j.sample).sort((a, b) => b.updated_at - a.updated_at)[0];
      const first = ai || state.jobs[0];
      if (first) selected = { kind: 'job', id: first.id };
    }

    const cal = $('calendar');
    cal.replaceChildren();
    state.days.forEach((d) => {
      const day = el('div', 'day');
      day.appendChild(el('h3', '', d.label));
      state.windows.forEach((w) => {
        const slot = el('div', 'slot');
        slot.appendChild(el('div', 'slot-label', w.label));
        state.jobs.filter((j) => j.date === d.date && j.start === w.start).forEach((j) => {
          const b = el('button', 'job');
          b.type = 'button';
          if (!j.sample) b.classList.add('ai');
          if (j.urgency === 'urgent') b.classList.add('urgent');
          if (selected && selected.kind === 'job' && selected.id === j.id) b.classList.add('selected');
          if (fresh.has(`job:${j.id}`)) b.classList.add('fresh');
          b.appendChild(el('div', 'name', j.customer.name));
          b.appendChild(el('div', 'meta', `${TYPE[j.appointment_type]}${j.status === 'complete' ? ' · Complete' : ''}`));
          badges(b, [j.urgency === 'urgent' && ['urgent', 'Urgent'], !j.sample && ['source', 'AI receptionist']]);
          b.addEventListener('click', () => { selected = { kind: 'job', id: j.id }; render(); });
          slot.appendChild(b);
        });
        day.appendChild(slot);
      });
      cal.appendChild(day);
    });

    const leads = $('leads');
    leads.replaceChildren();
    if (!state.leads.length) leads.appendChild(el('div', 'empty', 'No leads yet. A call that ends without a booking lands here.'));
    state.leads.slice().sort((a, b) => b.updated_at - a.updated_at).forEach((l) => {
      const b = el('button', 'lead');
      b.type = 'button';
      if (selected && selected.kind === 'lead' && selected.id === l.id) b.classList.add('selected');
      if (fresh.has(`lead:${l.id}`)) b.classList.add('fresh');
      b.appendChild(el('div', 'name', `${l.caller_name} · ${l.reason}`));
      b.appendChild(el('div', 'meta muted', l.task));
      badges(b, [l.urgency !== 'routine' && ['urgent', l.urgency === 'safety' ? 'Safety' : 'Urgent'], l.wants_human && ['info', 'Wants a person']]);
      b.addEventListener('click', () => { selected = { kind: 'lead', id: l.id }; render(); });
      leads.appendChild(b);
    });

    renderDetail();
  }

  function kv(parent, rows) {
    const dl = el('dl', 'kv');
    rows.filter((r) => r && r[1]).forEach(([k, v]) => { dl.appendChild(el('dt', '', k)); dl.appendChild(el('dd', '', v)); });
    parent.appendChild(dl);
  }
  function section(parent, title) {
    const s = el('div', 'section');
    s.appendChild(el('h4', '', title));
    parent.appendChild(s);
    return s;
  }

  function renderDetail() {
    const box = $('detail');
    box.replaceChildren();
    if (!selected) { box.appendChild(el('p', 'muted', 'Select a job or a lead.')); return; }

    if (selected.kind === 'lead') {
      const l = state.leads.find((x) => x.id === selected.id);
      if (!l) { selected = null; return renderDetail(); }
      box.appendChild(el('h3', '', l.caller_name));
      badges(box, [['source', `Source: ${l.source}`], l.urgency !== 'routine' && ['urgent', l.urgency === 'safety' ? 'Safety' : 'Urgent'], l.wants_human && ['info', 'Wants a person']]);
      kv(box, [['Lead', l.id], ['Phone', phone(l.callback_phone)], ['Reason', l.reason], ['Town', l.service_town], ['Prefers', l.appointment_pref]]);
      section(box, 'Call summary').appendChild(el('p', '', l.call_summary));
      section(box, 'Task').appendChild(el('p', '', l.task));
      return;
    }

    const j = state.jobs.find((x) => x.id === selected.id);
    if (!j) { selected = null; return renderDetail(); }
    box.appendChild(el('h3', '', j.customer.name));
    badges(box, [
      [j.sample ? '' : 'source', `Source: ${j.source}`],
      j.urgency === 'urgent' && ['urgent', 'Urgent'],
      j.after_hours && ['info', 'After hours'],
      j.vulnerable_occupant && ['urgent', 'Vulnerable occupant'],
      !j.sample && [j.customer.is_new ? 'new' : '', j.customer.is_new ? 'New customer' : 'Existing customer'],
      j.status === 'complete' && ['new', 'Complete'],
    ]);
    kv(box, [
      ['Job', j.id], ['Phone', phone(j.customer.phone)],
      ['Address', [j.customer.address, j.customer.town].filter(Boolean).join(', ')],
      ['Visit', `${j.day_label}, ${j.window_label}`], ['Type', TYPE[j.appointment_type]], ['System', SYSTEM[j.system_type]],
    ]);
    section(box, 'Call summary').appendChild(el('p', '', j.issue_summary));

    const auto = section(box, 'What happens next');
    j.automations.forEach((a) => {
      const row = el('div', 'auto');
      const head = el('div', 'head');
      head.appendChild(el('span', '', a.kind));
      head.appendChild(el('span', `state${a.status === 'Queued' ? ' queued' : ''}`, a.status));
      row.appendChild(head);
      row.appendChild(el('p', 'text', a.text));
      if (a.note) row.appendChild(el('p', 'note', a.note));
      auto.appendChild(row);
    });
    if (j.status !== 'complete') {
      const done = el('button', 'btn primary mt', 'Mark job complete');
      done.type = 'button';
      done.addEventListener('click', async () => { await api('/api/jobs/complete', { job_id: j.id }); refresh(); });
      auto.appendChild(done);
    }
  }

  $('login-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    $('login-error').hidden = true;
    const res = await fetch('/api/login', {
      method: 'POST', credentials: 'same-origin', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ key: $('key').value }),
    });
    $('key').value = '';
    if (res.ok) { seen = null; refresh(); } else { $('login-error').hidden = false; }
  });
  $('btn-logout').addEventListener('click', async () => { await api('/api/logout', {}); state = null; seen = null; selected = null; showLogin(); });
  $('btn-reset').addEventListener('click', async () => {
    if (!window.confirm('Clear every call from this demo and put the placeholder shop name back?')) return;
    await api('/api/reset', {});
    selected = null; seen = null;
    refresh();
  });
  $('btn-settings').addEventListener('click', () => {
    $('set-shop').value = state.settings.shop_name;
    $('set-towns').value = state.settings.service_towns;
    $('settings').showModal();
  });
  $('settings-cancel').addEventListener('click', () => $('settings').close());
  $('settings-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    await api('/api/settings', { shop_name: $('set-shop').value, service_towns: $('set-towns').value || undefined });
    $('settings').close();
    seen = null;
    refresh();
  });

  refresh();
}());
