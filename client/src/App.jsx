import { useEffect, useState } from "react";
import { io } from "socket.io-client";

import JoinChat from "./components/JoinChat";
import Sidebar from "./components/Sidebar";
import ChatMessages from "./components/ChatMessages";
import MessageInput from "./components/MessageInput";
import { useNotifications } from "./utils/useNotifications";


const socket = io("http://localhost:5000");

function App() {
  const { token, notification, Toaster } = useNotifications();

  const [users, setUsers] = useState({});
  const [username, setUsername] = useState("");
  const [joined, setJoined] = useState(false);
  const [message, setMessage] = useState("");
  const [messages, setMessages] = useState([]);
  const [onlineUsers, setOnlineUsers] = useState([]);

  useEffect(() => {
    socket.on("receiveMessage", (data) => {
      setMessages((prev) => [...prev, data]);
    });

    socket.on("usersUpdate", (users) => {
      setUsers(users);
      setOnlineUsers(Object.values(users));
    });

    return () => {
      socket.off("receiveMessage");
      socket.off("usersUpdate");
    };
  }, []);

  const joinChat = () => {
    if (!username) return;
    socket.emit("join", username);
    setJoined(true);
  };

  const sendMessage = async () => {
    if (!message) return;

    // ✅ Use localStorage as fallback if state token isn't ready yet
    const senderToken = token || localStorage.getItem("fcmToken");

    if (!senderToken) {
      console.warn("FCM token not ready yet — notification won't be filtered for sender");
      // ✅ Don't block the message, just send without token
      // Server will notify all tokens including sender in this edge case
    }

    const data = { username, message };

    // ✅ Send socket message immediately — don't wait for FCM
    socket.emit("sendMessage", data);
    setMessage("");

    // ✅ FCM notification in background — doesn't block chat
    try {
      await fetch("http://localhost:5000/api/send-message", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          username,
          message,
          senderToken: senderToken || null, // ✅ null is handled on server
        }),
      });
    } catch (err) {
      console.error("FCM send error:", err);
      // ✅ Don't throw — chat already sent via socket above
    }
  };

  if (!joined) {
    return (
      <JoinChat
        username={username}
        setUsername={setUsername}
        joinChat={joinChat}
      />
    );
  }

  return (
    <div className="h-screen flex bg-gray-100">
      <Sidebar users={users} />

      <div className="flex-1 flex flex-col">
        <ChatMessages messages={messages} username={username} Toaster={Toaster} />

        <MessageInput
          message={message}
          setMessage={setMessage}
          sendMessage={sendMessage}
        />
      </div>
    </div>
  );
}

export default App;