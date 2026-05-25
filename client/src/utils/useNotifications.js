import { useEffect, useState, useRef, useCallback } from "react";
import { getMessaging, getToken, onMessage } from "firebase/messaging"; 
import app from "../firebase";
import { Toaster, toast } from "react-hot-toast";

const VAPID_KEY = import.meta.env.VAPID_KEY ;

const messaging = getMessaging(app);

export function useNotifications() {
  const [token, setToken] = useState(() => localStorage.getItem("fcmToken") || null);
  const [notification, setNotification] = useState(null);
  const [permissionStatus, setPermissionStatus] = useState(Notification.permission);
  const swRef = useRef(null);

  const registerToken = useCallback(async () => {
    try {
      if (!("Notification" in window) || !("serviceWorker" in navigator)) {
        console.warn("Notifications or SW not supported");
        return null;
      }

      let swRegistration = swRef.current;
      if (!swRegistration) {
        swRegistration = await navigator.serviceWorker.register(
          "/firebase-messaging-sw.js",
          { scope: "/" }
        );
        swRef.current = swRegistration;
        console.log("SW registered ✅");
      }

      await navigator.serviceWorker.ready;

      let permission = Notification.permission;
      if (permission === "default") {
        permission = await Notification.requestPermission();
      }
      setPermissionStatus(permission);

      if (permission !== "granted") {
        console.warn("Permission denied:", permission);
        return null;
      }

      //  Just get token — no deleteToken
      const fcmToken = await getToken(messaging, {
        vapidKey: VAPID_KEY,
        serviceWorkerRegistration: swRegistration,
      });

      if (!fcmToken) {
        console.warn("No FCM token — check VAPID key or SW scope");
        return null;
      }

      const storedToken = localStorage.getItem("fcmToken");

      //  Only hit backend if token changed or doesn't exist yet
      if (fcmToken !== storedToken) {
        // Remove old token from server first
        // if (storedToken) {
        //   await fetch("http://localhost:5000/api/remove-token", {
        //     method: "POST",
        //     headers: { "Content-Type": "application/json" },
        //     body: JSON.stringify({ token: storedToken }),
        //   }).catch(() => {});
        //   console.log("Old token removed from server ✅");
        // }

        localStorage.setItem("fcmToken", fcmToken);
        setToken(fcmToken);

        await fetch(`${import.meta.env.VITE_SERVER_URL}/api/register-token`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ token: fcmToken }),
        });
        console.log("New token registered with backend ");
      } else {
        //  Token unchanged but server may have restarted — always re-register
        await fetch(`${import.meta.env.VITE_SERVER_URL}/api/register-token`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ token: fcmToken }),
        });
        console.log("Token re-registered with backend ");
        setToken(fcmToken);
      }

      return fcmToken;
    } catch (err) {
      console.error("Notification setup failed:", err.message, err);
      return null;
    }
  }, []);

  useEffect(() => {
    registerToken();
  }, [registerToken]);

  useEffect(() => {
    const unsubscribe = onMessage(messaging, (payload) => {
      console.log("Foreground message ✅:", payload);

       toast.success(
        `${payload.notification?.title} - ${payload.notification?.body}`,
        {
          duration: 4000,
          position: "top-right",
        }
      );

      setNotification(payload.notification);
    });
    return () => unsubscribe();
  }, []);

  return { token, notification, permissionStatus, registerToken, Toaster };
}