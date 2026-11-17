import { useCallback, useEffect, useRef, useState } from "react";
import { PlusIcon, PencilSquareIcon, TrashIcon, LockClosedIcon } from "@heroicons/react/24/outline";
import { api, bukaLampiran } from "../../lib/api";
import { useToast } from "../../context/Toast";
import { useConfirm } from "../../context/Confirm";
import { useSubmit } from "../../lib/useSubmit";
import { useDirty, useUnsavedChanges } from "../../lib/useUnsaved";
import { galatPerKolom, fokusSalah } from "../../lib/validasi";
import Field, { inputCls } from "../../components/Field";
import Modal from "../../components/Modal";

const MAX_MB = 10;
const TAB = {
  regulasi: { label: "Regulasi & Peraturan", tambah: "Tambah Regulasi" },
  laporan: { label: "Laporan e-RKAS BOP", tambah: "Tambah Laporan" },
};

const kosong = (kategori) => ({
  id: null,
  kategori,
  judul: "",
  nomor: "",
  sumber_dana: kategori === "laporan" ? "BOP" : "APBN",
  penerbit: "",
  tahun: new Date().getFullYear(),
  periode: kategori === "laporan" ? "TW1" : "",
  akses: kategori === "laporan" ? "login" : "publik",
  file: null,
  adaFile: false,
});

const cek = (f) => {
  const e = {};
  if (!String(f.judul).trim()) e.judul = "Judul wajib diisi.";
  const n = Number(f.tahun);
  if (!String(f.tahun).trim()) e.tahun = "Tahun wajib diisi.";
  else if (!Number.isInteger(n) || n < 1990 || n > 2100) e.tahun = "Tahun harus antara 1990 dan 2100.";
  if (f.kategori === "laporan" && !f.periode) e.periode = "Pilih triwulan.";
  return e;
};

