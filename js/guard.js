/**
 * EntryQ – Guard Kiosk module
 * Depends on: Storage, App, escapeHtml
 */

const Guard = {
  enter() {
    document.getElementById('guard-society-name').textContent = App.state.societyName;
    App.showView('guard');
    this.switchTab('validate');
    document.getElementById('pass-input').value = '';
    document.getElementById('pass-input').focus();
    this.hideResult('validate-result');
    this.renderTodayLogs();
  },

  bind() {
    document.getElementById('btn-guard-exit').addEventListener('click', () => App.showView('role'));

    document.querySelectorAll('.kiosk-tabs .tab').forEach((tab) => {
      tab.addEventListener('click', () => this.switchTab(tab.dataset.tab));
    });

    document.getElementById('btn-validate').addEventListener('click', () => this.validatePass());
    document.getElementById('pass-input').addEventListener('keydown', (e) => {
      if (e.key === 'Enter') this.validatePass();
    });
    document.getElementById('btn-clear-pass').addEventListener('click', () => {
      document.getElementById('pass-input').value = '';
      this.hideResult('validate-result');
      document.getElementById('pass-input').focus();
    });

    document.getElementById('walkin-form').addEventListener('submit', (e) => {
      e.preventDefault();
      this.submitWalkin(e.target);
    });
  },

  switchTab(name) {
    document.querySelectorAll('.kiosk-tabs .tab').forEach((t) =>
      t.classList.toggle('active', t.dataset.tab === name)
    );
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

    const invite = Storage.findInviteByCode(App.state.societyId, code);
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
      this.showResult(
        resultEl,
        false,
        `❌ Already used<br><small>${invite.usedCount}/${invite.maxEntries} entries</small>`
      );
      return;
    }

    Storage.markInviteUsed(App.state.societyId, invite.id);
    Storage.addLog(App.state.societyId, {
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
  },

  submitWalkin(form) {
    const fd = new FormData(form);
    const name = fd.get('name').trim();
    const phone = fd.get('phone').trim();
    const purpose = fd.get('purpose');
    const unit = fd.get('unit').trim();
    if (!name || !unit) return;

    const log = Storage.addLog(App.state.societyId, {
      type: 'walkin',
      visitorName: name,
      phone,
      unit,
      purpose,
      status: 'allowed',
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
    const logs = Storage.todayLogs(App.state.societyId);
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
};
