import { Link } from "react-router-dom";
import { tgl } from "../lib/tanggal";

export default function PengumumanCard({ p }) {
  const isi = (
    <>
      {p.gambar && (
        <div className="overflow-hidden">
          <img
            src={p.gambar}
            alt=""
            loading="lazy"
            className="h-44 w-full object-cover transition-transform duration-500 group-hover:scale-105"
          />
        </div>
      )}
      <div className="p-6">
        <div className="flex items-center justify-between text-xs">
          <span className="rounded-full bg-blue-50 px-3 py-1 font-semibold text-primary">{p.kategori}</span>
          <span className="text-slate-500">{tgl(p.tanggal)}</span>
        </div>
        <h3 className="mt-4 text-lg font-bold leading-snug text-navy">{p.judul}</h3>
        <p className="mt-2 text-sm leading-6 text-slate-600">{p.ringkasan}</p>
      </div>
    </>
  );
  const kelas = "group block h-full overflow-hidden rounded-xl border border-line bg-white";
  return p.id ? (
    <Link to={`/pengumuman/${p.id}`} className={`${kelas} card-hover`}>{isi}</Link>
  ) : (
    <article className={kelas}>{isi}</article>
  );
}