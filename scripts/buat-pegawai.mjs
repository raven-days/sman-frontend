// Membaca data/Daftar_Nama_Tendik_Guru.xlsx -> menulis src/data/pegawai.js
// Jalankan: npm run pegawai   (otomatis juga saat npm run build)
import * as XLSX from "xlsx";
import fs from "node:fs";

const FILE = "data/Daftar_Nama_Tendik_Guru.xlsx";
const OUT = "src/data/pegawai.js";

const wb = XLSX.read(fs.readFileSync(FILE));
const bersih = (v) =>
  String(v ?? "")
    .replace(/\s+/g, " ")
    .trim();

function baca(kata) {
  const nama = wb.SheetNames.find((n) => n.toLowerCase().includes(kata));
  if (!nama)
    throw new Error(
      `Sheet berisi "${kata}" tidak ditemukan. Sheet yang ada: ${wb.SheetNames.join(", ")}`,
    );
  const rows = XLSX.utils.sheet_to_json(wb.Sheets[nama], {
    header: 1,
    defval: "",
  });
  const h = rows.findIndex((r) =>
    r.some((c) => bersih(c).toUpperCase() === "NAMA"),
  );
  if (h < 0) throw new Error(`Baris judul "NAMA" tidak ada di sheet "${nama}"`);
  const iNama = rows[h].findIndex((c) => bersih(c).toUpperCase() === "NAMA");
  const iJab = rows[h].findIndex((c) => bersih(c).toUpperCase() === "JABATAN");
  return rows
    .slice(h + 1)
    .map((r) => ({ nama: bersih(r[iNama]), jabatan: bersih(r[iJab]) }))
    .filter((p) => p.nama);
}

const tendik = baca("tendik");
const guru = baca("guru");
const isi =
  `// OTOMATIS dari ${FILE}. Jangan diedit manual; ubah Excel lalu jalankan: npm run pegawai\n\n` +
  `export const TENDIK = ${JSON.stringify(tendik, null, 2)};\n\n` +
  `export const GURU = ${JSON.stringify(guru, null, 2)};\n`;
fs.writeFileSync(OUT, isi);
console.log(`pegawai.js: ${tendik.length} tendik, ${guru.length} guru`);
