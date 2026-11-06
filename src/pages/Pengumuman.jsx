import { Link } from "react-router-dom";
import { ANNOUNCEMENTS } from "../data/content";
import { useFetch, DEMO } from "../lib/api";
import PengumumanCard from "../components/PengumumanCard";

const DEMO_LIST = ANNOUNCEMENTS.map((a) => ({ judul: a.title, kategori: a.tag, tanggal: a.date, ringkasan: a.excerpt }));

export default function Pengumuman() {
  const { data, loading, error } = useFetch("/pengumuman");
  const daftar = DEMO ? DEMO_LIST : data ?? [];

  return (
    <div className="mx-auto max-w-[1200px] px-5 py-12 sm:px-8">
      <nav className="text-xs text-slate-500">
        <Link to="/" className="hover:text-primary">Beranda</Link> / Pengumuman
      </nav>
      <h1 className="mt-3 text-3xl font-extrabold text-navy">Pengumuman</h1>
      <p className="mt-1 text-sm text-slate-600">Informasi terbaru dari Tata Usaha SMA Negeri 104 Jakarta.</p>

      {!DEMO && loading && <p className="mt-6 text-sm text-slate-500">Memuat data...</p>}
      {!DEMO && error && <p role="alert" className="mt-6 text-sm text-red-600">{error}</p>}
      {!loading && !error && daftar.length === 0 && <p className="mt-6 text-sm text-slate-500">Belum ada pengumuman.</p>}

      <div className="mt-8 grid gap-5 md:grid-cols-2 lg:grid-cols-3">
        {daftar.map((p) => <PengumumanCard key={p.id ?? p.judul} p={p} />)}
      </div>
    </div>
  );
}