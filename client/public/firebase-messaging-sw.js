// public/firebase-messaging-sw.js
importScripts("https://www.gstatic.com/firebasejs/10.12.0/firebase-app-compat.js");
importScripts("https://www.gstatic.com/firebasejs/10.12.0/firebase-messaging-compat.js");

// Same config as your React app
firebase.initializeApp({
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID,
});

const messaging = firebase.messaging();

// Background messages (app is minimized or tab not active)
messaging.onBackgroundMessage((payload) => {
  console.log("Background message:", payload);

  const { title, body, icon } = payload.notification;

  self.registration.showNotification(title, {
    body: body,
    icon: icon || "/logo192.png",
    badge: "/logo192.png",
    data: payload.data  // pass any extra data
  });
});

// Optional: handle notification click
self.addEventListener("notificationclick", (event) => {
  event.notification.close();

  event.waitUntil(
    clients
      .matchAll({ type: "window", includeUncontrolled: true })
      .then((clientList) => {
        // If app tab already open → focus it
        for (const client of clientList) {
          if (client.url.includes("localhost:5173") && "focus" in client) {
            return client.focus();
          }
        }
        // Otherwise open new tab
        return clients.openWindow("http://localhost:5173");
      })
  );
});