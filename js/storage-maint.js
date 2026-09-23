/** Maintenance fields on notices */
Storage.createNotice = function (sid, payload) {
  const list = this.listNotices(sid);
  const rec = {
    id: 'ntc_' + Date.now().toString(36),
    societyId: sid,
    title: payload.title,
    body: payload.body || '',
    priority: payload.priority || 'normal',
    kind: payload.kind || 'notice',
    payLink: payload.payLink || '',
    amount: payload.amount || '',
    dueDate: payload.dueDate || '',
    createdAt: new Date().toISOString(),
    createdBy: payload.createdBy || 'admin',
  };
  list.unshift(rec);
  this._write(sid, 'notices', list);
  return rec;
};
