import { Navigate } from "react-router-dom";
import { isAuthenticated } from "../utils/auth";

interface Props {
  children: JSX.Element;
  allowedRoles?: string[];
}

export default function ProtectedRoute({
  children,
  allowedRoles,
}: Props) {
  const token = isAuthenticated();
  const role = localStorage.getItem("role");

  // NOT LOGGED IN
  if (!token) {
    return <Navigate to="/signin" replace />;
  }

  // ROLE CHECK
  if (
    allowedRoles &&
    role &&
    !allowedRoles.includes(role)
  ) {
    return <Navigate to="/" replace />;
  }

  return children;
}