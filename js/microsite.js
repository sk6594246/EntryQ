/** EntryQ microsite: ?s={societyId} */
const MICRO_DEMO = {
  id: 'soc_jesal_melody',
  name: 'Jesal Melody',
  people: [
    { name: 'Owner Demo', unit: 'A-101', role: 'owner', pin: '7872' },
    { name: 'Tenant Demo', unit: 'A-102', role: 'tenant', pin: '5656' },
    { name: 'Watchmen Demo', unit: 'Gate', role: 'watchmen', pin: '1234' },
    { name: 'Society Admin', unit: 'Office', role: 'society_admin', pin: '9999' },
  ],
};
const Microsite = {
  parseId() {
    try {
      const q = new URLSearchParams(location.search);
      return q.get('s') || q.get('society') || null;
    } catch { return null; }
  },
  ensureDemo(id) {
    const sid = id || MICRO_DEMO.id;
    const name = sid === MICRO_DEMO.id ? MICRO_DEMO.name : sid;
    Storage.ensureSociety(sid, name);
    if (!Storage.listPeople(sid).length) {
      MICRO_DEMO.people.forEach((p) => Storage.createPerson(sid, p));
    }
    return Storage.getSociety(sid);
  },
  boot() {
    const sid = this.parseId();
    if (!sid) return false;
    const soc = this.ensureDemo(sid);
    if (!soc) return false;
    App.state.societyId = soc.id;
    App.state.societyName = soc.name;
    localStorage.setItem('entryq_last_society', soc.id);
    const label = document.getElementById('society-name-label');
    if (label) label.textContent = soc.name;
    const back = document.getElementById('btn-back-boot');
    if (back) back.style.display = 'none';
    App.showView('role');
    return true;
  },
};
