import { useState } from "react";
import {
  Bars3Icon,
  XMarkIcon,
  MagnifyingGlassIcon,
  ChevronDownIcon,
} from "@heroicons/react/24/outline";

import logoSMA from "../assets/logo.jpg";

const SCHOOL = {
  name: "SMA Negeri 104 Jakarta",
  tagline: "Berkarakter, Berprestasi, dan Berwawasan Global",
};

const MENU = [
  { label: "Beranda", href: "/" },
  {
    label: "Profil",
    children: [
      { label: "Tentang Sekolah", href: "/profil/tentang" },
      { label: "Sejarah", href: "/profil/sejarah" },
      { label: "Visi dan Misi", href: "/profil/visi-misi" },
      { label: "Sambutan Kepala Sekolah", href: "/profil/sambutan" },
      { label: "Struktur Organisasi", href: "/profil/struktur-organisasi" },
    ],
  },
  {
    label: "Akademik",
    children: [
      { label: "Program Pembelajaran", href: "/akademik/program-pembelajaran" },
      { label: "Mata Pelajaran", href: "/akademik/mata-pelajaran" },
      { label: "Jadwal Pelajaran", href: "/akademik/jadwal-pelajaran" },
      { label: "Informasi Akademik", href: "/akademik/informasi-akademik" },
    ],
  },
  {
    label: "Kepegawaian",
    children: [
      { label: "Data Pegawai", href: "/kepegawaian/data-pegawai" },
      { label: "Guru", href: "/kepegawaian/guru" },
      { label: "Tenaga Kependidikan", href: "/kepegawaian/tenaga-kependidikan" },
      { label: "Jabatan & Struktur", href: "/kepegawaian/jabatan-struktur" },
      { label: "Riwayat & Laporan", href: "/kepegawaian/riwayat-laporan" },
    ],
  },
  {
    label: "Kesiswaan",
    children: [
      { label: "OSIS", href: "/kesiswaan/osis" },
      { label: "Ekstrakurikuler", href: "/kesiswaan/ekstrakurikuler" },
      { label: "Prestasi", href: "/kesiswaan/prestasi" },
      { label: "Kegiatan Siswa", href: "/kesiswaan/kegiatan-siswa" },
      { label: "Galeri", href: "/kesiswaan/galeri" },
      { label: "Tata Tertib", href: "/kesiswaan/tata-tertib" },
    ],
  },
  {
    label: "Layanan",
    align: "right",
    children: [
      { label: "Kesiswaan", href: "/layanan/kesiswaan" },
      { label: "Administrasi / TU", href: "/layanan/administrasi" },
      { label: "Sarana & Prasarana", href: "/layanan/sarana-prasarana" },
      { label: "Kepegawaian", href: "/layanan/kepegawaian" },
    ],
  },
  {
    label: "Sarana & Prasarana",
    children: [
      { label: "Gedung", href: "/sarana-prasarana/gedung" },
      { label: "Ruangan", href: "/sarana-prasarana/ruangan" },
      { label: "Fasilitas", href: "/sarana-prasarana/fasilitas" },
      { label: "Inventaris", href: "/sarana-prasarana/inventaris" },
      { label: "Pemeliharaan", href: "/sarana-prasarana/pemeliharaan" },
      { label: "Peminjaman", href: "/sarana-prasarana/peminjaman" },
    ],
  },
  { label: "Berita", href: "/berita" },
  { label: "Kontak", href: "/kontak" },
];

/* ================= HELPERS ================= */
const isActive = (item, path) =>
  item.children
    ? item.children.some((c) => path.startsWith(c.href))
    : item.href === "/"
    ? path === "/"
    : path.startsWith(item.href);

const desktopLink =
  "relative flex items-center gap-1 rounded-lg px-3 py-2 text-[13px] font-medium text-[#12395f] transition-colors hover:bg-blue-50 hover:text-[#0878d1]";
const activeLine =
  "after:absolute after:inset-x-3 after:-bottom-1 after:h-0.5 after:rounded-full after:bg-[#0878d1]";

