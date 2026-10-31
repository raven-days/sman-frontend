import { Link } from "react-router-dom";
import { ArrowRightIcon, ScaleIcon } from "@heroicons/react/24/outline";
import { SERVICES } from "../data/content";
import ServiceIcon from "../components/ServiceIcon";

export default function LayananList() {
  return (
    <div className="mx-auto max-w-[1000px] px-5 py-14 sm:px-8">
      <h1 className="text-3xl font-extrabold text-navy">Daftar Layanan</h1>
      <p className="mt-2 text-sm text-slate-600">Lima kelompok layanan Tata Usaha SMA Negeri 104 Jakarta.</p>

      <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {SERVICES.map((s) => (
          <Link
            key={s.slug}
            to={`/layanan/${s.slug}`}
            className="group flex items-center gap-4 rounded-xl border border-line bg-white p-5 hover:shadow-lg"
          >
            <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-primary">
              <ServiceIcon slug={s.slug} />
            </span>
            <span className="flex-1 font-bold leading-snug text-navy">{s.title}</span>
            <ArrowRightIcon className="h-4 w-4 text-primary transition-transform group-hover:translate-x-1" />
          </Link>
        ))}
        <Link
          to="/surat-keputusan"
          className="group flex items-center gap-4 rounded-xl border border-line bg-surface p-5 hover:bg-blue-50"
        >
          <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-white text-primary">
            <ScaleIcon className="h-6 w-6" />
          </span>
          <span className="flex-1">
            <span className="block font-bold leading-snug text-navy">Surat Keputusan</span>
            <span className="block text-xs text-slate-600">Terbuka untuk semua pengguna</span>
          </span>
          <ArrowRightIcon className="h-4 w-4 text-primary transition-transform group-hover:translate-x-1" />
        </Link>
      </div>
    </div>
  );
}
