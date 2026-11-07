import { Navigate, useLocation } from "react-router-dom";
import { useApp } from "../context/AppState";
import Forbidden from "../pages/Forbidden";

// roles: daftar peran yang boleh. izin: nama modul yang dibutuhkan. admin: khusus admin.
export default function RequireRole({ roles, izin, admin, children }) {
  const { user } = useApp();
  const loc = useLocation();
  if (!user) return <Navigate to="/login" state={{ from: loc.pathname }} replace />;
  // Sandi sementara: wajib diganti dulu sebelum membuka halaman lain.
  if (user.wajib_ganti_sandi && loc.pathname !== "/ganti-sandi") return <Navigate to="/ganti-sandi" replace />;
  if (roles && !roles.includes(user.role)) return <Forbidden />;
  if (admin && !user.is_admin) return <Forbidden />;
  if (izin && !(user.izin || []).includes(izin)) return <Forbidden />;
  return children;
}