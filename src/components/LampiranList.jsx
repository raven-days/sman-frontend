import { useState } from "react";
import { DocumentIcon } from "@heroicons/react/24/outline";
import { bukaLampiran } from "../lib/api";

export default function LampiranList({ items = [] }) {
  const [err, setErr] = useState("");
  if (items.length === 0) return <span>Tidak ada</span>;

  const buka = async (l) => {
    setErr("");
    try {
      await bukaLampiran(l.path);
    } catch (e) {
      setErr(e.message);
    }
  };

  return (
    <div>
      <ul className="space-y-1">
        {items.map((l) => (
          <li key={l.id}>
            <button type="button" onClick={() => buka(l)} className="inline-flex items-center gap-2 font-semibold text-primary hover:underline">
              <DocumentIcon className="h-4 w-4" /> {l.nama}
            </button>
          </li>
        ))}
      </ul>
      {err && <p role="alert" className="mt-1 text-xs text-red-600">{err}</p>}
    </div>
  );
}