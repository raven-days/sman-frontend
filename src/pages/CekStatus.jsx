import { useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { ExclamationTriangleIcon, XCircleIcon } from "@heroicons/react/24/outline";
import { useApp } from "../context/AppState";
import { maskName } from "../lib/format";
import StatusBadge from "../components/StatusBadge";
import Timeline from "../components/Timeline";

export default function CekStatus() {
  const { requests } = useApp();
  const [params, setParams] = useSearchParams();
  const [input, setInput] = useState(params.get("no") || "");
  const query = (params.get("no") || "").trim().toUpperCase();
  const hasil = query ? requests.find((r) => r.id === query) : null;

  useEffect(() => {
    setInput(params.get("no") || "");
  }, [params]);

  const submit = (e) => {
    e.preventDefault();
    const q = input.trim();
    setParams(q ? { no: q } : {});
  };

  return (
    <div className="mx-auto max-w-[760px] px-5 py-14 sm:px-8">
      <p className="text-xs font-bold uppercase tracking-widest text-primary">Layanan publik</p>
      <h1 className="mt-2 text-3xl font-extrabold text-navy">Cek Status Pengajuan</h1>
      <p className="mt-2 text-sm text-slate-600">
        Masukkan nomor pengajuan Anda. Untuk detail lengkap, silakan masuk ke akun.
      </p>

      <form onSubmit={submit} className="mt-7 flex flex-col gap-3 sm:flex-row">
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          aria-label="Nomor pengajuan"
          placeholder="Contoh: TU-2026-00128"
          className="h-12 flex-1 rounded-lg border border-line px-4 text-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
        />
        <button className="h-12 rounded-lg bg-primary px-7 text-sm font-semibold text-white hover:bg-primary-dark">
          Cek Status
        </button>
      </form>

      {query && !hasil && (
        <div role="alert" className="mt-8 rounded-xl border border-red-200 bg-red-50 p-5 text-sm text-red-700">
          <p className="font-semibold">Nomor pengajuan tidak ditemukan.</p>
          <p className="mt-1">Periksa kembali penulisan nomor, misalnya TU-2026-00128.</p>
        </div>
      )}

      {hasil && (
        <section className="mt-8 rounded-xl border border-line bg-white p-6">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <p className="text-xs text-slate-500">Nomor pengajuan</p>
              <p className="font-display text-lg font-bold text-navy">{hasil.id}</p>
            </div>
            <StatusBadge status={hasil.status} />
          </div>

          <dl className="mt-5 grid gap-4 text-sm sm:grid-cols-3">
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
              <dd className="font-semibold text-navy">{maskName(hasil.pemohon)}</dd>
            </div>
          </dl>

          {hasil.status === "Perlu Perbaikan" && (
            <div className="mt-6 rounded-lg border border-orange-300 bg-orange-50 p-4 text-sm text-orange-900">
              <p className="flex items-center gap-2 font-semibold">
                <ExclamationTriangleIcon className="h-5 w-5" /> Pengajuan ditunda
              </p>
              <p className="mt-1">
                Ada isian yang belum sesuai. Pemohon perlu memperbaikinya sesuai catatan petugas, lalu mengirim ulang.
              </p>
              <Link to={`/pengajuan/${hasil.id}`} className="mt-2 inline-block font-semibold underline">
                Masuk untuk melihat catatan dan memperbaiki
              </Link>
            </div>
          )}

          {hasil.status === "Ditolak" && (
            <div className="mt-6 rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-800">
              <p className="flex items-center gap-2 font-semibold">
                <XCircleIcon className="h-5 w-5" /> Pengajuan ditolak
              </p>
              <Link to={`/pengajuan/${hasil.id}`} className="mt-2 inline-block font-semibold underline">
                Masuk untuk melihat alasan penolakan
              </Link>
            </div>
          )}

          <div className="mt-7">
            <Timeline history={hasil.history} status={hasil.status} showDetail={false} />
          </div>

          <Link to={`/pengajuan/${hasil.id}`} className="text-sm font-semibold text-primary">
            Masuk untuk melihat detail lengkap →
          </Link>
        </section>
      )}

      <p className="mt-10 text-xs text-slate-400">
        Data demo yang bisa dicoba: {requests.slice(0, 4).map((r) => r.id).join(", ")}.
      </p>
    </div>
  );
}