/* ================= DESKTOP ITEM ================= */
function DesktopItem({ item, path }) {
  const active = isActive(item, path);
  const cls = `${desktopLink} ${active ? `${activeLine} text-[#0878d1]` : ""}`;

  if (!item.children) {
    return (
      <a href={item.href} className={cls}>
        {item.label}
      </a>
    );
  }

  const side = item.align === "right" ? "right-0" : "left-0";

  return (
    <div className="group relative">
      <button type="button" className={cls}>
        {item.label}
        <ChevronDownIcon className="h-3.5 w-3.5" />
      </button>

      <div
        className={`invisible absolute ${side} top-full z-50 w-60 translate-y-2 pt-2 opacity-0 transition-all duration-200 group-focus-within:visible group-focus-within:translate-y-0 group-focus-within:opacity-100 group-hover:visible group-hover:translate-y-0 group-hover:opacity-100`}
      >
        <div className="rounded-xl border border-slate-200 bg-white p-2 shadow-xl">
          {item.children.map((child) => (
            <a
              key={child.href}
              href={child.href}
              className="block rounded-lg px-3 py-2 text-[13px] text-[#12395f] hover:bg-blue-50 hover:text-[#0878d1]"
            >
              {child.label}
            </a>
          ))}
        </div>
      </div>
    </div>
  );
}

/* ================= MOBILE ITEM ================= */
function MobileItem({ item, path }) {
  const active = isActive(item, path);
  const base =
    "rounded-lg px-4 py-3 hover:bg-blue-50 " + (active ? "text-[#0878d1]" : "");

  if (!item.children) {
    return (
      <a href={item.href} className={`block ${base}`}>
        {item.label}
      </a>
    );
  }

  return (
    <details className="group">
      <summary
        className={`flex cursor-pointer list-none items-center justify-between ${base}`}
      >
        {item.label}
        <ChevronDownIcon className="h-4 w-4 transition-transform group-open:rotate-180" />
      </summary>
      <div className="ml-4 flex flex-col border-l border-blue-100 pl-3">
        {item.children.map((child) => (
          <a
            key={child.href}
            href={child.href}
            className="px-4 py-2.5 text-slate-600 hover:text-[#0878d1]"
          >
            {child.label}
          </a>
        ))}
      </div>
    </details>
  );
}

function Navbar() {
  const [open, setOpen] = useState(false);
  const path = typeof window !== "undefined" ? window.location.pathname : "/";

  return (
    <nav className="sticky top-0 z-50 w-full border-b border-slate-200 bg-white shadow-sm">
      <div className="mx-auto flex min-h-[72px] max-w-[1440px] items-center justify-between gap-4 px- sm:px-6 lg:px-8">
        {/* Logo */}
        <a href="/" className="flex min-w-0 items-center gap-3">
          <img
            src={logoSMA}
            alt={`Logo ${SCHOOL.name}`}
            className="h-11 w-11 shrink-0 object-contain"
          />
          <div className="min-w-0 leading-tight">
            <p className="truncate text-sm font-bold text-[#12395f] sm:text-base">
              {SCHOOL.name}
            </p>
            <p className="hidden truncate text-[10px] text-slate-500 sm:block">
              {SCHOOL.tagline}
            </p>
          </div>
        </a>

        {/* Menu desktop */}
        <div className="hidden items-center gap-0.5 xl:flex">
          {MENU.map((item) => (
            <DesktopItem key={item.label} item={item} path={path} />
          ))}
        </div>

        {/* Kanan: search, login, hamburger */}
        <div className="flex items-center gap-2">
          <button
            type="button"
            aria-label="Cari"
            className="flex h-9 w-9 items-center justify-center rounded-lg bg-blue-50 text-[#12395f] hover:bg-blue-100"
          >
            <MagnifyingGlassIcon className="h-4 w-4" />
          </button>

          <a
            href="/login"
            className="hidden rounded-lg bg-[#0878d1] px-5 py-2 text-sm font-semibold text-white transition-colors hover:bg-[#0564ad] sm:block"
          >
            Login
          </a>

          <button
            type="button"
            onClick={() => setOpen(!open)}
            aria-label="Buka/tutup menu"
            aria-expanded={open}
            className="rounded-lg p-2 text-[#12395f] hover:bg-blue-50 xl:hidden"
          >
            {open ? (
              <XMarkIcon className="h-7 w-7" />
            ) : (
              <Bars3Icon className="h-7 w-7" />
            )}
          </button>
        </div>
      </div>

      {/* Menu mobile */}
      <div
        className={`overflow-hidden border-t border-slate-200 bg-white transition-all duration-300 xl:hidden ${
          open ? "max-h-[calc(100vh-72px)] overflow-y-auto" : "max-h-0 border-t-0"
        }`}
      >
        <div className="flex flex-col gap-1 px-5 py-5 text-sm font-medium text-[#12395f]">
          {MENU.map((item) => (
            <MobileItem key={item.label} item={item} path={path} />
          ))}
          <a
            href="/login"
            className="mt-3 rounded-lg bg-[#0878d1] px-4 py-3 text-center font-semibold text-white hover:bg-[#0564ad] sm:hidden"
          >
            Login
          </a>
        </div>
      </div>
    </nav>
  );
}

export default Navbar;