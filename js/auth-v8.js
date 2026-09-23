const Auth = {
  pendingRole: null,
  bind() {
    const form = document.getElementById('pin-form');
    if (!form) return;
    form.addEventListener('submit', (e) => { e.preventDefault(); this.submitPin(form); });
    document.getElementById('btn-cancel-pin')?.addEventListener('click', () => this.closeModal());
  },
  openForRole(uiRole) {
    this.pendingRole = uiRole;
    const title = document.getElementById('pin-modal-title');
    const hint = document.getElementById('pin-modal-hint');
    if (uiRole === 'guard') {
      title.textContent = 'Watchmen login';
      hint.textContent = 'Select unit (or Gate) and enter your PIN.';
    } else {
      title.textContent = 'Owner / Tenant login';
      hint.textContent = 'Select your flat and enter PIN.';
    }
    this.fillUnitSelect(uiRole);
    document.getElementById('pin-form').reset();
    document.getElementById('pin-error').classList.add('hidden');
    document.getElementById('modal-pin').classList.remove('hidden');
    setTimeout(() => document.getElementById('pin-input')?.focus(), 50);
  },
  fillUnitSelect(uiRole) {
    const sel = document.getElementById('pin-unit');
    if (!sel) return;
    let units = Storage.listUnits(App.state.societyId);
    if (uiRole === 'guard' && !units.includes('Gate')) units = ['Gate', ...units];
    if (!units.length) units = ['Gate', 'A-101'];
    sel.innerHTML = units.map((u) => '<option value="' + escapeHtml(u) + '">' + escapeHtml(u) + '</option>').join('');
  },
  closeModal() {
    document.getElementById('modal-pin')?.classList.add('hidden');
    this.pendingRole = null;
  },
  submitPin(form) {
    const pin = form.pin.value.trim();
    const unit = (form.unit && form.unit.value) || document.getElementById('pin-unit')?.value || '';
    const err = document.getElementById('pin-error');
    if (!unit) { err.textContent = 'Select unit / flat'; err.classList.remove('hidden'); return; }
    if (!pin) { err.textContent = 'Enter PIN'; err.classList.remove('hidden'); return; }
    const sid = App.state.societyId;
    let person = null;
    if (this.pendingRole === 'guard') person = Storage.findByUnitPin(sid, unit, pin, ['watchmen']);
    else if (this.pendingRole === 'resident') person = Storage.findByUnitPin(sid, unit, pin, ['owner', 'tenant']);
    if (!person) { err.textContent = 'Invalid unit or PIN for this role'; err.classList.remove('hidden'); return; }
    const role = this.pendingRole;
    App.state.person = person;
    App.state.role = role;
    this.closeModal();
    if (role === 'guard') Guard.enter();
    else if (role === 'resident') Resident.enter();
  },
};
