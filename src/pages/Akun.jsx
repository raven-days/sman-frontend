import { Link } from "react-router-dom";
import { LockClosedIcon, ArrowRightIcon } from "@heroicons/react/24/outline";
import { useApp } from "../context/AppState";
import { ACCESS, ROLES, SERVICES } from "../data/content";
import ServiceIcon from "../components/ServiceIcon";

export default function Akun() {
  const { user, requests, dispatch } = useApp();
  const role = ROLES.find((r) => r.id === user.role);
  const access = ACCESS[user.role];
  const isTU = user.role === "tu";
  const mine = requests.filter((r) => r.ownerRole === user.role);
  const perbaikan = mine.filter((r) => r.status === "Perlu Perbaikan").length;
  const antrian = requests.filter((r) => r.status === "Menunggu" || r.status === "Diverifikasi").length;

  return (
    <div className="mx-auto max-w-[1000px] px-5 py-12 sm:px-8">
      <p className="text-xs font-bold uppercase tracking-widest text-primary">Akun saya</p>
      <h1 className="mt-1 text-3xl font-extrabold text-navy">Halo, {user.name}</h1>
      <p className="mt-1 text-sm text-slate-600">Masuk sebagai <b>{role?.label}</b>. Menu yang terbuka mengikuti hak akses peran ini.</p>

      <div className="mt-6 grid gap-4 sm:grid-cols-2">
        {isTU ? (
          <Link to="/petugas" className="flex items-center justify-between rounded-xl border border-line bg-white p-5 hover:shadow-md">
            <span><span className="block font-bold text-navy">Antrian Pengajuan</span><span className="text-sm text-slate-600">{antrian} menunggu diproses</span></span>
            <ArrowRightIcon className="h-5 w-5 text-primary" />
          </Link>
        ) : (
          <>
            <Link to="/ajukan" className="flex items-center justify-between rounded-xl border border-line bg-white p-5 hover:shadow-md">
              <span><span className="block font-bold text-navy">Ajukan Layanan</span><span className="text-sm text-slate-600">Isi formulir pengajuan</span></span>
              <ArrowRightIcon className="h-5 w-5 text-primary" />
            </Link>
            <Link to="/pengajuan" className="flex items-center justify-between rounded-xl border border-line bg-white p-5 hover:shadow-md">
              <span>
                <span className="block font-bold text-navy">Pengajuan Saya</span>
                <span className={`text-sm ${perbaikan ? "font-semibold text-orange-700" : "text-slate-600"}`}>
                  {perbaikan ? `${perbaikan} perlu diperbaiki` : `${mine.length} pengajuan`}
                </span>
              </span>
              <ArrowRightIcon className="h-5 w-5 text-primary" />
            </Link>
          </>
        )}
      </div>

      <h2 className="mt-10 text-lg font-bold text-navy">Menu layanan untuk akun ini</h2>
      <p className="mt-1 text-xs text-slate-500">Usulan hak akses, menunggu konfirmasi sekolah.</p>
      <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {SERVICES.map((s) => {
          const cap = access[s.slug];
          const body = (
            <>
              <span className={`flex h-10 w-10 items-center justify-center rounded-lg ${cap ? "bg-blue-50 text-primary" : "bg-surface text-slate-400"}`}>
                {cap ? <ServiceIcon slug={s.slug} className="h-5 w-5" /> : <LockClosedIcon className="h-5 w-5" />}
              </span>
              <span className="mt-3 block font-bold text-navy">{s.title}</span>
              <span className="mt-1 block text-xs text-slate-600">{cap || "Tidak tersedia untuk peran ini"}</span>
            </>
          );
          return cap ? (
            <Link key={s.slug} to={`/layanan/${s.slug}`} className="rounded-xl border border-line bg-white p-5 hover:shadow-md">{body}</Link>
          ) : (
            <div key={s.slug} aria-disabled="true" className="rounded-xl border border-dashed border-line bg-surface/60 p-5 opacity-75">{body}</div>
          );
        })}
        <Link to="/surat-keputusan" className="rounded-xl border border-line bg-white p-5 hover:shadow-md">
          <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-50 text-primary"><ServiceIcon slug="administrasi-persuratan" className="h-5 w-5" /></span>
          <span className="mt-3 block font-bold text-navy">Surat Keputusan</span>
          <span className="mt-1 block text-xs text-slate-600">Terbuka untuk semua pengguna</span>
        </Link>
      </div>

      <button type="button" onClick={() => dispatch({ type: "RESET" })} className="mt-10 text-xs text-slate-400 underline hover:text-slate-600">
        Atur ulang data demo
      </button>
    </div>
  );
}
