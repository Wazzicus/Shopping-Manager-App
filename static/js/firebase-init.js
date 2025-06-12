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

const firebaseapp = initializeApp(firebaseConfig);
const messaging = getMessaging(firebaseapp);

navigator.serviceWorker.register('/service-worker.js').then(registration => {
    console.log('✅ Service Worker registered:', registration.scope);
    messaging.useServiceWorker(registration);
    return Notification.requestPermission();
}).then(permission => {
    if (permission === 'granted') {
        console.log('Notification permission granted.');
        return getToken(messaging, {
            vapidKey: 'BBJ9HNDHb9DqrZOKshxSHHplZXPQ9Q6Qgs0YO2oUOehnWLu2YR3jILtmBoZOqYGgaSsl_HBrtpCWIFbsOJRGLDk'
        });
    } else {
        throw new Error('Notification permission denied!');
    }
}).then(currentToken => {
    if (currentToken) {
        console.log('FCM Token retrieved')

        await fetch('/store-token', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            bpdy: JSON.stringify({ token: currentToken })
        });
    } else {
        console.warn('No FCM token retrieved.');
    }
}).catch(error => {
    console.error('❌ Service Worker registration failed:', error);
});

onMessage(messaging, (payload) => {
    console.log('Message received in foreground:', payload);
    showToast(title=payload.notification.title, message=payload.notification.body)
});