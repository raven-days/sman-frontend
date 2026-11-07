import { useState } from "react";
import { api } from "../../lib/api";
import { useToast } from "../../context/Toast";
import { useSubmit } from "../../lib/useSubmit";
import Modal from "../../components/Modal";

const MAX_MB = 2;
const TEMPLAT = "\uFEFFNAMA,USERNAME,PERAN\nBudi Santoso,2024001,siswa\nSiti Aminah,siti.aminah,guru\n";
const aksiCls = "rounded-lg border border-line px-3 py-1.5 text-xs font-semibold text-navy transition-colors hover:bg-surface";

function unduh(nama, isi) {
  const url = URL.createObjectURL(new Blob([isi], { type: "text/csv;charset=utf-8" }));
  const a = document.createElement("a");
  a.href = url;
  a.download = nama;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

const sel = (v) => `"${String(v).replace(/"/g, '""')}"`;

export default function ImporAkun({ onClose, onSelesai }) {
  const toast = useToast();
  const [file, setFile] = useState(null);
  const [error, setError] = useState("");
  const [hasil, setHasil] = useState(null);

  const pilih = (e) => {
    const f = e.target.files?.[0];
    setError("");
    if (!f) return setFile(null);
    if (f.size > MAX_MB * 1024 * 1024) {
      setError(`Ukuran file maksimal ${MAX_MB} MB.`);
      e.target.value = "";
      return setFile(null);
    }
    setFile(f);
  };

  const [kirim, uploading] = useSubmit(async () => {
    if (!file) return setError("Pilih file terlebih dahulu.");
    setError("");
    try {
      const fd = new FormData();
      fd.append("file", file);
      setHasil(await api("/admin/akun/import", { method: "POST", body: fd }));
      onSelesai();
    } catch (err) {
      setError(err.errors ? Object.values(err.errors)[0][0] : err.message);
    }
  });

  const salinSemua = async () => {
    const teks = ["username\tnama\tperan\tsandi_sementara", ...hasil.dibuat.map((a) => `${a.username}\t${a.name}\t${a.role}\t${a.sandi}`)].join("\n");
    try {
      await navigator.clipboard.writeText(teks);
      toast.success("Daftar akun disalin.");
    } catch {
      toast.warning("Tidak bisa menyalin otomatis. Gunakan Unduh CSV.");
    }
  };

  const unduhHasil = () =>
    unduh(
      "akun-baru.csv",
      "\uFEFF" +
        ["username,nama,peran,sandi_sementara", ...hasil.dibuat.map((a) => [a.username, a.name, a.role, a.sandi].map(sel).join(","))].join("\n"),
    );

  // Tahap hasil: sandi hanya tampil sekali, jadi kotak ini hanya bisa ditutup lewat tombol.
  if (hasil) {
    return (
      <Modal
        title="Hasil impor akun"
        onClose={() => {}}
        footer={
          <button type="button" onClick={onClose} className="rounded-lg bg-primary px-5 py-2.5 text-sm font-semibold text-white hover:bg-primary-dark">
            Saya sudah menyimpan sandi
          </button>
        }
      >
        <p className="text-sm font-semibold text-navy">{hasil.message}</p>
        {hasil.dibuat.length > 0 && (
          <>
            <div className="mt-3 flex flex-wrap gap-2">
              <button type="button" onClick={salinSemua} className={aksiCls}>Salin semua</button>
              <button type="button" onClick={unduhHasil} className={aksiCls}>Unduh CSV</button>
            </div>
            <div className="mt-3 max-h-64 overflow-auto rounded-lg border border-line">
              <table className="w-full min-w-[420px] text-left text-xs">
                <thead className="sticky top-0 bg-surface uppercase tracking-wide text-slate-500">
                  <tr>
                    <th className="px-3 py-2">Username</th>
                    <th className="px-3 py-2">Nama</th>
                    <th className="px-3 py-2">Sandi sementara</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-line">
                  {hasil.dibuat.map((a) => (
                    <tr key={a.username}>
                      <td className="px-3 py-2">{a.username}</td>
                      <td className="px-3 py-2">{a.name}</td>
                      <td className="px-3 py-2"><code className="select-all font-semibold text-navy">{a.sandi}</code></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <p className="mt-3 rounded-lg border border-orange-200 bg-orange-50 px-3 py-2.5 text-sm text-orange-900">
              Sandi hanya tampil sekali. Simpan sekarang (Salin atau Unduh CSV) sebelum menutup kotak ini. Pemilik akun akan diminta membuat sandi baru saat pertama masuk.
            </p>
          </>
        )}
        {hasil.gagal.length > 0 && (
          <div className="mt-4">
            <p className="text-sm font-semibold text-red-700">Dilewati ({hasil.gagal.length})</p>
            <ul className="mt-1 max-h-40 list-disc space-y-1 overflow-auto pl-5 text-xs text-slate-700">
              {hasil.gagal.map((g, i) => (
                <li key={i}>Baris {g.baris} ({g.username || "kosong"}): {g.alasan}</li>
              ))}
            </ul>
            <p className="mt-2 text-xs text-slate-500">Perbaiki baris tersebut di file, lalu impor ulang hanya baris yang gagal.</p>
          </div>
        )}
      </Modal>
    );
  }

  return (
    <Modal title="Impor akun dari file" onClose={uploading ? () => {} : onClose}>
      <div className="space-y-3 text-sm text-slate-700">
        <p>
          Unggah file <b>.xlsx</b> atau <b>.csv</b> dengan tiga kolom: <b>NAMA</b>, <b>USERNAME</b>, <b>PERAN</b> (isi <code>siswa</code>, <code>guru</code>, atau <code>tu</code>). Staf TU hasil impor hanya mendapat izin antrian pengajuan dan bukan admin. Maksimal 100 akun per impor.       
          </p>
        <p className="rounded-lg bg-surface px-3 py-2 text-xs text-slate-600">
          Di Excel, format kolom USERNAME sebagai <b>Teks</b> sebelum mengetik NIS/NIP, supaya angka panjang tidak berubah.
        </p>
        <button type="button" onClick={() => unduh("templat-impor-akun.csv", TEMPLAT)} className={aksiCls}>
          Unduh templat CSV
        </button>
        <input
          type="file"
          accept=".xlsx,.xls,.csv"
          onChange={pilih}
          aria-label="File akun"
          className="block w-full text-sm file:mr-3 file:rounded-lg file:border file:border-line file:bg-white file:px-3 file:py-2 file:text-sm file:font-semibold file:text-navy"
        />
        {error && <p role="alert" className="text-xs font-medium text-red-600">{error}</p>}
      </div>
      <div className="mt-5 flex justify-end gap-3">
        <button type="button" onClick={onClose} disabled={uploading} className="rounded-lg border border-line px-4 py-2.5 text-sm font-semibold text-navy hover:bg-surface disabled:opacity-60">
          Batal
        </button>
        <button type="button" onClick={kirim} disabled={!file || uploading} className="rounded-lg bg-primary px-5 py-2.5 text-sm font-semibold text-white hover:bg-primary-dark disabled:opacity-70">
          {uploading ? "Memproses..." : "Impor"}
        </button>
      </div>
    </Modal>
  );
}