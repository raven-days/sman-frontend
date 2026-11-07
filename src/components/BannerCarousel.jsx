import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { ChevronLeftIcon, ChevronRightIcon } from "@heroicons/react/24/outline";
import { kurangGerak } from "./Reveal";

const JEDA_OTOMATIS = 5000; // geser otomatis tiap 5 detik
const JEDA_UTAMA = 7000; // slide utama (teks) ditahan lebih lama supaya sempat dibaca
const JEDA_SETELAH_SENTUH = 4000; // lanjut lagi 4 detik setelah jari diangkat
const AMBANG_GESER = 40; // px minimal agar dihitung geseran

function Tombol({ item, aktif }) {
  if (!item.link) return null;
  const kelas =
    "press mt-4 inline-flex items-center rounded-lg bg-white px-5 py-2.5 text-sm font-semibold text-navy shadow-sm hover:bg-blue-50 sm:mt-6 sm:px-6 sm:py-3";
  const label = item.tombol || "Selengkapnya";
  const tab = aktif ? 0 : -1;
  return item.link.startsWith("/") ? (
    <Link to={item.link} tabIndex={tab} className={kelas}>{label}</Link>
  ) : (
    <a href={item.link} target="_blank" rel="noopener noreferrer" tabIndex={tab} className={kelas}>{label}</a>
  );
}

/**
 * utama: isi slide pertama yang tetap (hero). items: banner dari admin, tampil setelahnya.
 * Tanpa banner, hanya slide utama yang tampil (tanpa panah dan titik).
 */
export default function BannerCarousel({ utama, items = [] }) {
  const [gagal, setGagal] = useState(() => new Set());
  const banner = items.filter((b) => !gagal.has(b.id));
  const slides = [{ id: "utama", utama: true }, ...banner];
  const jumlah = slides.length;
  const [idx, setIdx] = useState(0);
  const [jeda, setJeda] = useState(false);
  const mulaiX = useRef(null);
  const timerLepas = useRef(null);
  const aktif = jumlah ? Math.min(idx, jumlah - 1) : 0;

  // Geser otomatis. Berhenti saat disentuh/disorot, tab tersembunyi, atau animasi dikurangi.
  useEffect(() => {
    if (jumlah < 2 || jeda || kurangGerak()) return undefined;
    const t = setTimeout(() => {
      if (document.visibilityState === "visible") setIdx((i) => (Math.min(i, jumlah - 1) + 1) % jumlah);
    }, aktif === 0 ? JEDA_UTAMA : JEDA_OTOMATIS);
    return () => clearTimeout(t);
  }, [jumlah, jeda, aktif]);

  useEffect(() => () => clearTimeout(timerLepas.current), []);

  const ke = (n) => setIdx(((n % jumlah) + jumlah) % jumlah);

  const sentuhMulai = (e) => {
    clearTimeout(timerLepas.current);
    setJeda(true);
    mulaiX.current = e.touches[0].clientX;
  };
  const lepas = () => {
    clearTimeout(timerLepas.current);
    timerLepas.current = setTimeout(() => setJeda(false), JEDA_SETELAH_SENTUH);
  };
  const sentuhSelesai = (e) => {
    const x0 = mulaiX.current;
    mulaiX.current = null;
    if (x0 != null) {
      const dx = e.changedTouches[0].clientX - x0;
      if (Math.abs(dx) > AMBANG_GESER) ke(aktif + (dx < 0 ? 1 : -1));
    }
    lepas();
  };
  const sentuhBatal = () => {
    mulaiX.current = null;
    lepas();
  };

  return (
    <section
      aria-roledescription="carousel"
      aria-label="Banner sekolah"
      className="relative overflow-hidden bg-slate-200"
      style={{ touchAction: "pan-y" }}
      onTouchStart={sentuhMulai}
      onTouchEnd={sentuhSelesai}
      onTouchCancel={sentuhBatal}
      onPointerEnter={(e) => e.pointerType === "mouse" && setJeda(true)}
      onPointerLeave={(e) => e.pointerType === "mouse" && setJeda(false)}
      onFocus={() => setJeda(true)}
      onBlur={() => setJeda(false)}
    >
      <div
        className="flex transition-transform duration-500 ease-out motion-reduce:transition-none"
        style={{ transform: `translateX(-${aktif * 100}%)` }}
      >
        {slides.map((b, i) => (
          <div
            key={b.id}
            role="group"
            aria-roledescription="slide"
            aria-label={`${i + 1} dari ${jumlah}`}
            inert={i !== aktif}
            className="relative aspect-[3/2] max-h-[600px] min-h-[260px] w-full shrink-0 sm:aspect-[8/3]"
          >
            {b.utama ? (
              utama
            ) : (
              <>
                <img
                  src={b.gambar}
                  alt={b.judul || "Banner SMAN 104 Jakarta"}
                  draggable={false}
                  loading={i < 2 ? "eager" : "lazy"}
                  decoding="async"
                  onError={() => setGagal((s) => new Set(s).add(b.id))}
                  className="absolute inset-0 h-full w-full select-none object-cover saturate-[.85]"
                />
                {/* Foto diredupkan sedikit dan diberi bayangan di kiri agar teks terbaca */}
                <div className="absolute inset-0 bg-navy/25" />
                {(b.judul || b.deskripsi || b.link) && (
                  <>
                    <div className="absolute inset-0 bg-gradient-to-r from-black/70 via-black/35 to-transparent" />
                    <div className="relative mx-auto flex h-full max-w-[1200px] items-center px-5 pb-6 sm:px-16">
                      <div>
                        {b.judul && (
                          <p className="line-clamp-3 max-w-3xl text-balance text-2xl font-extrabold leading-tight text-white sm:text-3xl lg:text-4xl">
                            {b.judul}
                          </p>
                        )}
                        {b.deskripsi && (
                          <p className="mt-3 hidden max-w-lg text-sm leading-6 text-blue-50 sm:line-clamp-2 sm:block md:text-base">
                            {b.deskripsi}
                          </p>
                        )}
                        <Tombol item={b} aktif={i === aktif} />
                      </div>
                    </div>
                  </>
                )}
              </>
            )}
          </div>
        ))}
      </div>

      {jumlah > 1 && (
        <>
          <button
            type="button"
            aria-label="Banner sebelumnya"
            onClick={() => ke(aktif - 1)}
            className="absolute left-3 top-1/2 hidden -translate-y-1/2 rounded-full bg-black/35 p-2 text-white backdrop-blur-sm transition-colors hover:bg-black/55 sm:block"
          >
            <ChevronLeftIcon className="h-5 w-5" />
          </button>
          <button
            type="button"
            aria-label="Banner berikutnya"
            onClick={() => ke(aktif + 1)}
            className="absolute right-3 top-1/2 hidden -translate-y-1/2 rounded-full bg-black/35 p-2 text-white backdrop-blur-sm transition-colors hover:bg-black/55 sm:block"
          >
            <ChevronRightIcon className="h-5 w-5" />
          </button>
          <div className="absolute inset-x-0 bottom-1 flex justify-center">
            {slides.map((b, i) => (
              <button
                key={b.id}
                type="button"
                aria-label={`Banner ${i + 1}`}
                aria-current={i === aktif}
                onClick={() => ke(i)}
                className="p-2"
              >
                <span
                  className={`block h-2.5 rounded-full transition-all ${
                    i === aktif ? "w-6 bg-white" : "w-2.5 bg-white/50"
                  }`}
                />
              </button>
            ))}
          </div>
        </>
      )}
    </section>
  );
}