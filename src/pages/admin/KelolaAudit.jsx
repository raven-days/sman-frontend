import { useEffect, useState } from "react";
import { api } from "../../lib/api";

const AKSI = [
  ["", "Semua aksi"],
  ["login", "Login berhasil"],
  ["login_gagal", "Login gagal"],
  ["akun_terkunci", "Akun terkunci"],
  ["login_ditolak_nonaktif", "Ditolak (nonaktif)"],
  ["ganti_sandi", "Ganti sandi"],
  ["logout", "Logout"],
  ["akun_buat", "Akun dibuat"],
  ["akun_ubah", "Akun diubah"],
  ["akun_aktif", "Akun diaktifkan"],
  ["akun_nonaktif", "Akun dinonaktifkan"],
  ["akun_buka_kunci", "Kunci akun dibuka"],
  ["akun_reset_sandi", "Sandi akun direset"],
  ["pengajuan_status", "Status pengajuan"],
  ["sk_tambah", "SK ditambah"],
  ["sk_ubah", "SK diubah"],
  ["sk_hapus", "SK dihapus"],
  ["pengumuman_tambah", "Pengumuman ditambah"],
  ["pengumuman_ubah", "Pengumuman diubah"],
  ["pengumuman_hapus", "Pengumuman dihapus"],
  ["pegawai_impor", "Impor pegawai"],
  ["pegawai_hapus", "Pegawai dihapus"],
  ["konfirmasi_sandi", "Konfirmasi sandi"],
  ["konfirmasi_sandi_gagal", "Konfirmasi sandi gagal"],
  ["akun_impor", "Impor akun"],
];

export default function KelolaAudit() {
  const [aksi, setAksi] = useState("");
  const [page, setPage] = useState(1);
  const [hasil, setHasil] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let batal = false;
    setLoading(true);
    const qs = new URLSearchParams({ page });
    if (aksi) qs.set("aksi", aksi);
    api(`/admin/audit?${qs}`)
      .then((d) => { if (!batal) { setHasil(d); setError(""); } })
      .catch((e) => { if (!batal) setError(e.message); })
      .finally(() => { if (!batal) setLoading(false); });
    return () => { batal = true; };
  }, [aksi, page]);

  const baris = hasil?.data ?? [];
  const terakhir = hasil?.last_page ?? 1;

  return (
    <>
      <h1 className="text-2xl font-extrabold text-navy">Log Audit</h1>
      <p className="mt-1 text-sm text-slate-600">Catatan siapa melakukan apa, dan kapan. Data ini tidak bisa diubah dari website.</p>

      <div className="mt-5">
        <label htmlFor="aksi" className="sr-only">Filter aksi</label>
        <select
          id="aksi"
          value={aksi}
          onChange={(e) => { setAksi(e.target.value); setPage(1); }}
          className="h-11 rounded-lg border border-line px-3 text-sm"
        >
          {AKSI.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
        </select>
      </div>

      {error && <p role="alert" className="mt-5 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</p>}

      <div className="mt-5 overflow-x-auto rounded-xl border border-line bg-white">
        <table className="w-full min-w-[720px] text-left text-sm">
          <thead className="bg-surface text-xs uppercase tracking-wide text-slate-500">
            <tr>
              <th className="px-4 py-3">Waktu</th>
              <th className="px-4 py-3">Pengguna</th>
              <th className="px-4 py-3">Aksi</th>
              <th className="px-4 py-3">Keterangan</th>
              <th className="px-4 py-3">IP</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-line">
            {loading && <tr><td colSpan={5} className="px-4 py-10 text-center text-slate-500">Memuat data...</td></tr>}
            {!loading && !error && baris.length === 0 && (
              <tr><td colSpan={5} className="px-4 py-10 text-center text-slate-500">Belum ada catatan.</td></tr>
            )}
            {baris.map((l) => (
              <tr key={l.id}>
                <td className="whitespace-nowrap px-4 py-3">{l.waktu}</td>
                <td className="px-4 py-3 font-semibold text-navy">{l.username}</td>
                <td className="px-4 py-3"><code className="rounded bg-surface px-1.5 py-0.5 text-xs">{l.aksi}</code></td>
                <td className="px-4 py-3">{l.keterangan}</td>
                <td className="whitespace-nowrap px-4 py-3 text-slate-500">{l.ip}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="mt-4 flex items-center justify-between text-sm">
        <button type="button" disabled={page <= 1 || loading} onClick={() => setPage((p) => p - 1)} className="rounded-lg border border-line bg-white px-4 py-2 font-semibold text-navy disabled:opacity-50">
          Sebelumnya
        </button>
        <span className="text-slate-600">Halaman {page} dari {terakhir}</span>
        <button type="button" disabled={page >= terakhir || loading} onClick={() => setPage((p) => p + 1)} className="rounded-lg border border-line bg-white px-4 py-2 font-semibold text-navy disabled:opacity-50">
          Berikutnya
        </button>
      </div>
    </>
  );
}