import {
  CheckCircleIcon,
  ExclamationTriangleIcon,
  XCircleIcon,
} from "@heroicons/react/24/solid";

const FLOW = ["Menunggu", "Diverifikasi", "Disetujui", "Selesai"];

function Icon({ status }) {
  if (status === "Perlu Perbaikan") return <ExclamationTriangleIcon className="h-6 w-6 text-amber-500" />;
  if (status === "Ditolak") return <XCircleIcon className="h-6 w-6 text-red-500" />;
  return <CheckCircleIcon className="h-6 w-6 text-green-600" />;
}

// showDetail=false untuk tampilan publik: sembunyikan petugas dan catatan.
export default function Timeline({ history, status, showDetail = true }) {
  const idx = FLOW.indexOf(status);
  const pending =
    status === "Perlu Perbaikan"
      ? ["Diverifikasi", "Disetujui", "Selesai"]
      : idx >= 0
      ? FLOW.slice(idx + 1)
      : [];
  const total = history.length + pending.length;

  return (
    <ol>
      {history.map((h, i) => (
        <li key={`${h.label}-${i}`} className="flex gap-4">
          <div className="flex flex-col items-center">
            <Icon status={h.status} />
            {i < total - 1 && <span className="my-1 w-0.5 flex-1 bg-line" />}
          </div>
          <div className="pb-6">
            <p className="text-sm font-semibold text-navy">{h.label}</p>
            <p className="text-xs text-slate-500">
              {h.time}
              {showDetail && h.by ? ` · ${h.by}` : ""}
            </p>
            {showDetail && h.note && (
              <p className="mt-1 rounded-lg bg-surface px-3 py-2 text-sm text-slate-700">{h.note}</p>
            )}
          </div>
        </li>
      ))}
      {pending.map((p, i) => (
        <li key={p} className="flex gap-4">
          <div className="flex flex-col items-center">
            <span className="h-6 w-6 rounded-full border-2 border-line" />
            {history.length + i < total - 1 && <span className="my-1 w-0.5 flex-1 bg-line" />}
          </div>
          <div className="pb-6">
            <p className="text-sm font-semibold text-slate-400">{p}</p>
          </div>
        </li>
      ))}
    </ol>
  );
}
