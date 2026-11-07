import { useEffect, useState } from "react";
import { api, DEMO } from "./api";
import { CONTACT } from "../data/content";

// Data cadangan: dipakai bila server tidak bisa dihubungi, supaya halaman tidak pernah kosong.
export const KONTAK_BAWAAN = {
  alamat: CONTACT.alamat,
  telepon: CONTACT.telp,
  email: CONTACT.email,
  whatsapp: null,
  maps_url: null,
  jam_layanan: [{ hari: "", jam: CONTACT.jam, keterangan: "" }],
  media_sosial: [],
  bagian: [],
};

let cache = null; // data terakhir yang berhasil diambil
let janji = null; // permintaan yang sedang berjalan (dipakai bersama oleh Footer dan halaman Kontak)

export function muatKontak() {
  if (DEMO) return Promise.resolve(KONTAK_BAWAAN);
  if (cache) return Promise.resolve(cache);
  if (!janji) {
    janji = api("/kontak")
      .then((d) => { cache = d; return d; })
      .finally(() => { janji = null; });
  }
  return janji;
}

// Dipanggil setelah admin menyimpan, supaya data baru langsung terbaca.
export const resetCacheKontak = () => { cache = null; };

export function useKontak() {
  const [data, setData] = useState(cache ?? KONTAK_BAWAAN);
  useEffect(() => {
    let batal = false;
    muatKontak().then((d) => !batal && setData(d)).catch(() => {});
    return () => { batal = true; };
  }, []);
  return data;
}

// Ringkasan jam layanan (baris pertama) untuk Footer.
export const ringkasJam = (k) => {
  const j = k.jam_layanan?.[0];
  return j ? `${j.hari ? `${j.hari} ` : ""}${j.jam}` : "";
};