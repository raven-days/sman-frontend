import { useCallback, useEffect, useRef, useState } from "react";
import { PlusIcon, PencilSquareIcon, TrashIcon } from "@heroicons/react/24/outline";
import { api, bukaLampiran } from "../../lib/api";
import { useToast } from "../../context/Toast";
import { useConfirm } from "../../context/Confirm";
import { useSubmit } from "../../lib/useSubmit";
import { useDirty, useUnsavedChanges } from "../../lib/useUnsaved";
import { galatPerKolom, fokusSalah } from "../../lib/validasi";
import { BIDANG_DOKUMEN } from "../../data/content";
import Field, { inputCls } from "../../components/Field";
import Modal from "../../components/Modal";

const MAX_MB = 5;
const LBL = {
  sk: { nama: "SK", judul: "Surat Keputusan", nomor: "Nomor SK" },
  sop: { nama: "SOP", judul: "Standar Operasional Prosedur", nomor: "Nomor SOP" },
};
const kosong = (jenis) => ({ id: null, jenis, nomor: "", tentang: "", penerbit: "", bidang: "", tahun: new Date().getFullYear(), kategori: "", file: null, adaFile: false });

// Aturan validasi di sisi tampilan. Laravel tetap memeriksa ulang semuanya.
const ATURAN = {
  nomor: (v) => (String(v).trim() ? "" : "Nomor wajib diisi."),
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
  const [jenis, setJenis] = useState("sk");
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [form, setForm] = useState(null);
  const [errs, setErrs] = useState({});
  const L = LBL[jenis];

  const muat = useCallback(async () => {
    try {
      setRows(await api(`/sk?jenis=${jenis}`));
      setError("");
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, [jenis]);

  useEffect(() => { setLoading(true); setRows([]); muat(); }, [muat]);

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
    ["jenis", "nomor", "tentang", "penerbit", "bidang", "tahun", "kategori"].forEach((k) => fd.append(k, form[k] ?? ""));
    if (form.file) fd.append("file", form.file);
    try {
      await api(form.id ? `/admin/sk/${form.id}` : "/admin/sk", { method: "POST", body: fd });
      toast.success(`${L.nama} ${form.nomor} berhasil ${form.id ? "diperbarui" : "ditambahkan"}.`);
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

  const hapusDok = async (s) => {
    const ya = await confirm({
      title: `Hapus ${L.nama} ini?`,
      description: `${L.nama} akan dihapus dari website dan tidak dapat dikembalikan.`,
      items: [
        { label: L.nomor, value: s.nomor },
        { label: "Tentang", value: s.tentang },
        { label: "Tahun", value: s.tahun },
      ],
      consequence: "File PDF yang terlampir ikut terhapus.",
      confirmText: `Hapus ${L.nama}`,
      tone: "danger",
      action: () => api(`/admin/sk/${s.id}`, { method: "DELETE" }),
    });
    if (ya) {
      toast.success(`${L.nama} ${s.nomor} dihapus.`);
      muat();
    }
  };

  const bukaForm = (data) => { setErrs({}); setForm(data); };
  const bukaPdf = (path) => bukaLampiran(path).catch((e) => toast.galat(e));

  return (
    <>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-extrabold text-navy">Kelola SK & SOP</h1>
          <p className="mt-1 text-sm text-slate-600">Dokumen di sini tampil di halaman Dokumen. Hanya akun yang login yang bisa melihatnya.</p>
        </div>
        <button
          type="button"
          onClick={() => bukaForm(kosong(jenis))}
          className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-primary-dark active:scale-[0.98]"
        >
          <PlusIcon className="h-5 w-5" /> Tambah {L.nama}
        </button>
      </div>

      <div role="tablist" aria-label="Jenis dokumen" className="mt-5 inline-flex rounded-xl bg-surface p-1">
        {Object.entries(LBL).map(([k, t]) => (
          <button
            key={k}
            type="button"
            role="tab"
            aria-selected={jenis === k}
            onClick={() => setJenis(k)}
            className={`rounded-lg px-4 py-2 text-sm font-semibold transition-colors ${jenis === k ? "bg-white text-navy shadow-sm" : "text-slate-500 hover:text-navy"}`}
          >
            {t.judul}
          </button>
        ))}
      </div>

      {error && (
        <div role="alert" className="mt-5 flex flex-wrap items-center justify-between gap-3 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          <span>{error}</span>
          <button type="button" onClick={muat} className="font-semibold underline">Coba lagi</button>
        </div>
      )}

      <div className="mt-6 overflow-x-auto rounded-xl border border-line bg-white">
        <table className="w-full min-w-[860px] text-left text-sm">
          <thead className="bg-surface text-xs uppercase tracking-wide text-slate-500">
            <tr>
              <th className="px-4 py-3">{L.nomor}</th>
              <th className="px-4 py-3">Tentang</th>
              <th className="px-4 py-3">Ditetapkan oleh</th>
              <th className="px-4 py-3">Bidang</th>
              <th className="px-4 py-3">Tahun</th>
              <th className="px-4 py-3">Berkas</th>
              <th className="px-4 py-3 text-right">Aksi</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-line">
            {loading && <tr><td colSpan={7} className="px-4 py-10 text-center text-slate-500">Memuat data...</td></tr>}
            {!loading && !error && rows.length === 0 && <tr><td colSpan={7} className="px-4 py-10 text-center text-slate-500">Belum ada {L.nama}. Klik "Tambah {L.nama}".</td></tr>}
            {rows.map((s) => (
              <tr key={s.id}>
                <td className="px-4 py-3 font-semibold text-navy">{s.nomor}</td>
                <td className="px-4 py-3">{s.tentang}</td>
                <td className="px-4 py-3">{s.penerbit || "-"}</td>
                <td className="px-4 py-3">{s.bidang || "-"}</td>
                <td className="px-4 py-3">{s.tahun}</td>
                <td className="px-4 py-3">
                  {s.file ? <button type="button" onClick={() => bukaPdf(s.file)} className="font-semibold text-primary">Lihat PDF</button> : <span className="text-xs text-slate-400">Belum ada</span>}
                </td>
                <td className="px-4 py-3">
                  <div className="flex justify-end gap-1">
                    <button type="button" aria-label={`Ubah ${s.nomor}`} onClick={() => bukaForm({ id: s.id, jenis: s.jenis, nomor: s.nomor, tentang: s.tentang, penerbit: s.penerbit ?? "", bidang: s.bidang ?? "", tahun: s.tahun, kategori: s.kategori ?? "", file: null, adaFile: !!s.file })} className="rounded-lg p-2 text-slate-500 transition-colors hover:bg-blue-50 hover:text-primary">
                      <PencilSquareIcon className="h-5 w-5" />
                    </button>
                    <button type="button" aria-label={`Hapus ${s.nomor}`} onClick={() => hapusDok(s)} className="rounded-lg p-2 text-slate-500 transition-colors hover:bg-red-50 hover:text-red-600">
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
        <Modal title={form.id ? `Ubah ${L.nama}` : `Tambah ${L.nama}`} onClose={tutupForm} locked={saving}>
          <form ref={formRef} onSubmit={simpan} noValidate className="space-y-4">
            <Field label={L.nomor} required error={errs.nomor}>
              {(p) => <input {...p} value={form.nomor} onChange={ubah("nomor")} onBlur={saatSelesaiIsi("nomor")} className={`${inputCls(errs.nomor)} h-11`} />}
            </Field>
            <Field label="Tentang" required error={errs.tentang}>
              {(p) => <input {...p} value={form.tentang} onChange={ubah("tentang")} onBlur={saatSelesaiIsi("tentang")} className={`${inputCls(errs.tentang)} h-11`} />}
            </Field>
            <Field label="Ditetapkan oleh (pejabat / pihak)" error={errs.penerbit} hint="Contoh: Kepala SMA Negeri 104 Jakarta">
              {(p) => <input {...p} value={form.penerbit} onChange={ubah("penerbit")} className={`${inputCls(errs.penerbit)} h-11`} />}
            </Field>
            <Field label="Bidang / bagian terkait" error={errs.bidang}>
              {(p) => (
                <select {...p} value={form.bidang} onChange={ubah("bidang")} className={`${inputCls(errs.bidang)} h-11`}>
                  <option value="">Pilih bidang</option>
                  {form.bidang && !BIDANG_DOKUMEN.includes(form.bidang) && <option value={form.bidang}>{form.bidang}</option>}
                  {BIDANG_DOKUMEN.map((b) => <option key={b}>{b}</option>)}
                </select>
              )}
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