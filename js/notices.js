/** Feature #4 – Digital notice board */
const Notices = {
  bind() {
    document.getElementById('notice-form')?.addEventListener('submit', (e) => {
      e.preventDefault();
      const fd = new FormData(e.target);
      Storage.createNotice(App.state.societyId, {
        title: fd.get('title'),
        body: fd.get('body'),
        priority: fd.get('priority'),
        createdBy: App.state.person?.name || 'admin',
      });
      e.target.reset();
      Bus.emit('notice', {});
      this.renderAdmin();
      this.renderResident();
    });
  },
  renderList(el) {
    if (!el) return;
    const list = Storage.listNotices(App.state.societyId);
    if (!list.length) {
      el.innerHTML = '<p style="color:var(--text-muted)">No notices yet.</p>';
      return;
    }
    el.innerHTML = list.map((n) => {
      const pri = n.priority === 'emergency' ? 'badge-expired' : n.priority === 'high' ? 'badge-used' : 'badge-active';
      return `<div class="log-card"><div class="person-main"><strong>${escapeHtml(n.title)}</strong><span class="badge ${pri}">${escapeHtml(n.priority)}</span></div><p>${escapeHtml(n.body)}</p><div class="meta"><span>${new Date(n.createdAt).toLocaleString()}</span></div></div>`;
    }).join('');
  },
  renderAdmin() { this.renderList(document.getElementById('admin-notice-list')); },
  renderResident() { this.renderList(document.getElementById('res-notice-list')); },
};
