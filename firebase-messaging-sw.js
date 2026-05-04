importScripts('https://www.gstatic.com/firebasejs/10.12.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.12.0/firebase-messaging-compat.js');

firebase.initializeApp({
  apiKey: "AIzaSyBqGBnG9v1kdm-181xBCvNZeVe5B1wfFzc",
  authDomain: "the-system-strive2026.firebaseapp.com",
  projectId: "the-system-strive2026",
  storageBucket: "the-system-strive2026.firebasestorage.app",
  messagingSenderId: "881172104244",
  appId: "1:881172104244:web:1010d48037fc807ef97661"
});

const messaging = firebase.messaging();

// Handle background messages
messaging.onBackgroundMessage(payload => {
  const { title, body } = payload.notification;
  self.registration.showNotification(title, {
    body,
    icon: '/the-system/icon-192.png',
    badge: '/the-system/icon-192.png',
    tag: payload.data?.tag || 'system-notification',
    renotify: true,
    requireInteraction: true,
    data: { url: '/the-system/' }
  });
});

self.addEventListener('notificationclick', e => {
  e.notification.close();
  e.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then(list => {
      for (const client of list) {
        if (client.url.includes('the-system') && 'focus' in client) return client.focus();
      }
      if (clients.openWindow) return clients.openWindow('/the-system/');
    })
  );
});
