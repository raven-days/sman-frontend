import { useState } from "react";
import { DocumentIcon, TrashIcon, XMarkIcon } from "@heroicons/react/24/outline";
import { api } from "../lib/api";
import { useToast } from "../context/Toast";
import { useConfirm } from "../context/Confirm";
import { useSubmit } from "../lib/useSubmit";
import { galatPerKolom } from "../lib/validasi";
import Field, { inputCls } from "./Field";

const MAKS = 5;
const MAKS_MB = 5;
const MODE = [
  { id: "", label: "Tanpa petunjuk" },
  { id: "ambil", label: "Ambil di kantor" },
  { id: "unduh", label: "Unduh dari portal" },
];
const hariIni = () => new Date().toLocaleDateString("sv-SE", { timeZone: "Asia/Jakarta" }); // YYYY-MM-DD

// Panel petugas TU: unggah dokumen hasil dan tulis petunjuk pengambilan.
export default function PanelHasil({ req, onUpdate }) {
  const toast = useToast();
  const confirm = useConfirm();
  const p = req.pengambilan;
  const [files, setFiles] = useState([]);
  const [mode, setMode] = useState(p?.mode || "");
  const [tanggal, setTanggal] = useState(p?.tanggal || "");
  const [jamMulai, setJamMulai] = useState(p?.jam_mulai || "");
  const [jamSelesai, setJamSelesai] = useState(p?.jam_selesai || "");
  const [lokasi, setLokasi] = useState(p?.lokasi || "Kantor Tata Usaha");
  const [catatan, setCatatan] = useState(p?.catatan || "");
  const [errs, setErrs] = useState({});
  const [inputKey, setInputKey] = useState(0);

  const sudah = req.hasil?.length ?? 0;

  const pilih = (e) => {
    const baru = [...(e.target.files || [])];
    setInputKey((k) => k + 1); // kosongkan input agar file yang sama bisa dipilih lagi
    const layak = baru.filter((f) => f.size <= MAKS_MB * 1024 * 1024);
    const muat = Math.max(0, MAKS - sudah - files.length);
    let pesan;
    if (layak.length < baru.length) pesan = `Ukuran tiap dokumen maksimal ${MAKS_MB} MB.`;
    if (layak.length > muat) pesan = `Maksimal ${MAKS} dokumen hasil.`;
    setErrs((x) => ({ ...x, hasil: pesan }));
    setFiles([...files, ...layak.slice(0, muat)]);
  };

  const [simpan, saving] = useSubmit(async () => {
    const s = {};
    if (mode === "ambil") {
      if (tanggal && tanggal < hariIni()) s.tanggal = "Tanggal tidak boleh sebelum hari ini.";
      if (jamSelesai && !jamMulai) s.jam_mulai = "Isi jam mulai.";
      if (jamMulai && jamSelesai && jamSelesai <= jamMulai) s.jam_selesai = "Jam selesai harus setelah jam mulai.";
    }
    const hapusPetunjuk = !mode && !!p;
    if (!files.length && !mode && !hapusPetunjuk) s.umum = "Pilih dokumen atau isi petunjuk pengambilan dulu.";
    setErrs(s);
    if (Object.keys(s).length) return;

    const fd = new FormData();
    files.forEach((f) => fd.append("hasil[]", f));
    if (mode) {
      fd.append("pengambilan[mode]", mode);
      if (mode === "ambil") {
        if (tanggal) fd.append("pengambilan[tanggal]", tanggal);
        if (jamMulai) fd.append("pengambilan[jam_mulai]", jamMulai);
        if (jamSelesai) fd.append("pengambilan[jam_selesai]", jamSelesai);
        fd.append("pengambilan[lokasi]", lokasi.trim());
      }
      if (catatan.trim()) fd.append("pengambilan[catatan]", catatan.trim());
    } else if (hapusPetunjuk) {
      fd.append("hapus_pengambilan", "1");
    }

    try {
      const res = await api(`/admin/pengajuan/${req.id}/hasil`, { method: "POST", body: fd });
      onUpdate(res);
      setFiles([]);
      toast.success("Hasil dan petunjuk disimpan.");
    } catch (err) {
      if (err.status === 422 && err.errors) setErrs(galatPerKolom(err.errors, { "pengambilan.tanggal": "tanggal", "pengambilan.jam_mulai": "jam_mulai", "pengambilan.jam_selesai": "jam_selesai" }));
      toast.galat(err);
    }
  });

  const hapusDokumen = async (l) => {
    const ya = await confirm({
      title: "Hapus dokumen hasil?",
      description: "Dokumen dihapus dan tidak bisa diunduh lagi oleh pemohon.",
      items: [{ label: "Dokumen", value: l.nama }],
      confirmText: "Hapus",
      tone: "danger",
      action: async () => onUpdate(await api(`/admin/pengajuan/${req.id}/hasil/${l.id}`, { method: "DELETE" })),
    });
    if (ya) toast.success("Dokumen hasil dihapus.");
  };

  return (
    <section aria-labelledby="judul-panel-hasil" className="mt-6 rounded-xl border border-line bg-white p-6">
      <h2 id="judul-panel-hasil" className="text-lg font-bold text-navy">Hasil &amp; petunjuk pengambilan</h2>
      <p className="mt-1 text-sm text-slate-600">
        Lampirkan dokumen hasil (bila ada) dan beri tahu pemohon cara mendapatkannya. Wajib diisi salah satu sebelum menandai selesai.
      </p>

      <div className="mt-5">
        <p className="text-sm font-semibold text-navy">Dokumen hasil <span className="font-normal text-slate-500">({sudah + files.length}/{MAKS})</span></p>
        {sudah > 0 && (
          <ul className="mt-2 space-y-1.5">
            {req.hasil.map((l) => (
              <li key={l.id} className="flex items-center justify-between gap-3 rounded-lg border border-line px-3 py-2 text-sm">
                <span className="flex min-w-0 items-center gap-2 text-navy"><DocumentIcon className="h-4 w-4 shrink-0 text-primary" /><span className="truncate">{l.nama}</span></span>
                <button type="button" onClick={() => hapusDokumen(l)} aria-label={`Hapus ${l.nama}`} className="rounded p-1 text-slate-500 hover:bg-red-50 hover:text-red-600"><TrashIcon className="h-4 w-4" /></button>
              </li>
            ))}
          </ul>
        )}
        {files.length > 0 && (
          <ul className="mt-2 space-y-1.5">
            {files.map((f, i) => (
              <li key={`${f.name}-${i}`} className="flex items-center justify-between gap-3 rounded-lg border border-dashed border-primary/40 bg-blue-50/50 px-3 py-2 text-sm">
                <span className="truncate text-navy">{f.name} <span className="text-xs text-slate-500">(baru)</span></span>
                <button type="button" onClick={() => setFiles(files.filter((_, j) => j !== i))} aria-label={`Batalkan ${f.name}`} className="rounded p-1 text-slate-500 hover:bg-white"><XMarkIcon className="h-4 w-4" /></button>
              </li>
            ))}
          </ul>
        )}
        <input
          key={inputKey}
          type="file"
          multiple
          accept=".pdf,.jpg,.jpeg,.png,.doc,.docx,.xls,.xlsx"
          onChange={pilih}
          aria-label="Pilih dokumen hasil"
          disabled={sudah + files.length >= MAKS}
          className="mt-3 block w-full text-sm file:mr-3 file:rounded-lg file:border file:border-line file:bg-white file:px-3 file:py-2 file:text-sm file:font-semibold file:text-navy disabled:opacity-50"
        />
        <p className="mt-1 text-xs text-slate-500">PDF, gambar, Word, atau Excel. Maksimal {MAKS_MB} MB per dokumen.</p>
        {errs.hasil && <p role="alert" className="mt-1 text-xs font-medium text-red-600">{errs.hasil}</p>}
      </div>

      <fieldset className="mt-6">
        <legend className="text-sm font-semibold text-navy">Cara pemohon mendapatkan hasil</legend>
        <div className="mt-2 grid grid-cols-3 rounded-xl bg-surface p-1">
          {MODE.map((m) => (
            <button
              key={m.id || "none"}
              type="button"
              aria-pressed={mode === m.id}
              onClick={() => setMode(m.id)}
              className={`rounded-lg px-2 py-2 text-xs font-semibold transition-colors ${mode === m.id ? "bg-white text-primary shadow-sm" : "text-slate-500 hover:text-navy"}`}
            >
              {m.label}
            </button>
          ))}
        </div>
      </fieldset>

      {mode === "ambil" && (
        <div className="mt-4 grid gap-4 sm:grid-cols-3">
          <Field label="Tanggal (opsional)" error={errs.tanggal} hint="Kosong = kapan saja pada jam layanan.">
            {(a) => <input {...a} type="date" min={hariIni()} value={tanggal} onChange={(e) => setTanggal(e.target.value)} className={`${inputCls(errs.tanggal)} h-11`} />}
          </Field>
          <Field label="Jam mulai" error={errs.jam_mulai}>
            {(a) => <input {...a} type="time" value={jamMulai} onChange={(e) => setJamMulai(e.target.value)} className={`${inputCls(errs.jam_mulai)} h-11`} />}
          </Field>
          <Field label="Jam selesai" error={errs.jam_selesai}>
            {(a) => <input {...a} type="time" value={jamSelesai} onChange={(e) => setJamSelesai(e.target.value)} className={`${inputCls(errs.jam_selesai)} h-11`} />}
          </Field>
          <Field label="Lokasi" className="sm:col-span-3">
            {(a) => <input {...a} value={lokasi} onChange={(e) => setLokasi(e.target.value)} maxLength={120} className={`${inputCls(false)} h-11`} />}
          </Field>
        </div>
      )}

      {mode && (
        <Field label="Pesan tambahan (opsional)" className="mt-4" hint="Contoh: bawa kartu identitas, atau minta tolong wali kelas.">
          {(a) => <textarea {...a} rows={2} maxLength={300} value={catatan} onChange={(e) => setCatatan(e.target.value)} className={`${inputCls(false)} py-2.5`} />}
        </Field>
      )}

      {errs.umum && <p role="alert" className="mt-3 text-xs font-medium text-red-600">{errs.umum}</p>}

      <div className="mt-5 flex justify-end">
        <button type="button" onClick={simpan} disabled={saving} className="press rounded-lg bg-primary px-5 py-2.5 text-sm font-semibold text-white hover:bg-primary-dark disabled:opacity-70">
          {saving ? "Menyimpan..." : "Simpan hasil & petunjuk"}
        </button>
      </div>
    </section>
  );
}