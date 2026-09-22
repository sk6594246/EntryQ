/**
 * EntryQ – Gate-first PWA
 * Multi-tenant, localStorage, ready for D1 later.
 */

const App = {
  state: {
    societyId: null,
    societyName: '',
    role: null,
  },

  init() {
    this.bindBoot();
    this.bindRole();
    this.bindGuard();
    this.bindResident();
    this.bindAdmin();
    this.renderSocietyList();
    this.startClock();

    // restore last society if present
    const last = localStorage.getItem('entryq_last_society');
    if (last && Storage.getSociety(last)) {
      // stay on boot so user consciously chooses role
    }
  },

  // ---------- Boot / Society ----------
  bindBoot() {
    document.getElementById('btn-new-society').addEventListener('click', () => {
      const name = prompt('Society / Complex name:');
      if (!name || !name.trim()) return;
      const soc = Storage.createSociety(name);
      localStorage.setItem('entryq_last_society', soc.id);
      this.renderSocietyList();
      this.selectSociety(soc.id);
    });
  },

  renderSocietyList() {
    const list = Storage.listSocieties();
    const el = document.getElementById('society-list');
    if (!list.length) {
      el.innerHTML = '<p style="color:var(--text-muted)">No societies yet. Create one to start.</p>';
      return;
    }
    el.innerHTML = list
      .map(
        (s) => `
      <button class="society-item" data-id="${s.id}">
        <strong>${escapeHtml(s.name)}</strong>
        <span>Created ${new Date(s.createdAt).toLocaleDateString()}</span>
      </button>`
      )
      .join('');
    el.querySelectorAll('.society-item').forEach((btn) => {
      btn.addEventListener('click', () => this.selectSociety(btn.dataset.id));
    });
  },

  selectSociety(id) {
    const soc = Storage.getSociety(id);
    if (!soc) return;
    this.state.societyId = id;
    this.state.societyName = soc.name;
    localStorage.setItem('entryq_last_society', id);
    document.getElementById('society-name-label').textContent = soc.name;
    this.showView('role');
  },

  // ---------- Role ----------
  bindRole() {
    document.getElementById('btn-back-boot').addEventListener('click', () => {
      this.state.societyId = null;
      this.showView('boot');
    });
    document.querySelectorAll('.role-card').forEach((card) => {
      card.addEventListener('click', () => {
        this.state.role = card.dataset.role;
        if (this.state.role === 'guard') this.enterGuard();
        else if (this.state.role === 'resident') this.enterResident();
        else if (this.state.role === 'admin') this.enterAdmin();
      });
    });
  },

  // ---------- Guard Kiosk ----------
  enterGuard() {
    document.getElementById('guard-society-name').textContent = this.state.societyName;
    this.showView('guard');
    this.switchGuardTab('validate');
    document.getElementById('pass-input').value = '';
    document.getElementById('pass-input').focus();
    this.hideResult('validate-result');
    this.renderTodayLogs();
  },

  bindGuard() {
    document.getElementById('btn-guard-exit').addEventListener('click', () => this.showView('role'));

    // tabs
    document.querySelectorAll('.kiosk-tabs .tab').forEach((tab) => {
      tab.addEventListener('click', () => this.switchGuardTab(tab.dataset.tab));
    });

    // validate
    document.getElementById('btn-validate').addEventListener('click', () => this.validatePass());
    document.getElementById('pass-input').addEventListener('keydown', (e) => {
      if (e.key === 'Enter') this.validatePass();
    });
    document.getElementById('btn-clear-pass').addEventListener('click', () => {
      document.getElementById('pass-input').value = '';
      this.hideResult('validate-result');
      document.getElementById('pass-input').focus();
    });

    // walk-in
    document.getElementById('walkin-form').addEventListener('submit', (e) => {
      e.preventDefault();
      this.submitWalkin(e.target);
    });
  },

  switchGuardTab(name) {
    document.querySelectorAll('.kiosk-tabs .tab').forEach((t) => t.classList.toggle('active', t.dataset.tab === name));
    document.querySelectorAll('#view-guard .tab-panel').forEach((p) => p.classList.remove('active'));
    const panel = document.getElementById('guard-' + name);
    if (panel) panel.classList.add('active');
    if (name === 'logs') this.renderTodayLogs();
    if (name === 'validate') setTimeout(() => document.getElementById('pass-input').focus(), 50);
  },

  validatePass() {
    const code = document.getElementById('pass-input').value.trim();
    const resultEl = document.getElementById('validate-result');
    if (!code) {
      this.showResult(resultEl, false, 'Enter a code');
      return;
    }

    const invite = Storage.findInviteByCode(this.state.societyId, code);
    if (!invite) {
      this.showResult(resultEl, false, '❌ Invalid code<br><small>No matching pass found</small>');
      return;
    }

    const now = new Date();
    const from = new Date(invite.validFrom);
    const until = new Date(invite.validUntil);

    if (now < from) {
      this.showResult(resultEl, false, `❌ Too early<br><small>Valid from ${from.toLocaleString()}</small>`);
      return;
    }
    if (now > until) {
      this.showResult(resultEl, false, `❌ Expired<br><small>Was valid until ${until.toLocaleString()}</small>`);
      return;
    }
    if (invite.usedCount >= invite.maxEntries) {
      this.showResult(resultEl, false, `❌ Already used<br><small>${invite.usedCount}/${invite.maxEntries} entries</small>`);
      return;
    }

    // success
    Storage.markInviteUsed(this.state.societyId, invite.id);
    Storage.addLog(this.state.societyId, {
      type: 'invite',
      visitorName: invite.guestName,
      unit: invite.unit,
      code: invite.code,
      purpose: 'Pre-approved guest',
      status: 'allowed',
    });

    this.showResult(
      resultEl,
      true,
      `✅ ALLOWED<br>
       <div class="code">${escapeHtml(invite.guestName)}</div>
       <div>Unit: <strong>${escapeHtml(invite.unit)}</strong></div>
       <small>${invite.usedCount + 1}/${invite.maxEntries} · until ${until.toLocaleString()}</small>`
    );

    document.getElementById('pass-input').value = '';
    // brief success sound could be added later
  },

  submitWalkin(form) {
    const fd = new FormData(form);
    const name = fd.get('name').trim();
    const phone = fd.get('phone').trim();
    const purpose = fd.get('purpose');
    const unit = fd.get('unit').trim();

    if (!name || !unit) return;

    // For v1 we auto-approve walk-ins and log them.
    // Later: push to resident for real-time approval (WebSocket / D1).
    const log = Storage.addLog(this.state.societyId, {
      type: 'walkin',
      visitorName: name,
      phone,
      unit,
      purpose,
      status: 'allowed', // simulated instant approval
      note: 'Walk-in (auto-approved in demo)',
    });

    const resultEl = document.getElementById('walkin-result');
    this.showResult(
      resultEl,
      true,
      `✅ Entry logged<br>
       <div class="code">${escapeHtml(name)}</div>
       <div>Unit ${escapeHtml(unit)} · ${escapeHtml(purpose)}</div>
       <small>Logged at ${new Date(log.timestamp).toLocaleTimeString()}</small>`
    );
    form.reset();
  },

  renderTodayLogs() {
    const logs = Storage.todayLogs(this.state.societyId);
    const el = document.getElementById('today-logs');
    if (!logs.length) {
      el.innerHTML = '<p style="color:var(--text-muted)">No entries yet today.</p>';
      return;
    }
    el.innerHTML = logs
      .map(
        (l) => `
      <div class="log-card">
        <strong>${escapeHtml(l.visitorName)}</strong>
        <div class="meta">
          <span>${escapeHtml(l.unit || '—')}</span>
          <span>${escapeHtml(l.purpose || l.type)}</span>
          <span>${new Date(l.timestamp).toLocaleTimeString()}</span>
          <span class="badge badge-active">${l.status}</span>
        </div>
      </div>`
      )
      .join('');
  },

  // ---------- Resident ----------
  enterResident() {
    this.showView('resident');
    this.renderMyInvites();
  },

  bindResident() {
    document.getElementById('btn-res-back').addEventListener('click', () => this.showView('role'));
    document.getElementById('btn-res-exit').addEventListener('click', () => this.showView('role'));
    document.getElementById('btn-new-invite').addEventListener('click', () => {
      const modal = document.getElementById('modal-invite');
      modal.classList.remove('hidden');
      // defaults: now → +4 hours
      const now = new Date();
      const later = new Date(now.getTime() + 4 * 60 * 60 * 1000);
      document.querySelector('#invite-form [name=validFrom]').value = toLocalInput(now);
      document.querySelector('#invite-form [name=validUntil]').value = toLocalInput(later);
    });
    document.getElementById('btn-cancel-invite').addEventListener('click', () => {
      document.getElementById('modal-invite').classList.add('hidden');
    });
    document.getElementById('invite-form').addEventListener('submit', (e) => {
      e.preventDefault();
      this.createInvite(e.target);
    });
  },

  createInvite(form) {
    const fd = new FormData(form);
    const invite = Storage.createInvite(this.state.societyId, {
      guestName: fd.get('guestName').trim(),
      guestPhone: fd.get('guestPhone').trim(),
      unit: fd.get('unit').trim(),
      validFrom: new Date(fd.get('validFrom')).toISOString(),
      validUntil: new Date(fd.get('validUntil')).toISOString(),
      maxEntries: fd.get('maxEntries'),
    });
    document.getElementById('modal-invite').classList.add('hidden');
    form.reset();
    this.renderMyInvites();
    alert(`Pass created!\n\nCode: ${invite.code}\nShare this 6-digit code with your guest.`);
  },

  renderMyInvites() {
    const invites = Storage.listInvites(this.state.societyId);
    const el = document.getElementById('my-invites');
    if (!invites.length) {
      el.innerHTML = '<p style="color:var(--text-muted);margin-top:1.5rem">No passes yet. Create one for your guests.</p>';
      return;
    }
    const now = new Date();
    el.innerHTML = invites
      .map((inv) => {
        const until = new Date(inv.validUntil);
        const expired = now > until;
        const usedUp = inv.usedCount >= inv.maxEntries;
        let badge = '<span class="badge badge-active">Active</span>';
        if (expired) badge = '<span class="badge badge-expired">Expired</span>';
        else if (usedUp) badge = '<span class="badge badge-used">Used up</span>';
        return `
        <div class="invite-card">
          <div style="display:flex;justify-content:space-between;align-items:center">
            <strong>${escapeHtml(inv.guestName)}</strong>
            ${badge}
          </div>
          <div class="code">${inv.code}</div>
          <div class="meta">
            <span>Unit ${escapeHtml(inv.unit)}</span>
            <span>${inv.usedCount}/${inv.maxEntries} entries</span>
            <span>Until ${until.toLocaleString()}</span>
          </div>
        </div>`;
      })
      .join('');
  },

  // ---------- Admin ----------
  enterAdmin() {
    this.showView('admin');
    this.renderAdmin();
  },

  bindAdmin() {
    document.getElementById('btn-admin-back').addEventListener('click', () => this.showView('role'));
    document.getElementById('btn-admin-exit').addEventListener('click', () => this.showView('role'));
    document.getElementById('btn-export').addEventListener('click', () => {
      const data = Storage.exportSociety(this.state.societyId);
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `entryq-${this.state.societyId}-${Date.now()}.json`;
      a.click();
      URL.revokeObjectURL(url);
    });
    document.getElementById('btn-clear-data').addEventListener('click', () => {
      if (confirm('Clear ALL invites and logs for this society? This cannot be undone.')) {
        Storage.clearSocietyData(this.state.societyId);
        this.renderAdmin();
      }
    });
  },

  renderAdmin() {
    const logs = Storage.listLogs(this.state.societyId);
    const invites = Storage.listInvites(this.state.societyId);
    const today = Storage.todayLogs(this.state.societyId);

    document.getElementById('admin-stats').innerHTML = `
      <div class="stat-card"><div class="num">${today.length}</div><div class="lbl">Today</div></div>
      <div class="stat-card"><div class="num">${logs.length}</div><div class="lbl">Total Logs</div></div>
      <div class="stat-card"><div class="num">${invites.length}</div><div class="lbl">Invites</div></div>
    `;

    const logsEl = document.getElementById('admin-logs');
    logsEl.innerHTML = logs.length
      ? logs
          .slice(0, 50)
          .map(
            (l) => `
        <div class="log-card">
          <strong>${escapeHtml(l.visitorName)}</strong>
          <div class="meta">
            <span>${escapeHtml(l.unit || '—')}</span>
            <span>${escapeHtml(l.purpose || l.type)}</span>
            <span>${new Date(l.timestamp).toLocaleString()}</span>
          </div>
        </div>`
          )
          .join('')
      : '<p style="color:var(--text-muted)">No logs yet.</p>';

    const invEl = document.getElementById('admin-invites');
    invEl.innerHTML = invites.length
      ? invites
          .slice(0, 30)
          .map(
            (inv) => `
        <div class="invite-card">
          <strong>${escapeHtml(inv.guestName)}</strong>
          <div class="code">${inv.code}</div>
          <div class="meta">
            <span>${inv.usedCount}/${inv.maxEntries}</span>
            <span>${new Date(inv.validUntil).toLocaleString()}</span>
          </div>
        </div>`
          )
          .join('')
      : '<p style="color:var(--text-muted)">No invites yet.</p>';
  },

  // ---------- helpers ----------
  showView(name) {
    document.querySelectorAll('.view').forEach((v) => v.classList.remove('active'));
    document.getElementById('view-' + name).classList.add('active');
  },

  showResult(el, ok, html) {
    el.classList.remove('hidden', 'ok', 'fail');
    el.classList.add(ok ? 'ok' : 'fail');
    el.innerHTML = html;
  },

  hideResult(id) {
    const el = document.getElementById(id);
    el.classList.add('hidden');
    el.innerHTML = '';
  },

  startClock() {
    const el = document.getElementById('kiosk-clock');
    const tick = () => {
      const now = new Date();
      el.textContent = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
    };
    tick();
    setInterval(tick, 1000);
  },
};

function escapeHtml(str) {
  if (!str) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function toLocalInput(date) {
  const pad = (n) => String(n).padStart(2, '0');
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

document.addEventListener('DOMContentLoaded', () => App.init());
