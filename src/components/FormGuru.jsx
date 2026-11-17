import { useEffect, useId, useRef, useState } from "react";
import {
  PlusIcon, TrashIcon, ExclamationTriangleIcon, MagnifyingGlassIcon, CheckCircleIcon,
} from "@heroicons/react/24/outline";
import { api, useFetch } from "../lib/api";
import { useApp } from "../context/AppState";
import { JENIS_FORM, UNIT_KERJA, FIELD_LABELS } from "../data/content";
import { fmtDate } from "../lib/format";
import { Field, Upload, input } from "./RequestForm";

const kosong = (x) => !x || !String(x).trim();
const NIS_OK = /^[A-Za-z0-9.\-]+$/;

const LABEL_LAMPIRAN = {
  "guru|Surat Tugas": "Upload surat undangan / keterangan kegiatan",
  "guru|SK & SOP": "Upload draft SK dan/atau SOP",
  "siswa|Surat Tugas": "Upload surat undangan / keterangan kegiatan / flyer / proposal",
};

/** Isi bawaan dan pembersihan data sebelum divalidasi atau dikirim. */
export function dataSiap(jenis, d = {}) {
  const x = { ...d };
  if (jenis === "Surat Tugas") {
    x.tipe = x.tipe || "perorangan";
    let p = (x.penerima?.length ? x.penerima : [""]).map((n) => String(n).trim());
    if (x.tipe === "perorangan") p = p.slice(0, 1);
    x.penerima = p;
  }
  [["tahu_pembina", "nama_pembina"], ["tahu_wakasis", "nama_wakasis"], ["sudah_bertemu", "nama_wakaka"]].forEach(([k, n]) => {
    if (x[k] !== "ya") delete x[n];
  });
  return x;
}

/** Tempel data ke FormData sebagai data[kunci] dan data[kunci][]. */
export function tambahData(fd, d) {
  Object.entries(d).forEach(([k, v]) => {
    if (Array.isArray(v)) v.forEach((x) => fd.append(`data[${k}][]`, x));
    else if (v !== undefined && v !== null) fd.append(`data[${k}]`, v);
  });
}

