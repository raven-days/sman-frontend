import { Link } from "react-router-dom";
import { ArrowRightIcon, CheckCircleIcon } from "@heroicons/react/24/outline";
import { SERVICES, ALUR_STATUS, LABEL_ALUR } from "../data/content";
import ServiceIcon from "../components/ServiceIcon";
import CekStatusPanel from "../components/CekStatusPanel";
import DokumenPanel from "../components/DokumenPanel";
import LayananTamuPanel from "../components/LayananTamuPanel";

const SLUG = "administrasi-persuratan";

export default function AdministrasiPersuratan() {
  return (
    <div className="mx-auto max-w-[900px] px-5 py-12 sm:px-8">
      <nav className="text-xs text-slate-500">
        <Link to="/" className="hover:text-primary">Beranda</Link> /{" "}
        <Link to="/layanan" className="hover:text-primary">Layanan</Link> / Administrasi & Persuratan
      </nav>

      <div className="mt-4 flex items-center gap-4">
        <span className="flex h-14 w-14 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-primary">
          <ServiceIcon slug={SLUG} className="h-7 w-7" />
        </span>
        <div>
          <h1 className="text-3xl font-extrabold text-navy">Administrasi & Persuratan</h1>
          <p className="mt-1 text-sm text-slate-600">Ajukan surat, pantau prosesnya, dan lihat dokumen resmi sekolah.</p>
        </div>
      </div>

      {/* Fitur utama */}
      <section className="relative mt-8 overflow-hidden rounded-2xl bg-gradient-to-br from-navy to-primary p-7 text-white shadow-lg sm:p-9">
        <div aria-hidden="true" className="pointer-events-none absolute -right-12 -top-12 h-56 w-56 rounded-full bg-white/10" />
        <div aria-hidden="true" className="pointer-events-none absolute -bottom-20 right-28 h-44 w-44 rounded-full bg-white/5" />

        <span className="relative inline-block rounded-full bg-white/15 px-3 py-1 text-xs font-semibold tracking-wide">Layanan utama</span>
        <h2 className="relative mt-3 text-2xl font-extrabold sm:text-3xl">Ajukan Layanan</h2>
        <p className="relative mt-2 max-w-xl text-sm leading-6 text-blue-100">
          Isi formulir, unggah dokumen pendukung, lalu pantau prosesnya sampai surat selesai.
        </p>

        <ul className="relative mt-5 flex flex-wrap gap-x-6 gap-y-2 text-sm">
          {["Isi formulir online", "Unggah dokumen pendukung", "Pantau status setiap tahap"].map((t) => (
            <li key={t} className="flex items-center gap-2">
              <CheckCircleIcon className="h-5 w-5 text-blue-200" /> {t}
            </li>
          ))}
        </ul>

        <Link
          to="/ajukan"
          className="relative mt-7 inline-flex items-center gap-2 rounded-lg bg-white px-6 py-3 text-sm font-bold text-navy transition-colors hover:bg-blue-50"
        >
          Ajukan Layanan <ArrowRightIcon className="h-4 w-4" />
        </Link>
      </section>

      <div className="mt-6 space-y-6">
        <LayananTamuPanel />
        <CekStatusPanel />

        {/* Alur proses */}
        <section className="rounded-xl border border-line bg-white p-6 sm:p-7">
          <h2 className="text-xl font-bold text-navy">Alur proses pengajuan</h2>
          <ol className="mt-5 grid gap-4 sm:grid-cols-3 lg:grid-cols-6">
            {ALUR_STATUS.map((s, i) => (
              <li key={s} className="flex items-start gap-3 sm:flex-col sm:items-center sm:text-center">
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary text-sm font-bold text-white">{i + 1}</span>
                <span className="text-sm font-semibold leading-snug text-navy">{LABEL_ALUR[s]}</span>
              </li>
            ))}
          </ol>
        </section>

        <DokumenPanel />
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