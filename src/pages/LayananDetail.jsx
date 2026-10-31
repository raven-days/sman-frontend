import { Link, useParams } from "react-router-dom";
import { ArrowRightIcon } from "@heroicons/react/24/outline";
import { SERVICES, ACCESS, ROLES } from "../data/content";
import { useApp } from "../context/AppState";
import ServiceIcon from "../components/ServiceIcon";
import ComingSoon from "./ComingSoon";

const TBD = "[menunggu konfirmasi Tata Usaha]";

// Pintasan fitur yang sudah tersedia pada tiap layanan.
const SHORTCUTS = {
  "administrasi-persuratan": [
    { to: "/ajukan", title: "Ajukan layanan", sub: "Isi formulir pengajuan" },
    { to: "/cek-status", title: "Cek status pengajuan", sub: "Pantau dengan nomor pengajuan" },
    { to: "/surat-keputusan", title: "Surat Keputusan", sub: "Terbuka untuk semua pengguna" },
  ],
};

export default function LayananDetail() {
  const { slug } = useParams();
  const { user } = useApp();
  const s = SERVICES.find((x) => x.slug === slug);
  if (!s) return <ComingSoon />;

  const shortcuts = SHORTCUTS[slug];
  const rows = [
    { id: "publik", label: "Publik (tanpa masuk)", text: "Hanya halaman informasi ini" },
    ...ROLES.map((r) => ({ id: r.id, label: r.label, text: ACCESS[r.id][slug] })),
  ];

  return (
    <div className="mx-auto max-w-[900px] px-5 py-14 sm:px-8">
      <nav className="text-xs text-slate-500">
        <Link to="/" className="hover:text-primary">Beranda</Link> /{" "}
        <Link to="/layanan" className="hover:text-primary">Layanan</Link> / {s.title}
      </nav>

      <div className="mt-4 flex items-center gap-4">
        <span className="flex h-14 w-14 items-center justify-center rounded-xl bg-blue-50 text-primary">
          <ServiceIcon slug={slug} className="h-7 w-7" />
        </span>
        <h1 className="text-3xl font-extrabold text-navy">{s.title}</h1>
      </div>

      <section className="mt-8 rounded-xl border border-line bg-white p-6">
        <h2 className="text-lg font-bold text-navy">Layanan yang tersedia</h2>
        {shortcuts ? (
          <div className="mt-4 grid gap-3 sm:grid-cols-3">
            {shortcuts.map((c) => (
              <Link key={c.to} to={c.to} className="group rounded-xl border border-line p-4 hover:bg-blue-50">
                <span className="flex items-center justify-between font-bold text-navy">
                  {c.title}
                  <ArrowRightIcon className="h-4 w-4 text-primary transition-transform group-hover:translate-x-1" />
                </span>
                <span className="mt-1 block text-xs text-slate-600">{c.sub}</span>
              </Link>
            ))}
          </div>
        ) : (
          <p className="mt-2 text-sm text-slate-500">{TBD}</p>
        )}
      </section>

      <div className="mt-5 grid gap-5 sm:grid-cols-2">
        <section className="rounded-xl border border-line bg-white p-6">
          <h2 className="font-bold text-navy">Syarat dokumen</h2>
          <p className="mt-2 text-sm text-slate-500">{TBD}</p>
        </section>
        <section className="rounded-xl border border-line bg-white p-6">
          <h2 className="font-bold text-navy">Estimasi waktu</h2>
          <p className="mt-2 text-sm text-slate-500">{TBD}</p>
        </section>
      </div>

      <section className="mt-5 rounded-xl border border-line bg-white p-6">
        <h2 className="font-bold text-navy">Siapa yang dapat mengakses fitur layanan ini</h2>
        <p className="mt-1 text-xs text-slate-500">Usulan hak akses, menunggu konfirmasi sekolah. Menu yang terbuka mengikuti peran akun yang masuk.</p>
        <div className="mt-4 overflow-x-auto">
          <table className="w-full text-left text-sm">
            <tbody className="divide-y divide-line">
              {rows.map((r) => (
                <tr key={r.id} className={user?.role === r.id ? "bg-blue-50" : ""}>
                  <th scope="row" className="w-48 px-3 py-2.5 font-semibold text-navy">
                    {r.label}
                    {user?.role === r.id && <span className="ml-2 text-xs font-normal text-primary">(akun Anda)</span>}
                  </th>
                  <td className={`px-3 py-2.5 ${r.text ? "text-slate-700" : "text-slate-400"}`}>{r.text || "Tidak tersedia"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {slug === "administrasi-persuratan" && (
        <Link to="/ajukan" className="mt-8 inline-block rounded-lg bg-primary px-6 py-3 text-sm font-semibold text-white hover:bg-primary-dark">
          Ajukan Layanan
        </Link>
      )}

      <div className="mt-10 border-t border-line pt-6">
        <p className="text-sm font-semibold text-navy">Layanan lainnya</p>
        <div className="mt-3 flex flex-wrap gap-2">
          {SERVICES.filter((x) => x.slug !== slug).map((x) => (
            <Link key={x.slug} to={`/layanan/${x.slug}`} className="rounded-full border border-line px-4 py-1.5 text-sm text-navy hover:bg-blue-50">
              {x.title}
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