export default function KelolaAnggaran() {
  const toast = useToast();
  const confirm = useConfirm();
  const formRef = useRef(null);
  const [kategori, setKategori] = useState("regulasi");
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [form, setForm] = useState(null);
  const [errs, setErrs] = useState({});

  const muat = useCallback(async () => {
    try {
      const res = await api(`/anggaran?kategori=${kategori}`);
      setRows(res.data);
      setError("");
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, [kategori]);

  useEffect(() => { setLoading(true); setRows([]); muat(); }, [muat]);

  const dirty = useDirty(form);
  useUnsavedChanges(dirty);

  const ubah = (k) => (e) => {
    const v = e.target.value;
    setForm((f) => ({ ...f, [k]: v }));
    if (errs[k]) setErrs((x) => ({ ...x, [k]: "" }));
  };

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
    const salah = cek(form);
    if (errs.file) salah.file = errs.file;
    setErrs(salah);
    if (Object.keys(salah).length) return fokusSalah(formRef.current);

    const fd = new FormData();
    ["kategori", "judul", "nomor", "sumber_dana", "penerbit", "tahun", "periode", "akses"].forEach((k) => fd.append(k, form[k] ?? ""));
    if (form.file) fd.append("file", form.file);
    try {
      await api(form.id ? `/admin/anggaran/${form.id}` : "/admin/anggaran", { method: "POST", body: fd });
      toast.success(`Dokumen "${form.judul}" berhasil ${form.id ? "diperbarui" : "ditambahkan"}.`);
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

  const hapus = async (d) => {
    const ya = await confirm({
      title: "Hapus dokumen ini?",
      description: "Dokumen akan dihapus dari website dan tidak dapat dikembalikan.",
      items: [
        { label: "Judul", value: d.judul },
        { label: "Tahun", value: d.tahun },
      ],
      consequence: "File PDF yang terlampir ikut terhapus.",
      confirmText: "Hapus dokumen",
      tone: "danger",
      action: () => api(`/admin/anggaran/${d.id}`, { method: "DELETE" }),
    });
    if (ya) {
      toast.success("Dokumen dihapus.");
      muat();
    }
  };

  const bukaForm = (data) => { setErrs({}); setForm(data); };
  const bukaPdf = (path) => bukaLampiran(path).catch((e) => toast.galat(e));
  const lap = kategori === "laporan";

  return (
    <>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-extrabold text-navy">Kelola Anggaran</h1>
          <p className="mt-1 text-sm text-slate-600">Dokumen yang ditambahkan di sini tampil di halaman Layanan Anggaran. Atur tiap dokumen: publik atau khusus akun login.</p>
        </div>
        <button
          type="button"
          onClick={() => bukaForm(kosong(kategori))}
          className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-primary-dark active:scale-[0.98]"
        >
          <PlusIcon className="h-5 w-5" /> {TAB[kategori].tambah}
        </button>
      </div>

      <div role="tablist" aria-label="Jenis dokumen anggaran" className="mt-5 inline-flex rounded-xl bg-surface p-1">
        {Object.entries(TAB).map(([k, t]) => (
          <button
            key={k}
            type="button"
            role="tab"
            aria-selected={kategori === k}
            onClick={() => setKategori(k)}
            className={`rounded-lg px-4 py-2 text-sm font-semibold transition-colors ${kategori === k ? "bg-white text-navy shadow-sm" : "text-slate-500 hover:text-navy"}`}
          >
            {t.label}
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
        <table className="w-full min-w-[820px] text-left text-sm">
          <thead className="bg-surface text-xs uppercase tracking-wide text-slate-500">
            <tr>
              <th className="px-4 py-3">{lap ? "Laporan" : "Nomor / Tentang"}</th>
              <th className="px-4 py-3">{lap ? "Triwulan" : "Sumber dana"}</th>
              <th className="px-4 py-3">Tahun</th>
              <th className="px-4 py-3">Akses</th>
              <th className="px-4 py-3">Berkas</th>
              <th className="px-4 py-3 text-right">Aksi</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-line">
            {loading && <tr><td colSpan={6} className="px-4 py-10 text-center text-slate-500">Memuat data...</td></tr>}
            {!loading && !error && rows.length === 0 && <tr><td colSpan={6} className="px-4 py-10 text-center text-slate-500">Belum ada dokumen. Klik "{TAB[kategori].tambah}".</td></tr>}
            {rows.map((d) => (
              <tr key={d.id}>
                <td className="px-4 py-3">
                  {!lap && d.nomor && <span className="block font-semibold text-navy">{d.nomor}</span>}
                  <span className={lap ? "font-semibold text-navy" : ""}>{d.judul}</span>
                </td>
                <td className="px-4 py-3">{lap ? d.periode : d.sumber_dana || "-"}</td>
                <td className="px-4 py-3">{d.tahun}</td>
                <td className="px-4 py-3">
                  {d.akses === "login" ? (
                    <span className="inline-flex items-center gap-1 rounded-full border border-amber-200 bg-amber-50 px-2.5 py-0.5 text-xs font-semibold text-amber-700">
                      <LockClosedIcon className="h-3.5 w-3.5" /> Login
                    </span>
                  ) : (
                    <span className="inline-flex rounded-full border border-green-200 bg-green-50 px-2.5 py-0.5 text-xs font-semibold text-green-700">Publik</span>
                  )}
                </td>
                <td className="px-4 py-3">
                  {d.file ? <button type="button" onClick={() => bukaPdf(d.file)} className="font-semibold text-primary">Lihat PDF</button> : <span className="text-xs text-slate-400">Belum ada</span>}
                </td>
                <td className="px-4 py-3">
                  <div className="flex justify-end gap-1">
                    <button
                      type="button"
                      aria-label={`Ubah ${d.judul}`}
                      onClick={() => bukaForm({ id: d.id, kategori: d.kategori, judul: d.judul, nomor: d.nomor ?? "", sumber_dana: d.sumber_dana ?? "", penerbit: d.penerbit ?? "", tahun: d.tahun, periode: d.periode ?? "", akses: d.akses, file: null, adaFile: !!d.file })}
                      className="rounded-lg p-2 text-slate-500 transition-colors hover:bg-blue-50 hover:text-primary"
                    >
                      <PencilSquareIcon className="h-5 w-5" />
                    </button>
                    <button type="button" aria-label={`Hapus ${d.judul}`} onClick={() => hapus(d)} className="rounded-lg p-2 text-slate-500 transition-colors hover:bg-red-50 hover:text-red-600">
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
        <Modal title={form.id ? "Ubah dokumen" : TAB[form.kategori].tambah} onClose={tutupForm} locked={saving}>
          <form ref={formRef} onSubmit={simpan} noValidate className="space-y-4">
            <Field label={form.kategori === "laporan" ? "Judul laporan" : "Tentang (judul peraturan)"} required error={errs.judul}>
              {(p) => <input {...p} value={form.judul} onChange={ubah("judul")} className={`${inputCls(errs.judul)} h-11`} />}
            </Field>

            {form.kategori === "regulasi" && (
              <>
                <Field label="Nomor peraturan" error={errs.nomor} hint="Contoh: Permendagri No. 77 Tahun 2020">
                  {(p) => <input {...p} value={form.nomor} onChange={ubah("nomor")} className={`${inputCls(errs.nomor)} h-11`} />}
                </Field>
                <div className="grid grid-cols-2 gap-3">
                  <Field label="Sumber dana" error={errs.sumber_dana}>
                    {(p) => (
                      <select {...p} value={form.sumber_dana} onChange={ubah("sumber_dana")} className={`${inputCls(errs.sumber_dana)} h-11`}>
                        <option value="">Pilih</option>
                        {["APBN", "APBD", "BOP", "Lainnya"].map((s) => <option key={s}>{s}</option>)}
                      </select>
                    )}
                  </Field>
                  <Field label="Tahun" required error={errs.tahun}>
                    {(p) => <input {...p} type="number" min="1990" max="2100" value={form.tahun} onChange={ubah("tahun")} className={`${inputCls(errs.tahun)} h-11`} />}
                  </Field>
                </div>
                <Field label="Diterbitkan oleh" error={errs.penerbit} hint="Contoh: Kementerian Dalam Negeri">
                  {(p) => <input {...p} value={form.penerbit} onChange={ubah("penerbit")} className={`${inputCls(errs.penerbit)} h-11`} />}
                </Field>
              </>
            )}

            {form.kategori === "laporan" && (
              <div className="grid grid-cols-2 gap-3">
                <Field label="Triwulan" required error={errs.periode}>
                  {(p) => (
                    <select {...p} value={form.periode} onChange={ubah("periode")} className={`${inputCls(errs.periode)} h-11`}>
                      {["TW1", "TW2", "TW3", "TW4"].map((t) => <option key={t}>{t}</option>)}
                    </select>
                  )}
                </Field>
                <Field label="Tahun" required error={errs.tahun}>
                  {(p) => <input {...p} type="number" min="1990" max="2100" value={form.tahun} onChange={ubah("tahun")} className={`${inputCls(errs.tahun)} h-11`} />}
                </Field>
              </div>
            )}

            <fieldset>
              <legend className="mb-1 text-sm font-semibold text-navy">Siapa yang boleh melihat?</legend>
              <div className="flex flex-wrap gap-3">
                {[["publik", "Publik (semua pengunjung)"], ["login", "Hanya akun yang login"]].map(([v, t]) => (
                  <label key={v} className={`flex cursor-pointer items-center gap-2 rounded-lg border px-4 py-2.5 text-sm ${form.akses === v ? "border-primary bg-blue-50 font-semibold text-navy" : "border-line hover:bg-surface"}`}>
                    <input type="radio" name="akses" checked={form.akses === v} onChange={() => setForm({ ...form, akses: v })} className="h-4 w-4 accent-[#0878d1]" />
                    {t}
                  </label>
                ))}
              </div>
            </fieldset>

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