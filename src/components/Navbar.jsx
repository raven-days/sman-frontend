import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import {
  Bars3Icon,
  XMarkIcon,
  ChevronDownIcon,
  ArrowUpRightIcon,
  UserCircleIcon,
} from "@heroicons/react/24/outline";

import logoSMA from "../assets/logo.jpg";
import { SERVICES } from "../data/content";
import { useApp } from "../context/AppState";

/* ================= DATA ================= */
const SITE = {
  name: "Layanan Tata Usaha",
  school: "SMA Negeri 104 Jakarta",
  // Ganti dengan alamat website sekolah yang sebenarnya
  schoolWebsite: "#",
};

// Logo wajib. Isi `src` setelah file resmi didapat (import dari src/assets).
// Selama `src` kosong, tampil kotak penanda.
const LOGOS = [
  { alt: "Logo SMA Negeri 104 Jakarta", src: logoSMA },
  { alt: "Logo Tut Wuri Handayani", label: "Tut Wuri Handayani", src: null },
  { alt: "Logo +Jakarta", label: "+Jakarta", src: null },
];

const MENU = [
  { label: "Beranda", href: "/" },
  {
    label: "Layanan",
    href: "/layanan",
    children: SERVICES.map((s) => ({ label: s.title, href: `/layanan/${s.slug}` })),
  },
  { label: "Surat Keputusan", href: "/surat-keputusan" },
  { label: "Cek Status", href: "/cek-status" },
  { label: "Denah Sekolah", href: "/denah" },
  { label: "Pengumuman", href: "/pengumuman" },
  { label: "Kontak", href: "/kontak" },
];

/* ================= HELPERS ================= */
const isActive = (item, path) => {
  if (item.href === "/") return path === "/";
  return path === item.href || path.startsWith(item.href + "/");
};

const linkBase =
  "relative flex items-center gap-1 whitespace-nowrap rounded-lg px-2.5 py-2 text-[13px] font-medium transition-colors hover:bg-blue-50 hover:text-primary";
const activeLine =
  "after:absolute after:inset-x-2.5 after:-bottom-1 after:h-0.5 after:rounded-full after:bg-primary";

function LogoMark({ logo, size = "h-10 w-10" }) {
  if (logo.src) {
    return <img src={logo.src} alt={logo.alt} className={`${size} shrink-0 object-contain`} />;
  }
  return (
    <span
      role="img"
      aria-label={logo.alt}
      className={`${size} flex shrink-0 items-center justify-center rounded-lg border border-dashed border-slate-300 px-0.5 text-center text-[8px] font-semibold leading-tight text-slate-400`}
    >
      {logo.label}
    </span>
  );
}

