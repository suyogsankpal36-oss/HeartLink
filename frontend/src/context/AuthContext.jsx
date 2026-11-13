import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { api, hasSessionHint, pingBackend, refreshSession, setAccessToken, setSessionExpiredHandler } from "../services/api";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [stats, setStats] = useState({});
  const [authLoading, setAuthLoading] = useState(true);
  const [backendAvailable, setBackendAvailable] = useState(true);

  const clearSession = useCallback(() => {
    setAccessToken(null);
    setUser(null);
    setStats({});
  }, []);

  const refreshProfile = useCallback(async () => {
    try {
      const { data } = await api.get("/auth/me");
      setUser(data.user);
      setStats(data.stats || {});
      setBackendAvailable(true);
      return data.user;
    } catch (err) {
      if (err?.code === "ERR_NETWORK" || !err?.response) {
        setBackendAvailable(false);
      }
      throw err;
    }
  }, []);

  const checkConnection = useCallback(async () => {
    try {
      if (!hasSessionHint()) {
        await pingBackend()
          .then(() => setBackendAvailable(true))
          .catch((err) => {
            if (err?.code === "ERR_NETWORK" || !err?.response) setBackendAvailable(false);
          });
        return;
      }
      const session = await refreshSession().catch((err) => {
        if (err?.code === "ERR_NETWORK" || !err?.response) {
          setBackendAvailable(false);
        } else {
          setBackendAvailable(true);
        }
        return null;
      });
      if (session?.accessToken) {
        setUser(session.user || null);
        const { data } = await api.get("/auth/me").catch(() => ({ data: { user: session.user } }));
        setUser(data.user);
        setStats(data.stats || {});
        setBackendAvailable(true);
      }
    } catch {
      // Handled gracefully
    }
  }, []);

  useEffect(() => {
    setSessionExpiredHandler(clearSession);
    let active = true;

    async function restoreSession() {
      try {
        if (!hasSessionHint()) {
          await pingBackend()
            .then(() => {
              if (active) setBackendAvailable(true);
            })
            .catch((err) => {
              if (active && (err?.code === "ERR_NETWORK" || !err?.response)) {
                setBackendAvailable(false);
              }
            });
          if (active) clearSession();
          return;
        }

        const session = await refreshSession().catch((err) => {
          if (err?.code === "ERR_NETWORK" || !err?.response) {
            if (active) setBackendAvailable(false);
          } else {
            if (active) setBackendAvailable(true);
          }
          return null;
        });

        if (!active) return;

        if (session?.accessToken) {
          setUser(session.user || null);
          const { data } = await api.get("/auth/me").catch(() => ({ data: { user: session.user } }));
          if (active) {
            setUser(data.user);
            setStats(data.stats || {});
            setBackendAvailable(true);
          }
        } else {
          clearSession();
        }
      } catch {
        if (active) clearSession();
      } finally {
        if (active) setAuthLoading(false);
      }
    }

    restoreSession();
    return () => {
      active = false;
      setSessionExpiredHandler(null);
    };
  }, [clearSession]);

  const authenticate = useCallback(async (mode, payload) => {
    const endpoint = mode === "signup" ? "/auth/register" : "/auth/login";
    const { data } = await api.post(endpoint, payload);
    if (data.accessToken) {
      setAccessToken(data.accessToken);
      setUser(data.user);
      setStats({});
      setBackendAvailable(true);
    }
    return data;
  }, []);

  const authenticateWithGoogle = useCallback(async (idToken, profile = {}) => {
    const { data } = await api.post("/auth/google", { idToken, ...profile });
    if (data.accessToken) {
      setAccessToken(data.accessToken);
      setUser(data.user);
      setStats({});
      setBackendAvailable(true);
    }
    return data;
  }, []);

  const logout = useCallback(async () => {
    try {
      await api.post("/auth/logout").catch(() => {});
    } finally {
      clearSession();
    }
  }, [clearSession]);

  const value = useMemo(() => ({
    user,
    stats,
    authLoading,
    backendAvailable,
    setUser,
    authenticate,
    authenticateWithGoogle,
    logout,
    refreshProfile,
    checkConnection,
  }), [user, stats, authLoading, backendAvailable, authenticate, authenticateWithGoogle, logout, refreshProfile, checkConnection]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used inside AuthProvider.");
  return context;
}
