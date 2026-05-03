import { Navigate } from "react-router-dom";
import { isAuthenticated } from "../utils/auth";

interface Props {
  children: JSX.Element;
}

export default function PublicRoute({
  children,
}: Props) {
  const authenticated = isAuthenticated();

  if (authenticated) {
    return <Navigate to="/" replace />;
  }

  return children;
}