/**
 * EntryQ – Society Admin: people management
 * Roles: society_admin | owner | tenant | watchmen
 * Depends on: Storage, App, escapeHtml
 */

const ROLE_LABELS = {
  society_admin: 'Society Admin',
  owner: 'Owner',
  tenant: 'Tenant',
  watchmen: 'Watchmen',
};

const People = {
  bind() {
    const form = document.getElementById('person-form');
    if (!form) return;

    form.addEventListener('submit', (e) => {
      e.preventDefault();
      this.savePerson(e.target);
    });

    document.getElementById('btn-cancel-person')?.addEventListener('click', () => {
      document.getElementById('modal-person').classList.add('hidden');
    });

    document.getElementById('btn-add-person')?.addEventListener('click', () => {
      this.openModal();
    });
  },

  openModal(person) {
    const modal = document.getElementById('modal-person');
    const form = document.getElementById('person-form');
    form.reset();
    form.dataset.editId = person ? person.id : '';
    document.getElementById('person-modal-title').textContent = person
      ? 'Edit Person'
      : 'Add Person';
    if (person) {
      form.name.value = person.name || '';
      form.phone.value = person.phone || '';
      form.unit.value = person.unit || '';
      form.role.value = person.role || 'tenant';
    } else {
      form.role.value = 'tenant';
    }
    modal.classList.remove('hidden');
  },

  savePerson(form) {
    const fd = new FormData(form);
    const payload = {
      name: fd.get('name'),
      phone: fd.get('phone'),
      unit: fd.get('unit'),
      role: fd.get('role'),
    };
    if (!payload.name || !String(payload.name).trim()) {
      alert('Name is required');
      return;
    }
    const editId = form.dataset.editId;
    if (editId) {
      Storage.updatePerson(App.state.societyId, editId, payload);
    } else {
      Storage.createPerson(App.state.societyId, payload);
    }
    document.getElementById('modal-person').classList.add('hidden');
    this.renderList();
    Admin.renderStats?.();
  },

  renderList() {
    const el = document.getElementById('people-list');
    if (!el) return;
    const people = Storage.listPeople(App.state.societyId);
    if (!people.length) {
      el.innerHTML =
        '<p style="color:var(--text-muted)">No people yet. Add Society Admin, Owner, Tenant or Watchmen.</p>';
      return;
    }
    el.innerHTML = people
      .map(
        (p) => `
      <div class="person-card" data-id="${p.id}">
        <div class="person-main">
          <strong>${escapeHtml(p.name)}</strong>
          <span class="badge badge-role">${ROLE_LABELS[p.role] || p.role}</span>
        </div>
        <div class="meta">
          <span>${escapeHtml(p.unit || '—')}</span>
          <span>${escapeHtml(p.phone || '—')}</span>
        </div>
        <div class="person-actions">
          <button type="button" class="btn btn-ghost btn-sm btn-edit-person">Edit</button>
          <button type="button" class="btn btn-danger btn-sm btn-del-person">Remove</button>
        </div>
      </div>`
      )
      .join('');

    el.querySelectorAll('.btn-edit-person').forEach((btn) => {
      btn.addEventListener('click', () => {
        const id = btn.closest('.person-card').dataset.id;
        const person = Storage.listPeople(App.state.societyId).find((x) => x.id === id);
        if (person) this.openModal(person);
      });
    });
    el.querySelectorAll('.btn-del-person').forEach((btn) => {
      btn.addEventListener('click', () => {
        const id = btn.closest('.person-card').dataset.id;
        if (confirm('Remove this person?')) {
          Storage.removePerson(App.state.societyId, id);
          this.renderList();
          Admin.renderStats?.();
        }
      });
    });
  },
};
