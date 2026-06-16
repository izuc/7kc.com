// Web Push handlers, importScripts-loaded into the Workbox-generated sw.js
// (see vite.config workbox.importScripts). Plain service-worker-scope JS only —
// no ES imports / TS, or the whole SW (including offline caching) would fail to start.

self.addEventListener('push', (event) => {
  event.waitUntil(
    (async () => {
      let payload = {};
      try {
        payload = event.data ? event.data.json() : {};
      } catch (e) {
        try {
          payload = { body: event.data && event.data.text() };
        } catch (_) {
          payload = {};
        }
      }
      await self.registration.showNotification(payload.title || 'Food about to expire', {
        body: payload.body || 'Some items in your pantry need using up soon.',
        icon: '/pwa-192x192.png',
        badge: '/pwa-192x192.png',
        tag: payload.tag || 'pantry-expiry',
        data: { url: payload.url || '/pantry' },
      });
    })()
  );
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const url = (event.notification.data && event.notification.data.url) || '/pantry';
  event.waitUntil(
    (async () => {
      const clientList = await self.clients.matchAll({ type: 'window', includeUncontrolled: true });
      for (const client of clientList) {
        if ('focus' in client) {
          await client.focus();
          if ('navigate' in client) {
            try {
              await client.navigate(url);
            } catch (e) {
              /* cross-origin / not allowed — ignore */
            }
          }
          return;
        }
      }
      if (self.clients.openWindow) await self.clients.openWindow(url);
    })()
  );
});
