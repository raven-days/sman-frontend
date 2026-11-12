import { PlusIcon, TrashIcon, ExclamationTriangleIcon } from "@heroicons/react/24/outline";
import { useFetch } from "../lib/api";
import { JENIS_GURU, UNIT_KERJA, FIELD_LABELS } from "../data/content";
import { fmtDate } from "../lib/format";
import { Field, Upload, input } from "./RequestForm";

const kosong = (x) => !x || !String(x).trim();

/** Isi bawaan untuk Surat Tugas (perorangan, 1 baris nama). */
export function dataSiap(jenis, d = {}) {
  if (jenis === "Surat Tugas") {
    const tipe = d.tipe || "perorangan";
    let penerima = (d.penerima?.length ? d.penerima : [""]).map((x) => String(x).trim());
    if (tipe === "perorangan") penerima = penerima.slice(0, 1);
    return { ...d, tipe, penerima };
  }
  return d;
}

/** Tempel data ke FormData sebagai data[kunci] dan data[kunci][]. */
export function tambahData(fd, d) {
  Object.entries(d).forEach(([k, v]) => {
    if (Array.isArray(v)) v.forEach((x) => fd.append(`data[${k}][]`, x));
    else if (v !== undefined && v !== null) fd.append(`data[${k}]`, v);
  });
}

export function validateGuru(v) {
  const e = {};
  const d = dataSiap(v.jenis, v.data || {});
  if (!v.jenis) e.jenis = "Pilih jenis layanan.";
  if (kosong(d.pemohon)) e.pemohon = "Pilih nama pemohon.";

  if (v.jenis === "Surat Undangan") {
    if (!UNIT_KERJA.includes(d.unit)) e.unit = "Pilih bidang / unit kerja.";
    if (kosong(d.acara)) e.acara = "Isi acara undangan.";
    if (kosong(d.tujuan)) e.tujuan = "Isi tujuan undangan.";
    if (kosong(d.tanggal_acara)) e.tanggal_acara = "Pilih tanggal acara.";
    if (kosong(d.waktu)) e.waktu = "Isi waktu acara.";
    if (kosong(d.tempat)) e.tempat = "Isi tempat acara.";
  }

  if (v.jenis === "Surat Tugas") {
    if (!d.disetujui_kepsek) e.disetujui_kepsek = "Pilih salah satu.";
    if (d.penerima.some(kosong)) e.penerima = "Isi semua nama yang ditugaskan.";
    else if (new Set(d.penerima).size !== d.penerima.length) e.penerima = "Ada nama yang sama dua kali.";
    if (!v.lampiran?.length) e.lampiran = "Dokumen lampiran wajib diunggah.";
  }

  if (v.jenis === "Surat Keterangan") {
    if (kosong(d.keperluan) || d.keperluan.trim().length < 5) e.keperluan = "Isi keperluan minimal 5 karakter.";
    if (kosong(d.catatan)) e.catatan = "Isi catatan / keterangan khusus.";
  }
  return e;
}

/** Baris [label, nilai] untuk ringkasan dan halaman detail. */
export function barisData(jenis, d = {}) {
  const L = FIELD_LABELS;
  if (jenis === "Surat Undangan") {
    return [
      [L.pemohon, d.pemohon], [L.unit, d.unit], [L.acara, d.acara], [L.tujuan, d.tujuan],
      [L.tanggal_acara, d.tanggal_acara ? fmtDate(d.tanggal_acara) : "-"], [L.waktu, d.waktu], [L.tempat, d.tempat],
    ];
  }
  if (jenis === "Surat Tugas") {
    const x = dataSiap(jenis, d);
    return [
      [L.pemohon, x.pemohon],
      [L.disetujui_kepsek, x.disetujui_kepsek === "ya" ? "Sudah disetujui" : "Belum disetujui"],
      [L.tipe, x.tipe === "kelompok" ? "Kelompok" : "Perorangan"],
      [L.penerima, x.penerima.join(", ")],
    ];
  }
  return [[L.pemohon, d.pemohon], [L.keperluan, d.keperluan], [L.catatan, d.catatan]];
}

