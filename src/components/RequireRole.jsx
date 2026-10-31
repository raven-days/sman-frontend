import { Navigate, useLocation } from "react-router-dom";
import { useApp } from "../context/AppState";
import Forbidden from "../pages/Forbidden";

export default function RequireRole({ roles, children }) {
  const { user } = useApp();
  const loc = useLocation();
  if (!user) return <Navigate to="/login" state={{ from: loc.pathname }} replace />;
  if (roles && !roles.includes(user.role)) return <Forbidden />;
  return children;
}
