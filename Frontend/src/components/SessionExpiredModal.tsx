import { useEffect, useState } from "react";
import { useLocation } from "react-router-dom";
import { Alert, Button, Modal, Typography } from "antd";
import {
  ensureValidSession,
  getAccessToken,
  getRefreshToken,
  isAccessTokenExpiring,
  logoutUser,
} from "../utils/auth";

const { Text, Paragraph } = Typography;

const isPublicPath = (path: string) =>
  path === "/signin" ||
  path === "/signup" ||
  path.startsWith("/reset-password");

/** Mount once inside <Router>, above <Routes>. */
export default function SessionExpiredModal() {
  const [expired, setExpired] = useState(false);
  const location = useLocation();

  useEffect(() => {
    const showExpiryMessage = () => setExpired(true);
    window.addEventListener("session-expired", showExpiryMessage);
    return () =>
      window.removeEventListener("session-expired", showExpiryMessage);
  }, []);

  useEffect(() => {
    if (isPublicPath(location.pathname) || expired) return;

    const checkSession = () => {
      if (!getAccessToken() && !getRefreshToken()) return;
      if (!isAccessTokenExpiring()) return;

      void ensureValidSession().catch((error) => {
        // A temporary network failure is not proof of session expiration.
        console.warn("Session verification temporarily unavailable:", error);
      });
    };

    const checkWhenVisible = () => {
      if (document.visibilityState === "visible") checkSession();
    };

    checkSession();
    window.addEventListener("focus", checkSession);
    document.addEventListener("visibilitychange", checkWhenVisible);
    document.addEventListener("pointerdown", checkSession, true);
    document.addEventListener("keydown", checkSession, true);

    return () => {
      window.removeEventListener("focus", checkSession);
      document.removeEventListener("visibilitychange", checkWhenVisible);
      document.removeEventListener("pointerdown", checkSession, true);
      document.removeEventListener("keydown", checkSession, true);
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
      closable={false}
      maskClosable={false}
      keyboard={false}
      width={440}
      destroyOnClose
      title={
        <div style={{ display: "flex", alignItems: "center", gap: 12, paddingTop: 4 }}>
          <span
            aria-hidden="true"
            style={{
              display: "inline-flex",
              alignItems: "center",
              justifyContent: "center",
              width: 42,
              height: 42,
              borderRadius: 12,
              background: "#fff1f0",
              fontSize: 23,
            }}
          >
            🔒
          </span>
          <span style={{ display: "flex", flexDirection: "column", gap: 2 }}>
            <span style={{ fontSize: 18, fontWeight: 650 }}>Your session has expired</span>
            <Text type="secondary" style={{ fontSize: 12, fontWeight: 400 }}>
              Authentication required
            </Text>
          </span>
        </div>
      }
      footer={
        <div style={{ paddingTop: 6 }}>
          <Button
            type="primary"
            size="large"
            block
            onClick={goToLogin}
            style={{ height: 44, borderRadius: 9, fontWeight: 600 }}
          >
            Login Again
          </Button>
          <Text type="secondary" style={{ display: "block", marginTop: 12, textAlign: "center", fontSize: 12 }}>
            Sign in to continue working securely.
          </Text>
        </div>
      }
    >
      <Paragraph style={{ color: "#475467", lineHeight: 1.7, marginTop: 12 }}>
        Your login session is no longer active. For security reasons, please sign in
        again to continue using the Compliance Management Portal.
      </Paragraph>

      <Alert
        type="warning"
        showIcon
        message="Before you continue"
        description="Any unsaved changes, including selected documents and payroll details, may be lost when you sign in again."
        style={{ borderRadius: 10, marginTop: 16 }}
      />
    </Modal>
  );
}
