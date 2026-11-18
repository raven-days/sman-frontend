
import { Link } from "react-router-dom";
import {
  MapPinIcon,
  PhoneIcon,
  EnvelopeIcon,
  ClockIcon,
} from "@heroicons/react/24/outline";

import { useKontak, ringkasJam } from "../lib/useKontak";
import Wordmark from "./Wordmark";

import awanLebar from "../assets/betawi/awan-betawi-lebar.webp";
import awanKecil from "../assets/betawi/awan-betawi-kecil.webp";
import daun from "../assets/betawi/ornamen-daun.webp";
import monas from "../assets/betawi/siluet-jakarta-monas.webp";
import ondelPria from "../assets/betawi/ondel-ondel-pria.webp";
import ondelWanita from "../assets/betawi/ondel-ondel-wanita.webp";
import gigiBalangAtas from "../assets/betawi/gigi-balang-strip-atas.webp";
import gigiBalangBawah from "../assets/betawi/gigi-balang-strip-bawah.webp";



const quick = [
  { label: "Daftar Layanan", to: "/layanan" },
  { label: "Cek Status", to: "/cek-status" },
  { label: "Ajukan Tanpa Akun", to: "/layanan/administrasi-persuratan#layanan-umum" },
  { label: "Kontak", to: "/kontak" },
];

const tautan =
  "text-white/85 transition-colors duration-200 hover:text-[#ffc928] hover:underline focus-visible:outline-2 focus-visible:outline-[#ffc928]";

function Hias({ src, className = "" }) {
  return (
    <img
      src={src}
      alt=""
      aria-hidden="true"
      loading="lazy"
      decoding="async"
      className={`absolute bottom-0 max-w-none pointer-events-none ${className}`}
    />
  );
}

function Wajah({ src, className = "" }) {
  return (
    <span aria-hidden="true" className={`block overflow-hidden ${className}`}>
      <img
        src={src}
        alt=""
        loading="lazy"
        decoding="async"
        className="w-full max-w-none"
      />
    </span>
  );
}

export default function Footer() {
  const k = useKontak();
  const jam = ringkasJam(k);

  const kontak = [
    k.alamat && { icon: MapPinIcon, text: k.alamat },
    k.telepon && {
      icon: PhoneIcon,
      text: k.telepon,
      href: `tel:${k.telepon.replace(/[^0-9+]/g, "")}`,
    },
    k.email && {
      icon: EnvelopeIcon,
      text: k.email,
      href: `mailto:${k.email}`,
    },
    jam && { icon: ClockIcon, text: jam },
  ].filter(Boolean);

  const hakCipta = (
    <>
      <span>
        © 2026 SMA Negeri 104 Jakarta. Hak cipta dilindungi.
      </span>

      {k.media_sosial?.length > 0 && (
        <ul className="flex flex-wrap justify-center gap-x-4">
          {k.media_sosial.map((m) => (
            <li key={m.url}>
              <a
                href={m.url}
                target="_blank"
                rel="noopener noreferrer"
                className={tautan}
              >
                {m.nama}
              </a>
            </li>
          ))}
        </ul>
      )}
    </>
  );

  return (
    <footer className="relative isolate overflow-hidden bg-[#0b1d3f] text-[#b3c1dc]">

      {/* PITA ORNAMEN GIGI BALANG DI ATAS FOOTER */}
      {/* <div
        className="ornamen"
        style={{
          backgroundImage: `url("${gigiBalangAtas}")`,
        }}
        aria-hidden="true"
      /> */}

      {/* KONTEN UTAMA */}
      <div className="relative z-10 mx-auto grid max-w-[1200px] gap-7 px-5 py-8 text-sm sm:px-8 md:grid-cols-[auto_1fr_auto] md:gap-x-10 md:gap-y-8 lg:gap-x-16 lg:py-10">

        {/* IDENTITAS SEKOLAH */}
        <div className="min-w-0">
          <Wordmark tone="gelap" className="text-2xl" />

          <p className="mt-2 leading-6 text-white/80">
            Layanan Tata Usaha 
            <br/>
            SMA Negeri 104 Jakarta
          </p>
        </div>

        {/* INFORMASI KONTAK */}
        <div className="min-w-0 md:max-w-[34rem] md:justify-self-center">
          <h3 className="mb-3 font-semibold text-white">
            Informasi Kontak
          </h3>

          <ul className="space-y-2.5">
            {kontak.map(({ icon: Icon, text, href }) => (
              <li
                key={text}
                className="flex items-start gap-2.5 leading-5"
              >
                <Icon className="mt-0.5 h-4 w-4 shrink-0 text-[#ffc928]" />

                {href ? (
                  <a href={href} className={tautan}>
                    {text}
                  </a>
                ) : (
                  <span className="text-white/80">
                    {text}
                  </span>
                )}
              </li>
            ))}
          </ul>
        </div>

        {/* TAUTAN CEPAT */}
        <nav aria-label="Tautan cepat" className="min-w-0">
          <h3 className="mb-3 font-semibold text-white">
            Tautan Cepat
          </h3>

          <ul className="space-y-2">
            {quick.map((q) => (
              <li key={q.label}>
                <Link to={q.to} className={tautan}>
                  {q.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
      </div>

      {/* BAGIAN BAWAH: DEKORASI BETAWI + HAK CIPTA */}
      <div className="relative border-t border-white/10">
        {/* Dekorasi menempel ke tepi kiri dan kanan, jadi tetap rapi saat layar mengecil */}
        <div aria-hidden="true" className="pointer-events-none absolute inset-0 overflow-hidden">
          {/* kiri: awan dan daun */}
          <Hias src={awanLebar} className="left-[-30px] w-[200px] opacity-95 sm:w-[250px]" />
          <Hias src={daun} className="left-[8px] w-[90px] sm:w-[110px]" />
          <Hias src={awanKecil} className="left-[116px] w-[96px] opacity-90 sm:left-[150px] sm:w-[120px]" />

          {/* kanan: awan, Monas, lalu ondel-ondel */}
          <Hias src={awanKecil} className="right-[-10px] hidden w-[120px] opacity-90 sm:block" />
          <Hias src={monas} className="right-[104px] hidden w-[190px] opacity-60 md:block lg:right-[140px] lg:w-[230px]" />

          <div className="absolute bottom-0 right-3 flex items-end -space-x-1.5 sm:right-6 lg:right-[14px]">
            <Wajah src={ondelPria} className="h-[62px] w-[50px] sm:h-[78px] sm:w-[62px]" />
            <Wajah src={ondelWanita} className="h-[62px] w-[52px] sm:h-[78px] sm:w-[64px]" />
          </div>
        </div>

        {/* Hak cipta: di layar kecil di atas dekorasi, di layar lebar di tengah antara dekorasi kiri dan kanan */}
        <div className="relative z-10 mx-auto flex max-w-[1200px] flex-col items-center justify-center gap-1 px-4 pb-[84px] pt-4 text-center text-xs sm:pb-[96px] lg:min-h-[96px] lg:px-[310px] lg:py-4">
          {hakCipta}
        </div>
      </div>

{/* ORNAMEN GIGI BALANG BAWAH */}
<div
  className="ornamen-bawah"
  style={{
    backgroundImage: `url("${gigiBalangBawah}")`,
  }}
  aria-hidden="true"
/>

    </footer>
  );
}
