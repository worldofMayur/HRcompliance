import axios from "axios";

const API_BASE_URL = import.meta.env.VITE_API_URL;

export const clearAuthData = () => {
  localStorage.removeItem("access_token");
  localStorage.removeItem("refresh_token");
  localStorage.removeItem("username");
  localStorage.removeItem("email");
  localStorage.removeItem("role");
  localStorage.removeItem("principal_employer_id");
  localStorage.removeItem("principal_employer_name");
};

export const getAccessToken = () => {
  return localStorage.getItem("access_token");
};

export const getRefreshToken = () => {
  return localStorage.getItem("refresh_token");
};

export const isAuthenticated = () => {
  return !!getAccessToken();
};

export const logoutUser = () => {
  clearAuthData();

  window.dispatchEvent(new Event("auth-changed"));
};

export const refreshAccessToken = async () => {
  try {
    const refresh = getRefreshToken();

    if (!refresh) {
      return null;
    }

    const response = await axios.post(
      `${API_BASE_URL}/api/token/refresh/`,
      {
        refresh,
      }
    );

    const newAccess = response.data?.access;
    const newRefresh = response.data?.refresh;

    if (!newAccess) {
      return null;
    }

    // Save new access token
    localStorage.setItem(
      "access_token",
      newAccess
    );

    // IMPORTANT:
    // Because ROTATE_REFRESH_TOKENS=True,
    // save the new refresh token when Django sends one.
    if (newRefresh) {
      localStorage.setItem(
        "refresh_token",
        newRefresh
      );
    }

    return newAccess;

  } catch (error) {

    console.error(
      "Refresh token failed:",
      error
    );

    return null;
  }
};