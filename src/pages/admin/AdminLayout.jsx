import { NavLink, Outlet } from "react-router-dom";
import { Squares2X2Icon, ScaleIcon, UsersIcon, MegaphoneIcon, ClipboardDocumentListIcon } from "@heroicons/react/24/outline";
import { DEMO } from "../../lib/api";


const MENU = [
  { to: "/admin", label: "Dashboard", icon: Squares2X2Icon, end: true },
  { to: "/admin/sk", label: "Kelola SK", icon: ScaleIcon },
  { to: "/admin/pegawai", label: "Kelola Pegawai", icon: UsersIcon },
  { to: "/admin/pengumuman", label: "Kelola Pengumuman", icon: MegaphoneIcon },
  { to: "/petugas", label: "Antrian Pengajuan", icon: ClipboardDocumentListIcon },
];

export default function AdminLayout() {
  return (
    <div className="mx-auto grid max-w-[1200px] gap-6 px-5 py-10 sm:px-8 md:grid-cols-[220px_1fr]">
      <aside>
        <p className="text-xs font-bold uppercase tracking-widest text-primary">Dashboard admin</p>
        <nav className="mt-3 flex gap-2 overflow-x-auto md:flex-col">
          {MENU.map((m) => (
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
            Mode demo: dashboard admin membutuhkan backend (Laravel). Data di halaman ini tidak tersedia pada versi demo.
          </p>
        )}
        <Outlet />
      </section>
    </div>
  );
}