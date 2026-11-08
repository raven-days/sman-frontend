import { useState } from "react";
import { Link, Navigate, useLocation } from "react-router-dom";
import { EyeIcon, EyeSlashIcon, ArrowLeftIcon } from "@heroicons/react/24/outline";
import { ROLES } from "../data/content";
import { useApp } from "../context/AppState";
import { api, setToken, DEMO } from "../lib/api";

/* Ornamen bunga Kawung */
function MedaliKawung({ className }) {
  return (
    <svg
      viewBox="0 0 200 200"
      className={className}
      fill="none"
      aria-hidden="true"
    >
      <g stroke="#d6bb7e" strokeWidth="1.2" strokeOpacity=".5">
        <ellipse cx="100" cy="52" rx="30" ry="48" />
        <ellipse cx="100" cy="148" rx="30" ry="48" />
        <ellipse cx="52" cy="100" rx="48" ry="30" />
        <ellipse cx="148" cy="100" rx="48" ry="30" />
      </g>

      <g fill="#b8583a" fillOpacity=".92">
        <ellipse cx="100" cy="76" rx="14" ry="24" />
        <ellipse cx="100" cy="124" rx="14" ry="24" />
        <ellipse cx="76" cy="100" rx="24" ry="14" />
        <ellipse cx="124" cy="100" rx="24" ry="14" />
      </g>

      <g fill="#d6bb7e" fillOpacity=".8">
        <circle cx="100" cy="28" r="3" />
        <circle cx="100" cy="172" r="3" />
        <circle cx="28" cy="100" r="3" />
        <circle cx="172" cy="100" r="3" />
        <circle cx="100" cy="100" r="4" />
      </g>
    </svg>
  );
}

/* Motif batik Kawung berulang */
function TeksturKawung({ id, className }) {
  return (
    <svg className={className} aria-hidden="true">
      <defs>
        <pattern
          id={id}
          width="72"
          height="72"
          patternUnits="userSpaceOnUse"
        >
          <g
            fill="none"
            stroke="currentColor"
            strokeWidth="1"
          >
            <ellipse cx="36" cy="18" rx="11" ry="18" />
            <ellipse cx="36" cy="54" rx="11" ry="18" />
            <ellipse cx="18" cy="36" rx="18" ry="11" />
            <ellipse cx="54" cy="36" rx="18" ry="11" />
          </g>

          <circle
            cx="36"
            cy="36"
            r="2"
            fill="currentColor"
          />
        </pattern>
      </defs>

      <rect
        width="100%"
        height="100%"
        fill={`url(#${id})`}
      />
    </svg>
  );
}

