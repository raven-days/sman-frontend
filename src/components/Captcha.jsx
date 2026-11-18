import { useEffect, useRef } from "react";

const KEY = import.meta.env.VITE_TURNSTILE_SITE_KEY;
let skrip;

function muat() {
  if (window.turnstile) return Promise.resolve();
  skrip ??= new Promise((ok, gagal) => {
    const s = document.createElement("script");
    s.src = "https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit";
    s.async = true;
    s.onload = ok;
    s.onerror = gagal;
    document.head.appendChild(s);
  });
  return skrip;
}

/** CAPTCHA Cloudflare Turnstile. Tanpa site key (lokal), langsung memberi token "dev". */
export default function Captcha({ onToken }) {
  const ref = useRef(null);

  useEffect(() => {
    if (!KEY) {
      onToken("dev");
      return;
    }
    let id;
    let batal = false;
    muat()
      .then(() => {
        if (batal || !ref.current) return;
        id = window.turnstile.render(ref.current, {
          sitekey: KEY,
          callback: onToken,
          "expired-callback": () => onToken(""),
          "error-callback": () => onToken(""),
        });
      })
      .catch(() => onToken(""));
    return () => {
      batal = true;
      if (id !== undefined) window.turnstile?.remove(id);
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  return KEY ? <div ref={ref} /> : null;
}