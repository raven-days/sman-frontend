
import logoSMA from "../assets/logo.jpg";
import logoTutWuri from "../assets/logo-tutwuri.png";
import logoJakarta from "../assets/logo-jakarta.png";
import logo5Abad from "../assets/Logo-5Abad-Jakarta.png";
import logoDisdik from "../assets/dinas-pendidikan-logo.png";

export const LOGOS = [
  {
    alt: "Logo Tut Wuri Handayani",
    src: logoTutWuri,
    rasio: 1,
    zoom: 1,
  },
  {
    alt: "Logo Jaya Raya",
    src: logoJakarta,
    rasio: 0.9,
    zoom: 1.05,
  },
  {
    alt: "Logo 5 Abad Jakarta",
    src: logo5Abad,
    rasio: 1.8,
    zoom: 1.05,
  },
  {
    alt: "Logo Dinas Pendidikan",
    src: logoDisdik,
    rasio: 0.85,
    zoom: 1.15,
    kiri: - 9,
  },
  {
    alt: "Logo SMA Negeri 104 Jakarta",
    src: logoSMA,
    rasio: 0.9,
    zoom: 1.1,
  },
];

export function LogoMark({ logo, tinggi = 42 }) {
  return (
    <span
      className="flex shrink-0 items-center justify-center"
      style={{
        width: Math.round(tinggi * logo.rasio),
        height: tinggi,
        marginLeft: logo.kiri || 0,
      }}
    >
      <img
        src={logo.src}
        alt={logo.alt}
        className="block h-full w-full object-contain"
        style={{
          transform: `scale(${logo.zoom})`,
        }}
      />
    </span>
  );
}

export default function LogoBar({
  tinggi = 42,
  className = "",
}) {
  return (
    <div
      className={`flex items-center justify-center gap-3 ${className}`}
    >
      {LOGOS.map((logo) => (
        <LogoMark
          key={logo.alt}
          logo={logo}
          tinggi={tinggi}
        />
      ))}
    </div>
  );
}
