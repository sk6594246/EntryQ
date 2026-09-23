const Resident = {
  enter() {
    App.showView('resident');
    this.switchTab('passes');
    this.renderMyInvites();
    Approvals.renderResident();
    Notices.renderResident();
    Amenities.render();
    Tickets.renderResident();
  },
  bind() {
    document.getElementById('btn-res-back').addEventListener('click', () => App.showView('role'));
    document.getElementById('btn-res-exit').addEventListener('click', () => App.showView('role'));
    document.querySelectorAll('.res-tabs .tab').forEach((tab) => {
      tab.addEventListener('click', () => this.switchTab(tab.dataset.tab));
    });
    document.getElementById('btn-new-invite').addEventListener('click', () => {
      document.getElementById('modal-invite').classList.remove('hidden');
      const now = new Date();
      const later = new Date(now.getTime() + 4 * 60 * 60 * 1000);
      document.querySelector('#invite-form [name=validFrom]').value = toLocalInput(now);
      document.querySelector('#invite-form [name=validUntil]').value = toLocalInput(later);
    });
    document.getElementById('btn-cancel-invite').addEventListener('click', () => {
      document.getElementById('modal-invite').classList.add('hidden');
    });
    document.getElementById('invite-form').addEventListener('submit', (e) => {
      e.preventDefault(); this.createInvite(e.target);
    });
  },
  switchTab(name) {
    document.querySelectorAll('.res-tabs .tab').forEach((t) => t.classList.toggle('active', t.dataset.tab === name));
    document.querySelectorAll('#view-resident .tab-panel').forEach((p) => p.classList.remove('active'));
    document.getElementById('res-' + name)?.classList.add('active');
    if (name === 'approvals') Approvals.renderResident();
    if (name === 'notices') Notices.renderResident();
    if (name === 'amenities') Amenities.render();
    if (name === 'tickets') Tickets.renderResident();
  },
  createInvite(form) {
    const fd = new FormData(form);
    const invite = Storage.createInvite(App.state.societyId, {
      guestName: fd.get('guestName').trim(),
      guestPhone: fd.get('guestPhone').trim(),
      unit: fd.get('unit').trim() || (App.state.person && App.state.person.unit) || '',
      validFrom: new Date(fd.get('validFrom')).toISOString(),
      validUntil: new Date(fd.get('validUntil')).toISOString(),
      maxEntries: fd.get('maxEntries'),
      createdBy: (App.state.person && App.state.person.name) || 'resident',
      passType: fd.get('passType') || 'guest',
    });
    document.getElementById('modal-invite').classList.add('hidden');
    form.reset(); this.renderMyInvites();
    alert('Pass created!\n\nCode: ' + invite.code);
  },
  renderMyInvites() {
    const invites = Storage.listInvites(App.state.societyId);
    const el = document.getElementById('my-invites');
    if (!invites.length) { el.innerHTML = '<p style="color:var(--text-muted)">No passes yet.</p>'; return; }
    const now = new Date();
    el.innerHTML = invites.map((inv) => {
      const until = new Date(inv.validUntil);
      const expired = now > until;
      const usedUp = inv.usedCount >= inv.maxEntries;
      let badge = '<span class="badge badge-active">Active</span>';
      if (expired) badge = '<span class="badge badge-expired">Expired</span>';
      else if (usedUp) badge = '<span class="badge badge-used">Used up</span>';
      return '<div class="invite-card"><div style="display:flex;justify-content:space-between"><strong>' + escapeHtml(inv.guestName) + '</strong>' + badge + '</div><div class="code">' + inv.code + '</div><div class="meta"><span>' + escapeHtml(inv.passType || 'guest') + '</span><span>Unit ' + escapeHtml(inv.unit) + '</span><span>' + inv.usedCount + '/' + inv.maxEntries + '</span></div></div>';
    }).join('');
  },
};
