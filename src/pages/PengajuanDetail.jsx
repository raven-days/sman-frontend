import { useState } from "react";
import { Link, Navigate, useLocation, useParams } from "react-router-dom";
import { CheckCircleIcon, ExclamationTriangleIcon } from "@heroicons/react/24/outline";
import { useApp } from "../context/AppState";
import { fmtDate } from "../lib/format";
import StatusBadge from "../components/StatusBadge";
import Timeline from "../components/Timeline";
import RequestForm, { validate } from "../components/RequestForm";
import Forbidden from "./Forbidden";

const pick = (r) => ({ jenis: r.jenis, perihal: r.perihal, tanggal: r.tanggal, keterangan: r.keterangan, lampiran: r.lampiran });

export default function PengajuanDetail() {
  const { id } = useParams();
  const { user, requests, dispatch } = useApp();
  const { state } = useLocation();
  const req = requests.find((r) => r.id === id);
  const [edit, setEdit] = useState(null);
  const [errors, setErrors] = useState({});
  const [sent, setSent] = useState(false);

  if (!req) {
    return (
      <div className="mx-auto max-w-[600px] px-5 py-24 text-center">
        <h1 className="text-2xl font-extrabold text-navy">Pengajuan tidak ditemukan</h1>
        <Link to="/pengajuan" className="mt-6 inline-block font-semibold text-primary">Kembali ke Pengajuan Saya</Link>
      </div>
    );
  }
  if (user.role === "tu") return <Navigate to={`/petugas/${id}`} replace />;
  if (req.ownerRole !== user.role) return <Forbidden />;

  const perbaikan = req.status === "Perlu Perbaikan";
  const values = edit || pick(req);
  const lastNote = [...req.history].reverse().find((h) => h.label === "Perlu Perbaikan");

  const resubmit = () => {
    const e = validate(values);
    setErrors(e);
    if (Object.keys(e).length) return;
    dispatch({ type: "RESUBMIT", id: req.id, by: user.name, data: { ...values, perihal: values.perihal.trim() } });
    setEdit(null);
    setSent(true);
  };

  return (
    <div className="mx-auto max-w-[860px] px-5 py-12 sm:px-8">
      <nav className="text-xs text-slate-500">
        <Link to="/akun" className="hover:text-primary">Akun Saya</Link> /{" "}
        <Link to="/pengajuan" className="hover:text-primary">Pengajuan Saya</Link> / {req.id}
      </nav>

      {state?.baru && (
        <p className="mt-4 flex items-center gap-2 rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-800">
          <CheckCircleIcon className="h-5 w-5 shrink-0" />
          Pengajuan berhasil dikirim. Simpan nomor pengajuan Anda: <b>{req.id}</b>.
        </p>
      )}
      {sent && (
        <p className="mt-4 flex items-center gap-2 rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-800">
          <CheckCircleIcon className="h-5 w-5 shrink-0" />
          Pengajuan sudah diperbaiki dan dikirim ulang. Petugas akan memeriksanya kembali.
        </p>
      )}

      <div className="mt-4 flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-xs text-slate-500">Nomor pengajuan</p>
          <h1 className="font-display text-2xl font-extrabold text-navy">{req.id}</h1>
          <p className="text-sm text-slate-600">{req.jenis}{req.revisi > 0 ? ` · revisi ke-${req.revisi}` : ""}</p>
        </div>
        <StatusBadge status={req.status} />
      </div>

      {perbaikan && (
        <section className="mt-6 rounded-xl border border-orange-300 bg-orange-50 p-5">
          <p className="flex items-center gap-2 font-bold text-orange-900">
            <ExclamationTriangleIcon className="h-5 w-5" /> Pengajuan ditunda: perlu diperbaiki
          </p>
          <p className="mt-2 text-sm text-orange-900">{lastNote?.note || "Mohon perbaiki isian sesuai catatan, lalu kirim ulang."}</p>
          <p className="mt-2 text-xs text-orange-800">Kolom yang perlu diperbaiki ditandai di formulir di bawah.</p>
        </section>
      )}

      <section className="mt-6 rounded-xl border border-line bg-white p-6">
        <h2 className="text-lg font-bold text-navy">{perbaikan ? "Perbaiki isian" : "Data pengajuan"}</h2>
        {perbaikan ? (
          <div className="mt-5">
            <RequestForm values={values} onChange={(p) => setEdit({ ...values, ...p })} errors={errors} notes={req.fieldNotes || {}} showJenis />
            <button type="button" onClick={resubmit} className="mt-6 rounded-lg bg-primary px-7 py-3 text-sm font-semibold text-white hover:bg-primary-dark">
              Kirim Ulang Pengajuan
            </button>
          </div>
        ) : (
          <dl className="mt-3 divide-y divide-line text-sm">
            {[
              ["Perihal / keperluan", req.perihal],
              ["Tanggal dibutuhkan", fmtDate(req.tanggal)],
              ["Keterangan tambahan", req.keterangan || "-"],
              ["Lampiran", req.lampiran.length ? req.lampiran.join(", ") : "Tidak ada"],
            ].map(([k, v]) => (
              <div key={k} className="grid gap-1 py-3 sm:grid-cols-3">
                <dt className="text-slate-500">{k}</dt>
                <dd className="font-semibold text-navy sm:col-span-2">{v}</dd>
              </div>
            ))}
          </dl>
        )}
      </section>

      <section className="mt-6 rounded-xl border border-line bg-white p-6">
        <h2 className="mb-4 text-lg font-bold text-navy">Riwayat status</h2>
        <Timeline history={req.history} status={req.status} />
      </section>
    </div>
  );
}
