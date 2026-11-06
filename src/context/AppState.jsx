import { createContext, useContext, useEffect, useMemo, useReducer, useState } from "react";
import { api, setToken, DEMO } from "../lib/api";
import { useToast } from "./Toast";

const KEY = "sman104-demo-v2";

function load() {
  try {
    const raw = sessionStorage.getItem(KEY);
    if (raw) {
      const s = JSON.parse(raw);
      if (s && typeof s === "object") return { user: s.user || null };
    }
  } catch {
    /* penyimpanan tidak tersedia */
  }
  return { user: null };
}

function reducer(state, a) {
  switch (a.type) {
    case "LOGIN":
      return { ...state, user: a.user };
    case "LOGOUT":
      return { ...state, user: null };
    default:
      return state;
  }
}

export const EMPTY_DRAFT = { jenis: "", perihal: "", tanggal: "", keterangan: "", lampiran: [] };

const Ctx = createContext(null);

export function AppProvider({ children }) {
  const [state, dispatch] = useReducer(reducer, undefined, load);
  const [draft, setDraft] = useState(EMPTY_DRAFT);
  const toast = useToast();

  useEffect(() => {
    try {
      sessionStorage.setItem(KEY, JSON.stringify(state));
    } catch {
      /* abaikan */
    }
  }, [state]);

  // Hapus token saat keluar
  useEffect(() => {
    if (!state.user) setToken(null);
  }, [state.user]);

  // Server menolak token (kedaluwarsa/dicabut): keluar otomatis dan beri tahu pengguna.
  useEffect(() => {
    const h = () => {
      dispatch({ type: "LOGOUT" });
      toast.warning("Sesi Anda telah berakhir. Silakan masuk kembali.");
    };
    window.addEventListener("sman:unauthorized", h);
    return () => window.removeEventListener("sman:unauthorized", h);
  }, [toast]);

  // Cek token saat halaman dibuka (kalau ditolak, api() mengirim event di atas)
  useEffect(() => {
    if (DEMO || !state.user) return;
    api("/me").catch(() => {});
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const value = useMemo(() => ({ user: state.user, draft, setDraft, dispatch }), [state, draft]);
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export const useApp = () => useContext(Ctx);