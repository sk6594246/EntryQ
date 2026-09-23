function readPhotoFile(input, cb) {
  const file = input && input.files && input.files[0];
  if (!file) { cb(''); return; }
  const reader = new FileReader();
  reader.onload = () => cb(String(reader.result || ''));
  reader.onerror = () => cb('');
  reader.readAsDataURL(file);
}
const Approvals = {
  bind() {
    document.getElementById('btn-refresh-approvals')?.addEventListener('click', () => this.renderResident());
  },
  renderResident() {
    const el = document.getElementById('approval-list');
    if (!el) return;
    const unit = App.state.person && App.state.person.unit;
    const pending = Storage.pendingApprovals(App.state.societyId, unit || undefined);
    if (!pending.length) { el.innerHTML = '<p style="color:var(--text-muted)">No pending gate requests.</p>'; return; }
    el.innerHTML = pending.map((a) =>
      '<div class="log-card" data-id="' + a.id + '">' +
      (a.photo ? '<img class="thumb" src="' + a.photo + '" alt="" />' : '') +
      '<strong>' + escapeHtml(a.visitorName) + '</strong><div class="meta"><span>' + escapeHtml(a.unit) + '</span><span>' + escapeHtml(a.purpose) + '</span></div>' +
      '<div class="person-actions"><button type="button" class="btn btn-success btn-sm btn-apr-ok">Allow</button><button type="button" class="btn btn-danger btn-sm btn-apr-no">Deny</button></div></div>'
    ).join('');
    el.querySelectorAll('.btn-apr-ok').forEach((b) => b.addEventListener('click', () => this.decide(b.closest('[data-id]').dataset.id, 'allowed')));
    el.querySelectorAll('.btn-apr-no').forEach((b) => b.addEventListener('click', () => this.decide(b.closest('[data-id]').dataset.id, 'denied')));
  },
  decide(id, status) {
    const rec = Storage.updateApproval(App.state.societyId, id, { status, decidedAt: new Date().toISOString(), decidedBy: (App.state.person && App.state.person.name) || 'resident' });
    if (rec && status === 'allowed') {
      Storage.addLog(App.state.societyId, { type: rec.type, visitorName: rec.visitorName, phone: rec.phone, unit: rec.unit, purpose: rec.purpose, vehicle: rec.vehicle, photo: rec.photo, status: 'allowed' });
    }
    Bus.emit('approval', { id, status });
    this.renderResident();
  },
  renderGuardPending() {
    const el = document.getElementById('guard-pending-list');
    if (!el) return;
    const pending = Storage.pendingApprovals(App.state.societyId);
    el.innerHTML = pending.length ? pending.map((a) => '<div class="log-card"><strong>' + escapeHtml(a.visitorName) + '</strong><div class="meta"><span>' + escapeHtml(a.unit) + '</span><span class="badge badge-used">' + a.status + '</span></div></div>').join('') : '<p style="color:var(--text-muted)">No pending approvals.</p>';
  },
};
