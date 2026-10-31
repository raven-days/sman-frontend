import { useState } from "react";
import { Link } from "react-router-dom";
import { ArrowDownTrayIcon, MagnifyingGlassIcon } from "@heroicons/react/24/outline";
import { SK_LIST } from "../data/sk";

export default function SuratKeputusan() {
  const [q, setQ] = useState("");
  const [tahun, setTahun] = useState("");
  const years = [...new Set(SK_LIST.map((s) => s.tahun))].sort((a, b) => b - a);
  const rows = SK_LIST.filter(
    (s) => (!tahun || String(s.tahun) === tahun) && `${s.nomor} ${s.tentang}`.toLowerCase().includes(q.toLowerCase())
  );
  const hasSample = SK_LIST.some((s) => s.contoh);

  return (
    <div className="mx-auto max-w-[1000px] px-5 py-12 sm:px-8">
      <nav className="text-xs text-slate-500">
        <Link to="/" className="hover:text-primary">Beranda</Link> / Surat Keputusan
      </nav>
      <h1 className="mt-3 text-3xl font-extrabold text-navy">Surat Keputusan</h1>
      <p className="mt-1 text-sm text-slate-600">Kumpulan Surat Keputusan (SK) SMA Negeri 104 Jakarta. Dapat diakses oleh semua pengguna tanpa perlu masuk.</p>

      {hasSample && (
        <p className="mt-5 rounded-lg border border-blue-200 bg-blue-50 px-4 py-3 text-sm text-blue-900">
          Baris di bawah ini masih contoh. SK yang sebenarnya akan ditambahkan setelah file diterima dari sekolah.
        </p>
      )}

      <div className="mt-6 flex flex-col gap-3 sm:flex-row">
        <div className="relative flex-1">
          <MagnifyingGlassIcon className="pointer-events-none absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            aria-label="Cari SK"
            placeholder="Cari nomor atau judul SK"
            className="h-11 w-full rounded-lg border border-line pl-10 pr-4 text-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
          />
        </div>
        <select value={tahun} onChange={(e) => setTahun(e.target.value)} aria-label="Filter tahun" className="h-11 rounded-lg border border-line px-3 text-sm">
          <option value="">Semua tahun</option>
          {years.map((y) => <option key={y}>{y}</option>)}
        </select>
      </div>

      <div className="mt-5 overflow-x-auto rounded-xl border border-line bg-white">
        <table className="w-full min-w-[640px] text-left text-sm">
          <thead className="bg-surface text-xs uppercase tracking-wide text-slate-500">
            <tr>
              <th className="w-14 px-4 py-3">No.</th>
              <th className="px-4 py-3">Nomor SK</th>
              <th className="px-4 py-3">Tentang</th>
              <th className="px-4 py-3">Tahun</th>
              <th className="px-4 py-3 text-right">Berkas</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-line">
            {rows.length === 0 && (
              <tr><td colSpan={5} className="px-4 py-10 text-center text-slate-500">Tidak ada SK yang cocok.</td></tr>
            )}
            {rows.map((s, i) => (
              <tr key={s.id}>
                <td className="px-4 py-3 text-slate-500">{i + 1}</td>
                <td className="px-4 py-3 font-semibold text-navy">{s.nomor}</td>
                <td className="px-4 py-3">{s.tentang}</td>
                <td className="px-4 py-3">{s.tahun}</td>
                <td className="px-4 py-3 text-right">
                  {s.file ? (
                    <a href={s.file} download className="inline-flex items-center gap-1 font-semibold text-primary">
                      <ArrowDownTrayIcon className="h-4 w-4" /> Unduh
                    </a>
                  ) : (
                    <span className="text-xs text-slate-400">Belum tersedia</span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
