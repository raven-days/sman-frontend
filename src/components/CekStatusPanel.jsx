import { useState } from "react";
import { Link } from "react-router-dom";
import { MagnifyingGlassIcon, ExclamationTriangleIcon, XCircleIcon } from "@heroicons/react/24/outline";
import { api } from "../lib/api";
import StatusBadge from "./StatusBadge";
import Timeline from "./Timeline";

export default function CekStatusPanel() {
  const [nomor, setNomor] = useState("");
  const [hasil, setHasil] = useState(null);
  const [galat, setGalat] = useState("");
  const [loading, setLoading] = useState(false);

  const cari = async (e) => {
    e.preventDefault();
    const q = nomor.trim().toUpperCase();
    setHasil(null);
    if (!q) return setGalat("Masukkan nomor pengajuan dulu.");
    setLoading(true);
    setGalat("");
    try {
      setHasil(await api(`/cek-status/${encodeURIComponent(q)}`));
    } catch (err) {
      setGalat(
        err.status === 404
          ? "Nomor pengajuan tidak ditemukan. Periksa penulisannya, misalnya TU-2026-00128."
          : err.message,
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <section id="cek-status" className="rounded-xl border border-line bg-white p-6 sm:p-7">
      <h2 className="text-xl font-bold text-navy">Cek Status Pengajuan</h2>
      <p className="mt-1 text-sm text-slate-600">Masukkan nomor pengajuan Anda. Untuk detail lengkap, silakan masuk ke akun.</p>

      <form onSubmit={cari} className="mt-5 flex flex-col gap-3 sm:flex-row">
        <div className="relative flex-1">
          <MagnifyingGlassIcon className="pointer-events-none absolute left-3.5 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />
          <input
            value={nomor}
            onChange={(e) => { setNomor(e.target.value); if (galat) setGalat(""); }}
            aria-label="Nomor pengajuan"
            placeholder="Contoh: TU-2026-00128"
            className="h-12 w-full rounded-lg border border-line pl-11 pr-4 text-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
          />
        </div>
        <button
          disabled={loading}
          className="h-12 rounded-lg bg-primary px-7 text-sm font-semibold text-white transition-colors hover:bg-primary-dark disabled:opacity-70"
        >
          {loading ? "Mencari..." : "Cek Status"}
        </button>
      </form>

      {galat && (
        <p role="alert" className="mt-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{galat}</p>
      )}

      {hasil && (
        <div className="mt-6 border-t border-line pt-6">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <p className="text-xs text-slate-500">Nomor pengajuan</p>
              <p className="font-display text-lg font-bold text-navy">{hasil.id}</p>
            </div>
            <StatusBadge status={hasil.status} />
          </div>

          <dl className="mt-4 grid gap-4 text-sm sm:grid-cols-3">
            <div>
              <dt className="text-slate-500">Layanan</dt>
              <dd className="font-semibold text-navy">{hasil.jenis}</dd>
            </div>
            <div>
              <dt className="text-slate-500">Tanggal pengajuan</dt>
              <dd className="font-semibold text-navy">{hasil.history[0]?.time.split(",")[0]}</dd>
            </div>
            <div>
              <dt className="text-slate-500">Pemohon</dt>
              <dd className="font-semibold text-navy">{hasil.pemohon}</dd>
            </div>
          </dl>

          {hasil.status === "Perlu Perbaikan" && (
            <div className="mt-5 rounded-lg border border-orange-300 bg-orange-50 p-4 text-sm text-orange-900">
              <p className="flex items-center gap-2 font-semibold">
                <ExclamationTriangleIcon className="h-5 w-5" /> Pengajuan ditunda
              </p>
              <p className="mt-1">Ada isian yang belum sesuai. Pemohon perlu memperbaikinya sesuai catatan petugas, lalu mengirim ulang.</p>
              <Link to={`/pengajuan/${hasil.id}`} className="mt-2 inline-block font-semibold underline">
                Masuk untuk melihat catatan dan memperbaiki
              </Link>
            </div>
          )}

          {hasil.status === "Ditolak" && (
            <div className="mt-5 rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-800">
              <p className="flex items-center gap-2 font-semibold">
                <XCircleIcon className="h-5 w-5" /> Pengajuan ditolak
              </p>
              <Link to={`/pengajuan/${hasil.id}`} className="mt-2 inline-block font-semibold underline">
                Masuk untuk melihat alasan penolakan
              </Link>
            </div>
          )}

          {hasil.pengambilan && (
            <p className="mt-5 rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-800">{hasil.pengambilan}</p>
          )}

          <div className="mt-6">
            <Timeline history={hasil.history} status={hasil.status} showDetail={false} />
          </div>

          <Link to={`/pengajuan/${hasil.id}`} className="text-sm font-semibold text-primary">
            Masuk untuk melihat detail lengkap →
          </Link>
        </div>
      )}
    </section>
  );
}