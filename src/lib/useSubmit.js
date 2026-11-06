import { useCallback, useEffect, useRef, useState } from "react";

// Membungkus aksi async supaya tidak bisa dijalankan dua kali bersamaan
// (klik ganda, tekan Enter berulang). Mengembalikan [jalankan, sedangBerjalan].
export function useSubmit(fn) {
  const [pending, setPending] = useState(false);
  const sibuk = useRef(false);
  const terbaru = useRef(fn);

  useEffect(() => {
    terbaru.current = fn;
  });

  const jalankan = useCallback(async (...args) => {
    if (sibuk.current) return undefined;
    sibuk.current = true;
    setPending(true);
    try {
      return await terbaru.current(...args);
    } finally {
      sibuk.current = false;
      setPending(false);
    }
  }, []);

  return [jalankan, pending];
}