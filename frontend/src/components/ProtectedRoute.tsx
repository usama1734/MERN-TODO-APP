import { ReactNode } from "react";
import { Navigate } from "react-router-dom";
import { getToken } from "../services/AuthService";

type Props = {
  children: ReactNode;
};

const ProtectedRoute = ({ children }: Props) => {
  if (!getToken()) {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
};

export default ProtectedRoute;
