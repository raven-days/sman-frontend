import { useCallback, useEffect, useRef, useState } from "react";
import { PlusIcon, PencilSquareIcon, TrashIcon } from "@heroicons/react/24/outline";
import { api } from "../../lib/api";
import { tgl } from "../../lib/tanggal";
import { useToast } from "../../context/Toast";
import { useConfirm } from "../../context/Confirm";
import { useSubmit } from "../../lib/useSubmit";
import { useDirty, useUnsavedChanges } from "../../lib/useUnsaved";
import { galatPerKolom, fokusSalah } from "../../lib/validasi";
import Field, { inputCls } from "../../components/Field";
import Modal from "../../components/Modal";

const MAX_MB = 5;
const KATEGORI = ["Informasi", "Layanan", "Pembaruan", "Lainnya"];
const hariIni = () => new Date().toISOString().slice(0, 10);
const kosong = () => ({ id: null, judul: "", kategori: "Informasi", tanggal: hariIni(), isi: "", file: null, gambar: null, hapusGambar: false });

// Aturan validasi di sisi tampilan. Laravel tetap memeriksa ulang semuanya.
const ATURAN = {
  judul: (v) => {
    const t = String(v).trim();
    if (!t) return "Judul wajib diisi.";
    return t.length > 200 ? "Judul maksimal 200 karakter." : "";
  },
  tanggal: (v) => (v ? "" : "Tanggal wajib diisi."),
  isi: (v) => (String(v).trim() ? "" : "Isi pengumuman wajib diisi."),
};
const cekSemua = (f) =>
  Object.fromEntries(Object.entries(ATURAN).map(([k, fn]) => [k, fn(f[k])]).filter(([, m]) => m));

