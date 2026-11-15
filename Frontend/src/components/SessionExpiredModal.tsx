import { useEffect, useState } from "react";
import { useLocation } from "react-router-dom";
import { Button, Modal } from "antd";
import { ensureValidSession, getAccessToken, getRefreshToken, isAccessTokenExpiring, logoutUser } from "../utils/auth";

const isPublicPath = (path: string) =>
  path === "/signin" ||
  path === "/signup" ||
  path.startsWith("/reset-password");

// Mount only once, inside <Router> and outside <Routes>.
export default function SessionExpiredModal() {
  const [expired, setExpired] = useState(false);
  const location = useLocation();

  useEffect(() => {
    const show = () => setExpired(true);
    window.addEventListener("session-expired", show);
    return () => window.removeEventListener("session-expired", show);
  }, []);

  useEffect(() => {
    if (isPublicPath(location.pathname) || expired) return;

    const check = () => {
      if (!getAccessToken() && !getRefreshToken()) return;
      if (!isAccessTokenExpiring()) return;
      void ensureValidSession().catch((error) => {
        // Offline/temporary API error: keep login and let requests report it.
        console.warn("Session check postponed:", error);
      });
    };

    check(); // Route navigation
    window.addEventListener("focus", check); // Returning to browser tab
    document.addEventListener("visibilitychange", check);
    // Before interaction: only checks local JWT expiry; network request only if due.
    document.addEventListener("pointerdown", check, true);
    document.addEventListener("keydown", check, true);
    return () => {
      window.removeEventListener("focus", check);
      document.removeEventListener("visibilitychange", check);
      document.removeEventListener("pointerdown", check, true);
      document.removeEventListener("keydown", check, true);
    };
  }, [location.pathname, expired]);

  const goToLogin = () => {
    logoutUser();
    window.location.replace("/signin");
  };

  return (
    <Modal
      open={expired}
      centered
      title="Session Expired"
      closable={false}
      maskClosable={false}
      keyboard={false}
      width={420}
      footer={
        <Button type="primary" block onClick={goToLogin}>
          Login Again
        </Button>
      }
    >
      Your login session has expired. Please log in again to continue.
    </Modal>
  );
}
