Storage.createSociety = function (name, fixedId) {
  const list = this.listSocieties();
  const id = fixedId || 'soc_' + Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
  const found = list.find((s) => s.id === id);
  if (found) return found;
  const society = { id, name: String(name || '').trim(), createdAt: new Date().toISOString() };
  list.push(society);
  this.saveSocieties(list);
  return society;
};
Storage.ensureSociety = function (id, name) {
  return this.getSociety(id) || this.createSociety(name || id, id);
};
Storage.listUnits = function (societyId) {
  const set = new Set();
  this.listPeople(societyId).forEach((p) => {
    if (p.unit && String(p.unit).trim()) set.add(String(p.unit).trim());
  });
  return Array.from(set).sort();
};
Storage.isPinTakenInUnit = function (societyId, unit, pin, excludePersonId) {
  const code = String(pin || '').trim();
  const u = String(unit || '').trim();
  if (!code) return false;
  return this.listPeople(societyId).some(
    (p) =>
      p.id !== excludePersonId &&
      String(p.pin || '').trim() === code &&
      String(p.unit || '').trim() === u
  );
};
Storage.findByUnitPin = function (societyId, unit, pin, roles) {
  const code = String(pin || '').trim();
  const u = String(unit || '').trim();
  if (!code || !u) return null;
  const allowed = Array.isArray(roles) ? roles : [roles];
  return (
    this.listPeople(societyId).find(
      (p) =>
        String(p.pin || '').trim() === code &&
        String(p.unit || '').trim() === u &&
        allowed.includes(p.role)
    ) || null
  );
};