export default function KelolaPengumuman() {
  const toast = useToast();
  const confirm = useConfirm();
  const formRef = useRef(null);
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [form, setForm] = useState(null);
  const [errs, setErrs] = useState({});
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

  const dirty = useDirty(form);
  useUnsavedChanges(dirty);

  const ubah = (k) => (e) => {
    const v = e.target.value;
    setForm((f) => ({ ...f, [k]: v }));
    if (errs[k]) setErrs((x) => ({ ...x, [k]: ATURAN[k] ? ATURAN[k](v) : "" }));
  };
  const saatSelesaiIsi = (k) => () => ATURAN[k] && setErrs((x) => ({ ...x, [k]: ATURAN[k](form[k]) }));

  const pilihFile = (e) => {
    const f = e.target.files?.[0];
    if (!f) { setErrs((x) => ({ ...x, file: "" })); return setForm({ ...form, file: null }); }
    if (!["image/jpeg", "image/png", "image/webp"].includes(f.type)) { setErrs((x) => ({ ...x, file: "Gambar harus berformat JPG, PNG, atau WEBP." })); e.target.value = ""; return; }
    if (f.size > MAX_MB * 1024 * 1024) { setErrs((x) => ({ ...x, file: `Ukuran gambar maksimal ${MAX_MB} MB.` })); e.target.value = ""; return; }
    setErrs((x) => ({ ...x, file: "" }));
    setForm({ ...form, file: f, hapusGambar: false });
  };

  const [simpan, saving] = useSubmit(async (e) => {
    e.preventDefault();
    const salah = cekSemua(form);
    if (errs.file) salah.file = errs.file;
    setErrs(salah);
    if (Object.keys(salah).length) return fokusSalah(formRef.current);

    const fd = new FormData();
    ["judul", "kategori", "tanggal", "isi"].forEach((k) => fd.append(k, form[k] ?? ""));
    if (form.file) fd.append("gambar", form.file);
    if (form.hapusGambar) fd.append("hapus_gambar", "1");
    try {
      await api(form.id ? `/admin/pengumuman/${form.id}` : "/admin/pengumuman", { method: "POST", body: fd });
      toast.success(`Pengumuman berhasil ${form.id ? "diperbarui" : "diterbitkan"}.`);
      setForm(null);
      setErrs({});
      await muat();
    } catch (err) {
      if (err.status === 422 && err.errors) {
        setErrs(galatPerKolom(err.errors, { gambar: "file", hapus_gambar: "file" }));
        fokusSalah(formRef.current);
        toast.error("Periksa kembali isian yang ditandai.");
      } else {
        toast.galat(err);
      }
    }
  });

  const tutupForm = async () => {
    if (saving) return;
    if (dirty) {
      const buang = await confirm({
        title: "Buang perubahan?",
        description: "Isian yang belum disimpan akan hilang.",
        confirmText: "Buang",
        cancelText: "Lanjut mengisi",
        tone: "warning",
      });
      if (!buang) return;
    }
    setForm(null);
    setErrs({});
  };

  const hapusPengumuman = async (s) => {
    const ya = await confirm({
      title: "Hapus pengumuman ini?",
      description: "Pengumuman akan hilang dari beranda dan halaman Pengumuman, dan tidak dapat dikembalikan.",
      items: [
        { label: "Judul", value: s.judul },
        { label: "Kategori", value: s.kategori },
        { label: "Tanggal", value: tgl(s.tanggal) },
      ],
      consequence: s.gambar ? "Gambar pada pengumuman ini ikut terhapus." : undefined,
      confirmText: "Hapus pengumuman",
      tone: "danger",
      action: () => api(`/admin/pengumuman/${s.id}`, { method: "DELETE" }),
    });
    if (ya) {
      toast.success("Pengumuman dihapus.");
      muat();
    }
  };

  const bukaForm = (data) => { setErrs({}); setForm(data); };
  const gambarTampil = preview || (form && form.gambar && !form.hapusGambar ? form.gambar : null);

  return (
    <>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-extrabold text-navy">Kelola Pengumuman</h1>
          <p className="mt-1 text-sm text-slate-600">Pengumuman tampil di beranda (3 terbaru) dan di halaman Pengumuman.</p>
        </div>
        <button type="button" onClick={() => bukaForm(kosong())} className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-primary-dark active:scale-[0.98]">
          <PlusIcon className="h-5 w-5" /> Tambah Pengumuman
        </button>
      </div>

      {error && (
        <div role="alert" className="mt-5 flex flex-wrap items-center justify-between gap-3 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          <span>{error}</span>
          <button type="button" onClick={muat} className="font-semibold underline">Coba lagi</button>
        </div>
      )}

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
            {!loading && !error && rows.length === 0 && <tr><td colSpan={5} className="px-4 py-10 text-center text-slate-500">Belum ada pengumuman.</td></tr>}
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
                    <button type="button" aria-label={`Ubah ${s.judul}`} onClick={() => bukaForm({ id: s.id, judul: s.judul, kategori: s.kategori, tanggal: s.tanggal, isi: s.isi, file: null, gambar: s.gambar, hapusGambar: false })} className="rounded-lg p-2 text-slate-500 transition-colors hover:bg-blue-50 hover:text-primary">
                      <PencilSquareIcon className="h-5 w-5" />
                    </button>
                    <button type="button" aria-label={`Hapus ${s.judul}`} onClick={() => hapusPengumuman(s)} className="rounded-lg p-2 text-slate-500 transition-colors hover:bg-red-50 hover:text-red-600">
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
        <Modal title={form.id ? "Ubah Pengumuman" : "Tambah Pengumuman"} onClose={tutupForm} locked={saving}>
          <form ref={formRef} onSubmit={simpan} noValidate className="space-y-4">
            <Field label="Judul" required error={errs.judul}>
              {(p) => <input {...p} maxLength={200} value={form.judul} onChange={ubah("judul")} onBlur={saatSelesaiIsi("judul")} className={`${inputCls(errs.judul)} h-11`} />}
            </Field>
            <div className="grid grid-cols-2 gap-3">
              <Field label="Kategori" required error={errs.kategori}>
                {(p) => (
                  <select {...p} value={form.kategori} onChange={ubah("kategori")} className={`${inputCls(errs.kategori)} h-11`}>
                    {KATEGORI.map((k) => <option key={k}>{k}</option>)}
                  </select>
                )}
              </Field>
              <Field label="Tanggal" required error={errs.tanggal}>
                {(p) => <input {...p} type="date" value={form.tanggal} onChange={ubah("tanggal")} onBlur={saatSelesaiIsi("tanggal")} className={`${inputCls(errs.tanggal)} h-11`} />}
              </Field>
            </div>
            <Field label="Isi pengumuman" required error={errs.isi}>
              {(p) => <textarea {...p} rows={6} value={form.isi} onChange={ubah("isi")} onBlur={saatSelesaiIsi("isi")} className={`${inputCls(errs.isi)} py-2`} />}
            </Field>
            <div>
              <Field label={`Gambar (opsional, JPG/PNG/WEBP, maks. ${MAX_MB} MB)`} error={errs.file}>
                {(p) => <input {...p} type="file" accept="image/jpeg,image/png,image/webp" onChange={pilihFile} className="block w-full text-sm" />}
              </Field>
              {gambarTampil && <img src={gambarTampil} alt="Pratinjau gambar" className="mt-3 max-h-40 rounded-lg border border-line object-cover" />}
              {form.id && form.gambar && !form.file && (
                <label className="mt-2 flex items-center gap-2 text-sm text-slate-600">
                  <input type="checkbox" checked={form.hapusGambar} onChange={(e) => setForm({ ...form, hapusGambar: e.target.checked })} />
                  Hapus gambar yang ada
                </label>
              )}
            </div>
            <div className="flex justify-end gap-3 pt-2">
              <button type="button" onClick={tutupForm} disabled={saving} className="rounded-lg border border-line px-4 py-2.5 text-sm font-semibold text-navy transition-colors hover:bg-surface disabled:opacity-60">Batal</button>
              <button disabled={saving} className="rounded-lg bg-primary px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-primary-dark disabled:opacity-70">{saving ? "Menyimpan..." : "Simpan"}</button>
            </div>
          </form>
        </Modal>
      )}
    </>
  );
}