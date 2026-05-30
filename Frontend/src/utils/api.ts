import axios from "axios";

import {
  getAccessToken,
  refreshAccessToken,
  logoutUser,
} from "./auth";

const api = axios.create({
  baseURL: "https://apii.complianceclearance.com",
});

// ================= REQUEST =================
api.interceptors.request.use(
  async (config) => {
    const token = getAccessToken();

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

    if (
      originalRequest?.url?.includes("/api/auth/login/")
    ) {
      return Promise.reject(error);
    }

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

      logoutUser();

      window.location.href =
        "/signin";
    }

    return Promise.reject(error);
  }
);

export default api;