import express from "express";
import http from "http";
import { Server } from "socket.io";
import cors from "cors";
import admin from "./firebaseAdmin.js";
import "dotenv/config";

const app = express();

app.use(cors());
app.use(express.json());

const server = http.createServer(app);

// Module-level state
const tokenStore = new Map();       // token -> { registeredAt, browser }
const tokenFailures = new Map();    // token -> failureCount
const MAX_FAILURES = 3;

const io = new Server(server, {
  cors: {
    origin: "http://localhost:5173",
    methods: ["GET", "POST"],
  },
});

let users = new Map();

app.post("/api/register-token", (req, res) => {
  const { token, browser } = req.body;
  if (!token) return res.status(400).json({ error: "Token required" });

 const isNew = !tokenStore.has(token);

  tokenStore.set(token, { registeredAt: Date.now(), browser });
  tokenFailures.delete(token); // reset failures on fresh registration

   console.log(`${isNew ? " New" : " Re-registered"} token. Total: ${tokenStore.size}`);
  console.log(`Token registered. Total tokens: ${tokenStore.size}`);
  res.json({ success: true });
});

//remove registered token
// app.post("/api/remove-token", (req, res) => {
//   const { token } = req.body;
//   if (token) {
//     tokenStore.delete(token);
//     tokenFailures.delete(token);
//     console.log(`Token removed. Total: ${tokenStore.size}`);
//   }
//   res.json({ success: true });
// });

app.post("/api/send-message", async (req, res) => {
  const { username, message, senderToken } = req.body;

  if (!message || !username) {
    return res.status(400).json({ error: "message and username required" });
  }

  //  Fix: use .keys() to get token strings from Map
  const tokens = [...tokenStore.keys()].filter(t => t !== senderToken);

  console.log(` Sending to ${tokens.length} token(s), sender filtered out: ${!!senderToken}`);

  if (tokens.length === 0) {
    return res.json({ success: true, info: "No other users to notify" });
  }

  try {
    const fcmMessage = {
      webpush: {
        notification: {
          title: ` ${username}`,
          body: message,
          icon: "/logo192.png",
          badge: "/logo192.png",
          requireInteraction: false,
          tag: "chat-message",
          renotify: false, 
        },
      },
      tokens,
    };

    const response = await admin.messaging().sendEachForMulticast(fcmMessage);
    console.log(` FCM: ${response.successCount} sent, ${response.failureCount} failed`);

    response.responses.forEach((resp, idx) => {
      const token = tokens[idx];

      if (!resp.success) {
        const code = resp.error?.code;
        console.log(` FCM failure for token[${idx}]: ${code} — ${resp.error?.message}`);

        if (
          code === "messaging/invalid-registration-token" ||
          code === "messaging/registration-token-not-registered"
        ) {
          const failures = (tokenFailures.get(token) || 0) + 1;

          if (failures >= MAX_FAILURES) {
            tokenStore.delete(token);
            tokenFailures.delete(token);
            console.log(` Removed token after ${MAX_FAILURES} failures`);
          } else {
            tokenFailures.set(token, failures);
            console.log(` Token failure ${failures}/${MAX_FAILURES}`);
          }
        }
      } else {
        tokenFailures.delete(token); // reset on success
      }
    });

    res.json({ success: true, sent: response.successCount });
  } catch (err) {
    console.error("FCM v1 error:", err);
    res.status(500).json({ error: "Notification failed" });
  }
});

io.on("connection", (socket) => {
  console.log("User Connected:", socket.id);

  socket.on("join", (username) => {
    users.set(socket.id, { socketId: socket.id, username, status: "online" });
    io.emit("usersUpdate", Array.from(users.values()));
  });

  socket.on("sendMessage", (data) => {
    io.emit("receiveMessage", data);
  });

  socket.on("disconnect", () => {
    console.log("User Disconnected:", socket.id);
    const user = users.get(socket.id);
    if (user) {
      users.set(socket.id, { ...user, status: "offline" });
    }
    io.emit("usersUpdate", Array.from(users.values()));
  });
});

server.listen(5000, () => {
  console.log("Server running on port 5000");
});