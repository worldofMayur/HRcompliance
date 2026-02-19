import { Navigate } from "react-router";

interface Props {
  children: JSX.Element;
}

export default function PublicRoute({ children }: Props) {
  const token = localStorage.getItem("access_token");

  if (token) {
    return <Navigate to="/TailAdmin/" replace />;
  }

  return children;
}
