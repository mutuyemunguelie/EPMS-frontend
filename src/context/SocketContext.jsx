import React, { createContext, useContext, useEffect, useRef, useState } from "react";
import { io } from "socket.io-client";
import { useAuth } from "./AuthContext";

const SocketContext = createContext(null);

export const SocketProvider = ({ children }) => {
  const { user, isAuthenticated } = useAuth();
  const socketRef = useRef(null);
  const [onlineUsers, setOnlineUsers] = useState([]);
  const [typingUsers, setTypingUsers] = useState({});
  const [systemSettings, setSystemSettings] = useState({});

  useEffect(() => {
    if (!isAuthenticated || !user?.username) return;

    const socket = io("http://localhost:5000", {
      transports: ["websocket", "polling"],
      withCredentials: true,
    });

    socketRef.current = socket;

    socket.on("connect", () => {
      socket.emit("join", user.username);
    });

    socket.on("online_users", (users) => setOnlineUsers(users));

    socket.on("user_typing", ({ sender }) => {
      setTypingUsers((p) => ({ ...p, [sender]: true }));
    });

    socket.on("user_stop_typing", ({ sender }) => {
      setTypingUsers((p) => {
        const n = { ...p };
        delete n[sender];
        return n;
      });
    });

    /* Real-time settings */
    socket.on("settings_updated", ({ key, value }) => {
      setSystemSettings((p) => ({ ...p, [key]: value }));
    });

    return () => {
      socket.disconnect();
      socketRef.current = null;
    };
  }, [isAuthenticated, user?.username]);

  const emitTyping = (receiver) => {
    socketRef.current?.emit("typing", { sender: user?.username, receiver });
  };

  const emitStopTyping = (receiver) => {
    socketRef.current?.emit("stop_typing", { sender: user?.username, receiver });
  };

  return (
    <SocketContext.Provider value={{
      socket: socketRef.current,
      onlineUsers,
      typingUsers,
      emitTyping,
      emitStopTyping,
      systemSettings,
    }}>
      {children}
    </SocketContext.Provider>
  );
};

export const useSocket = () => {
  const ctx = useContext(SocketContext);
  if (!ctx) throw new Error("useSocket must be inside SocketProvider");
  return ctx;
};