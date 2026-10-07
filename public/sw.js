// Service Worker: only handles Web Push delivery and notification clicks.
// Registered from lib/push.ts at root scope so it receives pushes for the whole app.

self.addEventListener("install", () => {
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(self.clients.claim());
});

self.addEventListener("push", (event) => {
  if (!event.data) return;
  let payload;
  try {
    payload = event.data.json();
  } catch (e) {
    payload = { title: "Dormitory", body: event.data.text() };
  }

  event.waitUntil(
    (async () => {
      // If the app is focused, let the page show its in-app banner instead of an OS notification
      const allClients = await self.clients.matchAll({ type: "window", includeUncontrolled: true });
      const focused = allClients.find((c) => c.focused);
      if (focused) {
        focused.postMessage({ type: "dormitory-push", payload });
        return;
      }

      await self.registration.showNotification(payload.title || "Dormitory", {
        body: payload.body || "",
        icon: "/icon.png",
        badge: "/icon.png",
        tag: payload.id ? `noti-${payload.id}` : undefined,
        data: { url: payload.url || "/" },
      });
    })()
  );
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const targetUrl = new URL((event.notification.data && event.notification.data.url) || "/", self.location.origin).href;

  event.waitUntil(
    self.clients.matchAll({ type: "window", includeUncontrolled: true }).then((clientsList) => {
      for (const client of clientsList) {
        if ("focus" in client && "navigate" in client) {
          return client.focus().then(() => client.navigate(targetUrl));
        }
      }
      if (self.clients.openWindow) return self.clients.openWindow(targetUrl);
    })
  );
});
