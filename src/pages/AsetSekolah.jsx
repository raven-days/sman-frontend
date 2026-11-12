import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import {
  ArrowDownTrayIcon, ArrowTopRightOnSquareIcon, Cog6ToothIcon, DocumentTextIcon,
  EyeIcon, LockClosedIcon, MapPinIcon,
} from "@heroicons/react/24/outline";
import { PROFIL_DEFAULT } from "../lib/profilSekolah";
import { useApp } from "../context/AppState";
import { useFetch, DEMO, bukaLampiran, unduhBerkas } from "../lib/api";
import ServiceIcon from "../components/ServiceIcon";
import Reveal from "../components/Reveal";
import { Skeleton, DaftarBarisSkeleton } from "../components/Skeleton";

const KOSONG = <span className="text-slate-500">Belum tercatat</span>;
const ukuran = (b) => (b >= 1048576 ? `${(b / 1048576).toFixed(1)} MB` : `${Math.max(1, Math.round(b / 1024))} KB`);
const aksiCls =
  "press inline-flex items-center gap-1.5 rounded-lg border border-line px-3 py-1.5 text-xs font-semibold text-navy hover:bg-blue-50";

function Kartu({ judul, children }) {
  return (
    <section className="rounded-xl border border-line bg-white">
      <h2 className="border-b border-line px-5 py-4 text-lg font-bold text-navy">{judul}</h2>
      <dl className="divide-y divide-line">{children}</dl>
    </section>
  );
}

function Baris({ label, children }) {
  return (
    <div className="grid gap-1 px-5 py-3.5 sm:grid-cols-[210px_1fr] sm:gap-4">
      <dt className="text-sm font-semibold text-navy">{label}</dt>
      <dd className="text-sm text-slate-700">{children}</dd>
    </div>
  );
}

