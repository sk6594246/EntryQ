/** Notices v2 — maintenance pay-link broadcast */
const Notices = {
  bind() {
    const form = document.getElementById('notice-form');
    if (!form) return;
    form.addEventListener('submit', (e) => {
      e.preventDefault();
      const fd = new FormData(e.target);
      const title = String(fd.get('title') || '').trim();
      if (!title) return;
      const payLink = String(fd.get('payLink') || '').trim();
      const amount = String(fd.get('amount') || '').trim();
      const dueDate = String(fd.get('dueDate') || '').trim();
      const kind = fd.get('kind') || 'notice';
      Storage.createNotice(App.state.societyId, {
        title,
        body: String(fd.get('body') || '').trim(),
        priority: fd.get('priority') || (kind === 'maintenance' ? 'high' : 'normal'),
        kind,
        payLink,
        amount,
        dueDate,
        createdBy: App.state.person?.name || 'admin',
      });
      e.target.reset();
      const kindSel = form.querySelector('[name="kind"]');
      if (kindSel) kindSel.value = 'notice';
      this.toggleMaintFields();
      if (typeof Bus !== 'undefined') Bus.emit('notice', {});
      this.renderAdmin();
      this.renderResident();
    });
    form.querySelector('[name="kind"]')?.addEventListener('change', () => this.toggleMaintFields());
    this.toggleMaintFields();
  },
  toggleMaintFields() {
    const form = document.getElementById('notice-form');
    if (!form) return;
    const kind = form.querySelector('[name="kind"]')?.value;
    const box = document.getElementById('maint-fields');
    if (box) box.style.display = kind === 'maintenance' ? 'block' : 'none';
  },
  renderList(el, forResident) {
    if (!el) return;
    const list = Storage.listNotices(App.state.societyId);
    if (!list.length) {
      el.innerHTML = '<p style="color:var(--text-muted)">No notices yet.</p>';
      return;
    }
    el.innerHTML = list.map((n) => {
      const isMaint = n.kind === 'maintenance' || !!n.payLink;
      const pri = n.priority === 'emergency' ? 'badge-expired' : (n.priority === 'high' || isMaint) ? 'badge-used' : 'badge-active';
      const badge = isMaint ? 'Maintenance' : escapeHtml(n.priority || 'normal');
      let extra = '';
      if (n.amount) extra += '<span>\u20b9' + escapeHtml(n.amount) + '</span>';
      if (n.dueDate) extra += '<span>Due ' + escapeHtml(n.dueDate) + '</span>';
      let payBtn = '';
      if (forResident && n.payLink) {
        payBtn = '<a class="btn btn-primary btn-block" href="' + escapeHtml(n.payLink) + '" target="_blank" rel="noopener">Pay maintenance</a>';
      } else if (!forResident && n.payLink) {
        payBtn = '<div class="meta"><span>Link set</span></div>';
      }
      return '<div class="log-card' + (isMaint ? ' maint-card' : '') + '"><div class="person-main"><strong>' + escapeHtml(n.title) + '</strong><span class="badge ' + pri + '">' + badge + '</span></div>' + (n.body ? '<p>' + escapeHtml(n.body) + '</p>' : '') + '<div class="meta"><span>' + new Date(n.createdAt).toLocaleString() + '</span>' + extra + '</div>' + payBtn + '</div>';
    }).join('');
  },
  renderAdmin() { this.renderList(document.getElementById('admin-notice-list'), false); },
  renderResident() { this.renderList(document.getElementById('res-notice-list'), true); },
};
