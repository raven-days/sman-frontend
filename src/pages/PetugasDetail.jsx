import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { api } from "../lib/api";
import { useToast } from "../context/Toast";
import { useSubmit } from "../lib/useSubmit";
import Field, { inputCls } from "../components/Field";
import { fmtDate } from "../lib/format";
import { FIELD_LABELS } from "../data/content";
import StatusBadge from "../components/StatusBadge";
import Timeline from "../components/Timeline";
import LampiranList from "../components/LampiranList";
import Modal from "../components/Modal";

const NOTE_FIELDS = ["jenis", "perihal", "tanggal", "keterangan", "lampiran"];
const btn = "rounded-lg px-5 py-2.5 text-sm font-semibold";

export default function PetugasDetail() {
  const { id } = useParams();
  const toast = useToast();
  const [req, setReq] = useState(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [modal, setModal] = useState(null); // "perbaikan" | "tolak" | null
  const [umum, setUmum] = useState("");
  const [fields, setFields] = useState({});
  const [alasan, setAlasan] = useState("");
  const [err, setErr] = useState("");
  const [errAlasan, setErrAlasan] = useState("");

  // Ubah status. Dijaga agar tidak bisa terkirim dua kali (klik ganda).
  const [go, saving] = useSubmit(async (status, note = "", fieldNotes = {}) => {
    setErr("");
    try {
      const res = await api(`/admin/pengajuan/${id}/status`, {
        method: "POST",
        body: { status, catatan: note, catatan_field: fieldNotes },
      });
      setReq(res);
      toast.success(`Status pengajuan ${res.id} diubah menjadi ${status}.`);
      setModal(null);
      setUmum(""); setFields({}); setAlasan(""); setErrAlasan("");
    } catch (e) {
      if (modal) setErr(e.message);
      else toast.galat(e);
    }
  });

  useEffect(() => {
    let batal = false;
    api(`/pengajuan/${id}`)
      .then((d) => { if (!batal) { setReq(d); setLoading(false); } })
      .catch(() => { if (!batal) { setNotFound(true); setLoading(false); } });
    return () => { batal = true; };
  }, [id]);

  if (loading) return <p className="px-5 py-24 text-center text-sm text-slate-500">Memuat data...</p>;
  if (notFound || !req) {
    return (
      <div className="mx-auto max-w-[600px] px-5 py-24 text-center">
        <h1 className="text-2xl font-extrabold text-navy">Pengajuan tidak ditemukan</h1>
        <Link to="/petugas" className="mt-6 inline-block font-semibold text-primary">Kembali ke antrian</Link>
      </div>
    );
  }

  const kirimPerbaikan = () => {
    const fieldNotes = Object.fromEntries(Object.entries(fields).filter(([, v]) => v.trim()).map(([k, v]) => [k, v.trim()]));
    if (!umum.trim() && Object.keys(fieldNotes).length === 0) return setErr("Isi catatan umum atau minimal satu catatan pada kolom.");
    go("Perlu Perbaikan", umum.trim() || "Mohon perbaiki isian sesuai catatan pada kolom yang ditandai, lalu kirim ulang.", fieldNotes);
  };

  const cekAlasan = (v) => (v.trim().length < 5 ? "Alasan penolakan wajib diisi (minimal 5 karakter)." : "");
  const tolak = () => {
    const m = cekAlasan(alasan);
    setErrAlasan(m);
    if (m) return;
    go("Ditolak", alasan.trim());
  };

  const s = req.status;
  return (
    <div className="mx-auto max-w-[900px] px-5 py-12 sm:px-8">
      <nav className="text-xs text-slate-500">
        <Link to="/akun" className="hover:text-primary">Akun Saya</Link> /{" "}
        <Link to="/petugas" className="hover:text-primary">Antrian Pengajuan</Link> / {req.id}
      </nav>

      <div className="mt-4 flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-xs text-slate-500">Nomor pengajuan</p>
          <h1 className="font-display text-2xl font-extrabold text-navy">{req.id}</h1>
          <p className="text-sm text-slate-600">{req.jenis} · {req.pemohon}{req.revisi > 0 ? ` · revisi ke-${req.revisi}` : ""}</p>
        </div>
        <StatusBadge status={s} />
      </div>

      <section className="mt-6 rounded-xl border border-line bg-white p-6">
        <h2 className="text-lg font-bold text-navy">Data pengajuan</h2>
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
      </section>

      <section className="mt-6 rounded-xl border border-line bg-white p-6">
        <h2 className="text-lg font-bold text-navy">Tindakan</h2>
        {s === "Perlu Perbaikan" && <p className="mt-2 text-sm text-slate-600">Menunggu pemohon memperbaiki isian dan mengirim ulang.</p>}
        {(s === "Ditolak" || s === "Selesai") && <p className="mt-2 text-sm text-slate-600">Pengajuan ini sudah final.</p>}
        <div className={`mt-4 flex flex-wrap gap-3 ${saving ? "pointer-events-none opacity-60" : ""}`}>
          {s === "Menunggu" && <button type="button" onClick={() => go("Diverifikasi", "Berkas sudah diperiksa.")} className={`${btn} bg-primary text-white hover:bg-primary-dark`}>Verifikasi</button>}
          {s === "Diverifikasi" && <button type="button" onClick={() => go("Disetujui")} className={`${btn} bg-green-600 text-white hover:bg-green-700`}>Setujui</button>}
          {s === "Disetujui" && <button type="button" onClick={() => go("Selesai", "Hasil sudah dapat diambil di Tata Usaha.")} className={`${btn} bg-green-600 text-white hover:bg-green-700`}>Tandai Selesai</button>}
          {(s === "Menunggu" || s === "Diverifikasi") && (
            <>
              <button type="button" onClick={() => { setErr(""); setModal("perbaikan"); }} className={`${btn} border border-orange-300 bg-orange-50 text-orange-800 hover:bg-orange-100`}>Minta Perbaikan</button>
              <button type="button" onClick={() => { setErr(""); setModal("tolak"); }} className={`${btn} border border-red-200 bg-red-50 text-red-700 hover:bg-red-100`}>Tolak</button>
            </>
          )}
        </div>
      </section>

      <section className="mt-6 rounded-xl border border-line bg-white p-6">
        <h2 className="mb-4 text-lg font-bold text-navy">Riwayat status</h2>
        <Timeline history={req.history} status={s} />
      </section>

      {modal === "perbaikan" && (
        <Modal
          title="Minta perbaikan"
          locked={saving}
          onClose={() => setModal(null)}
          footer={
            <>
              <button type="button" disabled={saving} onClick={() => setModal(null)} className={`${btn} border border-line transition-colors hover:bg-surface disabled:opacity-60`}>Batal</button>
              <button type="button" disabled={saving} onClick={kirimPerbaikan} className={`${btn} bg-primary text-white transition-colors hover:bg-primary-dark disabled:opacity-70`}>{saving ? "Mengirim..." : "Kirim ke Pemohon"}</button>
            </>
          }
        >
          <p className="text-sm text-slate-600">
            Pengajuan <b>{req.id}</b> dari <b>{req.pemohon}</b> akan ditunda. Tuliskan bagian yang salah supaya pemohon bisa memperbaikinya.
          </p>
          <label htmlFor="umum" className="mt-4 block text-sm font-semibold text-navy">Catatan umum</label>
          <textarea id="umum" rows={2} value={umum} onChange={(e) => setUmum(e.target.value)} className="mt-1 w-full rounded-lg border border-line px-3 py-2 text-sm" />
          <p className="mt-4 text-sm font-semibold text-navy">Catatan per kolom (opsional)</p>
          {NOTE_FIELDS.map((f) => (
            <div key={f} className="mt-2">
              <label htmlFor={`n-${f}`} className="text-xs text-slate-500">{FIELD_LABELS[f]}</label>
              <input id={`n-${f}`} value={fields[f] || ""} onChange={(e) => setFields({ ...fields, [f]: e.target.value })} placeholder="Contoh: perihal belum jelas" className="h-10 w-full rounded-lg border border-line px-3 text-sm" />
            </div>
          ))}
          {err && <p role="alert" className="mt-3 text-xs font-medium text-red-600">{err}</p>}
        </Modal>
      )}

      {modal === "tolak" && (
        <Modal
          title="Tolak pengajuan ini?"
          role="alertdialog"
          locked={saving}
          onClose={() => setModal(null)}
          footer={
            <>
              <button type="button" data-autofocus disabled={saving} onClick={() => setModal(null)} className={`${btn} border border-line transition-colors hover:bg-surface disabled:opacity-60`}>Batal</button>
              <button type="button" disabled={saving} onClick={tolak} className={`${btn} bg-red-600 text-white transition-colors hover:bg-red-700 disabled:opacity-70`}>{saving ? "Memproses..." : "Ya, Tolak Pengajuan"}</button>
            </>
          }
        >
          <dl className="divide-y divide-line rounded-lg border border-line bg-surface text-sm">
            {[["Nomor", req.id], ["Layanan", req.jenis], ["Pemohon", req.pemohon], ["Perihal", req.perihal]].map(([k, v]) => (
              <div key={k} className="grid gap-1 px-3 py-2 sm:grid-cols-3">
                <dt className="text-slate-500">{k}</dt>
                <dd className="break-words font-semibold text-navy sm:col-span-2">{v}</dd>
              </div>
            ))}
          </dl>
          <p className="mt-4 rounded-lg border border-red-200 bg-red-50 px-3 py-2.5 text-sm text-red-800">
            Penolakan bersifat final dan pemohon tidak bisa mengirim ulang. Jika isian hanya perlu dibetulkan, gunakan Minta Perbaikan.
          </p>
          <Field label="Alasan penolakan" required error={errAlasan} className="mt-4">
            {(p) => (
              <textarea
                {...p}
                rows={3}
                value={alasan}
                onChange={(e) => { setAlasan(e.target.value); if (errAlasan) setErrAlasan(cekAlasan(e.target.value)); }}
                onBlur={() => setErrAlasan(cekAlasan(alasan))}
                className={`${inputCls(errAlasan)} py-2`}
              />
            )}
          </Field>
          {err && <p role="alert" className="mt-2 text-xs font-medium text-red-600">{err}</p>}
        </Modal>
      )}
    </div>
  );
}