import { useCallback, useEffect, useState } from "react";
import { PlusIcon, PencilSquareIcon, TrashIcon } from "@heroicons/react/24/outline";
import { api } from "../../lib/api";
import { tgl } from "../../lib/tanggal";
import Modal from "../../components/Modal";

const MAX_MB = 5;
const KATEGORI = ["Informasi", "Layanan", "Pembaruan", "Lainnya"];
const hariIni = () => new Date().toISOString().slice(0, 10);
const kosong = () => ({ id: null, judul: "", kategori: "Informasi", tanggal: hariIni(), isi: "", file: null, gambar: null, hapusGambar: false });
const input = "w-full rounded-lg border border-line px-3 text-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20";

export default function KelolaPengumuman() {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [form, setForm] = useState(null);
  const [formError, setFormError] = useState("");
  const [saving, setSaving] = useState(false);
  const [hapus, setHapus] = useState(null);
  const [preview, setPreview] = useState(null);

  const muat = useCallback(async () => {
    try {
      setRows(await api("/pengumuman"));
      setError("");
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { muat(); }, [muat]);

  useEffect(() => {
    if (!form?.file) { setPreview(null); return; }
    const u = URL.createObjectURL(form.file);
    setPreview(u);
    return () => URL.revokeObjectURL(u);
  }, [form?.file]);

  const ubah = (k) => (e) => setForm({ ...form, [k]: e.target.value });

  const pilihFile = (e) => {
    const f = e.target.files?.[0];
    if (!f) return setForm({ ...form, file: null });
    if (!["image/jpeg", "image/png", "image/webp"].includes(f.type)) { setFormError("Gambar harus berformat JPG, PNG, atau WEBP."); e.target.value = ""; return; }
    if (f.size > MAX_MB * 1024 * 1024) { setFormError(`Ukuran gambar maksimal ${MAX_MB} MB.`); e.target.value = ""; return; }
    setFormError("");
    setForm({ ...form, file: f, hapusGambar: false });
  };

  const simpan = async (e) => {
    e.preventDefault();
    setSaving(true);
    setFormError("");
    const fd = new FormData();
    ["judul", "kategori", "tanggal", "isi"].forEach((k) => fd.append(k, form[k] ?? ""));
    if (form.file) fd.append("gambar", form.file);
    if (form.hapusGambar) fd.append("hapus_gambar", "1");
    try {
      await api(form.id ? `/admin/pengumuman/${form.id}` : "/admin/pengumuman", { method: "POST", body: fd });
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
      await api(`/admin/pengumuman/${hapus.id}`, { method: "DELETE" });
      setHapus(null);
      await muat();
    } catch (err) {
      setError(err.message);
      setHapus(null);
    }
  };

  const gambarTampil = preview || (form && form.gambar && !form.hapusGambar ? form.gambar : null);

  return (
    <>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-extrabold text-navy">Kelola Pengumuman</h1>
          <p className="mt-1 text-sm text-slate-600">Pengumuman tampil di beranda (3 terbaru) dan di halaman Pengumuman.</p>
        </div>
        <button type="button" onClick={() => { setFormError(""); setForm(kosong()); }} className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2.5 text-sm font-semibold text-white hover:bg-primary-dark">
          <PlusIcon className="h-5 w-5" /> Tambah Pengumuman
        </button>
      </div>

      {error && <p role="alert" className="mt-5 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</p>}

      <div className="mt-6 overflow-x-auto rounded-xl border border-line bg-white">
        <table className="w-full min-w-[720px] text-left text-sm">
          <thead className="bg-surface text-xs uppercase tracking-wide text-slate-500">
            <tr>
              <th className="w-20 px-4 py-3">Gambar</th>
              <th className="px-4 py-3">Judul</th>
              <th className="px-4 py-3">Kategori</th>
              <th className="px-4 py-3">Tanggal</th>
              <th className="px-4 py-3 text-right">Aksi</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-line">
            {loading && <tr><td colSpan={5} className="px-4 py-10 text-center text-slate-500">Memuat data...</td></tr>}
            {!loading && rows.length === 0 && <tr><td colSpan={5} className="px-4 py-10 text-center text-slate-500">Belum ada pengumuman.</td></tr>}
            {rows.map((s) => (
              <tr key={s.id}>
                <td className="px-4 py-3">
                  {s.gambar ? <img src={s.gambar} alt="" className="h-12 w-16 rounded object-cover" /> : <span className="text-xs text-slate-400">-</span>}
                </td>
                <td className="px-4 py-3 font-semibold text-navy">{s.judul}</td>
                <td className="px-4 py-3">{s.kategori}</td>
                <td className="px-4 py-3">{tgl(s.tanggal)}</td>
                <td className="px-4 py-3">
                  <div className="flex justify-end gap-1">
                    <button type="button" aria-label={`Ubah ${s.judul}`} onClick={() => { setFormError(""); setForm({ id: s.id, judul: s.judul, kategori: s.kategori, tanggal: s.tanggal, isi: s.isi, file: null, gambar: s.gambar, hapusGambar: false }); }} className="rounded-lg p-2 text-slate-500 hover:bg-blue-50 hover:text-primary">
                      <PencilSquareIcon className="h-5 w-5" />
                    </button>
                    <button type="button" aria-label={`Hapus ${s.judul}`} onClick={() => setHapus(s)} className="rounded-lg p-2 text-slate-500 hover:bg-red-50 hover:text-red-600">
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
        <Modal title={form.id ? "Ubah Pengumuman" : "Tambah Pengumuman"} onClose={() => setForm(null)}>
          <form onSubmit={simpan} className="space-y-4">
            <div>
              <label htmlFor="p-judul" className="mb-1 block text-sm font-semibold text-navy">Judul *</label>
              <input id="p-judul" required maxLength={200} value={form.judul} onChange={ubah("judul")} className={`${input} h-11`} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label htmlFor="p-kat" className="mb-1 block text-sm font-semibold text-navy">Kategori *</label>
                <select id="p-kat" value={form.kategori} onChange={ubah("kategori")} className={`${input} h-11`}>
                  {KATEGORI.map((k) => <option key={k}>{k}</option>)}
                </select>
              </div>
              <div>
                <label htmlFor="p-tgl" className="mb-1 block text-sm font-semibold text-navy">Tanggal *</label>
                <input id="p-tgl" required type="date" value={form.tanggal} onChange={ubah("tanggal")} className={`${input} h-11`} />
              </div>
            </div>
            <div>
              <label htmlFor="p-isi" className="mb-1 block text-sm font-semibold text-navy">Isi pengumuman *</label>
              <textarea id="p-isi" required rows={6} value={form.isi} onChange={ubah("isi")} className={`${input} py-2`} />
            </div>
            <div>
              <label htmlFor="p-img" className="mb-1 block text-sm font-semibold text-navy">Gambar (opsional, JPG/PNG/WEBP, maks. {MAX_MB} MB)</label>
              <input id="p-img" type="file" accept="image/jpeg,image/png,image/webp" onChange={pilihFile} className="block w-full text-sm" />
              {gambarTampil && <img src={gambarTampil} alt="Pratinjau gambar" className="mt-3 max-h-40 rounded-lg border border-line object-cover" />}
              {form.id && form.gambar && !form.file && (
                <label className="mt-2 flex items-center gap-2 text-sm text-slate-600">
                  <input type="checkbox" checked={form.hapusGambar} onChange={(e) => setForm({ ...form, hapusGambar: e.target.checked })} />
                  Hapus gambar yang ada
                </label>
              )}
            </div>
            {formError && <p role="alert" className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{formError}</p>}
            <div className="flex justify-end gap-3 pt-2">
              <button type="button" onClick={() => setForm(null)} className="rounded-lg border border-line px-4 py-2.5 text-sm font-semibold text-navy hover:bg-surface">Batal</button>
              <button disabled={saving} className="rounded-lg bg-primary px-5 py-2.5 text-sm font-semibold text-white hover:bg-primary-dark disabled:opacity-70">{saving ? "Menyimpan..." : "Simpan"}</button>
            </div>
          </form>
        </Modal>
      )}

      {hapus && (
        <Modal
          title="Hapus pengumuman?"
          onClose={() => setHapus(null)}
          footer={
            <>
              <button type="button" onClick={() => setHapus(null)} className="rounded-lg border border-line px-4 py-2.5 text-sm font-semibold text-navy hover:bg-surface">Batal</button>
              <button type="button" onClick={konfirmasiHapus} className="rounded-lg bg-red-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-red-700">Hapus</button>
            </>
          }
        >
          <p className="text-sm text-slate-700"><b>{hapus.judul}</b> akan dihapus dari website beserta gambarnya.</p>
        </Modal>
      )}
    </>
  );
}