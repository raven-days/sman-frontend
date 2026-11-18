import { Link } from "react-router-dom";
import { useToast } from "../context/Toast";

// "Tanda terima": dicetak atau di-screenshot pemohon sebagai bukti.
export default function BuktiTamu({ hasil, layanan }) {
  const toast = useToast();

  const salin = async (teks, nama) => {
    try {
      await navigator.clipboard.writeText(teks);
      toast.success(`${nama} disalin.`);
    } catch {
      toast.warning("Tidak bisa menyalin otomatis. Salin secara manual.");
    }
  };

  return (
    <section className="mx-auto max-w-[560px]">
      <div className="rounded-xl border-2 border-dashed border-navy/40 bg-white p-6 sm:p-8 print:border-solid">
        <h1 className="text-3xl font-extrabold text-navy">Pengajuan diterima</h1>
        <p className="mt-2 text-sm text-slate-600">
          {hasil.pesan} <strong>PIN hanya tampil sekali</strong> dan tidak bisa dilihat lagi.
        </p>

        <dl className="mt-6 divide-y divide-line border-y border-line text-sm">
          <div className="flex flex-wrap items-center justify-between gap-2 py-4">
            <dt className="text-slate-600">Kode pengajuan</dt>
            <dd className="font-mono text-2xl font-semibold tracking-wider text-navy">{hasil.kode}</dd>
          </div>
          <div className="flex flex-wrap items-center justify-between gap-2 py-4">
            <dt className="text-slate-600">PIN</dt>
            <dd className="font-mono text-2xl font-semibold tracking-[0.3em] text-navy">{hasil.pin}</dd>
          </div>
          {layanan && (
            <div className="flex flex-wrap items-center justify-between gap-2 py-3">
              <dt className="text-slate-600">Layanan</dt>
              <dd className="font-semibold text-navy">{layanan.nama}</dd>
            </div>
          )}
          <div className="flex flex-wrap items-center justify-between gap-2 py-3">
            <dt className="text-slate-600">Status</dt>
            <dd className="font-semibold text-navy">Menunggu verifikasi</dd>
          </div>
        </dl>

        <div className="mt-6 flex flex-wrap gap-3 print:hidden">
          <button type="button" onClick={() => window.print()} className="rounded-lg bg-primary px-5 py-2.5 text-sm font-semibold text-white hover:bg-primary-dark">
            Cetak bukti
          </button>
          <button
            type="button"
            onClick={() => salin(`Kode: ${hasil.kode}\nPIN: ${hasil.pin}`, "Kode dan PIN")}
            className="rounded-lg border border-line bg-white px-5 py-2.5 text-sm font-semibold text-navy hover:bg-surface"
          >
            Salin kode dan PIN
          </button>
        </div>
      </div>

      <p className="mt-6 text-sm text-slate-600 print:hidden">
        Untuk memeriksa perkembangan, buka{" "}
        <Link to={`/lacak?kode=${encodeURIComponent(hasil.kode)}`} className="font-semibold text-primary underline">
          halaman Lacak
        </Link>{" "}
        lalu masukkan kode dan PIN di atas.
      </p>
    </section>
  );
}