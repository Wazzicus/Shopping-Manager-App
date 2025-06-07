// /static/js/firebase-init.js
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import { getMessaging, getToken, onMessage } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-messaging.js";

// Replace with your config
const firebaseConfig = {
  apiKey: "AIzaSyDAj6vfmLKMGwasNZ1eRLjy-9f7m0xVGOs",
  authDomain: "shopping-manager-app.firebaseapp.com",
  projectId: "shopping-manager-app",
  messagingSenderId: "102307550177",
  appId: "1:102307550177:web:c0fe0da7fc1eb23b5af8a0",
  measurementId: "G-VFL14S59LN"
};

const app = initializeApp(firebaseConfig);
const messaging = getMessaging(app);

// Ask for permission and get token
export async function initPush() {
  try {
    const permission = await Notification.requestPermission();
    if (permission === "granted") {
      const swRegistration = await navigator.serviceWorker.register("/firebase-messaging-sw.js");
      const token = await getToken(messaging, {
        vapidKey: "BBJ9HNDHb9DqrZOKshxSHHplZXPQ9Q6Qgs0YO2oUOehnWLu2YR3jILtmBoZOqYGgaSsl_HBrtpCWIFbsOJRGLDk",
        serviceWorkerRegistration: swRegistration
      });
      console.log("✅ FCM Token:", token);

      // Send token to Flask
      await fetch("/store-token", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token }),
      });
    } else {
      console.warn("Notifications permission denied.");
    }
  } catch (err) {
    console.error("FCM init failed:", err);
  }
}

// Handle foreground notifications
onMessage(messaging, (payload) => {
  console.log("📨 Foreground notification:", payload);
  showToast(payload.notification.title + "\n" + payload.notification.body);
});
