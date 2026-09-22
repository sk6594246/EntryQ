/**
 * EntryQ – Boot / Society selection
 * Depends on: Storage, App (state + showView)
 */

const Boot = {
  bind() {
    document.getElementById('btn-new-society').addEventListener('click', () => {
      const name = prompt('Society / Complex name:');
      if (!name || !name.trim()) return;
      const soc = Storage.createSociety(name);
      localStorage.setItem('entryq_last_society', soc.id);
      this.renderSocietyList();
      this.selectSociety(soc.id);
    });
  },

  renderSocietyList() {
    const list = Storage.listSocieties();
    const el = document.getElementById('society-list');
    if (!list.length) {
      el.innerHTML = '<p style="color:var(--text-muted)">No societies yet. Create one to start.</p>';
      return;
    }
    el.innerHTML = list
      .map(
        (s) => `
      <button class="society-item" data-id="${s.id}">
        <strong>${escapeHtml(s.name)}</strong>
        <span>Created ${new Date(s.createdAt).toLocaleDateString()}</span>
      </button>`
      )
      .join('');
    el.querySelectorAll('.society-item').forEach((btn) => {
      btn.addEventListener('click', () => this.selectSociety(btn.dataset.id));
    });
  },

  selectSociety(id) {
    const soc = Storage.getSociety(id);
    if (!soc) return;
    App.state.societyId = id;
    App.state.societyName = soc.name;
    localStorage.setItem('entryq_last_society', id);
    document.getElementById('society-name-label').textContent = soc.name;
    App.showView('role');
  },
};
