/**
 * EntryQ – Core app shell
 * Modules: utils → storage → boot → guard → resident → people → admin → app
 */

const App = {
  state: {
    societyId: null,
    societyName: '',
    role: null,
  },

  init() {
    Boot.bind();
    this.bindRole();
    Guard.bind();
    Resident.bind();
    People.bind();
    Admin.bind();
    Boot.renderSocietyList();
    this.startClock();
  },

  bindRole() {
    document.getElementById('btn-back-boot')?.addEventListener('click', () => {
      this.state.societyId = null;
      this.showView('boot');
    });
    document.querySelectorAll('.role-card').forEach((card) => {
      card.addEventListener('click', () => {
        this.state.role = card.dataset.role;
        if (this.state.role === 'guard') Guard.enter();
        else if (this.state.role === 'resident') Resident.enter();
        else if (this.state.role === 'admin') Admin.enter();
      });
    });
  },

  showView(name) {
    document.querySelectorAll('.view').forEach((v) => v.classList.remove('active'));
    const el = document.getElementById('view-' + name);
    if (el) el.classList.add('active');
  },

  startClock() {
    const el = document.getElementById('kiosk-clock');
    if (!el) return;
    const tick = () => {
      el.textContent = new Date().toLocaleTimeString([], {
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
      });
    };
    tick();
    setInterval(tick, 1000);
  },
};

document.addEventListener('DOMContentLoaded', () => App.init());
