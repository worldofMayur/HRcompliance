import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router";
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
import Home from "./pages/Dashboard/Home";

import ProtectedRoute from "./routes/ProtectedRoute";
import PublicRoute from "./routes/PublicRoute";

import { logActiveSession } from "./utils/SessionLogger";

import PrincipleEmployeeForm from "./pages/Forms/PrincipleEmployeeForm";
import VendorForm from "./pages/Forms/VendorForm";
import AuditorForm from "./pages/Forms/AuditorForm";
import ResetPassword from "./pages/AuthPages/ResetPassword";
import ResetPasswordExpired from "./pages/AuthPages/ResetPasswordExpired";

import AuditChecklist from "./pages/Forms/AuditChecklist";
import "antd/dist/reset.css";

import Documents from "./pages/Forms/Documents";
import VendorMapping from "./pages/Forms/VendorMapping";

// ✅ NEW IMPORT
import VendorCompliancePage from "./pages/VendorCompliancePage";

export default function App() {
  useEffect(() => {
    logActiveSession();
  }, []);

  return (
    <Router>
      <ScrollToTop />

      <Routes>
        <Route path="/" element={<Navigate to="/TailAdmin/" replace />} />

        {/* AUTH */}
        <Route
          path="/TailAdmin/signin"
          element={
            <PublicRoute>
              <SignIn />
            </PublicRoute>
          }
        />
        <Route path="/TailAdmin/signup" element={<SignUp />} />

        <Route
          path="/TailAdmin/reset-password/:uid/:token"
          element={<ResetPassword />}
        />
        <Route
          path="/reset-password-expired"
          element={<ResetPasswordExpired />}
        />

        {/* ================= DASHBOARD ================= */}
        <Route
          path="/TailAdmin/"
          element={
            <ProtectedRoute>
              <AppLayout />
            </ProtectedRoute>
          }
        >
          <Route index element={<Home />} />

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

          {/* PE ONLY */}
          <Route
            path="vendor-mapping"
            element={
              <ProtectedRoute allowedRoles={["PE"]}>
                <VendorMapping />
              </ProtectedRoute>
            }
          />

          {/* ✅ VENDOR ONLY */}
          <Route
            path="vendor-compliance"
            element={
              <ProtectedRoute allowedRoles={["VENDOR"]}>
                <VendorCompliancePage />
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

        <Route path="*" element={<NotFound />} />
      </Routes>
    </Router>
  );
}