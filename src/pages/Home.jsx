import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  ArrowRightIcon,
  ArrowRightEndOnRectangleIcon,
  DocumentTextIcon,
  ClockIcon,
  ArrowDownTrayIcon,
  MagnifyingGlassIcon,
  ScaleIcon,
} from "@heroicons/react/24/outline";
import { SERVICES, STEPS, ANNOUNCEMENTS } from "../data/content";
import ServiceIcon from "../components/ServiceIcon";

const STEP_ICON = [ArrowRightEndOnRectangleIcon, DocumentTextIcon, ClockIcon, ArrowDownTrayIcon];

function HeroIllustration() {
  return (
    <svg viewBox="0 0 460 340" className="w-full max-w-[460px]" role="img" aria-label="Ilustrasi dokumen dengan centang dan gedung sekolah">
      <ellipse cx="230" cy="310" rx="200" ry="16" fill="#dbe9f8" />
      {/* gedung */}
      <rect x="250" y="130" width="170" height="170" rx="6" fill="#dbe9f8" />
      <rect x="236" y="110" width="198" height="30" rx="4" fill="#12395f" />
      <rect x="296" y="150" width="78" height="150" fill="#fff" />
      {[0, 1].map((r) =>
        [0, 1].map((c) => (
          <rect key={`${r}${c}`} x={310 + c * 36} y={165 + r * 44} width="22" height="26" fill="#a8c4e6" />
        ))
      )}
      <rect x="326" y="252" width="22" height="48" fill="#0878d1" />
      {/* tiang bendera */}
      <line x1="440" y1="60" x2="440" y2="300" stroke="#12395f" strokeWidth="3" />
      <rect x="440" y="60" width="32" height="10" fill="#d64545" />
      <rect x="440" y="70" width="32" height="10" fill="#fff" stroke="#e3e8ef" />
      {/* dokumen */}
      <g transform="rotate(-6 130 170)">
        <rect x="40" y="40" width="190" height="250" rx="14" fill="#fff" stroke="#e3e8ef" strokeWidth="2" />
        <rect x="40" y="40" width="190" height="44" rx="14" fill="#0878d1" />
        <rect x="60" y="106" width="130" height="10" rx="5" fill="#b9cbe6" />
        <rect x="60" y="130" width="100" height="10" rx="5" fill="#dbe7f5" />
        <rect x="60" y="154" width="120" height="10" rx="5" fill="#dbe7f5" />
        <circle cx="185" cy="236" r="28" fill="#fff" stroke="#e8702a" strokeWidth="4" />
        <path d="M172 236l9 9 17-19" fill="none" stroke="#2e9e5b" strokeWidth="6" strokeLinecap="round" strokeLinejoin="round" />
      </g>
    </svg>
  );
}

