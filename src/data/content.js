// Semua isi contoh ada di sini supaya mudah diganti.
// Isi yang belum dikonfirmasi sekolah ditandai dengan tanda kurung siku.

export const CONTACT = {
  alamat:
    "Jalan H. Taiman Barat, Kelurahan Gedong, Kecamatan Pasar Rebo, Kode Pos 13760, Jakarta Timur",
  telp: "(021) 8408247",
  email: "infosman104@gmail.com",
  jam: "06.30 - 15.00 WIB",
};

// Lima menu layanan sesuai revisi sekolah. Deskripsi sengaja dikosongkan dulu.
export const SERVICES = [
  { slug: "anggaran", title: "Anggaran" },
  { slug: "aset", title: "Aset" },
  { slug: "kepegawaian", title: "Kepegawaian" },
  { slug: "administrasi-persuratan", title: "Administrasi & Persuratan" },
  { slug: "kebersihan-keamanan", title: "Kebersihan & Keamanan" },
];

export const STEPS = [
  { n: "01", title: "Masuk ke akun", desc: "Gunakan akun yang dibuat dan dikelola oleh Tata Usaha." },
  {
    n: "02",
    title: "Pilih layanan & isi formulir",
    desc: "Lengkapi data dan unggah dokumen yang diperlukan.",
    to: "/ajukan",
    linkLabel: "Lihat tampilan formulir",
  },
  { n: "03", title: "Pantau status pengajuan", desc: "Lihat perkembangan proses pengajuan Anda." },
  { n: "04", title: "Ambil atau unduh hasil", desc: "Hasil diberikan sesuai ketentuan Tata Usaha." },
];

// Contoh saja, bukan pengumuman resmi.
export const ANNOUNCEMENTS = [
  { tag: "Layanan", date: "20 Oktober 2026", title: "Contoh pengumuman layanan Tata Usaha", excerpt: "Isi pengumuman contoh untuk menampilkan tata letak kartu pengumuman." },
  { tag: "Informasi", date: "15 Oktober 2026", title: "Contoh pengumuman informasi umum", excerpt: "Isi pengumuman contoh. Pengumuman asli akan dikelola Staf TU lewat sistem." },
  { tag: "Pembaruan", date: "8 Oktober 2026", title: "Contoh pengumuman pembaruan sistem", excerpt: "Isi pengumuman contoh yang menjelaskan fitur baru pada portal layanan." },
];

export const STATUS_STYLE = {
  Menunggu: "bg-amber-50 text-amber-700 border-amber-200",
  Diverifikasi: "bg-blue-50 text-blue-700 border-blue-200",
  "Perlu Perbaikan": "bg-orange-50 text-orange-700 border-orange-200",
  Disetujui: "bg-green-50 text-green-700 border-green-200",
  Ditolak: "bg-red-50 text-red-700 border-red-200",
  Selesai: "bg-emerald-50 text-emerald-700 border-emerald-200",
};

/* ===== Akun dan hak akses (mode demo) ===== */
export const ROLES = [
  { id: "siswa", label: "Siswa/Orang Tua", idLabel: "NIS", name: "Siswa Demo" },
  { id: "guru", label: "Guru/Staf", idLabel: "NIP / Username", name: "Guru Demo" },
  { id: "tu", label: "Staf TU", idLabel: "Username", name: "Petugas TU Demo" },
];

// Usulan hak akses per peran. Teks = tersedia (isinya keterangan singkat), null = tidak tersedia.
// Menunggu konfirmasi sekolah.
export const ACCESS = {
  siswa: {
    anggaran: null,
    aset: null,
    kepegawaian: "Lihat daftar guru dan tenaga kependidikan",
    "administrasi-persuratan": "Ajukan layanan dan pantau status",
    "kebersihan-keamanan": null,
  },
  guru: {
    anggaran: null,
    aset: "Lihat aset dan ajukan peminjaman",
    kepegawaian: "Lihat daftar guru dan tenaga kependidikan",
    "administrasi-persuratan": "Ajukan layanan dan pantau status",
    "kebersihan-keamanan": null,
  },
  tu: {
    anggaran: "Akses petugas",
    aset: "Kelola aset dan peminjaman",
    kepegawaian: "Kelola data pegawai",
    "administrasi-persuratan": "Proses pengajuan dan arsip surat",
    "kebersihan-keamanan": "Akses petugas",
  },
};

