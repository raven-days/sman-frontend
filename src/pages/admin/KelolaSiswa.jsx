import { useCallback, useEffect, useRef, useState } from "react";
import { ArrowUpTrayIcon, MagnifyingGlassIcon, PencilSquareIcon, PlusIcon, TrashIcon } from "@heroicons/react/24/outline";
import { api } from "../../lib/api";
import { useToast } from "../../context/Toast";
import { useConfirm } from "../../context/Confirm";
import { useSubmit } from "../../lib/useSubmit";
import { galatPerKolom } from "../../lib/validasi";
import Field, { inputCls } from "../../components/Field";
import Modal from "../../components/Modal";

const MAX_MB = 5;
const KOSONG = { id: null, nis: "", nama: "", kelas: "" };

export default function KelolaSiswa() {
  const toast = useToast();
  const confirm = useConfirm();
  const inputRef = useRef(null);
  const [q, setQ] = useState("");
  const [halaman, setHalaman] = useState(1);
  const [data, setData] = useState({ data: [], total: 0, terakhir: 1, semua: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [file, setFile] = useState(null);
  const [fileErr, setFileErr] = useState("");
  const [form, setForm] = useState(null);
  const [errs, setErrs] = useState({});

  const muat = useCallback(async () => {
    try {
      setData(await api(`/admin/siswa?q=${encodeURIComponent(q)}&page=${halaman}`));
      setError("");
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, [q, halaman]);

  useEffect(() => {
    const t = setTimeout(muat, 300);
    return () => clearTimeout(t);
  }, [muat]);

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
    const fd = new FormData();
    fd.append("file", file);
    try {
      const res = await api("/admin/siswa/import", { method: "POST", body: fd });
      toast.success(res?.message || "Data siswa berhasil diimpor.");
      setFile(null);
      if (inputRef.current) inputRef.current.value = "";
      setHalaman(1);
      await muat();
    } catch (err) {
      toast.galat(err);
    }
  });

  const [simpan, saving] = useSubmit(async (e) => {
    e.preventDefault();
    const salah = {};
    if (!form.nis.trim()) salah.nis = "NIS wajib diisi.";
    if (!form.nama.trim()) salah.nama = "Nama wajib diisi.";
    setErrs(salah);
    if (Object.keys(salah).length) return;
    try {
      const body = { nis: form.nis.trim(), nama: form.nama.trim(), kelas: form.kelas.trim() };
      await api(form.id ? `/admin/siswa/${form.id}` : "/admin/siswa", { method: form.id ? "PUT" : "POST", body });
      toast.success(`Siswa ${body.nama} berhasil ${form.id ? "diperbarui" : "ditambahkan"}.`);
      setForm(null);
      await muat();
    } catch (err) {
      if (err.status === 422 && err.errors) setErrs(galatPerKolom(err.errors));
      else toast.galat(err);
    }
  });

  const hapus = async (s) => {
    const ya = await confirm({
      title: "Hapus siswa ini?",
      description: "Siswa akan hilang dari hasil pencarian NIS di form pengajuan.",
      items: [
        { label: "NIS", value: s.nis },
        { label: "Nama", value: s.nama },
        { label: "Kelas", value: s.kelas || "-" },
      ],
      confirmText: "Hapus siswa",
      tone: "danger",
      action: () => api(`/admin/siswa/${s.id}`, { method: "DELETE" }),
    });
    if (ya) {
      toast.success(`${s.nama} dihapus.`);
      muat();
    }
  };

  const ubah = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  return (
    <>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-extrabold text-navy">Kelola Siswa</h1>
          <p className="mt-1 text-sm text-slate-600">
            Data ini dipakai untuk pencarian NIS di form pengajuan siswa. Total <b>{data.semua}</b> siswa.
          </p>
        </div>
        <button
          type="button"
          onClick={() => { setErrs({}); setForm(KOSONG); }}
          className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-primary-dark"
        >
          <PlusIcon className="h-5 w-5" /> Tambah Siswa
        </button>
      </div>

      <section className="mt-6 rounded-xl border border-line bg-white p-5">
        <h2 className="font-bold text-navy">Impor dari Excel</h2>
        <p className="mt-1 text-sm text-slate-600">
          Baris judul harus memuat kolom <b>NIS</b>, <b>NAMA</b>, dan <b>KELAS</b>. NIS yang sudah ada akan <b>diperbarui</b>, yang baru <b>ditambahkan</b>. Data lain tidak dihapus.
        </p>
        <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center">
          <input ref={inputRef} type="file" accept=".xlsx,.xls" onChange={pilihFile} aria-label="File Excel siswa" className="block text-sm" />
          <button
            type="button"
            disabled={!file || uploading}
            onClick={unggah}
            className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-primary-dark disabled:opacity-50"
          >
            <ArrowUpTrayIcon className="h-5 w-5" /> {uploading ? "Memproses..." : "Unggah"}
          </button>
        </div>
        {fileErr && <p className="mt-2 text-xs font-medium text-red-600">{fileErr}</p>}
      </section>

      {error && (
        <div role="alert" className="mt-5 flex flex-wrap items-center justify-between gap-3 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          <span>{error}</span>
          <button type="button" onClick={muat} className="font-semibold underline">Coba lagi</button>
        </div>
      )}

      <div className="relative mt-6 max-w-sm">
        <MagnifyingGlassIcon className="pointer-events-none absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />
        <input
          value={q}
          onChange={(e) => { setQ(e.target.value); setHalaman(1); }}
          aria-label="Cari siswa"
          placeholder="Cari NIS, nama, atau kelas"
          className="h-11 w-full rounded-lg border border-line pl-10 pr-4 text-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
        />
      </div>

      <div className="mt-4 overflow-x-auto rounded-xl border border-line bg-white">
        <table className="w-full min-w-[560px] text-left text-sm">
          <thead className="bg-surface text-xs uppercase tracking-wide text-slate-500">
            <tr>
              <th className="px-4 py-3">NIS</th>
              <th className="px-4 py-3">Nama</th>
              <th className="px-4 py-3">Kelas</th>
              <th className="px-4 py-3 text-right">Aksi</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-line">
            {loading && <tr><td colSpan={4} className="px-4 py-10 text-center text-slate-500">Memuat data...</td></tr>}
            {!loading && !error && data.data.length === 0 && (
              <tr><td colSpan={4} className="px-4 py-10 text-center text-slate-500">Belum ada data siswa. Impor file Excel di atas.</td></tr>
            )}
            {data.data.map((s) => (
              <tr key={s.id}>
                <td className="px-4 py-3 font-semibold text-navy">{s.nis}</td>
                <td className="px-4 py-3">{s.nama}</td>
                <td className="px-4 py-3">{s.kelas || "-"}</td>
                <td className="px-4 py-3">
                  <div className="flex justify-end gap-1">
                    <button type="button" aria-label={`Ubah ${s.nama}`} onClick={() => { setErrs({}); setForm({ id: s.id, nis: s.nis, nama: s.nama, kelas: s.kelas ?? "" }); }} className="rounded-lg p-2 text-slate-500 transition-colors hover:bg-blue-50 hover:text-primary">
                      <PencilSquareIcon className="h-5 w-5" />
                    </button>
                    <button type="button" aria-label={`Hapus ${s.nama}`} onClick={() => hapus(s)} className="rounded-lg p-2 text-slate-500 transition-colors hover:bg-red-50 hover:text-red-600">
                      <TrashIcon className="h-5 w-5" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {data.terakhir > 1 && (
        <div className="mt-4 flex items-center justify-between text-sm">
          <span className="text-slate-500">Halaman {data.halaman} dari {data.terakhir} ({data.total} hasil)</span>
          <div className="flex gap-2">
            <button type="button" disabled={halaman <= 1} onClick={() => setHalaman(halaman - 1)} className="rounded-lg border border-line px-4 py-2 font-semibold text-navy hover:bg-surface disabled:opacity-40">Sebelumnya</button>
            <button type="button" disabled={halaman >= data.terakhir} onClick={() => setHalaman(halaman + 1)} className="rounded-lg border border-line px-4 py-2 font-semibold text-navy hover:bg-surface disabled:opacity-40">Berikutnya</button>
          </div>
        </div>
      )}

      {form && (
        <Modal title={form.id ? "Ubah Siswa" : "Tambah Siswa"} onClose={() => !saving && setForm(null)} locked={saving}>
          <form onSubmit={simpan} noValidate className="space-y-4">
            <Field label="NIS" required error={errs.nis}>
              {(p) => <input {...p} value={form.nis} onChange={ubah("nis")} className={`${inputCls(errs.nis)} h-11`} />}
            </Field>
            <Field label="Nama" required error={errs.nama}>
              {(p) => <input {...p} value={form.nama} onChange={ubah("nama")} className={`${inputCls(errs.nama)} h-11`} />}
            </Field>
            <Field label="Kelas" error={errs.kelas} hint="Contoh: XI IPA 2">
              {(p) => <input {...p} value={form.kelas} onChange={ubah("kelas")} className={`${inputCls(errs.kelas)} h-11`} />}
            </Field>
            <div className="flex justify-end gap-3 pt-2">
              <button type="button" onClick={() => setForm(null)} disabled={saving} className="rounded-lg border border-line px-4 py-2.5 text-sm font-semibold text-navy hover:bg-surface disabled:opacity-60">Batal</button>
              <button disabled={saving} className="rounded-lg bg-primary px-5 py-2.5 text-sm font-semibold text-white hover:bg-primary-dark disabled:opacity-70">
                {saving ? "Menyimpan..." : "Simpan"}
              </button>
            </div>
          </form>
        </Modal>
      )}
    </>
  );
}