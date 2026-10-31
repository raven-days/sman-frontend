import { useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { MagnifyingGlassIcon } from "@heroicons/react/24/outline";
import { GURU, TENDIK } from "../data/pegawai";

const TABS = [
  { id: "guru", label: "Guru", data: GURU },
  { id: "tendik", label: "Tenaga Kependidikan", data: TENDIK },
];

export default function Kepegawaian() {
  const [params, setParams] = useSearchParams();
  const [q, setQ] = useState("");
  const tab = TABS.find((t) => t.id === params.get("tab")) || TABS[0];
  const rows = tab.data.filter((r) => `${r.nama} ${r.jabatan}`.toLowerCase().includes(q.toLowerCase()));

  return (
    <div className="mx-auto max-w-[1000px] px-5 py-12 sm:px-8">
      <nav className="text-xs text-slate-500">
        <Link to="/" className="hover:text-primary">Beranda</Link> /{" "}
        <Link to="/layanan" className="hover:text-primary">Layanan</Link> / Kepegawaian
      </nav>
      <h1 className="mt-3 text-3xl font-extrabold text-navy">Kepegawaian</h1>
      <p className="mt-1 text-sm text-slate-600">Daftar guru dan tenaga kependidikan SMA Negeri 104 Jakarta.</p>

      <div role="tablist" aria-label="Jenis pegawai" className="mt-6 inline-flex rounded-xl bg-surface p-1">
        {TABS.map((t) => (
          <button
            key={t.id}
            role="tab"
            type="button"
            aria-selected={tab.id === t.id}
            onClick={() => { setParams({ tab: t.id }); setQ(""); }}
            className={`rounded-lg px-4 py-2 text-sm font-semibold ${tab.id === t.id ? "bg-white text-primary shadow-sm" : "text-slate-500 hover:text-navy"}`}
          >
            {t.label} <span className="text-xs font-normal text-slate-400">({t.data.length})</span>
          </button>
        ))}
      </div>

      <div className="relative mt-5 max-w-md">
        <MagnifyingGlassIcon className="pointer-events-none absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          aria-label="Cari nama atau jabatan"
          placeholder="Cari nama atau jabatan"
          className="h-11 w-full rounded-lg border border-line pl-10 pr-4 text-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
        />
      </div>

      <div className="mt-5 overflow-x-auto rounded-xl border border-line bg-white">
        <table className="w-full min-w-[520px] text-left text-sm">
          <thead className="bg-surface text-xs uppercase tracking-wide text-slate-500">
            <tr>
              <th className="w-16 px-4 py-3">No.</th>
              <th className="px-4 py-3">Nama</th>
              <th className="px-4 py-3">Jabatan</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-line">
            {rows.length === 0 && (
              <tr><td colSpan={3} className="px-4 py-10 text-center text-slate-500">Tidak ada data yang cocok.</td></tr>
            )}
            {rows.map((r, i) => (
              <tr key={`${r.nama}-${i}`}>
                <td className="px-4 py-3 text-slate-500">{i + 1}</td>
                <td className="px-4 py-3 font-semibold text-navy">{r.nama}</td>
                <td className="px-4 py-3">{r.jabatan}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className="mt-3 text-xs text-slate-400">Sumber: daftar nama dari Tata Usaha SMA Negeri 104 Jakarta.</p>
    </div>
  );
}
