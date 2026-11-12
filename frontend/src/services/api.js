import axios from "axios";

export const API_URL = (import.meta.env.VITE_API_URL || "http://localhost:5000/api/v1").replace(/\/$/, "");
export const API_ORIGIN = new URL(API_URL, window.location.origin).origin;

if (import.meta.env.PROD && !import.meta.env.VITE_API_URL) {
  console.warn("[HeartLink Production Notice] VITE_API_URL is not set. Ensure VITE_API_URL is configured in your hosting platform environment variables.");
}

const SESSION_HINT_KEY = "heartlink_session_active";

export function hasSessionHint() {
  try {
    return typeof window !== "undefined" && window.localStorage?.getItem(SESSION_HINT_KEY) === "1";
  } catch {
    return false;
  }
}

export function setSessionHint(active) {
  try {
    if (typeof window === "undefined" || !window.localStorage) return;
    if (active) window.localStorage.setItem(SESSION_HINT_KEY, "1");
    else window.localStorage.removeItem(SESSION_HINT_KEY);
  } catch {
    // Ignore storage restriction errors in hardened browser contexts
  }
}

export async function pingBackend() {
  await axios.get(`${API_ORIGIN}/api/live`, { timeout: 10000 });
}

let accessToken = null;
let refreshToken = null;
let refreshFlight = null;
let onSessionExpired = () => {};
const tokenListeners = new Set();

export function onTokenChanged(callback) {
  tokenListeners.add(callback);
  return () => tokenListeners.delete(callback);
}

export function setAccessToken(token) {
  accessToken = token || null;
  if (!token) {
    refreshToken = null;
    setSessionHint(false);
  } else {
    setSessionHint(true);
  }
  tokenListeners.forEach((listener) => {
    try {
      listener(accessToken);
    } catch (e) {
      console.warn("Token listener error:", e);
    }
  });
}

export function setRefreshToken(token) {
  refreshToken = token || null;
}

export function getAccessToken() {
  return accessToken;
}

export function getRefreshToken() {
  return refreshToken;
}

export function setSessionExpiredHandler(handler) {
  onSessionExpired = typeof handler === "function" ? handler : () => {};
}

export const api = axios.create({
  baseURL: API_URL,
  withCredentials: true,
  timeout: 20000,
  headers: { "Content-Type": "application/json" },
});

export async function refreshSession() {
  if (!refreshFlight) {
    refreshFlight = axios
      .post(
        `${API_URL}/auth/refresh`,
        refreshToken ? { refreshToken } : {},
        { withCredentials: true, timeout: 20000 }
      )
      .then(({ data }) => {
        setAccessToken(data.accessToken);
        if (data.refreshToken) setRefreshToken(data.refreshToken);
        return data;
      })
      .finally(() => {
        refreshFlight = null;
      });
  }
  return refreshFlight;
}

api.interceptors.request.use((config) => {
  if (accessToken) config.headers.Authorization = `Bearer ${accessToken}`;
  return config;
});

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const original = error.config;
    const path = original?.url || "";
    const publicAuthEndpoint = /\/auth\/(login|register|refresh|logout|google|forgot-password|reset-password|verify-email|resend-verification)(\/|$)/.test(path);

    if (error.response?.status !== 401 || !original || original._retry || publicAuthEndpoint) {
      return Promise.reject(error);
    }

    original._retry = true;
    try {
      await refreshSession();
      original.headers.Authorization = `Bearer ${accessToken}`;
      return api(original);
    } catch (refreshError) {
      setAccessToken(null);
      onSessionExpired();
      return Promise.reject(refreshError);
    }
  },
);

export function apiErrorMessage(error, fallback = "Something went wrong. Please try again.") {
  if (error?.code === "ERR_NETWORK" || !error?.response) {
    return "HeartLink could not reach the server. Check that the API is running, then try again.";
  }
  return error.response.data?.message || fallback;
}

export function resolvePhotoUrl(value) {
  if (!value) return "";
  if (/^(data:|blob:|https?:\/\/)/i.test(value)) return value;
  return new URL(value.startsWith("/") ? value : `/${value}`, API_ORIGIN).toString();
}
