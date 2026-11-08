import { ArrowDownTrayIcon, BuildingOffice2Icon, CheckCircleIcon } from "@heroicons/react/24/outline";
import LampiranList from "./LampiranList";

// Hasil layanan untuk pemohon: petunjuk pengambilan dan dokumen hasil dari Tata Usaha.
export default function HasilPengajuan({ req }) {
  const adaDokumen = (req.hasil?.length ?? 0) > 0;
  const p = req.pengambilan;
  if (!["Disetujui", "Selesai"].includes(req.status) || (!adaDokumen && !p)) return null;

  const selesai = req.status === "Selesai";
  const Ikon = p?.mode === "unduh" ? ArrowDownTrayIcon : BuildingOffice2Icon;

  return (
    <section aria-labelledby="judul-hasil" className="mt-6 rounded-xl border border-green-200 bg-green-50/60 p-6">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h2 id="judul-hasil" className="flex items-center gap-2 text-lg font-bold text-navy">
          <CheckCircleIcon className="h-6 w-6 text-green-600" /> Hasil layanan
        </h2>
        <span className="rounded-full border border-green-200 bg-white px-3 py-1 text-xs font-semibold text-green-700">
          {selesai ? "Siap diambil / diunduh" : "Sedang disiapkan"}
        </span>
      </div>

      {p && (
        <div className="mt-4 flex gap-3 rounded-lg border border-green-200 bg-white p-4">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-green-50 text-green-700">
            <Ikon className="h-5 w-5" />
          </span>
          <div className="min-w-0">
            <p className="text-sm font-bold text-navy">
              {p.mode === "unduh" ? "Unduh dari portal" : "Ambil langsung di sekolah"}
            </p>
            <p className="mt-0.5 text-sm leading-6 text-slate-700">{p.ringkas}</p>
          </div>
        </div>
      )}

      {adaDokumen && (
        <div className="mt-4">
          <p className="mb-1.5 text-sm font-semibold text-navy">Dokumen hasil</p>
          <LampiranList items={req.hasil} />
        </div>
      )}
    </section>
  );
}