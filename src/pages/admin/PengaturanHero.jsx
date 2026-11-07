import { useEffect, useState } from "react";
import { api } from "../../lib/api";
import { siapkanBanner } from "../../lib/banner";
import { useToast } from "../../context/Toast";
import { useSubmit } from "../../lib/useSubmit";
import { WARNA_HERO, WARNA_DEFAULT } from "../../data/hero";

// Pengaturan latar slide utama beranda. Teks dan tombolnya tetap, hanya latar yang bisa diubah.
export default function PengaturanHero() {
  const toast = useToast();
  const [awal, setAwal] = useState(null); // { gambar, warna } dari server
  const [warna, setWarna] = useState(WARNA_DEFAULT);
  const [file, setFile] = useState(null);
  const [hapus, setHapus] = useState(false);
  const [preview, setPreview] = useState(null);
  const [memproses, setMemproses] = useState(false);
  const [err, setErr] = useState("");

  useEffect(() => {
    api("/hero")
      .then((d) => {
        setAwal(d);
        setWarna(d.warna);
      })
      .catch((e) => setErr(e.message));
  }, []);

  useEffect(() => {
    if (!file) { setPreview(null); return undefined; }
    const u = URL.createObjectURL(file);
    setPreview(u);
    return () => URL.revokeObjectURL(u);
  }, [file]);

  const pilihFile = async (e) => {
    const f = e.target.files?.[0];
    if (!f) return;
    setMemproses(true);
    try {
      const hasil = await siapkanBanner(f);
      URL.revokeObjectURL(hasil.previewUrl);
      setFile(hasil.file);
      setHapus(false);
      setErr("");
    } catch (x) {
      setFile(null);
      setErr(x.message);
      e.target.value = "";
    } finally {
      setMemproses(false);
    }
  };

  const gambarTampil = hapus ? null : preview || awal?.gambar || null;
  const berubah = awal && (file || hapus || warna !== awal.warna);

  const [simpan, saving] = useSubmit(async () => {
    const fd = new FormData();
    fd.append("warna", warna);
    if (file) fd.append("gambar", file);
    else if (hapus) fd.append("hapus_gambar", "1");
    try {
      const d = await api("/admin/hero", { method: "POST", body: fd });
      setAwal(d);
      setWarna(d.warna);
      setFile(null);
      setHapus(false);
      toast.success("Latar header utama disimpan.");
    } catch (x) {
      toast.galat(x);
    }
  });

  return (
    <section className="mt-6 rounded-xl border border-line bg-white p-4 sm:p-5" aria-labelledby="judul-hero">
      <h2 id="judul-hero" className="font-bold text-navy">Latar header utama</h2>
      <p className="mt-1 text-sm text-slate-600">
        Slide pertama beranda (“Layanan Administrasi Sekolah dalam Satu Pintu”) selalu tampil dan teksnya tidak berubah.
        Di sini kamu bisa mengganti warna atau foto latarnya.
      </p>

      <div className="mt-4 grid gap-5 md:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
        <div className={`relative aspect-[8/3] overflow-hidden rounded-lg border border-line bg-gradient-to-br ${(WARNA_HERO[warna] || WARNA_HERO[WARNA_DEFAULT]).kelas}`}>
          {gambarTampil ? (
            <img src={gambarTampil} alt="Pratinjau latar" className="absolute inset-0 h-full w-full object-cover" />
          ) : (
            <>
              <div className="absolute -right-10 -top-12 h-40 w-40 rounded-full bg-white/10" />
              <div className="absolute inset-0 opacity-[0.12]" style={{ backgroundImage: "radial-gradient(#fff 1px, transparent 1px)", backgroundSize: "16px 16px" }} />
            </>
          )}
          {gambarTampil && <div className="absolute inset-0 bg-navy/25" />}
          <div className="absolute inset-0 bg-gradient-to-r from-black/70 via-black/35 to-transparent" />
          <p className="absolute inset-y-0 left-4 flex w-3/5 items-center text-sm font-extrabold leading-tight text-white sm:text-base">
            Layanan Administrasi Sekolah dalam Satu Pintu
          </p>
        </div>

        <div className="space-y-4">
          <fieldset>
            <legend className="mb-1.5 text-sm font-semibold text-navy">Warna latar</legend>
            <div className="flex flex-wrap gap-2">
              {Object.entries(WARNA_HERO).map(([id, w]) => (
                <button
                  key={id}
                  type="button"
                  aria-pressed={warna === id}
                  onClick={() => setWarna(id)}
                  className={`flex items-center gap-2 rounded-lg border px-3 py-2 text-xs font-semibold transition-colors ${
                    warna === id ? "border-primary bg-blue-50 text-primary" : "border-line text-navy hover:bg-surface"
                  }`}
                >
                  <span className="h-4 w-4 rounded-full border border-black/10" style={{ background: w.contoh }} />
                  {w.label}
                </button>
              ))}
            </div>
            <p className="mt-1 text-xs text-slate-500">Dipakai bila tidak ada foto.</p>
          </fieldset>

          <div>
            <label htmlFor="foto-hero" className="mb-1.5 block text-sm font-semibold text-navy">Foto latar (opsional)</label>
            <input
              id="foto-hero"
              type="file"
              accept="image/jpeg,image/png,image/webp"
              onChange={pilihFile}
              disabled={memproses}
              className="block w-full text-sm file:mr-3 file:rounded-lg file:border file:border-line file:bg-white file:px-3 file:py-2 file:text-sm file:font-semibold file:text-navy"
            />
            <p className="mt-1 text-xs text-slate-500">
              Gambar apa pun disesuaikan otomatis. Pilih foto yang sisi kirinya tidak terlalu ramai, karena teks ada di kiri.
            </p>
            {(awal?.gambar || file) && !hapus && (
              <button type="button" onClick={() => { setFile(null); setHapus(true); }} className="mt-2 text-xs font-semibold text-red-600 hover:underline">
                Hapus foto
              </button>
            )}
          </div>

          {err && <p role="alert" className="text-xs font-medium text-red-600">{err}</p>}

          <button
            type="button"
            onClick={simpan}
            disabled={!berubah || saving || memproses}
            className="press rounded-lg bg-primary px-5 py-2.5 text-sm font-semibold text-white hover:bg-primary-dark disabled:opacity-50"
          >
            {saving ? "Menyimpan..." : "Simpan latar"}
          </button>
        </div>
      </div>
    </section>
  );
}