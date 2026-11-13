import axios from "axios";

/**
 * Normalizes the backend API URL.
 * Automatically handles a configured origin, /api, or /api/v1 value without
 * embedding a deployment-specific API hostname in the frontend bundle.
 */
function resolveApiUrl() {
  const raw = (import.meta.env.VITE_API_URL || "").trim().replace(/\/+$/, "");
  if (!raw || (import.meta.env.PROD && raw.includes("localhost"))) {
    return import.meta.env.PROD
      ? "/api/v1"
      : "http://localhost:5000/api/v1";
  }
  if (raw.endsWith("/api/v1")) return raw;
  if (raw.endsWith("/api")) return `${raw}/v1`;
  return `${raw}/api/v1`;
}

export const API_URL = resolveApiUrl();
export const API_ORIGIN = new URL(API_URL, typeof window !== "undefined" ? window.location.origin : "http://localhost:5000").origin;
export const SOCKET_URL = new URL(
  import.meta.env.VITE_SOCKET_URL || API_ORIGIN,
  typeof window !== "undefined" ? window.location.origin : "http://localhost:5000",
).origin;

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

export function getAccessToken() {
  return accessToken;
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
        {},
        { withCredentials: true, timeout: 20000 }
      )
      .then(({ data }) => {
        setAccessToken(data.accessToken);
        return data;
      })
      .finally(() => {
        refreshFlight = null;
      });
  }
  return refreshFlight;
}

export function expireSession() {
  setAccessToken(null);
  onSessionExpired();
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
      expireSession();
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
