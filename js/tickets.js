const Tickets = {
  bind() {
    document.getElementById('ticket-form')?.addEventListener('submit', (e) => {
      e.preventDefault();
      const fd = new FormData(e.target);
      readPhotoFile(e.target.querySelector('[name=photo]'), (photo) => {
        Storage.createTicket(App.state.societyId, {
          title: fd.get('title'), detail: fd.get('detail'),
          unit: fd.get('unit') || (App.state.person && App.state.person.unit) || '',
          photo, slaHours: 24, createdBy: (App.state.person && App.state.person.name) || '',
        });
        e.target.reset(); this.renderResident(); this.renderAdmin();
      });
    });
  },
  card(t, admin) {
    const overdue = t.status === 'open' && new Date(t.slaDue) < new Date();
    return '<div class="log-card" data-id="' + t.id + '">' +
      (t.photo ? '<img class="thumb" src="' + t.photo + '" alt="" />' : '') +
      '<strong>' + escapeHtml(t.title) + '</strong><p>' + escapeHtml(t.detail) + '</p>' +
      '<div class="meta"><span>Unit ' + escapeHtml(t.unit || '—') + '</span><span class="badge ' + (overdue ? 'badge-expired' : 'badge-active') + '">SLA</span><span class="badge badge-used">' + escapeHtml(t.status) + '</span></div>' +
      (admin && t.status === 'open' ? '<div class="person-actions"><button type="button" class="btn btn-success btn-sm btn-tkt-close">Close</button></div>' : '') +
      '</div>';
  },
  renderResident() {
    const el = document.getElementById('res-ticket-list');
    if (!el) return;
    const list = Storage.listTickets(App.state.societyId);
    el.innerHTML = list.length ? list.map((t) => this.card(t, false)).join('') : '<p style="color:var(--text-muted)">No tickets yet.</p>';
  },
  renderAdmin() {
    const el = document.getElementById('admin-ticket-list');
    if (!el) return;
    const list = Storage.listTickets(App.state.societyId);
    el.innerHTML = list.length ? list.map((t) => this.card(t, true)).join('') : '<p style="color:var(--text-muted)">No tickets yet.</p>';
    el.querySelectorAll('.btn-tkt-close').forEach((b) => {
      b.addEventListener('click', () => {
        Storage.updateTicket(App.state.societyId, b.closest('[data-id]').dataset.id, { status: 'closed' });
        this.renderAdmin(); this.renderResident();
      });
    });
  },
};
