import { useCallback, useEffect, useRef, useState } from "react";
import { ArrowUpTrayIcon, MagnifyingGlassIcon, TrashIcon } from "@heroicons/react/24/outline";
import { api } from "../../lib/api";
import { useToast } from "../../context/Toast";
import { useConfirm } from "../../context/Confirm";
import { useSubmit } from "../../lib/useSubmit";

const MAX_MB = 5;
const TABS = [
  { id: "guru", label: "Guru" },
  { id: "tendik", label: "Tenaga Kependidikan" },
];

export default function KelolaPegawai() {
  const toast = useToast();
  const confirm = useConfirm();
  const [data, setData] = useState({ guru: [], tendik: [] });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [tab, setTab] = useState("guru");
  const [q, setQ] = useState("");
  const [file, setFile] = useState(null);
  const [fileErr, setFileErr] = useState("");
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
    setFileErr("");
    if (!f) return setFile(null);
    if (!/\.(xlsx|xls)$/i.test(f.name)) { setFileErr("File harus berformat Excel (.xlsx atau .xls)."); e.target.value = ""; return setFile(null); }
    if (f.size > MAX_MB * 1024 * 1024) { setFileErr(`Ukuran file maksimal ${MAX_MB} MB.`); e.target.value = ""; return setFile(null); }
    setFile(f);
  };

  const [unggah, uploading] = useSubmit(async () => {
    if (!file) return;
    const ya = await confirm({
      title: "Ganti seluruh daftar pegawai?",
      description: "Daftar guru dan tenaga kependidikan yang sekarang akan diganti dengan isi file Excel ini.",
      items: [
        { label: "File", value: file.name },
        { label: "Guru saat ini", value: `${data.guru?.length ?? 0} orang` },
        { label: "Tendik saat ini", value: `${data.tendik?.length ?? 0} orang` },
      ],
      consequence: "Data yang ada sekarang akan tergantikan seluruhnya. Pastikan file sudah benar sebelum melanjutkan.",
      confirmText: "Ya, ganti daftar",
      tone: "warning",
      action: async () => {
        const fd = new FormData();
        fd.append("file", file);
        const res = await api("/admin/pegawai/import", { method: "POST", body: fd });
        toast.success(res?.message || "Daftar pegawai berhasil diperbarui.");
      },
    });
    if (ya) {
      setFile(null);
      if (inputRef.current) inputRef.current.value = "";
      await muat();
    }
  });

  const hapusSatu = async (r) => {
    const ya = await confirm({
      title: "Hapus pegawai ini?",
      description: "Data pegawai akan dihapus dari daftar di website.",
      items: [
        { label: "Nama", value: r.nama },
        { label: "Jabatan", value: r.jabatan },
        { label: "Kategori", value: tab === "guru" ? "Guru" : "Tenaga Kependidikan" },
      ],
      confirmText: "Hapus pegawai",
      tone: "danger",
      action: () => api(`/admin/pegawai/${r.id}`, { method: "DELETE" }),
    });
    if (ya) {
      toast.success(`${r.nama} dihapus dari daftar.`);
      muat();
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
          <input
            ref={inputRef}
            type="file"
            accept=".xlsx,.xls"
            onChange={pilihFile}
            aria-label="File Excel pegawai"
            aria-invalid={fileErr ? "true" : undefined}
            aria-describedby={fileErr ? "pegawai-file-err" : undefined}
            className="block text-sm"
          />
          <button
            type="button"
            disabled={!file || uploading}
            onClick={unggah}
            className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-primary-dark disabled:opacity-50"
          >
            <ArrowUpTrayIcon className="h-5 w-5" /> {uploading ? "Memproses..." : "Unggah"}
          </button>
        </div>
        {fileErr && <p id="pegawai-file-err" className="mt-2 text-xs font-medium text-red-600">{fileErr}</p>}
      </section>

      {error && (
        <div role="alert" className="mt-5 flex flex-wrap items-center justify-between gap-3 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          <span>{error}</span>
          <button type="button" onClick={muat} className="font-semibold underline">Coba lagi</button>
        </div>
      )}

      <div className="mt-6 flex flex-wrap items-center gap-3">
        <div role="tablist" className="inline-flex rounded-xl bg-surface p-1">
          {TABS.map((t) => (
            <button
              key={t.id}
              role="tab"
              type="button"
              aria-selected={tab === t.id}
              onClick={() => { setTab(t.id); setQ(""); }}
              className={`rounded-lg px-4 py-2 text-sm font-semibold transition-colors ${tab === t.id ? "bg-white text-primary shadow-sm" : "text-slate-500 hover:text-navy"}`}
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
            {!loading && !error && rows.length === 0 && <tr><td colSpan={4} className="px-4 py-10 text-center text-slate-500">Belum ada data. Unggah file Excel di atas.</td></tr>}
            {rows.map((r, i) => (
              <tr key={r.id}>
                <td className="px-4 py-3 text-slate-500">{i + 1}</td>
                <td className="px-4 py-3 font-semibold text-navy">{r.nama}</td>
                <td className="px-4 py-3">{r.jabatan}</td>
                <td className="px-4 py-3 text-right">
                  <button type="button" aria-label={`Hapus ${r.nama}`} onClick={() => hapusSatu(r)} className="rounded-lg p-2 text-slate-500 transition-colors hover:bg-red-50 hover:text-red-600">
                    <TrashIcon className="h-5 w-5" />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}