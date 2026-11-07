import { Link } from "react-router-dom";
import { useFetch } from "../../lib/api";
import { useApp } from "../../context/AppState";
import CountUp from "../../components/CountUp";

export default function TuDashboard() {
  const { user } = useApp();
  const { data, loading, error } = useFetch("/admin/ringkasan");
  const punya = (m) => (user?.izin || []).includes(m);

  const kartu = [
    { label: "Surat Keputusan", nilai: data?.sk, to: "/tu/sk", izin: "sk" },
    { label: "Pengumuman", nilai: data?.pengumuman, to: "/tu/pengumuman", izin: "pengumuman" },
    { label: "Pengajuan menunggu", nilai: data?.pengajuan, to: "/petugas", izin: "pengajuan" },
  ].filter((k) => punya(k.izin));

  kartu.push(
    { label: "Guru", nilai: data?.guru, to: punya("pegawai") ? "/tu/pegawai" : undefined },
    { label: "Tenaga Kependidikan", nilai: data?.tendik, to: punya("pegawai") ? "/tu/pegawai" : undefined },
  );

  return (
    <>
      <h1 className="text-2xl font-extrabold text-navy">Dashboard Staf TU</h1>
      <p className="mt-1 text-sm text-slate-600">Ringkasan data dan pekerjaan Tata Usaha.</p>
      {error && <p role="alert" className="mt-5 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</p>}
      <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {kartu.map((k) => {
          const isi = (
            <>
              <p className="text-sm text-slate-600">{k.label}</p>
              <p className="mt-2 text-3xl font-extrabold text-navy">{loading ? "…" : <CountUp nilai={k.nilai} />}</p>
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