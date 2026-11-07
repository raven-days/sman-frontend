import { NavLink, Outlet } from "react-router-dom";
import { DEMO } from "../../lib/api";
import { useApp } from "../../context/AppState";

// menu: [{ to, label, icon, end?, izin?, admin? }]
// izin: modul yang dibutuhkan. admin: khusus admin. Tanpa keduanya: semua petugas.
export default function PanelLayout({ judul, menu }) {
  const { user } = useApp();
  const boleh = (m) => {
    if (DEMO) return true;
    if (m.admin) return !!user?.is_admin;
    if (m.izin) return (user?.izin || []).includes(m.izin);
    return true;
  };

  return (
    <div className="mx-auto grid max-w-[1200px] gap-6 px-5 py-10 sm:px-8 md:grid-cols-[220px_1fr]">
      <aside className="min-w-0">
        <p className="text-xs font-bold uppercase tracking-widest text-primary">{judul}</p>
        <nav className="mt-3 flex gap-2 overflow-x-auto md:flex-col">
          {menu.filter(boleh).map((m) => (
            <NavLink
              key={m.to}
              to={m.to}
              end={m.end}
              className={({ isActive }) =>
                `flex shrink-0 items-center gap-2 rounded-lg px-3 py-2.5 text-sm font-semibold ${
                  isActive ? "bg-primary text-white" : "text-navy hover:bg-blue-50"
                }`
              }
            >
              <m.icon className="h-5 w-5" /> {m.label}
            </NavLink>
          ))}
        </nav>
      </aside>
      <section className="min-w-0">
        {DEMO && (
          <p className="mb-5 rounded-lg border border-orange-300 bg-orange-50 px-4 py-3 text-sm text-orange-900">
            Mode demo: dashboard membutuhkan backend (Laravel). Data di halaman ini tidak tersedia pada versi demo.
          </p>
        )}
        <Outlet />
      </section>
    </div>
  );
}