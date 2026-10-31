import { useState } from "react";
import { Link, useParams } from "react-router-dom";
import { useApp } from "../context/AppState";
import { fmtDate } from "../lib/format";
import { FIELD_LABELS } from "../data/content";
import StatusBadge from "../components/StatusBadge";
import Timeline from "../components/Timeline";
import Modal from "../components/Modal";

const NOTE_FIELDS = ["jenis", "perihal", "tanggal", "keterangan", "lampiran"];
const btn = "rounded-lg px-5 py-2.5 text-sm font-semibold";

export default function PetugasDetail() {
  const { id } = useParams();
  const { user, requests, dispatch } = useApp();
  const req = requests.find((r) => r.id === id);
  const [modal, setModal] = useState(null); // "perbaikan" | "tolak" | null
  const [umum, setUmum] = useState("");
  const [fields, setFields] = useState({});
  const [alasan, setAlasan] = useState("");
  const [err, setErr] = useState("");
  const [toast, setToast] = useState("");

  if (!req) {
    return (
      <div className="mx-auto max-w-[600px] px-5 py-24 text-center">
        <h1 className="text-2xl font-extrabold text-navy">Pengajuan tidak ditemukan</h1>
        <Link to="/petugas" className="mt-6 inline-block font-semibold text-primary">Kembali ke antrian</Link>
      </div>
    );
  }

  const go = (status, note = "", fieldNotes = {}) => {
    dispatch({ type: "STATUS", id: req.id, status, by: user.name, note, fieldNotes });
    setToast(`Status diubah menjadi ${status}.`);
    setModal(null);
    setUmum(""); setFields({}); setAlasan(""); setErr("");
  };

  const kirimPerbaikan = () => {
    const fieldNotes = Object.fromEntries(Object.entries(fields).filter(([, v]) => v.trim()).map(([k, v]) => [k, v.trim()]));
    if (!umum.trim() && Object.keys(fieldNotes).length === 0) return setErr("Isi catatan umum atau minimal satu catatan pada kolom.");
    go("Perlu Perbaikan", umum.trim() || "Mohon perbaiki isian sesuai catatan pada kolom yang ditandai, lalu kirim ulang.", fieldNotes);
  };

  const tolak = () => {
    if (alasan.trim().length < 5) return setErr("Alasan penolakan wajib diisi.");
    go("Ditolak", alasan.trim());
  };

  const s = req.status;
  return (
    <div className="mx-auto max-w-[900px] px-5 py-12 sm:px-8">
      <nav className="text-xs text-slate-500">
        <Link to="/akun" className="hover:text-primary">Akun Saya</Link> /{" "}
        <Link to="/petugas" className="hover:text-primary">Antrian Pengajuan</Link> / {req.id}
      </nav>

      {toast && <p role="status" className="mt-4 rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-800">{toast}</p>}

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
            ["Lampiran", req.lampiran.length ? req.lampiran.join(", ") : "Tidak ada"],
          ].map(([k, v]) => (
            <div key={k} className="grid gap-1 py-3 sm:grid-cols-3">
              <dt className="text-slate-500">{k}</dt>
              <dd className="font-semibold text-navy sm:col-span-2">{v}</dd>
            </div>
          ))}
        </dl>
      </section>

      <section className="mt-6 rounded-xl border border-line bg-white p-6">
        <h2 className="text-lg font-bold text-navy">Tindakan</h2>
        {s === "Perlu Perbaikan" && <p className="mt-2 text-sm text-slate-600">Menunggu pemohon memperbaiki isian dan mengirim ulang.</p>}
        {(s === "Ditolak" || s === "Selesai") && <p className="mt-2 text-sm text-slate-600">Pengajuan ini sudah final.</p>}
        <div className="mt-4 flex flex-wrap gap-3">
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
          onClose={() => setModal(null)}
          footer={
            <>
              <button type="button" onClick={() => setModal(null)} className={`${btn} border border-line`}>Batal</button>
              <button type="button" onClick={kirimPerbaikan} className={`${btn} bg-primary text-white hover:bg-primary-dark`}>Kirim ke Pemohon</button>
            </>
          }
        >
          <p className="text-sm text-slate-600">Pengajuan akan ditunda. Tuliskan bagian yang salah supaya pemohon bisa memperbaikinya.</p>
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
          title="Tolak pengajuan"
          onClose={() => setModal(null)}
          footer={
            <>
              <button type="button" onClick={() => setModal(null)} className={`${btn} border border-line`}>Batal</button>
              <button type="button" onClick={tolak} className={`${btn} bg-red-600 text-white hover:bg-red-700`}>Tolak Pengajuan</button>
            </>
          }
        >
          <p className="text-sm text-slate-600">Penolakan bersifat final. Jika isian hanya perlu dibetulkan, gunakan Minta Perbaikan.</p>
          <label htmlFor="alasan" className="mt-4 block text-sm font-semibold text-navy">Alasan penolakan <span className="text-red-600">*</span></label>
          <textarea id="alasan" rows={3} value={alasan} onChange={(e) => setAlasan(e.target.value)} className="mt-1 w-full rounded-lg border border-line px-3 py-2 text-sm" />
          {err && <p role="alert" className="mt-2 text-xs font-medium text-red-600">{err}</p>}
        </Modal>
      )}
    </div>
  );
}
