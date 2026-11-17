import { Link } from "react-router-dom";
import { SERVICES } from "../data/content";
import ServiceIcon from "../components/ServiceIcon";
import AnggaranPanel from "../components/AnggaranPanel";

const SLUG = "anggaran";

export default function Anggaran() {
  return (
    <div className="mx-auto max-w-[1000px] px-5 py-12 sm:px-8">
      <nav className="text-xs text-slate-500">
        <Link to="/" className="hover:text-primary">Beranda</Link> /{" "}
        <Link to="/layanan" className="hover:text-primary">Layanan</Link> / Anggaran
      </nav>

      <div className="mt-4 flex items-center gap-4">
        <span className="flex h-14 w-14 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-primary">
          <ServiceIcon slug={SLUG} className="h-7 w-7" />
        </span>
        <div>
          <h1 className="text-3xl font-extrabold text-navy">Anggaran</h1>
          <p className="mt-1 text-sm text-slate-600">Regulasi pengelolaan dana dan laporan penggunaan dana sekolah.</p>
        </div>
      </div>

      <div className="mt-8">
        <AnggaranPanel />
      </div>

      <div className="mt-10 border-t border-line pt-6">
        <p className="text-sm font-semibold text-navy">Layanan lainnya</p>
        <div className="mt-3 flex flex-wrap gap-2">
          {SERVICES.filter((x) => x.slug !== SLUG).map((x) => (
            <Link key={x.slug} to={`/layanan/${x.slug}`} className="rounded-full border border-line px-4 py-1.5 text-sm text-navy hover:bg-blue-50">
              {x.title}
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}