import { createContext, useContext, useEffect, useMemo, useReducer, useState } from "react";
import { SEED_REQUESTS } from "../data/content";
import { nowLabel } from "../lib/format";

const KEY = "sman104-demo-v2";
const initial = () => ({ user: null, requests: SEED_REQUESTS });

function load() {
  try {
    const raw = sessionStorage.getItem(KEY);
    if (raw) {
      const s = JSON.parse(raw);
      if (s && Array.isArray(s.requests)) return s;
    }
  } catch {
    /* penyimpanan tidak tersedia, pakai data awal */
  }
  return initial();
}

export function nextId(requests) {
  const max = requests.reduce((m, r) => Math.max(m, parseInt(r.id.split("-")[2], 10) || 0), 0);
  return `TU-2026-${String(max + 1).padStart(5, "0")}`;
}

function reducer(state, a) {
  switch (a.type) {
    case "LOGIN":
      return { ...state, user: a.user };
    case "LOGOUT":
      return { ...state, user: null };
    case "SUBMIT":
      return { ...state, requests: [a.req, ...state.requests] };
    case "STATUS":
      return {
        ...state,
        requests: state.requests.map((r) =>
          r.id !== a.id
            ? r
            : {
                ...r,
                status: a.status,
                fieldNotes: a.fieldNotes || {},
                history: [
                  ...r.history,
                  {
                    label: a.label || a.status,
                    status: a.status,
                    time: nowLabel(),
                    by: a.by,
                    note: a.note || "",
                    fieldNotes: a.fieldNotes || {},
                  },
                ],
              }
        ),
      };
    case "RESUBMIT":
      return {
        ...state,
        requests: state.requests.map((r) =>
          r.id !== a.id
            ? r
            : {
                ...r,
                ...a.data,
                status: "Menunggu",
                fieldNotes: {},
                revisi: (r.revisi || 0) + 1,
                history: [
                  ...r.history,
                  { label: "Dikirim ulang", status: "Menunggu", time: nowLabel(), by: a.by, note: "" },
                ],
              }
        ),
      };
    case "RESET":
      return { ...initial(), user: state.user };
    default:
      return state;
  }
}

export const EMPTY_DRAFT = { jenis: "", perihal: "", tanggal: "", keterangan: "", lampiran: [] };

const Ctx = createContext(null);

export function AppProvider({ children }) {
  const [state, dispatch] = useReducer(reducer, undefined, load);
  const [draft, setDraft] = useState(EMPTY_DRAFT);

  useEffect(() => {
    try {
      sessionStorage.setItem(KEY, JSON.stringify(state));
    } catch {
      /* abaikan */
    }
  }, [state]);

  const value = useMemo(
    () => ({ user: state.user, requests: state.requests, draft, setDraft, dispatch }),
    [state, draft]
  );
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export const useApp = () => useContext(Ctx);
