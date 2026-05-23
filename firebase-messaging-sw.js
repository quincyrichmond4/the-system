// The System — Firebase Cloud Messaging service worker
// Receives push notifications when the app is closed or backgrounded.

importScripts('https://www.gstatic.com/firebasejs/10.12.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.12.0/firebase-messaging-compat.js');

firebase.initializeApp({
  apiKey: 'AIzaSyBqGBnG9v1kdm-181xBCvNZeVe5B1wfFzc',
  authDomain: 'the-system-strive2026.firebaseapp.com',
  projectId: 'the-system-strive2026',
  storageBucket: 'the-system-strive2026.firebasestorage.app',
  messagingSenderId: '881172104244',
  appId: '1:881172104244:web:1010d48037fc807ef97661'
});

const messaging = firebase.messaging();

// Background messages — show the notification.
messaging.onBackgroundMessage((payload) => {
  const n = payload.notification || {};
  self.registration.showNotification(n.title || 'The System', {
    body: n.body || '',
    icon: 'icon-192.png',
    badge: 'icon-192.png',
    tag: 'the-system'
  });
});

// Tapping the notification focuses or opens the app.
self.addEventListener('notificationclick', (e) => {
  e.notification.close();
  e.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((list) => {
      for (const client of list) {
        if ('focus' in client) return client.focus();
      }
      if (self.clients.openWindow) return self.clients.openWindow('./');
    })
  );
});
