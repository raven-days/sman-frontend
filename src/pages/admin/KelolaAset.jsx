import { useCallback, useEffect, useRef, useState } from "react";
import { DocumentTextIcon, EyeIcon, PencilSquareIcon, PlusIcon, TrashIcon } from "@heroicons/react/24/outline";
import { api, bukaLampiran, useFetch } from "../../lib/api";
import { useToast } from "../../context/Toast";
import { useConfirm } from "../../context/Confirm";
import { useSubmit } from "../../lib/useSubmit";
import { galatPerKolom, fokusSalah } from "../../lib/validasi";
import Field, { inputCls } from "../../components/Field";
import Modal from "../../components/Modal";
import { DaftarBarisSkeleton } from "../../components/Skeleton";

const MAX_MB = 10;
const PERAN = [
  ["siswa", "Siswa/Orang Tua"],
  ["guru", "Guru/Staf"],
  ["tu", "Staf TU"],
];
const NAMA_PERAN = Object.fromEntries(PERAN);
const KATEGORI = ["Identitas sekolah", "Perizinan bangunan", "Pertanahan", "Akreditasi", "Surat Keputusan", "Lainnya"];
const kosong = () => ({ id: null, judul: "", kategori: "", nomor: "", keterangan: "", peran: ["guru", "tu"], file: null, fileNama: null });
const ukuran = (b) => (b >= 1048576 ? `${(b / 1048576).toFixed(1)} MB` : `${Math.max(1, Math.round(b / 1024))} KB`);
const ikonCls = "rounded-lg p-2 text-slate-500 transition-colors hover:bg-blue-50 hover:text-primary";

