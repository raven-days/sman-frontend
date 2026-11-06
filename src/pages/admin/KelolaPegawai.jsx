import { useCallback, useEffect, useRef, useState } from "react";
import { ArrowUpTrayIcon, MagnifyingGlassIcon, TrashIcon } from "@heroicons/react/24/outline";
import { api } from "../../lib/api";
import Modal from "../../components/Modal";

const MAX_MB = 5;
const TABS = [
  { id: "guru", label: "Guru" },
  { id: "tendik", label: "Tenaga Kependidikan" },
];

export default function KelolaPegawai() {
  const [data, setData] = useState({ guru: [], tendik: [] });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [tab, setTab] = useState("guru");
  const [q, setQ] = useState("");
  const [file, setFile] = useState(null);
  const [konfirmasi, setKonfirmasi] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [hasil, setHasil] = useState("");
  const [hapus, setHapus] = useState(null);
  const inputRef = useRef(null);

  const muat = useCallback(async () => {
    try {
      setData(await api("/admin/pegawai"));
      setError("");
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { muat(); }, [muat]);

  const pilihFile = (e) => {
    const f = e.target.files?.[0];
    setHasil("");
    if (!f) return setFile(null);
    if (!/\.(xlsx|xls)$/i.test(f.name)) { setError("File harus berformat Excel (.xlsx atau .xls)."); e.target.value = ""; return setFile(null); }
    if (f.size > MAX_MB * 1024 * 1024) { setError(`Ukuran file maksimal ${MAX_MB} MB.`); e.target.value = ""; return setFile(null); }
    setError("");
    setFile(f);
  };

  const unggah = async () => {
    setKonfirmasi(false);
    setUploading(true);
    setError("");
    const fd = new FormData();
    fd.append("file", file);
    try {
      const res = await api("/admin/pegawai/import", { method: "POST", body: fd });
      setHasil(res.message);
      setFile(null);
      if (inputRef.current) inputRef.current.value = "";
      await muat();
    } catch (err) {
      setError(err.errors ? Object.values(err.errors)[0][0] : err.message);
    } finally {
      setUploading(false);
    }
  };

  const hapusSatu = async () => {
    try {
      await api(`/admin/pegawai/${hapus.id}`, { method: "DELETE" });
      setHapus(null);
      await muat();
    } catch (err) {
      setError(err.message);
      setHapus(null);
    }
  };

  const rows = (data[tab] ?? []).filter((r) => `${r.nama} ${r.jabatan}`.toLowerCase().includes(q.toLowerCase()));

  return (
    <>
      <h1 className="text-2xl font-extrabold text-navy">Kelola Pegawai</h1>
      <p className="mt-1 text-sm text-slate-600">Daftar guru dan tenaga kependidikan yang tampil di menu Kepegawaian website.</p>

      <section className="mt-6 rounded-xl border border-line bg-white p-5">
        <h2 className="font-bold text-navy">Unggah file Excel</h2>
        <p className="mt-1 text-sm text-slate-600">
          Sheet harus memuat kata <b>Guru</b> atau <b>Tendik</b> pada namanya, dengan kolom <b>NAMA</b> dan <b>Jabatan</b>.
          Mengunggah file akan <b>mengganti seluruh daftar</b> yang ada.
        </p>
        <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center">
          <input ref={inputRef} type="file" accept=".xlsx,.xls" onChange={pilihFile} aria-label="File Excel pegawai" className="block text-sm" />
          <button
            type="button"
            disabled={!file || uploading}
            onClick={() => setKonfirmasi(true)}
            className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2.5 text-sm font-semibold text-white hover:bg-primary-dark disabled:opacity-50"
          >
            <ArrowUpTrayIcon className="h-5 w-5" /> {uploading ? "Mengunggah..." : "Unggah"}
          </button>
        </div>
        {hasil && <p role="status" className="mt-4 rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-800">{hasil}</p>}
      </section>

      {error && <p role="alert" className="mt-5 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</p>}

      <div className="mt-6 flex flex-wrap items-center gap-3">
        <div role="tablist" className="inline-flex rounded-xl bg-surface p-1">
          {TABS.map((t) => (
            <button
              key={t.id}
              role="tab"
              type="button"
              aria-selected={tab === t.id}
              onClick={() => { setTab(t.id); setQ(""); }}
              className={`rounded-lg px-4 py-2 text-sm font-semibold ${tab === t.id ? "bg-white text-primary shadow-sm" : "text-slate-500 hover:text-navy"}`}
            >
              {t.label} <span className="text-xs font-normal text-slate-400">({data[t.id]?.length ?? 0})</span>
            </button>
          ))}
        </div>
        <div className="relative min-w-[220px] flex-1 sm:max-w-sm">
          <MagnifyingGlassIcon className="pointer-events-none absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />
          <input value={q} onChange={(e) => setQ(e.target.value)} aria-label="Cari nama atau jabatan" placeholder="Cari nama atau jabatan"
            className="h-11 w-full rounded-lg border border-line pl-10 pr-4 text-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20" />
        </div>
      </div>

      <div className="mt-4 overflow-x-auto rounded-xl border border-line bg-white">
        <table className="w-full min-w-[560px] text-left text-sm">
          <thead className="bg-surface text-xs uppercase tracking-wide text-slate-500">
            <tr>
              <th className="w-14 px-4 py-3">No.</th>
              <th className="px-4 py-3">Nama</th>
              <th className="px-4 py-3">Jabatan</th>
              <th className="px-4 py-3 text-right">Aksi</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-line">
            {loading && <tr><td colSpan={4} className="px-4 py-10 text-center text-slate-500">Memuat data...</td></tr>}
            {!loading && rows.length === 0 && <tr><td colSpan={4} className="px-4 py-10 text-center text-slate-500">Belum ada data. Unggah file Excel di atas.</td></tr>}
            {rows.map((r, i) => (
              <tr key={r.id}>
                <td className="px-4 py-3 text-slate-500">{i + 1}</td>
                <td className="px-4 py-3 font-semibold text-navy">{r.nama}</td>
                <td className="px-4 py-3">{r.jabatan}</td>
                <td className="px-4 py-3 text-right">
                  <button type="button" aria-label={`Hapus ${r.nama}`} onClick={() => setHapus(r)} className="rounded-lg p-2 text-slate-500 hover:bg-red-50 hover:text-red-600">
                    <TrashIcon className="h-5 w-5" />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {konfirmasi && (
        <Modal
          title="Ganti seluruh daftar pegawai?"
          onClose={() => setKonfirmasi(false)}
          footer={
            <>
              <button type="button" onClick={() => setKonfirmasi(false)} className="rounded-lg border border-line px-4 py-2.5 text-sm font-semibold text-navy hover:bg-surface">Batal</button>
              <button type="button" onClick={unggah} className="rounded-lg bg-primary px-5 py-2.5 text-sm font-semibold text-white hover:bg-primary-dark">Ya, ganti</button>
            </>
          }
        >
          <p className="text-sm text-slate-700">Daftar guru dan tenaga kependidikan yang sekarang akan diganti dengan isi file <b>{file?.name}</b>.</p>
        </Modal>
      )}

      {hapus && (
        <Modal
          title="Hapus pegawai?"
          onClose={() => setHapus(null)}
          footer={
            <>
              <button type="button" onClick={() => setHapus(null)} className="rounded-lg border border-line px-4 py-2.5 text-sm font-semibold text-navy hover:bg-surface">Batal</button>
              <button type="button" onClick={hapusSatu} className="rounded-lg bg-red-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-red-700">Hapus</button>
            </>
          }
        >
          <p className="text-sm text-slate-700"><b>{hapus.nama}</b> akan dihapus dari daftar di website.</p>
        </Modal>
      )}
    </>
  );
}