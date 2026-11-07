import { useMemo, useState } from "react";
import {
  MapPinIcon,
  PhoneIcon,
  EnvelopeIcon,
  ClockIcon,
  ChatBubbleLeftRightIcon,
  MagnifyingGlassIcon,
} from "@heroicons/react/24/outline";
import { useFetch, DEMO } from "../lib/api";
import { useKontak } from "../lib/useKontak";
import FaqAccordion from "../components/FaqAccordion";

const tel = (v) => `tel:${v.replace(/[^0-9+]/g, "")}`;
const btn =
  "inline-flex items-center gap-2 rounded-lg px-5 py-2.5 text-sm font-semibold transition-colors";

export default function Kontak() {
  const k = useKontak();
  const { data, loading, error } = useFetch("/faq");
  const faq = DEMO ? [] : data ?? [];
  const [cari, setCari] = useState("");
  const [kategori, setKategori] = useState("");

  const daftarKategori = useMemo(() => [...new Set(faq.map((f) => f.kategori))], [faq]);
  const tampil = useMemo(() => {
    const q = cari.trim().toLowerCase();
    return faq.filter(
      (f) =>
        (!kategori || f.kategori === kategori) &&
        (!q || f.pertanyaan.toLowerCase().includes(q) || f.jawaban.toLowerCase().includes(q))
    );
  }, [faq, cari, kategori]);

  const items = [
    k.alamat && { icon: MapPinIcon, label: "Alamat", value: k.alamat },
    k.telepon && { icon: PhoneIcon, label: "Telepon", value: k.telepon, href: tel(k.telepon) },
    k.email && { icon: EnvelopeIcon, label: "Email", value: k.email, href: `mailto:${k.email}` },
  ].filter(Boolean);

  return (
    <div className="mx-auto max-w-[880px] px-5 py-14 sm:px-8">
      <h1 className="text-3xl font-extrabold text-navy">Kontak</h1>
      <p className="mt-1 text-sm text-slate-600">Hubungi Tata Usaha SMA Negeri 104 Jakarta.</p>

      <ul className="mt-8 divide-y divide-line rounded-xl border border-line bg-white">
        {items.map(({ icon: Icon, label, value, href }) => (
          <li key={label} className="flex gap-4 p-5">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-blue-50 text-primary">
              <Icon className="h-5 w-5" />
            </span>
            <div>
              <p className="text-xs text-slate-500">{label}</p>
              {href ? (
                <a href={href} className="font-semibold text-navy hover:text-primary">{value}</a>
              ) : (
                <p className="font-semibold text-navy">{value}</p>
              )}
            </div>
          </li>
        ))}

        {k.jam_layanan?.length > 0 && (
          <li className="flex gap-4 p-5">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-blue-50 text-primary">
              <ClockIcon className="h-5 w-5" />
            </span>
            <div>
              <p className="text-xs text-slate-500">Jam layanan</p>
              <ul className="space-y-1">
                {k.jam_layanan.map((j, i) => (
                  <li key={i} className="font-semibold text-navy">
                    {j.hari && <span>{j.hari}: </span>}
                    {j.jam}
                    {j.keterangan && <span className="block text-xs font-normal text-slate-500">{j.keterangan}</span>}
                  </li>
                ))}
              </ul>
            </div>
          </li>
        )}
      </ul>

      {(k.whatsapp || k.maps_url) && (
        <div className="mt-5 flex flex-wrap gap-3">
          {k.whatsapp && (
            <a
              href={`https://wa.me/${k.whatsapp}`}
              target="_blank"
              rel="noopener noreferrer"
              className={`${btn} bg-primary text-white hover:bg-primary-dark`}
            >
              <ChatBubbleLeftRightIcon className="h-5 w-5" /> Chat via WhatsApp
            </a>
          )}
          {k.maps_url && (
            <a
              href={k.maps_url}
              target="_blank"
              rel="noopener noreferrer"
              className={`${btn} border border-line bg-white text-navy hover:bg-blue-50`}
            >
              <MapPinIcon className="h-5 w-5" /> Buka di Maps
            </a>
          )}
        </div>
      )}

      {k.media_sosial?.length > 0 && (
        <div className="mt-6">
          <p className="text-sm font-semibold text-navy">Media sosial</p>
          <ul className="mt-2 flex flex-wrap gap-2">
            {k.media_sosial.map((m, i) => (
              <li key={i}>
                <a
                  href={m.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-block rounded-full border border-line bg-white px-4 py-1.5 text-sm font-semibold text-primary hover:bg-blue-50"
                >
                  {m.nama}
                </a>
              </li>
            ))}
          </ul>
        </div>
      )}

      {k.bagian?.length > 0 && (
        <section className="mt-10">
          <h2 className="text-xl font-bold text-navy">Kontak per bagian</h2>
          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            {k.bagian.map((b, i) => (
              <div key={i} className="rounded-xl border border-line bg-white p-5">
                <p className="font-bold text-navy">{b.nama}</p>
                {b.telepon && (
                  <p className="mt-2 text-sm">
                    <a href={tel(b.telepon)} className="font-semibold text-primary">{b.telepon}</a>
                  </p>
                )}
                {b.email && (
                  <p className="text-sm">
                    <a href={`mailto:${b.email}`} className="font-semibold text-primary">{b.email}</a>
                  </p>
                )}
                {b.keterangan && <p className="mt-2 text-xs text-slate-500">{b.keterangan}</p>}
              </div>
            ))}
          </div>
        </section>
      )}

      {!DEMO && !error && (loading || faq.length > 0) && (
        <section id="faq" className="mt-12">
          <h2 className="text-xl font-bold text-navy">Pertanyaan yang Sering Diajukan</h2>

          <div className="mt-4 flex flex-wrap gap-3">
            <div className="relative min-w-[220px] flex-1">
              <MagnifyingGlassIcon className="pointer-events-none absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />
              <input
                value={cari}
                onChange={(e) => setCari(e.target.value)}
                aria-label="Cari pertanyaan"
                placeholder="Cari pertanyaan"
                className="h-11 w-full rounded-lg border border-line pl-10 pr-3 text-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
              />
            </div>
          </div>

          {daftarKategori.length > 1 && (
            <div className="mt-3 flex flex-wrap gap-2">
              {["", ...daftarKategori].map((kat) => (
                <button
                  key={kat || "semua"}
                  type="button"
                  aria-pressed={kategori === kat}
                  onClick={() => setKategori(kat)}
                  className={`rounded-full border px-4 py-1.5 text-sm font-semibold ${
                    kategori === kat ? "border-primary bg-primary text-white" : "border-line bg-white text-navy hover:bg-blue-50"
                  }`}
                >
                  {kat || "Semua"}
                </button>
              ))}
            </div>
          )}

          <div className="mt-5">
            {loading && <p className="text-sm text-slate-500">Memuat data...</p>}
            {!loading && tampil.length === 0 && <p className="text-sm text-slate-500">Tidak ada pertanyaan yang cocok.</p>}
            {tampil.length > 0 && <FaqAccordion items={tampil} />}
          </div>
        </section>
      )}
    </div>
  );
}