import "dotenv/config";
import express from "express";
import http from "http";
import { Server } from "socket.io";
import cors from "cors";
import admin from "./firebaseAdmin.js";

const app = express();
const port = process.env.PORT || 5000;

const allowedOrigins = [
  "http://localhost:5173",
  process.env.CLIENT_URL,
].filter(Boolean);

const corsOptions = {
  origin: (origin, callback) => {
    const isAllowed =
      !origin ||
      allowedOrigins.includes(origin) ||
      /https:\/\/testing-firebase-.*\.vercel\.app$/.test(origin);

    if (isAllowed) {
      callback(null, true);
    } else {
      console.log("❌ Blocked by CORS:", origin);
      callback(new Error("Not allowed by CORS"));
    }
  },
  methods: ["GET", "POST"],
  credentials: true, // ✅ add this
};

// ✅ cors MUST be first, before everything else
app.use(cors(corsOptions));
app.use(express.json()); // ✅ after cors

const server = http.createServer(app);

const io = new Server(server, {
  cors: corsOptions,
  transports: ["polling", "websocket"], // ✅ explicitly allow both
});

const tokenStore = new Map();
const tokenFailures = new Map();
const MAX_FAILURES = 3;
let users = new Map();

app.post("/api/register-token", (req, res) => {
  const { token, browser } = req.body;
  if (!token) return res.status(400).json({ error: "Token required" });

  const isNew = !tokenStore.has(token);
  tokenStore.set(token, { registeredAt: Date.now(), browser });
  tokenFailures.delete(token);

  console.log(`${isNew ? "🆕 New" : "♻️ Re-registered"} token. Total: ${tokenStore.size}`);
  res.json({ success: true });
});

app.post("/api/remove-token", (req, res) => {
  const { token } = req.body;
  if (token) {
    tokenStore.delete(token);
    tokenFailures.delete(token);
    console.log(`🗑️ Token removed. Total: ${tokenStore.size}`);
  }
  res.json({ success: true });
});

app.post("/api/send-message", async (req, res) => {
  const { username, message, senderToken } = req.body;

  if (!message || !username) {
    return res.status(400).json({ error: "message and username required" });
  }

  const tokens = [...tokenStore.keys()].filter(t => t !== senderToken);
  console.log(`📤 Sending to ${tokens.length} token(s)`);

  if (tokens.length === 0) {
    return res.json({ success: true, info: "No other users to notify" });
  }

  try {
    const fcmMessage = {
      webpush: {
        notification: {
          title: `${username}`,
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
    console.log(`✅ FCM: ${response.successCount} sent, ${response.failureCount} failed`);

    response.responses.forEach((resp, idx) => {
      const token = tokens[idx];
      if (!resp.success) {
        const code = resp.error?.code;
        console.log(`❌ FCM failure for token[${idx}]: ${code}`);
        if (
          code === "messaging/invalid-registration-token" ||
          code === "messaging/registration-token-not-registered"
        ) {
          const failures = (tokenFailures.get(token) || 0) + 1;
          if (failures >= MAX_FAILURES) {
            tokenStore.delete(token);
            tokenFailures.delete(token);
            console.log(`🗑️ Removed token after ${MAX_FAILURES} failures`);
          } else {
            tokenFailures.set(token, failures);
            console.log(`⚠️ Token failure ${failures}/${MAX_FAILURES}`);
          }
        }
      } else {
        tokenFailures.delete(token);
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

server.listen(port, () => {
  console.log(`✅ Server running on port ${port}`);
});