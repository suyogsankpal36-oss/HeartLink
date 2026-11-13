import { createContext, useContext, useEffect, useRef, useState } from "react";
import { io } from "socket.io-client";
import { toast } from "react-hot-toast";
import { useAuth } from "./AuthContext.jsx";
import { API_ORIGIN, getAccessToken, onTokenChanged, refreshSession } from "../services/api.js";

const SocketContext = createContext(null);

export function SocketProvider({ children }) {
  const { user, refreshProfile } = useAuth();
  const userId = user?.id || user?._id || null;
  const refreshProfileRef = useRef(refreshProfile);
  refreshProfileRef.current = refreshProfile;
  const socketRef = useRef(null);
  const [socketInstance, setSocketInstance] = useState(null);
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    if (!userId) {
      if (socketRef.current) {
        socketRef.current.disconnect();
        socketRef.current = null;
      }
      setSocketInstance(null);
      setIsConnected(false);
      return undefined;
    }

    const token = getAccessToken();
    const socket = io(API_ORIGIN, {
      auth: { token },
      transports: ["websocket", "polling"],
      reconnection: true,
      reconnectionAttempts: Infinity,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
    });
    socketRef.current = socket;
    setSocketInstance(socket);

    socket.on("connect", () => {
      setIsConnected(true);
    });

    socket.on("disconnect", async (reason) => {
      setIsConnected(false);
      if (reason === "io server disconnect") {
        try {
          const fresh = await refreshSession();
          if (socketRef.current && fresh?.accessToken) {
            socketRef.current.auth.token = fresh.accessToken;
            socketRef.current.connect();
          }
        } catch {
          // Handled by sessionExpiredHandler
        }
      }
    });

    socket.on("connect_error", async (error) => {
      setIsConnected(false);
      const msg = error?.message || "";
      if (msg.includes("Unauthorized") || msg.includes("token") || msg.includes("Authentication")) {
        try {
          const fresh = await refreshSession();
          if (socketRef.current && fresh?.accessToken) {
            socketRef.current.auth.token = fresh.accessToken;
            socketRef.current.connect();
          }
        } catch {
          // Handled by sessionExpiredHandler
        }
      }
    });

    // Real-time notifications and state sync
    socket.on("new_notification", (payload) => {
      window.dispatchEvent(new CustomEvent("heartlink:notifications_changed", { detail: payload }));
      if (payload?.type === "like" || payload?.type === "superlike") {
        window.dispatchEvent(new CustomEvent("heartlink:likes_changed", { detail: payload }));
      } else if (payload?.type === "match") {
        window.dispatchEvent(new CustomEvent("heartlink:matches_changed", { detail: payload }));
        window.dispatchEvent(new CustomEvent("heartlink:likes_changed", { detail: payload }));
      }
      refreshProfileRef.current?.().catch(() => {});
      if (payload?.message) {
        toast(payload.message, {
          icon: payload.type === "match" ? "🎉" : payload.type === "superlike" ? "⭐" : payload.type === "like" ? "💖" : "💬",
        });
      }
    });

    socket.on("like_received", (payload) => {
      window.dispatchEvent(new CustomEvent("heartlink:likes_changed", { detail: payload }));
      refreshProfileRef.current?.().catch(() => {});
    });

    socket.on("new_match_event", (payload) => {
      window.dispatchEvent(new CustomEvent("heartlink:matches_changed", { detail: payload }));
      window.dispatchEvent(new CustomEvent("heartlink:likes_changed", { detail: payload }));
      refreshProfileRef.current?.().catch(() => {});
    });

    socket.on("match_removed", (payload) => {
      window.dispatchEvent(new CustomEvent("heartlink:matches_changed", { detail: payload }));
      refreshProfileRef.current?.().catch(() => {});
    });

    socket.on("presence_update", (payload) => {
      window.dispatchEvent(new CustomEvent("heartlink:presence_update", { detail: payload }));
    });

    const unsubscribeToken = onTokenChanged((newToken) => {
      if (socketRef.current) {
        socketRef.current.auth.token = newToken;
        if (newToken && !socketRef.current.connected) {
          socketRef.current.connect();
        }
      }
    });

    return () => {
      unsubscribeToken();
      socket.disconnect();
      socketRef.current = null;
      setSocketInstance(null);
      setIsConnected(false);
    };
  }, [userId]);

  return (
    <SocketContext.Provider value={{ socket: socketInstance, isConnected }}>
      {children}
    </SocketContext.Provider>
  );
}

export function useSocket() {
  const context = useContext(SocketContext);
  return context || { socket: null, isConnected: false };
}
