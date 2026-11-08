import { useState } from "react";
import { Link, Navigate } from "react-router-dom";
import { ArrowLeftIcon, CheckCircleIcon, ClockIcon, PhoneIcon } from "@heroicons/react/24/outline";
import { api } from "../lib/api";
import { useApp } from "../context/AppState";
import { CONTACT } from "../data/content";
import { useSubmit } from "../lib/useSubmit";
import Field, { inputCls } from "../components/Field";

export default function LupaKataSandi() {
  const { user } = useApp();
  const [identitas, setIdentitas] = useState("");
  const [catatan, setCatatan] = useState("");
  const [website, setWebsite] = useState(""); // jebakan bot, dibiarkan kosong
  const [errIdentitas, setErrIdentitas] = useState("");
  const [error, setError] = useState("");
  const [terkirim, setTerkirim] = useState(false);

  const [kirim, mengirim] = useSubmit(async (e) => {
    e.preventDefault();
    setError("");
    if (!identitas.trim()) {
      setErrIdentitas("Isi NIS, NIP, atau username Anda.");
      return;
    }
    setErrIdentitas("");
    try {
      await api("/lupa-kata-sandi", { method: "POST", body: { identitas: identitas.trim(), catatan: catatan.trim(), website } });
      setTerkirim(true);
    } catch (err) {
      if (err.errors?.identitas) setErrIdentitas(err.errors.identitas[0]);
      else setError(err.message);
    }
  });

  // Sudah masuk: ganti sandi lewat halaman akun, bukan lewat sini.
  if (user) return <Navigate to="/ganti-sandi" replace />;

  return (
    <div className="grid min-h-[calc(100vh-112px)] lg:grid-cols-2">
      <aside className="hidden flex-col justify-center bg-navy px-14 text-white lg:flex">
        <p className="text-xs font-bold uppercase tracking-widest text-blue-300">Bantuan akun</p>
        <h1 className="mt-4 text-4xl font-extrabold leading-tight">
          Lupa kata sandi?
          <br />
          Tenang, ada jalannya.
        </h1>
        <p className="mt-5 max-w-md text-blue-100">
          Akun dikelola oleh Tata Usaha, jadi kata sandi diatur ulang oleh petugas. Kata sandi lama tidak bisa dilihat siapa pun.
        </p>
        <ol className="mt-8 max-w-md space-y-3 text-sm text-blue-100">
          <li><b className="text-white">1.</b> Kirim permintaan lewat formulir ini.</li>
          <li><b className="text-white">2.</b> Tata Usaha memeriksa identitas Anda.</li>
          <li><b className="text-white">3.</b> Anda menerima kata sandi sementara.</li>
          <li><b className="text-white">4.</b> Masuk, lalu ganti dengan kata sandi baru.</li>
        </ol>
      </aside>

      <main className="flex items-center justify-center px-5 py-10">
        <div className="w-full max-w-md">
          <Link to="/login" className="mb-8 inline-flex items-center gap-2 text-sm font-medium text-slate-600 hover:text-primary">
            <ArrowLeftIcon className="h-4 w-4" /> Kembali ke halaman masuk
          </Link>

          {terkirim ? (
            <div role="status">
              <span className="flex h-14 w-14 items-center justify-center rounded-full bg-green-50 text-green-600">
                <CheckCircleIcon className="h-8 w-8" />
              </span>
              <h2 className="mt-4 text-3xl font-extrabold text-navy">Permintaan terkirim</h2>
              <p className="mt-2 text-sm leading-6 text-slate-600">
                Jika akun Anda terdaftar, Tata Usaha akan memprosesnya pada jam layanan. Kata sandi sementara diberikan
                langsung oleh petugas, tidak dikirim lewat email.
              </p>

              <div className="mt-6 space-y-3 rounded-xl border border-line bg-surface/60 p-4 text-sm">
                <p className="font-semibold text-navy">Ingin lebih cepat? Hubungi Tata Usaha</p>
                <p className="flex items-center gap-2 text-slate-700">
                  <PhoneIcon className="h-4 w-4 text-primary" />
                  <a href={`tel:${CONTACT.telp.replace(/[^0-9+]/g, "")}`} className="font-semibold hover:text-primary">{CONTACT.telp}</a>
                </p>
                <p className="flex items-center gap-2 text-slate-700">
                  <ClockIcon className="h-4 w-4 text-primary" />
                  Jam layanan: {CONTACT.jam}
                </p>
              </div>

              <p className="mt-4 text-xs leading-5 text-slate-500">
                Jangan bagikan kata sandi sementara kepada siapa pun, dan ganti segera setelah masuk.
              </p>
              <Link to="/login" className="press mt-6 inline-flex h-12 w-full items-center justify-center rounded-lg bg-primary text-sm font-semibold text-white hover:bg-primary-dark">
                Ke halaman masuk
              </Link>
            </div>
          ) : (
            <>
              <p className="text-xs font-bold uppercase tracking-widest text-primary">Bantuan akun</p>
              <h2 className="mt-1 text-3xl font-extrabold text-navy">Lupa Kata Sandi</h2>
              <p className="mt-1 text-sm text-slate-600">
                Masukkan identitas akun Anda. Permintaan akan diteruskan ke Tata Usaha untuk diatur ulang.
              </p>

              <form onSubmit={kirim} noValidate className="mt-7 space-y-5">
                <Field label="NIS / NIP / Username" required error={errIdentitas}>
                  {(p) => (
                    <input
                      {...p}
                      value={identitas}
                      onChange={(e) => setIdentitas(e.target.value)}
                      maxLength={100}
                      autoComplete="username"
                      autoFocus
                      className={`${inputCls(errIdentitas)} h-12`}
                    />
                  )}
                </Field>

                <Field
                  label="Keterangan (opsional)"
                  hint="Tulis nama lengkap dan kelas atau jabatan, supaya petugas bisa memastikan ini benar Anda."
                >
                  {(p) => (
                    <textarea
                      {...p}
                      rows={3}
                      value={catatan}
                      onChange={(e) => setCatatan(e.target.value)}
                      maxLength={300}
                      className={`${inputCls(false)} py-2.5`}
                    />
                  )}
                </Field>

                {/* Jebakan bot: tersembunyi dari manusia dan pembaca layar */}
                <div aria-hidden="true" className="absolute -left-[9999px] h-0 w-0 overflow-hidden">
                  <label>
                    Jangan diisi
                    <input tabIndex={-1} autoComplete="off" value={website} onChange={(e) => setWebsite(e.target.value)} />
                  </label>
                </div>

                {error && (
                  <p role="alert" className="rounded-lg border border-red-200 bg-red-50 px-4 py-2.5 text-sm text-red-700">
                    {error}
                  </p>
                )}

                <button
                  type="submit"
                  disabled={mengirim}
                  className="press h-12 w-full rounded-lg bg-primary text-sm font-semibold text-white transition-colors hover:bg-primary-dark disabled:opacity-70"
                >
                  {mengirim ? "Mengirim..." : "Kirim Permintaan"}
                </button>
              </form>

              <p className="mt-6 text-center text-sm text-slate-600">
                Ingat kata sandinya?{" "}
                <Link to="/login" className="font-semibold text-primary">Masuk</Link>
              </p>
            </>
          )}
        </div>
      </main>
    </div>
  );
}