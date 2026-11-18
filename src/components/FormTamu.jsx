import { useRef, useState } from "react";
import { PaperClipIcon, XMarkIcon } from "@heroicons/react/24/outline";
import { api } from "../lib/api";
import { useSubmit } from "../lib/useSubmit";
import { galatPerKolom, fokusSalah } from "../lib/validasi";
import Field, { inputCls } from "./Field";
import Turnstile, { TURNSTILE_AKTIF } from "./Turnstile";

const MB = 1024 * 1024;

const HUBUNGAN = [
  ["siswa", "Siswa"],
  ["orang_tua", "Orang tua / wali siswa"],
  ["alumni", "Alumni"],
  ["eksternal", "Pihak eksternal / masyarakat umum"],
];
const PAKAI_NIS = ["siswa", "orang_tua", "alumni"];

const hariIni = () => {
  const d = new Date();
  const p = (n) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`;
};

// Sama dengan aturan di server: 08xx atau 8xx menjadi 628xx.
const normalisasiWa = (v) => {
  const d = v.replace(/\D+/g, "");
  if (d.startsWith("0")) return `62${d.slice(1)}`;
  if (d.startsWith("8")) return `62${d}`;
  return d;
};

const ukuran = (b) => (b >= MB ? `${(b / MB).toFixed(1)} MB` : `${Math.max(1, Math.round(b / 1024))} KB`);

// Perkecil foto besar di browser agar lolos batas ukuran. Jika gagal, foto asli dipakai.
async function kecilkan(file) {
  if (file.size < 1.2 * MB) return file;
  try {
    const bmp = await createImageBitmap(file); // arah foto otomatis dibetulkan browser
    const skala = Math.min(1, 2200 / Math.max(bmp.width, bmp.height));
    const lebar = Math.round(bmp.width * skala);
    const tinggi = Math.round(bmp.height * skala);
    const kanvas = document.createElement("canvas");
    kanvas.width = lebar;
    kanvas.height = tinggi;
    const ctx = kanvas.getContext("2d");
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, lebar, tinggi);
    ctx.drawImage(bmp, 0, 0, lebar, tinggi);
    if (bmp.close) bmp.close();
    const blob = await new Promise((res) => kanvas.toBlob(res, "image/jpeg", 0.85));
    if (!blob || blob.size >= file.size) return file;
    return new File([blob], file.name.replace(/\.[^.]+$/, "") + ".jpg", { type: "image/jpeg" });
  } catch {
    return file;
  }
}

export default function FormTamu({ layanan, batas, onSelesai }) {
  const formRef = useRef(null);
  const [f, setF] = useState({
    pemohon_nama: "",
    pemohon_wa: "",
    hubungan: "eksternal",
    nis: "",
    tanggal: hariIni(),
    keterangan: "",
    setuju: false,
  });
  const [berkas, setBerkas] = useState([]);
  const [masalah, setMasalah] = useState([]);
  const [memproses, setMemproses] = useState(false);
  const [jebakan, setJebakan] = useState("");
  const [token, setToken] = useState("");
  const [resetKey, setResetKey] = useState(0);
  const [errs, setErrs] = useState({});
  const [galatUmum, setGalatUmum] = useState("");

  const ubah = (k) => (e) => setF((s) => ({ ...s, [k]: e.target.value }));
  const pakaiNis = PAKAI_NIS.includes(f.hubungan);

  const pilihBerkas = async (e) => {
    const dipilih = Array.from(e.target.files || []);
    e.target.value = "";
    if (!dipilih.length) return;

    setMemproses(true);
    const catatan = [];
    const gabung = [...berkas];

    for (const asli of dipilih) {
      if (!["image/jpeg", "image/png"].includes(asli.type)) {
        catatan.push(`${asli.name}: hanya JPG atau PNG (PDF tidak diterima). Foto atau pindai dokumennya.`);
        continue;
      }
      if (gabung.length >= batas.maks_file) {
        catatan.push(`Maksimal ${batas.maks_file} file.`);
        break;
      }
      const file = await kecilkan(asli);
      if (file.size > batas.maks_mb * MB) {
        catatan.push(`${asli.name}: lebih dari ${batas.maks_mb} MB, bahkan setelah dikecilkan.`);
        continue;
      }
      if (gabung.reduce((a, b) => a + b.size, 0) + file.size > batas.maks_total_mb * MB) {
        catatan.push(`Total ukuran file melebihi ${batas.maks_total_mb} MB.`);
        break;
      }
      gabung.push(file);
    }

    setBerkas(gabung);
    setMasalah([...new Set(catatan)]);
    setMemproses(false);
  };

  const [kirim, sending] = useSubmit(async (e) => {
    e.preventDefault();
    setGalatUmum("");

    const salah = {};
    if (f.pemohon_nama.trim().length < 3) salah.pemohon_nama = "Nama minimal 3 karakter.";
    if (!/^628\d{8,11}$/.test(normalisasiWa(f.pemohon_wa))) salah.pemohon_wa = "Nomor WhatsApp tidak valid. Contoh: 081234567890.";
    if (pakaiNis && f.nis.trim() && !/^\d{5,20}$/.test(f.nis.trim())) salah.nis = "NIS hanya angka, 5 sampai 20 digit.";
    if (!f.tanggal || f.tanggal < hariIni()) salah.tanggal = "Tanggal tidak boleh sebelum hari ini.";
    if (f.keterangan.trim().length < 10) salah.keterangan = "Keterangan minimal 10 karakter.";
    if (layanan.wajib_lampiran && berkas.length === 0) salah.lampiran = "Dokumen persyaratan wajib diunggah.";
    if (!f.setuju) salah.setuju = "Centang persetujuan untuk melanjutkan.";
    if (TURNSTILE_AKTIF && !token) salah.token = "Selesaikan verifikasi keamanan di atas.";
    setErrs(salah);
    if (Object.keys(salah).length) return fokusSalah(formRef.current);

    const fd = new FormData();
    fd.append("layanan", layanan.slug);
    fd.append("pemohon_nama", f.pemohon_nama.trim());
    fd.append("pemohon_wa", f.pemohon_wa.trim());
    fd.append("hubungan", f.hubungan);
    if (pakaiNis && f.nis.trim()) fd.append("nis", f.nis.trim());
    fd.append("tanggal", f.tanggal);
    fd.append("keterangan", f.keterangan.trim());
    berkas.forEach((b) => fd.append("lampiran[]", b));
    fd.append("website", jebakan); // kolom jebakan bot
    fd.append("captcha", token);

    try {
      onSelesai(await api("/tamu/pengajuan", { method: "POST", body: fd }));
    } catch (err) {
      setResetKey((k) => k + 1); // token CAPTCHA hanya berlaku sekali
      setToken("");
      if (err.status === 422 && err.errors) {
        setErrs(galatPerKolom(err.errors));
        fokusSalah(formRef.current);
      } else {
        setGalatUmum(err.message); // CAPTCHA gagal, pengajuan ganda (409), atau terlalu banyak (429)
      }
    }
  });

  const errLampiran = Object.entries(errs).find(([k]) => k.startsWith("lampiran"))?.[1];

  return (
    <form ref={formRef} onSubmit={kirim} noValidate className="space-y-9">
      <section className="space-y-5">
        <h2 className="text-xl font-bold text-navy">Data pemohon</h2>

        <Field label="Nama lengkap pemohon" required error={errs.pemohon_nama}>
          {(p) => <input {...p} value={f.pemohon_nama} onChange={ubah("pemohon_nama")} autoComplete="name" className={`${inputCls(errs.pemohon_nama)} h-11`} />}
        </Field>

        <Field label="Nomor WhatsApp" required error={errs.pemohon_wa} hint="Contoh: 081234567890. Gunakan nomor yang aktif.">
          {(p) => <input {...p} inputMode="tel" value={f.pemohon_wa} onChange={ubah("pemohon_wa")} autoComplete="tel" className={`${inputCls(errs.pemohon_wa)} h-11`} />}
        </Field>

        <Field label="Hubungan dengan sekolah" required error={errs.hubungan}>
          {(p) => (
            <select {...p} value={f.hubungan} onChange={ubah("hubungan")} className={`${inputCls(errs.hubungan)} h-11`}>
              {HUBUNGAN.map(([k, l]) => (
                <option key={k} value={k}>{l}</option>
              ))}
            </select>
          )}
        </Field>

        {pakaiNis && (
          <Field label="NIS (jika ada)" error={errs.nis} hint="Nomor Induk Siswa, hanya angka.">
            {(p) => <input {...p} inputMode="numeric" value={f.nis} onChange={ubah("nis")} className={`${inputCls(errs.nis)} h-11`} />}
          </Field>
        )}
      </section>

      <section className="space-y-5">
        <h2 className="text-xl font-bold text-navy">Keperluan</h2>

        <Field label="Tanggal dibutuhkan" required error={errs.tanggal}>
          {(p) => <input {...p} type="date" min={hariIni()} value={f.tanggal} onChange={ubah("tanggal")} className={`${inputCls(errs.tanggal)} h-11`} />}
        </Field>

        <Field label="Keterangan" required error={errs.keterangan} hint={`Jelaskan keperluan Anda. ${f.keterangan.length}/1000 karakter.`}>
          {(p) => <textarea {...p} rows={5} maxLength={1000} value={f.keterangan} onChange={ubah("keterangan")} className={`${inputCls(errs.keterangan)} py-2`} />}
        </Field>
      </section>

      <section className="space-y-3">
        <h2 className="text-xl font-bold text-navy">Dokumen pendukung{layanan.wajib_lampiran ? "" : " (opsional)"}</h2>
        <p className="text-sm text-slate-600">
          Foto atau hasil pindai dalam format <strong>JPG atau PNG</strong> (PDF tidak diterima). Maksimal {batas.maks_file} file,
          {" "}{batas.maks_mb} MB per file, total {batas.maks_total_mb} MB. Foto besar dikecilkan otomatis.
        </p>

        <label className={`inline-flex cursor-pointer items-center gap-2 rounded-lg border border-line bg-white px-4 py-2.5 text-sm font-semibold text-navy hover:bg-surface ${memproses ? "opacity-60" : ""}`}>
          <PaperClipIcon className="h-5 w-5" /> {memproses ? "Memproses foto..." : "Pilih file"}
          <input type="file" multiple accept="image/jpeg,image/png" disabled={memproses} onChange={pilihBerkas} className="sr-only" />
        </label>

        {berkas.length > 0 && (
          <ul className="divide-y divide-line rounded-lg border border-line bg-white text-sm">
            {berkas.map((b, i) => (
              <li key={`${b.name}-${i}`} className="flex items-center justify-between gap-3 px-4 py-2.5">
                <span className="min-w-0 truncate">{b.name} <span className="text-slate-500">({ukuran(b.size)})</span></span>
                <button
                  type="button"
                  aria-label={`Hapus ${b.name}`}
                  onClick={() => setBerkas((l) => l.filter((_, n) => n !== i))}
                  className="shrink-0 text-slate-500 hover:text-navy"
                >
                  <XMarkIcon className="h-5 w-5" />
                </button>
              </li>
            ))}
          </ul>
        )}
        {masalah.map((m) => <p key={m} role="alert" className="text-sm font-medium text-red-600">{m}</p>)}
        {errLampiran && <p role="alert" className="text-sm font-medium text-red-600">{errLampiran}</p>}
      </section>

      <section className="space-y-4">
        <label className="flex items-start gap-3 text-sm text-slate-700">
          <input
            type="checkbox"
            checked={f.setuju}
            aria-invalid={errs.setuju ? "true" : undefined}
            onChange={(e) => setF((s) => ({ ...s, setuju: e.target.checked }))}
            className="mt-0.5 h-4 w-4"
          />
          <span>Saya menyetujui data dan dokumen yang saya kirim digunakan oleh Tata Usaha SMAN 104 Jakarta untuk memproses pengajuan ini.</span>
        </label>
        {errs.setuju && <p role="alert" className="text-sm font-medium text-red-600">{errs.setuju}</p>}

        <Turnstile onToken={setToken} resetKey={resetKey} />
        {errs.token && <p role="alert" className="text-sm font-medium text-red-600">{errs.token}</p>}

        {/* Kolom jebakan bot: tersembunyi dari manusia */}
        <div aria-hidden="true" className="absolute -left-[9999px] h-0 w-0 overflow-hidden">
          <label>
            Situs web
            <input tabIndex={-1} autoComplete="off" value={jebakan} onChange={(e) => setJebakan(e.target.value)} />
          </label>
        </div>
      </section>

      {galatUmum && (
        <p role="alert" className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {galatUmum}
        </p>
      )}

      <button
        disabled={sending || memproses}
        className="h-12 w-full rounded-lg bg-primary px-8 text-sm font-semibold text-white transition-colors hover:bg-primary-dark disabled:opacity-70 sm:w-auto"
      >
        {sending ? "Mengirim..." : "Kirim pengajuan"}
      </button>
    </form>
  );
}