export default function Home() {
  const navigate = useNavigate();
  const [nomor, setNomor] = useState("");

  const cek = (e) => {
    e.preventDefault();
    const q = nomor.trim();
    navigate(q ? `/cek-status?no=${encodeURIComponent(q)}` : "/cek-status");
  };

  return (
    <>
      {/* HERO */}
      <section className="bg-gradient-to-br from-blue-50 to-white">
        <div className="mx-auto grid max-w-[1200px] items-center gap-10 px-5 py-14 sm:px-8 md:grid-cols-2 md:py-20">
          <div>
            <p className="text-xs font-bold uppercase tracking-widest text-primary">Portal layanan SMAN 104 Jakarta</p>
            <h1 className="mt-3 text-3xl font-extrabold leading-tight text-navy sm:text-4xl lg:text-[44px]">
              Layanan Administrasi Sekolah dalam Satu Pintu
            </h1>
            <p className="mt-5 max-w-lg text-base leading-7 text-slate-600">
              Ajukan, pantau, dan selesaikan kebutuhan administrasi sekolah dengan mudah dan transparan.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link
                to="/ajukan"
                className="rounded-lg bg-primary px-6 py-3 text-sm font-semibold text-white transition-colors hover:bg-primary-dark"
              >
                Ajukan Layanan
              </Link>
              <a
                href="#alur"
                className="rounded-lg border border-line bg-white px-6 py-3 text-sm font-semibold text-navy transition-colors hover:bg-blue-50"
              >
                Lihat Alur
              </a>
            </div>
          </div>
          <div className="flex justify-center md:justify-end">
            <HeroIllustration />
          </div>
        </div>
      </section>

      {/* LAYANAN */}
      <section id="layanan" className="mx-auto max-w-[1200px] px-5 py-16 sm:px-8">
        <p className="text-xs font-bold uppercase tracking-widest text-primary">Layanan kami</p>
        <div className="mt-2 flex flex-col justify-between gap-3 md:flex-row md:items-end">
          <h2 className="text-2xl font-bold text-navy sm:text-3xl">Pilih layanan sesuai kebutuhan</h2>
          <p className="max-w-sm text-sm text-slate-600">Seluruh kebutuhan administrasi sekolah tersedia dalam satu portal.</p>
        </div>

        <div className="mt-8 grid gap-4 sm:grid-cols-3 lg:grid-cols-5">
          {SERVICES.map((s) => (
            <Link
              key={s.slug}
              to={`/layanan/${s.slug}`}
              className="group flex flex-col rounded-xl border border-line bg-white p-5 transition-shadow hover:shadow-lg"
            >
              <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-50 text-primary">
                <ServiceIcon slug={s.slug} />
              </span>
              <h3 className="mt-5 text-base font-bold leading-snug text-navy">{s.title}</h3>
              <span className="mt-auto inline-flex items-center gap-1 pt-6 text-sm font-semibold text-primary">
                Selengkapnya
                <ArrowRightIcon className="h-4 w-4 transition-transform group-hover:translate-x-1" />
              </span>
            </Link>
          ))}
        </div>

        {/* Surat Keputusan: terbuka untuk semua pengguna */}
        <Link
          to="/surat-keputusan"
          className="group mt-5 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-line bg-surface px-5 py-4 hover:bg-blue-50"
        >
          <span className="flex items-center gap-3">
            <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-white text-primary">
              <ScaleIcon className="h-5 w-5" />
            </span>
            <span>
              <span className="block font-bold text-navy">Surat Keputusan</span>
              <span className="block text-sm text-slate-600">Dapat diakses oleh semua pengguna, tanpa perlu masuk.</span>
            </span>
          </span>
          <span className="inline-flex items-center gap-1 text-sm font-semibold text-primary">
            Lihat SK <ArrowRightIcon className="h-4 w-4 transition-transform group-hover:translate-x-1" />
          </span>
        </Link>
      </section>

      {/* ALUR */}
      <section id="alur" className="bg-surface">
        <div className="mx-auto max-w-[1200px] px-5 py-16 sm:px-8">
          <p className="text-xs font-bold uppercase tracking-widest text-primary">Mudah dan transparan</p>
          <h2 className="mt-2 text-2xl font-bold text-navy sm:text-3xl">Cara Mengajukan Layanan</h2>
          <p className="mt-2 text-sm text-slate-600">Empat langkah sederhana untuk mendapatkan layanan administrasi.</p>

          <ol className="mt-10 grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
            {STEPS.map((st, i) => {
              const Icon = STEP_ICON[i];
              return (
                <li key={st.n} className="text-center">
                  <span className="relative mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-primary text-white">
                    <Icon className="h-7 w-7" />
                    <span className="absolute -right-2 -top-2 flex h-7 w-7 items-center justify-center rounded-full bg-accent text-[11px] font-bold">
                      {st.n}
                    </span>
                  </span>
                  <h3 className="mt-4 text-base font-bold text-navy">{st.title}</h3>
                  <p className="mx-auto mt-1 max-w-[230px] text-sm leading-6 text-slate-600">{st.desc}</p>
                  {st.to && (
                    <Link to={st.to} className="mt-2 inline-flex items-center gap-1 text-sm font-semibold text-primary hover:underline">
                      {st.linkLabel} <ArrowRightIcon className="h-4 w-4" />
                    </Link>
                  )}
                </li>
              );
            })}
          </ol>
        </div>
      </section>

      {/* PENGUMUMAN */}
      <section className="mx-auto max-w-[1200px] px-5 py-16 sm:px-8">
        <p className="text-xs font-bold uppercase tracking-widest text-primary">Informasi terkini</p>
        <div className="mt-2 flex items-end justify-between">
          <h2 className="text-2xl font-bold text-navy sm:text-3xl">Pengumuman Terbaru</h2>
          <Link to="/pengumuman" className="inline-flex items-center gap-1 text-sm font-semibold text-primary">
            Lihat semua <ArrowRightIcon className="h-4 w-4" />
          </Link>
        </div>

        <div className="mt-8 grid gap-5 md:grid-cols-3">
          {ANNOUNCEMENTS.map((a) => (
            <article key={a.title} className="rounded-xl border border-line bg-white p-6">
              <div className="flex items-center justify-between text-xs">
                <span className="rounded-full bg-blue-50 px-3 py-1 font-semibold text-primary">{a.tag}</span>
                <span className="text-slate-500">{a.date}</span>
              </div>
              <h3 className="mt-4 text-lg font-bold leading-snug text-navy">{a.title}</h3>
              <p className="mt-2 text-sm leading-6 text-slate-600">{a.excerpt}</p>
              <p className="mt-4 text-xs text-slate-400">Contoh isi (data dummy)</p>
            </article>
          ))}
        </div>
      </section>

      {/* CEK STATUS */}
      <section className="bg-primary">
        <form onSubmit={cek} className="mx-auto flex max-w-[1200px] flex-col gap-5 px-5 py-10 sm:px-8 lg:flex-row lg:items-center">
          <div className="flex flex-1 items-center gap-4 text-white">
            <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-white/20">
              <MagnifyingGlassIcon className="h-6 w-6" />
            </span>
            <div>
              <h2 className="text-xl font-bold">Cek Status Pengajuan</h2>
              <p className="text-sm text-blue-100">Masukkan nomor pengajuan untuk melihat perkembangan layanan Anda.</p>
            </div>
          </div>
          <input
            value={nomor}
            onChange={(e) => setNomor(e.target.value)}
            aria-label="Nomor pengajuan"
            placeholder="Contoh: TU-2026-00128"
            className="h-12 w-full rounded-lg border border-line bg-white px-4 text-sm text-slate-800 placeholder:text-slate-500 focus:outline-2 focus:outline-offset-2 focus:outline-white lg:w-80"
          />
          <button type="submit" className="h-12 rounded-lg bg-accent px-7 text-sm font-semibold text-white hover:brightness-110">
            Cek Status
          </button>
        </form>
      </section>
    </>
  );
}
