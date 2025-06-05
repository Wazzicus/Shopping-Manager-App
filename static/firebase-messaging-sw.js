// /static/firebase-messaging-sw.js
importScripts("https://www.gstatic.com/firebasejs/10.12.0/firebase-app-compat.js");
importScripts("https://www.gstatic.com/firebasejs/10.12.0/firebase-messaging-compat.js");

firebase.initializeApp({
  apiKey: "AIzaSyDAj6vfmLKMGwasNZ1eRLjy-9f7m0xVGOs",
  authDomain: "shopping-manager-app.firebaseapp.com",
  projectId: "shopping-manager-app",
  messagingSenderId: "102307550177",
  appId: "1:102307550177:web:c0fe0da7fc1eb23b5af8a0",
});

const messaging = firebase.messaging();

messaging.onBackgroundMessage((payload) => {
  console.log('[firebase-messaging-sw.js] Background message ', payload);
  const notificationTitle = payload.notification.title;
  const notificationOptions = {
    body: payload.notification.body,
    icon: "/static/icons/web-app-manifest-192x192.png",
  };

  self.registration.showNotification(notificationTitle, notificationOptions);
});