function PilihNama({ id, value, onChange, guru, tendik }) {
  const semua = [...guru, ...tendik].map((p) => p.nama);
  if (!semua.length) {
    return <input id={id} value={value || ""} onChange={(e) => onChange(e.target.value)} placeholder="Ketik nama lengkap" className={input} />;
  }
  return (
    <select id={id} value={value || ""} onChange={(e) => onChange(e.target.value)} className={input}>
      <option value="">Pilih nama</option>
      {value && !semua.includes(value) && <option value={value}>{value}</option>}
      {guru.length > 0 && (
        <optgroup label="Guru">
          {guru.map((p, i) => <option key={`g${i}`} value={p.nama}>{p.nama}</option>)}
        </optgroup>
      )}
      {tendik.length > 0 && (
        <optgroup label="Tenaga Kependidikan">
          {tendik.map((p, i) => <option key={`t${i}`} value={p.nama}>{p.nama}</option>)}
        </optgroup>
      )}
    </select>
  );
}

function Pilihan({ name, value, onChange, opsi }) {
  return (
    <div className="flex flex-wrap gap-3">
      {opsi.map(([v, teks]) => (
        <label key={v} className={`flex cursor-pointer items-center gap-2 rounded-lg border px-4 py-2.5 text-sm ${value === v ? "border-primary bg-blue-50 font-semibold text-navy" : "border-line hover:bg-surface"}`}>
          <input type="radio" name={name} checked={value === v} onChange={() => onChange(v)} className="h-4 w-4 accent-[#0878d1]" />
          {teks}
        </label>
      ))}
    </div>
  );
}

