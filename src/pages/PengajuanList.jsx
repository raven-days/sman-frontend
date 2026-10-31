import { Link } from "react-router-dom";
import { ExclamationTriangleIcon } from "@heroicons/react/24/outline";
import { useApp } from "../context/AppState";
import { fmtDate } from "../lib/format";
import StatusBadge from "../components/StatusBadge";

export default function PengajuanList() {
  const { user, requests } = useApp();
  const mine = requests.filter((r) => r.ownerRole === user.role);
  const perbaikan = mine.filter((r) => r.status === "Perlu Perbaikan");

  return (
    <div className="mx-auto max-w-[1000px] px-5 py-12 sm:px-8">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-3xl font-extrabold text-navy">Pengajuan Saya</h1>
          <p className="mt-1 text-sm text-slate-600">Semua pengajuan yang Anda kirim beserta statusnya.</p>
        </div>
        <Link to="/ajukan" className="rounded-lg bg-primary px-5 py-2.5 text-sm font-semibold text-white hover:bg-primary-dark">
          Ajukan Layanan
        </Link>
      </div>

      {perbaikan.length > 0 && (
        <p className="mt-6 flex items-center gap-2 rounded-lg border border-orange-300 bg-orange-50 px-4 py-3 text-sm text-orange-900">
          <ExclamationTriangleIcon className="h-5 w-5 shrink-0" />
          {perbaikan.length} pengajuan perlu diperbaiki. Buka pengajuannya untuk melihat catatan petugas.
        </p>
      )}

      <div className="mt-6 overflow-x-auto rounded-xl border border-line bg-white">
        <table className="w-full min-w-[640px] text-left text-sm">
          <thead className="bg-surface text-xs uppercase tracking-wide text-slate-500">
            <tr>
              <th className="px-4 py-3">Nomor</th>
              <th className="px-4 py-3">Jenis</th>
              <th className="px-4 py-3">Perihal</th>
              <th className="px-4 py-3">Dibutuhkan</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3" />
            </tr>
          </thead>
          <tbody className="divide-y divide-line">
            {mine.length === 0 && (
              <tr><td colSpan={6} className="px-4 py-10 text-center text-slate-500">Belum ada pengajuan.</td></tr>
            )}
            {mine.map((r) => (
              <tr key={r.id}>
                <td className="px-4 py-3 font-semibold text-navy">{r.id}</td>
                <td className="px-4 py-3">{r.jenis}</td>
                <td className="max-w-[240px] truncate px-4 py-3">{r.perihal}</td>
                <td className="px-4 py-3">{fmtDate(r.tanggal)}</td>
                <td className="px-4 py-3"><StatusBadge status={r.status} /></td>
                <td className="px-4 py-3 text-right">
                  <Link to={`/pengajuan/${r.id}`} className="font-semibold text-primary">Lihat</Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
