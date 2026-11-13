import { createContext, useContext, useEffect, useRef, useState } from "react";
import { io } from "socket.io-client";
import { toast } from "react-hot-toast";
import { useAuth } from "./AuthContext.jsx";
import { SOCKET_URL, expireSession, getAccessToken, onTokenChanged, refreshSession } from "../services/api.js";

const SocketContext = createContext(null);

export function SocketProvider({ children }) {
  const { user, refreshProfile, authLoading } = useAuth();
  const userId = user?.id || user?._id || null;
  const refreshProfileRef = useRef(refreshProfile);
  refreshProfileRef.current = refreshProfile;
  const socketRef = useRef(null);
  const [socketInstance, setSocketInstance] = useState(null);
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    // A socket is never opened for a public visit, while auth is restoring, or
    // without an access token. This prevents the startup WebSocket errors that
    // occurred before authentication had completed.
    if (authLoading || !userId || !getAccessToken()) {
      if (socketRef.current) {
        socketRef.current.disconnect();
        socketRef.current = null;
      }
      setSocketInstance(null);
      setIsConnected(false);
      return undefined;
    }

    let disposed = false;
    let authRecoveryAttempted = false;
    let authRecoveryInFlight = false;

    const socket = io(SOCKET_URL, {
      // Resolve the token at every handshake so a rotated access token is used
      // without constructing another Socket.IO client.
      auth: (callback) => callback({ token: getAccessToken() }),
      transports: ["websocket", "polling"],
      withCredentials: true,
      autoConnect: false,
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      timeout: 10000,
    });
    socketRef.current = socket;
    setSocketInstance(socket);

    const recoverSocketAuthorization = async () => {
      if (disposed || authRecoveryInFlight) return;
      if (authRecoveryAttempted) {
        socket.disconnect();
        expireSession();
        return;
      }

      authRecoveryAttempted = true;
      authRecoveryInFlight = true;
      // Stop the manager before rotating the token so automatic reconnection
      // cannot race the explicit reconnect below.
      socket.io.opts.reconnection = false;
      socket.disconnect();
      try {
        const fresh = await refreshSession();
        if (!fresh?.accessToken || disposed || socketRef.current !== socket) {
          return;
        }
        socket.io.opts.reconnection = true;
        socket.connect();
      } catch {
        if (!disposed) expireSession();
      } finally {
        authRecoveryInFlight = false;
      }
    };

    socket.on("connect", () => {
      if (disposed) return;
      authRecoveryAttempted = false;
      setIsConnected(true);
    });

    socket.on("disconnect", (reason) => {
      setIsConnected(false);
      if (reason === "io server disconnect") {
        recoverSocketAuthorization();
      }
    });

    socket.on("connect_error", (error) => {
      setIsConnected(false);
      const msg = error?.message || "";
      if (/unauthorized|token|authentication|invalid/i.test(msg)) {
        recoverSocketAuthorization();
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
      if (!newToken && socketRef.current === socket) {
        socket.disconnect();
      }
    });

    socket.connect();

    return () => {
      disposed = true;
      unsubscribeToken();
      socket.disconnect();
      socketRef.current = null;
      setSocketInstance(null);
      setIsConnected(false);
    };
  }, [authLoading, userId]);

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
