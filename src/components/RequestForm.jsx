import { useState } from "react";
import { ExclamationTriangleIcon, ArrowUpTrayIcon, XMarkIcon, DocumentIcon } from "@heroicons/react/24/outline";
import { JENIS_SURAT } from "../data/content";

const MAX_MB = 2;
const OK_EXT = ["pdf", "jpg", "jpeg", "png"];
const input =
  "h-12 w-full rounded-lg border border-line px-4 text-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 disabled:bg-surface";

export function validate(v) {
  const e = {};
  if (!v.jenis) e.jenis = "Pilih jenis layanan.";
  if (!v.perihal || v.perihal.trim().length < 5) e.perihal = "Tuliskan perihal minimal 5 karakter.";
  if (!v.tanggal) e.tanggal = "Pilih tanggal dibutuhkan.";
  return e;
}

function Field({ id, label, required, hint, error, note, children }) {
  return (
    <div className={note ? "rounded-xl border border-orange-300 bg-orange-50/60 p-4" : ""}>
      <label htmlFor={id} className="mb-1.5 block text-sm font-semibold text-navy">
        {label}
        {required && <span className="text-red-600"> *</span>}
      </label>
      {children}
      {hint && <p className="mt-1 text-xs text-slate-500">{hint}</p>}
      {error && (
        <p role="alert" className="mt-1 text-xs font-medium text-red-600">
          {error}
        </p>
      )}
      {note && (
        <p className="mt-2 flex gap-2 text-sm text-orange-800">
          <ExclamationTriangleIcon className="mt-0.5 h-4 w-4 shrink-0" />
          <span>
            <b>Catatan petugas:</b> {note}
          </span>
        </p>
      )}
    </div>
  );
}

function Upload({ files, onChange }) {
  const [problems, setProblems] = useState([]);

  const add = (list) => {
    const ok = [];
    const bad = [];
    for (const f of Array.from(list)) {
      const ext = f.name.split(".").pop().toLowerCase();
      if (!OK_EXT.includes(ext)) bad.push(`${f.name}: jenis file harus PDF, JPG, atau PNG`);
      else if (f.size > MAX_MB * 1024 * 1024) bad.push(`${f.name}: ukuran melebihi ${MAX_MB} MB`);
      else if (!files.includes(f.name)) ok.push(f.name);
    }
    setProblems(bad);
    if (ok.length) onChange([...files, ...ok]);
  };

  return (
    <div>
      <label
        htmlFor="lampiran"
        onDragOver={(e) => e.preventDefault()}
        onDrop={(e) => {
          e.preventDefault();
          add(e.dataTransfer.files);
        }}
        className="flex cursor-pointer flex-col items-center gap-1 rounded-xl border-2 border-dashed border-line bg-surface px-4 py-6 text-center text-sm text-slate-600 hover:border-primary hover:bg-blue-50"
      >
        <ArrowUpTrayIcon className="h-6 w-6 text-primary" />
        <span className="font-semibold text-navy">Klik untuk memilih file atau seret ke sini</span>
        <span className="text-xs">PDF, JPG, atau PNG, maksimal {MAX_MB} MB per file</span>
        <input
          id="lampiran"
          type="file"
          multiple
          accept=".pdf,.jpg,.jpeg,.png"
          className="sr-only"
          onChange={(e) => {
            add(e.target.files);
            e.target.value = "";
          }}
        />
      </label>
      {problems.map((p) => (
        <p key={p} role="alert" className="mt-1 text-xs font-medium text-red-600">
          {p}
        </p>
      ))}
      {files.length > 0 && (
        <ul className="mt-3 space-y-2">
          {files.map((n) => (
            <li key={n} className="flex items-center justify-between rounded-lg border border-line bg-white px-3 py-2 text-sm">
              <span className="flex items-center gap-2 text-slate-700">
                <DocumentIcon className="h-4 w-4 text-primary" /> {n}
              </span>
              <button
                type="button"
                aria-label={`Hapus ${n}`}
                onClick={() => onChange(files.filter((x) => x !== n))}
                className="text-slate-400 hover:text-red-600"
              >
                <XMarkIcon className="h-4 w-4" />
              </button>
            </li>
          ))}
        </ul>
      )}
      <p className="mt-2 text-xs text-slate-400">Mode demo: file tidak diunggah ke server, hanya namanya yang dicatat.</p>
    </div>
  );
}

export default function RequestForm({ values, onChange, errors = {}, notes = {}, showJenis = false }) {
  return (
    <div className="space-y-5">
      {showJenis && (
        <Field id="jenis" label="Jenis layanan" required error={errors.jenis} note={notes.jenis}>
          <select id="jenis" value={values.jenis} onChange={(e) => onChange({ jenis: e.target.value })} className={input}>
            <option value="">Pilih jenis layanan</option>
            {JENIS_SURAT.map((j) => (
              <option key={j}>{j}</option>
            ))}
          </select>
        </Field>
      )}

      <Field id="perihal" label="Perihal / keperluan" required error={errors.perihal} note={notes.perihal}
        hint="Jelaskan untuk keperluan apa layanan ini diajukan.">
        <input id="perihal" value={values.perihal} onChange={(e) => onChange({ perihal: e.target.value })}
          placeholder="Contoh: surat keterangan untuk keperluan beasiswa" className={input} />
      </Field>

      <Field id="tanggal" label="Tanggal dibutuhkan" required error={errors.tanggal} note={notes.tanggal}>
        <input id="tanggal" type="date" value={values.tanggal} onChange={(e) => onChange({ tanggal: e.target.value })} className={input} />
      </Field>

      <Field id="keterangan" label="Keterangan tambahan" note={notes.keterangan}>
        <textarea id="keterangan" rows={3} value={values.keterangan} onChange={(e) => onChange({ keterangan: e.target.value })}
          className="w-full rounded-lg border border-line px-4 py-3 text-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20" />
      </Field>

      <Field id="lampiran" label="Lampiran" note={notes.lampiran}>
        <Upload files={values.lampiran} onChange={(lampiran) => onChange({ lampiran })} />
      </Field>
    </div>
  );
}
