import { createContext, useCallback, useContext, useEffect, useId, useRef, useState } from "react";
import { ExclamationCircleIcon } from "@heroicons/react/24/outline";
import Modal from "../components/Modal";

const ConfirmCtx = createContext(null);

const TOMBOL = {
  danger: "bg-red-600 hover:bg-red-700",
  warning: "bg-orange-600 hover:bg-orange-700",
  primary: "bg-primary hover:bg-primary-dark",
};
const KOTAK = {
  danger: "border-red-200 bg-red-50 text-red-800",
  warning: "border-orange-200 bg-orange-50 text-orange-900",
  primary: "border-blue-200 bg-blue-50 text-navy",
};

/**
 * const confirm = useConfirm();
 * const ya = await confirm({
 *   title, description,
 *   items: [{ label: "Nama", value: "..." }],   // identitas data yang diproses
 *   consequence: "Akibat dari tindakan ini",
 *   confirmText, cancelText, tone: "danger" | "warning" | "primary",
 *   ketik: "TEKS",                               // opsional: pengguna harus mengetik teks ini
 *   action: async () => {...},                   // opsional: dijalankan saat Konfirmasi; error tampil di dialog
 * });
 * Hasilnya true bila dikonfirmasi (dan action berhasil), false bila dibatalkan.
 */
export function ConfirmProvider({ children }) {
  const [state, setState] = useState(null); // { opts, resolve }
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [ketik, setKetik] = useState("");
  const sibuk = useRef(false);
  const aktif = useRef(null);
  const descId = useId();
  const ketikId = useId();

  const selesai = useCallback((hasil) => {
    const cur = aktif.current;
    aktif.current = null;
    setState(null);
    cur?.resolve(hasil);
  }, []);

  const confirm = useCallback((opts) => {
    aktif.current?.resolve(false); // dialog lama (kalau ada) dianggap dibatalkan
    return new Promise((resolve) => {
      sibuk.current = false;
      setBusy(false);
      setError("");
      setKetik("");
      aktif.current = { opts, resolve };
      setState(aktif.current);
    });
  }, []);

  // Sesi berakhir: tutup dialog yang masih terbuka.
  useEffect(() => {
    const h = () => aktif.current && selesai(false);
    window.addEventListener("sman:unauthorized", h);
    return () => window.removeEventListener("sman:unauthorized", h);
  }, [selesai]);

  const ya = async () => {
    if (sibuk.current || !state) return;
    const { action } = state.opts;
    if (!action) return selesai(true);
    sibuk.current = true;
    setBusy(true);
    setError("");
    try {
      await action();
      sibuk.current = false;
      setBusy(false);
      selesai(true);
    } catch (e) {
      sibuk.current = false;
      setBusy(false);
      if (e?.status !== 401) setError(e?.message || "Tindakan gagal. Silakan coba lagi.");
    }
  };

  const o = state?.opts;
  const tone = o?.tone || "primary";
  const perluKetik = !!o?.ketik;
  const bolehLanjut = !perluKetik || ketik.trim() === o.ketik;

  return (
    <ConfirmCtx.Provider value={confirm}>
      {children}
      {o && (
        <Modal
          title={o.title}
          role={tone === "primary" ? "dialog" : "alertdialog"}
          size="max-w-md"
          locked={busy}
          describedBy={descId}
          onClose={() => selesai(false)}
          footer={
            <>
              <button
                type="button"
                data-autofocus={tone !== "primary" ? "" : undefined}
                disabled={busy}
                onClick={() => selesai(false)}
                className="rounded-lg border border-line px-4 py-2.5 text-sm font-semibold text-navy transition-colors hover:bg-surface disabled:opacity-60"
              >
                {o.cancelText || "Batal"}
              </button>
              <button
                type="button"
                data-autofocus={tone === "primary" ? "" : undefined}
                disabled={busy || !bolehLanjut}
                onClick={ya}
                className={`rounded-lg px-5 py-2.5 text-sm font-semibold text-white transition-colors disabled:cursor-not-allowed disabled:opacity-60 ${TOMBOL[tone]}`}
              >
                {busy ? "Memproses..." : o.confirmText || "Konfirmasi"}
              </button>
            </>
          }
        >
          {o.description && <p id={descId} className="text-sm leading-6 text-slate-700">{o.description}</p>}

          {o.items?.length > 0 && (
            <dl className="mt-4 divide-y divide-line rounded-lg border border-line bg-surface text-sm">
              {o.items.map((it) => (
                <div key={it.label} className="grid gap-1 px-3 py-2 sm:grid-cols-3">
                  <dt className="text-slate-500">{it.label}</dt>
                  <dd className="break-words font-semibold text-navy sm:col-span-2">{it.value}</dd>
                </div>
              ))}
            </dl>
          )}

          {o.consequence && (
            <p className={`mt-4 rounded-lg border px-3 py-2.5 text-sm ${KOTAK[tone]}`}>{o.consequence}</p>
          )}

          {perluKetik && (
            <div className="mt-4">
              <label htmlFor={ketikId} className="block text-sm text-slate-700">
                Ketik <b className="select-all">{o.ketik}</b> untuk melanjutkan.
              </label>
              <input
                id={ketikId}
                value={ketik}
                onChange={(e) => setKetik(e.target.value)}
                autoComplete="off"
                disabled={busy}
                className="mt-1 h-11 w-full rounded-lg border border-line px-3 text-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
              />
            </div>
          )}

          {error && (
            <p role="alert" className="mt-4 flex items-start gap-2 rounded-lg border border-red-200 bg-red-50 px-3 py-2.5 text-sm text-red-700">
              <ExclamationCircleIcon className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
              {error}
            </p>
          )}
        </Modal>
      )}
    </ConfirmCtx.Provider>
  );
}

export const useConfirm = () => useContext(ConfirmCtx);