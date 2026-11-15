import axios, {
  type AxiosError,
  type AxiosInstance,
  type InternalAxiosRequestConfig,
} from "axios";
import {
  ensureValidSession,
  expireSession,
  getAccessToken,
  getRefreshToken,
  refreshAccessToken,
} from "./auth";

const API_BASE_URL = import.meta.env.VITE_API_URL;
const api = axios.create({ baseURL: API_BASE_URL });

type RetryConfig = InternalAxiosRequestConfig & { _authRetried?: boolean };

// The same handling is installed on both the shared client and default axios.
// This covers legacy components still using `import axios from 'axios'`.
const isProtectedApiRequest = (config: InternalAxiosRequestConfig): boolean => {
  const url = config.url || "";
  let parsed: URL;
  let backend: URL;
  try {
    backend = new URL(API_BASE_URL, window.location.origin);
    parsed = new URL(url, config.baseURL || backend.href);
  } catch {
    return false;
  }
  if (parsed.origin !== backend.origin || !parsed.pathname.startsWith("/api/")) {
    return false;
  }
  const path = parsed.pathname.toLowerCase();
  return ![
    "/api/auth/login/",
    "/api/token/refresh/",
    "/api/auth/register/",
    "/api/auth/forgot-password/",
    "/api/auth/reset-password/",
    "/api/auth/validate-reset-token/",
  ].some((excluded) => path.includes(excluded));
};

const attachInterceptors = (client: AxiosInstance) => {
  client.interceptors.request.use(async (config) => {
    if (!isProtectedApiRequest(config)) return config;

    // A single shared refresh is used even if several requests start together.
    const token = await ensureValidSession();
    if (token) {
      // Override Authorization captured earlier by a component from localStorage.
      config.headers.set("Authorization", `Bearer ${token}`);
    }
    return config;
  });

  client.interceptors.response.use(
    (response) => response,
    async (error: AxiosError) => {
      const original = error.config as RetryConfig | undefined;
      if (
        !original ||
        error.response?.status !== 401 ||
        original._authRetried ||
        !isProtectedApiRequest(original)
      ) {
        return Promise.reject(error);
      }

      const hadCredentials = Boolean(getAccessToken() || getRefreshToken());
      if (!hadCredentials) return Promise.reject(error);
      original._authRetried = true;

      try {
        // Another request might have refreshed the token already.
        const sent = original.headers.get("Authorization")?.toString();
        const current = getAccessToken();
        const newToken =
          current && sent !== `Bearer ${current}`
            ? current
            : await refreshAccessToken();

        if (!newToken) {
          expireSession();
          return Promise.reject(error);
        }
        original.headers.set("Authorization", `Bearer ${newToken}`);
        return client(original);
      } catch (refreshError) {
        // Transient network/server failure is not session expiry.
        return Promise.reject(refreshError);
      }
    }
  );
};

attachInterceptors(api);

// Register once: App.tsx imports this module. Do not register again elsewhere.
attachInterceptors(axios);

export default api;
