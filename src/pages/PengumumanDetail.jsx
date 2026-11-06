import { Link, useParams } from "react-router-dom";
import { useFetch } from "../lib/api";
import { tgl } from "../lib/tanggal";

export default function PengumumanDetail() {
  const { id } = useParams();
  const { data: p, loading, error } = useFetch(`/pengumuman/${id}`);

  return (
    <div className="mx-auto max-w-[800px] px-5 py-12 sm:px-8">
      <nav className="text-xs text-slate-500">
        <Link to="/" className="hover:text-primary">Beranda</Link> /{" "}
        <Link to="/pengumuman" className="hover:text-primary">Pengumuman</Link> / Detail
      </nav>

      {loading && <p className="mt-6 text-sm text-slate-500">Memuat data...</p>}
      {error && <p role="alert" className="mt-6 text-sm text-red-600">Pengumuman tidak ditemukan.</p>}

      {p && (
        <article className="mt-5">
          <div className="flex items-center gap-3 text-xs">
            <span className="rounded-full bg-blue-50 px-3 py-1 font-semibold text-primary">{p.kategori}</span>
            <span className="text-slate-500">{tgl(p.tanggal)}</span>
          </div>
          <h1 className="mt-3 text-3xl font-extrabold leading-tight text-navy">{p.judul}</h1>
          {p.gambar && <img src={p.gambar} alt="" className="mt-6 max-h-[460px] w-full rounded-xl border border-line object-cover" />}
          <p className="mt-6 whitespace-pre-line text-base leading-7 text-slate-700">{p.isi}</p>
          <Link to="/pengumuman" className="mt-8 inline-block text-sm font-semibold text-primary">← Semua pengumuman</Link>
        </article>
      )}
    </div>
  );
}