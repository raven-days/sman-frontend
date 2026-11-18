import { useEffect, useRef } from "react";

const SITE_KEY = import.meta.env.VITE_TURNSTILE_SITE_KEY;
export const TURNSTILE_AKTIF = Boolean(SITE_KEY);

let janjiSkrip = null;
function muatSkrip() {
  if (window.turnstile) return Promise.resolve();
  if (!janjiSkrip) {
    janjiSkrip = new Promise((resolve, reject) => {
      const s = document.createElement("script");
      s.src = "https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit";
      s.async = true;
      s.onload = resolve;
      s.onerror = () => {
        janjiSkrip = null;
        reject(new Error("Gagal memuat verifikasi keamanan."));
      };
      document.head.appendChild(s);
    });
  }
  return janjiSkrip;
}

// onToken(token) dipanggil saat pengguna lolos; onToken("") saat kedaluwarsa atau gagal.
// Ubah resetKey untuk mengulang tantangan (mis. setelah pengiriman gagal).
export default function Turnstile({ onToken, resetKey = 0 }) {
  const wadah = useRef(null);
  const idWidget = useRef(null);

  useEffect(() => {
    if (!SITE_KEY) return undefined;
    let batal = false;
    muatSkrip()
      .then(() => {
        if (batal || !wadah.current) return;
        idWidget.current = window.turnstile.render(wadah.current, {
          sitekey: SITE_KEY,
          language: "id",
          callback: (t) => onToken(t),
          "expired-callback": () => onToken(""),
          "error-callback": () => onToken(""),
        });
      })
      .catch(() => {});
    return () => {
      batal = true;
      if (idWidget.current != null && window.turnstile) window.turnstile.remove(idWidget.current);
      idWidget.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (idWidget.current != null && window.turnstile) window.turnstile.reset(idWidget.current);
  }, [resetKey]);

  if (!SITE_KEY) return null;
  return <div ref={wadah} />;
}