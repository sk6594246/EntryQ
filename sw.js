const CACHE = 'entryq-v6';
const ASSETS = ['./','./index.html','./css/app.css','./js/utils.js','./js/storage.js','./js/storage-ops.js','./js/bus.js','./js/boot.js','./js/auth.js','./js/approvals.js','./js/notices.js','./js/amenities.js','./js/tickets.js','./js/guard.js','./js/resident.js','./js/people.js','./js/admin.js','./js/app.js','./manifest.json','./icons/icon.svg'];
self.addEventListener('install', (e) => {
  e.waitUntil(caches.open(CACHE).then((cache) => cache.addAll(ASSETS)).then(() => self.skipWaiting()));
});
self.addEventListener('activate', (e) => {
  e.waitUntil(caches.keys().then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k)))).then(() => self.clients.claim()));
});
self.addEventListener('fetch', (e) => {
  e.respondWith(caches.match(e.request).then((cached) => cached || fetch(e.request)));
});
