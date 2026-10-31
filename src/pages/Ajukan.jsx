import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { CheckIcon } from "@heroicons/react/24/solid";
import { JENIS_SURAT } from "../data/content";
import { useApp, nextId, EMPTY_DRAFT } from "../context/AppState";
import { nowLabel, fmtDate } from "../lib/format";
import RequestForm, { validate } from "../components/RequestForm";

const STEPS = ["Pilih Layanan", "Isi Formulir", "Konfirmasi"];

export default function Ajukan() {
  const { user, requests, draft, setDraft, dispatch } = useApp();
  const navigate = useNavigate();
  const [step, setStep] = useState(draft.perihal ? 2 : 0);
  const [errors, setErrors] = useState({});
  const [agree, setAgree] = useState(false);
  const [agreeErr, setAgreeErr] = useState("");

  const change = (partial) => setDraft({ ...draft, ...partial });

  const next = () => {
    if (step === 0) {
      if (!draft.jenis) return setErrors({ jenis: "Pilih salah satu jenis layanan." });
      setErrors({});
      return setStep(1);
    }
    const e = validate(draft);
    setErrors(e);
    if (Object.keys(e).length === 0) setStep(2);
  };

  const submit = () => {
    if (!user) return navigate("/login", { state: { from: "/ajukan" } });
    if (!agree) return setAgreeErr("Centang pernyataan di atas sebelum mengirim.");
    const id = nextId(requests);
    dispatch({
      type: "SUBMIT",
      req: {
        id,
        jenis: draft.jenis,
        perihal: draft.perihal.trim(),
        tanggal: draft.tanggal,
        keterangan: draft.keterangan.trim(),
        lampiran: draft.lampiran,
        pemohon: user.name,
        ownerRole: user.role,
        status: "Menunggu",
        fieldNotes: {},
        revisi: 0,
        history: [{ label: "Diajukan", status: "Menunggu", time: nowLabel(), by: user.name, note: "" }],
      },
    });
    setDraft(EMPTY_DRAFT);
    navigate(`/pengajuan/${id}`, { state: { baru: true } });
  };

  return (
    <div className="mx-auto max-w-[760px] px-5 py-12 sm:px-8">
      <nav className="text-xs text-slate-500">
        <Link to="/" className="hover:text-primary">Beranda</Link> /{" "}
        <Link to="/layanan/administrasi-persuratan" className="hover:text-primary">Administrasi & Persuratan</Link> / Ajukan
      </nav>
      <h1 className="mt-3 text-3xl font-extrabold text-navy">Ajukan Layanan</h1>

      {!user && (
        <p className="mt-4 rounded-lg border border-blue-200 bg-blue-50 px-4 py-3 text-sm text-blue-900">
          Anda belum masuk. Formulir ini bisa dilihat dan diisi, tetapi Anda perlu{" "}
          <Link to="/login" state={{ from: "/ajukan" }} className="font-semibold underline">masuk</Link> saat akan mengirim.
        </p>
      )}

      <ol className="mt-8 flex items-center gap-2 text-sm">
        {STEPS.map((s, i) => (
          <li key={s} className="flex flex-1 items-center gap-2">
            <span
              className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xs font-bold ${
                i < step ? "bg-green-600 text-white" : i === step ? "bg-primary text-white" : "bg-surface text-slate-400"
              }`}
            >
              {i < step ? <CheckIcon className="h-4 w-4" /> : i + 1}
            </span>
            <span className={`hidden font-semibold sm:inline ${i === step ? "text-navy" : "text-slate-400"}`}>{s}</span>
            {i < STEPS.length - 1 && <span className="h-px flex-1 bg-line" />}
          </li>
        ))}
      </ol>

      <section className="mt-8 rounded-xl border border-line bg-white p-6">
        {step === 0 && (
          <fieldset>
            <legend className="text-lg font-bold text-navy">Pilih jenis layanan</legend>
            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              {JENIS_SURAT.map((j) => (
                <label
                  key={j}
                  className={`flex cursor-pointer items-center gap-3 rounded-xl border p-4 ${
                    draft.jenis === j ? "border-primary bg-blue-50 ring-2 ring-primary/20" : "border-line bg-white hover:bg-surface"
                  }`}
                >
                  <input type="radio" name="jenis" checked={draft.jenis === j} onChange={() => change({ jenis: j })} className="h-4 w-4 accent-[#0878d1]" />
                  <span className="font-semibold text-navy">{j}</span>
                </label>
              ))}
            </div>
            {errors.jenis && <p role="alert" className="mt-2 text-xs font-medium text-red-600">{errors.jenis}</p>}
            <p className="mt-4 text-xs text-slate-400">Daftar jenis layanan masih contoh dan akan disesuaikan dengan Tata Usaha.</p>
          </fieldset>
        )}

        {step === 1 && (
          <>
            <p className="mb-5 flex items-center justify-between rounded-lg bg-surface px-4 py-2.5 text-sm">
              <span>Jenis layanan: <b className="text-navy">{draft.jenis}</b></span>
              <button type="button" onClick={() => setStep(0)} className="font-semibold text-primary">Ubah</button>
            </p>
            <RequestForm values={draft} onChange={change} errors={errors} />
          </>
        )}

        {step === 2 && (
          <>
            <h2 className="text-lg font-bold text-navy">Periksa kembali data Anda</h2>
            <dl className="mt-4 divide-y divide-line text-sm">
              {[
                ["Jenis layanan", draft.jenis],
                ["Perihal / keperluan", draft.perihal],
                ["Tanggal dibutuhkan", fmtDate(draft.tanggal)],
                ["Keterangan tambahan", draft.keterangan || "-"],
                ["Lampiran", draft.lampiran.length ? draft.lampiran.join(", ") : "Tidak ada"],
              ].map(([k, v]) => (
                <div key={k} className="grid gap-1 py-3 sm:grid-cols-3">
                  <dt className="text-slate-500">{k}</dt>
                  <dd className="font-semibold text-navy sm:col-span-2">{v}</dd>
                </div>
              ))}
            </dl>
            <label className="mt-5 flex items-start gap-3 text-sm text-slate-700">
              <input type="checkbox" checked={agree} onChange={(e) => { setAgree(e.target.checked); setAgreeErr(""); }} className="mt-0.5 h-4 w-4" />
              Saya menyatakan data yang diisi sudah benar.
            </label>
            {agreeErr && <p role="alert" className="mt-1 text-xs font-medium text-red-600">{agreeErr}</p>}
            <p className="mt-4 rounded-lg bg-surface px-4 py-3 text-xs text-slate-600">
              Jika petugas menemukan isian yang belum sesuai, pengajuan akan ditunda beserta catatan yang menjelaskan bagian yang perlu diperbaiki. Anda dapat memperbaikinya lalu mengirim ulang.
            </p>
          </>
        )}
      </section>

      <div className="mt-6 flex justify-between">
        {step > 0 ? (
          <button type="button" onClick={() => setStep(step - 1)} className="rounded-lg border border-line bg-white px-6 py-3 text-sm font-semibold text-navy hover:bg-blue-50">
            Kembali
          </button>
        ) : (
          <Link to="/" className="rounded-lg border border-line bg-white px-6 py-3 text-sm font-semibold text-navy hover:bg-blue-50">Batal</Link>
        )}
        {step < 2 ? (
          <button type="button" onClick={next} className="rounded-lg bg-primary px-7 py-3 text-sm font-semibold text-white hover:bg-primary-dark">Lanjut</button>
        ) : (
          <button type="button" onClick={submit} className="rounded-lg bg-primary px-7 py-3 text-sm font-semibold text-white hover:bg-primary-dark">
            {user ? "Kirim Pengajuan" : "Masuk untuk Mengirim"}
          </button>
        )}
      </div>
    </div>
  );
}
