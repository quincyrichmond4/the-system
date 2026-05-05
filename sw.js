const CACHE = 'system-v6';
const VERSION = '1.0.6';
const ASSETS = [
  '/the-system/',
  '/the-system/index.html',
  '/the-system/manifest.json',
  '/the-system/icon-192.png',
  '/the-system/icon-512.png',
  '/the-system/system_sound.mp3'
];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(ASSETS).catch(() => {})));
  self.skipWaiting();
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)))
    ).then(() => {
      self.clients.matchAll({ type: 'window' }).then(clients => {
        clients.forEach(client => client.postMessage({ type: 'SW_UPDATED', version: VERSION }));
      });
    })
  );
  self.clients.claim();
});

// NETWORK-FIRST
self.addEventListener('fetch', e => {
  if (e.request.method !== 'GET') return;
  e.respondWith(
    fetch(e.request)
      .then(response => {
        if (response && response.status === 200) {
          const clone = response.clone();
          caches.open(CACHE).then(c => c.put(e.request, clone));
        }
        return response;
      })
      .catch(() => caches.match(e.request))
  );
});

self.addEventListener('message', e => {
  if (e.data?.type === 'SCHEDULE_NOTIFICATIONS') {
    const { delay5pm, delay11pm, delayTue, questsDone, dungeonDone } = e.data;
    if (!questsDone && delay5pm > 0) {
      setTimeout(() => {
        self.registration.showNotification('[ The System ]', {
          body: 'Hunter, your daily quests await. Do not break the chain.',
          icon: '/the-system/icon-192.png',
          badge: '/the-system/icon-192.png',
          tag: 'reminder-5pm',
          renotify: true,
          data: { url: '/the-system/' }
        });
      }, delay5pm);
    }
    if (!questsDone && delay11pm > 0) {
      setTimeout(() => {
        self.registration.showNotification('⚠ PENALTY WARNING', {
          body: 'Less than 1 hour remaining. Complete your daily quests or face the penalty.',
          icon: '/the-system/icon-192.png',
          badge: '/the-system/icon-192.png',
          tag: 'warning-11pm',
          renotify: true,
          requireInteraction: true,
          data: { url: '/the-system/' }
        });
      }, delay11pm);
    }
    if (!dungeonDone && delayTue > 0) {
      setTimeout(() => {
        self.registration.showNotification('⚔ DUNGEON CLOSING SOON', {
          body: 'The Marketplace closes in 30 minutes. Log your QIs before the deadline.',
          icon: '/the-system/icon-192.png',
          badge: '/the-system/icon-192.png',
          tag: 'dungeon-warning',
          renotify: true,
          requireInteraction: true,
          data: { url: '/the-system/' }
        });
      }, delayTue);
    }
  }
});

self.addEventListener('notificationclick', e => {
  e.notification.close();
  e.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then(list => {
      for (const c of list) {
        if (c.url.includes('the-system') && 'focus' in c) return c.focus();
      }
      if (clients.openWindow) return clients.openWindow('/the-system/');
    })
  );
});

// Allow app to trigger immediate activation
self.addEventListener('message', e => {
  if (e.data?.type === 'SKIP_WAITING') self.skipWaiting();
});
