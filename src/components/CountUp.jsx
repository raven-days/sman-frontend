import { useEffect, useRef, useState } from "react";
import { kurangGerak } from "./Reveal";

// Angka yang menghitung naik saat terlihat. Nilai bukan angka (mis. "-") ditampilkan apa adanya.
export default function CountUp({ nilai, durasi = 900, className = "" }) {
  const ref = useRef(null);
  const angka = Number(nilai);
  const valid = nilai !== null && nilai !== undefined && nilai !== "" && Number.isFinite(angka);
  const [tampil, setTampil] = useState(() => (valid && kurangGerak() ? angka : 0));
  const [terlihat, setTerlihat] = useState(false);
  const dari = useRef(tampil);

  useEffect(() => {
    const el = ref.current;
    if (!el || terlihat) return undefined;
    if (kurangGerak() || typeof IntersectionObserver === "undefined") {
      setTerlihat(true);
      return undefined;
    }
    const io = new IntersectionObserver(([e]) => {
      if (e.isIntersecting) {
        setTerlihat(true);
        io.disconnect();
      }
    });
    io.observe(el);
    return () => io.disconnect();
  }, [terlihat]);

  useEffect(() => {
    if (!valid || !terlihat) return undefined;
    if (kurangGerak()) {
      dari.current = angka;
      setTampil(angka);
      return undefined;
    }
    const awal = dari.current;
    const t0 = performance.now();
    let id;
    const langkah = (t) => {
      const p = Math.min(1, (t - t0) / durasi);
      const sekarang = Math.round(awal + (angka - awal) * (1 - Math.pow(1 - p, 3)));
      dari.current = sekarang;
      setTampil(sekarang);
      if (p < 1) id = requestAnimationFrame(langkah);
    };
    id = requestAnimationFrame(langkah);
    return () => cancelAnimationFrame(id);
  }, [angka, valid, terlihat, durasi]);

  return (
    <span ref={ref} className={className}>
      {valid ? tampil.toLocaleString("id-ID") : nilai ?? "-"}
    </span>
  );
}