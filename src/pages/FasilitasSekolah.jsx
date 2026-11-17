import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { CameraIcon, ChevronLeftIcon, ChevronRightIcon, Cog6ToothIcon, XMarkIcon } from "@heroicons/react/24/outline";
import { api, useFetch, DEMO } from "../lib/api";
import { fotoSrc } from "../lib/foto";
import { useApp } from "../context/AppState";
import ServiceIcon from "../components/ServiceIcon";
import Reveal from "../components/Reveal";
import { Skeleton } from "../components/Skeleton";

const NILAI = { baik: "Baik", perhatian: "Perlu perhatian", perbaikan: "Perlu perbaikan" };
const WARNA = {
  baik: "border-green-200 bg-green-50 text-green-700",
  perhatian: "border-amber-200 bg-amber-50 text-amber-800",
  perbaikan: "border-red-200 bg-red-50 text-red-700",
};
const VIS = { internal: "Hanya staf", login: "Pengguna login" };
const aksiCls =
  "press inline-flex items-center gap-1.5 rounded-lg border border-line px-3 py-1.5 text-xs font-semibold text-navy hover:bg-blue-50";

function Lencana({ judul, nilai }) {
  return (
    <span className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-xs font-semibold ${WARNA[nilai] || WARNA.baik}`}>
      <span className="font-normal opacity-80">{judul}:</span> {NILAI[nilai] || nilai}
    </span>
  );
}

// Foto dengan cadangan bila gagal dimuat (mis. alamat foto bertanda tangan sudah lewat 30 menit).
function Foto({ src, alt = "", className = "" }) {
  const [gagal, setGagal] = useState(false);
  if (!src || gagal) {
    return (
      <div className={`flex flex-col items-center justify-center gap-1 bg-slate-100 px-2 text-center text-xs text-slate-500 ${className}`}>
        <CameraIcon className="h-6 w-6" />
        <span>Foto tidak tersedia. Muat ulang halaman.</span>
      </div>
    );
  }
  return <img src={fotoSrc(src)} alt={alt} loading="lazy" onError={() => setGagal(true)} className={className} />;
}

// Kotak dialog sederhana: Esc dan klik di luar untuk menutup, fokus kembali ke tombol asal.
function Overlay({ judul, onClose, escAktif = true, z = "z-[70]", lebar = "max-w-2xl", children }) {
  const tutupRef = useRef(null);

  useEffect(() => {
    const awal = document.activeElement;
    const kunci = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    tutupRef.current?.focus();
    return () => {
      document.body.style.overflow = kunci;
      awal?.focus?.();
    };
  }, []);

  useEffect(() => {
    if (!escAktif) return undefined;
    const h = (e) => e.key === "Escape" && onClose();
    document.addEventListener("keydown", h);
    return () => document.removeEventListener("keydown", h);
  }, [escAktif, onClose]);

  return (
    <div
      className={`fixed inset-0 ${z} flex items-end justify-center bg-black/60 sm:items-center sm:p-4`}
      onMouseDown={(e) => e.target === e.currentTarget && onClose()}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-label={judul}
        className={`flex max-h-[92vh] w-full ${lebar} flex-col overflow-hidden rounded-t-2xl bg-white sm:rounded-2xl`}
      >
        <div className="flex items-center justify-between gap-3 border-b border-line px-5 py-3">
          <h2 className="min-w-0 truncate text-base font-bold text-navy">{judul}</h2>
          <button ref={tutupRef} type="button" aria-label="Tutup" onClick={onClose} className="rounded-lg p-1.5 text-slate-500 hover:bg-surface">
            <XMarkIcon className="h-5 w-5" />
          </button>
        </div>
        <div className="min-h-0 flex-1 overflow-y-auto">{children}</div>
      </div>
    </div>
  );
}

function Lightbox({ fotos, index, onClose, onGanti }) {
  const f = fotos[index];

  useEffect(() => {
    const h = (e) => {
      if (e.key === "ArrowRight") onGanti(1);
      if (e.key === "ArrowLeft") onGanti(-1);
    };
    document.addEventListener("keydown", h);
    return () => document.removeEventListener("keydown", h);
  }, [onGanti]);

  const panah = "absolute top-1/2 -translate-y-1/2 rounded-full bg-black/45 p-2 text-white hover:bg-black/65";

  return (
    <Overlay judul={`Foto ${index + 1} dari ${fotos.length}`} onClose={onClose} z="z-[80]" lebar="max-w-4xl">
      <div className="relative flex min-h-[240px] items-center justify-center bg-black">
        <Foto src={f.besar} alt={f.keterangan || "Foto dokumentasi"} className="max-h-[70vh] min-h-[240px] w-full object-contain" />
        {fotos.length > 1 && (
          <>
            <button type="button" aria-label="Foto sebelumnya" onClick={() => onGanti(-1)} className={`${panah} left-2`}>
              <ChevronLeftIcon className="h-6 w-6" />
            </button>
            <button type="button" aria-label="Foto berikutnya" onClick={() => onGanti(1)} className={`${panah} right-2`}>
              <ChevronRightIcon className="h-6 w-6" />
            </button>
          </>
        )}
      </div>
      {f.keterangan && <p className="px-5 py-3 text-sm text-slate-700">{f.keterangan}</p>}
    </Overlay>
  );
}

function RiwayatLokasi({ lokasi, onClose }) {
  const [halaman, setHalaman] = useState(1);
  const [items, setItems] = useState([]);
  const [terakhir, setTerakhir] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [lb, setLb] = useState(null); // { fotos, index }

  useEffect(() => {
    let batal = false;
    setLoading(true);
    api(`/fasilitas/lokasi/${lokasi.id}?page=${halaman}`)
      .then((r) => {
        if (batal) return;
        setItems((prev) => (halaman === 1 ? r.riwayat.data : [...prev, ...r.riwayat.data]));
        setTerakhir(r.riwayat.last_page);
        setError("");
      })
      .catch((e) => !batal && setError(e.message))
      .finally(() => !batal && setLoading(false));
    return () => { batal = true; };
  }, [lokasi.id, halaman]);

  return (
    <>
      <Overlay judul={`Riwayat: ${lokasi.nama}`} onClose={onClose} escAktif={!lb}>
        <div className="space-y-6 p-5">
          {error && <p role="alert" className="text-sm text-red-600">{error}</p>}
          {!loading && !error && items.length === 0 && <p className="text-sm text-slate-500">Belum ada dokumentasi.</p>}

          {items.map((d) => (
            <article key={d.id} className="border-b border-line pb-6 last:border-0 last:pb-0">
              <div className="flex flex-wrap items-center gap-2">
                <h3 className="font-bold text-navy">{d.tanggal_tampil}</h3>
                {VIS[d.visibilitas] && (
                  <span className="rounded-full border border-slate-200 bg-slate-50 px-2 py-0.5 text-xs font-semibold text-slate-600">
                    {VIS[d.visibilitas]}
                  </span>
                )}
              </div>
              <div className="mt-2 flex flex-wrap gap-1.5">
                <Lencana judul="Kebersihan" nilai={d.kebersihan} />
                <Lencana judul="Keamanan" nilai={d.keamanan} />
                <Lencana judul="Kelayakan" nilai={d.kelayakan} />
              </div>
              {d.catatan && <p className="mt-3 whitespace-pre-line text-sm leading-6 text-slate-700">{d.catatan}</p>}
              <ul className="mt-3 grid grid-cols-3 gap-2 sm:grid-cols-4">
                {d.foto.map((f, i) => (
                  <li key={f.id}>
                    <button
                      type="button"
                      aria-label={f.keterangan ? `Perbesar foto: ${f.keterangan}` : `Perbesar foto ${i + 1}`}
                      onClick={() => setLb({ fotos: d.foto, index: i })}
                      className="block aspect-square w-full overflow-hidden rounded-lg bg-slate-100"
                    >
                      <Foto src={f.kecil} className="h-full w-full object-cover" />
                    </button>
                  </li>
                ))}
              </ul>
            </article>
          ))}

          {loading && <Skeleton className="h-32 w-full" />}
          {!loading && halaman < terakhir && (
            <button type="button" onClick={() => setHalaman((h) => h + 1)} className={`${aksiCls} mx-auto`}>
              Muat riwayat sebelumnya
            </button>
          )}
        </div>
      </Overlay>

      {lb && (
        <Lightbox
          fotos={lb.fotos}
          index={lb.index}
          onClose={() => setLb(null)}
          onGanti={(arah) => setLb((s) => s && { ...s, index: (s.index + arah + s.fotos.length) % s.fotos.length })}
        />
      )}
    </>
  );
}

function KartuLokasi({ lokasi, onBuka }) {
  const t = lokasi.terbaru;
  return (
    <button
      type="button"
      onClick={() => onBuka(lokasi)}
      className="card-hover group flex h-full w-full flex-col overflow-hidden rounded-xl border border-line bg-white text-left"
    >
      <div className="relative aspect-[4/3] overflow-hidden bg-slate-100">
        <Foto src={t.foto[0]?.kecil} className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105" />
        {t.jumlah_foto > 1 && (
          <span className="absolute right-2 top-2 rounded-full bg-black/60 px-2 py-0.5 text-xs font-semibold text-white">
            {t.jumlah_foto} foto
          </span>
        )}
        {VIS[t.visibilitas] && (
          <span className="absolute left-2 top-2 rounded-full bg-white/90 px-2 py-0.5 text-xs font-semibold text-slate-700">
            {VIS[t.visibilitas]}
          </span>
        )}
      </div>
      <div className="flex flex-1 flex-col p-4">
        <p className="font-bold text-navy">{lokasi.nama}</p>
        <p className="text-xs text-slate-500">Diperbarui {t.tanggal_tampil}</p>
        <div className="mt-3 flex flex-wrap gap-1.5">
          <Lencana judul="Kebersihan" nilai={t.kebersihan} />
          <Lencana judul="Keamanan" nilai={t.keamanan} />
          <Lencana judul="Kelayakan" nilai={t.kelayakan} />
        </div>
        <span className="mt-auto pt-3 text-sm font-semibold text-primary">Lihat riwayat</span>
      </div>
    </button>
  );
}

export default function FasilitasSekolah() {
  const { user } = useApp();
  const { data, loading, error } = useFetch(DEMO ? null : "/fasilitas");
  const [kat, setKat] = useState("");
  const [buka, setBuka] = useState(null);
  const bisaKelola = (user?.izin || []).includes("dokumentasi");

  const semua = (data?.kategori ?? []).filter((k) => k.lokasi.length > 0);
  const tampil = semua.filter((k) => !kat || k.id === kat);

  return (
    <div className="mx-auto max-w-[1100px] px-5 py-14 sm:px-8">
      <nav className="text-xs text-slate-500">
        <Link to="/" className="hover:text-primary">Beranda</Link> /{" "}
        <Link to="/layanan" className="hover:text-primary">Layanan</Link> / Kebersihan & Keamanan
      </nav>

      <div className="mt-4 flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <span className="flex h-14 w-14 items-center justify-center rounded-xl bg-blue-50 text-primary">
            <ServiceIcon slug="kebersihan-keamanan" className="h-7 w-7" />
          </span>
          <div>
            <h1 className="text-3xl font-extrabold text-navy">Kebersihan & Keamanan</h1>
            <p className="mt-0.5 text-sm text-slate-600">
              Dokumentasi kondisi kebersihan, keamanan, dan kelayakan fasilitas sekolah.
            </p>
          </div>
        </div>
        {bisaKelola && (
          <Link to="/tu/dokumentasi" className={aksiCls}>
            <Cog6ToothIcon className="h-4 w-4" /> Kelola dokumentasi
          </Link>
        )}
      </div>

      {!user && !DEMO && (
        <p className="mt-6 rounded-lg border border-line bg-surface px-4 py-3 text-sm text-slate-700">
          Sebagian dokumentasi hanya tampil untuk pengguna yang sudah masuk.{" "}
          <Link to="/login" state={{ from: "/layanan/kebersihan-keamanan" }} className="font-semibold text-primary hover:underline">
            Masuk
          </Link>
        </p>
      )}

      {DEMO && <p className="mt-8 text-sm text-slate-500">Mode demo: dokumentasi membutuhkan backend (Laravel).</p>}
      {error && <p role="alert" className="mt-8 text-sm text-red-600">{error}</p>}

      {loading && (
        <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {[0, 1, 2].map((i) => <Skeleton key={i} className="h-72 w-full" />)}
        </div>
      )}

      {!loading && !error && !DEMO && semua.length === 0 && (
        <p className="mt-10 rounded-xl border border-dashed border-line bg-surface/60 px-4 py-12 text-center text-sm text-slate-500">
          Belum ada dokumentasi yang dapat ditampilkan.
        </p>
      )}

      {semua.length > 1 && (
        <div role="group" aria-label="Filter kategori" className="mt-8 flex flex-wrap gap-2">
          {[{ id: "", label: "Semua" }, ...semua].map((k) => (
            <button
              key={k.id || "semua"}
              type="button"
              aria-pressed={kat === k.id}
              onClick={() => setKat(k.id)}
              className={`rounded-full border px-4 py-1.5 text-sm font-semibold transition-colors ${
                kat === k.id ? "border-primary bg-primary text-white" : "border-line bg-white text-navy hover:bg-blue-50"
              }`}
            >
              {k.label}
            </button>
          ))}
        </div>
      )}

      {tampil.map((k) => (
        <section key={k.id} className="mt-10">
          <h2 className="text-xl font-bold text-navy">{k.label}</h2>
          <div className="mt-4 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {k.lokasi.map((l, i) => (
              <Reveal key={l.id} delay={Math.min(i, 5) * 70}>
                <KartuLokasi lokasi={l} onBuka={setBuka} />
              </Reveal>
            ))}
          </div>
        </section>
      ))}

      {buka && <RiwayatLokasi lokasi={buka} onClose={() => setBuka(null)} />}
    </div>
  );
}