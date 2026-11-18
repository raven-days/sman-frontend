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
import { AKSES } from "../../lib/tamu";

const PILIHAN = [
  ["guest", "Tanpa akun", "Pengunjung boleh mengajukan lewat formulir umum."],
  ["login", "Wajib login", "Hanya akun sekolah."],
  ["manual", "Verifikasi manual", "Tidak ada formulir online. Pengunjung diarahkan sesuai instruksi."],
];

const kosong = { id: null, nama: "", deskripsi: "", akses: "guest", syarat: "", instruksi: "", wajib_lampiran: true, aktif: true, urutan: 0 };

const cek = (f) => {
  const e = {};
  if (!f.nama.trim()) e.nama = "Nama layanan wajib diisi.";
  if (f.akses === "manual" && !f.instruksi.trim()) e.instruksi = "Isi instruksi untuk pengunjung.";
  return e;
};

export default function KelolaLayanan() {
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
      const res = await api("/admin/layanan-pengajuan");
      setRows(res.data);
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
    if (errs[k]) setErrs((x) => ({ ...x, [k]: "" }));
  };

  const [simpan, saving] = useSubmit(async (e) => {
    e.preventDefault();
    const salah = cek(form);
    setErrs(salah);
    if (Object.keys(salah).length) return fokusSalah(formRef.current);

    const fd = new FormData();
    ["nama", "deskripsi", "akses", "syarat", "instruksi", "urutan"].forEach((k) => fd.append(k, form[k] ?? ""));
    fd.append("wajib_lampiran", form.wajib_lampiran ? "1" : "0");
    fd.append("aktif", form.aktif ? "1" : "0");

    try {
      await api(form.id ? `/admin/layanan-pengajuan/${form.id}` : "/admin/layanan-pengajuan", { method: "POST", body: fd });
      toast.success(`Layanan "${form.nama}" berhasil ${form.id ? "diperbarui" : "ditambahkan"}.`);
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
      title: "Hapus layanan ini?",
      description: "Layanan hilang dari halaman publik. Pengajuan yang sudah masuk tetap tersimpan. Bila hanya ingin menutup sementara, lebih baik nonaktifkan.",
      items: [{ label: "Layanan", value: d.nama }],
      confirmText: "Hapus layanan",
      tone: "danger",
      action: () => api(`/admin/layanan-pengajuan/${d.id}`, { method: "DELETE" }),
    });
    if (ya) {
      toast.success("Layanan dihapus.");
      muat();
    }
  };

  const bukaForm = (data) => { setErrs({}); setForm(data); };

  return (
    <>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-extrabold text-navy">Akses Layanan Pengajuan</h1>
          <p className="mt-1 text-sm text-slate-600">Tentukan layanan mana yang boleh diajukan tanpa akun, wajib login, atau perlu verifikasi manual.</p>
        </div>
        <button
          type="button"
          onClick={() => bukaForm({ ...kosong, urutan: rows.length + 1 })}
          className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-primary-dark active:scale-[0.98]"
        >
          <PlusIcon className="h-5 w-5" /> Tambah Layanan
        </button>
      </div>

      {error && (
        <div role="alert" className="mt-5 flex flex-wrap items-center justify-between gap-3 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          <span>{error}</span>
          <button type="button" onClick={muat} className="font-semibold underline">Coba lagi</button>
        </div>
      )}

      <div className="mt-6 overflow-x-auto rounded-xl border border-line bg-white">
        <table className="w-full min-w-[760px] text-left text-sm">
          <thead className="bg-surface text-xs uppercase tracking-wide text-slate-500">
            <tr>
              <th className="w-14 px-4 py-3">Urut</th>
              <th className="px-4 py-3">Layanan</th>
              <th className="px-4 py-3">Akses</th>
              <th className="px-4 py-3">Lampiran</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3 text-right">Aksi</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-line">
            {loading && <tr><td colSpan={6} className="px-4 py-10 text-center text-slate-500">Memuat data...</td></tr>}
            {!loading && !error && rows.length === 0 && <tr><td colSpan={6} className="px-4 py-10 text-center text-slate-500">Belum ada layanan.</td></tr>}
            {rows.map((d) => {
              const a = AKSES[d.akses] || AKSES.guest;
              return (
                <tr key={d.id}>
                  <td className="px-4 py-3 text-slate-500">{d.urutan}</td>
                  <td className="px-4 py-3 font-semibold text-navy">{d.nama}</td>
                  <td className="px-4 py-3"><span className={`rounded-full border px-2.5 py-0.5 text-xs font-semibold ${a.cls}`}>{a.label}</span></td>
                  <td className="px-4 py-3">{d.akses === "guest" ? (d.wajib_lampiran ? "Wajib" : "Opsional") : "-"}</td>
                  <td className="px-4 py-3">{d.aktif ? <span className="text-green-700">Aktif</span> : <span className="text-slate-400">Nonaktif</span>}</td>
                  <td className="px-4 py-3">
                    <div className="flex justify-end gap-1">
                      <button type="button" aria-label={`Ubah ${d.nama}`} onClick={() => bukaForm({ ...d, deskripsi: d.deskripsi ?? "", syarat: d.syarat ?? "", instruksi: d.instruksi ?? "" })} className="rounded-lg p-2 text-slate-500 transition-colors hover:bg-blue-50 hover:text-primary">
                        <PencilSquareIcon className="h-5 w-5" />
                      </button>
                      <button type="button" aria-label={`Hapus ${d.nama}`} onClick={() => hapus(d)} className="rounded-lg p-2 text-slate-500 transition-colors hover:bg-red-50 hover:text-red-600">
                        <TrashIcon className="h-5 w-5" />
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {form && (
        <Modal title={form.id ? "Ubah layanan" : "Tambah layanan"} onClose={tutupForm} locked={saving}>
          <form ref={formRef} onSubmit={simpan} noValidate className="space-y-4">
            <Field label="Nama layanan" required error={errs.nama}>
              {(p) => <input {...p} value={form.nama} onChange={ubah("nama")} className={`${inputCls(errs.nama)} h-11`} />}
            </Field>
            <Field label="Deskripsi singkat" error={errs.deskripsi}>
              {(p) => <input {...p} value={form.deskripsi} onChange={ubah("deskripsi")} className={`${inputCls(errs.deskripsi)} h-11`} />}
            </Field>

            <fieldset>
              <legend className="mb-1 text-sm font-semibold text-navy">Siapa yang boleh mengajukan?</legend>
              <div className="space-y-2">
                {PILIHAN.map(([v, t, ket]) => (
                  <label key={v} className={`flex cursor-pointer items-start gap-3 rounded-lg border px-4 py-3 text-sm ${form.akses === v ? "border-primary bg-blue-50" : "border-line hover:bg-surface"}`}>
                    <input type="radio" name="akses" checked={form.akses === v} onChange={() => setForm({ ...form, akses: v })} className="mt-0.5 h-4 w-4 accent-[#0878d1]" />
                    <span><b className="text-navy">{t}</b><br /><span className="text-slate-600">{ket}</span></span>
                  </label>
                ))}
              </div>
              {form.akses === "guest" && (
                <p className="mt-2 text-xs text-slate-500">Layanan tanpa akun memakai formulir umum: nama, WhatsApp, hubungan, NIS, tanggal, keterangan, dan foto dokumen (JPG/PNG). Semua pengajuan tamu tetap diperiksa petugas.</p>
              )}
            </fieldset>

            {form.akses === "guest" && (
              <Field label="Persyaratan (satu baris = satu poin)" error={errs.syarat}>
                {(p) => <textarea {...p} rows={3} value={form.syarat} onChange={ubah("syarat")} className={inputCls(errs.syarat)} />}
              </Field>
            )}

            {form.akses === "manual" && (
              <Field label="Instruksi untuk pengunjung" required error={errs.instruksi} hint="Apa yang harus dilakukan pengunjung? Contoh: datang ke TU membawa dokumen asli.">
                {(p) => <textarea {...p} rows={3} value={form.instruksi} onChange={ubah("instruksi")} className={inputCls(errs.instruksi)} />}
              </Field>
            )}

            <div className="flex flex-wrap items-center gap-x-6 gap-y-3 text-sm">
              {form.akses === "guest" && (
                <label className="flex items-center gap-2">
                  <input type="checkbox" checked={form.wajib_lampiran} onChange={(e) => setForm({ ...form, wajib_lampiran: e.target.checked })} className="h-4 w-4 accent-[#0878d1]" />
                  Dokumen wajib diunggah
                </label>
              )}
              <label className="flex items-center gap-2">
                <input type="checkbox" checked={form.aktif} onChange={(e) => setForm({ ...form, aktif: e.target.checked })} className="h-4 w-4 accent-[#0878d1]" />
                Tampilkan di website
              </label>
              <label className="flex items-center gap-2">
                Urutan
                <input type="number" min="0" max="999" value={form.urutan} onChange={ubah("urutan")} className="h-9 w-20 rounded-lg border border-line px-2" />
              </label>
            </div>

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