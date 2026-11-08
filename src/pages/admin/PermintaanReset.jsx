import { useCallback, useEffect, useState } from "react";
import { api } from "../../lib/api";
import { useToast } from "../../context/Toast";
import { useConfirm } from "../../context/Confirm";

const TAB = [
  { id: "baru", label: "Menunggu" },
  { id: "selesai", label: "Selesai" },
  { id: "ditolak", label: "Ditolak" },
];
const LENCANA = {
  baru: "border-orange-200 bg-orange-50 text-orange-800",
  selesai: "border-green-200 bg-green-50 text-green-700",
  ditolak: "border-slate-200 bg-slate-50 text-slate-600",
};

export default function PermintaanReset() {
  const toast = useToast();
  const confirm = useConfirm();
  const [daftar, setDaftar] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [tab, setTab] = useState("baru");
  const [sibuk, setSibuk] = useState(false);

  const muat = useCallback(async () => {
    try {
      setDaftar(await api("/admin/permintaan-reset"));
      setError("");
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, []);
  useEffect(() => { muat(); }, [muat]);

  const proses = async (p, status) => {
    const selesai = status === "selesai";
    const ya = await confirm({
      title: selesai ? "Tandai permintaan selesai?" : "Tolak permintaan ini?",
      description: selesai
        ? "Pastikan kata sandi sementara sudah diberikan lewat Kelola Pengguna, lalu tandai selesai."
        : "Permintaan ditutup tanpa mengatur ulang kata sandi.",
      items: [
        { label: "Username", value: p.username },
        { label: "Akun", value: p.akun_ada ? `${p.nama} (${p.role})` : "Tidak ditemukan" },
      ],
      confirmText: selesai ? "Tandai selesai" : "Tolak",
      tone: selesai ? "primary" : "warning",
    });
    if (!ya) return;
    setSibuk(true);
    try {
      setDaftar(await api(`/admin/permintaan-reset/${p.id}`, { method: "POST", body: { status } }));
      toast.success(selesai ? "Permintaan ditandai selesai." : "Permintaan ditolak.");
    } catch (err) {
      toast.galat(err);
    } finally {
      setSibuk(false);
    }
  };

  const tampil = daftar.filter((p) => p.status === tab);
  const jumlah = (id) => daftar.filter((p) => p.status === id).length;

  return (
    <>
      <h1 className="text-2xl font-extrabold text-navy">Permintaan Reset Sandi</h1>
      <p className="mt-1 text-sm text-slate-600">
        Pengguna yang lupa kata sandi mengirim permintaan dari halaman masuk. Periksa identitasnya, atur ulang kata sandi
        di <b>Kelola Akun</b> (Reset kata sandi), berikan kata sandi sementara langsung ke orangnya, lalu tandai selesai di sini.
      </p>

      <div role="tablist" aria-label="Status" className="mt-5 inline-flex rounded-xl bg-surface p-1">
        {TAB.map((t) => (
          <button
            key={t.id}
            role="tab"
            type="button"
            aria-selected={tab === t.id}
            onClick={() => setTab(t.id)}
            className={`rounded-lg px-4 py-2 text-sm font-semibold transition-colors ${tab === t.id ? "bg-white text-primary shadow-sm" : "text-slate-500 hover:text-navy"}`}
          >
            {t.label} <span className="ml-1 text-xs opacity-70">{jumlah(t.id)}</span>
          </button>
        ))}
      </div>

      {error && (
        <div role="alert" className="mt-5 flex flex-wrap items-center justify-between gap-3 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          <span>{error}</span>
          <button type="button" onClick={muat} className="font-semibold underline">Coba lagi</button>
        </div>
      )}
      {loading && <div role="status" aria-label="Memuat" className="skeleton mt-6 h-32 rounded-xl" />}
      {!loading && !error && tampil.length === 0 && (
        <p className="mt-6 rounded-xl border border-dashed border-line bg-surface/60 px-4 py-10 text-center text-sm text-slate-500">
          Tidak ada permintaan.
        </p>
      )}

      <ul className="mt-5 space-y-3">
        {tampil.map((p) => (
          <li key={p.id} className="flex flex-wrap items-start justify-between gap-4 rounded-xl border border-line bg-white p-4">
            <div className="min-w-0 flex-1">
              <p className="font-semibold text-navy">
                {p.username}
                <span className={`ml-2 rounded-full border px-2.5 py-0.5 text-xs font-semibold ${LENCANA[p.status]}`}>
                  {TAB.find((t) => t.id === p.status)?.label}
                </span>
              </p>
              <p className="mt-1 text-sm text-slate-600">
                {p.akun_ada ? (
                  <>
                    {p.nama} · {p.role}
                    {p.akun_aktif === false && <span className="ml-2 font-semibold text-red-600">akun nonaktif</span>}
                  </>
                ) : (
                  <span className="font-semibold text-red-600">Akun dengan username ini tidak ditemukan</span>
                )}
              </p>
              {p.catatan && <p className="mt-2 whitespace-pre-line rounded-lg bg-surface px-3 py-2 text-sm text-slate-700">{p.catatan}</p>}
              <p className="mt-2 text-xs text-slate-500">Diajukan {p.waktu}</p>
            </div>
            {p.status === "baru" && (
              <div className="flex gap-2">
                <button type="button" disabled={sibuk} onClick={() => proses(p, "ditolak")} className="rounded-lg border border-line px-3 py-2 text-xs font-semibold text-navy hover:bg-surface disabled:opacity-50">
                  Tolak
                </button>
                <button type="button" disabled={sibuk} onClick={() => proses(p, "selesai")} className="press rounded-lg bg-primary px-3 py-2 text-xs font-semibold text-white hover:bg-primary-dark disabled:opacity-50">
                  Tandai selesai
                </button>
              </div>
            )}
          </li>
        ))}
      </ul>
    </>
  );
}