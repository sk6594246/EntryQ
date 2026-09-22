/**
 * EntryQ – Admin module
 * Depends on: Storage, App, escapeHtml
 */

const Admin = {
  enter() {
    App.showView('admin');
    this.render();
  },

  bind() {
    document.getElementById('btn-admin-back').addEventListener('click', () => App.showView('role'));
    document.getElementById('btn-admin-exit').addEventListener('click', () => App.showView('role'));

    document.getElementById('btn-export').addEventListener('click', () => {
      const data = Storage.exportSociety(App.state.societyId);
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `entryq-${App.state.societyId}-${Date.now()}.json`;
      a.click();
      URL.revokeObjectURL(url);
    });

    document.getElementById('btn-clear-data').addEventListener('click', () => {
      if (confirm('Clear ALL invites and logs for this society? This cannot be undone.')) {
        Storage.clearSocietyData(App.state.societyId);
        this.render();
      }
    });
  },

  render() {
    const logs = Storage.listLogs(App.state.societyId);
    const invites = Storage.listInvites(App.state.societyId);
    const today = Storage.todayLogs(App.state.societyId);

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
};
