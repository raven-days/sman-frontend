import { Link, useLocation } from "react-router-dom";
import { WrenchScrewdriverIcon } from "@heroicons/react/24/outline";

export default function ComingSoon() {
  const { pathname } = useLocation();
  return (
    <div className="mx-auto flex max-w-[600px] flex-col items-center px-5 py-24 text-center">
      <span className="flex h-16 w-16 items-center justify-center rounded-full bg-blue-50 text-primary">
        <WrenchScrewdriverIcon className="h-8 w-8" />
      </span>
      <h1 className="mt-6 text-2xl font-extrabold text-navy">Halaman sedang dikembangkan</h1>
      <p className="mt-2 text-sm text-slate-600">
        Halaman <code className="rounded bg-surface px-1.5 py-0.5">{pathname}</code> belum tersedia pada tahap ini.
      </p>
      <Link to="/" className="mt-7 rounded-lg bg-primary px-6 py-3 text-sm font-semibold text-white hover:bg-primary-dark">
        Kembali ke beranda
      </Link>
    </div>
  );
}
