/**
 * EntryQ – Core app shell
 * Loads modules: utils → storage → boot → guard → resident → admin → this file
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
    Admin.bind();
    Boot.renderSocietyList();
    this.startClock();
  },

  bindRole() {
    document.getElementById('btn-back-boot').addEventListener('click', () => {
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
    document.getElementById('view-' + name).classList.add('active');
  },

  startClock() {
    const el = document.getElementById('kiosk-clock');
    const tick = () => {
      const now = new Date();
      el.textContent = now.toLocaleTimeString([], {
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