export default function AsetSekolah() {
  const { user } = useApp();
  const { data, loading } = useFetch(DEMO ? null : "/aset/profil");
  const p = data ?? PROFIL_DEFAULT;
  const memuat = !DEMO && loading;
  const bisaKelola = (user?.izin || []).includes("aset");

  const { data: dokumen, loading: memuatDok, error: galatDok } = useFetch(user && !DEMO ? "/aset/dokumen" : null);
  const [err, setErr] = useState("");

  const grup = useMemo(() => {
    const m = new Map();
    (dokumen ?? []).forEach((d) => {
      const k = d.kategori || "Lainnya";
      if (!m.has(k)) m.set(k, []);
      m.get(k).push(d);
    });
    return [...m];
  }, [dokumen]);

  const jalankan = async (fn) => {
    setErr("");
    try {
      await fn();
    } catch (e) {
      setErr(e.message);
    }
  };

  // Peta: alamat "Sematkan peta" Google Maps bila ada, jika tidak pencarian teks.
  const adaEmbed = /^https:\/\/www\.google\.com\/maps\/embed\?/.test(p.lokasi_peta || "");
  const q = encodeURIComponent(adaEmbed ? `${p.nama} ${p.lokasi_alamat}` : p.lokasi_peta || `${p.nama} ${p.lokasi_alamat}`);
  const embed = adaEmbed ? p.lokasi_peta : `https://www.google.com/maps?q=${q}&output=embed`;
  const buka = `https://www.google.com/maps/search/?api=1&query=${q}`;
  const rute = `https://www.google.com/maps/dir/?api=1&destination=${q}`;
  const tombol = `${aksiCls} px-4 py-2.5 text-sm`;

  const huruf = ["A", "B", "C"].includes(p.akreditasi_peringkat) ? p.akreditasi_peringkat : "–";

  return (
    <div className="mx-auto max-w-[900px] px-5 py-14 sm:px-8">
      <nav className="text-xs text-slate-500">
        <Link to="/" className="hover:text-primary">Beranda</Link> /{" "}
        <Link to="/layanan" className="hover:text-primary">Layanan</Link> / Aset
      </nav>

      <div className="mt-4 flex items-center gap-4">
        <span className="flex h-14 w-14 items-center justify-center rounded-xl bg-blue-50 text-primary">
          <ServiceIcon slug="aset" className="h-7 w-7" />
        </span>
        <div>
          <h1 className="text-3xl font-extrabold text-navy">Aset</h1>
          <p className="mt-0.5 text-sm text-slate-600">Informasi dan dokumen {p.nama}.</p>
        </div>
      </div>

      <div className="mt-8 space-y-5">
        {memuat ? (
          <>
            <Skeleton className="h-40 w-full" />
            <Skeleton className="h-48 w-full" />
            <Skeleton className="h-28 w-full" />
          </>
        ) : (
          <>
            <Reveal>
              <Kartu judul="Pendirian sekolah">
                <Baris label="Mulai belajar-mengajar">{p.pendirian_mulai || KOSONG}</Baris>
                <Baris label="Nomor SK pendirian">{p.pendirian_sk_nomor || KOSONG}</Baris>
                <Baris label="Tanggal SK pendirian">{p.pendirian_sk_tanggal || KOSONG}</Baris>
              </Kartu>
            </Reveal>

            <Reveal delay={80}>
              <Kartu judul="Identitas dan status">
                <Baris label="Nama sekolah">{p.nama}</Baris>
                <Baris label="NPSN"><span className="font-semibold tracking-wide text-navy">{p.npsn}</span></Baris>
                <Baris label="Status">
                  <span className="rounded-full border border-green-200 bg-green-50 px-3 py-0.5 text-xs font-semibold text-green-700">
                    {p.status}
                  </span>
                </Baris>
                <Baris label="Jenjang">{p.jenjang}</Baris>
              </Kartu>
            </Reveal>

            <Reveal delay={160}>
              <section className="flex flex-wrap items-center gap-5 rounded-xl border border-line bg-white p-5">
                <span
                  aria-hidden="true"
                  className="flex h-20 w-20 shrink-0 items-center justify-center rounded-2xl bg-primary font-display text-5xl font-extrabold text-white"
                >
                  {huruf}
                </span>
                <div className="min-w-0 flex-1">
                  <h2 className="text-lg font-bold text-navy">
                    Hasil akreditasi:{" "}
                    {p.akreditasi_peringkat
                      ? huruf === "–" ? p.akreditasi_peringkat : `Terakreditasi ${p.akreditasi_peringkat}`
                      : "belum tercatat"}
                  </h2>
                  {(p.akreditasi_sk_nomor || p.akreditasi_tahun) && (
                    <p className="mt-1 text-sm text-slate-700">
                      {[p.akreditasi_sk_nomor && `Nomor SK ${p.akreditasi_sk_nomor}`, p.akreditasi_tahun && `tahun ${p.akreditasi_tahun}`]
                        .filter(Boolean).join(", ")}
                    </p>
                  )}
                  {p.akreditasi_berlaku_sampai && <p className="mt-0.5 text-sm text-slate-700">Berlaku sampai {p.akreditasi_berlaku_sampai}</p>}
                  {p.akreditasi_lembaga && <p className="mt-0.5 text-xs text-slate-500">{p.akreditasi_lembaga}</p>}
                </div>
              </section>
            </Reveal>
          </>
        )}

        <Reveal delay={200}>
          <section id="denah" className="scroll-mt-24 overflow-hidden rounded-xl border border-line bg-white">
            <h2 className="border-b border-line px-5 py-4 text-lg font-bold text-navy">Lokasi sekolah</h2>
            <div className="relative aspect-[4/3] w-full bg-slate-100 sm:aspect-[16/9]">
              <iframe
                title={`Denah lokasi ${p.nama} di Google Maps`}
                src={embed}
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
                allowFullScreen
                className="absolute inset-0 h-full w-full border-0"
              />
            </div>
            <div className="flex flex-wrap items-center justify-between gap-3 p-5">
              <p className="flex min-w-0 flex-1 items-start gap-2 text-sm text-slate-700">
                <MapPinIcon className="mt-0.5 h-5 w-5 shrink-0 text-primary" />
                <span>{p.lokasi_alamat}</span>
              </p>
              <div className="flex flex-wrap gap-2">
                <a href={buka} target="_blank" rel="noopener noreferrer" className={tombol}>
                  Buka di Google Maps <ArrowTopRightOnSquareIcon className="h-4 w-4" />
                </a>
                <a href={rute} target="_blank" rel="noopener noreferrer" className={tombol}>
                  Petunjuk arah <ArrowTopRightOnSquareIcon className="h-4 w-4" />
                </a>
              </div>
            </div>
          </section>
        </Reveal>

        <Reveal delay={240}>
          <section id="dokumen" className="scroll-mt-24 rounded-xl border border-line bg-white">
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-line px-5 py-4">
              <h2 className="text-lg font-bold text-navy">Dokumen aset</h2>
              {bisaKelola && (
                <Link to="/tu/aset" className={aksiCls}>
                  <Cog6ToothIcon className="h-4 w-4" /> Kelola dokumen
                </Link>
              )}
            </div>

            {!user ? (
              <div className="px-5 py-10 text-center">
                <LockClosedIcon className="mx-auto h-8 w-8 text-slate-400" />
                <p className="mt-3 text-sm text-slate-700">
                  Dokumen aset hanya dapat dilihat oleh akun yang sudah masuk.
                </p>
                <Link
                  to="/login"
                  state={{ from: "/layanan/aset" }}
                  className="press mt-4 inline-block rounded-lg bg-primary px-6 py-2.5 text-sm font-semibold text-white hover:bg-primary-dark"
                >
                  Masuk
                </Link>
              </div>
            ) : DEMO ? (
              <p className="px-5 py-8 text-sm text-slate-500">Mode demo: dokumen membutuhkan backend (Laravel).</p>
            ) : memuatDok ? (
              <DaftarBarisSkeleton n={3} className="p-5" />
            ) : galatDok ? (
              <p role="alert" className="px-5 py-6 text-sm text-red-600">{galatDok}</p>
            ) : grup.length === 0 ? (
              <p className="px-5 py-8 text-sm text-slate-500">Belum ada dokumen yang dapat Anda lihat.</p>
            ) : (
              grup.map(([kategori, daftar]) => (
                <div key={kategori}>
                  <h3 className="bg-surface px-5 py-2 text-xs font-bold uppercase tracking-wider text-slate-500">{kategori}</h3>
                  <ul className="divide-y divide-line">
                    {daftar.map((d) => (
                      <li key={d.id} className="flex flex-wrap items-center gap-3 px-5 py-3.5">
                        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-blue-50 text-primary">
                          <DocumentTextIcon className="h-5 w-5" />
                        </span>
                        <div className="min-w-0 flex-1">
                          <p className="font-semibold text-navy">{d.judul}</p>
                          <p className="text-xs text-slate-500">
                            {[d.nomor && `No. ${d.nomor}`, ukuran(d.file_ukuran)].filter(Boolean).join(" · ")}
                          </p>
                          {d.keterangan && <p className="mt-0.5 text-xs text-slate-600">{d.keterangan}</p>}
                        </div>
                        <div className="flex gap-2">
                          <button type="button" onClick={() => jalankan(() => bukaLampiran(`/aset/dokumen/${d.id}/file`))} className={aksiCls}>
                            <EyeIcon className="h-4 w-4" /> Lihat
                          </button>
                          <button type="button" onClick={() => jalankan(() => unduhBerkas(`/aset/dokumen/${d.id}/file?unduh=1`, d.file_nama))} className={aksiCls}>
                            <ArrowDownTrayIcon className="h-4 w-4" /> Unduh
                          </button>
                        </div>
                      </li>
                    ))}
                  </ul>
                </div>
              ))
            )}
            {err && <p role="alert" className="border-t border-line px-5 py-3 text-sm text-red-600">{err}</p>}
          </section>
        </Reveal>

        {(p.sumber_label || p.sumber_url) && (
          <p className="text-xs text-slate-500">
            Sumber data:{" "}
            {p.sumber_url ? (
              <a href={p.sumber_url} target="_blank" rel="noopener noreferrer" className="font-semibold text-primary hover:underline">
                {p.sumber_label || p.sumber_url}
              </a>
            ) : (
              p.sumber_label
            )}
            . Data dapat berubah sewaktu-waktu; periksa sumber resmi untuk memastikan.
          </p>
        )}
      </div>
    </div>
  );
}