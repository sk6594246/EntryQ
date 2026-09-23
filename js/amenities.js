/** Feature #5 – Amenity booking + deposit */
const Amenities = {
  bind() {
    document.getElementById('booking-form')?.addEventListener('submit', (e) => {
      e.preventDefault();
      const fd = new FormData(e.target);
      const amenity = Storage.listAmenities(App.state.societyId).find((a) => a.id === fd.get('amenityId'));
      if (!amenity) return;
      Storage.createBooking(App.state.societyId, {
        amenityId: amenity.id,
        amenityName: amenity.name,
        unit: fd.get('unit') || App.state.person?.unit || '',
        slotStart: fd.get('slotStart'),
        slotEnd: fd.get('slotEnd'),
        deposit: amenity.deposit,
        createdBy: App.state.person?.name || '',
      });
      e.target.reset();
      this.render();
      alert('Booked ' + amenity.name + '. Deposit \u20B9' + amenity.deposit);
    });
  },
  fillSelect() {
    const sel = document.getElementById('amenity-select');
    if (!sel) return;
    sel.innerHTML = Storage.listAmenities(App.state.societyId)
      .map((a) => '<option value="' + a.id + '">' + escapeHtml(a.name) + ' (\u20B9' + a.deposit + ')</option>')
      .join('');
  },
  render() {
    this.fillSelect();
    const el = document.getElementById('booking-list');
    if (!el) return;
    const list = Storage.listBookings(App.state.societyId);
    el.innerHTML = list.length ? list.map((b) =>
      '<div class="log-card"><strong>' + escapeHtml(b.amenityName) + '</strong><div class="meta"><span>Unit ' + escapeHtml(b.unit || '—') + '</span><span>' + escapeHtml(b.slotStart) + ' → ' + escapeHtml(b.slotEnd) + '</span><span>Deposit \u20B9' + b.deposit + '</span><span class="badge badge-active">' + b.status + '</span></div></div>'
    ).join('') : '<p style="color:var(--text-muted)">No bookings yet.</p>';
  },
};
