import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js";
import { getMessaging, getToken, onMessage } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-messaging.js";

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

async function initFCM() {
  try {
    const permission = await Notification.requestPermission();
    if (permission !== "granted") {
      console.warn("Notifications denied.");
      return;
    }

    const registration = await navigator.serviceWorker.register("/static/firebase-messaging-sw.js");
    console.log("Service Worker registered:", registration);

    const token = await getToken(messaging, {
      vapidKey: "BBJ9HNDHb9DqrZOKshxSHHplZXPQ9Q6Qgs0YO2oUOehnWLu2YR3jILtmBoZOqYGgaSsl_HBrtpCWIFbsOJRGLDk",
      serviceWorkerRegistration: registration,
    });

    if (token) {
      console.log("FCM Token:", token);
      // Send to backend
      await fetch("/store-token", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token }),
      });
    } else {
      console.warn("No token returned.");
    }
  } catch (error) {
    console.error("Error initializing FCM:", error);
  }
}

// Show toast for foreground notifications
onMessage(messaging, (payload) => {
  console.log("Foreground message:", payload);
  if (payload?.notification) {
    const { title, body } = payload.notification;
    alert(`${title}\n${body}`); // replace with toast in production
  }
});

// Call init on page load
window.addEventListener("load", initFCM);
