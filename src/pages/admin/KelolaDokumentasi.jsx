import { useCallback, useEffect, useRef, useState } from "react";
import { CameraIcon, PlusIcon, XMarkIcon } from "@heroicons/react/24/outline";
import { api } from "../../lib/api";
import { fotoSrc, kecilkanFoto } from "../../lib/foto";
import { useToast } from "../../context/Toast";
import { useConfirm } from "../../context/Confirm";
import { useSubmit } from "../../lib/useSubmit";
import { galatPerKolom, fokusSalah } from "../../lib/validasi";
import Field, { inputCls } from "../../components/Field";
import Modal from "../../components/Modal";

const KATEGORI = [
  ["kelas", "Ruang kelas"],
  ["ruang", "Ruang dan fasilitas fungsional"],
  ["area", "Area dan fasilitas"],
];
const NILAI = [
  ["baik", "Baik"],
  ["perhatian", "Perlu perhatian"],
  ["perbaikan", "Perlu perbaikan"],
];
const VISIBILITAS = [
  ["internal", "Hanya staf TU dan admin"],
  ["login", "Semua pengguna yang login"],
  ["publik", "Publik (semua pengunjung)"],
];
const WARNA = {
  baik: "border-green-200 bg-green-50 text-green-700",
  perhatian: "border-amber-200 bg-amber-50 text-amber-800",
  perbaikan: "border-red-200 bg-red-50 text-red-700",
};
const labelNilai = (v) => NILAI.find(([k]) => k === v)?.[1] ?? v;
const labelVis = (v) => VISIBILITAS.find(([k]) => k === v)?.[1] ?? v;

const hariIni = () => {
  const d = new Date();
  const p = (n) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`;
};

const aksiCls =
  "rounded-lg border border-line px-3 py-1.5 text-xs font-semibold text-navy transition-colors hover:bg-surface disabled:opacity-40";

function Lencana({ judul, nilai }) {
  return (
    <span className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-xs font-semibold ${WARNA[nilai]}`}>
      <span className="font-normal opacity-80">{judul}:</span> {labelNilai(nilai)}
    </span>
  );
}

/* ---------- Pilihan penilaian (3 tingkat) ---------- */
function PilihNilai({ judul, nilai, onUbah }) {
  return (
    <fieldset>
      <legend className="mb-2 text-sm font-semibold text-navy">{judul}</legend>
      <div className="grid gap-2 sm:grid-cols-3">
        {NILAI.map(([k, l]) => (
          <label
            key={k}
            className={`flex cursor-pointer items-center gap-2 rounded-lg border px-3 py-2 text-sm font-semibold ${
              nilai === k ? WARNA[k] : "border-line bg-white text-slate-700 hover:bg-surface"
            }`}
          >
            <input type="radio" name={judul} checked={nilai === k} onChange={() => onUbah(k)} className="h-4 w-4" />
            {l}
          </label>
        ))}
      </div>
    </fieldset>
  );
}

