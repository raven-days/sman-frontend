import { useCallback, useEffect, useRef, useState } from "react";
import { ArrowDownIcon, ArrowUpIcon, PencilSquareIcon, PlusIcon, TrashIcon } from "@heroicons/react/24/outline";
import { api } from "../../lib/api";
import { siapkanBanner } from "../../lib/banner";
import { useToast } from "../../context/Toast";
import { useConfirm } from "../../context/Confirm";
import { useSubmit } from "../../lib/useSubmit";
import { galatPerKolom, fokusSalah } from "../../lib/validasi";
import Field, { inputCls } from "../../components/Field";
import Modal from "../../components/Modal";
import { DaftarBarisSkeleton } from "../../components/Skeleton";
import PengaturanHero from "./PengaturanHero";

const MAKS_BANNER = 8;
const kosong = () => ({ id: null, judul: "", deskripsi: "", tombol: "", link: "", aktif: true, file: null, asli: null, gambar: null });
const MODE = [
  { id: "auto", label: "Otomatis", ket: "Foto lebar dipotong, foto tegak ditampilkan utuh." },
  { id: "potong", label: "Potong", ket: "Gambar memenuhi banner, bagian lebih dipotong." },
  { id: "utuh", label: "Utuh", ket: "Seluruh gambar terlihat, sisanya latar buram." },
];
const linkValid = (v) => !v || /^(\/(?!\/)\S*|https?:\/\/\S+)$/.test(v);
const ikonCls = "rounded-lg p-2 text-slate-500 transition-colors hover:bg-blue-50 hover:text-primary disabled:opacity-40";