/* ================= DESKTOP ITEM ================= */
function DesktopItem({ item, path }) {
  const active = isActive(item, path);
  const cls = `${linkBase} ${active ? `${activeLine} text-primary` : "text-navy"}`;

  if (!item.children) {
    return (
      <Link to={item.href} className={cls}>
        {item.label}
      </Link>
    );
  }

  return (
    <div className="group relative">
      <Link to={item.href} className={cls}>
        {item.label}
        <ChevronDownIcon className="h-3.5 w-3.5" />
      </Link>

      <div className="invisible absolute left-0 top-full z-50 w-64 translate-y-2 pt-2 opacity-0 transition-all duration-200 group-focus-within:visible group-focus-within:translate-y-0 group-focus-within:opacity-100 group-hover:visible group-hover:translate-y-0 group-hover:opacity-100">
        <div className="rounded-xl border border-line bg-white p-2 shadow-xl">
          {item.children.map((child) => (
            <Link
              key={child.href}
              to={child.href}
              className="block rounded-lg px-3 py-2 text-[13px] text-navy hover:bg-blue-50 hover:text-primary"
            >
              {child.label}
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}

/* ================= MOBILE ITEM ================= */
function MobileItem({ item, path, onNavigate }) {
  const active = isActive(item, path);
  const base = "rounded-lg px-4 py-3 hover:bg-blue-50 " + (active ? "text-primary" : "");

  if (!item.children) {
    return (
      <Link to={item.href} onClick={onNavigate} className={`block ${base}`}>
        {item.label}
      </Link>
    );
  }

  return (
    <details className="group">
      <summary className={`flex cursor-pointer list-none items-center justify-between ${base}`}>
        {item.label}
        <ChevronDownIcon className="h-4 w-4 transition-transform group-open:rotate-180" />
      </summary>
      <div className="ml-4 flex flex-col border-l border-blue-100 pl-3">
        <Link to={item.href} onClick={onNavigate} className="px-4 py-2.5 text-slate-600 hover:text-primary">
          Semua layanan
        </Link>
        {item.children.map((child) => (
          <Link
            key={child.href}
            to={child.href}
            onClick={onNavigate}
            className="px-4 py-2.5 text-slate-600 hover:text-primary"
          >
            {child.label}
          </Link>
        ))}
      </div>
    </details>
  );
}

/* ================= NAVBAR ================= */
function Navbar() {
  const [open, setOpen] = useState(false);
  const { pathname: path } = useLocation();
  const { user, dispatch } = useApp();
  const navigate = useNavigate();
  const close = () => setOpen(false);

  const logout = () => {
    close();
    dispatch({ type: "LOGOUT" });
    navigate("/");
  };

  return (
    <header className="sticky top-0 z-50 w-full">
      {/* Bar atas: kembali ke website sekolah */}
      <div className="bg-navy">
        <div className="mx-auto flex max-w-[1440px] justify-end px-4 py-1.5 sm:px-6 lg:px-8">
          <a
            href={SITE.schoolWebsite}
            className="inline-flex items-center gap-1 text-[13px] font-medium text-blue-100 hover:text-white"
          >
            Kembali ke Website Sekolah
            <ArrowUpRightIcon className="h-3.5 w-3.5" />
          </a>
        </div>
      </div>

      <nav className="border-b border-line bg-white shadow-sm">
        <div className="mx-auto flex min-h-[72px] max-w-[1440px] items-center justify-between gap-3 px-4 sm:px-6 lg:px-8">
          {/* Logo + nama */}
          <Link to="/" onClick={close} className="flex min-w-0 items-center gap-3">
            <div className="flex shrink-0 items-center gap-1.5">
              {LOGOS.map((logo, i) => (
                <span key={logo.alt} className={i === 0 ? "" : "hidden md:block"}>
                  <LogoMark logo={logo} />
                </span>
              ))}
            </div>
            <span className="hidden h-9 w-px bg-line sm:block" />
            <div className="min-w-0 leading-tight">
              <p className="truncate text-sm font-bold text-navy sm:text-base">{SITE.name}</p>
              <p className="truncate text-[11px] text-slate-500 sm:text-xs">{SITE.school}</p>
            </div>
          </Link>

          {/* Menu desktop */}
          <div className="hidden items-center xl:flex">
            {MENU.map((item) => (
              <DesktopItem key={item.label} item={item} path={path} />
            ))}
          </div>

          {/* Kanan: akun + hamburger */}
          <div className="flex shrink-0 items-center gap-2">
            {user ? (
              <>
                <Link
                  to="/akun"
                  className="hidden items-center gap-1.5 rounded-lg bg-primary px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-primary-dark sm:inline-flex"
                >
                  <UserCircleIcon className="h-5 w-5" />
                  Akun Saya
                </Link>
                <button
                  type="button"
                  onClick={logout}
                  className="hidden rounded-lg border border-line px-3 py-2.5 text-sm font-semibold text-navy hover:bg-blue-50 sm:block"
                >
                  Keluar
                </button>
              </>
            ) : (
              <Link
                to="/login"
                className="hidden rounded-lg bg-primary px-6 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-primary-dark sm:block"
              >
                Masuk
              </Link>
            )}

            <button
              type="button"
              onClick={() => setOpen(!open)}
              aria-label="Buka/tutup menu"
              aria-expanded={open}
              className="rounded-lg p-2 text-navy hover:bg-blue-50 xl:hidden"
            >
              {open ? <XMarkIcon className="h-7 w-7" /> : <Bars3Icon className="h-7 w-7" />}
            </button>
          </div>
        </div>

        {/* Menu mobile */}
        <div
          className={`overflow-hidden border-t border-line bg-white transition-all duration-300 xl:hidden ${
            open ? "max-h-[calc(100vh-110px)] overflow-y-auto" : "max-h-0 border-t-0"
          }`}
        >
          <div className="flex flex-col gap-1 px-5 py-5 text-sm font-medium text-navy">
            {MENU.map((item) => (
              <MobileItem key={item.label} item={item} path={path} onNavigate={close} />
            ))}
            {user ? (
              <div className="mt-3 grid grid-cols-2 gap-2 sm:hidden">
                <Link
                  to="/akun"
                  onClick={close}
                  className="rounded-lg bg-primary px-4 py-3 text-center font-semibold text-white hover:bg-primary-dark"
                >
                  Akun Saya
                </Link>
                <button
                  type="button"
                  onClick={logout}
                  className="rounded-lg border border-line px-4 py-3 font-semibold text-navy hover:bg-blue-50"
                >
                  Keluar
                </button>
              </div>
            ) : (
              <Link
                to="/login"
                onClick={close}
                className="mt-3 rounded-lg bg-primary px-4 py-3 text-center font-semibold text-white hover:bg-primary-dark sm:hidden"
              >
                Masuk
              </Link>
            )}
          </div>
        </div>
      </nav>
    </header>
  );
}

export default Navbar;
