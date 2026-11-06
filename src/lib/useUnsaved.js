import { useEffect, useRef } from "react";
import { useBlocker } from "react-router-dom";
import { useConfirm } from "../context/Confirm";

const ser = (v) =>
  JSON.stringify(v, (_k, x) => (typeof File !== "undefined" && x instanceof File ? `file:${x.name}:${x.size}` : x));

/**
 * Apakah `value` (state formulir) sudah berbeda dari saat pertama kali dibuka?
 * Snapshot diambil saat value berubah dari null menjadi objek, dan dikosongkan lagi saat value null.
 */
export function useDirty(value) {
  const awal = useRef(null);
  const ada = value !== null && value !== undefined;
  if (!ada) awal.current = null;
  else if (awal.current === null) awal.current = ser(value);
  return ada && awal.current !== ser(value);
}

/**
 * Lindungi perubahan yang belum disimpan.
 * - Menutup/memuat ulang tab: peringatan bawaan browser.
 * - Pindah halaman di dalam aplikasi (link, tombol Kembali): dialog konfirmasi (hanya jika block = true).
 */
export function useUnsavedChanges(dirty, { block = true, pesan } = {}) {
  const confirm = useConfirm();

  const blocker = useBlocker(
    ({ currentLocation, nextLocation }) =>
      block &&
      dirty &&
      currentLocation.pathname + currentLocation.search !== nextLocation.pathname + nextLocation.search
  );

  useEffect(() => {
    if (blocker.state !== "blocked") return undefined;
    let aktif = true;
    confirm({
      title: "Tinggalkan halaman ini?",
      description: pesan || "Perubahan yang belum disimpan akan hilang.",
      confirmText: "Tinggalkan",
      cancelText: "Tetap di sini",
      tone: "warning",
    }).then((ya) => {
      if (!aktif) return;
      if (ya) blocker.proceed();
      else blocker.reset();
    });
    return () => {
      aktif = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [blocker.state]);

  useEffect(() => {
    if (!dirty) return undefined;
    const h = (e) => {
      e.preventDefault();
      e.returnValue = "";
    };
    window.addEventListener("beforeunload", h);
    return () => window.removeEventListener("beforeunload", h);
  }, [dirty]);
}