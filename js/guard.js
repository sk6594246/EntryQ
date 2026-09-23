const Guard = {
  enter() {
    document.getElementById('guard-society-name').textContent = App.state.societyName;
    App.showView('guard');
    this.switchTab('validate');
    document.getElementById('pass-input').value = '';
    this.hideResult('validate-result');
    this.renderTodayLogs();
  },
  bind() {
    document.getElementById('btn-guard-exit').addEventListener('click', () => App.showView('role'));
    document.querySelectorAll('#view-guard .kiosk-tabs .tab').forEach((tab) => {
      tab.addEventListener('click', () => this.switchTab(tab.dataset.tab));
    });
    document.getElementById('btn-validate').addEventListener('click', () => this.validatePass());
    document.getElementById('pass-input').addEventListener('keydown', (e) => { if (e.key === 'Enter') this.validatePass(); });
    document.getElementById('btn-clear-pass').addEventListener('click', () => {
      document.getElementById('pass-input').value = ''; this.hideResult('validate-result');
    });
    document.getElementById('walkin-form').addEventListener('submit', (e) => { e.preventDefault(); this.submitWalkin(e.target); });
    document.getElementById('btn-intercom')?.addEventListener('click', () => this.intercomCall());
  },
  switchTab(name) {
    document.querySelectorAll('#view-guard .kiosk-tabs .tab').forEach((t) => t.classList.toggle('active', t.dataset.tab === name));
    document.querySelectorAll('#view-guard .tab-panel').forEach((p) => p.classList.remove('active'));
    document.getElementById('guard-' + name)?.classList.add('active');
    if (name === 'logs') this.renderTodayLogs();
    if (name === 'pending') Approvals.renderGuardPending();
  },
  validatePass() {
    const code = document.getElementById('pass-input').value.trim();
    const resultEl = document.getElementById('validate-result');
    if (!code) { this.showResult(resultEl, false, 'Enter a code'); return; }
    const invite = Storage.findInviteByCode(App.state.societyId, code);
    if (!invite) { this.showResult(resultEl, false, 'Invalid code'); return; }
    const now = new Date();
    if (now < new Date(invite.validFrom)) { this.showResult(resultEl, false, 'Too early'); return; }
    if (now > new Date(invite.validUntil)) { this.showResult(resultEl, false, 'Expired'); return; }
    if (invite.usedCount >= invite.maxEntries) { this.showResult(resultEl, false, 'Already used'); return; }
    Storage.markInviteUsed(App.state.societyId, invite.id);
    Storage.addLog(App.state.societyId, { type: 'invite', visitorName: invite.guestName, unit: invite.unit, code: invite.code, purpose: invite.passType || 'guest', status: 'allowed' });
    this.showResult(resultEl, true, 'ALLOWED<br><div class="code">' + escapeHtml(invite.guestName) + '</div><div>Unit ' + escapeHtml(invite.unit) + '</div>');
    document.getElementById('pass-input').value = '';
  },
  submitWalkin(form) {
    const fd = new FormData(form);
    const name = fd.get('name').trim();
    const unit = fd.get('unit').trim();
    if (!name || !unit) return;
    readPhotoFile(form.querySelector('[name=photo]'), (photo) => {
      const rec = Storage.createApproval(App.state.societyId, {
        visitorName: name, phone: fd.get('phone').trim(), unit,
        purpose: fd.get('purpose'), vehicle: (fd.get('vehicle') || '').trim(), photo,
        type: fd.get('purpose') === 'Delivery' ? 'delivery' : 'walkin',
      });
      Bus.emit('approval', { id: rec.id, status: 'pending' });
      this.showResult(document.getElementById('walkin-result'), true, 'Sent to unit ' + escapeHtml(unit) + '<br><div class="code">' + escapeHtml(name) + '</div>');
      form.reset(); Approvals.renderGuardPending();
    });
  },
  intercomCall() {
    const unit = prompt('Call which unit / flat?');
    if (!unit || !unit.trim()) return;
    const rec = Storage.createApproval(App.state.societyId, { visitorName: (App.state.person && App.state.person.name) || 'Gate', unit: unit.trim(), purpose: 'Intercom', type: 'intercom' });
    Bus.emit('approval', { id: rec.id, status: 'pending' });
    alert('Intercom sent to ' + unit.trim());
    Approvals.renderGuardPending();
  },
  renderTodayLogs() {
    const logs = Storage.todayLogs(App.state.societyId);
    const el = document.getElementById('today-logs');
    if (!logs.length) { el.innerHTML = '<p style="color:var(--text-muted)">No entries yet today.</p>'; return; }
    el.innerHTML = logs.map((l) => '<div class="log-card"><strong>' + escapeHtml(l.visitorName) + '</strong><div class="meta"><span>' + escapeHtml(l.unit || '') + '</span><span>' + escapeHtml(l.purpose || l.type) + '</span><span class="badge badge-active">' + l.status + '</span></div></div>').join('');
  },
  showResult(el, ok, html) { el.classList.remove('hidden', 'ok', 'fail'); el.classList.add(ok ? 'ok' : 'fail'); el.innerHTML = html; },
  hideResult(id) { const el = document.getElementById(id); el.classList.add('hidden'); el.innerHTML = ''; },
};
