import { useRef, useState } from "react";
import { Link, useLocation, useParams } from "react-router-dom";
import { CheckCircleIcon, ClipboardDocumentIcon, ExclamationTriangleIcon } from "@heroicons/react/24/outline";
import { api, useFetch } from "../lib/api";
import { useToast } from "../context/Toast";
import { useSubmit } from "../lib/useSubmit";
import { galatPerKolom, fokusSalah } from "../lib/validasi";
import Field, { inputCls } from "../components/Field";
import Captcha from "../components/Captcha";
import { HUBUNGAN } from "../lib/tamu";

const hariIni = () => {
  const d = new Date();
  return new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString().slice(0, 10);
};

const AWAL = { pemohon_nama: "", pemohon_wa: "", hubungan: "siswa", nis: "", tanggal: "", keterangan: "" };

export default function AjukanTamu() {
  const { slug } = useParams();
  const toast = useToast();
  const formRef = useRef(null);
  // Mode perbaikan: data dikirim lewat state router dari halaman Cek Status (kode dan PIN tidak ada di URL)
  const perbaikan = useLocation().state?.perbaikan || null;
  const { data, loading, error } = useFetch(`/layanan-pengajuan/${slug}`);

  const [setuju, setSetuju] = useState(!!perbaikan);
  const [f, setF] = useState(perbaikan ? { ...AWAL, ...perbaikan.data } : AWAL);
  const [files, setFiles] = useState([]);
  const [errs, setErrs] = useState({});
  const [token, setToken] = useState("");
  const [kunci, setKunci] = useState(0);
  const [hasil, setHasil] = useState(null);

  const l = data?.data;
  const batas = data?.batas || { maks_file: 3, maks_mb: 5, maks_total_mb: 15 };
  const adaLampiranLama = !!perbaikan && perbaikan.jumlah_lampiran > 0;

  const ubah = (k) => (e) => {
    const v = e.target.value;
    setF((x) => ({ ...x, [k]: v }));
    if (errs[k]) setErrs((x) => ({ ...x, [k]: "" }));
  };

  const pilihFile = (e) => {
    const baru = Array.from(e.target.files || []);
    e.target.value = "";
    let pesan = "";
    const gabung = [...files];
    for (const x of baru) {
      if (!["image/jpeg", "image/png"].includes(x.type)) { pesan = "Hanya file JPG atau PNG yang diterima."; continue; }
      if (x.size > batas.maks_mb * 1024 * 1024) { pesan = `Ukuran satu file maksimal ${batas.maks_mb} MB.`; continue; }
      if (gabung.length >= batas.maks_file) { pesan = `Maksimal ${batas.maks_file} file.`; continue; }
      gabung.push(x);
    }
    if (gabung.reduce((n, x) => n + x.size, 0) > batas.maks_total_mb * 1024 * 1024) {
      return setErrs((x) => ({ ...x, lampiran: `Total ukuran maksimal ${batas.maks_total_mb} MB.` }));
    }
    setFiles(gabung);
    setErrs((x) => ({ ...x, lampiran: pesan }));
  };

  const cek = () => {
    const e = {};
    if (f.pemohon_nama.trim().length < 3) e.pemohon_nama = "Nama lengkap wajib diisi.";
    if (!/^(\+?62|0)8\d{8,11}$/.test(f.pemohon_wa.replace(/[\s-]/g, ""))) e.pemohon_wa = "Nomor WhatsApp tidak valid. Contoh: 081234567890.";
    if (f.nis && !/^\d{5,20}$/.test(f.nis)) e.nis = "NIS hanya berisi angka.";
    if (!f.tanggal) e.tanggal = "Tanggal wajib diisi.";
    else if (f.tanggal < hariIni()) e.tanggal = "Tanggal tidak boleh sebelum hari ini.";
    if (f.keterangan.trim().length < 10) e.keterangan = "Jelaskan keperluan Anda (minimal 10 huruf).";
    if (l?.wajib_lampiran && files.length === 0 && !adaLampiranLama) e.lampiran = "Dokumen persyaratan wajib diunggah.";
    if (!token) e.captcha = "Selesaikan verifikasi keamanan dulu.";
    return e;
  };

  const [kirim, saving] = useSubmit(async (ev) => {
    ev.preventDefault();
    const salah = cek();
    if (errs.lampiran && !salah.lampiran) salah.lampiran = errs.lampiran;
    setErrs(salah);
    if (Object.keys(salah).length) return fokusSalah(formRef.current);

    const fd = new FormData();
    fd.append("layanan", slug);
    Object.entries(f).forEach(([k, v]) => fd.append(k, v));
    files.forEach((x) => fd.append("lampiran[]", x));
    fd.append("captcha", token);
    fd.append("website", formRef.current.elements.website?.value || "");
    if (perbaikan) {
      fd.append("kode", perbaikan.kode);
      fd.append("pin", perbaikan.pin);
    }

    try {
      setHasil(await api(perbaikan ? "/tamu/perbaikan" : "/tamu/pengajuan", { method: "POST", body: fd }));
      window.scrollTo({ top: 0, behavior: "smooth" });
    } catch (err) {
      setKunci((k) => k + 1);
      setToken("");
      if (err.status === 422 && err.errors) {
        setErrs(galatPerKolom(err.errors));
        fokusSalah(formRef.current);
        toast.error("Periksa kembali isian yang ditandai.");
      } else if (err.status === 422 || err.status === 409 || err.status === 429) {
        toast.error(err.message);
      } else {
        toast.galat(err);
      }
    }
  });

  const salin = async (teks) => {
    try {
      await navigator.clipboard.writeText(teks);
      toast.success("Disalin.");
    } catch {
      toast.error("Gagal menyalin. Catat secara manual.");
    }
  };

  const kepala = (
    <nav className="text-xs text-slate-500">
      <Link to="/" className="hover:text-primary">Beranda</Link> /{" "}
      <Link to="/layanan/administrasi-persuratan" className="hover:text-primary">Administrasi & Persuratan</Link> / {perbaikan ? "Perbaiki pengajuan" : "Ajukan tanpa akun"}
    </nav>
  );

  if (loading) return <div className="mx-auto max-w-[720px] px-5 py-12">Memuat...</div>;

  if (error || !l) {
    return (
      <div className="mx-auto max-w-[720px] px-5 py-12 sm:px-8">
        {kepala}
        <p role="alert" className="mt-6 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">Layanan tidak ditemukan atau sedang tidak tersedia.</p>
      </div>
    );
  }

  if (l.akses !== "guest") {
    return (
      <div className="mx-auto max-w-[720px] px-5 py-12 sm:px-8">
        {kepala}
        <h1 className="mt-4 text-2xl font-extrabold text-navy">{l.nama}</h1>
        <p className="mt-3 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
          {l.akses === "login" ? "Layanan ini hanya untuk akun sekolah. Silakan masuk terlebih dulu." : l.instruksi || "Layanan ini memerlukan pemeriksaan langsung oleh sekolah."}
        </p>
        <Link to={l.akses === "login" ? "/login" : "/layanan/administrasi-persuratan"} className="mt-4 inline-block font-semibold text-primary">
          {l.akses === "login" ? "Masuk" : "Kembali"}
        </Link>
      </div>
    );
  }

  if (hasil && perbaikan) {
    return (
      <div className="mx-auto max-w-[720px] px-5 py-12 sm:px-8">
        {kepala}
        <section className="mt-6 rounded-2xl border border-green-200 bg-white p-7">
          <p className="flex items-center gap-2 font-bold text-green-700"><CheckCircleIcon className="h-6 w-6" /> Perbaikan terkirim</p>
          <p className="mt-2 text-sm text-slate-600">
            Pengajuan <b>{perbaikan.kode}</b> kembali ke antrian dan akan diperiksa ulang oleh petugas TU. Kode dan PIN Anda tidak berubah.
          </p>
          <Link to="/layanan/administrasi-persuratan#cek-status" className="mt-6 inline-block rounded-lg bg-primary px-5 py-2.5 text-sm font-semibold text-white hover:bg-primary-dark">
            Ke halaman Cek Status
          </Link>
        </section>
      </div>
    );
  }

  if (hasil) {
    return (
      <div className="mx-auto max-w-[720px] px-5 py-12 sm:px-8">
        {kepala}
        <section className="mt-6 rounded-2xl border border-green-200 bg-white p-7">
          <p className="flex items-center gap-2 font-bold text-green-700"><CheckCircleIcon className="h-6 w-6" /> Pengajuan diterima</p>
          <p className="mt-2 text-sm text-slate-600">
            Pengajuan Anda <b>belum terverifikasi</b>. Petugas TU akan memeriksanya lebih dulu. Simpan kode dan PIN di bawah untuk memeriksa status.
          </p>

          <dl className="mt-5 grid gap-4 sm:grid-cols-2">
            {[["Kode pengajuan", hasil.kode], ["PIN", hasil.pin]].map(([k, v]) => (
              <div key={k} className="rounded-xl bg-surface p-4">
                <dt className="text-xs text-slate-500">{k}</dt>
                <dd className="mt-1 flex items-center justify-between gap-2">
                  <span className="font-mono text-2xl font-bold tracking-wider text-navy">{v}</span>
                  <button type="button" onClick={() => salin(v)} aria-label={`Salin ${k}`} className="rounded-lg p-2 text-slate-500 hover:bg-white hover:text-primary">
                    <ClipboardDocumentIcon className="h-5 w-5" />
                  </button>
                </dd>
              </div>
            ))}
          </dl>

          <p className="mt-5 flex gap-2 rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
            <ExclamationTriangleIcon className="h-5 w-5 shrink-0" />
            <span><b>PIN hanya ditampilkan sekali</b> dan tidak bisa dilihat lagi. Foto atau catat sekarang sebelum menutup halaman ini.</span>
          </p>

          <Link to="/layanan/administrasi-persuratan#cek-status" className="mt-6 inline-block rounded-lg bg-primary px-5 py-2.5 text-sm font-semibold text-white hover:bg-primary-dark">
            Ke halaman Cek Status
          </Link>
        </section>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-[720px] px-5 py-12 sm:px-8">
      {kepala}
      <h1 className="mt-4 text-3xl font-extrabold text-navy">{perbaikan ? "Perbaiki pengajuan" : l.nama}</h1>
      <p className="mt-1 text-sm text-slate-600">{perbaikan ? `${l.nama} · ${perbaikan.kode}` : l.deskripsi}</p>

      {perbaikan && (
        <p className="mt-5 flex gap-2 rounded-lg border border-orange-300 bg-orange-50 p-4 text-sm text-orange-900">
          <ExclamationTriangleIcon className="h-5 w-5 shrink-0" />
          <span><b>Catatan petugas:</b> {perbaikan.catatan || "Mohon periksa kembali data dan dokumen Anda."}</span>
        </p>
      )}

      {!perbaikan && (
        <section className="mt-6 rounded-xl border border-line bg-white p-6">
          <h2 className="font-bold text-navy">Persyaratan dan ketentuan</h2>
          <ul className="mt-3 list-disc space-y-1.5 pl-5 text-sm text-slate-700">
            {(l.syarat || "").split("\n").filter(Boolean).map((s) => <li key={s}>{s}</li>)}
            <li>Pengajuan tanpa akun <b>belum terverifikasi</b> sampai diperiksa petugas TU. Surat tidak dibuat sebelum itu.</li>
            <li>Lampiran hanya JPG atau PNG, maksimal {batas.maks_file} file, {batas.maks_mb} MB per file, total {batas.maks_total_mb} MB. PDF tidak diterima.</li>
            <li>Data dipakai hanya untuk memproses pengajuan. Lampiran dihapus otomatis setelah masa simpan berakhir.</li>
          </ul>
          <label className="mt-4 flex cursor-pointer items-start gap-2 text-sm">
            <input type="checkbox" checked={setuju} onChange={(e) => setSetuju(e.target.checked)} className="mt-0.5 h-4 w-4 accent-[#0878d1]" />
            Saya sudah membaca dan menyetujui ketentuan di atas.
          </label>
        </section>
      )}

      {setuju && (
        <form ref={formRef} onSubmit={kirim} noValidate className="mt-6 space-y-4 rounded-xl border border-line bg-white p-6">
          <Field label="Nama lengkap pemohon" required error={errs.pemohon_nama}>
            {(p) => <input {...p} value={f.pemohon_nama} onChange={ubah("pemohon_nama")} autoComplete="name" className={`${inputCls(errs.pemohon_nama)} h-11`} />}
          </Field>

          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Nomor WhatsApp" required error={errs.pemohon_wa} hint="Contoh: 081234567890">
              {(p) => <input {...p} inputMode="tel" value={f.pemohon_wa} onChange={ubah("pemohon_wa")} autoComplete="tel" className={`${inputCls(errs.pemohon_wa)} h-11`} />}
            </Field>
            <Field label="Anda adalah" required error={errs.hubungan}>
              {(p) => (
                <select {...p} value={f.hubungan} onChange={ubah("hubungan")} className={`${inputCls(errs.hubungan)} h-11`}>
                  {HUBUNGAN.map(([v, t]) => <option key={v} value={v}>{t}</option>)}
                </select>
              )}
            </Field>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="NIS siswa (bila ada)" error={errs.nis}>
              {(p) => <input {...p} inputMode="numeric" value={f.nis} onChange={ubah("nis")} className={`${inputCls(errs.nis)} h-11`} />}
            </Field>
            <Field label="Dibutuhkan paling lambat" required error={errs.tanggal}>
              {(p) => <input {...p} type="date" min={hariIni()} value={f.tanggal} onChange={ubah("tanggal")} className={`${inputCls(errs.tanggal)} h-11`} />}
            </Field>
          </div>

          <Field label="Keperluan / keterangan" required error={errs.keterangan}>
            {(p) => <textarea {...p} rows={4} maxLength={1000} value={f.keterangan} onChange={ubah("keterangan")} className={inputCls(errs.keterangan)} />}
          </Field>

          <Field
            label={`Dokumen persyaratan${l.wajib_lampiran ? "" : " (opsional)"}`}
            required={l.wajib_lampiran && !adaLampiranLama}
            error={errs.lampiran}
            hint={
              adaLampiranLama
                ? `Sudah ada ${perbaikan.jumlah_lampiran} dokumen terunggah. Pilih file baru hanya jika ingin menggantinya (semua dokumen lama akan diganti).`
                : `JPG atau PNG. Maks ${batas.maks_file} file, ${batas.maks_mb} MB per file.`
            }
          >
            {(p) => <input {...p} type="file" multiple accept="image/jpeg,image/png" onChange={pilihFile} className="block w-full text-sm" />}
          </Field>
          {files.length > 0 && (
            <ul className="space-y-1.5 text-sm">
              {files.map((x, i) => (
                <li key={i} className="flex items-center justify-between rounded-lg bg-surface px-3 py-2">
                  <span className="truncate">{x.name} · {(x.size / 1024 / 1024).toFixed(1)} MB</span>
                  <button type="button" onClick={() => setFiles(files.filter((_, j) => j !== i))} className="ml-3 font-semibold text-red-600">Hapus</button>
                </li>
              ))}
            </ul>
          )}

          {/* Honeypot: disembunyikan dari manusia */}
          <input name="website" tabIndex={-1} autoComplete="off" aria-hidden="true" className="absolute -left-[9999px] h-0 w-0 opacity-0" />

          <div>
            <Captcha key={kunci} onToken={setToken} />
            {errs.captcha && <p role="alert" className="mt-1 text-sm text-red-600">{errs.captcha}</p>}
          </div>

          <button disabled={saving} className="w-full rounded-lg bg-primary px-5 py-3 text-sm font-semibold text-white transition-colors hover:bg-primary-dark disabled:opacity-70">
            {saving ? "Mengirim..." : perbaikan ? "Kirim perbaikan" : "Kirim pengajuan"}
          </button>
        </form>
      )}
    </div>
  );
}