/* ===================== TAB DOKUMEN ===================== */
function TabDokumen() {
  const toast = useToast();
  const confirm = useConfirm();
  const formRef = useRef(null);
  const [daftar, setDaftar] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [form, setForm] = useState(null);
  const [errs, setErrs] = useState({});

  const muat = useCallback(async () => {
    try {
      setDaftar(await api("/admin/aset/dokumen"));
      setError("");
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, []);
  useEffect(() => { muat(); }, [muat]);

  const bukaForm = (d) => { setErrs({}); setForm(d); };
  const tutupForm = () => { if (saving) return; setForm(null); setErrs({}); };
  const ubah = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));
  const togglePeran = (id) =>
    setForm((f) => ({ ...f, peran: f.peran.includes(id) ? f.peran.filter((x) => x !== id) : [...f.peran, id] }));

  const pilihFile = (e) => {
    const f = e.target.files?.[0];
    if (!f) return;
    if (!/^(application\/pdf|image\/(jpeg|png))$/.test(f.type)) {
      setErrs((x) => ({ ...x, file: "File harus berformat PDF, JPG, atau PNG." }));
      e.target.value = "";
      return;
    }
    if (f.size > MAX_MB * 1024 * 1024) {
      setErrs((x) => ({ ...x, file: `Ukuran file maksimal ${MAX_MB} MB.` }));
      e.target.value = "";
      return;
    }
    setErrs((x) => ({ ...x, file: undefined }));
    setForm((fm) => ({ ...fm, file: f }));
  };

  const [simpan, saving] = useSubmit(async (e) => {
    e.preventDefault();
    const salah = {};
    if (!form.judul.trim()) salah.judul = "Judul wajib diisi.";
    if (!form.id && !form.file) salah.file = "File wajib dipilih.";
    setErrs(salah);
    if (Object.keys(salah).length) return fokusSalah(formRef.current);

    const fd = new FormData();
    if (form.file) fd.append("file", form.file);
    ["judul", "kategori", "nomor", "keterangan"].forEach((k) => fd.append(k, form[k].trim()));
    form.peran.forEach((p) => fd.append("peran[]", p));

    try {
      await api(form.id ? `/admin/aset/dokumen/${form.id}` : "/admin/aset/dokumen", { method: "POST", body: fd });
      toast.success(form.id ? "Dokumen diperbarui." : "Dokumen ditambahkan.");
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

  const lihat = async (d) => {
    try {
      await bukaLampiran(`/aset/dokumen/${d.id}/file`);
    } catch (e) {
      toast.error(e.message);
    }
  };

  const hapus = async (d) => {
    const ya = await confirm({
      title: "Hapus dokumen ini?",
      description: "Dokumen dihapus permanen dan tidak bisa dikembalikan.",
      items: [{ label: "Judul", value: d.judul }, { label: "Berkas", value: d.file_nama }],
      consequence: "File ikut terhapus dari server.",
      confirmText: "Hapus",
      tone: "danger",
      action: () => api(`/admin/aset/dokumen/${d.id}`, { method: "DELETE" }),
    });
    if (ya) {
      toast.success("Dokumen dihapus.");
      muat();
    }
  };

  return (
    <>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="max-w-xl text-sm text-slate-600">
          Dokumen hanya tampil bagi akun yang sudah masuk, sesuai peran yang Anda centang. Pengelola (admin dan staf TU
          dengan izin Aset) selalu dapat melihat semua dokumen.
        </p>
        <button
          type="button"
          onClick={() => bukaForm(kosong())}
          className="press inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2.5 text-sm font-semibold text-white hover:bg-primary-dark"
        >
          <PlusIcon className="h-5 w-5" /> Tambah Dokumen
        </button>
      </div>

      {error && (
        <div role="alert" className="mt-5 flex flex-wrap items-center justify-between gap-3 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          <span>{error}</span>
          <button type="button" onClick={muat} className="font-semibold underline">Coba lagi</button>
        </div>
      )}
      {loading && <DaftarBarisSkeleton n={4} className="mt-6" />}
      {!loading && !error && daftar.length === 0 && (
        <p className="mt-8 rounded-xl border border-dashed border-line bg-surface/60 px-4 py-10 text-center text-sm text-slate-500">
          Belum ada dokumen. Klik “Tambah Dokumen”.
        </p>
      )}

      <ul className="mt-6 space-y-3">
        {daftar.map((d) => (
          <li key={d.id} className="flex flex-wrap items-center gap-4 rounded-xl border border-line bg-white p-4 sm:flex-nowrap">
            <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-blue-50 text-primary">
              <DocumentTextIcon className="h-6 w-6" />
            </span>
            <div className="min-w-0 flex-1">
              <p className="font-semibold text-navy">{d.judul}</p>
              <p className="mt-0.5 text-xs text-slate-500">
                {[d.kategori, d.nomor && `No. ${d.nomor}`, `${d.file_nama} (${ukuran(d.file_ukuran)})`].filter(Boolean).join(" · ")}
              </p>
              <div className="mt-2 flex flex-wrap items-center gap-1.5 text-xs">
                <span className="text-slate-500">Dilihat oleh:</span>
                {d.peran.length === 0 ? (
                  <span className="rounded-full border border-orange-200 bg-orange-50 px-2.5 py-0.5 font-semibold text-orange-700">
                    Hanya pengelola
                  </span>
                ) : (
                  d.peran.map((p) => (
                    <span key={p} className="rounded-full border border-blue-200 bg-blue-50 px-2.5 py-0.5 font-semibold text-primary">
                      {NAMA_PERAN[p] || p}
                    </span>
                  ))
                )}
              </div>
            </div>
            <div className="flex items-center gap-1">
              <button type="button" aria-label={`Lihat ${d.judul}`} onClick={() => lihat(d)} className={ikonCls}>
                <EyeIcon className="h-5 w-5" />
              </button>
              <button
                type="button"
                aria-label={`Ubah ${d.judul}`}
                onClick={() => bukaForm({ id: d.id, judul: d.judul, kategori: d.kategori ?? "", nomor: d.nomor ?? "", keterangan: d.keterangan ?? "", peran: d.peran, file: null, fileNama: d.file_nama })}
                className={ikonCls}
              >
                <PencilSquareIcon className="h-5 w-5" />
              </button>
              <button type="button" aria-label={`Hapus ${d.judul}`} onClick={() => hapus(d)} className="rounded-lg p-2 text-slate-500 transition-colors hover:bg-red-50 hover:text-red-600">
                <TrashIcon className="h-5 w-5" />
              </button>
            </div>
          </li>
        ))}
      </ul>

      {form && (
        <Modal title={form.id ? "Ubah Dokumen" : "Tambah Dokumen"} onClose={tutupForm} locked={saving}>
          <form ref={formRef} onSubmit={simpan} noValidate className="space-y-4">
            <Field label="Judul dokumen" required error={errs.judul} hint="Contoh: IMB, NPSN, Sertifikat Hak Pakai, SK Tanah.">
              {(p) => <input {...p} value={form.judul} onChange={ubah("judul")} maxLength={150} className={`${inputCls(errs.judul)} h-11`} />}
            </Field>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Kategori" error={errs.kategori}>
                {(p) => (
                  <>
                    <input {...p} list="kategori-aset" value={form.kategori} onChange={ubah("kategori")} maxLength={60} className={`${inputCls(errs.kategori)} h-11`} />
                    <datalist id="kategori-aset">{KATEGORI.map((k) => <option key={k} value={k} />)}</datalist>
                  </>
                )}
              </Field>
              <Field label="Nomor dokumen" error={errs.nomor}>
                {(p) => <input {...p} value={form.nomor} onChange={ubah("nomor")} maxLength={100} className={`${inputCls(errs.nomor)} h-11`} />}
              </Field>
            </div>
            <Field label="Keterangan" error={errs.keterangan}>
              {(p) => <input {...p} value={form.keterangan} onChange={ubah("keterangan")} maxLength={255} className={`${inputCls(errs.keterangan)} h-11`} />}
            </Field>
            <Field
              label="File"
              required={!form.id}
              error={errs.file}
              hint={`PDF, JPG, atau PNG, maksimal ${MAX_MB} MB.${form.id ? ` File saat ini: ${form.fileNama}. Pilih file baru hanya bila ingin menggantinya.` : ""}`}
            >
              {(p) => (
                <input
                  {...p}
                  type="file"
                  accept="application/pdf,image/jpeg,image/png"
                  onChange={pilihFile}
                  className="block w-full text-sm file:mr-3 file:rounded-lg file:border file:border-line file:bg-white file:px-3 file:py-2 file:text-sm file:font-semibold file:text-navy"
                />
              )}
            </Field>

            <fieldset className="rounded-lg border border-line p-4">
              <legend className="px-1 text-sm font-semibold text-navy">Siapa yang boleh melihat</legend>
              <div className="space-y-2">
                {PERAN.map(([id, label]) => (
                  <label key={id} className="flex items-center gap-2 text-sm">
                    <input type="checkbox" checked={form.peran.includes(id)} onChange={() => togglePeran(id)} />
                    {label}
                  </label>
                ))}
              </div>
              <p className="mt-2 text-xs text-slate-500">
                Hanya akun yang sudah masuk. Tanpa centang = hanya pengelola yang dapat melihat.
              </p>
            </fieldset>

            <div className="flex justify-end gap-3 pt-2">
              <button type="button" onClick={tutupForm} disabled={saving} className="rounded-lg border border-line px-4 py-2.5 text-sm font-semibold text-navy transition-colors hover:bg-surface disabled:opacity-60">
                Batal
              </button>
              <button disabled={saving} className="press rounded-lg bg-primary px-5 py-2.5 text-sm font-semibold text-white hover:bg-primary-dark disabled:opacity-70">
                {saving ? "Menyimpan..." : "Simpan"}
              </button>
            </div>
          </form>
        </Modal>
      )}
    </>
  );
}

/* ===================== TAB INFO SEKOLAH ===================== */
const GRUP = [
  {
    judul: "Identitas dan status",
    kolom: [
      ["nama", "Nama sekolah", { wajib: true }],
      ["npsn", "NPSN", { wajib: true, angka: true, hint: "8 digit angka." }],
      ["status", "Status", { wajib: true, pilihan: ["Negeri", "Swasta"] }],
      ["jenjang", "Jenjang", { wajib: true }],
    ],
  },
  {
    judul: "Pendirian sekolah",
    kolom: [
      ["pendirian_mulai", "Mulai belajar-mengajar", { hint: "Contoh: 17 Juli 1990." }],
      ["pendirian_sk_nomor", "Nomor SK pendirian"],
      ["pendirian_sk_tanggal", "Tanggal SK pendirian", { hint: "Kosongkan bila belum diketahui." }],
    ],
  },
  {
    judul: "Akreditasi",
    kolom: [
      ["akreditasi_peringkat", "Peringkat", { pilihan: ["A", "B", "C", "Belum terakreditasi"] }],
      ["akreditasi_sk_nomor", "Nomor SK akreditasi"],
      ["akreditasi_tahun", "Tahun", { angka: true, hint: "4 digit, contoh 2021." }],
      ["akreditasi_berlaku_sampai", "Berlaku sampai", { hint: "Contoh: 8 Desember 2026." }],
      ["akreditasi_lembaga", "Lembaga akreditasi", { lebar: true }],
    ],
  },
  {
    judul: "Denah dan lokasi",
    kolom: [
      ["lokasi_alamat", "Alamat", { wajib: true, lebar: true }],
      [
        "lokasi_peta",
        "Lokasi di Google Maps",
        {
          wajib: true,
          lebar: true,
          hint: "Isi nama tempat dan alamat, atau tempel alamat dari Google Maps > Bagikan > Sematkan peta (hanya isi src=\"...\", diawali https://www.google.com/maps/embed).",
        },
      ],
    ],
  },
  {
    judul: "Sumber data",
    kolom: [
      ["sumber_label", "Nama sumber"],
      ["sumber_url", "Tautan sumber", { hint: "Diawali https://" }],
    ],
  },
];

function TabProfil() {
  const toast = useToast();
  const formRef = useRef(null);
  const { data, loading, error } = useFetch("/aset/profil");
  const [form, setForm] = useState(null);
  const [errs, setErrs] = useState({});

  useEffect(() => {
    if (data) setForm(Object.fromEntries(Object.entries(data).map(([k, v]) => [k, v ?? ""])));
  }, [data]);

  const ubah = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  const [simpan, saving] = useSubmit(async (e) => {
    e.preventDefault();
    setErrs({});
    try {
      const baru = await api("/admin/aset/profil", { method: "PUT", body: form });
      setForm(Object.fromEntries(Object.entries(baru).map(([k, v]) => [k, v ?? ""])));
      toast.success("Informasi sekolah disimpan.");
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

  if (loading || (!form && !error)) return <DaftarBarisSkeleton n={5} />;
  if (error) return <p role="alert" className="text-sm text-red-600">{error}</p>;

  return (
    <form ref={formRef} onSubmit={simpan} noValidate className="space-y-5">
      {GRUP.map((g) => (
        <fieldset key={g.judul} className="rounded-xl border border-line bg-white p-5">
          <legend className="px-1 text-sm font-bold text-navy">{g.judul}</legend>
          <div className="mt-2 grid gap-4 sm:grid-cols-2">
            {g.kolom.map(([k, label, o = {}]) => (
              <div key={k} className={o.lebar ? "sm:col-span-2" : ""}>
                <Field label={label} required={o.wajib} error={errs[k]} hint={o.hint}>
                  {(p) =>
                    o.pilihan ? (
                      <select {...p} value={form[k]} onChange={ubah(k)} className={`${inputCls(errs[k])} h-11 bg-white`}>
                        {!o.wajib && <option value="">(belum diisi)</option>}
                        {o.pilihan.map((x) => <option key={x} value={x}>{x}</option>)}
                      </select>
                    ) : (
                      <input {...p} value={form[k]} onChange={ubah(k)} inputMode={o.angka ? "numeric" : undefined} className={`${inputCls(errs[k])} h-11`} />
                    )
                  }
                </Field>
              </div>
            ))}
          </div>
        </fieldset>
      ))}
      <div className="flex justify-end">
        <button disabled={saving} className="press rounded-lg bg-primary px-6 py-2.5 text-sm font-semibold text-white hover:bg-primary-dark disabled:opacity-70">
          {saving ? "Menyimpan..." : "Simpan Info Sekolah"}
        </button>
      </div>
    </form>
  );
}

/* ===================== HALAMAN ===================== */
export default function KelolaAset() {
  const [tab, setTab] = useState("dokumen");
  return (
    <>
      <h1 className="text-2xl font-extrabold text-navy">Kelola Aset</h1>
      <p className="mt-1 text-sm text-slate-600">Dokumen aset sekolah dan informasi yang tampil di halaman Layanan → Aset.</p>

      <div role="tablist" className="mt-5 flex gap-1 border-b border-line">
        {[["dokumen", "Dokumen"], ["profil", "Info sekolah"]].map(([k, l]) => (
          <button
            key={k}
            type="button"
            role="tab"
            aria-selected={tab === k}
            onClick={() => setTab(k)}
            className={`-mb-px border-b-2 px-4 py-2.5 text-sm font-semibold transition-colors ${
              tab === k ? "border-primary text-primary" : "border-transparent text-slate-600 hover:text-navy"
            }`}
          >
            {l}
          </button>
        ))}
      </div>

      <div className="mt-6">{tab === "dokumen" ? <TabDokumen /> : <TabProfil />}</div>
    </>
  );
}