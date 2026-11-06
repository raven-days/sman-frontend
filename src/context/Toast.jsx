import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import {
  CheckCircleIcon,
  ExclamationTriangleIcon,
  InformationCircleIcon,
  XCircleIcon,
  XMarkIcon,
} from "@heroicons/react/24/outline";

const ToastCtx = createContext(null);

const DURASI = { success: 4000, info: 5000, warning: 6500, error: 8000, loading: 0 };
const MAKS = 4;

const GAYA = {
  success: { Ikon: CheckCircleIcon, bar: "bg-green-600", warna: "text-green-600" },
  error: { Ikon: XCircleIcon, bar: "bg-red-600", warna: "text-red-600" },
  warning: { Ikon: ExclamationTriangleIcon, bar: "bg-orange-500", warna: "text-orange-600" },
  info: { Ikon: InformationCircleIcon, bar: "bg-primary", warna: "text-primary" },
  loading: { Ikon: null, bar: "bg-primary", warna: "text-primary" },
};

function Spinner() {
  return (
    <svg className="h-5 w-5 animate-spin" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="3" className="opacity-25" />
      <path d="M21 12a9 9 0 0 0-9-9" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
    </svg>
  );
}

function Toast({ t, onClose, onJeda, onLanjut }) {
  const { Ikon, bar, warna } = GAYA[t.type];
  return (
    <div
      role={t.type === "error" || t.type === "warning" ? "alert" : "status"}
      onMouseEnter={onJeda}
      onMouseLeave={onLanjut}
      onFocus={onJeda}
      onBlur={onLanjut}
      className={`pointer-events-auto relative flex w-full max-w-sm items-start gap-3 overflow-hidden rounded-xl border border-line bg-white py-3 pl-5 pr-3 shadow-lg ${
        t.leaving ? "anim-toast-out" : "anim-toast-in"
      }`}
    >
      <span className={`absolute inset-y-0 left-0 w-1.5 ${bar}`} aria-hidden="true" />
      <span className={`mt-0.5 shrink-0 ${warna}`}>
        {Ikon ? <Ikon className="h-5 w-5" aria-hidden="true" /> : <Spinner />}
      </span>
      <p className="min-w-0 flex-1 break-words text-sm leading-6 text-navy">{t.message}</p>
      <button
        type="button"
        aria-label="Tutup notifikasi"
        onClick={onClose}
        className="shrink-0 rounded p-1 text-slate-400 transition-colors hover:bg-surface hover:text-navy"
      >
        <XMarkIcon className="h-4 w-4" />
      </button>
    </div>
  );
}

export function ToastProvider({ children }) {
  const [items, setItems] = useState([]);
  const ref = useRef([]); // salinan terbaru, dipakai untuk cek duplikat
  const timers = useRef(new Map());
  const seq = useRef(0);

  const ubah = useCallback((fn) => {
    ref.current = fn(ref.current);
    setItems(ref.current);
  }, []);

  const hapus = useCallback(
    (id) => {
      clearTimeout(timers.current.get(id));
      timers.current.delete(id);
      ubah((l) => l.filter((t) => t.id !== id));
    },
    [ubah]
  );

  const tutup = useCallback(
    (id) => {
      clearTimeout(timers.current.get(id));
      ubah((l) => l.map((t) => (t.id === id ? { ...t, leaving: true } : t)));
      timers.current.set(id, setTimeout(() => hapus(id), 180));
    },
    [ubah, hapus]
  );

  const jadwal = useCallback(
    (id, ms) => {
      clearTimeout(timers.current.get(id));
      if (ms > 0) timers.current.set(id, setTimeout(() => tutup(id), ms));
    },
    [tutup]
  );

  const tampil = useCallback(
    (type, message, id) => {
      const msg = String(message || "").trim();
      if (!msg) return null;
      // Pesan yang sama yang masih tampil tidak ditumpuk, cukup diperpanjang.
      const lama =
        id != null
          ? ref.current.find((t) => t.id === id)
          : ref.current.find((t) => t.type === type && t.message === msg && !t.leaving);
      if (lama) {
        ubah((l) => l.map((t) => (t.id === lama.id ? { ...t, type, message: msg, leaving: false } : t)));
        jadwal(lama.id, DURASI[type]);
        return lama.id;
      }
      const baru = ++seq.current;
      ubah((l) => [...l, { id: baru, type, message: msg }].slice(-MAKS));
      jadwal(baru, DURASI[type]);
      return baru;
    },
    [ubah, jadwal]
  );

  useEffect(() => {
    const t = timers.current;
    return () => t.forEach((x) => clearTimeout(x));
  }, []);

  const toast = useMemo(
    () => ({
      success: (m) => tampil("success", m),
      error: (m) => tampil("error", m),
      warning: (m) => tampil("warning", m),
      info: (m) => tampil("info", m),
      loading: (m) => tampil("loading", m),
      update: (id, type, m) => tampil(type, m, id),
      dismiss: (id) => tutup(id),
      // Tampilkan error dari api(). Sesi berakhir (401) ditangani terpisah, jadi dilewati.
      galat: (err, cadangan = "Terjadi kesalahan.") =>
        err?.status === 401 ? null : tampil("error", err?.message || cadangan),
    }),
    [tampil, tutup]
  );

  return (
    <ToastCtx.Provider value={toast}>
      {children}
      <div
        aria-live="polite"
        className="pointer-events-none fixed inset-x-0 bottom-0 z-[90] flex flex-col items-center gap-2 p-4 sm:inset-x-auto sm:right-0 sm:items-end"
      >
        {items.map((t) => (
          <Toast
            key={t.id}
            t={t}
            onClose={() => tutup(t.id)}
            onJeda={() => clearTimeout(timers.current.get(t.id))}
            onLanjut={() => t.type !== "loading" && !t.leaving && jadwal(t.id, 2500)}
          />
        ))}
      </div>
    </ToastCtx.Provider>
  );
}

export const useToast = () => useContext(ToastCtx);