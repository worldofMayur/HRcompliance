import axios from "axios";

const API_BASE_URL = "https://apii.complianceclearance.com";

export const clearAuthData = () => {
  localStorage.removeItem("access_token");
  localStorage.removeItem("refresh_token");
  localStorage.removeItem("username");
  localStorage.removeItem("email");
  localStorage.removeItem("role");
  localStorage.removeItem("principal_employer_id");
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
      logoutUser();
      return null;
    }

    const response = await axios.post(
      `${API_BASE_URL}/api/token/refresh/`,
      {
        refresh,
      }
    );

    const newAccess = response.data.access;

    localStorage.setItem("access_token", newAccess);

    return newAccess;
  } catch (error) {
    console.error("Refresh token failed:", error);

    logoutUser();

    return null;
  }
};