export default function Login() {
  const { user, dispatch } = useApp();
  const { state } = useLocation();
  const [role, setRole] = useState(ROLES[0]);
  const [identitas, setIdentitas] = useState("");
  const [sandi, setSandi] = useState("");
  const [lihat, setLihat] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  // Setelah masuk, kembali ke halaman yang tadi dituju (kalau ada).
  if (user) return <Navigate to={state?.from || "/akun"} replace />;

const submit = async (e) => {
  e.preventDefault();
  if (!identitas.trim() || !sandi) {
    setError("Isi identitas dan kata sandi terlebih dahulu.");
    return;
  }
  setError("");
  setLoading(true);

  if (DEMO) {
    setTimeout(() => dispatch({ type: "LOGIN", user: { role: role.id, name: role.name } }), 700);
    return;
  }

  try {
    const res = await api("/login", { method: "POST", body: { identitas: identitas.trim(), password: sandi } });
    setToken(res.token);
    dispatch({ type: "LOGIN", user: res.user });
  } catch (err) {
    setError(err.status === 429 ? "Terlalu banyak percobaan. Coba lagi sebentar." : err.message);
    setLoading(false);
  }
};

  return (
    <div className="grid min-h-[calc(100vh-112px)] lg:grid-cols-2">
      <aside className="relative isolate hidden flex-col justify-center overflow-hidden bg-navy px-14 text-white lg:flex">

  {/* Motif batik Kawung sebagai latar */}
  <TeksturKawung
    id="kawung-login"
    className="pointer-events-none absolute inset-0 z-0 h-full w-full text-[#d6bb7e] opacity-[0.14]"
  />

  {/* Ornamen bunga Kawung di pojok kanan atas */}
  <MedaliKawung
    className="pointer-events-none absolute -right-20 -top-24 z-0 h-[340px] w-[340px]"
  />
        <p className="text-xs font-bold uppercase tracking-widest text-blue-300">Portal layanan resmi</p>
        <h1 className="mt-4 text-4xl font-extrabold leading-tight">
          Layanan Tata Usaha
          <br />
          SMAN 104 Jakarta
        </h1>
        <p className="mt-5 max-w-md text-blue-100">
          Akses layanan administrasi sekolah dengan mudah dan terintegrasi dalam satu portal.
        </p>
        <p className="mt-10 border-t border-white/15 pt-6 text-sm text-blue-200">
          Akun dibuat dan dikelola oleh Tata Usaha sekolah.
        </p>
      </aside>

      <main className="flex items-center justify-center px-5 py-10">
        <div className="w-full max-w-md">
          <Link to="/" className="mb-8 inline-flex items-center gap-2 text-sm font-medium text-slate-600 hover:text-primary">
            <ArrowLeftIcon className="h-4 w-4" /> Kembali ke beranda
          </Link>

          <p className="text-xs font-bold uppercase tracking-widest text-primary">Selamat datang</p>
          <h2 className="mt-1 text-3xl font-extrabold text-navy">Masuk ke Akun Anda</h2>
          <p className="mt-1 text-sm text-slate-600">Pilih peran, lalu masukkan informasi akun Anda.</p>

          <form onSubmit={submit} className="mt-7 space-y-5" noValidate>
            <fieldset>
              <legend className="mb-2 text-sm font-semibold text-navy">Masuk sebagai</legend>
              <div className="grid grid-cols-3 rounded-xl bg-surface p-1">
                {ROLES.map((r) => (
                  <button
                    key={r.id}
                    type="button"
                    onClick={() => setRole(r)}
                    aria-pressed={role.id === r.id}
                    className={`rounded-lg px-2 py-2.5 text-xs font-semibold transition-colors ${
                      role.id === r.id ? "bg-white text-primary shadow-sm" : "text-slate-500 hover:text-navy"
                    }`}
                  >
                    {r.label}
                  </button>
                ))}
              </div>
            </fieldset>

            <div>
              <label htmlFor="identitas" className="mb-1.5 block text-sm font-semibold text-navy">
                {role.idLabel}
              </label>
              <input
                id="identitas"
                value={identitas}
                onChange={(e) => setIdentitas(e.target.value)}
                placeholder="Masukkan identitas akun"
                className="h-12 w-full rounded-lg border border-line px-4 text-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
              />
            </div>

            <div>
              <label htmlFor="sandi" className="mb-1.5 block text-sm font-semibold text-navy">
                Kata Sandi
              </label>
              <div className="relative">
                <input
                  id="sandi"
                  type={lihat ? "text" : "password"}
                  value={sandi}
                  onChange={(e) => setSandi(e.target.value)}
                  placeholder="Masukkan kata sandi"
                  className="h-12 w-full rounded-lg border border-line px-4 pr-12 text-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                />
                <button
                  type="button"
                  onClick={() => setLihat(!lihat)}
                  aria-label={lihat ? "Sembunyikan kata sandi" : "Tampilkan kata sandi"}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-navy"
                >
                  {lihat ? <EyeSlashIcon className="h-5 w-5" /> : <EyeIcon className="h-5 w-5" />}
                </button>
              </div>
            </div>

            {error && (
              <p role="alert" className="rounded-lg border border-red-200 bg-red-50 px-4 py-2.5 text-sm text-red-700">
                {error}
              </p>
            )}

            <div className="flex items-center justify-between text-sm">
              <label className="flex items-center gap-2 text-slate-600">
                <input type="checkbox" className="h-4 w-4 rounded border-line" /> Ingat saya
              </label>
              <Link to="/lupa-kata-sandi" className="font-semibold text-primary">
                Lupa kata sandi?
              </Link>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="h-12 w-full rounded-lg bg-primary text-sm font-semibold text-white transition-colors hover:bg-primary-dark disabled:opacity-70"
            >
              {loading ? "Memproses..." : "Masuk"}
            </button>
          </form>

          <p className="mt-6 text-center text-sm text-slate-600">
            Belum punya akun?{" "}
            <Link to="/kontak" className="font-semibold text-primary">
              Hubungi Tata Usaha
            </Link>
          </p>
          {DEMO && (
            <p className="mt-4 text-center text-xs text-slate-400">
              Mode demo: isi identitas dan kata sandi apa saja. Menu yang terbuka mengikuti peran yang dipilih.
            </p>
          )}
        </div>
      </main>
    </div>
  );
}
