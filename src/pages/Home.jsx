
import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";

import {
  ArrowRightIcon,
  ArrowRightEndOnRectangleIcon,
  DocumentTextIcon,
  ClockIcon,
  ArrowDownTrayIcon,
  MagnifyingGlassIcon,
  ScaleIcon,
} from "@heroicons/react/24/outline";

import { SERVICES, STEPS, ANNOUNCEMENTS } from "../data/content";
import ServiceIcon from "../components/ServiceIcon";
import PengumumanCard from "../components/PengumumanCard";
import BannerCarousel from "../components/BannerCarousel";
import Reveal from "../components/Reveal";
import { DaftarKartuSkeleton } from "../components/Skeleton";
import { useFetch, DEMO } from "../lib/api";
import HeroUtama from "../components/HeroUtama";

const DEMO_PENGUMUMAN = ANNOUNCEMENTS.map((a) => ({
  judul: a.title,
  kategori: a.tag,
  tanggal: a.date,
  ringkasan: a.excerpt,
}));

const STEP_ICON = [
  ArrowRightEndOnRectangleIcon,
  DocumentTextIcon,
  ClockIcon,
  ArrowDownTrayIcon,
];

export default function Home() {
  const navigate = useNavigate();

  const {
    data: pengumuman,
    loading: memuat,
    error: galat,
  } = useFetch("/pengumuman?limit=3");

  const { data: banner } = useFetch(DEMO ? null : "/banner");
  const { data: hero } = useFetch(DEMO ? null : "/hero");

  const daftarPengumuman = DEMO ? DEMO_PENGUMUMAN : pengumuman ?? [];

  const [nomor, setNomor] = useState("");

  const cek = (e) => {
    e.preventDefault();
    const q = nomor.trim();

    navigate(
      q ? `/cek-status?no=${encodeURIComponent(q)}` : "/cek-status"
    );
  };

  return (
    <>
      {/* HERO: slide pertama tetap, banner admin menyusul sebagai slide berikutnya */}
      <BannerCarousel
        utama={
          <HeroUtama
            gambar={hero?.gambar ?? null}
            warna={hero?.warna}
          />
        }
        items={DEMO ? [] : banner ?? []}
      />

      {/* LAYANAN */}
      <section
        id="layanan"
        className="mx-auto max-w-[1200px] px-5 py-16 sm:px-8"
      >
        <Reveal>
          <p className="text-xs font-bold uppercase tracking-widest text-primary">
            Layanan kami
          </p>

          <div className="mt-2 flex flex-col justify-between gap-3 md:flex-row md:items-end">
            <h2 className="text-2xl font-bold text-navy sm:text-3xl">
              Pilih layanan sesuai kebutuhan
            </h2>

            <p className="max-w-sm text-sm text-slate-600">
              Seluruh kebutuhan administrasi sekolah tersedia dalam satu portal.
            </p>
          </div>
        </Reveal>

        <div className="mt-8 grid gap-4 sm:grid-cols-3 lg:grid-cols-5">
          {SERVICES.map((s, i) => (
            <Reveal key={s.slug} delay={i * 70}>
              <Link
                to={`/layanan/${s.slug}`}
                className="card-hover group flex h-full flex-col rounded-xl border border-line bg-white p-5"
              >
                <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-50 text-primary">
                  <ServiceIcon slug={s.slug} />
                </span>

                <h3 className="mt-5 text-base font-bold leading-snug text-navy">
                  {s.title}
                </h3>

                <span className="mt-auto inline-flex items-center gap-1 pt-6 text-sm font-semibold text-primary">
                  Selengkapnya
                  <ArrowRightIcon className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                </span>
              </Link>
            </Reveal>
          ))}
        </div>

        {/* Surat Keputusan: terbuka untuk semua pengguna */}
        <Reveal delay={120}>
          <Link
            to="/surat-keputusan"
            className="card-hover group mt-5 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-line bg-surface px-5 py-4 hover:bg-blue-50"
          >
            <span className="flex items-center gap-3">
              <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-white text-primary">
                <ScaleIcon className="h-5 w-5" />
              </span>

              <span>
                <span className="block font-bold text-navy">
                  Surat Keputusan
                </span>

                <span className="block text-sm text-slate-600">
                  Dapat diakses oleh semua pengguna, tanpa perlu masuk.
                </span>
              </span>
            </span>

            <span className="inline-flex items-center gap-1 text-sm font-semibold text-primary">
              Lihat SK
              <ArrowRightIcon className="h-4 w-4 transition-transform group-hover:translate-x-1" />
            </span>
          </Link>
        </Reveal>
      </section>

      {/* ALUR */}
      <section id="alur" className="bg-surface">
        <div className="mx-auto max-w-[1200px] px-5 py-16 sm:px-8">
          <Reveal>
            <p className="text-xs font-bold uppercase tracking-widest text-primary">
              Mudah dan transparan
            </p>

            <h2 className="mt-2 text-2xl font-bold text-navy sm:text-3xl">
              Cara Mengajukan Layanan
            </h2>

            <p className="mt-2 text-sm text-slate-600">
              Empat langkah sederhana untuk mendapatkan layanan administrasi.
            </p>
          </Reveal>

          <ol className="mt-10 grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
            {STEPS.map((st, i) => {
              const Icon = STEP_ICON[i];

              return (
                <Reveal
                  as="li"
                  key={st.n}
                  delay={i * 100}
                  className="text-center"
                >
                  <span className="relative mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-primary text-white">
                    <Icon className="h-7 w-7" />

                    <span className="absolute -right-2 -top-2 flex h-7 w-7 items-center justify-center rounded-full bg-accent text-[11px] font-bold">
                      {st.n}
                    </span>
                  </span>

                  <h3 className="mt-4 text-base font-bold text-navy">
                    {st.title}
                  </h3>

                  <p className="mx-auto mt-1 max-w-[230px] text-sm leading-6 text-slate-600">
                    {st.desc}
                  </p>

                  {st.to && (
                    <Link
                      to={st.to}
                      className="mt-2 inline-flex items-center gap-1 text-sm font-semibold text-primary hover:underline"
                    >
                      {st.linkLabel}
                      <ArrowRightIcon className="h-4 w-4" />
                    </Link>
                  )}
                </Reveal>
              );
            })}
          </ol>
        </div>
      </section>

      {/* PENGUMUMAN */}
      <section className="mx-auto max-w-[1200px] px-5 py-16 sm:px-8">
        <Reveal>
          <p className="text-xs font-bold uppercase tracking-widest text-primary">
            Informasi terkini
          </p>

          <div className="mt-2 flex items-end justify-between">
            <h2 className="text-2xl font-bold text-navy sm:text-3xl">
              Pengumuman Terbaru
            </h2>

            <Link
              to="/pengumuman"
              className="inline-flex items-center gap-1 text-sm font-semibold text-primary"
            >
              Lihat semua
              <ArrowRightIcon className="h-4 w-4" />
            </Link>
          </div>
        </Reveal>

        {!DEMO && memuat && <DaftarKartuSkeleton n={3} />}

        {!DEMO && galat && (
          <p role="alert" className="mt-6 text-sm text-red-600">
            {galat}
          </p>
        )}

        {!DEMO && !memuat && !galat && daftarPengumuman.length === 0 && (
          <p className="mt-6 text-sm text-slate-500">
            Belum ada pengumuman.
          </p>
        )}

        <div className="mt-8 grid gap-5 md:grid-cols-3">
          {daftarPengumuman.map((p, i) => (
            <Reveal key={p.id ?? p.judul} delay={i * 90}>
              <PengumumanCard p={p} />
            </Reveal>
          ))}
        </div>
      </section>

      {/* CEK STATUS */}
      <section className="bg-primary">
        <Reveal
          as="form"
          onSubmit={cek}
          className="mx-auto flex max-w-[1200px] flex-col gap-5 px-5 py-10 sm:px-8 lg:flex-row lg:items-center"
        >
          <div className="flex flex-1 items-center gap-4 text-white">
            <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-white/20">
              <MagnifyingGlassIcon className="h-6 w-6" />
            </span>

            <div>
              <h2 className="text-xl font-bold">
                Cek Status Pengajuan
              </h2>

              <p className="text-sm text-blue-100">
                Masukkan nomor pengajuan untuk melihat perkembangan layanan Anda.
              </p>
            </div>
          </div>

          <input
            value={nomor}
            onChange={(e) => setNomor(e.target.value)}
            aria-label="Nomor pengajuan"
            placeholder="Contoh: TU-2026-00128"
            className="h-12 w-full rounded-lg border border-line bg-white px-4 text-sm text-slate-800 placeholder:text-slate-500 focus:outline-2 focus:outline-offset-2 focus:outline-white lg:w-80"
          />

          <button
            type="submit"
            className="press h-12 rounded-lg bg-accent px-7 text-sm font-semibold text-white hover:brightness-110"
          >
            Cek Status
          </button>
        </Reveal>
      </section>
    </>
  );
}
