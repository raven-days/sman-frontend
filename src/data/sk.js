// Daftar Surat Keputusan (SK).
//
// Cara menambah SK asli:
// 1. Taruh file PDF di folder  public/sk/   (contoh: public/sk/sk-001-2026.pdf)
// 2. Tambahkan satu baris di bawah dengan  file: "/sk/sk-001-2026.pdf"
// 3. Hapus baris contoh (yang bertanda contoh: true)
export const SK_LIST = [
  {
    id: 1,
    nomor: "[Nomor SK]",
    tentang: "Contoh judul SK, akan diganti setelah file dari sekolah diterima",
    tahun: 2026,
    kategori: "Contoh",
    file: null,
    contoh: true,
  },
  {
    id: 2,
    nomor: "[Nomor SK]",
    tentang: "Contoh judul SK kedua",
    tahun: 2026,
    kategori: "Contoh",
    file: null,
    contoh: true,
  },
  {
    id: 3,
    nomor: "[Nomor SK]",
    tentang: "Contoh judul SK tahun sebelumnya",
    tahun: 2025,
    kategori: "Contoh",
    file: null,
    contoh: true,
  },
];
