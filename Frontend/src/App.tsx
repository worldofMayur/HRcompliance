import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import { useEffect } from "react";

import SignIn from "./pages/AuthPages/SignIn";
import SignUp from "./pages/AuthPages/SignUp";
import NotFound from "./pages/OtherPage/NotFound";
import UserProfiles from "./pages/UserProfiles";
import Videos from "./pages/UiElements/Videos";
import Images from "./pages/UiElements/Images";
import Alerts from "./pages/UiElements/Alerts";
import Badges from "./pages/UiElements/Badges";
import Avatars from "./pages/UiElements/Avatars";
import Buttons from "./pages/UiElements/Buttons";
import LineChart from "./pages/Charts/LineChart";
import BarChart from "./pages/Charts/BarChart";
import Calendar from "./pages/Calendar";
import BasicTables from "./pages/Tables/BasicTables";
import FormElements from "./pages/Forms/FormElements";
import Blank from "./pages/Blank";
import AppLayout from "./layout/AppLayout";
import { ScrollToTop } from "./components/common/ScrollToTop";
import AuditorDashboard from "./pages/Auditor/AuditorDashboard";
import AuditorNotifications from "./pages/Auditor/AuditorNotifications";
import Home from "./pages/Dashboard/Home";
import ProtectedRoute from "./routes/ProtectedRoute";
import PublicRoute from "./routes/PublicRoute";
import ManageCCEmails from "./pages/CCEmailInput";
import { logActiveSession } from "./utils/SessionLogger";

import PrincipleEmployeeForm from "./pages/Forms/PrincipleEmployeeForm";
import VendorForm from "./pages/Forms/VendorForm";
import AuditorForm from "./pages/Forms/AuditorForm";
import ResetPassword from "./pages/AuthPages/ResetPassword";
import ResetPasswordExpired from "./pages/AuthPages/ResetPasswordExpired";

import AuditChecklist from "./pages/Forms/AuditChecklist";
import "antd/dist/reset.css";
import VendorNotifications from "./pages/VendorNotifications";

import Documents from "./pages/Forms/Documents";
import VendorMapping from "./pages/Forms/VendorMapping";

import VendorCompliancePage from "./pages/VendorCompliancePage";

import ManageVendor from "./pages/PrincipleEmployee/ManageVendor";
import Notifications from "./pages/PrincipleEmployee/Notifications";
import FreezeAuditReports from "./pages/Auditor/FreezeAuditReports";

export default function App() {
  useEffect(() => {
    logActiveSession();
  }, []);

  return (
    <Router basename="/TailAdmin">
      <ScrollToTop />

      <Routes>

        {/* ROOT */}
        <Route
          path="/"
          element={
            localStorage.getItem("access_token") ? (
              <Navigate to="/dashboard" replace />
            ) : (
              <Navigate to="/signin" replace />
            )
          }
        />

        {/* AUTH */}
        <Route
          path="/signin"
          element={
            <PublicRoute>
              <SignIn />
            </PublicRoute>
          }
        />

        <Route path="/signup" element={<SignUp />} />

        {/* RESET PASSWORD */}
        <Route
          path="/reset-password/:uid/:token"
          element={<ResetPassword />}
        />

        <Route
          path="/reset-password-expired"
          element={<ResetPasswordExpired />}
        />

        {/* ================= DASHBOARD ================= */}
        <Route
          path="/"
          element={
            <ProtectedRoute>
              <AppLayout />
            </ProtectedRoute>
          }
        >
          <Route index element={<Home />} />
          <Route path="dashboard" element={<Home />} />

          <Route
            path="auditor-dashboard"
            element={
              <ProtectedRoute allowedRoles={["AUDITOR"]}>
                <AuditorDashboard />
              </ProtectedRoute>
            }
          />

          <Route
            path="auditor-notifications"
            element={
              <ProtectedRoute allowedRoles={["AUDITOR"]}>
                <AuditorNotifications />
              </ProtectedRoute>
            }
          />

          <Route
            path="freeze-audit-reports"
            element={
              <ProtectedRoute allowedRoles={["AUDITOR"]}>
                <FreezeAuditReports />
              </ProtectedRoute>
            }
          />

          {/* CORE */}
          <Route path="profile" element={<UserProfiles />} />
          <Route path="calendar" element={<Calendar />} />
          <Route path="blank" element={<Blank />} />
          <Route path="form-elements" element={<FormElements />} />

          {/* ================= COMPLIANCE ================= */}

          {/* SUPERADMIN */}
          <Route
            path="principle-employee"
            element={
              <ProtectedRoute allowedRoles={["SUPERADMIN"]}>
                <PrincipleEmployeeForm />
              </ProtectedRoute>
            }
          />

          <Route
            path="vendor-notifications"
            element={<VendorNotifications />}
          />

          <Route
            path="vendor"
            element={
              <ProtectedRoute allowedRoles={["SUPERADMIN"]}>
                <VendorForm />
              </ProtectedRoute>
            }
          />

          <Route
            path="auditor"
            element={
              <ProtectedRoute allowedRoles={["SUPERADMIN"]}>
                <AuditorForm />
              </ProtectedRoute>
            }
          />

          <Route
            path="audit-checklist"
            element={
              <ProtectedRoute allowedRoles={["SUPERADMIN"]}>
                <AuditChecklist />
              </ProtectedRoute>
            }
          />

          <Route
            path="documents"
            element={
              <ProtectedRoute allowedRoles={["SUPERADMIN"]}>
                <Documents />
              </ProtectedRoute>
            }
          />

          {/* ================= PE ================= */}

          <Route
            path="vendor-mapping"
            element={
              <ProtectedRoute allowedRoles={["PE"]}>
                <VendorMapping />
              </ProtectedRoute>
            }
          />

          <Route
            path="manage-vendor"
            element={
              <ProtectedRoute allowedRoles={["PE"]}>
                <ManageVendor />
              </ProtectedRoute>
            }
          />

          <Route
            path="vendor-notifications"
            element={
              <ProtectedRoute allowedRoles={["PE"]}>
                <Notifications />
              </ProtectedRoute>
            }
          />

          {/* ================= VENDOR ================= */}

          <Route
            path="vendor-compliance"
            element={
              <ProtectedRoute allowedRoles={["VENDOR"]}>
                <VendorCompliancePage />
              </ProtectedRoute>
            }
          />

          <Route
            path="manage-cc-emails"
            element={
              <ProtectedRoute allowedRoles={["VENDOR"]}>
                <ManageCCEmails />
              </ProtectedRoute>
            }
          />

          {/* ================= UI ================= */}

          <Route path="basic-tables" element={<BasicTables />} />
          <Route path="alerts" element={<Alerts />} />
          <Route path="avatars" element={<Avatars />} />
          <Route path="badge" element={<Badges />} />
          <Route path="buttons" element={<Buttons />} />
          <Route path="images" element={<Images />} />
          <Route path="videos" element={<Videos />} />
          <Route path="line-chart" element={<LineChart />} />
          <Route path="bar-chart" element={<BarChart />} />
        </Route>

        {/* 404 */}
        <Route path="*" element={<NotFound />} />

      </Routes>
    </Router>
  );
}