export default function KelolaBanner() {
  const toast = useToast();
  const confirm = useConfirm();
  const formRef = useRef(null);
  const [daftar, setDaftar] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [sibuk, setSibuk] = useState(false);
  const [form, setForm] = useState(null);
  const [errs, setErrs] = useState({});
  const [preview, setPreview] = useState(null);
  const [info, setInfo] = useState(null); // { asliW, asliH, mode } hasil penyesuaian otomatis
  const [mode, setMode] = useState("auto");
  const [memproses, setMemproses] = useState(false);
  const urutan = useRef(0); // mencegah hasil proses lama menimpa pilihan yang lebih baru

  const muat = useCallback(async () => {
    try {
      setDaftar(await api("/admin/banner"));
      setError("");
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, []);
  useEffect(() => { muat(); }, [muat]);

  useEffect(() => {
    if (!form?.file) { setPreview(null); return undefined; }
    const u = URL.createObjectURL(form.file);
    setPreview(u);
    return () => URL.revokeObjectURL(u);
  }, [form?.file]);

  const bukaForm = (data) => { urutan.current++; setErrs({}); setInfo(null); setMode("auto"); setMemproses(false); setForm(data); };
  const tutupForm = () => { if (saving) return; urutan.current++; setForm(null); setErrs({}); };
  const ubah = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  // Gambar apa pun disesuaikan otomatis menjadi 1600x600 dan dikompres di bawah batas ukuran.
  const proses = async (asli, m) => {
    const no = ++urutan.current;
    setMemproses(true);
    try {
      const hasil = await siapkanBanner(asli, { mode: m });
      URL.revokeObjectURL(hasil.previewUrl); // pratinjau dibuat dari form.file di efek di atas
      if (no !== urutan.current) return;
      setInfo(hasil.info);
      setErrs((x) => ({ ...x, file: undefined }));
      setForm((fm) => ({ ...fm, file: hasil.file, asli }));
    } catch (err) {
      if (no !== urutan.current) return;
      setInfo(null);
      setErrs((x) => ({ ...x, file: err.message }));
      setForm((fm) => ({ ...fm, file: null, asli: null }));
    } finally {
      if (no === urutan.current) setMemproses(false);
    }
  };

  const pilihFile = (e) => {
    const f = e.target.files?.[0];
    if (!f) return;
    if (!/^image\/(jpeg|png|webp)$/.test(f.type)) {
      setErrs((x) => ({ ...x, file: "Format gambar harus JPG, PNG, atau WebP." }));
      e.target.value = "";
      return;
    }
    proses(f, mode);
  };

  const ubahMode = (m) => {
    setMode(m);
    if (form?.asli) proses(form.asli, m);
  };

  const [simpan, saving] = useSubmit(async (e) => {
    e.preventDefault();
    const salah = {};
    if (!form.id && !form.file) salah.file = "Gambar wajib dipilih.";
    if (memproses) salah.file = "Gambar masih diproses, tunggu sebentar.";
    if (form.judul.trim().length > 120) salah.judul = "Judul maksimal 120 karakter.";
    if (form.deskripsi.trim().length > 255) salah.deskripsi = "Deskripsi maksimal 255 karakter.";
    if (form.tombol.trim().length > 40) salah.tombol = "Teks tombol maksimal 40 karakter.";
    if (!linkValid(form.link.trim())) salah.link = "Tautan harus diawali / (halaman situs) atau https://.";
    setErrs(salah);
    if (Object.keys(salah).length) return fokusSalah(formRef.current);

    const fd = new FormData();
    if (form.file) fd.append("gambar", form.file);
    fd.append("judul", form.judul.trim());
    fd.append("deskripsi", form.deskripsi.trim());
    fd.append("tombol", form.tombol.trim());
    fd.append("link", form.link.trim());
    fd.append("aktif", form.aktif ? "1" : "0");

    try {
      await api(form.id ? `/admin/banner/${form.id}` : "/admin/banner", { method: "POST", body: fd });
      toast.success(form.id ? "Banner diperbarui." : "Banner ditambahkan.");
      setForm(null);
      setErrs({});
      await muat();
    } catch (err) {
      if (err.status === 422 && err.errors) {
        setErrs(galatPerKolom(err.errors, { gambar: "file" }));
        fokusSalah(formRef.current);
        toast.error("Periksa kembali isian yang ditandai.");
      } else {
        toast.galat(err);
      }
    }
  });

  const geser = async (b, arah) => {
    setSibuk(true);
    try {
      setDaftar(await api(`/admin/banner/${b.id}/geser`, { method: "POST", body: { arah } }));
    } catch (err) {
      toast.galat(err);
    } finally {
      setSibuk(false);
    }
  };

  const ubahAktif = async (b) => {
    setSibuk(true);
    try {
      await api(`/admin/banner/${b.id}`, { method: "POST", body: { aktif: !b.aktif } });
      toast.success(b.aktif ? "Banner disembunyikan dari beranda." : "Banner ditampilkan di beranda.");
      await muat();
    } catch (err) {
      toast.galat(err);
    } finally {
      setSibuk(false);
    }
  };

  const hapus = async (b) => {
    const ya = await confirm({
      title: "Hapus banner ini?",
      description: "Banner dihapus dari beranda dan tidak bisa dikembalikan.",
      items: [{ label: "Judul", value: b.judul || "(tanpa judul)" }],
      consequence: "File gambar ikut terhapus.",
      confirmText: "Hapus",
      tone: "danger",
      action: () => api(`/admin/banner/${b.id}`, { method: "DELETE" }),
    });
    if (ya) {
      toast.success("Banner dihapus.");
      muat();
    }
  };

  const gambarTampil = preview || form?.gambar;

  return (
    <>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-extrabold text-navy">Kelola Banner</h1>
          <p className="mt-1 text-sm text-slate-600">
            Gambar geser di bagian atas beranda. Ukuran ideal <b>1600×600 px</b>, tetapi gambar lain disesuaikan otomatis. Maksimal {MAKS_BANNER} banner.
          </p>
        </div>
        <button
          type="button"
          disabled={daftar.length >= MAKS_BANNER}
          onClick={() => bukaForm(kosong())}
          className="press inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2.5 text-sm font-semibold text-white hover:bg-primary-dark disabled:opacity-50"
        >
          <PlusIcon className="h-5 w-5" /> Tambah Banner
        </button>
      </div>
<PengaturanHero />

      {error && (
        <div role="alert" className="mt-5 flex flex-wrap items-center justify-between gap-3 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          <span>{error}</span>
          <button type="button" onClick={muat} className="font-semibold underline">Coba lagi</button>
        </div>
      )}

      {loading && <DaftarBarisSkeleton n={3} className="mt-6" />}
      {!loading && !error && daftar.length === 0 && (
        <p className="mt-8 rounded-xl border border-dashed border-line bg-surface/60 px-4 py-10 text-center text-sm text-slate-500">
          Belum ada banner. Beranda memakai tampilan teks bawaan.
        </p>
      )}

      <ul className="mt-6 space-y-3">
        {daftar.map((b, i) => (
          <li key={b.id} className="flex flex-wrap items-center gap-4 rounded-xl border border-line bg-white p-3 sm:flex-nowrap">
            <img src={b.gambar} alt="" className="aspect-[8/3] w-full rounded-lg bg-surface object-cover sm:w-56 sm:shrink-0" />
            <div className="min-w-0 flex-1">
              <p className="truncate font-semibold text-navy">
                <span className="mr-2 text-xs font-bold text-slate-400">#{i + 1}</span>
                {b.judul || "(tanpa judul)"}
              </p>
              {b.deskripsi && <p className="mt-0.5 truncate text-sm text-slate-600">{b.deskripsi}</p>}
              <div className="mt-2 flex flex-wrap items-center gap-2 text-xs">
                <span className={`rounded-full border px-2.5 py-0.5 font-semibold ${b.aktif ? "border-green-200 bg-green-50 text-green-700" : "border-slate-200 bg-slate-50 text-slate-600"}`}>
                  {b.aktif ? "Tampil" : "Disembunyikan"}
                </span>
                {b.link && <span className="truncate text-slate-500">Tautan: {b.link}</span>}
              </div>
            </div>
            <div className="flex items-center gap-1">
              <button type="button" aria-label="Naikkan urutan" disabled={sibuk || i === 0} onClick={() => geser(b, "naik")} className={ikonCls}>
                <ArrowUpIcon className="h-5 w-5" />
              </button>
              <button type="button" aria-label="Turunkan urutan" disabled={sibuk || i === daftar.length - 1} onClick={() => geser(b, "turun")} className={ikonCls}>
                <ArrowDownIcon className="h-5 w-5" />
              </button>
              <button type="button" disabled={sibuk} onClick={() => ubahAktif(b)} className="rounded-lg border border-line px-3 py-1.5 text-xs font-semibold text-navy hover:bg-surface disabled:opacity-50">
                {b.aktif ? "Sembunyikan" : "Tampilkan"}
              </button>
              <button
                type="button"
                aria-label="Ubah banner"
                onClick={() => bukaForm({ id: b.id, judul: b.judul ?? "", deskripsi: b.deskripsi ?? "", tombol: b.tombol ?? "", link: b.link ?? "", aktif: b.aktif, file: null, gambar: b.gambar })}
                className={ikonCls}
              >
                <PencilSquareIcon className="h-5 w-5" />
              </button>
              <button type="button" aria-label="Hapus banner" onClick={() => hapus(b)} className="rounded-lg p-2 text-slate-500 transition-colors hover:bg-red-50 hover:text-red-600">
                <TrashIcon className="h-5 w-5" />
              </button>
            </div>
          </li>
        ))}
      </ul>

      {form && (
        <Modal title={form.id ? "Ubah Banner" : "Tambah Banner"} onClose={tutupForm} locked={saving}>
          <form ref={formRef} onSubmit={simpan} noValidate className="space-y-4">
            <Field
              label="Gambar banner"
              required={!form.id}
              error={errs.file}
              hint="Ukuran ideal 1600×600 px (rasio 8:3), JPG/PNG/WebP. Ukuran lain tetap bisa dipakai, sistem menyesuaikan otomatis (foto tegak ditampilkan utuh dengan latar buram). Letakkan teks dan logo penting di bagian tengah, karena di HP sisi kiri dan kanan terpotong."
            >
              {(p) => (
                <input
                  {...p}
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  onChange={pilihFile}
                  className="block w-full text-sm file:mr-3 file:rounded-lg file:border file:border-line file:bg-white file:px-3 file:py-2 file:text-sm file:font-semibold file:text-navy"
                />
              )}
            </Field>
            {form.asli && (
              <fieldset>
                <legend className="mb-1 text-sm font-semibold text-navy">Penyesuaian gambar</legend>
                <div className="grid grid-cols-3 rounded-xl bg-surface p-1">
                  {MODE.map((m) => (
                    <button
                      key={m.id}
                      type="button"
                      disabled={memproses}
                      aria-pressed={mode === m.id}
                      onClick={() => ubahMode(m.id)}
                      className={`rounded-lg px-2 py-2 text-xs font-semibold transition-colors disabled:opacity-60 ${
                        mode === m.id ? "bg-white text-primary shadow-sm" : "text-slate-500 hover:text-navy"
                      }`}
                    >
                      {m.label}
                    </button>
                  ))}
                </div>
                <p className="mt-1 text-xs text-slate-500">{MODE.find((m) => m.id === mode)?.ket}</p>
              </fieldset>
            )}
            {(gambarTampil || memproses) && (
              <div>
                {gambarTampil && (
                  <img src={gambarTampil} alt="Pratinjau banner" className={`aspect-[8/3] w-full rounded-lg border border-line object-cover ${memproses ? "opacity-60" : ""}`} />
                )}
                <p aria-live="polite" className="mt-1.5 text-xs text-slate-500">
                  {memproses
                    ? "Menyesuaikan gambar..."
                    : info
                      ? `Gambar asli ${info.asliW}×${info.asliH} px disesuaikan menjadi 1600×600 px (${info.mode === "potong" ? "dipotong" : "ditampilkan utuh"}).${info.kecil ? " Gambar asli lebih kecil dari ukuran ideal, hasilnya bisa kurang tajam." : ""}`
                      : null}
                </p>
              </div>
            )}
            <Field label="Judul (opsional)" error={errs.judul}>
              {(p) => <input {...p} value={form.judul} onChange={ubah("judul")} maxLength={120} className={`${inputCls(errs.judul)} h-11`} />}
            </Field>
            <Field label="Deskripsi singkat (opsional)" error={errs.deskripsi} hint="Tampil di layar tablet dan desktop.">
              {(p) => <input {...p} value={form.deskripsi} onChange={ubah("deskripsi")} maxLength={255} className={`${inputCls(errs.deskripsi)} h-11`} />}
            </Field>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Teks tombol (opsional)" error={errs.tombol} hint="Kosong = “Selengkapnya”.">
                {(p) => <input {...p} value={form.tombol} onChange={ubah("tombol")} maxLength={40} className={`${inputCls(errs.tombol)} h-11`} />}
              </Field>
              <Field label="Tautan (opsional)" error={errs.link} hint="Contoh: /ajukan atau https://...">
                {(p) => <input {...p} value={form.link} onChange={ubah("link")} placeholder="/ajukan" className={`${inputCls(errs.link)} h-11`} />}
              </Field>
            </div>
            <label className="flex items-center gap-2 text-sm">
              <input type="checkbox" checked={form.aktif} onChange={(e) => setForm((f) => ({ ...f, aktif: e.target.checked }))} />
              Tampilkan di beranda
            </label>
            <div className="flex justify-end gap-3 pt-2">
              <button type="button" onClick={tutupForm} disabled={saving} className="rounded-lg border border-line px-4 py-2.5 text-sm font-semibold text-navy transition-colors hover:bg-surface disabled:opacity-60">
                Batal
              </button>
              <button disabled={saving || memproses} className="press rounded-lg bg-primary px-5 py-2.5 text-sm font-semibold text-white hover:bg-primary-dark disabled:opacity-70">
                {saving ? "Menyimpan..." : "Simpan"}
              </button>
            </div>
          </form>
        </Modal>
      )}
    </>
  );
}