/** EntryQ Boot v2 — microsite has no create; one society max on device */
const Boot = {
  bind() {
    const btn = document.getElementById('btn-new-society');
    if (btn) {
      btn.addEventListener('click', () => {
        if (Storage.listSocieties().length >= 1) {
          alert('This device already has a society. Open its microsite link (?s=id).');
          return;
        }
        const name = prompt('Society / Complex name:');
        if (!name || !name.trim()) return;
        const soc = Storage.createSociety(name);
        localStorage.setItem('entryq_last_society', soc.id);
        this.renderSocietyList();
        this.selectSociety(soc.id);
      });
    }
  },
  isMicrosite() {
    return typeof Microsite !== 'undefined' && !!Microsite.parseId();
  },
  renderSocietyList() {
    const list = Storage.listSocieties();
    const el = document.getElementById('society-list');
    const btn = document.getElementById('btn-new-society');
    const bootCard = document.querySelector('.boot-card');
    if (this.isMicrosite()) {
      if (el) el.innerHTML = '';
      if (btn) btn.style.display = 'none';
      return;
    }
    if (btn) btn.style.display = list.length >= 1 ? 'none' : '';
    if (!el) return;
    if (!list.length) {
      el.innerHTML = '<p style="color:var(--text-muted)">No society yet. Create once — then use the microsite link.</p>';
      return;
    }
    el.innerHTML = list.map((s) =>
      `<button type="button" class="society-item" data-id="${s.id}"><strong>${escapeHtml(s.name)}</strong><span>Microsite · ?s=${escapeHtml(s.id)}</span></button>`
    ).join('');
    el.querySelectorAll('.society-item').forEach((b) => {
      b.addEventListener('click', () => this.selectSociety(b.dataset.id));
    });
    if (bootCard && list[0]) {
      let hint = document.getElementById('microsite-hint');
      if (!hint) {
        hint = document.createElement('p');
        hint.id = 'microsite-hint';
        hint.style.cssText = 'color:var(--text-muted);font-size:0.85rem;margin-top:1rem';
        bootCard.appendChild(hint);
      }
      const url = location.href.split('?')[0].split('#')[0] + '?s=' + encodeURIComponent(list[0].id);
      hint.innerHTML = 'Share / install microsite:<br><code style="color:#93c5fd;word-break:break-all">' + escapeHtml(url) + '</code>';
    }
  },
  selectSociety(id) {
    const soc = Storage.getSociety(id);
    if (!soc) return;
    App.state.societyId = id;
    App.state.societyName = soc.name;
    localStorage.setItem('entryq_last_society', id);
    const label = document.getElementById('society-name-label');
    if (label) label.textContent = soc.name;
    App.showView('role');
  },
};
