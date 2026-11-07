import { ChevronDownIcon } from "@heroicons/react/24/outline";

// Jawaban ditampilkan sebagai teks biasa (aman), baris baru tetap dipertahankan.
export default function FaqAccordion({ items }) {
  return (
    <div className="divide-y divide-line rounded-xl border border-line bg-white">
      {items.map((f) => (
        <details key={f.id} className="group p-5">
          <summary className="flex cursor-pointer list-none items-start justify-between gap-4 font-semibold text-navy [&::-webkit-details-marker]:hidden">
            <span>{f.pertanyaan}</span>
            <ChevronDownIcon className="mt-1 h-5 w-5 shrink-0 text-slate-400 transition-transform group-open:rotate-180" />
          </summary>
          <p className="mt-3 whitespace-pre-line text-sm leading-6 text-slate-600">{f.jawaban}</p>
        </details>
      ))}
    </div>
  );
}