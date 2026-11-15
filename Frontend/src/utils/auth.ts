import axios from "axios";

const API_BASE_URL = import.meta.env.VITE_API_URL;

// An independent client prevents the refresh request from entering our interceptors.
const refreshClient = axios.create({ timeout: 15000 });
let refreshPromise: Promise<string | null> | null = null;
let expiryNotificationSent = false;

const AUTH_KEYS = [
  "access_token",
  "refresh_token",
  "username",
  "email",
  "role",
  "principal_employer_id",
  "principal_employer_name",
];

export const clearAuthData = () => {
  for (const key of AUTH_KEYS) {
    localStorage.removeItem(key);
    sessionStorage.removeItem(key);
  }
};

export const getAccessToken = () => localStorage.getItem("access_token");
export const getRefreshToken = () => localStorage.getItem("refresh_token");
export const isAuthenticated = () => Boolean(getAccessToken() || getRefreshToken());

// Returns null for an unreadable token. The server will still validate it.
export const getAccessTokenExpiresAt = (): number | null => {
  const token = getAccessToken();
  if (!token) return null;
  try {
    const payload = token.split(".")[1];
    if (!payload) return null;
    const base64 = payload.replace(/-/g, "+").replace(/_/g, "/");
    const decoded = JSON.parse(atob(base64));
    return typeof decoded.exp === "number" ? decoded.exp * 1000 : null;
  } catch {
    return null;
  }
};

export const isAccessTokenExpiring = (withinMs = 30000) => {
  if (!getAccessToken()) return true;
  const expiresAt = getAccessTokenExpiresAt();
  return expiresAt !== null && expiresAt <= Date.now() + withinMs;
};

export const logoutUser = () => {
  clearAuthData();
  window.dispatchEvent(new Event("auth-changed"));
};

// Show the popup once. Do not call this for offline errors, 403s, or server 500s.
export const expireSession = () => {
  if (expiryNotificationSent) return;
  expiryNotificationSent = true;
  clearAuthData();
  window.dispatchEvent(new Event("session-expired"));
  window.dispatchEvent(new Event("auth-changed"));
};

export const refreshAccessToken = async (): Promise<string | null> => {
  if (refreshPromise) return refreshPromise;

  const refresh = getRefreshToken();
  if (!refresh) return null;

  refreshPromise = (async () => {
    try {
      const response = await refreshClient.post(
        `${API_BASE_URL}/api/token/refresh/`,
        { refresh }
      );
      const access = response.data?.access;
      if (!access || typeof access !== "string") return null;

      localStorage.setItem("access_token", access);
      // Required when SIMPLE_JWT.ROTATE_REFRESH_TOKENS=True.
      if (response.data?.refresh) {
        localStorage.setItem("refresh_token", response.data.refresh);
      }
      expiryNotificationSent = false;
      return access;
    } catch (error) {
      // Invalid/blacklisted/expired refresh token: the session cannot be recovered.
      if (
        axios.isAxiosError(error) &&
        (error.response?.status === 401 || error.response?.status === 403)
      ) {
        return null;
      }
      // Offline, timeout, 429, 5xx: do not log a user out.
      throw error;
    }
  })();

  try {
    return await refreshPromise;
  } finally {
    refreshPromise = null;
  }
};

// Used both before API calls and on returning to a protected screen.
export const ensureValidSession = async (): Promise<string | null> => {
  const token = getAccessToken();
  if (token && !isAccessTokenExpiring()) return token;

  if (!getRefreshToken()) {
    if (token) expireSession();
    return null;
  }
  const refreshed = await refreshAccessToken();
  if (!refreshed) expireSession();
  return refreshed;
};
