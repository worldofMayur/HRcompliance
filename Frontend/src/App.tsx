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
import Documents from "./pages/Forms/Documents";

export default function App() {
  useEffect(() => {
    logActiveSession();
  }, []);

  return (
    <Router>
      <ScrollToTop />

      <Routes>
        {/* ROOT */}
        <Route path="/" element={<Navigate to="/TailAdmin/" replace />} />

        {/* AUTH ROUTES */}
        <Route
          path="/TailAdmin/signin"
          element={
            <PublicRoute>
              <SignIn />
            </PublicRoute>
          }
        />
        <Route path="/TailAdmin/signup" element={<SignUp />} />

        {/* RESET PASSWORD */}
        <Route
          path="/TailAdmin/reset-password/:uid/:token"
          element={<ResetPassword />}
        />
        <Route
          path="/reset-password-expired"
          element={<ResetPasswordExpired />}
        />

        {/* ================= MAIN SUPERADMIN DASHBOARD ================= */}
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

          {/* COMPLIANCE MODULES */}
          <Route path="principle-employee" element={<PrincipleEmployeeForm />} />
          <Route path="vendor" element={<VendorForm />} />
          <Route path="auditor" element={<AuditorForm />} />

          {/* EXTRA */}
          <Route path="audit-checklist" element={<AuditChecklist />} />
          <Route path="documents" element={<Documents />} />

          {/* UI / MISC */}
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

        {/* UNAUTHORIZED */}

        {/* FALLBACK */}
        <Route path="*" element={<NotFound />} />
      </Routes>
    </Router>
  );
}
