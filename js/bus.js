/**
 * EntryQ same-origin realtime bus (BroadcastChannel + storage)
 * Stand-in for WebSocket/push until D1 Worker.
 */

const Bus = {
  ch: null,
  listeners: [],

  init() {
    try {
      this.ch = new BroadcastChannel('entryq');
      this.ch.onmessage = (e) => this._fire(e.data);
    } catch {
      this.ch = null;
    }
    window.addEventListener('storage', (e) => {
      if (e.key && String(e.key).startsWith('entryq_')) {
        this._fire({ type: 'storage', key: e.key });
      }
    });
  },

  emit(type, payload) {
    const msg = { type, payload, at: Date.now() };
    try {
      this.ch?.postMessage(msg);
    } catch {}
    this._fire(msg);
  },

  on(fn) {
    this.listeners.push(fn);
  },

  _fire(msg) {
    this.listeners.forEach((fn) => {
      try { fn(msg); } catch {}
    });
  },
};
