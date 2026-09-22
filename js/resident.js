/**
 * EntryQ – Resident module
 * Depends on: Storage, App, escapeHtml, toLocalInput
 */

const Resident = {
  enter() {
    App.showView('resident');
    this.renderMyInvites();
  },

  bind() {
    document.getElementById('btn-res-back').addEventListener('click', () => App.showView('role'));
    document.getElementById('btn-res-exit').addEventListener('click', () => App.showView('role'));

    document.getElementById('btn-new-invite').addEventListener('click', () => {
      const modal = document.getElementById('modal-invite');
      modal.classList.remove('hidden');
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
    const invite = Storage.createInvite(App.state.societyId, {
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
    const invites = Storage.listInvites(App.state.societyId);
    const el = document.getElementById('my-invites');
    if (!invites.length) {
      el.innerHTML =
        '<p style="color:var(--text-muted);margin-top:1.5rem">No passes yet. Create one for your guests.</p>';
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
};
