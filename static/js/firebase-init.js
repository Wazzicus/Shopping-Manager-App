
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import { getMessaging, getToken, onMessage } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-messaging.js";

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

// A function to be called to request permission and get the token
async function requestNotificationPermission() {
    try {
        const permission = await Notification.requestPermission();
        if (permission === "granted") {
            console.log("Notification permission granted.");
            await getAndSendToken();
        } else {
            console.warn("Notifications permission denied.");
        }
    } catch (err) {
        console.error("Notification permission request failed:", err);
    }
}

// A function to get the token and send it to the server
async function getAndSendToken() {
    try {
        const currentToken = await getToken(messaging, {
            vapidKey: "BBJ9HNDHb9DqrZOKshxSHHplZXPQ9Q6Qgs0YO2oUOehnWLu2YR3jILtmBoZOqYGgaSsl_HBrtpCWIFbsOJRGLDk",
        });

        if (currentToken) {
            console.log("✅ FCM Token:", currentToken);
            // Send token to your Flask backend
            await fetch("/store-token", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ token: currentToken }),
            });
        } else {
            console.log("No registration token available. Request permission to generate one.");
            requestNotificationPermission();
        }
    } catch (err) {
        console.error("An error occurred while retrieving token. ", err);
    }
}


// --- Main Execution Logic ---

// 1. Register the service worker
if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('/firebase-messaging-sw.js')
        .then((registration) => {
            console.log("Service Worker registered successfully with scope:", registration.scope);
        })
        .catch((err) => {
            console.error("Service Worker registration failed:", err);
        });
}


// 2. Handle foreground notifications
onMessage(messaging, (payload) => {
    console.log("📨 Foreground notification received:", payload);
    showToast(title=payload.notification.title, message=payload.notification.body);
});

// Expose a function to the global scope if you need to call it from inline HTML, e.g., <button onclick="initPush()">
window.initPush = requestNotificationPermission;