import { useEffect, useRef, useState } from "react";
import { api, daftarkanPenanyaSandi } from "../lib/api";
import Modal from "../components/Modal";
import { inputCls } from "../components/Field";

// Menampilkan kotak "Konfirmasi kata sandi" setiap kali server meminta (kode 428).
export function SandiUlangProvider({ children }) {
  const [buka, setBuka] = useState(false);
  const [sandi, setSandi] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const resolver = useRef(null);

  useEffect(() => {
    daftarkanPenanyaSandi(
      () =>
        new Promise((resolve) => {
          resolver.current?.(false); // permintaan lama (kalau ada) dianggap dibatalkan
          resolver.current = resolve;
          setSandi("");
          setError("");
          setBuka(true);
        })
    );
    return () => daftarkanPenanyaSandi(null);
  }, []);

  const selesai = (hasil) => {
    resolver.current?.(hasil);
    resolver.current = null;
    setBuka(false);
    setSandi("");
  };

  const kirim = async (e) => {
    e.preventDefault();
    if (!sandi) return setError("Isi kata sandi Anda.");
    setLoading(true);
    setError("");
    try {
      await api("/konfirmasi-sandi", { method: "POST", body: { sandi } });
      selesai(true);
    } catch (err) {
      setError(err.status === 429 ? "Terlalu banyak percobaan. Coba lagi sebentar." : err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      {children}
      {buka && (
        <Modal title="Konfirmasi kata sandi" onClose={() => !loading && selesai(false)}>
          <form onSubmit={kirim} noValidate>
            <p className="text-sm leading-6 text-slate-700">
              Tindakan ini sensitif. Masukkan kata sandi akun Anda untuk melanjutkan. Setelah dikonfirmasi, Anda tidak
              ditanya lagi selama 5 menit.
            </p>
            <input
              type="password"
              autoFocus
              autoComplete="current-password"
              aria-label="Kata sandi Anda"
              value={sandi}
              onChange={(e) => setSandi(e.target.value)}
              className={`${inputCls(error)} mt-4 h-11`}
            />
            {error && (
              <p role="alert" className="mt-2 text-sm font-medium text-red-600">
                {error}
              </p>
            )}
            <div className="mt-5 flex justify-end gap-3">
              <button
                type="button"
                disabled={loading}
                onClick={() => selesai(false)}
                className="rounded-lg border border-line px-4 py-2.5 text-sm font-semibold text-navy hover:bg-surface disabled:opacity-60"
              >
                Batal
              </button>
              <button
                disabled={loading}
                className="rounded-lg bg-primary px-5 py-2.5 text-sm font-semibold text-white hover:bg-primary-dark disabled:opacity-70"
              >
                {loading ? "Memeriksa..." : "Konfirmasi"}
              </button>
            </div>
          </form>
        </Modal>
      )}
    </>
  );
}