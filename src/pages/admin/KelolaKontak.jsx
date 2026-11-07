import { useCallback, useEffect, useRef, useState } from "react";
import { ArrowDownIcon, ArrowUpIcon, PlusIcon, TrashIcon } from "@heroicons/react/24/outline";
import { api } from "../../lib/api";
import { resetCacheKontak } from "../../lib/useKontak";
import { useToast } from "../../context/Toast";
import { useConfirm } from "../../context/Confirm";
import { useSubmit } from "../../lib/useSubmit";
import { galatPerKolom, fokusSalah } from "../../lib/validasi";
import Field, { inputCls } from "../../components/Field";
import Modal from "../../components/Modal";

const KATEGORI = ["Umum", "Akun", "Pengajuan", "Dokumen"];
const KOLOM_JAM = ["hari", "jam", "keterangan"];
const KOLOM_SOSMED = ["nama", "url"];
const KOLOM_BAGIAN = ["nama", "telepon", "email", "keterangan"];

// Ubah null menjadi "" supaya isian terkendali, dan buang baris yang seluruhnya kosong saat kirim.
const rapikan = (arr, kolom) => (arr ?? []).map((r) => Object.fromEntries(kolom.map((c) => [c, r?.[c] ?? ""])));
const bersihkan = (arr, kolom) =>
  arr
    .map((r) => Object.fromEntries(kolom.map((c) => [c, (r[c] ?? "").trim()])))
    .filter((r) => kolom.some((c) => r[c]));

const aksiCls = "rounded-lg border border-line px-3 py-1.5 text-xs font-semibold text-navy transition-colors hover:bg-surface disabled:opacity-40";

/* ---------- Editor daftar baris (jam layanan, media sosial, bagian) ---------- */
function DaftarBaris({ judul, hint, kunci, kolom, nilai, onUbah, onTambah, onHapus, errs, maks }) {
  return (
    <fieldset className="rounded-xl border border-line bg-white p-5">
      <legend className="px-1 text-sm font-bold text-navy">{judul}</legend>
      {hint && <p className="text-xs text-slate-500">{hint}</p>}

      <div className="mt-3 space-y-3">
        {nilai.length === 0 && <p className="text-sm text-slate-500">Belum ada.</p>}
        {nilai.map((r, i) => (
          <div key={i} className="rounded-lg bg-surface p-3">
            <div className="grid gap-2 sm:grid-cols-2">
              {kolom.map((c) => {
                const err = errs[`${kunci}.${i}.${c.k}`];
                return (
                  <div key={c.k} className={c.lebar ? "sm:col-span-2" : ""}>
                    <input
                      aria-label={`${judul} ${i + 1}: ${c.label}`}
                      aria-invalid={err ? "true" : undefined}
                      placeholder={c.label}
                      value={r[c.k]}
                      onChange={(e) => onUbah(i, c.k, e.target.value)}
                      className={`${inputCls(err)} h-10`}
                    />
                    {err && <p className="mt-1 text-xs font-medium text-red-600">{err}</p>}
                  </div>
                );
              })}
            </div>
            <button
              type="button"
              onClick={() => onHapus(i)}
              className="mt-2 inline-flex items-center gap-1 text-xs font-semibold text-red-600 hover:underline"
            >
              <TrashIcon className="h-4 w-4" /> Hapus baris
            </button>
          </div>
        ))}
      </div>

      {nilai.length < maks && (
        <button
          type="button"
          onClick={onTambah}
          className="mt-3 inline-flex items-center gap-1 text-sm font-semibold text-primary hover:underline"
        >
          <PlusIcon className="h-4 w-4" /> Tambah baris
        </button>
      )}
    </fieldset>
  );
}

