import { useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { MagnifyingGlassIcon, ExclamationTriangleIcon, XCircleIcon, InformationCircleIcon } from "@heroicons/react/24/outline";
import { api } from "../lib/api";
import StatusBadge from "./StatusBadge";
import Timeline from "./Timeline";


export default function CekStatusPanel() {
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const [akses, setAkses] = useState(null);
  const [nomor, setNomor] = useState(params.get("no") || "");
  const [pin, setPin] = useState("");
  const [hasil, setHasil] = useState(null);
  const [galat, setGalat] = useState("");
  const [loading, setLoading] = useState(false);

  const q = nomor.trim().toUpperCase();
  const mintaPin = q.startsWith("PJN");

  const cari = async (e) => {
    e.preventDefault();
    setHasil(null);
    setAkses(null);
    if (!q) return setGalat("Masukkan kode atau nomor pengajuan dulu.");
    if (mintaPin && !pin.trim()) return setGalat("Masukkan PIN 6 angka Anda.");
    setLoading(true);
    setGalat("");
    try {
      if (mintaPin) {
        const fd = new FormData();
        fd.append("kode", q);
        fd.append("pin", pin.trim());
        const res = await api("/tamu/cek-status", { method: "POST", body: fd });
        setHasil(res);
        setAkses({ kode: q, pin: pin.trim() });
      } else {
        setHasil(await api(`/cek-status/${encodeURIComponent(q)}`));
      }
    } catch (err) {
      setGalat(
        err.status === 404
          ? "Nomor pengajuan tidak ditemukan. Periksa penulisannya, misalnya TU-2026-00128."
          : err.message,
      );
    } finally {
      setLoading(false);
      if (mintaPin) setPin("");
    }
  };

  const perbaiki = async () => {
    setLoading(true);
    setGalat("");
    try {
      const fd = new FormData();
      fd.append("kode", akses.kode);
      fd.append("pin", akses.pin);
      const r = await api("/tamu/data-perbaikan", { method: "POST", body: fd });
      navigate(`/layanan/pengajuan/${r.layanan}`, {
        state: { perbaikan: { ...akses, data: r.data, catatan: r.catatan, jumlah_lampiran: r.jumlah_lampiran } },
      });
    } catch (err) {
      setGalat(err.message);
    } finally {
      setLoading(false);
    }
  };

  const tamu = !!hasil?.kode;

  return (
    <section id="cek-status" className="rounded-xl border border-line bg-white p-6 sm:p-7">
      <h2 className="text-xl font-bold text-navy">Cek Status Pengajuan</h2>
      <p className="mt-1 text-sm text-slate-600">
        Pengajuan dari akun: masukkan nomor pengajuan (TU-...). Pengajuan tanpa akun: masukkan kode (PJN-...) dan PIN.
      </p>

      <form onSubmit={cari} className="mt-5 flex flex-col gap-3 sm:flex-row">
        <div className="relative flex-1">
          <MagnifyingGlassIcon className="pointer-events-none absolute left-3.5 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />
          <input
            value={nomor}
            onChange={(e) => { setNomor(e.target.value); if (galat) setGalat(""); }}
            aria-label="Kode atau nomor pengajuan"
            placeholder="TU-2026-00128 atau PJN-8KQ7X2M9"
            autoComplete="off"
            className="h-12 w-full rounded-lg border border-line pl-11 pr-4 text-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
          />
        </div>
        {mintaPin && (
          <input
            value={pin}
            onChange={(e) => { setPin(e.target.value.replace(/\D/g, "").slice(0, 6)); if (galat) setGalat(""); }}
            type="password"
            inputMode="numeric"
            autoComplete="off"
            aria-label="PIN"
            placeholder="PIN 6 angka"
            className="h-12 rounded-lg border border-line px-4 text-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 sm:w-40"
          />
        )}
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
              <p className="text-xs text-slate-500">{tamu ? "Kode pengajuan" : "Nomor pengajuan"}</p>
              <p className="font-display text-lg font-bold text-navy">{tamu ? hasil.kode : hasil.id}</p>
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
            {!tamu && (
              <div>
                <dt className="text-slate-500">Pemohon</dt>
                <dd className="font-semibold text-navy">{hasil.pemohon}</dd>
              </div>
            )}
          </dl>

          {tamu && (
            <>
              {!hasil.terverifikasi && hasil.status === "Menunggu" && (
                <p className="mt-5 flex gap-2 rounded-lg border border-blue-200 bg-blue-50 p-4 text-sm text-blue-900">
                  <InformationCircleIcon className="h-5 w-5 shrink-0" />
                  <span>Pengajuan ini belum terverifikasi dan belum diproses menjadi dokumen resmi.</span>
                </p>
              )}
              <p className={`mt-4 rounded-lg border px-4 py-3 text-sm ${
                hasil.status === "Ditolak" ? "border-red-200 bg-red-50 text-red-800"
                : hasil.status === "Perlu Perbaikan" ? "border-orange-300 bg-orange-50 text-orange-900"
                : hasil.status === "Selesai" ? "border-green-200 bg-green-50 text-green-800"
                : "border-line bg-surface text-slate-700"
              }`}>
                <b>Langkah berikutnya: </b>{hasil.tindak_lanjut}
              </p>
              {hasil.status === "Perlu Perbaikan" && akses && (
                <button
                  type="button"
                  onClick={perbaiki}
                  disabled={loading}
                  className="mt-3 rounded-lg bg-primary px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-primary-dark disabled:opacity-70"
                >
                  {loading ? "Memuat..." : "Perbaiki pengajuan"}
                </button>
              )}
            </>
          )}

          {!tamu && hasil.status === "Perlu Perbaikan" && (
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

          {!tamu && hasil.status === "Ditolak" && (
            <div className="mt-5 rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-800">
              <p className="flex items-center gap-2 font-semibold">
                <XCircleIcon className="h-5 w-5" /> Pengajuan ditolak
              </p>
              <Link to={`/pengajuan/${hasil.id}`} className="mt-2 inline-block font-semibold underline">
                Masuk untuk melihat alasan penolakan
              </Link>
            </div>
          )}

          {!tamu && hasil.pengambilan && (
            <p className="mt-5 rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-800">{hasil.pengambilan}</p>
          )}

          <div className="mt-6">
            <Timeline history={hasil.history} status={hasil.status} showDetail={false} />
          </div>
        </div>
      )}
    </section>
  );
}