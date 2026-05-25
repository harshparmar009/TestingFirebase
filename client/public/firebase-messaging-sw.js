// public/firebase-messaging-sw.js
importScripts("https://www.gstatic.com/firebasejs/10.12.0/firebase-app-compat.js");
importScripts("https://www.gstatic.com/firebasejs/10.12.0/firebase-messaging-compat.js");

// Same config as your React app
firebase.initializeApp({
  apiKey: "AIzaSyCsxrOyF6zjip-H6OYdjQ3S-XrhTpr38I0",
  authDomain: "fir-testing-7d11a.firebaseapp.com",
  projectId: "fir-testing-7d11a",
  storageBucket: "fir-testing-7d11a.firebasestorage.app",
  messagingSenderId: "163370778917",
  appId: "1:163370778917:web:1a40c946122e42bead5acc",
  measurementId: "G-P2S7K9EYYS"
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