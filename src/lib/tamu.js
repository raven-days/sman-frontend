export const HUBUNGAN = [
  ["siswa", "Siswa"],
  ["orang_tua", "Orang tua / wali"],
  ["alumni", "Alumni"],
  ["eksternal", "Pihak eksternal"],
];

export const AKSES = {
  guest: { label: "Tanpa akun", cls: "bg-green-50 text-green-700 border-green-200" },
  login: { label: "Perlu akun", cls: "bg-blue-50 text-blue-700 border-blue-200" },
  manual: { label: "Verifikasi manual", cls: "bg-amber-50 text-amber-700 border-amber-200" },
};

/** Baris [label, nilai] data pemohon tamu untuk halaman petugas. */
export function barisTamu(d = {}) {
  const h = Object.fromEntries(HUBUNGAN);
  return [
    ["Nama pemohon", d.pemohon_nama || "-"],
    ["WhatsApp", d.pemohon_wa || "-"],
    ["Hubungan", h[d.hubungan] || "-"],
    ["NIS (bila ada)", d.nis || "-"],
  ];
}