/**
 * EntryQ – Society PIN login (v7 fix)
 * closeModal() clears pendingRole — capture role first.
 */

const Auth = {
  pendingRole: null,

  bind() {
    const form = document.getElementById('pin-form');
    if (!form) return;

    form.addEventListener('submit', (e) => {
      e.preventDefault();
      this.submitPin(form);
    });

    document.getElementById('btn-cancel-pin')?.addEventListener('click', () => {
      this.closeModal();
    });
  },

  openForRole(uiRole) {
    this.pendingRole = uiRole;
    const title = document.getElementById('pin-modal-title');
    const hint = document.getElementById('pin-modal-hint');
    if (uiRole === 'guard') {
      title.textContent = 'Watchmen login';
      hint.textContent = 'Enter your society PIN (set by Society Admin).';
    } else {
      title.textContent = 'Owner / Tenant login';
      hint.textContent = 'Enter your society PIN. Owners and tenants can invite visitors.';
    }
    const form = document.getElementById('pin-form');
    form.reset();
    document.getElementById('pin-error').classList.add('hidden');
    document.getElementById('modal-pin').classList.remove('hidden');
    setTimeout(() => document.getElementById('pin-input')?.focus(), 50);
  },

  closeModal() {
    document.getElementById('modal-pin')?.classList.add('hidden');
    this.pendingRole = null;
  },

  submitPin(form) {
    const pin = form.pin.value.trim();
    const err = document.getElementById('pin-error');
    if (!pin) {
      err.textContent = 'Enter PIN';
      err.classList.remove('hidden');
      return;
    }

    const sid = App.state.societyId;
    let person = null;
    if (this.pendingRole === 'guard') {
      person = Storage.findByPin(sid, pin, ['watchmen']);
    } else if (this.pendingRole === 'resident') {
      person = Storage.findByPin(sid, pin, ['owner', 'tenant']);
    }

    if (!person) {
      err.textContent = 'Invalid PIN for this role';
      err.classList.remove('hidden');
      return;
    }

    const role = this.pendingRole;
    App.state.person = person;
    App.state.role = role;
    this.closeModal();

    if (role === 'guard') Guard.enter();
    else if (role === 'resident') Resident.enter();
  },
};
