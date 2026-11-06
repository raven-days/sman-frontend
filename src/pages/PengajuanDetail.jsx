import { useEffect, useState } from "react";
import { Link, Navigate, useLocation, useParams } from "react-router-dom";
import { CheckCircleIcon, ExclamationTriangleIcon } from "@heroicons/react/24/outline";
import { useApp } from "../context/AppState";
import { api } from "../lib/api";
import { fmtDate } from "../lib/format";
import StatusBadge from "../components/StatusBadge";
import Timeline from "../components/Timeline";
import LampiranList from "../components/LampiranList";
import RequestForm, { validate } from "../components/RequestForm";
import Forbidden from "./Forbidden";

const pick = (r) => ({ jenis: r.jenis, perihal: r.perihal, tanggal: r.tanggal, keterangan: r.keterangan, lampiran: r.lampiran });

export default function PengajuanDetail() {
  const { id } = useParams();
  const { user } = useApp();
  const { state } = useLocation();
  const [req, setReq] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [edit, setEdit] = useState(null);
  const [errors, setErrors] = useState({});
  const [sent, setSent] = useState(false);
  const [sending, setSending] = useState(false);
  const [sendErr, setSendErr] = useState("");

  useEffect(() => {
    if (user.role === "tu") return;
    let batal = false;
    api(`/pengajuan/${id}`)
      .then((d) => { if (!batal) { setReq(d); setLoading(false); } })
      .catch((e) => { if (!batal) { setError(e); setLoading(false); } });
    return () => { batal = true; };
  }, [id, user.role]);

  if (user.role === "tu") return <Navigate to={`/petugas/${id}`} replace />;
  if (loading) return <p className="px-5 py-24 text-center text-sm text-slate-500">Memuat data...</p>;
  if (error?.status === 403) return <Forbidden />;
  if (error || !req) {
    return (
      <div className="mx-auto max-w-[600px] px-5 py-24 text-center">
        <h1 className="text-2xl font-extrabold text-navy">Pengajuan tidak ditemukan</h1>
        <Link to="/pengajuan" className="mt-6 inline-block font-semibold text-primary">Kembali ke Pengajuan Saya</Link>
      </div>
    );
  }

  const perbaikan = req.status === "Perlu Perbaikan";
  const values = edit || pick(req);
  const lastNote = [...req.history].reverse().find((h) => h.label === "Perlu Perbaikan");

  const resubmit = async () => {
    const e = validate(values);
    setErrors(e);
    if (Object.keys(e).length) return;
    setSending(true);
    setSendErr("");
    const fd = new FormData();
    fd.append("jenis", values.jenis);
    fd.append("perihal", values.perihal.trim());
    fd.append("tanggal", values.tanggal);
    fd.append("keterangan", (values.keterangan || "").trim());
    values.lampiran.forEach((l) => (l.file ? fd.append("lampiran[]", l.file) : fd.append("lampiran_tetap[]", l.id)));
    try {
      const res = await api(`/pengajuan/${req.id}/kirim-ulang`, { method: "POST", body: fd });
      setReq(res);
      setEdit(null);
      setSent(true);
    } catch (err) {
      setSendErr(err.errors ? Object.values(err.errors)[0][0] : err.message);
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="mx-auto max-w-[860px] px-5 py-12 sm:px-8">
      <nav className="text-xs text-slate-500">
        <Link to="/akun" className="hover:text-primary">Akun Saya</Link> /{" "}
        <Link to="/pengajuan" className="hover:text-primary">Pengajuan Saya</Link> / {req.id}
      </nav>

      {state?.baru && !sent && (
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

      {req.status === "Ditolak" && (
        <section className="mt-6 rounded-xl border border-red-200 bg-red-50 p-5 text-sm text-red-800">
          <p className="font-bold">Pengajuan ditolak</p>
          <p className="mt-1">{[...req.history].reverse().find((h) => h.status === "Ditolak")?.note}</p>
        </section>
      )}

      <section className="mt-6 rounded-xl border border-line bg-white p-6">
        <h2 className="text-lg font-bold text-navy">{perbaikan ? "Perbaiki isian" : "Data pengajuan"}</h2>
        {perbaikan ? (
          <div className="mt-5">
            <RequestForm values={values} onChange={(p) => setEdit({ ...values, ...p })} errors={errors} notes={req.fieldNotes || {}} showJenis />
            {sendErr && <p role="alert" className="mt-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{sendErr}</p>}
            <button type="button" onClick={resubmit} disabled={sending} className="mt-6 rounded-lg bg-primary px-7 py-3 text-sm font-semibold text-white hover:bg-primary-dark disabled:opacity-70">
              {sending ? "Mengirim..." : "Kirim Ulang Pengajuan"}
            </button>
          </div>
        ) : (
          <dl className="mt-3 divide-y divide-line text-sm">
            {[
              ["Perihal / keperluan", req.perihal],
              ["Tanggal dibutuhkan", fmtDate(req.tanggal)],
              ["Keterangan tambahan", req.keterangan || "-"],
            ].map(([k, v]) => (
              <div key={k} className="grid gap-1 py-3 sm:grid-cols-3">
                <dt className="text-slate-500">{k}</dt>
                <dd className="font-semibold text-navy sm:col-span-2">{v}</dd>
              </div>
            ))}
            <div className="grid gap-1 py-3 sm:grid-cols-3">
              <dt className="text-slate-500">Lampiran</dt>
              <dd className="font-semibold text-navy sm:col-span-2"><LampiranList items={req.lampiran} /></dd>
            </div>
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