/* ===== Formulir pengajuan ===== */
// Contoh jenis layanan, menunggu konfirmasi Tata Usaha.
export const JENIS_SURAT = ["Surat Keterangan", "Surat Tugas", "Surat Dispensasi", "Surat Lainnya"];

export const FIELD_LABELS = {
  jenis: "Jenis layanan",
  perihal: "Perihal / keperluan",
  tanggal: "Tanggal dibutuhkan",
  keterangan: "Keterangan tambahan",
  lampiran: "Lampiran",
};

// Data dummy (semua fiktif) supaya alur bisa dicoba.
export const SEED_REQUESTS = [
  {
    id: "TU-2026-00128",
    jenis: "Surat Keterangan",
    perihal: "Surat keterangan untuk pengurusan administrasi beasiswa",
    tanggal: "2026-11-05",
    keterangan: "",
    lampiran: ["formulir-beasiswa.pdf"],
    pemohon: "Siswa Demo",
    ownerRole: "siswa",
    status: "Diverifikasi",
    fieldNotes: {},
    revisi: 0,
    history: [
      { label: "Diajukan", status: "Menunggu", time: "12 Okt 2026, 09:14", by: "Siswa Demo", note: "" },
      { label: "Diverifikasi", status: "Diverifikasi", time: "13 Okt 2026, 10:02", by: "Petugas TU Demo", note: "Berkas sudah lengkap." },
    ],
  },
  {
    id: "TU-2026-00131",
    jenis: "Surat Dispensasi",
    perihal: "Dispensasi mengikuti kegiatan di luar sekolah",
    tanggal: "2026-11-10",
    keterangan: "Kegiatan berlangsung dua hari.",
    lampiran: ["surat-undangan.pdf"],
    pemohon: "Guru Demo",
    ownerRole: "guru",
    status: "Menunggu",
    fieldNotes: {},
    revisi: 0,
    history: [{ label: "Diajukan", status: "Menunggu", time: "14 Okt 2026, 13:40", by: "Guru Demo", note: "" }],
  },
  {
    id: "TU-2026-00119",
    jenis: "Surat Keterangan",
    perihal: "Surat keterangan aktif bersekolah",
    tanggal: "2026-10-08",
    keterangan: "",
    lampiran: [],
    pemohon: "Siswa Demo",
    ownerRole: "siswa",
    status: "Selesai",
    fieldNotes: {},
    revisi: 0,
    history: [
      { label: "Diajukan", status: "Menunggu", time: "5 Okt 2026, 08:30", by: "Siswa Demo", note: "" },
      { label: "Diverifikasi", status: "Diverifikasi", time: "5 Okt 2026, 11:15", by: "Petugas TU Demo", note: "" },
      { label: "Disetujui", status: "Disetujui", time: "6 Okt 2026, 09:00", by: "Petugas TU Demo", note: "" },
      { label: "Selesai", status: "Selesai", time: "6 Okt 2026, 13:20", by: "Petugas TU Demo", note: "Surat dapat diambil di Tata Usaha." },
    ],
  },
  {
    id: "TU-2026-00124",
    jenis: "Surat Tugas",
    perihal: "Surat",
    tanggal: "2026-11-03",
    keterangan: "",
    lampiran: [],
    pemohon: "Siswa Demo",
    ownerRole: "siswa",
    status: "Perlu Perbaikan",
    fieldNotes: {
      perihal: "Perihal terlalu singkat. Tuliskan untuk keperluan apa surat ini dibuat.",
      lampiran: "Lampirkan dokumen pendukung dalam bentuk PDF atau JPG.",
    },
    revisi: 0,
    history: [
      { label: "Diajukan", status: "Menunggu", time: "16 Okt 2026, 08:45", by: "Siswa Demo", note: "" },
      {
        label: "Perlu Perbaikan",
        status: "Perlu Perbaikan",
        time: "17 Okt 2026, 09:30",
        by: "Petugas TU Demo",
        note: "Isian belum sesuai. Mohon diperbaiki sesuai catatan pada kolom yang ditandai, lalu kirim ulang.",
        fieldNotes: {
          perihal: "Perihal terlalu singkat. Tuliskan untuk keperluan apa surat ini dibuat.",
          lampiran: "Lampirkan dokumen pendukung dalam bentuk PDF atau JPG.",
        },
      },
    ],
  },
];
