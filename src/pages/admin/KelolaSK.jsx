import { useCallback, useEffect, useRef, useState } from "react";
import { PlusIcon, PencilSquareIcon, TrashIcon } from "@heroicons/react/24/outline";
import { api } from "../../lib/api";
import { useToast } from "../../context/Toast";
import { useConfirm } from "../../context/Confirm";
import { useSubmit } from "../../lib/useSubmit";
import { useDirty, useUnsavedChanges } from "../../lib/useUnsaved";
import { galatPerKolom, fokusSalah } from "../../lib/validasi";
import Field, { inputCls } from "../../components/Field";
import Modal from "../../components/Modal";

const MAX_MB = 5;
const kosong = () => ({ id: null, nomor: "", tentang: "", tahun: new Date().getFullYear(), kategori: "", file: null, adaFile: false });

// Aturan validasi di sisi tampilan. Laravel tetap memeriksa ulang semuanya.
const ATURAN = {
  nomor: (v) => (String(v).trim() ? "" : "Nomor SK wajib diisi."),
  tentang: (v) => (String(v).trim() ? "" : "Kolom Tentang wajib diisi."),
  tahun: (v) => {
    if (!String(v).trim()) return "Tahun wajib diisi.";
    const n = Number(v);
    return Number.isInteger(n) && n >= 1990 && n <= 2100 ? "" : "Tahun harus antara 1990 dan 2100.";
  },
};
const cekSemua = (f) =>
  Object.fromEntries(Object.entries(ATURAN).map(([k, fn]) => [k, fn(f[k])]).filter(([, m]) => m));

