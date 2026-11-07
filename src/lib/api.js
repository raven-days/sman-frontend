import { useEffect, useState } from "react";

export const API_URL = import.meta.env.VITE_API_URL || "http://localhost:8000/api";
export const DEMO = import.meta.env.VITE_DEMO_LOGIN === "true";

const TOKEN_KEY = "sman104-token";

export const getToken = () => {
  try { return sessionStorage.getItem(TOKEN_KEY); } catch { return null; }
};
export const setToken = (t) => {
  try {
    if (t) sessionStorage.setItem(TOKEN_KEY, t);
    else sessionStorage.removeItem(TOKEN_KEY);
  } catch { /* abaikan */ }
};

// Penanya kata sandi: didaftarkan oleh SandiUlangProvider (lihat context/SandiUlang.jsx).
let penanyaSandi = null;
export const daftarkanPenanyaSandi = (fn) => { penanyaSandi = fn; };

export async function api(path, { method = "GET", body } = {}, sudahUlang = false) {
  const token = getToken();
  const isForm = typeof FormData !== "undefined" && body instanceof FormData;
  const res = await fetch(API_URL + path, {
    method,
    headers: {
      Accept: "application/json",
      ...(body && !isForm ? { "Content-Type": "application/json" } : {}),
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: body ? (isForm ? body : JSON.stringify(body)) : undefined,
  });
  const data = await res.json().catch(() => null);
  if (!res.ok) {
    // Aksi sensitif: server minta konfirmasi kata sandi. Tanyakan, lalu ulangi permintaan satu kali.
    if (res.status === 428 && data?.perlu_sandi && penanyaSandi && !sudahUlang) {
      if (await penanyaSandi()) return api(path, { method, body }, true);
      const batal = new Error("Konfirmasi kata sandi dibatalkan.");
      batal.status = 428;
      throw batal;
    }
    // Token kedaluwarsa/dicabut/akun nonaktif: beri tahu aplikasi agar keluar otomatis.
    if (res.status === 401 && token) window.dispatchEvent(new Event("sman:unauthorized"));
    const err = new Error(data?.message || `Permintaan gagal (${res.status})`);
    err.status = res.status;
    err.errors = data?.errors;
    throw err;
  }
  return data;
}

export function useFetch(path) {
  const [state, setState] = useState({ data: null, loading: true, error: null });
  useEffect(() => {
    if (!path) return undefined; // path kosong = tidak usah memanggil server
    let batal = false;
    api(path)
      .then((data) => !batal && setState({ data, loading: false, error: null }))
      .catch((e) => !batal && setState({ data: null, loading: false, error: e.message }));
    return () => { batal = true; };
  }, [path]);
  return path ? state : { data: null, loading: false, error: null };
}

// Buka file lampiran yang dilindungi login (token dikirim lewat header).
export async function bukaLampiran(path) {
  const win = window.open("", "_blank");
  try {
    const res = await fetch(API_URL + path, { headers: { Authorization: `Bearer ${getToken()}` } });
    if (!res.ok) throw new Error("File tidak dapat dibuka.");
    const url = URL.createObjectURL(await res.blob());
    if (win) win.location.href = url;
    else window.location.href = url;
  } catch (e) {
    if (win) win.close();
    throw e;
  }
}

// Beri tahu server bahwa pengguna keluar (mencabut token). Gagal pun tidak masalah.
export function keluarDiServer() {
  return api("/logout", { method: "POST" }).catch(() => {});
}