export function validateGuru(v, role) {
  const e = {};
  const jenis = v.jenis;
  if (!JENIS_FORM[role]?.includes(jenis)) return { jenis: "Pilih jenis layanan." };
  const d = dataSiap(jenis, v.data || {});
  const wajib = (k, pesan) => { if (kosong(d[k])) e[k] = pesan; };
  const pilih = (k, pesan = "Pilih salah satu.") => { if (!d[k]) e[k] = pesan; };
  const nama = (kunciYa, kunciNama, pesan) => { if (d[kunciYa] === "ya" && kosong(d[kunciNama])) e[kunciNama] = pesan; };
  const keperluan = () => { if (kosong(d.keperluan) || d.keperluan.trim().length < 5) e.keperluan = "Isi keperluan minimal 5 karakter."; };
  const lampiran = () => { if (!v.lampiran?.length) e.lampiran = "Dokumen lampiran wajib diunggah."; };

  if (role === "guru") {
    wajib("pemohon", "Isi nama pemohon.");

    if (jenis === "Surat Undangan") {
      if (!UNIT_KERJA.includes(d.unit)) e.unit = "Pilih bidang / unit kerja.";
      wajib("acara", "Isi acara undangan.");
      wajib("tujuan", "Isi tujuan undangan.");
      wajib("tanggal_acara", "Pilih tanggal acara.");
      wajib("waktu", "Isi waktu acara.");
      wajib("tempat", "Isi tempat acara.");
    }
    if (jenis === "Surat Tugas") {
      pilih("disetujui_kepsek");
      if (d.penerima.some(kosong)) e.penerima = "Isi semua nama yang ditugaskan.";
      else if (new Set(d.penerima).size !== d.penerima.length) e.penerima = "Ada nama yang sama dua kali.";
      lampiran();
    }
    if (jenis === "Surat Keterangan") keperluan();
    if (jenis === "SK & SOP") {
      if (!UNIT_KERJA.includes(d.unit)) e.unit = "Pilih bidang / unit kerja.";
      wajib("nama_dokumen", "Isi nama SK dan/atau SOP.");
      lampiran();
    }
    return e;
  }

  // siswa
  const cekNis = () => {
    if (kosong(d.nis)) e.nis = "Isi NIS. Ketik nama atau NIS untuk mencari.";
    else if (!NIS_OK.test(d.nis.trim())) e.nis = "NIS hanya boleh berisi huruf, angka, titik, dan strip.";
  };

  if (jenis === "Surat Tugas") {
    wajib("pemohon", "Isi nama pemohon.");
    cekNis();
    pilih("tahu_pembina");
    nama("tahu_pembina", "nama_pembina", "Sebutkan nama pembina.");
    pilih("tahu_wakasis");
    nama("tahu_wakasis", "nama_wakasis", "Sebutkan nama Wakil Bidang Kesiswaan & Humas.");
    if (d.penerima.some(kosong)) e.penerima = "Isi semua NIS yang ditugaskan.";
    else if (d.penerima.some((n) => !NIS_OK.test(n))) e.penerima = "Ada NIS yang formatnya tidak valid.";
    else if (new Set(d.penerima).size !== d.penerima.length) e.penerima = "Ada NIS yang sama dua kali.";
    wajib("kegiatan", "Isi nama kegiatan.");
    wajib("penyelenggara", "Isi penyelenggara.");
    wajib("tanggal_kegiatan", "Pilih tanggal kegiatan.");
    wajib("tempat", "Isi tempat kegiatan.");
    lampiran();
  }
  if (jenis === "Surat Keterangan") {
    cekNis();
    keperluan();
  }
  if (jenis === "Surat Keterangan Peringkat") {
    wajib("pemohon", "Isi nama pemohon.");
    cekNis();
    pilih("sudah_bertemu");
    nama("sudah_bertemu", "nama_wakaka", "Sebutkan nama Wakil Bidang Akademik.");
    keperluan();
  }
  return e;
}

const jawab = (v, nama) => (v === "ya" ? `Ya${nama ? ` (${nama})` : ""}` : v === "tidak" ? "Belum" : "-");

/** Baris [label, nilai] untuk ringkasan dan halaman detail. */
export function barisData(jenis, d = {}, role = "guru") {
  const L = FIELD_LABELS;
  const x = dataSiap(jenis, d);
  const penerima = (x.penerima_info?.length ? x.penerima_info : x.penerima || []).join("; ");

  if (role === "siswa") {
    const nis = x.nis ? `${x.nis}${x.terdata === false ? " (tidak ada di data siswa)" : x.kelas ? ` · ${x.kelas}` : ""}` : "-";
    if (jenis === "Surat Tugas") {
      return [
        [L.pemohon, x.pemohon], [L.nis, nis],
        [L.tahu_pembina, jawab(x.tahu_pembina, x.nama_pembina)],
        [L.tahu_wakasis, jawab(x.tahu_wakasis, x.nama_wakasis)],
        [L.tipe, x.tipe === "kelompok" ? "Kelompok" : "Perorangan"],
        ["NIS yang ditugaskan", penerima],
        [L.kegiatan, x.kegiatan], [L.penyelenggara, x.penyelenggara],
        [L.tanggal_kegiatan, x.tanggal_kegiatan ? fmtDate(x.tanggal_kegiatan) : "-"],
        ["Tempat kegiatan", x.tempat],
      ];
    }
    if (jenis === "Surat Keterangan") {
      return [[L.pemohon, x.pemohon || "-"], [L.nis, nis], [L.keperluan, x.keperluan], [L.catatan, x.catatan || "-"]];
    }
    return [
      [L.pemohon, x.pemohon], [L.nis, nis],
      [L.sudah_bertemu, jawab(x.sudah_bertemu, x.nama_wakaka)],
      [L.keperluan, x.keperluan],
    ];
  }

  if (jenis === "Surat Undangan") {
    return [
      [L.pemohon, x.pemohon], [L.unit, x.unit], [L.acara, x.acara], [L.tujuan, x.tujuan],
      [L.tanggal_acara, x.tanggal_acara ? fmtDate(x.tanggal_acara) : "-"], [L.waktu, x.waktu], ["Tempat acara", x.tempat],
    ];
  }
  if (jenis === "Surat Tugas") {
    return [
      [L.pemohon, x.pemohon],
      [L.disetujui_kepsek, x.disetujui_kepsek === "ya" ? "Sudah disetujui" : "Belum disetujui"],
      [L.tipe, x.tipe === "kelompok" ? "Kelompok" : "Perorangan"],
      [L.penerima, penerima],
    ];
  }
  if (jenis === "SK & SOP") {
    return [[L.pemohon, x.pemohon], [L.unit, x.unit], [L.nama_dokumen, x.nama_dokumen]];
  }
  return [[L.pemohon, x.pemohon], [L.keperluan, x.keperluan], [L.catatan, x.catatan || "-"]];
}

