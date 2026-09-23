const App = {
  state: { societyId: null, societyName: '', role: null, person: null },
  init() {
    Boot.bind();
    this.bindRole();
    Auth.bind();
    Guard.bind();
    Resident.bind();
    People.bind();
    Admin.bind();
    Approvals.bind();
    Notices.bind();
    Amenities.bind();
    Tickets.bind();
    Bus.init();
    Bus.on((msg) => {
      if (msg.type === 'approval') {
        Approvals.renderResident();
        Approvals.renderGuardPending();
      }
      if (msg.type === 'notice') Notices.renderResident();
    });
    Boot.renderSocietyList();
    this.startClock();
    if (typeof Microsite !== 'undefined') Microsite.boot();
  },
  bindRole() {
    document.getElementById('btn-back-boot')?.addEventListener('click', () => {
      if (typeof Microsite !== 'undefined' && Microsite.parseId()) {
        this.state.person = null;
        this.state.role = null;
        this.showView('role');
        return;
      }
      this.state.societyId = null;
      this.state.person = null;
      this.state.role = null;
      this.showView('boot');
    });
    document.querySelectorAll('.role-card').forEach((card) => {
      card.addEventListener('click', () => {
        const uiRole = card.dataset.role;
        if (uiRole === 'admin') {
          this.state.role = 'admin';
          this.state.person = null;
          Admin.enter();
        } else if (uiRole === 'guard' || uiRole === 'resident') {
          Auth.openForRole(uiRole);
        }
      });
    });
  },
  showView(name) {
    document.querySelectorAll('.view').forEach((v) => v.classList.remove('active'));
    document.getElementById('view-' + name)?.classList.add('active');
  },
  startClock() {
    const el = document.getElementById('kiosk-clock');
    if (!el) return;
    const tick = () => {
      el.textContent = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
    };
    tick();
    setInterval(tick, 1000);
  },
};
document.addEventListener('DOMContentLoaded', () => App.init());