/* ---------- Formulir dokumentasi (tambah / ubah) ---------- */
function FormDokumentasi({ awal, lokasi, onBatal, onSelesai }) {
  const toast = useToast();
  const confirm = useConfirm();
  const formRef = useRef(null);
  const urlRef = useRef([]);
  const edit = Boolean(awal?.id);

  const [f, setF] = useState(() => ({
    lokasi: awal?.lokasi?.id ? String(awal.lokasi.id) : "",
    lokasi_baru: "",
    kategori: "kelas",
    tanggal: awal?.tanggal ?? hariIni(),
    kebersihan: awal?.kebersihan ?? "baik",
    keamanan: awal?.keamanan ?? "baik",
    kelayakan: awal?.kelayakan ?? "baik",
    catatan: awal?.catatan ?? "",
    visibilitas: awal?.visibilitas ?? "internal",
  }));
  const [ada, setAda] = useState(() => (awal?.foto ?? []).map((p) => ({ ...p })));
  const [baru, setBaru] = useState([]); // [{ key, file, url, ket }]
  const [errs, setErrs] = useState({});
  const [masalah, setMasalah] = useState([]);

  useEffect(() => () => urlRef.current.forEach((u) => URL.revokeObjectURL(u)), []);

  const ubah = (k) => (e) => setF((s) => ({ ...s, [k]: e.target.value }));

  const pilihFoto = (e) => {
    const dipilih = Array.from(e.target.files || []);
    e.target.value = "";
    const catatan = [];
    const lolos = [];
    for (const file of dipilih) {
      if (!["image/jpeg", "image/png"].includes(file.type)) {
        catatan.push(`${file.name}: hanya JPG atau PNG.`);
      } else if (file.size > 30 * 1024 * 1024) {
        catatan.push(`${file.name}: ukuran melebihi 30 MB.`);
      } else {
        const url = URL.createObjectURL(file);
        urlRef.current.push(url);
        lolos.push({ key: `${file.name}-${file.size}-${Math.random()}`, file, url, ket: "" });
      }
    }
    let gabung = [...baru, ...lolos];
    if (gabung.length > 10) {
      catatan.push("Maksimal 10 foto baru per simpan.");
      gabung = gabung.slice(0, 10);
    }
    if (ada.length + gabung.length > 20) {
      catatan.push("Satu dokumentasi maksimal 20 foto.");
      gabung = gabung.slice(0, Math.max(0, 20 - ada.length));
    }
    setBaru(gabung);
    setMasalah(catatan);
  };

  const hapusFotoAda = async (p) => {
    const ya = await confirm({
      title: "Hapus foto ini?",
      description: "Foto dihapus permanen dari server.",
      confirmText: "Hapus",
      tone: "danger",
      action: () => api(`/admin/dokumentasi/foto/${p.id}`, { method: "DELETE" }),
    });
    if (ya) setAda((l) => l.filter((x) => x.id !== p.id));
  };

  const [simpan, saving] = useSubmit(async (e) => {
    e.preventDefault();
    const salah = {};
    if (!edit) {
      if (!f.lokasi) salah.lokasi = "Pilih lokasi.";
      if (f.lokasi === "__baru" && f.lokasi_baru.trim().length < 2) salah.lokasi_baru = "Nama lokasi minimal 2 karakter.";
    }
    if (!f.tanggal) salah.tanggal = "Tanggal wajib diisi.";
    if (ada.length + baru.length === 0) salah.foto = "Unggah minimal satu foto.";
    setErrs(salah);
    if (Object.keys(salah).length) return fokusSalah(formRef.current);

    const fd = new FormData();
    if (!edit) {
      if (f.lokasi === "__baru") {
        fd.append("lokasi_baru", f.lokasi_baru.trim());
        fd.append("kategori", f.kategori);
      } else {
        fd.append("lokasi_id", f.lokasi);
      }
    }
    ["tanggal", "kebersihan", "keamanan", "kelayakan", "visibilitas"].forEach((k) => fd.append(k, f[k]));
    if (f.catatan.trim()) fd.append("catatan", f.catatan.trim());
    ada.forEach((p) => fd.append(`foto_ket[${p.id}]`, p.keterangan ?? ""));

    const kecil = await Promise.all(baru.map((b) => kecilkanFoto(b.file)));
    kecil.forEach((file, i) => {
      fd.append("foto[]", file);
      fd.append("keterangan[]", baru[i].ket.trim());
    });

    try {
      const res = await api(edit ? `/admin/dokumentasi/${awal.id}` : "/admin/dokumentasi", { method: "POST", body: fd });
      toast.success(edit ? "Dokumentasi diperbarui." : "Dokumentasi ditambahkan.");
      onSelesai(res);
    } catch (err) {
      if (err.status === 422 && err.errors) {
        setErrs(galatPerKolom(err.errors));
        fokusSalah(formRef.current);
      } else {
        toast.galat(err);
      }
    }
  });

  const errFoto = Object.entries(errs).find(([k]) => k === "foto" || k.startsWith("foto."))?.[1];

  return (
    <form ref={formRef} onSubmit={simpan} noValidate className="mx-auto max-w-[760px] space-y-8">
      <div>
        <button type="button" onClick={onBatal} className="text-sm font-semibold text-primary hover:underline">
          Kembali ke daftar
        </button>
        <h2 className="mt-2 text-2xl font-extrabold text-navy">{edit ? "Ubah Dokumentasi" : "Tambah Dokumentasi"}</h2>
      </div>

      <section className="space-y-5">
        <h3 className="text-lg font-bold text-navy">Lokasi dan tanggal</h3>

        {edit ? (
          <p className="rounded-lg bg-surface px-4 py-3 text-sm">
            Lokasi: <strong>{awal.lokasi?.nama}</strong> ({awal.lokasi?.kategori_label})
          </p>
        ) : (
          <>
            <Field label="Lokasi" required error={errs.lokasi || errs.lokasi_id}>
              {(p) => (
                <select {...p} value={f.lokasi} onChange={ubah("lokasi")} className={`${inputCls(errs.lokasi)} h-11`}>
                  <option value="">Pilih lokasi</option>
                  {KATEGORI.map(([id, label]) => {
                    const isi = lokasi.filter((l) => l.kategori === id && l.aktif);
                    return isi.length ? (
                      <optgroup key={id} label={label}>
                        {isi.map((l) => (
                          <option key={l.id} value={l.id}>{l.nama}</option>
                        ))}
                      </optgroup>
                    ) : null;
                  })}
                  <option value="__baru">+ Tambah lokasi baru...</option>
                </select>
              )}
            </Field>

            {f.lokasi === "__baru" && (
              <div className="grid gap-4 rounded-lg bg-surface p-4 sm:grid-cols-2">
                <Field label="Kategori lokasi baru" error={errs.kategori}>
                  {(p) => (
                    <select {...p} value={f.kategori} onChange={ubah("kategori")} className={`${inputCls(errs.kategori)} h-11`}>
                      {KATEGORI.map(([id, label]) => (
                        <option key={id} value={id}>{label}</option>
                      ))}
                    </select>
                  )}
                </Field>
                <Field label="Nama lokasi baru" required error={errs.lokasi_baru}>
                  {(p) => <input {...p} value={f.lokasi_baru} onChange={ubah("lokasi_baru")} placeholder="mis. XI IPA 2" className={`${inputCls(errs.lokasi_baru)} h-11`} />}
                </Field>
              </div>
            )}
          </>
        )}

        <Field label="Tanggal dokumentasi" required error={errs.tanggal}>
          {(p) => <input {...p} type="date" value={f.tanggal} onChange={ubah("tanggal")} className={`${inputCls(errs.tanggal)} h-11`} />}
        </Field>
      </section>

      <section className="space-y-5">
        <h3 className="text-lg font-bold text-navy">Penilaian kondisi</h3>
        <PilihNilai judul="Kebersihan" nilai={f.kebersihan} onUbah={(v) => setF((s) => ({ ...s, kebersihan: v }))} />
        <PilihNilai judul="Keamanan" nilai={f.keamanan} onUbah={(v) => setF((s) => ({ ...s, keamanan: v }))} />
        <PilihNilai judul="Kelayakan fasilitas" nilai={f.kelayakan} onUbah={(v) => setF((s) => ({ ...s, kelayakan: v }))} />
        <Field label="Catatan" error={errs.catatan} hint="Hal yang perlu diketahui: kerusakan, tindak lanjut, dan sebagainya.">
          {(p) => <textarea {...p} rows={4} value={f.catatan} onChange={ubah("catatan")} className={`${inputCls(errs.catatan)} py-2`} />}
        </Field>
      </section>

      <section className="space-y-4">
        <h3 className="text-lg font-bold text-navy">Foto</h3>
        <p className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
          Ambil foto tanpa memperlihatkan wajah siswa atau data pribadi dengan jelas. Foto yang dipilih
          <strong> Publik </strong>dapat dilihat siapa saja.
        </p>

        {ada.length > 0 && (
          <ul className="grid gap-3 sm:grid-cols-2">
            {ada.map((p) => (
              <li key={p.id} className="flex gap-3 rounded-lg border border-line bg-white p-3">
                <img src={fotoSrc(p.kecil)} alt="" className="h-20 w-20 shrink-0 rounded object-cover" />
                <div className="min-w-0 flex-1">
                  <input
                    value={p.keterangan ?? ""}
                    onChange={(e) => setAda((l) => l.map((x) => (x.id === p.id ? { ...x, keterangan: e.target.value } : x)))}
                    aria-label="Keterangan foto"
                    placeholder="Keterangan foto"
                    maxLength={200}
                    className="h-10 w-full rounded-lg border border-line px-3 text-sm"
                  />
                  <button type="button" onClick={() => hapusFotoAda(p)} className="mt-2 text-xs font-semibold text-red-600 hover:underline">
                    Hapus foto
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}

        {baru.length > 0 && (
          <ul className="grid gap-3 sm:grid-cols-2">
            {baru.map((b) => (
              <li key={b.key} className="flex gap-3 rounded-lg border border-primary/40 bg-white p-3">
                <img src={b.url} alt="" className="h-20 w-20 shrink-0 rounded object-cover" />
                <div className="min-w-0 flex-1">
                  <input
                    value={b.ket}
                    onChange={(e) => setBaru((l) => l.map((x) => (x.key === b.key ? { ...x, ket: e.target.value } : x)))}
                    aria-label="Keterangan foto baru"
                    placeholder="Keterangan foto"
                    maxLength={200}
                    className="h-10 w-full rounded-lg border border-line px-3 text-sm"
                  />
                  <button
                    type="button"
                    onClick={() => setBaru((l) => l.filter((x) => x.key !== b.key))}
                    className="mt-2 inline-flex items-center gap-1 text-xs font-semibold text-red-600 hover:underline"
                  >
                    <XMarkIcon className="h-4 w-4" /> Batal
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}

        <label className="inline-flex cursor-pointer items-center gap-2 rounded-lg border border-line bg-white px-4 py-2.5 text-sm font-semibold text-navy hover:bg-surface">
          <CameraIcon className="h-5 w-5" /> Pilih foto
          <input type="file" multiple accept="image/jpeg,image/png" onChange={pilihFoto} className="sr-only" />
        </label>
        {masalah.map((m) => <p key={m} role="alert" className="text-sm font-medium text-red-600">{m}</p>)}
        {errFoto && <p role="alert" className="text-sm font-medium text-red-600">{errFoto}</p>}
      </section>

      <section>
        <Field label="Siapa yang boleh melihat dokumentasi ini?" error={errs.visibilitas}>
          {(p) => (
            <select {...p} value={f.visibilitas} onChange={ubah("visibilitas")} className={`${inputCls(errs.visibilitas)} h-11`}>
              {VISIBILITAS.map(([k, l]) => (
                <option key={k} value={k}>{l}</option>
              ))}
            </select>
          )}
        </Field>
      </section>

      <div className="flex gap-3">
        <button type="button" onClick={onBatal} disabled={saving} className="rounded-lg border border-line px-5 py-2.5 text-sm font-semibold text-navy hover:bg-surface disabled:opacity-60">
          Batal
        </button>
        <button disabled={saving} className="rounded-lg bg-primary px-6 py-2.5 text-sm font-semibold text-white hover:bg-primary-dark disabled:opacity-70">
          {saving ? "Menyimpan dan mengunggah..." : "Simpan"}
        </button>
      </div>
    </form>
  );
}

/* ---------- Tab Dokumentasi ---------- */
function TabDokumentasi() {
  const toast = useToast();
  const confirm = useConfirm();
  const [hasil, setHasil] = useState(null);
  const [lokasi, setLokasi] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [page, setPage] = useState(1);
  const [kategori, setKategori] = useState("");
  const [vis, setVis] = useState("");
  const [form, setForm] = useState(null); // null = daftar, objek = formulir

  const muat = useCallback(async () => {
    setLoading(true);
    try {
      const qs = new URLSearchParams({ page });
      if (kategori) qs.set("kategori", kategori);
      if (vis) qs.set("visibilitas", vis);
      const [d, l] = await Promise.all([api(`/admin/dokumentasi?${qs}`), api("/admin/dokumentasi/lokasi")]);
      setHasil(d);
      setLokasi(l);
      setError("");
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, [page, kategori, vis]);

  useEffect(() => { muat(); }, [muat]);

  const hapus = async (d) => {
    const ya = await confirm({
      title: "Hapus dokumentasi ini?",
      description: "Seluruh foto di dalamnya ikut dihapus permanen.",
      items: [
        { label: "Lokasi", value: d.lokasi?.nama ?? "-" },
        { label: "Tanggal", value: d.tanggal_tampil },
        { label: "Jumlah foto", value: String(d.jumlah_foto) },
      ],
      confirmText: "Hapus",
      tone: "danger",
      action: () => api(`/admin/dokumentasi/${d.id}`, { method: "DELETE" }),
    });
    if (ya) {
      toast.success("Dokumentasi dihapus.");
      muat();
    }
  };

  if (form) {
    return (
      <FormDokumentasi
        awal={form.id ? form : null}
        lokasi={lokasi}
        onBatal={() => setForm(null)}
        onSelesai={() => { setForm(null); muat(); }}
      />
    );
  }

  const baris = hasil?.data ?? [];
  const terakhir = hasil?.last_page ?? 1;

  return (
    <>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap gap-3">
          <select value={kategori} onChange={(e) => { setKategori(e.target.value); setPage(1); }} aria-label="Filter kategori" className="h-11 rounded-lg border border-line px-3 text-sm">
            <option value="">Semua kategori</option>
            {KATEGORI.map(([k, l]) => <option key={k} value={k}>{l}</option>)}
          </select>
          <select value={vis} onChange={(e) => { setVis(e.target.value); setPage(1); }} aria-label="Filter visibilitas" className="h-11 rounded-lg border border-line px-3 text-sm">
            <option value="">Semua visibilitas</option>
            {VISIBILITAS.map(([k, l]) => <option key={k} value={k}>{l}</option>)}
          </select>
        </div>
        <button
          type="button"
          onClick={() => setForm({})}
          className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2.5 text-sm font-semibold text-white hover:bg-primary-dark active:scale-[0.98]"
        >
          <PlusIcon className="h-5 w-5" /> Tambah Dokumentasi
        </button>
      </div>

      {error && (
        <div role="alert" className="mt-5 flex flex-wrap items-center justify-between gap-3 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          <span>{error}</span>
          <button type="button" onClick={muat} className="font-semibold underline">Coba lagi</button>
        </div>
      )}

      <ul className="mt-5 divide-y divide-line rounded-xl border border-line bg-white">
        {loading && <li className="px-4 py-10 text-center text-sm text-slate-500">Memuat data...</li>}
        {!loading && !error && baris.length === 0 && (
          <li className="px-4 py-10 text-center text-sm text-slate-500">Belum ada dokumentasi. Klik "Tambah Dokumentasi".</li>
        )}
        {baris.map((d) => (
          <li key={d.id} className="flex flex-col gap-4 p-4 sm:flex-row">
            <div className="flex shrink-0 gap-1.5">
              {d.foto.slice(0, 3).map((p) => (
                <img key={p.id} src={fotoSrc(p.kecil)} alt="" loading="lazy" className="h-20 w-20 rounded object-cover" />
              ))}
              {d.jumlah_foto > 3 && (
                <span className="flex h-20 w-12 items-center justify-center rounded bg-surface text-xs font-semibold text-slate-600">
                  +{d.jumlah_foto - 3}
                </span>
              )}
            </div>
            <div className="min-w-0 flex-1">
              <p className="font-semibold text-navy">
                {d.lokasi?.nama} <span className="font-normal text-slate-500">· {d.lokasi?.kategori_label}</span>
              </p>
              <p className="text-sm text-slate-600">
                {d.tanggal_tampil} · {labelVis(d.visibilitas)} · {d.jumlah_foto} foto
                {d.oleh ? ` · oleh ${d.oleh}` : ""}
              </p>
              <div className="mt-2 flex flex-wrap gap-1.5">
                <Lencana judul="Kebersihan" nilai={d.kebersihan} />
                <Lencana judul="Keamanan" nilai={d.keamanan} />
                <Lencana judul="Kelayakan" nilai={d.kelayakan} />
              </div>
              {d.catatan && <p className="mt-2 line-clamp-2 text-sm text-slate-600">{d.catatan}</p>}
            </div>
            <div className="flex shrink-0 gap-2 sm:flex-col">
              <button type="button" className={aksiCls} onClick={() => setForm(d)}>Ubah</button>
              <button type="button" className={`${aksiCls} text-red-600`} onClick={() => hapus(d)}>Hapus</button>
            </div>
          </li>
        ))}
      </ul>

      <div className="mt-4 flex items-center justify-between text-sm">
        <button type="button" disabled={page <= 1 || loading} onClick={() => setPage((p) => p - 1)} className="rounded-lg border border-line bg-white px-4 py-2 font-semibold text-navy disabled:opacity-50">
          Sebelumnya
        </button>
        <span className="text-slate-600">Halaman {page} dari {terakhir}</span>
        <button type="button" disabled={page >= terakhir || loading} onClick={() => setPage((p) => p + 1)} className="rounded-lg border border-line bg-white px-4 py-2 font-semibold text-navy disabled:opacity-50">
          Berikutnya
        </button>
      </div>
    </>
  );
}

/* ---------- Tab Lokasi ---------- */
const lokasiKosong = () => ({ id: null, kategori: "kelas", nama: "", keterangan: "", aktif: true });

function TabLokasi() {
  const toast = useToast();
  const confirm = useConfirm();
  const formRef = useRef(null);
  const [daftar, setDaftar] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [kategori, setKategori] = useState("");
  const [cari, setCari] = useState("");
  const [form, setForm] = useState(null);
  const [errs, setErrs] = useState({});

  const muat = useCallback(async () => {
    setLoading(true);
    try {
      const qs = new URLSearchParams();
      if (kategori) qs.set("kategori", kategori);
      if (cari.trim()) qs.set("cari", cari.trim());
      setDaftar(await api(`/admin/dokumentasi/lokasi?${qs}`));
      setError("");
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, [kategori, cari]);

  useEffect(() => { muat(); }, [muat]);

  const [simpan, saving] = useSubmit(async (e) => {
    e.preventDefault();
    const salah = {};
    if (form.nama.trim().length < 2) salah.nama = "Nama lokasi minimal 2 karakter.";
    setErrs(salah);
    if (Object.keys(salah).length) return fokusSalah(formRef.current);

    const body = { nama: form.nama.trim(), keterangan: form.keterangan.trim(), aktif: form.aktif };
    try {
      if (form.id) await api(`/admin/dokumentasi/lokasi/${form.id}`, { method: "PUT", body });
      else await api("/admin/dokumentasi/lokasi", { method: "POST", body: { ...body, kategori: form.kategori } });
      toast.success(form.id ? "Lokasi diperbarui." : "Lokasi ditambahkan.");
      setForm(null);
      setErrs({});
      muat();
    } catch (err) {
      if (err.status === 422 && err.errors) {
        setErrs(galatPerKolom(err.errors));
        fokusSalah(formRef.current);
      } else {
        toast.galat(err);
      }
    }
  });

  const hapus = async (l) => {
    const ya = await confirm({
      title: "Hapus lokasi ini?",
      description: "Lokasi yang sudah punya dokumentasi tidak bisa dihapus (nonaktifkan saja).",
      items: [{ label: "Lokasi", value: l.nama }],
      confirmText: "Hapus",
      tone: "danger",
      action: () => api(`/admin/dokumentasi/lokasi/${l.id}`, { method: "DELETE" }),
    });
    if (ya) {
      toast.success("Lokasi dihapus.");
      muat();
    }
  };

  const tutup = () => { if (!saving) { setForm(null); setErrs({}); } };

  return (
    <>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap gap-3">
          <select value={kategori} onChange={(e) => setKategori(e.target.value)} aria-label="Filter kategori" className="h-11 rounded-lg border border-line px-3 text-sm">
            <option value="">Semua kategori</option>
            {KATEGORI.map(([k, l]) => <option key={k} value={k}>{l}</option>)}
          </select>
          <input value={cari} onChange={(e) => setCari(e.target.value)} placeholder="Cari lokasi" aria-label="Cari lokasi" className="h-11 rounded-lg border border-line px-3 text-sm" />
        </div>
        <button type="button" onClick={() => { setErrs({}); setForm(lokasiKosong()); }} className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2.5 text-sm font-semibold text-white hover:bg-primary-dark">
          <PlusIcon className="h-5 w-5" /> Tambah Lokasi
        </button>
      </div>

      {error && <p role="alert" className="mt-5 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</p>}

      <div className="mt-5 overflow-x-auto rounded-xl border border-line bg-white">
        <table className="w-full min-w-[640px] text-left text-sm">
          <thead className="bg-surface text-xs uppercase tracking-wide text-slate-500">
            <tr>
              <th className="px-4 py-3">Lokasi</th>
              <th className="px-4 py-3">Kategori</th>
              <th className="px-4 py-3">Dokumentasi</th>
              <th className="px-4 py-3">Terakhir</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3 text-right">Aksi</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-line">
            {loading && <tr><td colSpan={6} className="px-4 py-10 text-center text-slate-500">Memuat data...</td></tr>}
            {!loading && !error && daftar.length === 0 && <tr><td colSpan={6} className="px-4 py-10 text-center text-slate-500">Belum ada lokasi.</td></tr>}
            {daftar.map((l) => (
              <tr key={l.id}>
                <td className="px-4 py-3 font-semibold text-navy">{l.nama}</td>
                <td className="px-4 py-3">{l.kategori_label}</td>
                <td className="px-4 py-3">{l.jumlah}</td>
                <td className="px-4 py-3 text-slate-500">{l.terakhir ?? "-"}</td>
                <td className="px-4 py-3">
                  <span className={`rounded-full border px-2.5 py-0.5 text-xs font-semibold ${l.aktif ? "border-green-200 bg-green-50 text-green-700" : "border-slate-200 bg-slate-50 text-slate-600"}`}>
                    {l.aktif ? "Aktif" : "Nonaktif"}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <div className="flex justify-end gap-2">
                    <button type="button" className={aksiCls} onClick={() => { setErrs({}); setForm({ id: l.id, kategori: l.kategori, nama: l.nama, keterangan: l.keterangan ?? "", aktif: l.aktif }); }}>Ubah</button>
                    <button type="button" className={`${aksiCls} text-red-600`} onClick={() => hapus(l)}>Hapus</button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {form && (
        <Modal title={form.id ? "Ubah Lokasi" : "Tambah Lokasi"} onClose={tutup} locked={saving}>
          <form ref={formRef} onSubmit={simpan} noValidate className="space-y-4">
            <Field label="Kategori" error={errs.kategori} hint={form.id ? "Kategori tidak bisa diubah." : undefined}>
              {(p) => (
                <select {...p} value={form.kategori} disabled={!!form.id} onChange={(e) => setForm((s) => ({ ...s, kategori: e.target.value }))} className={`${inputCls(errs.kategori)} h-11 disabled:bg-surface`}>
                  {KATEGORI.map(([k, l]) => <option key={k} value={k}>{l}</option>)}
                </select>
              )}
            </Field>
            <Field label="Nama lokasi" required error={errs.nama}>
              {(p) => <input {...p} value={form.nama} onChange={(e) => setForm((s) => ({ ...s, nama: e.target.value }))} placeholder="mis. Perpustakaan" className={`${inputCls(errs.nama)} h-11`} />}
            </Field>
            <Field label="Keterangan (opsional)" error={errs.keterangan}>
              {(p) => <input {...p} value={form.keterangan} onChange={(e) => setForm((s) => ({ ...s, keterangan: e.target.value }))} className={`${inputCls(errs.keterangan)} h-11`} />}
            </Field>
            {form.id && (
              <label className="flex items-center gap-2 text-sm">
                <input type="checkbox" checked={form.aktif} onChange={(e) => setForm((s) => ({ ...s, aktif: e.target.checked }))} />
                Aktif (tampil di pilihan lokasi dan galeri)
              </label>
            )}
            <div className="flex justify-end gap-3 pt-2">
              <button type="button" onClick={tutup} disabled={saving} className="rounded-lg border border-line px-4 py-2.5 text-sm font-semibold text-navy hover:bg-surface disabled:opacity-60">Batal</button>
              <button disabled={saving} className="rounded-lg bg-primary px-5 py-2.5 text-sm font-semibold text-white hover:bg-primary-dark disabled:opacity-70">
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
export default function KelolaDokumentasi() {
  const [tab, setTab] = useState("dokumentasi");

  return (
    <>
      <h1 className="text-2xl font-extrabold text-navy">Dokumentasi Fasilitas</h1>
      <p className="mt-1 text-sm text-slate-600">
        Foto kondisi kebersihan, keamanan, dan kelayakan fasilitas sekolah.
      </p>

      <div role="tablist" className="mt-5 flex gap-2 border-b border-line">
        {[["dokumentasi", "Dokumentasi"], ["lokasi", "Lokasi"]].map(([id, label]) => (
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

      <div className="mt-6">{tab === "dokumentasi" ? <TabDokumentasi /> : <TabLokasi />}</div>
    </>
  );
}
