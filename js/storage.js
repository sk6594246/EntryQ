/**
 * EntryQ Storage Layer
 * localStorage first — swap later for Cloudflare D1.
 * All society data scoped by societyId (strict sandbox).
 */

const STORAGE_PREFIX = 'entryq_';

const Storage = {
  _key(societyId, collection) {
    return `${STORAGE_PREFIX}${societyId}_${collection}`;
  },

  _read(societyId, collection) {
    try {
      const raw = localStorage.getItem(this._key(societyId, collection));
      return raw ? JSON.parse(raw) : [];
    } catch {
      return [];
    }
  },

  _write(societyId, collection, data) {
    localStorage.setItem(this._key(societyId, collection), JSON.stringify(data));
  },

  listSocieties() {
    try {
      const raw = localStorage.getItem(STORAGE_PREFIX + 'societies');
      return raw ? JSON.parse(raw) : [];
    } catch {
      return [];
    }
  },

  saveSocieties(list) {
    localStorage.setItem(STORAGE_PREFIX + 'societies', JSON.stringify(list));
  },

  createSociety(name) {
    const list = this.listSocieties();
    const id = 'soc_' + Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
    const society = { id, name: name.trim(), createdAt: new Date().toISOString() };
    list.push(society);
    this.saveSocieties(list);
    return society;
  },

  getSociety(id) {
    return this.listSocieties().find((s) => s.id === id) || null;
  },

  listPeople(societyId) {
    return this._read(societyId, 'people');
  },

  createPerson(societyId, payload) {
    const people = this.listPeople(societyId);
    const person = {
      id: 'ppl_' + Date.now().toString(36) + Math.random().toString(36).slice(2, 5),
      societyId,
      name: (payload.name || '').trim(),
      phone: (payload.phone || '').trim(),
      unit: (payload.unit || '').trim(),
      role: payload.role || 'tenant',
      pin: String(payload.pin || '').trim(),
      createdAt: new Date().toISOString(),
    };
    people.unshift(person);
    this._write(societyId, 'people', people);
    return person;
  },

  updatePerson(societyId, personId, patch) {
    const people = this.listPeople(societyId);
    const p = people.find((x) => x.id === personId);
    if (!p) return null;
    if (patch.name !== undefined) p.name = String(patch.name).trim();
    if (patch.phone !== undefined) p.phone = String(patch.phone).trim();
    if (patch.unit !== undefined) p.unit = String(patch.unit).trim();
    if (patch.role !== undefined) p.role = patch.role;
    if (patch.pin !== undefined) p.pin = String(patch.pin).trim();
    this._write(societyId, 'people', people);
    return p;
  },

  removePerson(societyId, personId) {
    const people = this.listPeople(societyId).filter((x) => x.id !== personId);
    this._write(societyId, 'people', people);
  },

  countByRole(societyId, role) {
    return this.listPeople(societyId).filter((p) => p.role === role).length;
  },

  findByPin(societyId, pin, roles) {
    const code = String(pin || '').trim();
    if (!code) return null;
    const allowed = Array.isArray(roles) ? roles : [roles];
    return (
      this.listPeople(societyId).find(
        (p) => p.pin === code && allowed.includes(p.role)
      ) || null
    );
  },

  listInvites(societyId) {
    return this._read(societyId, 'invites');
  },

  createInvite(societyId, payload) {
    const invites = this.listInvites(societyId);
    const code = this._generateOTP();
    const invite = {
      id: 'inv_' + Date.now().toString(36),
      societyId,
      code,
      guestName: payload.guestName,
      guestPhone: payload.guestPhone || '',
      unit: payload.unit,
      validFrom: payload.validFrom,
      validUntil: payload.validUntil,
      maxEntries: Number(payload.maxEntries) || 1,
      usedCount: 0,
      createdAt: new Date().toISOString(),
      createdBy: payload.createdBy || 'resident',
    };
    invites.unshift(invite);
    this._write(societyId, 'invites', invites);
    return invite;
  },

  findInviteByCode(societyId, code) {
    const normalized = String(code).trim().toUpperCase();
    return this.listInvites(societyId).find((i) => i.code === normalized) || null;
  },

  markInviteUsed(societyId, inviteId) {
    const invites = this.listInvites(societyId);
    const inv = invites.find((i) => i.id === inviteId);
    if (!inv) return null;
    inv.usedCount = (inv.usedCount || 0) + 1;
    this._write(societyId, 'invites', invites);
    return inv;
  },

  listLogs(societyId) {
    return this._read(societyId, 'logs');
  },

  addLog(societyId, entry) {
    const logs = this.listLogs(societyId);
    const log = {
      id: 'log_' + Date.now().toString(36),
      societyId,
      ...entry,
      timestamp: new Date().toISOString(),
    };
    logs.unshift(log);
    if (logs.length > 500) logs.length = 500;
    this._write(societyId, 'logs', logs);
    return log;
  },

  todayLogs(societyId) {
    const today = new Date().toISOString().slice(0, 10);
    return this.listLogs(societyId).filter((l) => l.timestamp.startsWith(today));
  },

  _generateOTP() {
    return String(Math.floor(100000 + Math.random() * 900000));
  },

  exportSociety(societyId) {
    return {
      society: this.getSociety(societyId),
      people: this.listPeople(societyId),
      invites: this.listInvites(societyId),
      logs: this.listLogs(societyId),
      exportedAt: new Date().toISOString(),
    };
  },

  clearSocietyData(societyId) {
    localStorage.removeItem(this._key(societyId, 'invites'));
    localStorage.removeItem(this._key(societyId, 'logs'));
    localStorage.removeItem(this._key(societyId, 'people'));
  },
};
