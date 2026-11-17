import { useState } from "react";
import { Link } from "react-router-dom";
import { ArrowDownTrayIcon, LockClosedIcon, MagnifyingGlassIcon } from "@heroicons/react/24/outline";
import { useFetch, bukaLampiran } from "../lib/api";
import { useToast } from "../context/Toast";
import { DaftarBarisSkeleton } from "./Skeleton";

const TAB = {
  regulasi: { label: "Regulasi & Peraturan" },
  laporan: { label: "Laporan e-RKAS BOP" },
};

const WARNA = {
  APBN: "bg-blue-50 text-blue-700 border-blue-200",
  APBD: "bg-green-50 text-green-700 border-green-200",
  BOP: "bg-amber-50 text-amber-700 border-amber-200",
  Lainnya: "bg-slate-50 text-slate-700 border-slate-200",
};

function Daftar({ kategori }) {
  const toast = useToast();
  const { data, loading, error } = useFetch(`/anggaran?kategori=${kategori}`);
  const [q, setQ] = useState("");
  const [tahun, setTahun] = useState("");
  const [filter, setFilter] = useState(""); // sumber dana (regulasi) atau triwulan (laporan)

  const list = data?.data ?? [];
  const tersembunyi = data?.tersembunyi ?? 0;
  const years = [...new Set(list.map((d) => d.tahun))].sort((a, b) => b - a);
  const pilihan = kategori === "regulasi"
    ? [...new Set(list.map((d) => d.sumber_dana).filter(Boolean))]
    : [...new Set(list.map((d) => d.periode).filter(Boolean))].sort();

  const rows = list.filter(
    (d) =>
      (!tahun || String(d.tahun) === tahun) &&
      (!filter || (kategori === "regulasi" ? d.sumber_dana : d.periode) === filter) &&
      `${d.judul} ${d.nomor || ""} ${d.penerbit || ""}`.toLowerCase().includes(q.toLowerCase()),
  );

  const buka = (path) => bukaLampiran(path).catch((e) => toast.galat(e));
  const kolom = kategori === "regulasi" ? 7 : 5;

  return (
    <>
      {tersembunyi > 0 && (
        <p className="mt-5 flex flex-wrap items-center gap-2 rounded-lg border border-blue-200 bg-blue-50 px-4 py-3 text-sm text-blue-900">
          <LockClosedIcon className="h-4 w-4" />
          Ada {tersembunyi} dokumen yang hanya bisa dilihat akun yang sudah masuk.
          <Link to="/login" state={{ from: "/layanan/anggaran" }} className="font-semibold underline">Masuk</Link>
        </p>
      )}

      <div className="mt-5 flex flex-col gap-3 sm:flex-row">
        <div className="relative flex-1">
          <MagnifyingGlassIcon className="pointer-events-none absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            aria-label="Cari dokumen"
            placeholder="Cari judul, nomor, atau penerbit"
            className="h-11 w-full rounded-lg border border-line pl-10 pr-4 text-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
          />
        </div>
        <select value={filter} onChange={(e) => setFilter(e.target.value)} aria-label={kategori === "regulasi" ? "Filter sumber dana" : "Filter triwulan"} className="h-11 rounded-lg border border-line px-3 text-sm">
          <option value="">{kategori === "regulasi" ? "Semua sumber dana" : "Semua triwulan"}</option>
          {pilihan.map((p) => <option key={p}>{p}</option>)}
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
          <table className={`w-full text-left text-sm ${kategori === "regulasi" ? "min-w-[860px]" : "min-w-[560px]"}`}>
            <thead className="bg-surface text-xs uppercase tracking-wide text-slate-500">
              <tr>
                <th className="w-14 px-4 py-3">No.</th>
                {kategori === "regulasi" ? (
                  <>
                    <th className="px-4 py-3">Nomor</th>
                    <th className="px-4 py-3">Tentang</th>
                    <th className="px-4 py-3">Sumber dana</th>
                    <th className="px-4 py-3">Diterbitkan oleh</th>
                    <th className="px-4 py-3">Tahun</th>
                  </>
                ) : (
                  <>
                    <th className="px-4 py-3">Laporan</th>
                    <th className="px-4 py-3">Triwulan</th>
                    <th className="px-4 py-3">Tahun</th>
                  </>
                )}
                <th className="px-4 py-3 text-right">Berkas</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {rows.length === 0 && (
                <tr><td colSpan={kolom} className="px-4 py-10 text-center text-slate-500">Belum ada dokumen yang cocok.</td></tr>
              )}
              {rows.map((d, i) => (
                <tr key={d.id}>
                  <td className="px-4 py-3 text-slate-500">{i + 1}</td>
                  {kategori === "regulasi" ? (
                    <>
                      <td className="px-4 py-3 font-semibold text-navy">{d.nomor || "-"}</td>
                      <td className="px-4 py-3">{d.judul}</td>
                      <td className="px-4 py-3">
                        {d.sumber_dana ? (
                          <span className={`inline-flex rounded-full border px-2.5 py-0.5 text-xs font-semibold ${WARNA[d.sumber_dana] || WARNA.Lainnya}`}>{d.sumber_dana}</span>
                        ) : "-"}
                      </td>
                      <td className="px-4 py-3">{d.penerbit || "-"}</td>
                      <td className="px-4 py-3">{d.tahun}</td>
                    </>
                  ) : (
                    <>
                      <td className="px-4 py-3 font-semibold text-navy">
                        {d.judul}
                        {d.akses === "login" && <LockClosedIcon className="ml-1.5 inline h-4 w-4 text-slate-400" aria-label="Khusus akun login" />}
                      </td>
                      <td className="px-4 py-3">{d.periode || "-"}</td>
                      <td className="px-4 py-3">{d.tahun}</td>
                    </>
                  )}
                  <td className="px-4 py-3 text-right">
                    {d.file ? (
                      <button type="button" onClick={() => buka(d.file)} className="inline-flex items-center gap-1 font-semibold text-primary">
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

export default function AnggaranPanel() {
  const [kategori, setKategori] = useState("regulasi");

  return (
    <section className="rounded-xl border border-line bg-white">
      <header className="border-b border-line px-6 py-5">
        <h2 className="text-xl font-bold text-navy">Dokumen Anggaran</h2>
        <p className="mt-1 text-sm text-slate-600">Peraturan pengelolaan dana (APBN dan APBD) serta laporan dana BOP SMA Negeri 104 Jakarta.</p>
      </header>

      <div className="p-6">
        <div role="tablist" aria-label="Jenis dokumen anggaran" className="inline-flex rounded-xl bg-surface p-1">
          {Object.entries(TAB).map(([k, t]) => (
            <button
              key={k}
              type="button"
              role="tab"
              aria-selected={kategori === k}
              onClick={() => setKategori(k)}
              className={`rounded-lg px-4 py-2 text-sm font-semibold transition-colors ${kategori === k ? "bg-white text-navy shadow-sm" : "text-slate-500 hover:text-navy"}`}
            >
              {t.label}
            </button>
          ))}
        </div>
        <Daftar key={kategori} kategori={kategori} />
      </div>
    </section>
  );
}