/* ---------- Tab Kontak ---------- */
function TabKontak() {
  const toast = useToast();
  const formRef = useRef(null);
  const [f, setF] = useState(null);
  const [error, setError] = useState("");
  const [errs, setErrs] = useState({});

  useEffect(() => {
    let batal = false;
    api("/admin/kontak")
      .then((d) => {
        if (batal) return;
        setF({
          alamat: d.alamat ?? "",
          telepon: d.telepon ?? "",
          email: d.email ?? "",
          whatsapp: d.whatsapp ?? "",
          maps_url: d.maps_url ?? "",
          jam_layanan: rapikan(d.jam_layanan, KOLOM_JAM),
          media_sosial: rapikan(d.media_sosial, KOLOM_SOSMED),
          bagian: rapikan(d.bagian, KOLOM_BAGIAN),
        });
      })
      .catch((e) => !batal && setError(e.message));
    return () => { batal = true; };
  }, []);

  const ubah = (k) => (e) => setF((s) => ({ ...s, [k]: e.target.value }));
  const ubahBaris = (kunci) => (i, kolom, nilai) =>
    setF((s) => ({ ...s, [kunci]: s[kunci].map((r, n) => (n === i ? { ...r, [kolom]: nilai } : r)) }));
  const tambahBaris = (kunci, kosong) => () => setF((s) => ({ ...s, [kunci]: [...s[kunci], kosong] }));
  const hapusBaris = (kunci) => (i) => setF((s) => ({ ...s, [kunci]: s[kunci].filter((_, n) => n !== i) }));

  const [simpan, saving] = useSubmit(async (e) => {
    e.preventDefault();
    setErrs({});
    const body = {
      alamat: f.alamat.trim(),
      telepon: f.telepon.trim(),
      email: f.email.trim(),
      whatsapp: f.whatsapp.trim(),
      maps_url: f.maps_url.trim(),
      jam_layanan: bersihkan(f.jam_layanan, KOLOM_JAM),
      media_sosial: bersihkan(f.media_sosial, KOLOM_SOSMED),
      bagian: bersihkan(f.bagian, KOLOM_BAGIAN),
    };
    try {
      await api("/admin/kontak", { method: "PUT", body });
      resetCacheKontak();
      toast.success("Data kontak disimpan.");
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

  if (error) return <p role="alert" className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</p>;
  if (!f) return <p className="text-sm text-slate-500">Memuat data...</p>;

  return (
    <form ref={formRef} onSubmit={simpan} noValidate className="space-y-5">
      <fieldset className="space-y-4 rounded-xl border border-line bg-white p-5">
        <legend className="px-1 text-sm font-bold text-navy">Informasi utama</legend>
        <Field label="Alamat" error={errs.alamat}>
          {(p) => <textarea {...p} rows={3} value={f.alamat} onChange={ubah("alamat")} className={`${inputCls(errs.alamat)} py-2`} />}
        </Field>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Telepon kantor" error={errs.telepon}>
            {(p) => <input {...p} value={f.telepon} onChange={ubah("telepon")} className={`${inputCls(errs.telepon)} h-11`} />}
          </Field>
          <Field label="Email resmi" error={errs.email}>
            {(p) => <input {...p} type="email" value={f.email} onChange={ubah("email")} className={`${inputCls(errs.email)} h-11`} />}
          </Field>
        </div>
        <Field
          label="Nomor WhatsApp layanan"
          error={errs.whatsapp}
          hint="Gunakan nomor resmi kantor, bukan nomor pribadi. Contoh: 081234567890. Kosongkan jika tidak ada."
        >
          {(p) => <input {...p} inputMode="tel" value={f.whatsapp} onChange={ubah("whatsapp")} className={`${inputCls(errs.whatsapp)} h-11`} />}
        </Field>
        <Field label="Tautan Google Maps" error={errs.maps_url} hint="Harus diawali https://. Kosongkan jika tidak ada.">
          {(p) => <input {...p} value={f.maps_url} onChange={ubah("maps_url")} className={`${inputCls(errs.maps_url)} h-11`} />}
        </Field>
      </fieldset>

      <DaftarBaris
        judul="Jam layanan"
        hint="Contoh: hari Senin - Jumat, jam 07.00 - 15.00 WIB, keterangan istirahat atau hari libur."
        kunci="jam_layanan"
        kolom={[
          { k: "hari", label: "Hari" },
          { k: "jam", label: "Jam (wajib)" },
          { k: "keterangan", label: "Keterangan", lebar: true },
        ]}
        nilai={f.jam_layanan}
        onUbah={ubahBaris("jam_layanan")}
        onTambah={tambahBaris("jam_layanan", { hari: "", jam: "", keterangan: "" })}
        onHapus={hapusBaris("jam_layanan")}
        errs={errs}
        maks={10}
      />

      <DaftarBaris
        judul="Media sosial"
        hint="Tautan harus diawali https://"
        kunci="media_sosial"
        kolom={[
          { k: "nama", label: "Nama (mis. Instagram)" },
          { k: "url", label: "Tautan https://..." },
        ]}
        nilai={f.media_sosial}
        onUbah={ubahBaris("media_sosial")}
        onTambah={tambahBaris("media_sosial", { nama: "", url: "" })}
        onHapus={hapusBaris("media_sosial")}
        errs={errs}
        maks={8}
      />

      <DaftarBaris
        judul="Kontak per bagian (opsional)"
        hint="Isi dengan nomor resmi kantor, bukan nomor pribadi staf. Boleh dikosongkan."
        kunci="bagian"
        kolom={[
          { k: "nama", label: "Nama bagian (mis. Kurikulum)", lebar: true },
          { k: "telepon", label: "Telepon" },
          { k: "email", label: "Email" },
          { k: "keterangan", label: "Keterangan", lebar: true },
        ]}
        nilai={f.bagian}
        onUbah={ubahBaris("bagian")}
        onTambah={tambahBaris("bagian", { nama: "", telepon: "", email: "", keterangan: "" })}
        onHapus={hapusBaris("bagian")}
        errs={errs}
        maks={10}
      />

      <div className="flex justify-end">
        <button disabled={saving} className="rounded-lg bg-primary px-6 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-primary-dark disabled:opacity-70">
          {saving ? "Menyimpan..." : "Simpan Kontak"}
        </button>
      </div>
    </form>
  );
}

/* ---------- Tab FAQ ---------- */
const faqKosong = () => ({ id: null, pertanyaan: "", jawaban: "", kategori: "Umum", tampil: true });

function TabFaq() {
  const toast = useToast();
  const confirm = useConfirm();
  const formRef = useRef(null);
  const [daftar, setDaftar] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [form, setForm] = useState(null);
  const [errs, setErrs] = useState({});

  const muat = useCallback(async () => {
    setLoading(true);
    try {
      setDaftar(await api("/admin/faq"));
      setError("");
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { muat(); }, [muat]);

  const bukaForm = (data) => { setErrs({}); setForm(data); };
  const tutupForm = () => { if (saving) return; setForm(null); setErrs({}); };
  const ubah = (k) => (e) => setForm((s) => ({ ...s, [k]: e.target.value }));

  const [simpan, saving] = useSubmit(async (e) => {
    e.preventDefault();
    const salah = {};
    if (!form.pertanyaan.trim()) salah.pertanyaan = "Pertanyaan wajib diisi.";
    if (!form.jawaban.trim()) salah.jawaban = "Jawaban wajib diisi.";
    setErrs(salah);
    if (Object.keys(salah).length) return fokusSalah(formRef.current);

    const body = {
      pertanyaan: form.pertanyaan.trim(),
      jawaban: form.jawaban.trim(),
      kategori: form.kategori,
      tampil: form.tampil,
    };
    try {
      if (form.id) await api(`/admin/faq/${form.id}`, { method: "PUT", body });
      else await api("/admin/faq", { method: "POST", body });
      toast.success(form.id ? "FAQ diperbarui." : "FAQ ditambahkan.");
      setForm(null);
      setErrs({});
      await muat();
    } catch (err) {
      if (err.status === 422 && err.errors) {
        setErrs(galatPerKolom(err.errors));
        fokusSalah(formRef.current);
      } else {
        toast.galat(err);
      }
    }
  });

  const geser = async (f, arah) => {
    try {
      await api(`/admin/faq/${f.id}/geser`, { method: "POST", body: { arah } });
      await muat();
    } catch (err) {
      toast.galat(err);
    }
  };

  const togelTampil = async (f) => {
    try {
      await api(`/admin/faq/${f.id}`, {
        method: "PUT",
        body: { pertanyaan: f.pertanyaan, jawaban: f.jawaban, kategori: f.kategori, tampil: !f.tampil },
      });
      toast.success(f.tampil ? "FAQ disembunyikan dari publik." : "FAQ ditampilkan ke publik.");
      await muat();
    } catch (err) {
      toast.galat(err);
    }
  };

  const hapus = async (f) => {
    const ya = await confirm({
      title: "Hapus FAQ ini?",
      description: "FAQ akan dihapus permanen dari website.",
      items: [{ label: "Pertanyaan", value: f.pertanyaan }],
      confirmText: "Hapus",
      tone: "danger",
      action: () => api(`/admin/faq/${f.id}`, { method: "DELETE" }),
    });
    if (ya) {
      toast.success("FAQ dihapus.");
      muat();
    }
  };

  return (
    <>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-slate-600">Urutan di sini sama dengan urutan di website. Gunakan panah untuk menggeser.</p>
        <button
          type="button"
          onClick={() => bukaForm(faqKosong())}
          className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-primary-dark active:scale-[0.98]"
        >
          <PlusIcon className="h-5 w-5" /> Tambah FAQ
        </button>
      </div>

      {error && (
        <div role="alert" className="mt-5 flex flex-wrap items-center justify-between gap-3 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          <span>{error}</span>
          <button type="button" onClick={muat} className="font-semibold underline">Coba lagi</button>
        </div>
      )}

      <div className="mt-5 space-y-3">
        {loading && <p className="text-sm text-slate-500">Memuat data...</p>}
        {!loading && !error && daftar.length === 0 && <p className="text-sm text-slate-500">Belum ada FAQ. Klik "Tambah FAQ".</p>}
        {daftar.map((f, i) => (
          <div key={f.id} className={`rounded-xl border border-line bg-white p-4 ${f.tampil ? "" : "opacity-70"}`}>
            <div className="flex flex-wrap items-center gap-2">
              <span className="rounded-full bg-blue-50 px-2.5 py-0.5 text-xs font-semibold text-primary">{f.kategori}</span>
              {!f.tampil && <span className="rounded-full border border-slate-200 bg-slate-50 px-2.5 py-0.5 text-xs font-semibold text-slate-600">Disembunyikan</span>}
            </div>
            <p className="mt-2 font-semibold text-navy">{f.pertanyaan}</p>
            <p className="mt-1 line-clamp-2 whitespace-pre-line text-sm text-slate-600">{f.jawaban}</p>
            <div className="mt-3 flex flex-wrap gap-2">
              <button type="button" aria-label="Geser ke atas" disabled={i === 0} onClick={() => geser(f, "naik")} className={aksiCls}>
                <ArrowUpIcon className="h-4 w-4" />
              </button>
              <button type="button" aria-label="Geser ke bawah" disabled={i === daftar.length - 1} onClick={() => geser(f, "turun")} className={aksiCls}>
                <ArrowDownIcon className="h-4 w-4" />
              </button>
              <button type="button" className={aksiCls} onClick={() => bukaForm({ id: f.id, pertanyaan: f.pertanyaan, jawaban: f.jawaban, kategori: f.kategori, tampil: f.tampil })}>Ubah</button>
              <button type="button" className={aksiCls} onClick={() => togelTampil(f)}>{f.tampil ? "Sembunyikan" : "Tampilkan"}</button>
              <button type="button" className={`${aksiCls} text-red-600`} onClick={() => hapus(f)}>Hapus</button>
            </div>
          </div>
        ))}
      </div>

      {form && (
        <Modal title={form.id ? "Ubah FAQ" : "Tambah FAQ"} onClose={tutupForm} locked={saving}>
          <form ref={formRef} onSubmit={simpan} noValidate className="space-y-4">
            <Field label="Pertanyaan" required error={errs.pertanyaan}>
              {(p) => <input {...p} value={form.pertanyaan} onChange={ubah("pertanyaan")} className={`${inputCls(errs.pertanyaan)} h-11`} />}
            </Field>
            <Field label="Kategori" error={errs.kategori}>
              {(p) => (
                <select {...p} value={form.kategori} onChange={ubah("kategori")} className={`${inputCls(errs.kategori)} h-11`}>
                  {KATEGORI.map((k) => <option key={k} value={k}>{k}</option>)}
                </select>
              )}
            </Field>
            <Field label="Jawaban" required error={errs.jawaban} hint={`Teks biasa, baris baru dipertahankan. ${form.jawaban.length}/3000 karakter.`}>
              {(p) => <textarea {...p} rows={6} maxLength={3000} value={form.jawaban} onChange={ubah("jawaban")} className={`${inputCls(errs.jawaban)} py-2`} />}
            </Field>
            <label className="flex items-center gap-2 text-sm">
              <input type="checkbox" checked={form.tampil} onChange={(e) => setForm((s) => ({ ...s, tampil: e.target.checked }))} />
              Tampilkan di website
            </label>
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

/* ---------- Halaman ---------- */
export default function KelolaKontak() {
  const [tab, setTab] = useState("kontak");

  return (
    <>
      <h1 className="text-2xl font-extrabold text-navy">Kontak &amp; FAQ</h1>
      <p className="mt-1 text-sm text-slate-600">Perubahan di sini langsung tampil di halaman Kontak, Beranda, dan Footer website.</p>

      <div role="tablist" className="mt-5 flex gap-2 border-b border-line">
        {[["kontak", "Kontak"], ["faq", "FAQ"]].map(([id, label]) => (
          <button
            key={id}
            type="button"
            role="tab"
            aria-selected={tab === id}
            onClick={() => setTab(id)}
            className={`-mb-px border-b-2 px-4 py-2.5 text-sm font-semibold ${
              tab === id ? "border-primary text-primary" : "border-transparent text-slate-600 hover:text-navy"
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      <div className="mt-6">{tab === "kontak" ? <TabKontak /> : <TabFaq />}</div>
    </>
  );
}