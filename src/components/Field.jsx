import { useId } from "react";
import { ExclamationCircleIcon } from "@heroicons/react/24/outline";

export const inputCls = (error) =>
  `w-full rounded-lg border px-3 text-sm transition-colors focus:outline-none focus:ring-2 ${
    error
      ? "border-red-400 focus:border-red-500 focus:ring-red-200"
      : "border-line focus:border-primary focus:ring-primary/20"
  }`;

/**
 * Label + isian + pesan error di bawahnya.
 * `children` adalah fungsi yang menerima atribut aksesibilitas (id, aria-*):
 *   <Field label="Nomor" error={errs.nomor}>{(p) => <input {...p} />}</Field>
 */
export default function Field({ label, required, error, hint, className = "", children }) {
  const id = useId();
  const errId = `${id}-err`;
  const hintId = `${id}-hint`;
  const describedBy = [error && errId, hint && hintId].filter(Boolean).join(" ");
  const props = {
    id,
    "aria-invalid": error ? "true" : undefined,
    "aria-required": required ? "true" : undefined,
    "aria-describedby": describedBy || undefined,
  };

  return (
    <div className={className}>
      <label htmlFor={id} className="mb-1 block text-sm font-semibold text-navy">
        {label}
        {required && <span aria-hidden="true" className="text-red-600"> *</span>}
      </label>
      {children(props)}
      {hint && !error && <p id={hintId} className="mt-1 text-xs text-slate-500">{hint}</p>}
      {error && (
        <p id={errId} className="mt-1 flex items-start gap-1 text-xs font-medium text-red-600">
          <ExclamationCircleIcon className="mt-px h-4 w-4 shrink-0" aria-hidden="true" />
          {error}
        </p>
      )}
    </div>
  );
}