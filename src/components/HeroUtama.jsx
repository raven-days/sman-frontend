import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { WARNA_HERO, WARNA_DEFAULT } from "../data/hero";

// Slide pertama carousel: teks dan tombol tetap. Hanya latar (warna/foto) yang bisa diatur admin.
export default function HeroUtama({ gambar = null, warna = WARNA_DEFAULT }) {
  const [fotoGagal, setFotoGagal] = useState(false);
  useEffect(() => setFotoGagal(false), [gambar]);
  const tampilFoto = gambar && !fotoGagal;
  const kelas = (WARNA_HERO[warna] || WARNA_HERO[WARNA_DEFAULT]).kelas;

  return (
    <div className={`absolute inset-0 overflow-hidden bg-gradient-to-br ${kelas}`}>
      {tampilFoto ? (
        <img
          src={gambar}
          alt=""
          draggable={false}
          onError={() => setFotoGagal(true)}
          className="absolute inset-0 h-full w-full select-none object-cover"
        />
      ) : (
        <>
          {/* Hiasan agar latar tidak polos */}
          <div className="absolute -right-24 -top-28 h-[26rem] w-[26rem] rounded-full bg-white/10" />
          <div className="absolute -bottom-32 right-1/4 h-80 w-80 rounded-full bg-white/[0.06]" />
          <div
            className="absolute inset-0 opacity-[0.12]"
            style={{ backgroundImage: "radial-gradient(#fff 1px, transparent 1px)", backgroundSize: "22px 22px" }}
          />
        </>
      )}
      {tampilFoto && <div className="absolute inset-0 bg-navy/25" />}
      <div className="absolute inset-0 bg-gradient-to-r from-black/70 via-black/35 to-transparent" />

      <div className="relative mx-auto flex h-full max-w-[1200px] items-center px-5 pb-6 sm:px-16">
        <div className="hero-stagger">
          <p className="text-[11px] font-bold uppercase tracking-widest text-blue-100 sm:text-xs">
            Portal layanan SMAN 104 Jakarta
          </p>
          <h1 className="mt-2 max-w-3xl text-balance text-2xl font-extrabold leading-tight text-white sm:mt-3 sm:text-3xl md:text-4xl lg:text-5xl">
            Layanan Administrasi Sekolah dalam Satu Pintu
          </h1>
          <p className="mt-4 hidden max-w-lg text-base leading-7 text-blue-50 md:block">
            Ajukan, pantau, dan selesaikan kebutuhan administrasi sekolah dengan mudah dan transparan.
          </p>
          <div className="mt-4 flex flex-wrap gap-3 sm:mt-7">
            <Link
              to="/ajukan"
              className="press rounded-lg bg-white px-5 py-2.5 text-sm font-semibold text-navy shadow-sm hover:bg-blue-50 sm:px-6 sm:py-3"
            >
              Ajukan Layanan
            </Link>
            <a
              href="#alur"
              className="press rounded-lg border border-white/60 px-5 py-2.5 text-sm font-semibold text-white hover:bg-white/10 sm:px-6 sm:py-3"
            >
              Lihat Alur
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}