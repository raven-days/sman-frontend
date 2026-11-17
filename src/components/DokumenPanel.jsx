import { useState } from "react";
import { Link } from "react-router-dom";
import { ArrowDownTrayIcon, LockClosedIcon, MagnifyingGlassIcon } from "@heroicons/react/24/outline";
import { useApp } from "../context/AppState";
import { useFetch, bukaLampiran } from "../lib/api";
import { useToast } from "../context/Toast";
import { DaftarBarisSkeleton } from "./Skeleton";

const TAB = {
  sk: { label: "Surat Keputusan", nomor: "Nomor SK" },
  sop: { label: "Standar Operasional Prosedur", nomor: "Nomor SOP" },
};

function Daftar({ jenis }) {
  const toast = useToast();
  const { data, loading, error } = useFetch(`/sk?jenis=${jenis}`);
  const [q, setQ] = useState("");
  const [tahun, setTahun] = useState("");
  const [bidang, setBidang] = useState("");

  const list = data ?? [];
  const years = [...new Set(list.map((s) => s.tahun))].sort((a, b) => b - a);
  const bidangs = [...new Set(list.map((s) => s.bidang).filter(Boolean))].sort();
  const rows = list.filter(
    (s) =>
      (!tahun || String(s.tahun) === tahun) &&
      (!bidang || s.bidang === bidang) &&
      `${s.nomor} ${s.tentang} ${s.penerbit || ""}`.toLowerCase().includes(q.toLowerCase()),
  );

  const buka = (path) => bukaLampiran(path).catch((e) => toast.galat(e));

  return (
    <>
      <div className="mt-5 flex flex-col gap-3 sm:flex-row">
        <div className="relative flex-1">
          <MagnifyingGlassIcon className="pointer-events-none absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            aria-label="Cari dokumen"
            placeholder="Cari nomor, judul, atau penerbit"
            className="h-11 w-full rounded-lg border border-line pl-10 pr-4 text-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
          />
        </div>
        <select value={bidang} onChange={(e) => setBidang(e.target.value)} aria-label="Filter bidang" className="h-11 rounded-lg border border-line px-3 text-sm">
          <option value="">Semua bidang</option>
          {bidangs.map((b) => <option key={b}>{b}</option>)}
        </select>
        <select value={tahun} onChange={(e) => setTahun(e.target.value)} aria-label="Filter tahun" className="h-11 rounded-lg border border-line px-3 text-sm">
          <option value="">Semua tahun</option>
          {years.map((y) => <option key={y}>{y}</option>)}
        </select>
      </div>

      {loading && <DaftarBarisSkeleton n={4} className="mt-5" />}
      {error && <p role="alert" className="mt-5 text-sm text-red-600">{error}</p>}

      {!loading && !error && (
        <div className="mt-5 overflow-x-auto rounded-xl border border-line">
          <table className="w-full min-w-[820px] text-left text-sm">
            <thead className="bg-surface text-xs uppercase tracking-wide text-slate-500">
              <tr>
                <th className="w-14 px-4 py-3">No.</th>
                <th className="px-4 py-3">{TAB[jenis].nomor}</th>
                <th className="px-4 py-3">Tentang</th>
                <th className="px-4 py-3">Ditetapkan oleh</th>
                <th className="px-4 py-3">Bidang</th>
                <th className="px-4 py-3">Tahun</th>
                <th className="px-4 py-3 text-right">Berkas</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {rows.length === 0 && (
                <tr><td colSpan={7} className="px-4 py-10 text-center text-slate-500">Tidak ada dokumen yang cocok.</td></tr>
              )}
              {rows.map((s, i) => (
                <tr key={s.id}>
                  <td className="px-4 py-3 text-slate-500">{i + 1}</td>
                  <td className="px-4 py-3 font-semibold text-navy">{s.nomor}</td>
                  <td className="px-4 py-3">{s.tentang}</td>
                  <td className="px-4 py-3">{s.penerbit || "-"}</td>
                  <td className="px-4 py-3">{s.bidang || "-"}</td>
                  <td className="px-4 py-3">{s.tahun}</td>
                  <td className="px-4 py-3 text-right">
                    {s.file ? (
                      <button type="button" onClick={() => buka(s.file)} className="inline-flex items-center gap-1 font-semibold text-primary">
                        <ArrowDownTrayIcon className="h-4 w-4" /> Buka
                      </button>
                    ) : (
                      <span className="text-xs text-slate-400">Belum tersedia</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </>
  );
}

export default function DokumenPanel() {
  const { user } = useApp();
  const [jenis, setJenis] = useState("sk");

  return (
    <section id="dokumen" className="rounded-xl border border-line bg-white">
      <header className="border-b border-line px-6 py-5">
        <h2 className="text-xl font-bold text-navy">Dokumen SK & SOP</h2>
      </header>

      {!user ? (
        <div className="flex flex-col items-center px-6 py-12 text-center">
          <LockClosedIcon className="h-9 w-9 text-slate-400" />
          <p className="mt-4 max-w-md text-slate-700">Dokumen SK dan SOP hanya dapat dilihat oleh akun yang sudah masuk.</p>
          <Link
            to="/login"
            state={{ from: "/layanan/administrasi-persuratan" }}
            className="mt-5 rounded-lg bg-primary px-8 py-2.5 text-sm font-bold text-white transition-colors hover:bg-primary-dark"
          >
            Masuk
          </Link>
        </div>
      ) : (
        <div className="p-6">
          <div role="tablist" aria-label="Jenis dokumen" className="inline-flex rounded-xl bg-surface p-1">
            {Object.entries(TAB).map(([k, t]) => (
              <button
                key={k}
                type="button"
                role="tab"
                aria-selected={jenis === k}
                onClick={() => setJenis(k)}
                className={`rounded-lg px-4 py-2 text-sm font-semibold transition-colors ${jenis === k ? "bg-white text-navy shadow-sm" : "text-slate-500 hover:text-navy"}`}
              >
                {t.label}
              </button>
            ))}
          </div>
          <Daftar key={jenis} jenis={jenis} />
        </div>
      )}
    </section>
  );
}