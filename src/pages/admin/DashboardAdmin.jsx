import { Link } from "react-router-dom";
import { useFetch } from "../../lib/api";
import CountUp from "../../components/CountUp";

function JumlahAkun({ label, role }) {
  const { data, loading } = useFetch(`/admin/akun?role=${role}`);
  return (
    <Link to="/admin/akun" className="card-hover rounded-xl border border-line bg-white p-5">
      <p className="text-sm text-slate-600">{label}</p>
      <p className="mt-2 text-3xl font-extrabold text-navy">{loading ? "…" : <CountUp nilai={data?.total} />}</p>
    </Link>
  );
}

const TAUTAN = [
  { to: "/admin/akun", judul: "Kelola Akun", ket: "Tambah, impor, reset sandi, dan atur hak akses" },
  { to: "/admin/audit", judul: "Log Audit", ket: "Riwayat login dan aksi penting" },
  { to: "/tu", judul: "Dashboard Staf TU", ket: "SK, pengumuman, pegawai, dan antrian pengajuan" },
];

export default function DashboardAdmin() {
  return (
    <>
      <h1 className="text-2xl font-extrabold text-navy">Dashboard Admin</h1>
      <p className="mt-1 text-sm text-slate-600">Pengelolaan akun dan keamanan sistem.</p>

      <div className="mt-6 grid gap-4 sm:grid-cols-3">
        <JumlahAkun label="Akun siswa" role="siswa" />
        <JumlahAkun label="Akun guru" role="guru" />
        <JumlahAkun label="Akun staf TU" role="tu" />
      </div>

      <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {TAUTAN.map((t) => (
          <Link key={t.to} to={t.to} className="card-hover rounded-xl border border-line bg-white p-5">
            <span className="block font-bold text-navy">{t.judul}</span>
            <span className="mt-1 block text-sm text-slate-600">{t.ket}</span>
          </Link>
        ))}
      </div>
    </>
  );
}