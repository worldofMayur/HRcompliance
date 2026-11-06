import axios from "axios";

import {
  getAccessToken,
  refreshAccessToken,
  logoutUser,
} from "./auth";

const API_BASE_URL = import.meta.env.VITE_API_URL;

const api = axios.create({
  baseURL: API_BASE_URL,
});

// ======================================================
// REQUEST INTERCEPTOR
// ======================================================

api.interceptors.request.use(
  (config) => {
    const token = getAccessToken();

    if (
      token &&
      !config.url?.includes("/api/auth/login/") &&
      !config.url?.includes("/api/token/refresh/")
    ) {
      config.headers = config.headers || {};

      config.headers.Authorization =
        `Bearer ${token}`;
    }

    return config;
  },

  (error) => {
    return Promise.reject(error);
  }
);

// ======================================================
// RESPONSE INTERCEPTOR
// ======================================================

api.interceptors.response.use(
  (response) => {
    return response;
  },

  async (error) => {
    const originalRequest = error.config;

    // No request information
    if (!originalRequest) {
      return Promise.reject(error);
    }

    // ==================================================
    // NEVER REFRESH LOGIN REQUEST
    // ==================================================

    if (
      originalRequest.url?.includes(
        "/api/auth/login/"
      )
    ) {
      return Promise.reject(error);
    }

    // ==================================================
    // NEVER REFRESH TOKEN REFRESH REQUEST
    // ==================================================

    if (
      originalRequest.url?.includes(
        "/api/token/refresh/"
      )
    ) {
      return Promise.reject(error);
    }

    // ==================================================
    // ALREADY RETRIED ONCE
    // ==================================================

    if (originalRequest._retry) {
      return Promise.reject(error);
    }

    // ==================================================
    // ACCESS TOKEN EXPIRED
    // ==================================================

    if (error.response?.status === 401) {
      originalRequest._retry = true;

      try {
        // Try to refresh the access token
        const newAccessToken =
          await refreshAccessToken();

        // ==================================================
        // REFRESH SUCCESSFUL
        // ==================================================

        if (newAccessToken) {
          originalRequest.headers =
            originalRequest.headers || {};

          originalRequest.headers.Authorization =
            `Bearer ${newAccessToken}`;

          // Retry the original request
          return api(originalRequest);
        }

      } catch (refreshError) {
        console.error(
          "Session refresh failed:",
          refreshError
        );
      }

      // ==================================================
      // REFRESH FAILED
      // ==================================================

      // Clear stored authentication data
      logoutUser();

      // Tell the application that the session has expired
      window.dispatchEvent(
        new Event("session-expired")
      );

      return Promise.reject(error);
    }

    return Promise.reject(error);
  }
);

export default api;