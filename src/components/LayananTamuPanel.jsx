import { Link } from "react-router-dom";
import { ArrowRightIcon, InformationCircleIcon } from "@heroicons/react/24/outline";
import { useFetch } from "../lib/api";
import { AKSES } from "../lib/tamu";

export default function LayananTamuPanel() {
  const { data, loading, error } = useFetch("/layanan-pengajuan");
  const list = data?.data ?? [];

  if (loading || error || list.length === 0) return null;

  return (
    <section id="layanan-umum" className="rounded-xl border border-line bg-white p-6 sm:p-7">
      <h2 className="text-xl font-bold text-navy">Layanan untuk umum</h2>
      <p className="mt-1 text-sm text-slate-600">
        Siswa, orang tua/wali, alumni, dan pihak luar bisa mengajukan layanan bertanda "Tanpa akun" tanpa membuat akun. Pengajuan akan diperiksa petugas TU.
      </p>

      <div className="mt-5 grid gap-4 sm:grid-cols-2">
        {list.map((l) => {
          const a = AKSES[l.akses] || AKSES.guest;
          return (
            <article key={l.id} className="flex flex-col rounded-xl border border-line p-5">
              <span className={`w-fit rounded-full border px-2.5 py-0.5 text-xs font-semibold ${a.cls}`}>{a.label}</span>
              <h3 className="mt-3 font-bold text-navy">{l.nama}</h3>
              {l.deskripsi && <p className="mt-1 text-sm text-slate-600">{l.deskripsi}</p>}

              {l.akses === "manual" && l.instruksi && (
                <p className="mt-3 flex gap-2 rounded-lg bg-amber-50 p-3 text-sm text-amber-900">
                  <InformationCircleIcon className="mt-0.5 h-5 w-5 shrink-0" />
                  <span>{l.instruksi}</span>
                </p>
              )}

              <div className="mt-auto pt-4">
                {l.akses === "guest" && (
                  <Link to={`/layanan/pengajuan/${l.slug}`} className="inline-flex items-center gap-1.5 text-sm font-semibold text-primary">
                    Ajukan tanpa akun <ArrowRightIcon className="h-4 w-4" />
                  </Link>
                )}
                {l.akses === "login" && (
                  <Link to="/login" state={{ from: "/ajukan" }} className="inline-flex items-center gap-1.5 text-sm font-semibold text-primary">
                    Masuk untuk mengajukan <ArrowRightIcon className="h-4 w-4" />
                  </Link>
                )}
              </div>
            </article>
          );
        })}
      </div>
    </section>
  );
}