export default function FormGuru({ values, onChange, errors = {}, notes = {}, showJenis = false }) {
  const { data: peg } = useFetch("/pegawai");
  const guru = peg?.guru || [];
  const tendik = peg?.tendik || [];

  const jenis = values.jenis;
  const raw = values.data || {};
  const d = dataSiap(jenis, raw);
  const set = (p) => onChange({ data: { ...raw, ...p } });
  const text = (k) => (e) => set({ [k]: e.target.value });

  const setTipe = (tipe) => set({ tipe, penerima: tipe === "perorangan" ? d.penerima.slice(0, 1) : d.penerima });
  const setNama = (i, v) => set({ tipe: d.tipe, penerima: d.penerima.map((x, j) => (j === i ? v : x)) });

  return (
    <div className="space-y-5">
      {showJenis && (
        <Field id="jenis" label="Jenis layanan" required error={errors.jenis} note={notes.jenis}>
          <select id="jenis" value={jenis} onChange={(e) => onChange({ jenis: e.target.value, data: {} })} className={input}>
            <option value="">Pilih jenis layanan</option>
            {JENIS_GURU.map((j) => <option key={j}>{j}</option>)}
          </select>
        </Field>
      )}

      <h3 className="text-sm font-bold uppercase tracking-wide text-slate-500">Data pemohon</h3>

      <Field id="pemohon" label="Nama pemohon" required error={errors.pemohon} note={notes.pemohon}>
        <PilihNama id="pemohon" value={d.pemohon} onChange={(v) => set({ pemohon: v })} guru={guru} tendik={tendik} />
      </Field>

      {jenis === "Surat Undangan" && (
        <>
          <Field id="unit" label="Bidang / unit kerja" required error={errors.unit} note={notes.unit}>
            <select id="unit" value={d.unit || ""} onChange={text("unit")} className={input}>
              <option value="">Pilih bidang / unit kerja</option>
              {UNIT_KERJA.map((u) => <option key={u}>{u}</option>)}
            </select>
          </Field>

          <h3 className="pt-2 text-sm font-bold uppercase tracking-wide text-slate-500">Detail undangan</h3>

          <Field id="acara" label="Acara undangan" required error={errors.acara} note={notes.acara}>
            <input id="acara" value={d.acara || ""} onChange={text("acara")} className={input} />
          </Field>
          <Field id="tujuan" label="Tujuan undangan" required error={errors.tujuan} note={notes.tujuan}>
            <input id="tujuan" value={d.tujuan || ""} onChange={text("tujuan")} className={input} />
          </Field>
          <div className="grid gap-5 sm:grid-cols-2">
            <Field id="tanggal_acara" label="Tanggal acara" required error={errors.tanggal_acara} note={notes.tanggal_acara}>
              <input id="tanggal_acara" type="date" value={d.tanggal_acara || ""} onChange={text("tanggal_acara")} className={input} />
            </Field>
            <Field id="waktu" label="Waktu acara" required error={errors.waktu} note={notes.waktu}>
              <input id="waktu" value={d.waktu || ""} onChange={text("waktu")} placeholder="Contoh: 08.00 - 12.00 WIB" className={input} />
            </Field>
          </div>
          <Field id="tempat" label="Tempat acara" required error={errors.tempat} note={notes.tempat}>
            <input id="tempat" value={d.tempat || ""} onChange={text("tempat")} className={input} />
          </Field>
        </>
      )}

      {jenis === "Surat Tugas" && (
        <>
          <Field id="kepsek" label="Apakah pengajuan ini telah mendapat persetujuan Kepala Sekolah?" required error={errors.disetujui_kepsek} note={notes.disetujui_kepsek}>
            <Pilihan name="kepsek" value={d.disetujui_kepsek} onChange={(v) => set({ disetujui_kepsek: v })} opsi={[["ya", "Ya"], ["tidak", "Tidak"]]} />
            {d.disetujui_kepsek === "tidak" && (
              <p className="mt-2 flex gap-2 rounded-lg border border-orange-200 bg-orange-50 px-3 py-2 text-sm text-orange-800">
                <ExclamationTriangleIcon className="mt-0.5 h-4 w-4 shrink-0" />
                Disarankan untuk konfirmasi/koordinasi dengan Kepala Sekolah terlebih dahulu sebelum mengajukan.
              </p>
            )}
          </Field>

          <h3 className="pt-2 text-sm font-bold uppercase tracking-wide text-slate-500">Detail surat tugas</h3>

          <Field id="tipe" label="Tipe penerima tugas" required>
            <Pilihan name="tipe" value={d.tipe} onChange={setTipe} opsi={[["perorangan", "Perorangan"], ["kelompok", "Kelompok"]]} />
          </Field>

          <Field id="penerima-0" label="Nama guru/tendik yang ditugaskan" required error={errors.penerima} note={notes.penerima}>
            <div className="space-y-2">
              {d.penerima.map((n, i) => (
                <div key={i} className="flex items-center gap-2">
                  <div className="flex-1">
                    <PilihNama id={`penerima-${i}`} value={n} onChange={(v) => setNama(i, v)} guru={guru} tendik={tendik} />
                  </div>
                  {d.tipe === "kelompok" && d.penerima.length > 1 && (
                    <button type="button" aria-label={`Hapus baris ${i + 1}`} onClick={() => set({ tipe: d.tipe, penerima: d.penerima.filter((_, j) => j !== i) })} className="rounded-lg p-2 text-slate-400 hover:bg-red-50 hover:text-red-600">
                      <TrashIcon className="h-5 w-5" />
                    </button>
                  )}
                </div>
              ))}
            </div>
            {d.tipe === "kelompok" && (
              <button type="button" onClick={() => set({ tipe: d.tipe, penerima: [...d.penerima, ""] })} className="mt-3 inline-flex items-center gap-1 text-sm font-semibold text-primary">
                <PlusIcon className="h-4 w-4" /> Tambah Nama Guru
              </button>
            )}
          </Field>

          <h3 className="pt-2 text-sm font-bold uppercase tracking-wide text-slate-500">Dokumen pendukung</h3>

          <Field id="lampiran" label="Upload surat undangan / keterangan kegiatan" required hint="Wajib. PDF, JPG, atau PNG." error={errors.lampiran} note={notes.lampiran}>
            <Upload files={values.lampiran} onChange={(lampiran) => onChange({ lampiran })} />
          </Field>
        </>
      )}

      {jenis === "Surat Keterangan" && (
        <>
          <Field id="keperluan" label="Keperluan / tujuan pembuatan surat" required error={errors.keperluan} note={notes.keperluan}>
            <input id="keperluan" value={d.keperluan || ""} onChange={text("keperluan")} className={input} />
          </Field>
          <Field id="catatan" label="Catatan / keterangan khusus" required error={errors.catatan} note={notes.catatan}>
            <textarea id="catatan" rows={3} value={d.catatan || ""} onChange={text("catatan")}
              className="w-full rounded-lg border border-line px-4 py-3 text-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20" />
          </Field>
        </>
      )}
    </div>
  );
}