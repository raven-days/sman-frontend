import { useState } from "react";
import { Link } from "react-router-dom";
import { useApp } from "../context/AppState";
import { fmtDate } from "../lib/format";
import StatusBadge from "../components/StatusBadge";

const STATUSES = ["Menunggu", "Diverifikasi", "Perlu Perbaikan", "Disetujui", "Ditolak", "Selesai"];

export default function PetugasList() {
  const { requests } = useApp();
  const [status, setStatus] = useState("");
  const [q, setQ] = useState("");

  const rows = requests.filter(
    (r) =>
      (!status || r.status === status) &&
      (!q || `${r.id} ${r.pemohon} ${r.perihal} ${r.jenis}`.toLowerCase().includes(q.toLowerCase()))
  );

  return (
    <div className="mx-auto max-w-[1100px] px-5 py-12 sm:px-8">
      <h1 className="text-3xl font-extrabold text-navy">Antrian Pengajuan</h1>
      <p className="mt-1 text-sm text-slate-600">Layanan Administrasi & Persuratan. Pilih pengajuan untuk diperiksa.</p>

      <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
        {STATUSES.map((s) => (
          <button
            key={s}
            type="button"
            onClick={() => setStatus(status === s ? "" : s)}
            aria-pressed={status === s}
            className={`rounded-xl border p-3 text-left ${status === s ? "border-primary bg-blue-50" : "border-line bg-white hover:bg-surface"}`}
          >
            <p className="text-2xl font-extrabold text-navy">{requests.filter((r) => r.status === s).length}</p>
            <p className="text-xs text-slate-600">{s}</p>
          </button>
        ))}
      </div>

      <div className="mt-5 flex flex-col gap-3 sm:flex-row">
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          aria-label="Cari pengajuan"
          placeholder="Cari nomor, pemohon, atau perihal"
          className="h-11 flex-1 rounded-lg border border-line px-4 text-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
        />
        <select value={status} onChange={(e) => setStatus(e.target.value)} aria-label="Filter status" className="h-11 rounded-lg border border-line px-3 text-sm">
          <option value="">Semua status</option>
          {STATUSES.map((s) => <option key={s}>{s}</option>)}
        </select>
      </div>

      <div className="mt-5 overflow-x-auto rounded-xl border border-line bg-white">
        <table className="w-full min-w-[760px] text-left text-sm">
          <thead className="bg-surface text-xs uppercase tracking-wide text-slate-500">
            <tr>
              <th className="px-4 py-3">Nomor</th>
              <th className="px-4 py-3">Pemohon</th>
              <th className="px-4 py-3">Jenis</th>
              <th className="px-4 py-3">Perihal</th>
              <th className="px-4 py-3">Dibutuhkan</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3" />
            </tr>
          </thead>
          <tbody className="divide-y divide-line">
            {rows.length === 0 && (
              <tr><td colSpan={7} className="px-4 py-10 text-center text-slate-500">Tidak ada pengajuan yang cocok.</td></tr>
            )}
            {rows.map((r) => (
              <tr key={r.id}>
                <td className="px-4 py-3 font-semibold text-navy">{r.id}</td>
                <td className="px-4 py-3">{r.pemohon}</td>
                <td className="px-4 py-3">{r.jenis}</td>
                <td className="max-w-[220px] truncate px-4 py-3">{r.perihal}</td>
                <td className="px-4 py-3">{fmtDate(r.tanggal)}</td>
                <td className="px-4 py-3"><StatusBadge status={r.status} /></td>
                <td className="px-4 py-3 text-right"><Link to={`/petugas/${r.id}`} className="font-semibold text-primary">Proses</Link></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
