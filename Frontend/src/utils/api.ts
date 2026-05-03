import axios from "axios";

import {
  getAccessToken,
  refreshAccessToken,
  logoutUser,
} from "./auth";

const api = axios.create({
  baseURL: "http://127.0.0.1:8000",
});

// ================= REQUEST =================
api.interceptors.request.use(
  async (config) => {
    const token = getAccessToken();

    // ✅ DO NOT ADD TOKEN TO LOGIN
    if (
      token &&
      !config.url?.includes("/api/auth/login/")
    ) {
      config.headers.Authorization =
        `Bearer ${token}`;
    }

    return config;
  },

  (error) => Promise.reject(error)
);

// ================= RESPONSE =================
api.interceptors.response.use(
  (response) => response,

  async (error) => {
    const originalRequest = error.config;

    // ✅ IGNORE LOGIN ERRORS
    if (
      originalRequest?.url?.includes("/api/auth/login/")
    ) {
      return Promise.reject(error);
    }

    // ✅ TOKEN EXPIRED
    if (
      error.response?.status === 401 &&
      !originalRequest._retry
    ) {
      originalRequest._retry = true;

      const newAccess =
        await refreshAccessToken();

      if (newAccess) {
        originalRequest.headers.Authorization =
          `Bearer ${newAccess}`;

        return api(originalRequest);
      }

      // ✅ SESSION EXPIRED
      logoutUser();

      window.location.href =
        "/TailAdmin/signin";
    }

    return Promise.reject(error);
  }
);

export default api;