// /static/firebase-messaging-sw.js
importScripts("https://www.gstatic.com/firebasejs/10.12.2/firebase-app-compat.js");
importScripts("https://www.gstatic.com/firebasejs/10.12.2/firebase-messaging-compat.js");

firebase.initializeApp({
  apiKey: "AIzaSyDAj6vfmLKMGwasNZ1eRLjy-9f7m0xVGOs",
  authDomain: "shopping-manager-app.firebaseapp.com",
  projectId: "shopping-manager-app",
  messagingSenderId: "102307550177",
  appId: "1:102307550177:web:c0fe0da7fc1eb23b5af8a0",
});

const messaging = firebase.messaging();

messaging.onBackgroundMessage((payload) => {
  console.log("📨 Background message:", payload);
  self.registration.showNotification(payload.notification.title, {
    body: payload.notification.body,
    icon: "/static/icon/web-manifest-192x192.png",
    data: {
      click_action: payload.data.click_action || "/dashboard"
    },
  });
});

// Handle notification click
self.addEventListener('notificationclick', function(event) {
  event.notification.close();

  // Focus or open the tab
  event.waitUntil(
    clients.matchAll({ type: "window", includeUncontrolled: true }).then(function(clientList) {
      const urlToOpen = new URL(event.notification.data.click_action, self.location.origin).href;

      for (const client of clientList) {
        if (client.url === urlToOpen && "focus" in client) {
          return client.focus();
        }
      }

      if (clients.openWindow) {
        return clients.openWindow(urlToOpen);
      }
    })
  );
})