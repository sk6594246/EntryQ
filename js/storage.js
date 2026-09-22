/**
 * EntryQ Storage Layer
 * localStorage first — designed so it can later be swapped for Cloudflare D1 API calls.
 * All records are scoped by societyId (multi-tenant SaaS ready).
 */

const STORAGE_PREFIX = 'entryq_';

const Storage = {
  // ---------- low-level ----------
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

  // ---------- societies (global) ----------
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
    const society = {
      id,
      name: name.trim(),
      createdAt: new Date().toISOString(),
    };
    list.push(society);
    this.saveSocieties(list);
    return society;
  },

  getSociety(id) {
    return this.listSocieties().find((s) => s.id === id) || null;
  },

  // ---------- Access Invites (passes / OTP) ----------
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

  // ---------- Gate Entry Logs ----------
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
    // keep last 500
    if (logs.length > 500) logs.length = 500;
    this._write(societyId, 'logs', logs);
    return log;
  },

  todayLogs(societyId) {
    const today = new Date().toISOString().slice(0, 10);
    return this.listLogs(societyId).filter((l) => l.timestamp.startsWith(today));
  },

  // ---------- helpers ----------
  _generateOTP() {
    // 6-digit numeric, easy to type / speak at gate
    return String(Math.floor(100000 + Math.random() * 900000));
  },

  exportSociety(societyId) {
    return {
      society: this.getSociety(societyId),
      invites: this.listInvites(societyId),
      logs: this.listLogs(societyId),
      exportedAt: new Date().toISOString(),
    };
  },

  clearSocietyData(societyId) {
    localStorage.removeItem(this._key(societyId, 'invites'));
    localStorage.removeItem(this._key(societyId, 'logs'));
  },
};

// Future D1 adapter sketch (do not use yet):
// const D1Adapter = { async listInvites(societyId) { return fetch(`/api/${societyId}/invites`).then(r => r.json()) } ... }
