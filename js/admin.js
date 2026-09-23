const Admin = {
  enter() {
    App.showView('admin');
    this.switchTab('people');
    this.renderStats();
    People.renderList();
    this.renderLogs();
    this.renderInvites();
    Notices.renderAdmin();
    Tickets.renderAdmin();
  },
  bind() {
    document.getElementById('btn-admin-back')?.addEventListener('click', () => App.showView('role'));
    document.getElementById('btn-admin-exit')?.addEventListener('click', () => App.showView('role'));
    document.querySelectorAll('.admin-tabs .tab').forEach((tab) => {
      tab.addEventListener('click', () => this.switchTab(tab.dataset.tab));
    });
    document.getElementById('btn-export')?.addEventListener('click', () => {
      const data = Storage.exportSociety(App.state.societyId);
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url; a.download = 'entryq-' + App.state.societyId + '.json'; a.click();
      URL.revokeObjectURL(url);
    });
    document.getElementById('btn-clear-data')?.addEventListener('click', () => {
      if (confirm('Clear ALL data for this society?')) {
        Storage.clearSocietyData(App.state.societyId);
        this.renderStats(); People.renderList(); this.renderLogs(); this.renderInvites();
        Notices.renderAdmin(); Tickets.renderAdmin();
      }
    });
  },
  switchTab(name) {
    document.querySelectorAll('.admin-tabs .tab').forEach((t) => t.classList.toggle('active', t.dataset.tab === name));
    document.querySelectorAll('#view-admin .tab-panel').forEach((p) => p.classList.remove('active'));
    document.getElementById('admin-' + name)?.classList.add('active');
    if (name === 'people') People.renderList();
    if (name === 'logs') this.renderLogs();
    if (name === 'invites') this.renderInvites();
    if (name === 'notices') Notices.renderAdmin();
    if (name === 'tickets') Tickets.renderAdmin();
  },
  renderStats() {
    const sid = App.state.societyId;
    const el = document.getElementById('admin-stats');
    if (!el) return;
    el.innerHTML = '<div class="stat-card"><div class="num">' + Storage.listPeople(sid).length + '</div><div class="lbl">People</div></div>' +
      '<div class="stat-card"><div class="num">' + Storage.todayLogs(sid).length + '</div><div class="lbl">Today</div></div>' +
      '<div class="stat-card"><div class="num">' + Storage.listTickets(sid).length + '</div><div class="lbl">Tickets</div></div>';
  },
  renderLogs() {
    const logs = Storage.listLogs(App.state.societyId);
    const el = document.getElementById('admin-logs-list');
    if (!el) return;
    el.innerHTML = logs.length ? logs.slice(0, 50).map((l) => '<div class="log-card"><strong>' + escapeHtml(l.visitorName) + '</strong><div class="meta"><span>' + escapeHtml(l.unit || '') + '</span><span>' + escapeHtml(l.purpose || l.type) + '</span></div></div>').join('') : '<p style="color:var(--text-muted)">No logs yet.</p>';
  },
  renderInvites() {
    const invites = Storage.listInvites(App.state.societyId);
    const el = document.getElementById('admin-invites-list');
    if (!el) return;
    el.innerHTML = invites.length ? invites.slice(0, 30).map((inv) => '<div class="invite-card"><strong>' + escapeHtml(inv.guestName) + '</strong><div class="code">' + inv.code + '</div></div>').join('') : '<p style="color:var(--text-muted)">No invites yet.</p>';
  },
};
