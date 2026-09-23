Storage.listApprovals = function (sid) { return this._read(sid, 'approvals'); };
Storage.createApproval = function (sid, payload) {
  const list = this.listApprovals(sid);
  const rec = {
    id: 'apr_' + Date.now().toString(36), societyId: sid, status: 'pending',
    visitorName: payload.visitorName, phone: payload.phone || '', unit: payload.unit,
    purpose: payload.purpose || 'Guest', vehicle: payload.vehicle || '', photo: payload.photo || '',
    type: payload.type || 'walkin', createdAt: new Date().toISOString(), decidedAt: null, decidedBy: null,
  };
  list.unshift(rec); this._write(sid, 'approvals', list); return rec;
};
Storage.updateApproval = function (sid, id, patch) {
  const list = this.listApprovals(sid);
  const rec = list.find((x) => x.id === id);
  if (!rec) return null;
  Object.assign(rec, patch); this._write(sid, 'approvals', list); return rec;
};
Storage.pendingApprovals = function (sid, unit) {
  return this.listApprovals(sid).filter((a) => a.status === 'pending' && (!unit || a.unit === unit));
};
Storage.listNotices = function (sid) { return this._read(sid, 'notices'); };
Storage.createNotice = function (sid, payload) {
  const list = this.listNotices(sid);
  const rec = { id: 'ntc_' + Date.now().toString(36), societyId: sid, title: payload.title, body: payload.body || '', priority: payload.priority || 'normal', createdAt: new Date().toISOString(), createdBy: payload.createdBy || 'admin' };
  list.unshift(rec); this._write(sid, 'notices', list); return rec;
};
Storage.listAmenities = function (sid) {
  let list = this._read(sid, 'amenities');
  if (!list.length) {
    list = [{ id: 'amn_club', name: 'Clubhouse', deposit: 500 }, { id: 'amn_court', name: 'Sports Court', deposit: 200 }, { id: 'amn_hall', name: 'Community Hall', deposit: 1000 }];
    this._write(sid, 'amenities', list);
  }
  return list;
};
Storage.listBookings = function (sid) { return this._read(sid, 'bookings'); };
Storage.createBooking = function (sid, payload) {
  const list = this.listBookings(sid);
  const rec = { id: 'bkg_' + Date.now().toString(36), societyId: sid, amenityId: payload.amenityId, amenityName: payload.amenityName, unit: payload.unit, slotStart: payload.slotStart, slotEnd: payload.slotEnd, deposit: Number(payload.deposit) || 0, status: 'confirmed', createdAt: new Date().toISOString(), createdBy: payload.createdBy || '' };
  list.unshift(rec); this._write(sid, 'bookings', list); return rec;
};
Storage.listTickets = function (sid) { return this._read(sid, 'tickets'); };
Storage.createTicket = function (sid, payload) {
  const list = this.listTickets(sid);
  const slaHours = Number(payload.slaHours) || 24;
  const rec = { id: 'tkt_' + Date.now().toString(36), societyId: sid, title: payload.title, detail: payload.detail || '', unit: payload.unit || '', photo: payload.photo || '', status: 'open', assignee: payload.assignee || 'maintenance', slaDue: new Date(Date.now() + slaHours * 3600 * 1000).toISOString(), createdAt: new Date().toISOString(), createdBy: payload.createdBy || '' };
  list.unshift(rec); this._write(sid, 'tickets', list); return rec;
};
Storage.updateTicket = function (sid, id, patch) {
  const list = this.listTickets(sid);
  const rec = list.find((x) => x.id === id);
  if (!rec) return null;
  Object.assign(rec, patch); this._write(sid, 'tickets', list); return rec;
};
const _export = Storage.exportSociety.bind(Storage);
Storage.exportSociety = function (sid) {
  return Object.assign(_export(sid), { approvals: this.listApprovals(sid), notices: this.listNotices(sid), amenities: this.listAmenities(sid), bookings: this.listBookings(sid), tickets: this.listTickets(sid) });
};
const _clear = Storage.clearSocietyData.bind(Storage);
Storage.clearSocietyData = function (sid) {
  _clear(sid);
  ['approvals','notices','amenities','bookings','tickets'].forEach((c) => localStorage.removeItem(this._key(sid, c)));
};
