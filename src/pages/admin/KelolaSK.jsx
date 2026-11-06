import { useCallback, useEffect, useState } from "react";
import { PlusIcon, PencilSquareIcon, TrashIcon } from "@heroicons/react/24/outline";
import { api } from "../../lib/api";
import Modal from "../../components/Modal";

const MAX_MB = 5;
const kosong = () => ({ id: null, nomor: "", tentang: "", tahun: new Date().getFullYear(), kategori: "", file: null, adaFile: false });
const input = "h-11 w-full rounded-lg border border-line px-3 text-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20";

export default function KelolaSK() {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [form, setForm] = useState(null);
  const [formError, setFormError] = useState("");
  const [saving, setSaving] = useState(false);
  const [hapus, setHapus] = useState(null);

  const muat = useCallback(async () => {
    try {
      setRows(await api("/sk"));
      setError("");
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { muat(); }, [muat]);

  const ubah = (k) => (e) => setForm({ ...form, [k]: e.target.value });

  const pilihFile = (e) => {
    const f = e.target.files?.[0];
    if (!f) return setForm({ ...form, file: null });
    if (f.type !== "application/pdf") { setFormError("File harus berformat PDF."); e.target.value = ""; return; }
    if (f.size > MAX_MB * 1024 * 1024) { setFormError(`Ukuran file maksimal ${MAX_MB} MB.`); e.target.value = ""; return; }
    setFormError("");
    setForm({ ...form, file: f });
  };

  const simpan = async (e) => {
    e.preventDefault();
    setSaving(true);
    setFormError("");
    const fd = new FormData();
    ["nomor", "tentang", "tahun", "kategori"].forEach((k) => fd.append(k, form[k] ?? ""));
    if (form.file) fd.append("file", form.file);
    try {
      await api(form.id ? `/admin/sk/${form.id}` : "/admin/sk", { method: "POST", body: fd });
      setForm(null);
      await muat();
    } catch (err) {
      setFormError(err.errors ? Object.values(err.errors)[0][0] : err.message);
    } finally {
      setSaving(false);
    }
  };

  const konfirmasiHapus = async () => {
    try {
      await api(`/admin/sk/${hapus.id}`, { method: "DELETE" });
      setHapus(null);
      await muat();
    } catch (err) {
      setError(err.message);
      setHapus(null);
    }
  };

  return (
    <>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-extrabold text-navy">Kelola Surat Keputusan</h1>
          <p className="mt-1 text-sm text-slate-600">SK yang ditambahkan di sini langsung tampil di halaman Surat Keputusan website.</p>
        </div>
        <button
          type="button"
          onClick={() => { setFormError(""); setForm(kosong()); }}
          className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2.5 text-sm font-semibold text-white hover:bg-primary-dark"
        >
          <PlusIcon className="h-5 w-5" /> Tambah SK
        </button>
      </div>

      {error && <p role="alert" className="mt-5 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</p>}

      <div className="mt-6 overflow-x-auto rounded-xl border border-line bg-white">
        <table className="w-full min-w-[720px] text-left text-sm">
          <thead className="bg-surface text-xs uppercase tracking-wide text-slate-500">
            <tr>
              <th className="px-4 py-3">Nomor SK</th>
              <th className="px-4 py-3">Tentang</th>
              <th className="px-4 py-3">Tahun</th>
              <th className="px-4 py-3">Berkas</th>
              <th className="px-4 py-3 text-right">Aksi</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-line">
            {loading && <tr><td colSpan={5} className="px-4 py-10 text-center text-slate-500">Memuat data...</td></tr>}
            {!loading && rows.length === 0 && <tr><td colSpan={5} className="px-4 py-10 text-center text-slate-500">Belum ada SK. Klik "Tambah SK".</td></tr>}
            {rows.map((s) => (
              <tr key={s.id}>
                <td className="px-4 py-3 font-semibold text-navy">{s.nomor}</td>
                <td className="px-4 py-3">{s.tentang}</td>
                <td className="px-4 py-3">{s.tahun}</td>
                <td className="px-4 py-3">
                  {s.file ? <a href={s.file} target="_blank" rel="noreferrer" className="font-semibold text-primary">Lihat PDF</a> : <span className="text-xs text-slate-400">Belum ada</span>}
                </td>
                <td className="px-4 py-3">
                  <div className="flex justify-end gap-1">
                    <button type="button" aria-label={`Ubah ${s.nomor}`} onClick={() => { setFormError(""); setForm({ id: s.id, nomor: s.nomor, tentang: s.tentang, tahun: s.tahun, kategori: s.kategori ?? "", file: null, adaFile: !!s.file }); }} className="rounded-lg p-2 text-slate-500 hover:bg-blue-50 hover:text-primary">
                      <PencilSquareIcon className="h-5 w-5" />
                    </button>
                    <button type="button" aria-label={`Hapus ${s.nomor}`} onClick={() => setHapus(s)} className="rounded-lg p-2 text-slate-500 hover:bg-red-50 hover:text-red-600">
                      <TrashIcon className="h-5 w-5" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {form && (
        <Modal title={form.id ? "Ubah SK" : "Tambah SK"} onClose={() => setForm(null)}>
          <form onSubmit={simpan} className="space-y-4">
            <div>
              <label htmlFor="sk-nomor" className="mb-1 block text-sm font-semibold text-navy">Nomor SK *</label>
              <input id="sk-nomor" required value={form.nomor} onChange={ubah("nomor")} className={input} />
            </div>
            <div>
              <label htmlFor="sk-tentang" className="mb-1 block text-sm font-semibold text-navy">Tentang *</label>
              <input id="sk-tentang" required value={form.tentang} onChange={ubah("tentang")} className={input} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label htmlFor="sk-tahun" className="mb-1 block text-sm font-semibold text-navy">Tahun *</label>
                <input id="sk-tahun" required type="number" min="1990" max="2100" value={form.tahun} onChange={ubah("tahun")} className={input} />
              </div>
              <div>
                <label htmlFor="sk-kat" className="mb-1 block text-sm font-semibold text-navy">Kategori</label>
                <input id="sk-kat" value={form.kategori} onChange={ubah("kategori")} className={input} />
              </div>
            </div>
            <div>
              <label htmlFor="sk-file" className="mb-1 block text-sm font-semibold text-navy">File PDF (maks. {MAX_MB} MB)</label>
              <input id="sk-file" type="file" accept="application/pdf" onChange={pilihFile} className="block w-full text-sm" />
              {form.id && form.adaFile && <p className="mt-1 text-xs text-slate-500">Sudah ada file. Pilih file baru hanya jika ingin menggantinya.</p>}
            </div>
            {formError && <p role="alert" className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{formError}</p>}
            <div className="flex justify-end gap-3 pt-2">
              <button type="button" onClick={() => setForm(null)} className="rounded-lg border border-line px-4 py-2.5 text-sm font-semibold text-navy hover:bg-surface">Batal</button>
              <button disabled={saving} className="rounded-lg bg-primary px-5 py-2.5 text-sm font-semibold text-white hover:bg-primary-dark disabled:opacity-70">
                {saving ? "Menyimpan..." : "Simpan"}
              </button>
            </div>
          </form>
        </Modal>
      )}

      {hapus && (
        <Modal
          title="Hapus SK?"
          onClose={() => setHapus(null)}
          footer={
            <>
              <button type="button" onClick={() => setHapus(null)} className="rounded-lg border border-line px-4 py-2.5 text-sm font-semibold text-navy hover:bg-surface">Batal</button>
              <button type="button" onClick={konfirmasiHapus} className="rounded-lg bg-red-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-red-700">Hapus</button>
            </>
          }
        >
          <p className="text-sm text-slate-700">SK <b>{hapus.nomor}</b> beserta file PDF-nya akan dihapus dan hilang dari website. Tindakan ini tidak bisa dibatalkan.</p>
        </Modal>
      )}
    </>
  );
}