export default function KelolaSK() {
  const toast = useToast();
  const confirm = useConfirm();
  const formRef = useRef(null);
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [form, setForm] = useState(null);
  const [errs, setErrs] = useState({});

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

  const dirty = useDirty(form);
  useUnsavedChanges(dirty);

  const ubah = (k) => (e) => {
    const v = e.target.value;
    setForm((f) => ({ ...f, [k]: v }));
    if (errs[k]) setErrs((x) => ({ ...x, [k]: ATURAN[k] ? ATURAN[k](v) : "" })); // error hilang begitu diperbaiki
  };
  const saatSelesaiIsi = (k) => () => ATURAN[k] && setErrs((x) => ({ ...x, [k]: ATURAN[k](form[k]) }));

  const pilihFile = (e) => {
    const f = e.target.files?.[0];
    if (!f) { setErrs((x) => ({ ...x, file: "" })); return setForm({ ...form, file: null }); }
    if (f.type !== "application/pdf") { setErrs((x) => ({ ...x, file: "File harus berformat PDF." })); e.target.value = ""; return; }
    if (f.size > MAX_MB * 1024 * 1024) { setErrs((x) => ({ ...x, file: `Ukuran file maksimal ${MAX_MB} MB.` })); e.target.value = ""; return; }
    setErrs((x) => ({ ...x, file: "" }));
    setForm({ ...form, file: f });
  };

  const [simpan, saving] = useSubmit(async (e) => {
    e.preventDefault();
    const salah = cekSemua(form);
    if (errs.file) salah.file = errs.file;
    setErrs(salah);
    if (Object.keys(salah).length) return fokusSalah(formRef.current);

    const fd = new FormData();
    ["nomor", "tentang", "tahun", "kategori"].forEach((k) => fd.append(k, form[k] ?? ""));
    if (form.file) fd.append("file", form.file);
    try {
      await api(form.id ? `/admin/sk/${form.id}` : "/admin/sk", { method: "POST", body: fd });
      toast.success(`SK ${form.nomor} berhasil ${form.id ? "diperbarui" : "ditambahkan"}.`);
      setForm(null);
      setErrs({});
      await muat();
    } catch (err) {
      if (err.status === 422 && err.errors) {
        setErrs(galatPerKolom(err.errors));
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

  const hapusSK = async (s) => {
    const ya = await confirm({
      title: "Hapus SK ini?",
      description: "SK akan dihapus dari website dan tidak dapat dikembalikan.",
      items: [
        { label: "Nomor SK", value: s.nomor },
        { label: "Tentang", value: s.tentang },
        { label: "Tahun", value: s.tahun },
      ],
      consequence: "File PDF yang terlampir ikut terhapus.",
      confirmText: "Hapus SK",
      tone: "danger",
      action: () => api(`/admin/sk/${s.id}`, { method: "DELETE" }),
    });
    if (ya) {
      toast.success(`SK ${s.nomor} dihapus.`);
      muat();
    }
  };

  const bukaForm = (data) => { setErrs({}); setForm(data); };

  return (
    <>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-extrabold text-navy">Kelola Surat Keputusan</h1>
          <p className="mt-1 text-sm text-slate-600">SK yang ditambahkan di sini langsung tampil di halaman Surat Keputusan website.</p>
        </div>
        <button
          type="button"
          onClick={() => bukaForm(kosong())}
          className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-primary-dark active:scale-[0.98]"
        >
          <PlusIcon className="h-5 w-5" /> Tambah SK
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
              <th className="px-4 py-3">Nomor SK</th>
              <th className="px-4 py-3">Tentang</th>
              <th className="px-4 py-3">Tahun</th>
              <th className="px-4 py-3">Berkas</th>
              <th className="px-4 py-3 text-right">Aksi</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-line">
            {loading && <tr><td colSpan={5} className="px-4 py-10 text-center text-slate-500">Memuat data...</td></tr>}
            {!loading && !error && rows.length === 0 && <tr><td colSpan={5} className="px-4 py-10 text-center text-slate-500">Belum ada SK. Klik "Tambah SK".</td></tr>}
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
                    <button type="button" aria-label={`Ubah ${s.nomor}`} onClick={() => bukaForm({ id: s.id, nomor: s.nomor, tentang: s.tentang, tahun: s.tahun, kategori: s.kategori ?? "", file: null, adaFile: !!s.file })} className="rounded-lg p-2 text-slate-500 transition-colors hover:bg-blue-50 hover:text-primary">
                      <PencilSquareIcon className="h-5 w-5" />
                    </button>
                    <button type="button" aria-label={`Hapus ${s.nomor}`} onClick={() => hapusSK(s)} className="rounded-lg p-2 text-slate-500 transition-colors hover:bg-red-50 hover:text-red-600">
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
        <Modal title={form.id ? "Ubah SK" : "Tambah SK"} onClose={tutupForm} locked={saving}>
          <form ref={formRef} onSubmit={simpan} noValidate className="space-y-4">
            <Field label="Nomor SK" required error={errs.nomor}>
              {(p) => <input {...p} value={form.nomor} onChange={ubah("nomor")} onBlur={saatSelesaiIsi("nomor")} className={`${inputCls(errs.nomor)} h-11`} />}
            </Field>
            <Field label="Tentang" required error={errs.tentang}>
              {(p) => <input {...p} value={form.tentang} onChange={ubah("tentang")} onBlur={saatSelesaiIsi("tentang")} className={`${inputCls(errs.tentang)} h-11`} />}
            </Field>
            <div className="grid grid-cols-2 gap-3">
              <Field label="Tahun" required error={errs.tahun}>
                {(p) => <input {...p} type="number" min="1990" max="2100" value={form.tahun} onChange={ubah("tahun")} onBlur={saatSelesaiIsi("tahun")} className={`${inputCls(errs.tahun)} h-11`} />}
              </Field>
              <Field label="Kategori" error={errs.kategori}>
                {(p) => <input {...p} value={form.kategori} onChange={ubah("kategori")} className={`${inputCls(errs.kategori)} h-11`} />}
              </Field>
            </div>
            <Field
              label={`File PDF (maks. ${MAX_MB} MB)`}
              error={errs.file}
              hint={form.id && form.adaFile ? "Sudah ada file. Pilih file baru hanya jika ingin menggantinya." : undefined}
            >
              {(p) => <input {...p} type="file" accept="application/pdf" onChange={pilihFile} className="block w-full text-sm" />}
            </Field>
            <div className="flex justify-end gap-3 pt-2">
              <button type="button" onClick={tutupForm} disabled={saving} className="rounded-lg border border-line px-4 py-2.5 text-sm font-semibold text-navy transition-colors hover:bg-surface disabled:opacity-60">Batal</button>
              <button disabled={saving} className="rounded-lg bg-primary px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-primary-dark disabled:opacity-70">
                {saving ? "Menyimpan..." : "Simpan"}
              </button>
            </div>
          </form>
        </Modal>
      )}
    </>
  );
}