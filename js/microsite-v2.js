/** EntryQ microsite v2 — 7 floors x 6 flats x 2 people */
function buildJesalPeople() {
  const people = [];
  const first = ['Aarav','Vihaan','Aditya','Arjun','Sai','Reyansh','Ananya','Aadhya','Diya','Myra','Ira','Kiara'];
  const last = ['Sharma','Patel','Singh','Mehta','Joshi','Nair','Kapoor','Desai','Iyer','Reddy','Khan','Gupta'];
  let n = 0;
  for (let floor = 1; floor <= 7; floor++) {
    for (let flat = 1; flat <= 6; flat++) {
      const unit = String(floor) + String(flat).padStart(2, '0');
      const pinOwner = unit + '1';
      const pinTenant = unit + '2';
      const phoneOwner = '98' + String(10000000 + floor * 100 + flat).slice(-8);
      const phoneTenant = '97' + String(10000000 + floor * 100 + flat).slice(-8);
      const oName = first[n % first.length] + ' ' + last[n % last.length]; n++;
      const tName = first[n % first.length] + ' ' + last[n % last.length]; n++;
      people.push({ name: oName, unit, role: 'owner', pin: pinOwner, phone: phoneOwner });
      people.push({ name: tName, unit, role: 'tenant', pin: pinTenant, phone: phoneTenant });
    }
  }
  people.push({ name: 'Watchmen Demo', unit: 'Gate', role: 'watchmen', pin: '1234', phone: '9800000001' });
  people.push({ name: 'Society Admin', unit: 'Office', role: 'society_admin', pin: '9999', phone: '9800000002' });
  return people;
}
const MICRO_DEMO = { id: 'soc_jesal_melody', name: 'Jesal Melody', seedVersion: 2 };
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
    if (sid === MICRO_DEMO.id) {
      const verKey = 'entryq_' + sid + '_seed_v';
      const cur = localStorage.getItem(verKey);
      const people = Storage.listPeople(sid);
      const need = 7 * 6 * 2 + 2;
      if (cur !== String(MICRO_DEMO.seedVersion) || people.length < need) {
        Storage._write(sid, 'people', []);
        buildJesalPeople().forEach((p) => Storage.createPerson(sid, p));
        localStorage.setItem(verKey, String(MICRO_DEMO.seedVersion));
      }
    } else if (!Storage.listPeople(sid).length) {
      Storage.createPerson(sid, { name: 'Watchmen', unit: 'Gate', role: 'watchmen', pin: '1234', phone: '' });
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
