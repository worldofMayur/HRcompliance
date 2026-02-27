import { Navigate } from "react-router";

interface Props {
  children: JSX.Element;
  allowedRoles?: string[];
}

export default function ProtectedRoute({ children, allowedRoles }: Props) {
  const token = localStorage.getItem("access_token");
  const role = localStorage.getItem("role");

  // Not logged in
  if (!token) {
    return <Navigate to="/TailAdmin/signin" replace />;
  }

  // Role restriction
  if (allowedRoles && role && !allowedRoles.includes(role)) {
    return <Navigate to="/TailAdmin/" replace />;
  }

  return children;
}
