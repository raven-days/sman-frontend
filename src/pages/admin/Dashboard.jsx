import { Link } from "react-router-dom";
import { useFetch } from "../../lib/api";

export default function AdminDashboard() {
  const { data, loading, error } = useFetch("/admin/ringkasan");
  const kartu = [
    { label: "Surat Keputusan", nilai: data?.sk, to: "/admin/sk" },
    { label: "Pengumuman", nilai: data?.pengumuman, to: "/admin/pengumuman" },
    { label: "Pengajuan menunggu", nilai: data?.pengajuan, to: "/petugas" },
    { label: "Guru", nilai: data?.guru },
    { label: "Tenaga Kependidikan", nilai: data?.tendik },
  ];

  return (
    <>
      <h1 className="text-2xl font-extrabold text-navy">Dashboard</h1>
      <p className="mt-1 text-sm text-slate-600">Ringkasan data yang tampil di website utama.</p>

      {error && <p role="alert" className="mt-5 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</p>}

      <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {kartu.map((k) => {
          const isi = (
            <>
              <p className="text-sm text-slate-600">{k.label}</p>
              <p className="mt-2 text-3xl font-extrabold text-navy">{loading ? "…" : k.nilai ?? "-"}</p>
            </>
          );
          return k.to ? (
            <Link key={k.label} to={k.to} className="rounded-xl border border-line bg-white p-5 hover:shadow-md">{isi}</Link>
          ) : (
            <div key={k.label} className="rounded-xl border border-line bg-white p-5">{isi}</div>
          );
        })}
      </div>
    </>
  );
}