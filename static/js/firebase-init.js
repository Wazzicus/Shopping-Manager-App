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

const firebaseApp = initializeApp(firebaseConfig);
const messaging = getMessaging(firebaseApp);

// let currentTokenInLocal = localStorage.getItem("fcm_token");

// async function updateFCMToken(userId) {
//     try {
//         const newToken = await getToken(messaging, {
//             vapidKey: "BBJ9HNDHb9DqrZOKshxSHHplZXPQ9Q6Qgs0YO2oUOehnWLu2YR3jILtmBoZOqYGgaSsl_HBrtpCWIFbsOJRGLDk"
//         });

//         if (newToken && newToken !== currentTokenInLocal) {
//             console.log("Token Changed. Syncing changes");
//             const res = await fetch("/store-token-update", {
//                 method: "POST",
//                 headers: { "Content-Type": "application/json" },
//                 body: JSON.stringify({
//                     token: newToken,
//                     user_id: userId,
//                 }),
//             });

//             if (res.ok) {
//                 console.log("Changes Synced!");
//                 localStorage.setItem("fcm_token", newToken);
//             } else {
//                 console.error("Failed to sync token", await res.text());
//             }
//         } else {
//             console.log("Token unchanged or not available.");
//         }
//     } catch (err) {
//         console.error("Error getting token", err);
//     }
// }

async function requestAndStoreToken() {
    try {
        // Check if permission has already been requested
        if (localStorage.getItem("fcm_permission_requested")) {
            console.log("🔄 Notification permission already requested. Skipping.");
            return;
        }

        const registration = await navigator.serviceWorker.register('/service-worker.js');
        console.log('✅ Service Worker registered:', registration.scope);

        const permission = await Notification.requestPermission();

        if (permission !== 'granted') throw new Error('Notification permission denied!');

        localStorage.setItem("fcm_permission_requested", true);

        const currentToken = await getToken(messaging, {
            vapidKey: 'BBJ9HNDHb9DqrZOKshxSHHplZXPQ9Q6Qgs0YO2oUOehnWLu2YR3jILtmBoZOqYGgaSsl_HBrtpCWIFbsOJRGLDk',
            serviceWorkerRegistration: registration
        });

        if (currentToken) {
            console.log('✅ FCM Token retrieved');

            await fetch('/store-token', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json',
                    'X-CSRFToken': getCSRFToken()
                 },
                body: JSON.stringify({ token: currentToken })
            });
        } else {
            console.warn('⚠️ No FCM token retrieved.');
        }
    } catch (error) {
        console.error('❌ Error in token retrieval:', error);
    }
}


requestAndStoreToken();

onMessage(messaging, (payload) => {
    console.log('📩 Message received in foreground:', payload);
    showToast(payload.notification.title, payload.notification.body);
});