/* ---------- komponen kecil ---------- */

function Peringatan({ children }) {
  return (
    <p className="mt-2 flex gap-2 rounded-lg border border-orange-200 bg-orange-50 px-3 py-2 text-sm text-orange-800">
      <ExclamationTriangleIcon className="mt-0.5 h-4 w-4 shrink-0" />
      {children}
    </p>
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

/** Pilihan Ya/Tidak. "Ya" memunculkan kolom nama, "Tidak" memunculkan peringatan halus. */
function YaTidak({ id, label, nilai, onNilai, nama, onNama, labelNama, peringatan, error, errorNama, note }) {
  return (
    <Field id={id} label={label} required error={error} note={note}>
      <Pilihan name={id} value={nilai} onChange={onNilai} opsi={[["ya", "Ya"], ["tidak", "Tidak"]]} />
      {nilai === "ya" && (
        <div className="mt-3">
          <label htmlFor={`${id}-nama`} className="mb-1.5 block text-sm font-semibold text-navy">
            {labelNama}<span className="text-red-600"> *</span>
          </label>
          <input id={`${id}-nama`} value={nama || ""} onChange={(e) => onNama(e.target.value)} className={input} />
          {errorNama && <p role="alert" className="mt-1 text-xs font-medium text-red-600">{errorNama}</p>}
        </div>
      )}
      {nilai === "tidak" && <Peringatan>{peringatan}</Peringatan>}
    </Field>
  );
}

/** Nama guru/tendik: pilih dari daftar ATAU ketik sendiri (untuk yang belum terdata). */
function IsianNama({ id, value, onChange, guru, tendik }) {
  const daftar = useId();
  return (
    <>
      <input
        id={id}
        list={daftar}
        value={value || ""}
        onChange={(e) => onChange(e.target.value)}
        placeholder="Pilih dari daftar atau ketik nama lengkap"
        autoComplete="off"
        className={input}
      />
      <datalist id={daftar}>
        {guru.map((p, i) => <option key={`g${i}`} value={p.nama} label={`Guru${p.jabatan ? ` · ${p.jabatan}` : ""}`} />)}
        {tendik.map((p, i) => <option key={`t${i}`} value={p.nama} label={`Tendik${p.jabatan ? ` · ${p.jabatan}` : ""}`} />)}
      </datalist>
    </>
  );
}

/** Kolom NIS dengan pencarian: ketik nama atau NIS, pilih dari hasil. */
function CariSiswa({ id, value, onChange, onPilih, label }) {
  const { user } = useApp();
  const [hasil, setHasil] = useState([]);
  const [buka, setBuka] = useState(false);
  const [aktif, setAktif] = useState(-1);
  const [memuat, setMemuat] = useState(false);
  const [dicari, setDicari] = useState(false);
  const kotak = useRef(null);
  const q = String(value || "").trim();

  useEffect(() => {
    setDicari(false);
    if (!user || q.length < 3) { setHasil([]); return undefined; }
    let batal = false;
    setMemuat(true);
    const t = setTimeout(() => {
      api(`/siswa/cari?q=${encodeURIComponent(q)}`)
        .then((d) => { if (!batal) { setHasil(d); setAktif(-1); setDicari(true); } })
        .catch(() => { if (!batal) setHasil([]); })
        .finally(() => { if (!batal) setMemuat(false); });
    }, 300);
    return () => { batal = true; clearTimeout(t); };
  }, [q, user]);

  const pilih = (s) => { onPilih(s); setBuka(false); setHasil([]); };

  const tombol = (e) => {
    if (!buka || !hasil.length) return;
    if (e.key === "ArrowDown") { e.preventDefault(); setAktif((a) => (a + 1) % hasil.length); }
    else if (e.key === "ArrowUp") { e.preventDefault(); setAktif((a) => (a <= 0 ? hasil.length - 1 : a - 1)); }
    else if (e.key === "Enter" && aktif >= 0) { e.preventDefault(); pilih(hasil[aktif]); }
    else if (e.key === "Escape") setBuka(false);
  };

  if (!user) {
    return (
      <>
        <input id={id} value={value || ""} onChange={(e) => onChange(e.target.value)} placeholder="Masukkan NIS" className={input} />
        <p className="mt-1 text-xs text-slate-500">Masuk ke akun untuk memakai pencarian NIS.</p>
      </>
    );
  }

  return (
    <div
      ref={kotak}
      className="relative"
      onBlur={(e) => { if (!kotak.current?.contains(e.relatedTarget)) setBuka(false); }}
    >
      <MagnifyingGlassIcon className="pointer-events-none absolute left-3.5 top-3.5 h-5 w-5 text-slate-400" />
      <input
        id={id}
        role="combobox"
        aria-expanded={buka && (hasil.length > 0 || dicari)}
        aria-controls={`${id}-hasil`}
        aria-autocomplete="list"
        autoComplete="off"
        value={value || ""}
        onChange={(e) => { onChange(e.target.value); setBuka(true); }}
        onFocus={() => setBuka(true)}
        onKeyDown={tombol}
        placeholder="Ketik nama atau NIS untuk mencari"
        className={`${input} pl-11`}
      />
      {buka && q.length >= 3 && (
        <ul id={`${id}-hasil`} role="listbox" className="absolute z-20 mt-1 max-h-72 w-full overflow-auto rounded-lg border border-line bg-white shadow-lg">
          {memuat && hasil.length === 0 && <li className="px-4 py-3 text-sm text-slate-500">Mencari...</li>}
          {!memuat && dicari && hasil.length === 0 && (
            <li className="px-4 py-3 text-sm text-slate-500">Tidak ditemukan. Anda tetap bisa mengetik NIS sendiri.</li>
          )}
          {hasil.map((s, i) => (
            <li
              key={s.nis}
              role="option"
              aria-selected={i === aktif}
              onMouseDown={(e) => { e.preventDefault(); pilih(s); }}
              onMouseEnter={() => setAktif(i)}
              className={`cursor-pointer px-4 py-2.5 text-sm ${i === aktif ? "bg-blue-50" : ""}`}
            >
              <span className="block font-semibold text-navy">{s.nama}</span>
              <span className="block text-xs text-slate-500">NIS {s.nis}{s.kelas ? ` · Kelas ${s.kelas}` : ""}</span>
            </li>
          ))}
        </ul>
      )}
      {label && (
        <p className="mt-1.5 flex items-center gap-1 text-xs font-medium text-green-700">
          <CheckCircleIcon className="h-4 w-4" /> {label}
        </p>
      )}
    </div>
  );
}

/* ---------- form utama ---------- */

export default function FormGuru({ values, onChange, errors = {}, notes = {}, showJenis = false, role = "guru" }) {
  const { data: peg } = useFetch(role === "guru" ? "/pegawai" : null);
  const [info, setInfo] = useState({}); // NIS -> "Nama · Kelas" (hanya untuk tampilan)
  const guru = peg?.guru || [];
  const tendik = peg?.tendik || [];

  const jenis = values.jenis;
  const raw = values.data || {};
  const d = dataSiap(jenis, raw);
  const set = (p) => onChange({ data: { ...raw, ...p } });
  const text = (k) => (e) => set({ [k]: e.target.value });
  const labelSiswa = (s) => `${s.nama}${s.kelas ? ` · Kelas ${s.kelas}` : ""}`;

  const setTipe = (tipe) => set({ tipe, penerima: tipe === "perorangan" ? d.penerima.slice(0, 1) : d.penerima });
  const setNama = (i, v) => set({ tipe: d.tipe, penerima: d.penerima.map((x, j) => (j === i ? v : x)) });
  const pilihPemohon = (s) => {
    setInfo((x) => ({ ...x, [s.nis]: labelSiswa(s) }));
    set({ nis: s.nis, pemohon: s.nama });
  };
  const pilihPenerima = (i) => (s) => {
    setInfo((x) => ({ ...x, [s.nis]: labelSiswa(s) }));
    setNama(i, s.nis);
  };

  const lampiranLabel = LABEL_LAMPIRAN[`${role}|${jenis}`];

  const BlokLampiran = () => (
    <>
      <h3 className="pt-2 text-sm font-bold uppercase tracking-wide text-slate-500">Dokumen pendukung</h3>
      <Field id="lampiran" label={lampiranLabel} required hint="Wajib. PDF, JPG, atau PNG." error={errors.lampiran} note={notes.lampiran}>
        <Upload files={values.lampiran} onChange={(lampiran) => onChange({ lampiran })} />
      </Field>
    </>
  );

  const Pemohon = () => (
    <Field id="pemohon" label="Nama pemohon" required error={errors.pemohon} note={notes.pemohon}
      hint="Pilih dari daftar, atau ketik sendiri jika nama Anda belum terdata.">
      <IsianNama id="pemohon" value={d.pemohon} onChange={(v) => set({ pemohon: v })} guru={guru} tendik={tendik} />
    </Field>
  );

  const PemohonSiswa = () => (
    <>
      <Field id="nis" label="NIS pemohon" required error={errors.nis} note={notes.nis}
        hint="Ketik nama atau NIS, lalu pilih dari daftar. Nama akan terisi otomatis.">
        <CariSiswa id="nis" value={d.nis} onChange={(v) => set({ nis: v })} onPilih={pilihPemohon} label={info[d.nis]} />
      </Field>
      <Field id="pemohon" label="Nama pemohon" required error={errors.pemohon} note={notes.pemohon}>
        <input id="pemohon" value={d.pemohon || ""} onChange={text("pemohon")} className={input} />
      </Field>
    </>
  );

  return (
    <div className="space-y-5">
      {showJenis && (
        <Field id="jenis" label="Jenis layanan" required error={errors.jenis} note={notes.jenis}>
          <select id="jenis" value={jenis} onChange={(e) => onChange({ jenis: e.target.value, data: {} })} className={input}>
            <option value="">Pilih jenis layanan</option>
            {(JENIS_FORM[role] || []).map((j) => <option key={j}>{j}</option>)}
          </select>
        </Field>
      )}

      {/* ===== GURU / TENDIK ===== */}
      {role === "guru" && (
        <>
          <h3 className="text-sm font-bold uppercase tracking-wide text-slate-500">Data pemohon</h3>
          {Pemohon()}

          {(jenis === "Surat Undangan" || jenis === "SK & SOP") && (
            <Field id="unit" label="Bidang / unit kerja" required error={errors.unit} note={notes.unit}>
              <select id="unit" value={d.unit || ""} onChange={text("unit")} className={input}>
                <option value="">Pilih bidang / unit kerja</option>
                {UNIT_KERJA.map((u) => <option key={u}>{u}</option>)}
              </select>
            </Field>
          )}

          {jenis === "Surat Undangan" && (
            <>
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
                  <Peringatan>Disarankan untuk konfirmasi/koordinasi dengan Kepala Sekolah terlebih dahulu sebelum mengajukan.</Peringatan>
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
                        <IsianNama id={`penerima-${i}`} value={n} onChange={(v) => setNama(i, v)} guru={guru} tendik={tendik} />
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
              {BlokLampiran()}
            </>
          )}

          {jenis === "Surat Keterangan" && (
            <>
              <Field id="keperluan" label="Keperluan / tujuan pembuatan surat" required error={errors.keperluan} note={notes.keperluan}>
                <input id="keperluan" value={d.keperluan || ""} onChange={text("keperluan")} className={input} />
              </Field>
              <Field id="catatan" label="Catatan / keterangan khusus" hint="Tidak wajib diisi." error={errors.catatan} note={notes.catatan}>
                <textarea id="catatan" rows={3} value={d.catatan || ""} onChange={text("catatan")}
                  className="w-full rounded-lg border border-line px-4 py-3 text-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20" />
              </Field>
            </>
          )}

          {jenis === "SK & SOP" && (
            <>
              <h3 className="pt-2 text-sm font-bold uppercase tracking-wide text-slate-500">Detail pengajuan</h3>
              <Field id="nama_dokumen" label="Nama SK dan/atau SOP" required error={errors.nama_dokumen} note={notes.nama_dokumen}>
                <input id="nama_dokumen" value={d.nama_dokumen || ""} onChange={text("nama_dokumen")} className={input} />
              </Field>
                {BlokLampiran()}
            </>
          )}
        </>
      )}

      {/* ===== SISWA / ORANG TUA ===== */}
      {role === "siswa" && (
        <>
          <h3 className="text-sm font-bold uppercase tracking-wide text-slate-500">Data pemohon</h3>


          {jenis === "Surat Keterangan" ? (
            <>
              <Field id="nis" label="NIS pemohon" required error={errors.nis} note={notes.nis}
                hint="Ketik nama atau NIS, lalu pilih dari daftar.">
                <CariSiswa
                  id="nis"
                  value={d.nis}
                  onChange={(v) => set({ nis: v })}
                  onPilih={pilihPemohon}
                  label={info[d.nis]}
                />
              </Field>

              <Field id="keperluan" label="Keperluan / tujuan pembuatan surat" required error={errors.keperluan} note={notes.keperluan}>
                <input
                  id="keperluan"
                  value={d.keperluan || ""}
                  onChange={text("keperluan")}
                  className={input}
                />
              </Field>

              <Field id="catatan" label="Catatan / keterangan khusus" hint="Tidak wajib diisi." error={errors.catatan} note={notes.catatan}>
                <textarea
                  id="catatan"
                  rows={3}
                  value={d.catatan || ""}
                  onChange={text("catatan")}
                  className="w-full rounded-lg border border-line px-4 py-3 text-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                />
              </Field>
            </>
          ) : (
            PemohonSiswa()
          )}


          {jenis === "Surat Tugas" && (
            <>
              <YaTidak
                id="pembina" label="Apakah pengajuan ini telah diketahui oleh pembina ekstrakurikuler?"
                nilai={d.tahu_pembina} onNilai={(v) => set({ tahu_pembina: v })}
                nama={d.nama_pembina} onNama={(v) => set({ nama_pembina: v })} labelNama="Sebutkan nama pembina"
                peringatan="Disarankan untuk konfirmasi/koordinasi dengan pembina ekstrakurikuler terlebih dahulu sebelum mengajukan."
                error={errors.tahu_pembina} errorNama={errors.nama_pembina} note={notes.tahu_pembina}
              />
              <YaTidak
                id="wakasis" label="Apakah pengajuan ini telah diketahui oleh Wakil Bidang Kesiswaan & Humas?"
                nilai={d.tahu_wakasis} onNilai={(v) => set({ tahu_wakasis: v })}
                nama={d.nama_wakasis} onNama={(v) => set({ nama_wakasis: v })} labelNama="Sebutkan nama Wakil Bidang Kesiswaan & Humas"
                peringatan="Disarankan untuk konfirmasi/koordinasi dengan Wakil Bidang Kesiswaan & Humas terlebih dahulu sebelum mengajukan."
                error={errors.tahu_wakasis} errorNama={errors.nama_wakasis} note={notes.tahu_wakasis}
              />

              <h3 className="pt-2 text-sm font-bold uppercase tracking-wide text-slate-500">Detail surat tugas</h3>
              <Field id="tipe" label="Tipe penerima tugas" required>
                <Pilihan name="tipe" value={d.tipe} onChange={setTipe} opsi={[["perorangan", "Perorangan"], ["kelompok", "Kelompok"]]} />
              </Field>

              <Field id="penerima-0" label="NIS murid yang ditugaskan" required error={errors.penerima} note={notes.penerima}>
                <div className="space-y-3">
                  {d.penerima.map((n, i) => (
                    <div key={i} className="flex items-start gap-2">
                      <div className="flex-1">
                        <CariSiswa id={`penerima-${i}`} value={n} onChange={(v) => setNama(i, v)} onPilih={pilihPenerima(i)} label={info[n]} />
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
                    <PlusIcon className="h-4 w-4" /> Tambah NIS
                  </button>
                )}
              </Field>

              <h3 className="pt-2 text-sm font-bold uppercase tracking-wide text-slate-500">Detail kegiatan</h3>
              <Field id="kegiatan" label="Nama kegiatan" required error={errors.kegiatan} note={notes.kegiatan}>
                <input id="kegiatan" value={d.kegiatan || ""} onChange={text("kegiatan")} className={input} />
              </Field>
              <Field id="penyelenggara" label="Diselenggarakan oleh" required error={errors.penyelenggara} note={notes.penyelenggara}>
                <input id="penyelenggara" value={d.penyelenggara || ""} onChange={text("penyelenggara")} className={input} />
              </Field>
              <div className="grid gap-5 sm:grid-cols-2">
                <Field id="tanggal_kegiatan" label="Tanggal kegiatan" required error={errors.tanggal_kegiatan} note={notes.tanggal_kegiatan}>
                  <input id="tanggal_kegiatan" type="date" value={d.tanggal_kegiatan || ""} onChange={text("tanggal_kegiatan")} className={input} />
                </Field>
                <Field id="tempat" label="Tempat kegiatan" required error={errors.tempat} note={notes.tempat}>
                  <input id="tempat" value={d.tempat || ""} onChange={text("tempat")} className={input} />
                </Field>
              </div>
              {BlokLampiran()}
            </>
          )}

          {jenis === "Surat Keterangan Peringkat" && (
            <>
              <YaTidak
                id="akademik" label="Apakah sudah bertemu dengan Wakil Bidang Akademik?"
                nilai={d.sudah_bertemu} onNilai={(v) => set({ sudah_bertemu: v })}
                nama={d.nama_wakaka} onNama={(v) => set({ nama_wakaka: v })} labelNama="Sebutkan nama Wakil Bidang Akademik"
                peringatan="Disarankan untuk konfirmasi/koordinasi dengan Wakil Bidang Akademik terlebih dahulu sebelum mengajukan."
                error={errors.sudah_bertemu} errorNama={errors.nama_wakaka} note={notes.sudah_bertemu}
              />
              <Field id="keperluan" label="Keperluan / tujuan pembuatan surat" required error={errors.keperluan} note={notes.keperluan}>
                <input id="keperluan" value={d.keperluan || ""} onChange={text("keperluan")} className={input} />
              </Field>
            </>
          )}
        </>
      )}
    </div>
  );
}